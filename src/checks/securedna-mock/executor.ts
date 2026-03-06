import type { ICheckExecutor, CheckOutcome } from "@cliver/contracts";
import { KNOWN_CONCERNS, type SecureDnaConcern } from "./concerns.js";

const CONCERN_PROBABILITY = 0.3;

export class SecureDnaMockExecutor implements ICheckExecutor {
  readonly checkId = "securedna_mock";
  private readonly random: () => number;

  constructor(random?: () => number) {
    this.random = random ?? Math.random;
  }

  async execute(_fields: Record<string, unknown>): Promise<CheckOutcome> {
    const selected: SecureDnaConcern[] = KNOWN_CONCERNS.filter(
      () => this.random() < CONCERN_PROBABILITY,
    );

    const flagged = selected.length > 0;
    const result = { flagged, concerns: selected };

    return {
      checkId: this.checkId,
      status: flagged ? "flag" : "pass",
      evidence: flagged
        ? JSON.stringify(result)
        : "No concerns identified by SecureDNA screening (mock).",
      sources: [],
    };
  }
}
