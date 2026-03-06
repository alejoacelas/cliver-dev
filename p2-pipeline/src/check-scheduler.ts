import type {
  CheckDeclaration,
  CheckOutcome,
  PipelineEvent,
  PipelineState,
  Decision,
  ICheckExecutor,
} from "@cliver/contracts";
import { CheckDependencyResolver } from "./dependency-resolver.js";
import { ConsentManager } from "./consent-manager.js";
import { AuditLogger } from "./audit-logger.js";
import { DecisionAggregator } from "./decision-aggregator.js";
import type { DecisionAggregatorOptions } from "./decision-aggregator.js";

export interface CheckSchedulerOptions {
  screeningId: string;
  declarations: CheckDeclaration[];
  executors: ICheckExecutor[];
  /** Consent timeout in milliseconds. If not set, consent never expires. */
  consentTimeoutMs?: number;
  /** Clock function for testability. Defaults to Date.now. */
  now?: () => number;
  /** Check IDs that should produce FLAG (not REVIEW) when they flag. Forwarded to DecisionAggregator. */
  flagCheckIds?: Set<string>;
  /** Map from checkId to human-readable criterion display name. Forwarded to DecisionAggregator. */
  criterionNames?: Map<string, string>;
}

type Listener = (event: PipelineEvent) => void;

/**
 * The core pipeline orchestrator. Drives the screening lifecycle:
 *
 *   field completed -> dependency check -> consent gating -> check execution -> decision
 *
 * This is event-driven: external code calls onFieldCompleted() and onConsent()
 * to advance the pipeline. The scheduler evaluates which checks can now run,
 * launches them in parallel, and aggregates results when all are done.
 */
export class CheckScheduler {
  private readonly screeningId: string;
  private readonly declarations: CheckDeclaration[];
  private readonly executorMap: Map<string, ICheckExecutor>;
  private readonly resolver = new CheckDependencyResolver();
  private readonly consentManager = new ConsentManager();
  private readonly auditLogger = new AuditLogger();
  private readonly aggregator: DecisionAggregator;
  private readonly consentTimeoutMs: number | undefined;
  private readonly now: () => number;

  // Pipeline state
  private status: PipelineState["status"] = "pending";
  private completedFields: Set<string> = new Set();
  private pendingChecks: string[];
  private runningChecks: string[] = [];
  private completedChecks: string[] = [];
  private outcomes: CheckOutcome[] = [];
  private consentState: Record<string, "pending" | "granted" | "denied" | "expired"> = {};
  private decision: Decision | null = null;
  private fieldValues: Record<string, unknown> = {};
  private readonly createdAt: string;
  private updatedAt: string;

  // Subscribers
  private listeners: Set<Listener> = new Set();

  // Track checks that are waiting for consent (fields met but consent pending)
  private consentWaitingChecks: Set<string> = new Set();

  // Mutex: serializes evaluateAndSchedule calls to prevent re-entry races
  private schedulingLock: Promise<void> = Promise.resolve();

  constructor(options: CheckSchedulerOptions) {
    this.screeningId = options.screeningId;
    this.declarations = options.declarations;
    this.consentTimeoutMs = options.consentTimeoutMs;
    this.now = options.now ?? (() => Date.now());
    this.aggregator = new DecisionAggregator({
      flagCheckIds: options.flagCheckIds,
      criterionNames: options.criterionNames,
    });

    // Build executor lookup
    this.executorMap = new Map();
    for (const executor of options.executors) {
      this.executorMap.set(executor.checkId, executor);
    }

    // All checks start as pending
    this.pendingChecks = options.declarations.map((d) => d.id);

    const now = new Date().toISOString();
    this.createdAt = now;
    this.updatedAt = now;
  }

  /**
   * Called when a form field is completed by the customer.
   * Triggers dependency resolution and may launch checks.
   */
  async onFieldCompleted(fieldId: string, value: unknown): Promise<void> {
    const isNew = !this.completedFields.has(fieldId);
    this.completedFields.add(fieldId);
    this.fieldValues[fieldId] = value;

    // Always emit the event (value may have changed), but only
    // re-trigger scheduling if a genuinely new field was added.
    await this.emitAndLog({
      type: "field_completed",
      screeningId: this.screeningId,
      timestamp: new Date(this.now()).toISOString(),
      fieldId,
      fieldValue: value,
    });

    if (!isNew) return;

    if (this.status === "pending") {
      this.status = "running";
    }

    await this.evaluateAndSchedule();
  }

  /**
   * Called when consent is granted for a check.
   */
  async onConsent(checkId: string): Promise<void> {
    await this.consentManager.consent(this.screeningId, checkId);
    this.consentState[checkId] = "granted";

    await this.emitAndLog({
      type: "consent_received",
      screeningId: this.screeningId,
      timestamp: new Date(this.now()).toISOString(),
      checkId,
      granted: true,
    });

    this.consentWaitingChecks.delete(checkId);
    await this.evaluateAndSchedule();
  }

