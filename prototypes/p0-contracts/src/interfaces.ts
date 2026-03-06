import type { ZodType } from "zod";
import type { CheckOutcome, ConsentStatus, PipelineEvent, PipelineState } from "./pipeline.js";
import type { UserRole } from "./auth.js";
import type { FormSchema } from "./form.js";
import type { ViewFilter } from "./sse.js";

// ============================================================
// Interfaces for the screening platform.
//
// These are TypeScript interfaces only — no Zod schemas, no
// implementations. Each interface represents a capability that
// downstream prototypes will implement.
// ============================================================

// --- ICheckExecutor ---

/**
 * Executes a single screening check. Each check type (web search,
 * sanctions screening, ORCID lookup, etc.) has its own executor.
 */
export interface ICheckExecutor {
  /** The check declaration ID this executor handles. */
  readonly checkId: string;

  /**
   * Run the check using the provided form fields.
   * @param fields - Key-value pairs of form data relevant to this check.
   * @returns The check's outcome (pass/flag/undetermined/error).
   */
  execute(fields: Record<string, unknown>): Promise<CheckOutcome>;
}

// --- Completion provider types ---

export interface ToolDefinition {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCallResult {
  toolName: string;
  arguments: Record<string, unknown>;
  output: unknown;
}

export interface CompletionResult {
  text: string;
  toolCalls: ToolCallResult[];
}

// --- ICompletionProvider ---

/**
 * Abstraction over the AI completion layer.
 * Wraps model calls (currently OpenRouter/Gemini) so that the pipeline
 * doesn't depend on a specific AI provider.
 */
export interface ICompletionProvider {
  /**
   * Run a completion with tool use. The model may call tools
   * multiple times before returning a final text response.
   */
  completeWithTools(
    prompt: string,
    model: string,
    tools?: ToolDefinition[],
    callbacks?: {
      onToolCall?: (tool: string, args: Record<string, unknown>) => void;
      onToolResult?: (tool: string, id: string, count: number) => void;
    },
  ): Promise<CompletionResult>;

  /**
   * Extract structured data from text using a Zod schema.
   * Used for evidence/determination/work extraction.
   */
  extractStructured<T>(
    context: string,
    extractionPrompt: string,
    schema: ZodType<T>,
    model: string,
  ): Promise<T>;

  /**
   * Generate plain text (e.g., summaries).
   */
  generateText(prompt: string, model: string): Promise<string>;
}

// --- IConsentManager ---

/**
 * Manages customer consent for checks that require permission.
 * Tracks which checks have been proposed, consented to, or denied.
 */
export interface IConsentManager {
  /** Propose a check that needs customer consent. */
  propose(
    screeningId: string,
    checkId: string,
    description: string,
  ): Promise<void>;

  /** Record that the customer granted consent for a check. */
  consent(screeningId: string, checkId: string): Promise<void>;

  /** Record that the customer denied consent for a check. */
  deny(screeningId: string, checkId: string): Promise<void>;

  /** Check whether a specific check has been authorized. */
  isAuthorized(screeningId: string, checkId: string): Promise<boolean>;

  /**
   * Get all checks awaiting consent for a screening.
   * Returns an array of { checkId, description } objects.
   */
  getPending(
    screeningId: string,
  ): Promise<Array<{ checkId: string; description: string }>>;
}

// --- IAuditLogger ---

/**
 * Records every significant event in the screening pipeline.
 * Used for regulatory compliance and debugging.
 */
export interface IAuditLogger {
  /** Log a pipeline event. */
  log(event: PipelineEvent): Promise<void>;

  /**
   * Query the audit log.
   * @param filter - Criteria to filter events (screening ID, time range, event type, etc.).
   * @returns Matching events in chronological order.
   */
  query(
    filter: Record<string, unknown>,
  ): Promise<PipelineEvent[]>;
}

// --- ITokenStore ---

/**
 * Key-value store for authentication tokens, session data,
 * and short-lived secrets (e.g., email confirmation codes).
 */
export interface ITokenStore {
  /** Store a value with an optional TTL (in seconds). */
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;

  /** Retrieve a value. Returns null if the key doesn't exist or has expired. */
  get(key: string): Promise<string | null>;

  /** Delete a value. */
  delete(key: string): Promise<void>;
}

// --- IEventEmitter ---

/**
 * Pub/sub for pipeline events. The pipeline emits events as checks
 * progress; the SSE layer subscribes to relay them to clients.
 */
export interface IEventEmitter {
  /** Emit a pipeline event. */
  emit(event: PipelineEvent): Promise<void>;

  /**
   * Subscribe to pipeline events matching a filter.
   * @param filter - Which events to receive (by screening ID, event type, view filter, etc.).
   * @param listener - Callback invoked for each matching event.
   * @returns An unsubscribe function.
   */
  subscribe(
    filter: { screeningId?: string; viewFilter?: ViewFilter },
    listener: (event: PipelineEvent) => void,
  ): () => void;
}

// --- IStorageLayer ---

/**
 * CRUD operations for screening data. Abstracts the database layer
 * so prototypes can use in-memory stores for testing.
 */
export interface IStorageLayer {
  // --- Screenings ---

  /** Create a new screening and return its ID. */
  createScreening(data: Partial<PipelineState>): Promise<string>;

  /** Get a screening by ID. Returns null if not found. */
  getScreening(id: string): Promise<PipelineState | null>;

  /** Update fields on an existing screening. */
  updateScreening(id: string, data: Partial<PipelineState>): Promise<void>;

  /** List screenings matching optional filter criteria. */
  listScreenings(filter?: Record<string, unknown>): Promise<PipelineState[]>;

  // --- Check outcomes ---

  /** Store a check outcome for a screening. */
  storeOutcome(screeningId: string, outcome: CheckOutcome): Promise<void>;

  /** Get all check outcomes for a screening. */
  getOutcomes(screeningId: string): Promise<CheckOutcome[]>;

  // --- Field values ---

  /** Store a field value for a screening. */
  storeFieldValue(screeningId: string, fieldId: string, value: unknown): Promise<void>;

  /** Get all field values for a screening. */
  getFieldValues(screeningId: string): Promise<Record<string, unknown>>;

  // --- Consent records ---

  /** Store a consent record for a check within a screening. */
  storeConsentRecord(screeningId: string, checkId: string, status: ConsentStatus): Promise<void>;

  /** Get all consent records for a screening. */
  getConsentRecords(screeningId: string): Promise<Array<{ checkId: string; status: ConsentStatus }>>;

  // --- Audit events ---

  /** Store an audit event. */
  storeAuditEvent(event: PipelineEvent): Promise<void>;

  /** Query audit events by filter criteria. */
  queryAuditEvents(filter: { screeningId?: string; type?: string; since?: string }): Promise<PipelineEvent[]>;

  // --- Users ---

  /** Create a user and return their ID. */
  createUser(data: { email: string; passwordHash: string; role: UserRole }): Promise<string>;

  /** Look up a user by email. Returns null if not found. */
  getUserByEmail(email: string): Promise<{ id: string; email: string; passwordHash: string; role: UserRole; totpSecret?: string; emailConfirmed?: boolean } | null>;

  /** Update fields on an existing user. */
  updateUser(id: string, data: Record<string, unknown>): Promise<void>;

  // --- Form schemas ---

  /** Store a form schema. */
  storeFormSchema(schema: FormSchema): Promise<void>;

  /** Get a form schema by ID and optional version. */
  getFormSchema(id: string, version?: string): Promise<FormSchema | null>;
}
