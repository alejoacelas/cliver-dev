import { describe, it, expect, vi } from "vitest";
import { CoauthorFinderExecutor } from "./executor.js";
import { createMockProvider } from "../testing.js";

describe("CoauthorFinderExecutor", () => {
  const MODEL = "test-model";
  const fields = { name: "Jane Smith" };

  it("has checkId 'coauthor_finder'", () => {
    const provider = createMockProvider();
    const executor = new CoauthorFinderExecutor(provider, MODEL);
    expect(executor.checkId).toBe("coauthor_finder");
  });

  it("returns pass with coauthors when found", async () => {
    const completeWithTools = vi.fn().mockResolvedValue({
      text: "Found coauthors",
      toolCalls: [],
    });
    const extractStructured = vi.fn().mockResolvedValue({
      coauthors: [
        {
          name: "John Doe",
          institution: "MIT",
          email: "jdoe@mit.edu",
          relationship: "co-PI",
        },
      ],
      suggestedVerificationEmails: [
        {
          recipientName: "John Doe",
          recipientEmail: "jdoe@mit.edu",
          reason: "Co-PI at same institution",
        },
      ],
    });
    const provider = createMockProvider({ completeWithTools, extractStructured });
    const executor = new CoauthorFinderExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("pass");
    const data = JSON.parse(outcome.evidence);
    expect(data.coauthors).toHaveLength(1);
    expect(data.coauthors[0].name).toBe("John Doe");
    expect(data.suggestedVerificationEmails).toHaveLength(1);
  });

  it("returns undetermined when no coauthors found", async () => {
    const completeWithTools = vi.fn().mockResolvedValue({
      text: "No coauthors found",
      toolCalls: [],
    });
    const extractStructured = vi.fn().mockResolvedValue({
      coauthors: [],
      suggestedVerificationEmails: [],
    });
    const provider = createMockProvider({ completeWithTools, extractStructured });
    const executor = new CoauthorFinderExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("undetermined");
  });

  it("does not send emails—only suggests them", async () => {
    const completeWithTools = vi.fn().mockResolvedValue({
      text: "Found coauthors",
      toolCalls: [],
    });
    const extractStructured = vi.fn().mockResolvedValue({
      coauthors: [
        { name: "John Doe", institution: "MIT", relationship: "collaborator" },
      ],
      suggestedVerificationEmails: [
        {
          recipientName: "John Doe",
          recipientEmail: "jdoe@mit.edu",
          reason: "Frequent collaborator",
        },
      ],
    });
    const provider = createMockProvider({ completeWithTools, extractStructured });
    const executor = new CoauthorFinderExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    // Verify the output is data only, no side effects
    expect(outcome.checkId).toBe("coauthor_finder");
    const data = JSON.parse(outcome.evidence);
    expect(data.suggestedVerificationEmails[0].recipientEmail).toBe("jdoe@mit.edu");
  });
});
