import { describe, it, expect, vi } from "vitest";
import { AffiliationCheckExecutor } from "./executor.js";
import { createMockProvider } from "../testing.js";

describe("AffiliationCheckExecutor", () => {
  const MODEL = "test-model";
  const fields = { name: "Jane Smith", institution: "MIT" };

  it("has checkId 'affiliation_check'", () => {
    const provider = createMockProvider();
    const executor = new AffiliationCheckExecutor(provider, MODEL);
    expect(executor.checkId).toBe("affiliation_check");
  });

  it("returns pass when AI returns NO_FLAG", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "NO_FLAG",
      evidence: "Jane Smith found in MIT directory",
      sources: ["web1"],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new AffiliationCheckExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.checkId).toBe("affiliation_check");
    expect(outcome.status).toBe("pass");
    expect(outcome.evidence).toBe("Jane Smith found in MIT directory");
    expect(outcome.sources).toEqual(["web1"]);
  });

  it("returns flag when AI returns FLAG", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "FLAG",
      evidence: "No affiliation found",
      sources: [],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new AffiliationCheckExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("flag");
  });

  it("returns undetermined when AI returns UNDETERMINED", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "UNDETERMINED",
      evidence: "Insufficient sources",
      sources: ["web1"],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new AffiliationCheckExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("undetermined");
  });

  it("passes the prompt with interpolated fields to the provider", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "NO_FLAG",
      evidence: "Found",
      sources: [],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new AffiliationCheckExecutor(provider, MODEL);

    await executor.execute(fields);

    const context = extractStructured.mock.calls[0][0];
    expect(context).toContain("Jane Smith");
    expect(context).toContain("MIT");
    expect(extractStructured).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Object),
      MODEL,
    );
  });

  it("returns error outcome when provider throws", async () => {
    const extractStructured = vi.fn().mockRejectedValue(new Error("API down"));
    const provider = createMockProvider({ extractStructured });
    const executor = new AffiliationCheckExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("error");
    expect(outcome.errorDetail).toBe("API down");
  });
});
