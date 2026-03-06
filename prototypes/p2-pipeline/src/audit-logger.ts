import type { PipelineEvent, IAuditLogger } from "@cliver/contracts";

/**
 * In-memory audit logger. Stores all pipeline events and supports
 * filtering by screeningId and event type.
 */
export class AuditLogger implements IAuditLogger {
  private events: PipelineEvent[] = [];

  async log(event: PipelineEvent): Promise<void> {
    this.events.push(event);
  }

  async query(
    filter: Record<string, unknown>,
  ): Promise<PipelineEvent[]> {
    let results = this.events;

    if (filter.screeningId) {
      results = results.filter((e) => e.screeningId === filter.screeningId);
    }

    if (filter.type) {
      results = results.filter((e) => e.type === filter.type);
    }

    return results;
  }

  /**
   * Get all events (convenience method for tests).
   */
  getAll(): PipelineEvent[] {
    return [...this.events];
  }
}
