import { describe, it, expect, vi } from "vitest";
import type { PipelineEvent } from "@cliver/contracts";
import { createPipeline } from "./create-pipeline.js";
import { createMockProvider } from "../checks/testing.js";

describe("Pipeline integration", () => {
  function setupPipeline() {
    const extractStructured = vi.fn().mockImplementation(async (_ctx: string) => {
      // Default: return NO_FLAG for verification checks, or publications/work
      // The mock needs to handle different schemas
      return {
        // VerificationResult shape
        status: "NO_FLAG",
        evidence: "Verified successfully",
        sources: ["web1"],
        // PublicationResult shape
        works: [
          {
            title: "Test Publication",
            authors: "Smith J",
            year: 2024,
            relevance: "Relevant",
            sources: ["epmc1"],
            // BackgroundWork fields
            relevance_level: 5,
            organism: "E. coli",
            work_summary: "Expression study",
          },
        ],
        // CoauthorResult shape
        coauthors: [
          { name: "J Doe", institution: "MIT", relationship: "collaborator" },
        ],
        suggestedVerificationEmails: [],
      };
    });

    const completeWithTools = vi.fn().mockResolvedValue({
      text: "Research results found",
      toolCalls: [],
    });

    const generateText = vi
      .fn()
      .mockResolvedValue("Verified MIT researcher with relevant publications.");

    const provider = createMockProvider({
      extractStructured,
      completeWithTools,
      generateText,
    });

    const pipeline = createPipeline({
      screeningId: "test-screening-1",
      provider,
    });

    const events: PipelineEvent[] = [];
    pipeline.subscribe((e) => events.push(e));

    return { pipeline, events, extractStructured, completeWithTools, generateText };
  }

  it("triggers checks as fields are submitted", async () => {
    const { pipeline, events } = setupPipeline();

    // Submit institution first — triggers institution_check only
    await pipeline.onFieldCompleted("institution", "MIT");

    const checksStartedAfterInstitution = events
      .filter((e) => e.type === "check_started")
      .map((e) => (e as { checkId: string }).checkId);
    expect(checksStartedAfterInstitution).toContain("institution_check");
    expect(checksStartedAfterInstitution).not.toContain("affiliation_check");
  });

  it("fires dependent checks when all fields arrive", async () => {
    const { pipeline, events } = setupPipeline();

    await pipeline.onFieldCompleted("institution", "MIT");
    await pipeline.onFieldCompleted("name", "Jane Smith");

    const startedChecks = events
      .filter((e) => e.type === "check_started")
      .map((e) => (e as { checkId: string }).checkId);

    // name + institution should trigger affiliation_check, sanctions_check
    expect(startedChecks).toContain("affiliation_check");
    expect(startedChecks).toContain("sanctions_check");
    // name alone triggers publication_search, coauthor_finder
    expect(startedChecks).toContain("publication_search");
    expect(startedChecks).toContain("coauthor_finder");
  });

  it("completes pipeline with all checks and summarizer", async () => {
    const { pipeline, events, generateText } = setupPipeline();

    // Submit all fields
    await pipeline.onFieldCompleted("institution", "MIT");
    await pipeline.onFieldCompleted("name", "Jane Smith");
    await pipeline.onFieldCompleted("email", "jane@mit.edu");
    await pipeline.onFieldCompleted("order_description", "GFP expression vector");

    const state = pipeline.getState();
    expect(state.status).toBe("completed");
    expect(state.completedChecks).toHaveLength(8);
    expect(state.decision).not.toBeNull();

    // Summarizer was called via postDecision hook
    expect(generateText).toHaveBeenCalled();
    expect(state.decision!.summary).toBe(
      "Verified MIT researcher with relevant publications.",
    );
  });

  it("emits pipeline_complete with decision", async () => {
    const { pipeline, events } = setupPipeline();

    await pipeline.onFieldCompleted("institution", "MIT");
    await pipeline.onFieldCompleted("name", "Jane Smith");
    await pipeline.onFieldCompleted("email", "jane@mit.edu");
    await pipeline.onFieldCompleted("order_description", "GFP expression");

    const completeEvent = events.find((e) => e.type === "pipeline_complete");
    expect(completeEvent).toBeDefined();
    expect(
      (completeEvent as { decision: { status: string } }).decision.status,
    ).toBeDefined();
  });

  it("runs checks in parallel within each scheduling cycle", async () => {
    const { pipeline, events } = setupPipeline();

    // Submit name — triggers publication_search and coauthor_finder simultaneously
    await pipeline.onFieldCompleted("name", "Jane Smith");

    const startedChecks = events
      .filter((e) => e.type === "check_started")
      .map((e) => (e as { checkId: string }).checkId);

    expect(startedChecks).toContain("publication_search");
    expect(startedChecks).toContain("coauthor_finder");

    // Both should complete before the next scheduling cycle
    const completedChecks = events
      .filter((e) => e.type === "check_completed")
      .map((e) => (e as { checkId: string }).checkId);

    expect(completedChecks).toContain("publication_search");
    expect(completedChecks).toContain("coauthor_finder");
  });

  it("handles check errors gracefully without crashing pipeline", async () => {
    const extractStructured = vi.fn().mockRejectedValue(new Error("AI unavailable"));
    const completeWithTools = vi.fn().mockRejectedValue(new Error("AI unavailable"));
    const generateText = vi.fn().mockResolvedValue("Error summary");

    const provider = createMockProvider({
      extractStructured,
      completeWithTools,
      generateText,
    });

    const pipeline = createPipeline({
      screeningId: "test-error",
      provider,
    });

    // All checks should error but pipeline should still complete
    await pipeline.onFieldCompleted("institution", "MIT");
    await pipeline.onFieldCompleted("name", "Jane Smith");
    await pipeline.onFieldCompleted("email", "jane@mit.edu");
    await pipeline.onFieldCompleted("order_description", "Test order");

    const state = pipeline.getState();
    expect(state.status).toBe("completed");
    expect(state.completedChecks).toHaveLength(8);

    // All AI checks should have error status, SecureDNA mock should pass/flag
    const aiOutcomes = state.outcomes.filter(
      (o) => o.checkId !== "securedna_mock",
    );
    for (const outcome of aiOutcomes) {
      expect(outcome.status).toBe("error");
    }
  });
});
