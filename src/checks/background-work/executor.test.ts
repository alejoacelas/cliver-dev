import { describe, it, expect, vi } from "vitest";
import { BackgroundWorkExecutor } from "./executor.js";
import { createMockProvider } from "../testing.js";

describe("BackgroundWorkExecutor", () => {
  const MODEL = "test-model";
  const fields = {
    name: "Jane Smith",
    order_description: "SARS-CoV-2 spike protein expression vector",
  };

  it("has checkId 'background_work'", () => {
    const provider = createMockProvider();
    const executor = new BackgroundWorkExecutor(provider, MODEL);
    expect(executor.checkId).toBe("background_work");
  });

  it("returns pass with works when relevant work found", async () => {
    const completeWithTools = vi.fn().mockResolvedValue({
      text: "Found relevant work",
      toolCalls: [],
    });
    const extractStructured = vi.fn().mockResolvedValue({
      works: [
        {
          relevance_level: 5,
          organism: "SARS-CoV-2",
          sources: ["epmc1"],
          work_summary: "Expression of SARS-CoV-2 spike protein for vaccine development",
        },
      ],
    });
    const provider = createMockProvider({ completeWithTools, extractStructured });
    const executor = new BackgroundWorkExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("pass");
    expect(outcome.evidence).toContain("SARS-CoV-2");
    expect(outcome.evidence).toContain("[5]");
    expect(outcome.sources).toEqual(["epmc1"]);
  });

  it("returns undetermined when no relevant work found", async () => {
    const completeWithTools = vi.fn().mockResolvedValue({
      text: "No work found",
      toolCalls: [],
    });
    const extractStructured = vi.fn().mockResolvedValue({ works: [] });
    const provider = createMockProvider({ completeWithTools, extractStructured });
    const executor = new BackgroundWorkExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("undetermined");
  });

  it("includes order_description in prompt", async () => {
    const completeWithTools = vi.fn().mockResolvedValue({
      text: "Results",
      toolCalls: [],
    });
    const extractStructured = vi.fn().mockResolvedValue({ works: [] });
    const provider = createMockProvider({ completeWithTools, extractStructured });
    const executor = new BackgroundWorkExecutor(provider, MODEL);

    await executor.execute(fields);

    const prompt = completeWithTools.mock.calls[0][0];
    expect(prompt).toContain("SARS-CoV-2 spike protein expression vector");
  });
});
