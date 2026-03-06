/**
 * Tests for SecureDnaExecutor — stub implementation.
 */

import { describe, it, expect } from "vitest";
import { SecureDnaExecutor } from "./secure-dna.js";

describe("SecureDnaExecutor", () => {
  const executor = new SecureDnaExecutor();

  it("has correct checkId", () => {
    expect(executor.checkId).toBe("secure_dna");
  });

  it("returns undetermined for a valid sequence (stub)", async () => {
    const validSequence = "ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG";
    const outcome = await executor.execute({ sequence: validSequence });

    expect(outcome.checkId).toBe("secure_dna");
    expect(outcome.status).toBe("undetermined");
    expect(outcome.evidence).toContain("not yet integrated");
  });

  it("returns error CheckOutcome for invalid sequence format", async () => {
    const outcome = await executor.execute({ sequence: "THIS IS NOT A VALID SEQUENCE 123!@#" });

    expect(outcome.checkId).toBe("secure_dna");
    expect(outcome.status).toBe("error");
    expect(outcome.evidence).toContain("Invalid sequence format");
  });

  it("returns error CheckOutcome for sequence too short", async () => {
    const outcome = await executor.execute({ sequence: "ATCG" });

    expect(outcome.checkId).toBe("secure_dna");
    expect(outcome.status).toBe("error");
    expect(outcome.evidence).toContain("at least 50 nucleotides");
  });

  it("returns error when sequence is missing", async () => {
    const outcome = await executor.execute({});

    expect(outcome.status).toBe("error");
    expect(outcome.errorDetail).toContain("sequence");
  });
});
