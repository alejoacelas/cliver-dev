/**
 * Contract compilation check for P6 (Dual-view UI).
 *
 * Imports every export from @cliver/p6-ui and verifies it satisfies
 * the P0 interface contracts. If this file compiles with
 * `npx tsc --noEmit --project tsconfig.json`, all contracts are met.
 */

// --- P6 exports ---
import {
  CustomerPortal,
  ProviderDashboard,
  ConsentDialog,
  ScreeningTimeline,
  DecisionBadge,
  AuditTrail,
} from "./src/index.js";

import type {
  CustomerPortalProps,
  ProviderDashboardProps,
  ConsentDialogProps,
  ScreeningTimelineProps,
  DecisionBadgeProps,
  AuditTrailProps,
} from "./src/index.js";

// --- P0 types used by P6 ---
import type {
  FormSchema,
  SSEEvent,
  Decision,
  PipelineState,
  PipelineEvent,
  CompleteData,
  CheckOutcome,
  ConsentStatus,
  ViewFilter,
} from "@cliver/contracts";

// --- P1 types used by P6 ---
import type { FieldEvent } from "@cliver/form-engine";

// --- Verify component prop shapes ---

// CustomerPortal accepts FormSchema, SSEEvent[], and callbacks
const _customerPortalProps: CustomerPortalProps = {
  schema: {
    id: "test",
    version: "1",
    title: "Test form",
    fields: [{ id: "name", label: "Name", type: "text" }],
  } satisfies FormSchema,
  screeningId: "scr-001",
  onFieldComplete: (_event: FieldEvent) => {},
  onConsentResponse: (_checkId: string, _granted: boolean) => {},
  events: [
    { type: "status", screeningId: "scr-001", message: "Checking..." } satisfies SSEEvent,
  ],
};

// ProviderDashboard accepts PipelineState[], PipelineEvent records, CompleteData records
const _providerDashboardProps: ProviderDashboardProps = {
  sessions: [
    {
      screeningId: "scr-001",
      status: "running",
      completedFields: ["name"],
      pendingChecks: ["sanctions"],
      runningChecks: ["affiliation"],
      completedChecks: [],
      outcomes: [],
      consentState: {},
      decision: null,
      createdAt: "2026-03-05T10:00:00Z",
      updatedAt: "2026-03-05T10:01:00Z",
    } satisfies PipelineState,
  ],
  auditEvents: {
    "scr-001": [
      {
        type: "check_started",
        screeningId: "scr-001",
        timestamp: "2026-03-05T10:01:00Z",
        checkId: "affiliation",
      } satisfies PipelineEvent,
    ],
  },
  completeDataMap: {},
};

// ConsentDialog accepts action string and callbacks
const _consentDialogProps: ConsentDialogProps = {
  action: "Run sanctions screening",
  onConsent: () => {},
  onDeny: () => {},
};

// ScreeningTimeline accepts PipelineEvent[]
const _screeningTimelineProps: ScreeningTimelineProps = {
  events: [
    {
      type: "check_started",
      screeningId: "scr-001",
      timestamp: "2026-03-05T10:01:00Z",
      checkId: "affiliation",
    } satisfies PipelineEvent,
  ],
};

// DecisionBadge accepts Decision
const _decisionBadgeProps: DecisionBadgeProps = {
  decision: {
    status: "PASS",
    flagCount: 0,
    summary: "All clear",
    reasons: [],
  } satisfies Decision,
};

// AuditTrail accepts PipelineEvent[]
const _auditTrailProps: AuditTrailProps = {
  entries: [
    {
      type: "pipeline_complete",
      screeningId: "scr-001",
      timestamp: "2026-03-05T10:05:00Z",
      decision: {
        status: "PASS",
        flagCount: 0,
        summary: "All clear",
        reasons: [],
      },
    } satisfies PipelineEvent,
  ],
};

// Verify ViewFilter values used by P6 are valid
const _customerFilter: ViewFilter = "customer";
const _providerFilter: ViewFilter = "provider";

// Verify ConsentStatus values used in PipelineState.consentState
const _consentPending: ConsentStatus = "pending";
const _consentGranted: ConsentStatus = "granted";
const _consentDenied: ConsentStatus = "denied";

// Verify CheckOutcome shape (used in PipelineState.outcomes)
const _checkOutcome: CheckOutcome = {
  checkId: "affiliation",
  status: "pass",
  evidence: "Verified institutional affiliation",
  citations: [],
};

// Verify components are callable (React function components)
const _cp: typeof CustomerPortal = CustomerPortal;
const _pd: typeof ProviderDashboard = ProviderDashboard;
const _cd: typeof ConsentDialog = ConsentDialog;
const _st: typeof ScreeningTimeline = ScreeningTimeline;
const _db: typeof DecisionBadge = DecisionBadge;
const _at: typeof AuditTrail = AuditTrail;

// Suppress unused variable warnings
void [
  _customerPortalProps,
  _providerDashboardProps,
  _consentDialogProps,
  _screeningTimelineProps,
  _decisionBadgeProps,
  _auditTrailProps,
  _cp, _pd, _cd, _st, _db, _at,
  _customerFilter, _providerFilter,
  _consentPending, _consentGranted, _consentDenied,
  _checkOutcome,
];
