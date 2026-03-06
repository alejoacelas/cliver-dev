import type { ConsentStatus, IConsentManager } from "@cliver/contracts";

interface ConsentRecord {
  checkId: string;
  description: string;
  status: ConsentStatus;
  proposedAt: number;
}

/**
 * In-memory consent manager that tracks consent state per screening/check.
 * Implements IConsentManager from P0 contracts plus additional methods
 * for timestamp-based expiration checks.
 */
export class ConsentManager implements IConsentManager {
  private records = new Map<string, Map<string, ConsentRecord>>();

  private getOrCreate(screeningId: string): Map<string, ConsentRecord> {
    let map = this.records.get(screeningId);
    if (!map) {
      map = new Map();
      this.records.set(screeningId, map);
    }
    return map;
  }

  async propose(
    screeningId: string,
    checkId: string,
    description: string,
  ): Promise<void> {
    this.proposeAt(screeningId, checkId, description, Date.now());
  }

  /**
   * Propose with a specific timestamp. Used for testing timeout logic
   * without depending on real wall-clock time.
   */
  proposeAt(
    screeningId: string,
    checkId: string,
    description: string,
    timestamp: number,
  ): void {
    const map = this.getOrCreate(screeningId);
    map.set(checkId, {
      checkId,
      description,
      status: "pending",
      proposedAt: timestamp,
    });
  }

  async consent(screeningId: string, checkId: string): Promise<void> {
    const map = this.getOrCreate(screeningId);
    const record = map.get(checkId);
    if (record) {
      record.status = "granted";
    }
  }

  async deny(screeningId: string, checkId: string): Promise<void> {
    const map = this.getOrCreate(screeningId);
    const record = map.get(checkId);
    if (record) {
      record.status = "denied";
    }
  }

  async isAuthorized(screeningId: string, checkId: string): Promise<boolean> {
    const map = this.records.get(screeningId);
    if (!map) return false;
    const record = map.get(checkId);
    return record?.status === "granted";
  }

  async getPending(
    screeningId: string,
  ): Promise<Array<{ checkId: string; description: string }>> {
    const map = this.records.get(screeningId);
    if (!map) return [];
    return Array.from(map.values())
      .filter((r) => r.status === "pending")
      .map(({ checkId, description }) => ({ checkId, description }));
  }

  /**
   * Get the current consent status for a check.
   * Returns undefined if no proposal exists.
   */
  getStatus(screeningId: string, checkId: string): ConsentStatus | undefined {
    const map = this.records.get(screeningId);
    if (!map) return undefined;
    return map.get(checkId)?.status;
  }

  /**
   * Check if a pending consent has expired based on logical timestamp comparison.
   * Returns true only if the consent is still pending and the elapsed time
   * exceeds the timeout threshold.
   */
  isExpired(
    screeningId: string,
    checkId: string,
    timeoutMs: number,
    now: number,
  ): boolean {
    const map = this.records.get(screeningId);
    if (!map) return false;
    const record = map.get(checkId);
    if (!record) return false;
    if (record.status !== "pending") return false;
    return now - record.proposedAt >= timeoutMs;
  }

  /**
   * Mark a consent as expired.
   */
  markExpired(screeningId: string, checkId: string): void {
    const map = this.records.get(screeningId);
    if (!map) return;
    const record = map.get(checkId);
    if (record) {
      record.status = "expired";
    }
  }

  /**
   * Get all check IDs that have pending consent for a screening.
   */
  getPendingCheckIds(screeningId: string): string[] {
    const map = this.records.get(screeningId);
    if (!map) return [];
    return Array.from(map.values())
      .filter((r) => r.status === "pending")
      .map((r) => r.checkId);
  }
}
