/**
 * Shared test fixtures for P6 UI tests.
 *
 * Provides canned data (form schemas, pipeline states, events, decisions)
 * that all test files can import.
 */

import type {
  FormSchema,
  PipelineState,
  PipelineEvent,
  SSEEvent,
  Decision,
  CheckOutcome,
  CompleteData,
} from "@cliver/contracts";

// --- Form schema ---

export const testFormSchema: FormSchema = {
  id: "screening-intake",
  version: "1.0",
  title: "Customer screening",
  fields: [
    {
      id: "name",
      label: "Full name",
      type: "text",
      placeholder: "Jane Smith",
      validationRules: [{ type: "required", message: "Name is required" }],
    },
    {
      id: "email",
      label: "Business email",
      type: "email",
      placeholder: "jane@university.edu",
      validationRules: [
        { type: "required", message: "Email is required" },
        { type: "pattern", value: "^[^@]+@[^@]+\\.[^@]+$", message: "Invalid email" },
      ],
    },
    {
      id: "institution",
      label: "Institution",
      type: "text",
      placeholder: "University or company",
    },
    {
      id: "orderDetails",
      label: "Sequence order details",
      type: "textarea",
      placeholder: "Describe the sequence you are ordering",
    },
  ],
};

// --- Decisions ---

export const passDecision: Decision = {
  status: "PASS",
  flagCount: 0,
  summary: "All checks passed. No flags identified.",
  reasons: [],
};

export const flagDecision: Decision = {
  status: "FLAG",
  flagCount: 2,
  summary: "Sanctions match and undetermined affiliation.",
  reasons: [
    { checkId: "sanctions", criterion: "Sanctions and Export Control Screening", detail: "Name matches SDN list entry." },
    { checkId: "affiliation", criterion: "Customer Institutional Affiliation", detail: "Could not verify institutional affiliation." },
  ],
};

export const reviewDecision: Decision = {
  status: "REVIEW",
  flagCount: 1,
  summary: "Email domain could not be verified.",
  reasons: [
    { checkId: "email-domain", criterion: "Email Domain Verification", detail: "Domain not found in institutional registry." },
  ],
};

// --- Check outcomes ---

export const passOutcome: CheckOutcome = {
  checkId: "affiliation",
  status: "pass",
  evidence: "Confirmed affiliation with University of Warwick via ORCID profile.",
  sources: ["orcid1", "web2"],
};

export const flagOutcome: CheckOutcome = {
  checkId: "sanctions",
  status: "flag",
  evidence: "Name matches entry on consolidated sanctions list.",
  sources: ["screen1"],
};

export const undeterminedOutcome: CheckOutcome = {
  checkId: "email-domain",
  status: "undetermined",
  evidence: "Email domain not found in known institutional registries.",
  sources: ["web3"],
};

// --- Pipeline states ---

export const pendingPipelineState: PipelineState = {
  screeningId: "scr-001",
  status: "pending",
  completedFields: [],
  pendingChecks: ["affiliation", "institution-type", "email-domain", "sanctions"],
  runningChecks: [],
  completedChecks: [],
  outcomes: [],
  consentState: {},
  decision: null,
  createdAt: "2026-03-05T10:00:00Z",
  updatedAt: "2026-03-05T10:00:00Z",
};

export const runningPipelineState: PipelineState = {
  screeningId: "scr-001",
  status: "running",
  completedFields: ["name", "email"],
  pendingChecks: ["institution-type", "email-domain"],
  runningChecks: ["affiliation", "sanctions"],
  completedChecks: [],
  outcomes: [],
  consentState: { sanctions: "granted" },
  decision: null,
  createdAt: "2026-03-05T10:00:00Z",
  updatedAt: "2026-03-05T10:01:00Z",
};

export const completedPipelineState: PipelineState = {
  screeningId: "scr-001",
  status: "completed",
  completedFields: ["name", "email", "institution", "orderDetails"],
  pendingChecks: [],
  runningChecks: [],
  completedChecks: ["affiliation", "institution-type", "email-domain", "sanctions"],
  outcomes: [passOutcome, flagOutcome],
  consentState: { sanctions: "granted" },
  decision: flagDecision,
  createdAt: "2026-03-05T10:00:00Z",
  updatedAt: "2026-03-05T10:05:00Z",
};

// --- Pipeline events (for audit trail) ---

