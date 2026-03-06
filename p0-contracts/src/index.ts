// ============================================================
// @cliver/contracts — Shared types, schemas, and interfaces
//
// This is the single source of truth for all data shapes in
// the Cliver screening platform. Every other package imports
// from here. This package contains ONLY types, interfaces,
// and Zod schemas — no logic, no implementations.
// ============================================================

// --- Form types ---
export {
  FieldTypeSchema,
  ValidationRuleSchema,
  VisibilityConditionSchema,
  FormFieldSchema,
  FormSchemaSchema,
  type FieldType,
  type ValidationRule,
  type VisibilityCondition,
  type FormField,
  type FormSchema,
} from "./form.js";

// --- Decision types ---
export {
  DecisionStatusSchema,
  DecisionReasonSchema,
  DecisionSchema,
  type DecisionStatus,
  type DecisionReason,
  type Decision,
} from "./decision.js";

// --- Pipeline types ---
export {
  CheckDeclarationSchema,
  CheckOutcomeStatusSchema,
  CheckOutcomeSchema,
  ConsentStatusSchema,
  PipelineStateSchema,
  PipelineEventSchema,
  type CheckDeclaration,
  type CheckOutcomeStatus,
  type CheckOutcome,
  type ConsentStatus,
  type PipelineState,
  type PipelineEvent,
} from "./pipeline.js";

// --- Data types ---
export {
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
  type VerificationCriterion,
  type FlagStatus,
  type EvidenceRow,
  type Evidence,
  type DeterminationRow,
  type Determination,
  type BackgroundWorkRow,
  type BackgroundWork,
  type CompleteDataCheck,
  type AuditToolCall,
  type CompleteDataBackgroundWorkItem,
  type CompleteData,
  type ToolResult,
} from "./data.js";

// --- SSE types ---
export {
  ViewFilterSchema,
  SSEEventSchema,
  type ViewFilter,
  type SSEEvent,
} from "./sse.js";

// --- Auth types ---
export {
  AALSchema,
  UserRoleSchema,
  TokenPayloadSchema,
  SessionSchema,
  ProviderCredentialsSchema,
  PasswordRequirementsSchema,
  type AAL,
  type UserRole,
  type TokenPayload,
  type Session,
  type ProviderCredentials,
  type PasswordRequirements,
} from "./auth.js";

// --- External integration types ---
export {
  SalesforceCredentialsSchema,
  SalesforceRecordSchema,
  EmailMessageSchema,
  EmailTransportSchema,
  type SalesforceCredentials,
  type SalesforceRecord,
  type EmailMessage,
  type EmailTransport,
} from "./integrations.js";

// --- Interfaces ---
export type {
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
} from "./interfaces.js";

// --- Utilities ---
export { toOpenRouterSchema } from "./util.js";