  /**
   * Called when consent is denied for a check.
   * Marks the check as completed with undetermined status.
   */
  async onConsentDenied(checkId: string): Promise<void> {
    await this.consentManager.deny(this.screeningId, checkId);
    this.consentState[checkId] = "denied";

    await this.emitAndLog({
      type: "consent_received",
      screeningId: this.screeningId,
      timestamp: new Date(this.now()).toISOString(),
      checkId,
      granted: false,
    });

    this.consentWaitingChecks.delete(checkId);
    await this.markCheckSkipped(checkId, "Check skipped: consent denied.");
    await this.checkCompletion();
  }

  /**
   * Evaluate all pending consent requests for timeouts.
   * Called externally (e.g., on a timer tick or before state evaluation).
   */
  async evaluateTimeouts(): Promise<void> {
    if (!this.consentTimeoutMs) return;

    const now = this.now();
    const pendingCheckIds = this.consentManager.getPendingCheckIds(this.screeningId);

    for (const checkId of pendingCheckIds) {
      if (this.consentManager.isExpired(this.screeningId, checkId, this.consentTimeoutMs, now)) {
        this.consentManager.markExpired(this.screeningId, checkId);
        this.consentState[checkId] = "expired";
        this.consentWaitingChecks.delete(checkId);
        await this.markCheckSkipped(checkId, "Check skipped: consent expired.");
      }
    }

    await this.checkCompletion();
  }

  /**
   * Finalize the pipeline: marks all remaining pending checks as
   * undetermined ("Check skipped: form incomplete") and triggers
   * decision aggregation. Call this when no more fields will arrive.
   * No-op if the pipeline is already completed.
   */
  async finalize(): Promise<void> {
    if (this.status === "completed") return;

    // Mark any consent-waiting checks as skipped first
    for (const checkId of Array.from(this.consentWaitingChecks)) {
      this.consentWaitingChecks.delete(checkId);
      await this.markCheckSkipped(checkId, "Check skipped: form incomplete");
    }

    // Mark all remaining pending checks as skipped
    const remaining = [...this.pendingChecks];
    for (const checkId of remaining) {
      await this.markCheckSkipped(checkId, "Check skipped: form incomplete");
    }

    await this.checkCompletion();
  }

