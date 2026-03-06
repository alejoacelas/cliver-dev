import { describe, it, expect } from "vitest";
import { DecisionAggregator } from "../src/decision-aggregator.js";
import type { CheckOutcome } from "@cliver/contracts";

const makeOutcome = (
  checkId: string,
  status: CheckOutcome["status"],
  evidence = "Some evidence",
): CheckOutcome => ({
  checkId,
  status,
  evidence,
  sources: [],
});

describe("DecisionAggregator", () => {
  const aggregator = new DecisionAggregator();

  it("all checks pass -> PASS", () => {
    const outcomes = [
      makeOutcome("domain", "pass"),
      makeOutcome("affiliation", "pass"),
      makeOutcome("sanctions", "pass"),
    ];
    const decision = aggregator.computeDecision(outcomes);
    expect(decision.status).toBe("PASS");
    expect(decision.flagCount).toBe(0);
    expect(decision.reasons).toEqual([]);
  });

  it("sanctions flag -> FLAG", () => {
    const outcomes = [
      makeOutcome("domain", "pass"),
      makeOutcome("sanctions", "flag", "Match found on OFAC list"),
    ];
    const decision = aggregator.computeDecision(outcomes);
    expect(decision.status).toBe("FLAG");
    expect(decision.flagCount).toBe(1);
    expect(decision.reasons).toHaveLength(1);
    expect(decision.reasons[0].checkId).toBe("sanctions");
  });

  it("non-sanctions flag -> REVIEW", () => {
    const outcomes = [
      makeOutcome("domain", "flag", "Suspicious domain"),
      makeOutcome("sanctions", "pass"),
    ];
    const decision = aggregator.computeDecision(outcomes);
    expect(decision.status).toBe("REVIEW");
    expect(decision.flagCount).toBe(1);
  });

  it("any check errored -> REVIEW", () => {
    const outcomes = [
      makeOutcome("domain", "error", "API timeout"),
      makeOutcome("sanctions", "pass"),
    ];
    const decision = aggregator.computeDecision(outcomes);
    expect(decision.status).toBe("REVIEW");
    expect(decision.flagCount).toBe(1);
  });

  it("any check undetermined -> REVIEW", () => {
    const outcomes = [
      makeOutcome("affiliation", "undetermined", "Could not verify"),
      makeOutcome("sanctions", "pass"),
    ];
    const decision = aggregator.computeDecision(outcomes);
    expect(decision.status).toBe("REVIEW");
    expect(decision.flagCount).toBe(1);
  });

  it("empty checks -> REVIEW", () => {
    const decision = aggregator.computeDecision([]);
    expect(decision.status).toBe("REVIEW");
    expect(decision.flagCount).toBe(0);
    expect(decision.summary).toContain("No checks");
  });

  it("sanctions flag takes priority over other flags", () => {
    const outcomes = [
      makeOutcome("domain", "flag", "Bad domain"),
      makeOutcome("affiliation", "undetermined", "Unknown org"),
      makeOutcome("sanctions", "flag", "OFAC match"),
    ];
    const decision = aggregator.computeDecision(outcomes);
    expect(decision.status).toBe("FLAG");
    // flagCount includes all non-pass results
    expect(decision.flagCount).toBe(3);
  });

  it("multiple non-sanctions issues without sanctions flag -> REVIEW", () => {
    const outcomes = [
      makeOutcome("domain", "flag", "Bad domain"),
      makeOutcome("affiliation", "error", "API error"),
      makeOutcome("institution-type", "undetermined", "Unknown"),
      makeOutcome("sanctions", "pass"),
    ];
    const decision = aggregator.computeDecision(outcomes);
    expect(decision.status).toBe("REVIEW");
    expect(decision.flagCount).toBe(3);
  });

  it("decision summary is populated", () => {
    const outcomes = [makeOutcome("domain", "pass")];
    const decision = aggregator.computeDecision(outcomes);
    expect(typeof decision.summary).toBe("string");
    expect(decision.summary.length).toBeGreaterThan(0);
  });

  it("decision reasons include detail for each non-pass check", () => {
    const outcomes = [
      makeOutcome("domain", "flag", "Suspicious domain detected"),
      makeOutcome("sanctions", "flag", "OFAC list match"),
    ];
    const decision = aggregator.computeDecision(outcomes);
    expect(decision.reasons).toHaveLength(2);
    expect(decision.reasons.find((r) => r.checkId === "domain")?.detail).toContain("Suspicious domain");
    expect(decision.reasons.find((r) => r.checkId === "sanctions")?.detail).toContain("OFAC");
  });

  describe("configurable flag check IDs (#8)", () => {
    it("custom flagCheckIds produces FLAG for matching check", () => {
      const custom = new DecisionAggregator({
        flagCheckIds: new Set(["Sanctions and Export Control Screening"]),
      });
      const outcomes = [
        makeOutcome("Sanctions and Export Control Screening", "flag", "OFAC match"),
        makeOutcome("domain", "pass"),
      ];
      const decision = custom.computeDecision(outcomes);
      expect(decision.status).toBe("FLAG");
    });

    it("custom flagCheckIds does not FLAG for non-matching check", () => {
      const custom = new DecisionAggregator({
        flagCheckIds: new Set(["Sanctions and Export Control Screening"]),
      });
      const outcomes = [
        makeOutcome("sanctions", "flag", "match"),
        makeOutcome("domain", "pass"),
      ];
      const decision = custom.computeDecision(outcomes);
      // "sanctions" is not in the custom set, so it's REVIEW, not FLAG
      expect(decision.status).toBe("REVIEW");
    });

    it("multiple flag check IDs are supported", () => {
      const custom = new DecisionAggregator({
        flagCheckIds: new Set(["sanctions", "ofac-check"]),
      });
      const outcomes = [
        makeOutcome("ofac-check", "flag", "match"),
        makeOutcome("domain", "pass"),
      ];
      const decision = custom.computeDecision(outcomes);
      expect(decision.status).toBe("FLAG");
    });
  });

  describe("criterion display names (#16)", () => {
    it("uses criterion display name when provided", () => {
      const custom = new DecisionAggregator({
        criterionNames: new Map([
          ["domain", "Email Domain Validity"],
          ["sanctions", "Sanctions and Export Control Screening"],
        ]),
      });
      const outcomes = [
        makeOutcome("domain", "flag", "Bad domain"),
        makeOutcome("sanctions", "flag", "OFAC match"),
      ];
      const decision = custom.computeDecision(outcomes);
      expect(decision.reasons.find((r) => r.checkId === "domain")?.criterion).toBe("Email Domain Validity");
      expect(decision.reasons.find((r) => r.checkId === "sanctions")?.criterion).toBe("Sanctions and Export Control Screening");
    });

    it("falls back to checkId when no criterion name is mapped", () => {
      const custom = new DecisionAggregator({
        criterionNames: new Map([["domain", "Email Domain Validity"]]),
      });
      const outcomes = [
        makeOutcome("unknown-check", "flag", "something"),
      ];
      const decision = custom.computeDecision(outcomes);
      expect(decision.reasons[0].criterion).toBe("unknown-check");
    });
  });
});
