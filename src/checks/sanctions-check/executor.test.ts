import { describe, it, expect, vi } from "vitest";
import { SanctionsCheckExecutor } from "./executor.js";
import { createMockProvider } from "../testing.js";

describe("SanctionsCheckExecutor", () => {
  const MODEL = "test-model";
  const fields = { name: "Jane Smith", institution: "MIT" };

  it("has checkId 'sanctions_check'", () => {
    const provider = createMockProvider();
    const executor = new SanctionsCheckExecutor(provider, MODEL);
    expect(executor.checkId).toBe("sanctions_check");
  });

  it("returns pass when no sanctions found", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "NO_FLAG",
      evidence: "No matches in OFAC, BIS, or UN lists",
      sources: ["screen1"],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new SanctionsCheckExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("pass");
  });

  it("returns flag when sanctions match found", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "FLAG",
      evidence: "Institution found on BIS Entity List",
      sources: ["screen1"],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new SanctionsCheckExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("flag");
    expect(outcome.evidence).toContain("BIS Entity List");
  });
});