  /**
   * Get the current pipeline state.
   */
  getState(): PipelineState {
    return {
      screeningId: this.screeningId,
      status: this.status,
      completedFields: Array.from(this.completedFields),
      pendingChecks: [...this.pendingChecks],
      runningChecks: [...this.runningChecks],
      completedChecks: [...this.completedChecks],
      outcomes: [...this.outcomes],
      consentState: { ...this.consentState },
      decision: this.decision,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Subscribe to pipeline events.
   * @returns Unsubscribe function.
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get the full audit log.
   */
  getAuditLog(): PipelineEvent[] {
    return this.auditLogger.getAll();
  }

  // --- Internal methods ---

  /**
   * Serialized entry point: queues calls so only one
   * _evaluateAndSchedule runs at a time.
   */
  private evaluateAndSchedule(): Promise<void> {
    this.schedulingLock = this.schedulingLock.then(() => this._evaluateAndSchedule());
    return this.schedulingLock;
  }

  /**
   * Evaluate which checks are eligible and schedule them.
   * Handles both immediate execution and consent gating.
   */
  private async _evaluateAndSchedule(): Promise<void> {
    // Build the set of checks that should not be scheduled
    const runningOrCompleted = new Set([
      ...this.runningChecks,
      ...this.completedChecks,
      ...this.consentWaitingChecks,
    ]);

    // Find checks whose fields are met (ignoring consent for now)
    const consentedCheckIds = new Set<string>();
    for (const [checkId, status] of Object.entries(this.consentState)) {
      if (status === "granted") consentedCheckIds.add(checkId);
    }

    // First pass: find checks where all fields are met
    const allFieldsMet = this.declarations.filter((decl) => {
      if (runningOrCompleted.has(decl.id)) return false;
      return decl.requiredFields.every((f) => this.completedFields.has(f));
    });

    // Split into consent-needing and ready-to-run
    const needsConsentProposal: CheckDeclaration[] = [];
    const readyToRun: string[] = [];

    for (const decl of allFieldsMet) {
      if (decl.needsConsent && !consentedCheckIds.has(decl.id)) {
        // Only propose if not already waiting
        if (!this.consentWaitingChecks.has(decl.id)) {
          needsConsentProposal.push(decl);
        }
      } else {
        readyToRun.push(decl.id);
      }
    }

    // Propose consent for gated checks
    for (const decl of needsConsentProposal) {
      this.consentWaitingChecks.add(decl.id);
      this.consentState[decl.id] = "pending";

      const description = decl.description ?? `Run ${decl.name}`;
      // Always use the injected clock for the proposal timestamp so
      // timeout tracking works correctly with fake clocks in tests.
      this.consentManager.proposeAt(
        this.screeningId,
        decl.id,
        description,
        this.now(),
      );

      await this.emitAndLog({
        type: "consent_requested",
        screeningId: this.screeningId,
        timestamp: new Date(this.now()).toISOString(),
        checkId: decl.id,
        description,
      });
    }

    // Execute ready checks in parallel
    if (readyToRun.length > 0) {
      await this.executeChecks(readyToRun);
    }

    await this.checkCompletion();
  }

  /**
   * Execute a batch of checks in parallel using Promise.all.
   */
  private async executeChecks(checkIds: string[]): Promise<void> {
    // Move from pending to running
    for (const id of checkIds) {
      this.pendingChecks = this.pendingChecks.filter((c) => c !== id);
      this.runningChecks.push(id);
    }

    // Launch all checks in parallel
    const promises = checkIds.map((id) => this.executeOneCheck(id));
    await Promise.all(promises);
  }

  /**
   * Execute a single check, handling success and failure.
   */
  private async executeOneCheck(checkId: string): Promise<void> {
    // Always emit check_started first so the audit trail is
    // consistently check_started -> check_completed, even for errors.
    await this.emitAndLog({
      type: "check_started",
      screeningId: this.screeningId,
      timestamp: new Date(this.now()).toISOString(),
      checkId,
    });

    const executor = this.executorMap.get(checkId);
    if (!executor) {
      await this.recordOutcome({
        checkId,
        status: "error",
        evidence: `No executor found for check "${checkId}"`,
        sources: [],
        errorDetail: `No executor registered for check ID "${checkId}"`,
      });
      return;
    }

    try {
      const outcome = await executor.execute(this.fieldValues);
      await this.recordOutcome(outcome);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      await this.emitAndLog({
        type: "error",
        screeningId: this.screeningId,
        timestamp: new Date(this.now()).toISOString(),
        message: `Check "${checkId}" failed: ${message}`,
        checkId,
      });

      await this.recordOutcome({
        checkId,
        status: "error",
        evidence: `Check execution failed: ${message}`,
        sources: [],
        errorDetail: message,
      });
    }
  }

  /**
   * Record a check outcome and move the check from running to completed.
   */
  private async recordOutcome(outcome: CheckOutcome): Promise<void> {
    this.runningChecks = this.runningChecks.filter((c) => c !== outcome.checkId);
    this.completedChecks.push(outcome.checkId);
    this.pendingChecks = this.pendingChecks.filter((c) => c !== outcome.checkId);
    this.outcomes.push(outcome);
    this.updatedAt = new Date(this.now()).toISOString();

    await this.emitAndLog({
      type: "check_completed",
      screeningId: this.screeningId,
      timestamp: new Date(this.now()).toISOString(),
      checkId: outcome.checkId,
      outcome,
    });
  }

  /**
   * Mark a check as skipped (consent denied or expired).
   */
  private async markCheckSkipped(
    checkId: string,
    evidence: string,
  ): Promise<void> {
    this.pendingChecks = this.pendingChecks.filter((c) => c !== checkId);
    this.completedChecks.push(checkId);
    this.outcomes.push({
      checkId,
      status: "undetermined",
      evidence,
      sources: [],
    });
    this.updatedAt = new Date(this.now()).toISOString();

    await this.emitAndLog({
      type: "check_completed",
      screeningId: this.screeningId,
      timestamp: new Date(this.now()).toISOString(),
      checkId,
      outcome: {
        checkId,
        status: "undetermined",
        evidence,
        sources: [],
      },
    });
  }

  /**
   * Check if all checks are done (completed or consent-resolved).
   * If so, compute the decision and emit pipeline_complete.
   */
  private async checkCompletion(): Promise<void> {
    // Pipeline is complete when:
    // - No checks are running
    // - No checks are waiting for consent
    // - All declarations have been accounted for (completed)
    const allAccountedFor = this.declarations.every(
      (d) =>
        this.completedChecks.includes(d.id) ||
        this.runningChecks.includes(d.id) ||
        this.consentWaitingChecks.has(d.id) ||
        // Check still pending because fields aren't met yet
        !this.areFieldsMet(d),
    );

    const allDone =
      this.runningChecks.length === 0 &&
      this.consentWaitingChecks.size === 0 &&
      this.completedChecks.length === this.declarations.length;

    if (allDone && this.status !== "completed") {
      this.decision = this.aggregator.computeDecision(this.outcomes);
      this.status = "completed";
      this.updatedAt = new Date(this.now()).toISOString();

      await this.emitAndLog({
        type: "pipeline_complete",
        screeningId: this.screeningId,
        timestamp: new Date(this.now()).toISOString(),
        decision: this.decision,
      });
    }
  }

  /**
   * Check if all required fields for a declaration are met.
   */
  private areFieldsMet(decl: CheckDeclaration): boolean {
    return decl.requiredFields.every((f) => this.completedFields.has(f));
  }

  /**
   * Emit an event to all subscribers and log it to the audit logger.
   */
  private async emitAndLog(event: PipelineEvent): Promise<void> {
    // Log to audit trail (awaited for correctness)
    await this.auditLogger.log(event);

    // Notify subscribers
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
