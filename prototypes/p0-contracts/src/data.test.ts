import { describe, it, expect } from "vitest";
import {
  VerificationCriterionSchema,
  EvidenceRowSchema,
  EvidenceSchema,
  DeterminationRowSchema,
  DeterminationSchema,
  FlagStatusSchema,
  BackgroundWorkRowSchema,
  BackgroundWorkSchema,
  CompleteDataSchema,
  ToolResultSchema,
} from "./data.js";

// --- VerificationCriterion ---

describe("VerificationCriterion", () => {
  it("accepts all 4 criteria", () => {
    const criteria = [
      "Customer Institutional Affiliation",
      "Institution Type and Biomedical Focus",
      "Email Domain Verification",
      "Sanctions and Export Control Screening",
    ];
    for (const c of criteria) {
      expect(VerificationCriterionSchema.parse(c)).toBe(c);
    }
  });

  it("rejects invalid criterion", () => {
    expect(() => VerificationCriterionSchema.parse("Identity Verification")).toThrow();
  });
});

// --- Evidence ---

describe("EvidenceRow", () => {
  it("accepts a valid evidence row", () => {
    const row = {
      criterion: "Customer Institutional Affiliation" as const,
      sources: ["web1", "web2"],
      evidenceSummary: "Found on MIT staff directory",
    };
    expect(EvidenceRowSchema.parse(row).sources).toHaveLength(2);
  });

  it("rejects missing sources", () => {
    expect(() =>
      EvidenceRowSchema.parse({
        criterion: "Customer Institutional Affiliation",
        evidenceSummary: "test",
      })
    ).toThrow();
  });
});

describe("Evidence", () => {
  it("accepts a valid evidence object with rows", () => {
    const evidence = {
      rows: [
        {
          criterion: "Customer Institutional Affiliation" as const,
          sources: ["web1"],
          evidenceSummary: "Verified on staff directory",
        },
        {
          criterion: "Email Domain Verification" as const,
          sources: ["web2"],
          evidenceSummary: "Domain matches institution",
        },
      ],
    };
    expect(EvidenceSchema.parse(evidence).rows).toHaveLength(2);
  });

  it("rejects evidence with invalid criterion", () => {
    expect(() =>
      EvidenceSchema.parse({
        rows: [{ criterion: "Bogus", sources: [], evidenceSummary: "x" }],
      })
    ).toThrow();
  });
});

// --- Determination ---

describe("FlagStatus", () => {
  it("accepts FLAG, NO FLAG, UNDETERMINED", () => {
    expect(FlagStatusSchema.parse("FLAG")).toBe("FLAG");
    expect(FlagStatusSchema.parse("NO FLAG")).toBe("NO FLAG");
    expect(FlagStatusSchema.parse("UNDETERMINED")).toBe("UNDETERMINED");
  });

  it("rejects invalid flag", () => {
    expect(() => FlagStatusSchema.parse("PASS")).toThrow();
  });
});

describe("DeterminationRow", () => {
  it("accepts a valid determination row", () => {
    const row = {
      criterion: "Sanctions and Export Control Screening" as const,
      flag: "NO FLAG" as const,
    };
    expect(DeterminationRowSchema.parse(row).flag).toBe("NO FLAG");
  });
});

describe("Determination", () => {
  it("accepts valid determinations", () => {
    const det = {
      rows: [
        { criterion: "Customer Institutional Affiliation" as const, flag: "NO FLAG" as const },
        { criterion: "Institution Type and Biomedical Focus" as const, flag: "NO FLAG" as const },
        { criterion: "Email Domain Verification" as const, flag: "FLAG" as const },
        { criterion: "Sanctions and Export Control Screening" as const, flag: "UNDETERMINED" as const },
      ],
    };
    expect(DeterminationSchema.parse(det).rows).toHaveLength(4);
  });
});

// --- BackgroundWork ---

