/**
 * SecureDnaExecutor — STUB implementation.
 *
 * SecureDNA integration is pending. This executor validates input
 * format but always returns an "undetermined" outcome noting that
 * SecureDNA screening is not yet available.
 *
 * Expected fields: { sequence: string }
 */

import type { ICheckExecutor, CheckOutcome } from "@cliver/contracts";

/** Minimal DNA/RNA sequence format validation. */
const VALID_SEQUENCE_PATTERN = /^[ATCGUNatcgun\s]+$/;

export class SecureDnaExecutor implements ICheckExecutor {
  readonly checkId = "secure_dna";

  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    const sequence = fields.sequence as string | undefined;
    if (!sequence) {
      return {
        checkId: this.checkId,
        status: "error",
        evidence: "No sequence provided",
        sources: [],
        errorDetail: "Missing required field: sequence",
      };
    }

    // Validate sequence format before anything else
    const trimmed = sequence.trim();
    if (!VALID_SEQUENCE_PATTERN.test(trimmed)) {
      return {
        checkId: this.checkId,
        status: "error",
        evidence: "Invalid sequence format: sequence must contain only valid nucleotide characters (A, T, C, G, U, N)",
        sources: [],
        errorDetail: "Invalid sequence format",
      };
    }

    if (trimmed.length < 50) {
      return {
        checkId: this.checkId,
        status: "error",
        evidence: "Invalid sequence format: sequence must be at least 50 nucleotides",
        sources: [],
        errorDetail: "Sequence too short",
      };
    }

    // STUB: SecureDNA integration pending
    return {
      checkId: this.checkId,
      status: "undetermined",
      evidence: "SecureDNA sequence screening is not yet integrated. This check will be available once SecureDNA API access is configured.",
      sources: [],
    };
  }
}
