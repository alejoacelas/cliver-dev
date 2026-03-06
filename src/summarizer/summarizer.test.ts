import { describe, it, expect, vi } from "vitest";
import { Summarizer } from "./summarizer.js";
import { createMockProvider } from "../checks/testing.js";
import type { CheckOutcome } from "@cliver/contracts";

describe("Summarizer", () => {
  const MODEL = "test-model";
  const fields = {
    name: "Jane Smith",
    institution: "MIT",
    email: "jane@mit.edu",
    order_description: "GFP expression vector",
  };

  it("calls generateText with a prompt containing check results", async () => {
    const generateText = vi.fn().mockResolvedValue(
      "MIT researcher with confirmed affiliation and relevant CRISPR publications.",
    );
    const provider = createMockProvider({ generateText });
    const summarizer = new Summarizer(provider, MODEL);

    const outcomes: CheckOutcome[] = [
      {
        checkId: "affiliation_check",
        status: "pass",
        evidence: "Jane Smith found in MIT directory",
        sources: ["web1"],
      },
      {
        checkId: "institution_check",
        status: "pass",
        evidence: "MIT is a recognized research university",
        sources: ["web2"],
      },
    ];

    const summary = await summarizer.summarize(outcomes, fields);

    expect(summary).toBe(
      "MIT researcher with confirmed affiliation and relevant CRISPR publications.",
    );
    expect(generateText).toHaveBeenCalledWith(
      expect.stringContaining("Jane Smith"),
      MODEL,
    );
    expect(generateText).toHaveBeenCalledWith(
      expect.stringContaining("affiliation_check"),
      MODEL,
    );
  });

  it("includes all check outcomes in the prompt", async () => {
    const generateText = vi.fn().mockResolvedValue("Summary");
    const provider = createMockProvider({ generateText });
    const summarizer = new Summarizer(provider, MODEL);

    const outcomes: CheckOutcome[] = [
      {
        checkId: "sanctions_check",
        status: "flag",
        evidence: "Match found on OFAC list",
        sources: ["screen1"],
      },
    ];

    await summarizer.summarize(outcomes, fields);

    const prompt = generateText.mock.calls[0][0];
    expect(prompt).toContain("sanctions_check");
    expect(prompt).toContain("flag");
    expect(prompt).toContain("Match found on OFAC list");
  });

  it("handles empty outcomes", async () => {
    const generateText = vi.fn().mockResolvedValue("No checks completed.");
    const provider = createMockProvider({ generateText });
    const summarizer = new Summarizer(provider, MODEL);

    const summary = await summarizer.summarize([], fields);

    expect(summary).toBe("No checks completed.");
  });
});
