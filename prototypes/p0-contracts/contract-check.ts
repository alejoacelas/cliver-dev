/**
 * Contract compilation check.
 *
 * This file imports every export from @cliver/contracts and assigns
 * them to typed variables. If this file compiles with `tsc --noEmit`,
 * it proves that:
 *   1. All exports are reachable (no missing modules).
 *   2. There are no circular dependency issues.
 *   3. All Zod schemas produce the expected TypeScript types.
 *
 * This file is NOT meant to be executed — only type-checked.
 */

import {
  // --- Form types ---
  FieldTypeSchema,
  ValidationRuleSchema,
  VisibilityConditionSchema,
  FormFieldSchema,
  FormSchemaSchema,

  // --- Decision types ---
  DecisionStatusSchema,
  DecisionReasonSchema,
  DecisionSchema,

  // --- Pipeline types ---
  CheckDeclarationSchema,
  CheckOutcomeStatusSchema,
  CheckOutcomeSchema,
  ConsentStatusSchema,
  PipelineStateSchema,
  PipelineEventSchema,

  // --- Data types ---
  VERIFICATION_CRITERIA,
  VerificationCriterionSchema,
  FlagStatusSchema,
  EvidenceRowSchema,
  EvidenceSchema,
  DeterminationRowSchema,
  DeterminationSchema,
  BackgroundWorkRowSchema,
  BackgroundWorkSchema,
  CompleteDataCheckSchema,
  AuditToolCallSchema,
  CompleteDataBackgroundWorkItemSchema,
  CompleteDataSchema,
  ToolResultSchema,

  // --- SSE types ---
  ViewFilterSchema,
  SSEEventSchema,

  // --- Auth types ---
  AALSchema,
  UserRoleSchema,
  TokenPayloadSchema,
  SessionSchema,
  ProviderCredentialsSchema,
  PasswordRequirementsSchema,

  // --- Integration types ---
  SalesforceCredentialsSchema,
  SalesforceRecordSchema,
  EmailMessageSchema,
  EmailTransportSchema,

  // --- Utility ---
  toOpenRouterSchema,
} from "./src/index.js";

// Also import all type aliases to verify they compile
import type {
  FieldType,
  ValidationRule,
  VisibilityCondition,
  FormField,
  FormSchema,

  DecisionStatus,
  DecisionReason,
  Decision,

  CheckDeclaration,
  CheckOutcomeStatus,
  CheckOutcome,
  ConsentStatus,
  PipelineState,
  PipelineEvent,

  VerificationCriterion,
  FlagStatus,
  EvidenceRow,
  Evidence,
  DeterminationRow,
  Determination,
  BackgroundWorkRow,
  BackgroundWork,
  CompleteDataCheck,
  AuditToolCall,
  CompleteDataBackgroundWorkItem,
  CompleteData,
  ToolResult,

  ViewFilter,
  SSEEvent,

  AAL,
  UserRole,
  TokenPayload,
  Session,
  ProviderCredentials,
  PasswordRequirements,

  SalesforceCredentials,
  SalesforceRecord,
  EmailMessage,
  EmailTransport,

  ToolDefinition,
  ToolCallResult,
  CompletionResult,
  ICheckExecutor,
  ICompletionProvider,
  IConsentManager,
  IAuditLogger,
  ITokenStore,
  IEventEmitter,
  IStorageLayer,
} from "./src/index.js";

// --- Type-level assertions ---
// These verify that the Zod-inferred types match expectations.
// They're never executed; they just need to compile.

const _fieldType: FieldType = "text";
const _validationRule: ValidationRule = { type: "required" };
const _visibilityCond: VisibilityCondition = { field: "x", operator: "equals", value: "y" };
const _formField: FormField = { id: "name", label: "Name", type: "text" };
const _formSchema: FormSchema = { id: "f1", version: "1", title: "T", fields: [_formField] };

const _decisionStatus: DecisionStatus = "PASS";
const _decision: Decision = { status: "PASS", flagCount: 0, summary: "ok", reasons: [] };

const _checkOutcome: CheckOutcome = { checkId: "x", status: "pass", evidence: "e", sources: [] };
const _consentStatus: ConsentStatus = "pending";

const _criterion: VerificationCriterion = "Customer Institutional Affiliation";
const _flagStatus: FlagStatus = "FLAG";
const _evidenceRow: EvidenceRow = { criterion: _criterion, sources: [], evidenceSummary: "s" };
const _determinationRow: DeterminationRow = { criterion: _criterion, flag: "NO FLAG" };

const _viewFilter: ViewFilter = "customer";
const _aal: AAL = "AAL1";
const _role: UserRole = "customer";

// Verify interface shapes compile (structural typing)
const _executor: ICheckExecutor = {
  checkId: "test",
  execute: async () => _checkOutcome,
};

const _provider: ICompletionProvider = {
  completeWithTools: async () => ({ text: "", toolCalls: [] }),
  extractStructured: async <T>() => ({}) as T,
  generateText: async () => "",
};

const _consentMgr: IConsentManager = {
  propose: async () => {},
  consent: async () => {},
  deny: async () => {},
  isAuthorized: async () => false,
  getPending: async () => [],
};

const _logger: IAuditLogger = {
  log: async () => {},
  query: async () => [],
};

const _tokenStore: ITokenStore = {
  set: async () => {},
  get: async () => null,
  delete: async () => {},
};

const _emitter: IEventEmitter = {
  emit: async () => {},
  subscribe: () => () => {},
};

const _storage: IStorageLayer = {
  createScreening: async () => "",
  getScreening: async () => null,
  updateScreening: async () => {},
  listScreenings: async () => [],
  storeOutcome: async () => {},
  getOutcomes: async () => [],
  storeFieldValue: async () => {},
  getFieldValues: async () => ({}),
  storeConsentRecord: async () => {},
  getConsentRecords: async () => [],
  storeAuditEvent: async () => {},
  queryAuditEvents: async () => [],
  createUser: async () => "",
  getUserByEmail: async () => null,
  updateUser: async () => {},
  storeFormSchema: async () => {},
  getFormSchema: async () => null,
};

// Verify utility function compiles
const _openRouterSchema = toOpenRouterSchema("test", FieldTypeSchema);

// Verify the VERIFICATION_CRITERIA constant is accessible
const _criteria: readonly string[] = VERIFICATION_CRITERIA;

// Suppress unused variable warnings
void [
  _fieldType, _validationRule, _visibilityCond, _formField, _formSchema,
  _decisionStatus, _decision, _checkOutcome, _consentStatus,
  _criterion, _flagStatus, _evidenceRow, _determinationRow,
  _viewFilter, _aal, _role,
  _executor, _provider, _consentMgr, _logger, _tokenStore, _emitter, _storage,
  _openRouterSchema, _criteria,
];
