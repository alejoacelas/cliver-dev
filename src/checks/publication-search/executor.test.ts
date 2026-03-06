import { describe, it, expect, vi } from "vitest";
import { PublicationSearchExecutor } from "./executor.js";
import { createMockProvider } from "../testing.js";

describe("PublicationSearchExecutor", () => {
  const MODEL = "test-model";
  const fields = { name: "Jane Smith" };

  it("has checkId 'publication_search'", () => {
    const provider = createMockProvider();
    const executor = new PublicationSearchExecutor(provider, MODEL);
    expect(executor.checkId).toBe("publication_search");
  });

  it("returns pass with publications when works found", async () => {
    const completeWithTools = vi.fn().mockResolvedValue({
      text: "Found publications by Jane Smith",
      toolCalls: [],
    });
    const extractStructured = vi.fn().mockResolvedValue({
      works: [
        {
          title: "CRISPR editing of SARS-CoV-2",
          authors: "Smith J, Doe J",
          year: 2024,
          relevance: "Direct CRISPR work on coronaviruses",
          sources: ["epmc1"],
        },
      ],
    });
    const provider = createMockProvider({ completeWithTools, extractStructured });
    const executor = new PublicationSearchExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("pass");
    expect(outcome.evidence).toContain("CRISPR editing of SARS-CoV-2");
    expect(outcome.sources).toEqual(["epmc1"]);
  });

  it("returns undetermined when no works found", async () => {
    const completeWithTools = vi.fn().mockResolvedValue({
      text: "No publications found",
      toolCalls: [],
    });
    const extractStructured = vi.fn().mockResolvedValue({ works: [] });
    const provider = createMockProvider({ completeWithTools, extractStructured });
    const executor = new PublicationSearchExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("undetermined");
    expect(outcome.evidence).toContain("No publications");
  });

  it("calls completeWithTools with research tools", async () => {
    const completeWithTools = vi.fn().mockResolvedValue({
      text: "Results",
      toolCalls: [],
    });
    const extractStructured = vi.fn().mockResolvedValue({ works: [] });
    const provider = createMockProvider({ completeWithTools, extractStructured });
    const executor = new PublicationSearchExecutor(provider, MODEL);

    await executor.execute(fields);

    expect(completeWithTools).toHaveBeenCalledWith(
      expect.stringContaining("Jane Smith"),
      MODEL,
      expect.arrayContaining([
        expect.objectContaining({ name: "search_web" }),
        expect.objectContaining({ name: "search_epmc" }),
      ]),
    );
  });

  it("returns error outcome when provider throws", async () => {
    const completeWithTools = vi.fn().mockRejectedValue(new Error("timeout"));
    const provider = createMockProvider({ completeWithTools });
    const executor = new PublicationSearchExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("error");
    expect(outcome.errorDetail).toBe("timeout");
  });
});
