import { describe, it, expect, vi } from "vitest";
import { InstitutionCheckExecutor } from "./executor.js";
import { createMockProvider } from "../testing.js";

describe("InstitutionCheckExecutor", () => {
  const MODEL = "test-model";
  const fields = { institution: "Stanford University" };

  it("has checkId 'institution_check'", () => {
    const provider = createMockProvider();
    const executor = new InstitutionCheckExecutor(provider, MODEL);
    expect(executor.checkId).toBe("institution_check");
  });

  it("returns pass when AI returns NO_FLAG", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "NO_FLAG",
      evidence: "Stanford is a recognized research university",
      sources: ["web1", "web2"],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new InstitutionCheckExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("pass");
    expect(outcome.evidence).toContain("Stanford");
  });

  it("returns flag when AI returns FLAG", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "FLAG",
      evidence: "Institution not found in registries",
      sources: [],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new InstitutionCheckExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("flag");
  });

  it("passes institution to the prompt", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "NO_FLAG",
      evidence: "Found",
      sources: [],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new InstitutionCheckExecutor(provider, MODEL);

    await executor.execute(fields);

    const context = extractStructured.mock.calls[0][0];
    expect(context).toContain("Stanford University");
  });
});
