# Linear walkthrough: `@cliver/contracts`

This document walks through the `p0-contracts` package file by file, in a reading order that builds from foundational types up to the barrel export. The package is a pure contracts layer—Zod schemas, TypeScript types, and interfaces—with no runtime logic beyond one utility function. Every other Cliver package imports from here.

---

## 1. Configuration files

### `package.json`

Declares the package as `@cliver/contracts`. It is `"private": true` (not published to npm) and uses the `"exports"` field to point directly at TypeScript source—no build step, consumers import `.ts` files via bundler module resolution.

```json
{
  "name": "@cliver/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

Dependencies are minimal: `zod` for runtime schema validation and `zod-to-json-schema` for converting Zod schemas into JSON Schema (used by the OpenRouter utility). Dev dependencies are just TypeScript and Vitest.

### `tsconfig.json`

Targets ES2022 with bundler module resolution. `noEmit: true` means TypeScript is only used for type-checking—there is no compiled output. `verbatimModuleSyntax: true` enforces explicit `type` imports, which is why you see `import type { ... }` throughout the codebase.

### `vitest.config.ts`

Runs all `*.test.ts` files under `src/`. No special transforms or plugins.

---

## 2. `src/util.ts` — OpenRouter schema converter

The only file with runtime logic. It converts a Zod schema into the envelope format that OpenRouter's structured output API expects.

```ts
export function toOpenRouterSchema(
  name: string,
  schema: ZodType,
): {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
}
```

It uses `zodToJsonSchema` with `target: "openApi3"` and `$refStrategy: "none"` (inline everything, no `$ref` pointers), strips the `$schema` key, and forces `additionalProperties: false` at the top level for strict mode compliance. This function is used downstream whenever the AI layer needs to request structured output from a model.

---

## 3. `src/decision.ts` — Screening decision types

The smallest schema file. It defines the three possible outcomes of a screening and the structure of a decision object.

```ts
export const DecisionStatusSchema = z.enum(["PASS", "FLAG", "REVIEW"]);
```

- **PASS**: All criteria satisfied, no flags.
- **FLAG**: At least one hard flag (e.g., sanctions match). Requires immediate action.
- **REVIEW**: At least one soft flag (e.g., undetermined affiliation). Requires manual review.

A `Decision` bundles the status with a count of flagged criteria, a summary, and an array of reasons:

```ts
export const DecisionSchema = z.object({
  status: DecisionStatusSchema,
  flagCount: z.number().int().min(0),
  summary: z.string(),
  reasons: z.array(DecisionReasonSchema),
});
```

Each `DecisionReason` links a `checkId` and `criterion` to a human-readable `detail` string. This file is imported by both `data.ts` and `pipeline.ts`, making it a dependency root.

---

## 4. `src/form.ts` — Dynamic intake form schema

Defines the shape of the customer intake form that drives the screening pipeline. The form engine reads these schemas and renders fields with validation and conditional visibility.

Field types cover standard HTML inputs:

```ts
export const FieldTypeSchema = z.enum([
  "text", "email", "textarea", "select", "multiselect",
  "file", "date", "checkbox", "number",
]);
```

Validation rules use a discriminated union on `type`:

```ts
export const ValidationRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("required"), message: z.string().optional() }),
  z.object({ type: z.literal("minLength"), value: z.number().int().min(1), message: z.string().optional() }),
  z.object({ type: z.literal("maxLength"), value: z.number().int().min(1), message: z.string().optional() }),
  z.object({ type: z.literal("pattern"), value: z.string(), message: z.string().optional() }),
  z.object({ type: z.literal("custom"), value: z.string(), message: z.string().optional() }),
]);
```

Visibility conditions control when a field appears. A field is shown only when all conditions are satisfied:

```ts
export const VisibilityConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["equals", "notEquals", "contains", "exists", "in"]),
  value: z.unknown().optional(),
});
```

A `FormField` combines an id, label, type, optional placeholder/description/options, validation rules, and visibility conditions. A `FormSchema` is a versioned, titled collection of at least one field:

```ts
export const FormSchemaSchema = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  fields: z.array(FormFieldSchema).min(1),
});
```

Form field IDs are referenced by `CheckDeclaration.requiredFields` in `pipeline.ts`—this is how the pipeline knows which checks can run based on what the customer has filled out so far.

---

## 5. `src/data.ts` — KYC screening data shapes

The largest schema file. It defines the structured data that the AI extractions produce and the final shape of a completed screening. Imports `DecisionSchema` from `decision.ts`.

### Verification criteria

The four specific checks used in KYC screening:

```ts
export const VERIFICATION_CRITERIA = [
  "Customer Institutional Affiliation",
  "Institution Type and Biomedical Focus",
  "Email Domain Verification",
  "Sanctions and Export Control Screening",
] as const;
```

### Evidence and determinations

`EvidenceRow` links a criterion to source citations and a factual summary. `DeterminationRow` links a criterion to a flag status (`"FLAG" | "NO FLAG" | "UNDETERMINED"`). Both are wrapped in container objects with a `rows` array.

### Background work

`BackgroundWorkRow` describes relevant laboratory work found for a customer or their institution. The `relevanceLevel` (1--5) encodes how closely the work matches:

```ts
export const BackgroundWorkRowSchema = z.object({
  relevanceLevel: z.number().int().min(1).max(5),
  organism: z.string(),
  sources: z.array(z.string()),
  workSummary: z.string(),
});
```

### CompleteData

The full output of a finished screening—what the UI ultimately renders:

```ts
export const CompleteDataSchema = z.object({
  decision: DecisionSchema,
  checks: z.array(CompleteDataCheckSchema),
  backgroundWork: z.array(CompleteDataBackgroundWorkItemSchema).nullable(),
  audit: z.object({
    toolCalls: z.array(AuditToolCallSchema),
    raw: z.object({
      verification: z.string(),
      work: z.string().nullable(),
    }),
  }),
});
```

A comment in the source clarifies the relationship between this and `pipeline.ts`: `CompleteDataCheck` is the **display shape** (criterion-oriented, what the UI renders), while `CheckOutcome` in `pipeline.ts` is the **pipeline shape** (check-oriented, what the orchestrator produces). The decision aggregator in P2 maps between them.

### ToolResult

A normalized output from any tool execution, carrying the tool name, query, result items, and metadata:

```ts
export const ToolResultSchema = z.object({
  tool: z.string(),
  query: z.unknown(),
  items: z.array(z.record(z.string(), z.unknown())),
  metadata: z.record(z.string(), z.unknown()),
});
```

A note at the top of this file states that these schemas use camelCase field names, while the existing extraction APIs (OpenRouter structured outputs) return snake_case. P3 (check executors + AI layer) is responsible for the conversion at the boundary.

---

## 6. `src/pipeline.ts` — Pipeline orchestration types

Defines the state machine for a screening session. Imports `DecisionSchema` from `decision.ts`.

### CheckDeclaration

Declares a check that can be scheduled. The pipeline scheduler uses `requiredFields` to determine when prerequisites are met:

```ts
export const CheckDeclarationSchema = z.object({
  id: z.string(),
  name: z.string(),
  requiredFields: z.array(z.string()),
  needsConsent: z.boolean(),
  description: z.string().optional(),
});
```

### CheckOutcome

The result of executing a single check. Status is lowercase (`"pass" | "flag" | "undetermined" | "error"`), distinct from the uppercase `DecisionStatus` and `FlagStatus` used elsewhere:

```ts
export const CheckOutcomeStatusSchema = z.enum(["pass", "flag", "undetermined", "error"]);
```

### PipelineState

The central state object. Tracks which fields are completed, which checks are pending/running/completed, consent state per check, and the aggregated decision:

```ts
export const PipelineStateSchema = z.object({
  screeningId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  completedFields: z.array(z.string()),
  pendingChecks: z.array(z.string()),
  runningChecks: z.array(z.string()),
  completedChecks: z.array(z.string()),
  outcomes: z.array(CheckOutcomeSchema),
  consentState: z.record(z.string(), ConsentStatusSchema),
  decision: DecisionSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

### PipelineEvent

A discriminated union of 8 event types emitted during execution. These drive both the audit log and real-time UI updates:

- `field_completed` — a form field was submitted
- `check_started` / `check_completed` — check lifecycle
- `consent_requested` / `consent_received` — consent flow
- `action_proposed` — AI proposes a follow-up action
- `pipeline_complete` — final decision is ready
- `error` — something went wrong

All events share a `screeningId` and `timestamp` base.

---

## 7. `src/auth.ts` — Authentication and session types

Defines the auth model, grounded in NIST SP 800-63B-4.

Two assurance levels:

```ts
export const AALSchema = z.enum(["AAL1", "AAL2"]);
```

- **AAL1**: Single-factor (email + password). Used by customers.
- **AAL2**: Multi-factor (password + TOTP or passkey). Used by providers.

Two roles:

```ts
export const UserRoleSchema = z.enum(["customer", "provider"]);
```

`TokenPayload` is the JWT payload used for stateless authorization—contains `userId`, `email`, `role`, `aal`, `iat`, and `exp`.

`Session` tracks server-side session state for enforcing NIST timeout rules: AAL1 gets a 30-day overall timeout; AAL2 gets a 1-hour inactivity timeout and 24-hour overall timeout.

`ProviderCredentials` stores an Argon2id password hash and a Base32-encoded TOTP secret for the second factor.

`PasswordRequirements` encodes the NIST password policy—minimum 15 characters, no composition rules, breached-password blocklist check:

```ts
export const PasswordRequirementsSchema = z.object({
  minLength: z.number().int().min(1),
  maxLength: z.number().int().min(1),
  checkBlocklist: z.boolean(),
});
```

---

## 8. `src/sse.ts` — Server-Sent Events types

Defines the events pushed to clients over SSE during a screening. Imports `CompleteDataSchema` from `data.ts`.

A `ViewFilter` controls which events a client receives:

```ts
export const ViewFilterSchema = z.enum(["customer", "provider", "debug"]);
```

`SSEEvent` is a discriminated union of 9 event types:

| Type | Purpose |
|---|---|
| `status` | Human-readable progress message |
| `tool_call` | AI invoked a tool (name + args) |
| `tool_result` | Tool returned results (tool name, citation id, count) |
| `delta` | Streaming text chunk from the AI |
| `complete` | Final `CompleteData` payload |
| `error` | Error message |
| `consent_request` | Ask customer for permission |
| `action_proposed` | AI proposes a follow-up action |
| `field_event` | Backend acknowledged a form field |

A comment in the source explains the relationship to `PipelineEvent`: P5 (event routing) maps `PipelineEvent`s to `SSEEvent`s, filtering by `ViewFilter`. Not all pipeline events have SSE equivalents, and some SSE events (`delta`, `tool_call`) are emitted directly by the AI layer with no pipeline event counterpart.

---

## 9. `src/integrations.ts` — External service types

Schemas for third-party integrations. No imports from other contract files.

**Salesforce**: `SalesforceCredentials` (OAuth tokens + instance URL) and `SalesforceRecord` (object type, optional external ID, field map). Used to sync screening results back to Salesforce.

**Email**: `EmailMessage` (to, from, subject, text/html body) and `EmailTransport`, a discriminated union supporting SendGrid and AWS SES:

```ts
export const EmailTransportSchema = z.discriminatedUnion("provider", [
  z.object({ provider: z.literal("sendgrid"), apiKey: z.string() }),
  z.object({
    provider: z.literal("ses"),
    region: z.string(),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
  }),
]);
```

---

## 10. `src/interfaces.ts` — Capability interfaces

Pure TypeScript interfaces (no Zod schemas) that downstream packages implement. Imports types from `pipeline.ts`, `auth.ts`, `form.ts`, and `sse.ts`.

**`ICheckExecutor`** — Executes a single screening check. Has a `checkId` and an `execute(fields)` method returning a `CheckOutcome`.

**`ICompletionProvider`** — Abstraction over the AI layer. Three methods:
- `completeWithTools(prompt, model, tools?, callbacks?)` — run a completion with tool use
- `extractStructured<T>(context, extractionPrompt, schema, model)` — extract typed data using a Zod schema
- `generateText(prompt, model)` — generate plain text

**`IConsentManager`** — Tracks customer consent for checks that need permission. Methods: `propose`, `consent`, `deny`, `isAuthorized`, `getPending`.

**`IAuditLogger`** — Records and queries `PipelineEvent`s for compliance.

**`ITokenStore`** — Key-value store with optional TTL for auth tokens, sessions, and short-lived secrets.

**`IEventEmitter`** — Pub/sub for pipeline events. The SSE layer subscribes to relay events to clients. The `subscribe` method accepts a filter (by `screeningId` and/or `ViewFilter`) and returns an unsubscribe function.

**`IStorageLayer`** — The broadest interface. CRUD for screenings, check outcomes, field values, consent records, audit events, users, and form schemas. Designed so prototypes can use in-memory stores for testing. Key methods:

```ts
createScreening(data: Partial<PipelineState>): Promise<string>;
getScreening(id: string): Promise<PipelineState | null>;
storeOutcome(screeningId: string, outcome: CheckOutcome): Promise<void>;
createUser(data: { email: string; passwordHash: string; role: UserRole }): Promise<string>;
getUserByEmail(email: string): Promise<{ id: string; email: string; passwordHash: string; role: UserRole; totpSecret?: string; emailConfirmed?: boolean } | null>;
storeFormSchema(schema: FormSchema): Promise<void>;
getFormSchema(id: string, version?: string): Promise<FormSchema | null>;
```

---

## 11. `src/index.ts` — Barrel export

Re-exports every schema, type, and interface from the package. Organized into labeled sections: Form, Decision, Pipeline, Data, SSE, Auth, External integrations, Interfaces, and Utilities.

The `type` keyword is used on all interface and type re-exports (enforced by `verbatimModuleSyntax`), ensuring they are erased at runtime. The `toOpenRouterSchema` utility is the only value export beyond the Zod schema objects themselves.

---

## 12. Test files

Each schema file has a corresponding `*.test.ts` that validates both the happy path (correct data parses) and the sad path (invalid data throws). The `interfaces.test.ts` file is notable: it creates conforming objects for every interface, serving as a compile-time check that the interfaces are implementable. If the types are internally inconsistent, this file fails to compile before any test runs.

---

## Dependency graph

```
decision.ts  (no internal imports)
form.ts      (no internal imports)
auth.ts      (no internal imports)
integrations.ts (no internal imports)
util.ts      (no internal imports)
    |
    v
data.ts      <-- decision.ts
pipeline.ts  <-- decision.ts
sse.ts       <-- data.ts (CompleteDataSchema)
interfaces.ts <-- pipeline.ts, auth.ts, form.ts, sse.ts
    |
    v
index.ts     <-- everything
```
