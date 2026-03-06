import { describe, it, expect } from "vitest";
import { DecisionSchema, DecisionStatusSchema } from "./decision.js";

describe("DecisionStatus", () => {
  it("accepts PASS, FLAG, REVIEW", () => {
    expect(DecisionStatusSchema.parse("PASS")).toBe("PASS");
    expect(DecisionStatusSchema.parse("FLAG")).toBe("FLAG");
    expect(DecisionStatusSchema.parse("REVIEW")).toBe("REVIEW");
  });

  it("rejects invalid status", () => {
    expect(() => DecisionStatusSchema.parse("WARN")).toThrow();
    expect(() => DecisionStatusSchema.parse("pass")).toThrow();
  });
});

describe("Decision", () => {
  it("accepts a valid PASS decision", () => {
    const decision = {
      status: "PASS" as const,
      flagCount: 0,
      summary: "All verification criteria passed.",
      reasons: [],
    };
    const parsed = DecisionSchema.parse(decision);
    expect(parsed.status).toBe("PASS");
    expect(parsed.flagCount).toBe(0);
    expect(parsed.reasons).toEqual([]);
  });

  it("accepts a FLAG decision with reasons", () => {
    const decision = {
      status: "FLAG" as const,
      flagCount: 1,
      summary: "Sanctions screening flagged.",
      reasons: [
        {
          checkId: "sanctions-screening",
          criterion: "Sanctions and Export Control Screening",
          detail: "Entity matched on SDN list",
        },
      ],
    };
    const parsed = DecisionSchema.parse(decision);
    expect(parsed.flagCount).toBe(1);
    expect(parsed.reasons).toHaveLength(1);
    expect(parsed.reasons[0].checkId).toBe("sanctions-screening");
  });

  it("accepts a REVIEW decision", () => {
    const decision = {
      status: "REVIEW" as const,
      flagCount: 2,
      summary: "Multiple criteria require manual review.",
      reasons: [
        { checkId: "affiliation", criterion: "Customer Institutional Affiliation", detail: "Could not verify" },
        { checkId: "email-domain", criterion: "Email Domain Verification", detail: "Domain mismatch" },
      ],
    };
    expect(DecisionSchema.parse(decision).flagCount).toBe(2);
  });

  it("rejects missing summary", () => {
    expect(() =>
      DecisionSchema.parse({ status: "PASS", flagCount: 0, reasons: [] })
    ).toThrow();
  });

  it("rejects negative flagCount", () => {
    expect(() =>
      DecisionSchema.parse({ status: "PASS", flagCount: -1, summary: "ok", reasons: [] })
    ).toThrow();
  });
});