export const samplePipelineEvents: PipelineEvent[] = [
  {
    type: "field_completed",
    screeningId: "scr-001",
    timestamp: "2026-03-05T10:00:30Z",
    fieldId: "name",
    fieldValue: "Craig Thompson",
  },
  {
    type: "field_completed",
    screeningId: "scr-001",
    timestamp: "2026-03-05T10:00:45Z",
    fieldId: "email",
    fieldValue: "c.thompson@warwick.ac.uk",
  },
  {
    type: "check_started",
    screeningId: "scr-001",
    timestamp: "2026-03-05T10:01:00Z",
    checkId: "affiliation",
  },
  {
    type: "consent_requested",
    screeningId: "scr-001",
    timestamp: "2026-03-05T10:01:10Z",
    checkId: "sanctions",
    description: "Run sanctions screening against consolidated lists",
  },
  {
    type: "consent_received",
    screeningId: "scr-001",
    timestamp: "2026-03-05T10:01:20Z",
    checkId: "sanctions",
    granted: true,
  },
  {
    type: "check_started",
    screeningId: "scr-001",
    timestamp: "2026-03-05T10:01:25Z",
    checkId: "sanctions",
  },
  {
    type: "check_completed",
    screeningId: "scr-001",
    timestamp: "2026-03-05T10:02:00Z",
    checkId: "affiliation",
    outcome: passOutcome,
  },
  {
    type: "check_completed",
    screeningId: "scr-001",
    timestamp: "2026-03-05T10:03:00Z",
    checkId: "sanctions",
    outcome: flagOutcome,
  },
  {
    type: "pipeline_complete",
    screeningId: "scr-001",
    timestamp: "2026-03-05T10:05:00Z",
    decision: flagDecision,
  },
];

// --- SSE events (for streaming simulation) ---

export const customerSSEEvents: SSEEvent[] = [
  { type: "status", screeningId: "scr-001", message: "Checking your information..." },
  { type: "consent_request", screeningId: "scr-001", checkId: "sanctions", description: "Run sanctions screening against consolidated lists" },
  { type: "status", screeningId: "scr-001", message: "Screening in progress..." },
  {
    type: "complete",
    screeningId: "scr-001",
    data: {
      decision: passDecision,
      checks: [],
      backgroundWork: null,
      audit: { toolCalls: [], raw: { verification: "", work: null } },
    },
  },
];

export const providerSSEEvents: SSEEvent[] = [
  { type: "status", screeningId: "scr-001", message: "Starting checks..." },
  { type: "tool_call", screeningId: "scr-001", tool: "search_web", args: { query: "Craig Thompson Warwick" } },
  { type: "tool_result", screeningId: "scr-001", tool: "search_web", id: "web1", count: 5 },
  { type: "tool_call", screeningId: "scr-001", tool: "get_orcid_profile", args: { orcid: "0000-0001-9248-9365" } },
  { type: "tool_result", screeningId: "scr-001", tool: "get_orcid_profile", id: "orcid1", count: 1 },
  { type: "status", screeningId: "scr-001", message: "Analyzing results..." },
];

// --- Complete data (for provider view) ---

export const sampleCompleteData: CompleteData = {
  decision: flagDecision,
  checks: [
    {
      criterion: "Customer Institutional Affiliation",
      status: "NO FLAG",
      evidence: "Confirmed via ORCID and university website.",
      sources: ["orcid1", "web2"],
    },
    {
      criterion: "Institution Type and Biomedical Focus",
      status: "NO FLAG",
      evidence: "University of Warwick has established biomedical research programs.",
      sources: ["web3"],
    },
    {
      criterion: "Email Domain Verification",
      status: "NO FLAG",
      evidence: "warwick.ac.uk is the official domain for University of Warwick.",
      sources: ["web4"],
    },
    {
      criterion: "Sanctions and Export Control Screening",
      status: "FLAG",
      evidence: "Name matches entry on the SDN consolidated list.",
      sources: ["screen1"],
    },
  ],
  backgroundWork: [
    {
      relevance: 5,
      organism: "SARS-CoV-2",
      summary: "Published research on spike protein characterization.",
      sources: ["orcid1"],
    },
  ],
  audit: {
    toolCalls: [
      { tool: "search_web", args: { query: "Craig Thompson Warwick" }, duration: 1200 },
      { tool: "get_orcid_profile", args: { orcid: "0000-0001-9248-9365" }, duration: 800 },
      { tool: "search_screening_list", args: { name: "Craig Thompson" }, duration: 2100 },
    ],
    raw: {
      verification: "Full verification analysis text...",
      work: "Background work analysis text...",
    },
  },
};

// --- Multiple sessions for provider dashboard ---

export function generateSessions(count: number): PipelineState[] {
  const statuses: PipelineState["status"][] = ["pending", "running", "completed", "failed"];
  const names = ["Alice Chen", "Bob Johnson", "Carol Martinez", "David Kim", "Eva Petrov"];

  return Array.from({ length: count }, (_, i) => ({
    screeningId: `scr-${String(i + 1).padStart(3, "0")}`,
    status: statuses[i % statuses.length],
    completedFields: i % 4 >= 2 ? ["name", "email", "institution"] : ["name"],
    pendingChecks: i % 4 === 0 ? ["affiliation", "sanctions"] : [],
    runningChecks: i % 4 === 1 ? ["affiliation"] : [],
    completedChecks: i % 4 >= 2 ? ["affiliation", "sanctions"] : [],
    outcomes: i % 4 >= 2 ? [passOutcome] : [],
    consentState: {},
    decision: i % 4 === 2 ? passDecision : i % 4 === 3 ? flagDecision : null,
    createdAt: new Date(2026, 2, 5, 10, i).toISOString(),
    updatedAt: new Date(2026, 2, 5, 10, i + 5).toISOString(),
  }));
}