describe("BackgroundWorkRow", () => {
  it("accepts a valid background work row", () => {
    const row = {
      relevanceLevel: 5,
      organism: "SARS-CoV-2",
      sources: ["epmc1", "web3"],
      workSummary: "Published CRISPR-based detection method for SARS-CoV-2",
    };
    const parsed = BackgroundWorkRowSchema.parse(row);
    expect(parsed.relevanceLevel).toBe(5);
    expect(parsed.organism).toBe("SARS-CoV-2");
  });

  it("rejects relevanceLevel outside 1-5", () => {
    expect(() =>
      BackgroundWorkRowSchema.parse({
        relevanceLevel: 0,
        organism: "test",
        sources: [],
        workSummary: "test",
      })
    ).toThrow();

    expect(() =>
      BackgroundWorkRowSchema.parse({
        relevanceLevel: 6,
        organism: "test",
        sources: [],
        workSummary: "test",
      })
    ).toThrow();
  });
});

describe("BackgroundWork", () => {
  it("accepts valid background work", () => {
    const work = {
      rows: [
        {
          relevanceLevel: 4,
          organism: "Influenza A",
          sources: ["epmc1"],
          workSummary: "Co-authored paper on H5N1 pathogenesis",
        },
      ],
    };
    expect(BackgroundWorkSchema.parse(work).rows).toHaveLength(1);
  });

  it("accepts empty rows array", () => {
    expect(BackgroundWorkSchema.parse({ rows: [] }).rows).toHaveLength(0);
  });
});

// --- CompleteData ---

describe("CompleteData", () => {
  it("accepts a valid complete data object", () => {
    const data = {
      decision: {
        status: "PASS" as const,
        flagCount: 0,
        summary: "All criteria passed",
        reasons: [],
      },
      checks: [
        {
          criterion: "Customer Institutional Affiliation" as const,
          status: "NO FLAG" as const,
          evidence: "Found on staff directory",
          sources: ["web1"],
        },
      ],
      backgroundWork: [
        {
          relevance: 5,
          organism: "E. coli",
          summary: "Published cloning protocol",
          sources: ["epmc1"],
        },
      ],
      audit: {
        toolCalls: [{ tool: "search_web", args: { query: "MIT" }, duration: 1200 }],
        raw: {
          verification: "## Verification\n\n...",
          work: "## Work\n\n...",
        },
      },
    };
    const parsed = CompleteDataSchema.parse(data);
    expect(parsed.decision.status).toBe("PASS");
    expect(parsed.checks).toHaveLength(1);
    expect(parsed.backgroundWork).toHaveLength(1);
  });

  it("accepts null backgroundWork", () => {
    const data = {
      decision: {
        status: "FLAG" as const,
        flagCount: 1,
        summary: "Sanctioned entity",
        reasons: [],
      },
      checks: [],
      backgroundWork: null,
      audit: {
        toolCalls: [],
        raw: { verification: "text", work: null },
      },
    };
    const parsed = CompleteDataSchema.parse(data);
    expect(parsed.backgroundWork).toBeNull();
    expect(parsed.audit.raw.work).toBeNull();
  });

  it("rejects missing decision", () => {
    expect(() =>
      CompleteDataSchema.parse({
        checks: [],
        backgroundWork: null,
        audit: { toolCalls: [], raw: { verification: "", work: null } },
      })
    ).toThrow();
  });

  it("rejects decision with string status instead of enum", () => {
    expect(() =>
      CompleteDataSchema.parse({
        decision: { status: "maybe", flagCount: 0, summary: "x", reasons: [] },
        checks: [],
        backgroundWork: null,
        audit: { toolCalls: [], raw: { verification: "", work: null } },
      })
    ).toThrow();
  });
});

// --- ToolResult ---

describe("ToolResult", () => {
  it("accepts a valid tool result", () => {
    const result = {
      tool: "search_web",
      query: "MIT biology department",
      items: [
        { url: "https://bio.mit.edu", title: "MIT Biology", content: "..." },
      ],
      metadata: {},
    };
    const parsed = ToolResultSchema.parse(result);
    expect(parsed.tool).toBe("search_web");
    expect(parsed.items).toHaveLength(1);
  });

  it("accepts a tool result with error metadata", () => {
    const result = {
      tool: "search_screening_list",
      query: "ACME Corp",
      items: [],
      metadata: { error: true, message: "API timeout" },
    };
    expect(ToolResultSchema.parse(result).metadata.error).toBe(true);
  });

  it("rejects missing tool field", () => {
    expect(() =>
      ToolResultSchema.parse({ query: "test", items: [], metadata: {} })
    ).toThrow();
  });
});
