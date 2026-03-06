# Adversarial audit: p0-contracts

Audit of `@cliver/contracts` against `prototypes.md`, `design.md`, and the existing codebase at `~/code/cliver/tool/`.

---

## 1. Naming mismatches with existing codebase

The existing code uses snake_case field names in its JSON schemas. P0 uses camelCase. The `data.ts` file acknowledges this ("conversion happens at the boundary") but never defines what that boundary is, who owns it, or what function performs the conversion. This will cause silent data corruption the moment `extractStructured()` returns `evidence_summary` and someone tries to read `.evidenceSummary`.

**Specific fields affected:**
- `evidence_summary` (existing) vs `evidenceSummary` (p0-contracts `EvidenceRowSchema`)
- `relevance_level` (existing) vs `relevanceLevel` (p0-contracts `BackgroundWorkRowSchema`)
- `work_summary` (existing) vs `workSummary` (p0-contracts `BackgroundWorkRowSchema`)
- `flags_count` (existing `computeDecision()`) vs `flagCount` (p0-contracts `DecisionSchema`)

**Recommendation:** Define an explicit adapter function in P0 (e.g., `fromSnakeCase`) or pick one convention and document it. The current approach silently defers this to whoever integrates first.

---

## 2. `CompleteData` has two incompatible schemas for the same concepts

`CompleteDataCheckSchema` uses `{ criterion, status, evidence, sources }` where `status` is `FlagStatus` ("FLAG" | "NO FLAG" | "UNDETERMINED").

`CheckOutcomeSchema` uses `{ checkId, status, evidence, sources }` where `status` is `CheckOutcomeStatus` ("pass" | "flag" | "undetermined" | "error").

These represent the same underlying thing (a check result) but with different field names (`criterion` vs `checkId`), different enum values (uppercase vs lowercase, "NO FLAG" vs "pass"), and different optional fields. A downstream consumer looking at P0's exports will see two check-result types and have no idea which one to use where.

**Recommendation:** Either unify these or add explicit doc comments explaining that `CompleteDataCheck` is the *display* shape (what the UI renders) and `CheckOutcome` is the *pipeline* shape (what the orchestrator produces). Better yet, define a mapping function in P3.

---

## 3. `VisibilityCondition` is missing operators from the spec

`prototypes.md` line 137 specifies these operators: `equals`, `notEquals`, `in`, `filled`.

P0 implements: `equals`, `notEquals`, `contains`, `exists`.

- `in` (value is one of a list) is missing. `contains` does something different (substring match or array inclusion, ambiguous).
- `filled` (field has any non-empty value) was renamed to `exists`, which is fine but undocumented.

**Recommendation:** Add `in` operator. Clarify whether `contains` means "string contains substring" or "array includes value"---the schema accepts `z.unknown()` for the value so there's no type-level hint.

---

## 4. `ICompletionProvider` is too loosely typed

```typescript
completeWithTools(prompt: string, model: string, tools?: unknown[]): Promise<{ text: string; toolCalls: unknown[] }>;
extractStructured(context: string, extractionPrompt: string, schema: unknown, model: string): Promise<unknown>;
```

The return type of `extractStructured` is `Promise<unknown>`, which means every caller must cast or validate. The `tools` parameter is `unknown[]`. The `toolCalls` in the return is `unknown[]`. This interface provides almost no type safety---it's barely better than `any`.

The existing `openrouter.ts` has concrete types (`RawToolCall`, `CompletionResult`) that are more useful. P0 should either import those shapes or define equivalent ones.

**Recommendation:** Define `ToolDefinition`, `ToolCallResult`, and a generic `extractStructured<T>(... schema: ZodType<T>): Promise<T>` signature. The whole point of a contracts package is to avoid `unknown`.

---

## 5. `ICompletionProvider` is missing the callback signatures

The existing `completeWithTools()` accepts `onToolCall` and `onToolResult` callbacks for real-time streaming. The P0 interface drops these entirely. P5 (SSE) and P6 (UI) depend on these callbacks to emit `tool_call` and `tool_result` SSE events. Without them, the provider dashboard can't show live tool execution.

**Recommendation:** Add optional callback parameters or define a streaming variant of the interface.

---

## 6. `IStorageLayer` is too narrow for P8

P8's spec (line 560-618) defines REST endpoints for sessions, field values, checks, decisions, consent records, audit events, form schemas, provider users, and customers---9 entity types.

`IStorageLayer` only covers screenings and outcomes---2 entity types. It has no methods for:
- User/customer CRUD
- Consent record storage
- Audit event persistence (this is `IAuditLogger` but that takes `PipelineEvent`, not the persistence-specific audit event shape from P8)
- Form schema versioning
- Field value storage

**Recommendation:** Either expand `IStorageLayer` to cover P8's needs, or acknowledge that P8 will define its own storage interface and remove the pretense that `IStorageLayer` is shared.

---

## 7. `SSEEvent` has inconsistent `screeningId` presence

Some SSE event variants include `screeningId` (consent_request, action_proposed, field_event) and some don't (status, tool_call, tool_result, delta, complete, error). But every SSE event is scoped to a screening session. The existing events from the original codebase didn't need it because there was only one pipeline per connection. With the new architecture (P5 event bus, multiple subscribers), every event needs a session identifier.

**Recommendation:** Add `screeningId` to all SSE event variants, or add it as a transport-level wrapper (`{ screeningId, event: SSEEvent }`).

---

## 8. `PipelineEvent` and `SSEEvent` overlap without a clear relationship

`PipelineEvent` has event types: `field_completed`, `check_started`, `check_completed`, `consent_requested`, `consent_received`, `action_proposed`, `pipeline_complete`, `error`.

`SSEEvent` has event types: `status`, `tool_call`, `tool_result`, `delta`, `complete`, `error`, `consent_request`, `action_proposed`, `field_event`.

These partially overlap (`error`, `action_proposed`) but with different shapes. `consent_requested` (pipeline) vs `consent_request` (SSE) are slightly different names for presumably the same thing. There's no defined mapping between the two.

P5 (event routing) needs to convert `PipelineEvent` to `SSEEvent` for different view filters, but the contracts don't define that transformation.

**Recommendation:** Either make `SSEEvent` a superset of `PipelineEvent` (so pipeline events *are* SSE events), or define an explicit `PipelineEvent -> SSEEvent` mapping type.

---

## 9. Session timeout values contradict the spec

`auth.ts` line 53 says:
> AAL1: 30-minute inactivity timeout, 12-hour overall timeout.

`prototypes.md` line 361 says:
> Session timeout: maximum 30 days.

`design.md` line 96 says:
> Maximum 24-hour overall timeout, 1-hour inactivity timeout.

The design doc's 24h/1h is for *providers* (AAL2), which matches. But for *customers* (AAL1), the auth.ts comment says 12 hours while prototypes.md says 30 days. These are wildly different values. The actual timeout enforcement lives in P4, not P0, but the doc comment in the contracts package is the one implementers will read first.

**Recommendation:** Pick one and update the others. 30 days overall / 30 minutes inactivity for AAL1 seems like the intent (prototypes.md line 361). Fix the comment.

---

## 10. `PasswordRequirements` doesn't enforce its own invariant

The schema allows `maxLength < minLength`:

```typescript
minLength: z.number().int().min(1),
maxLength: z.number().int().min(1),
```

A `{ minLength: 64, maxLength: 8 }` object parses successfully. Zod supports `.refine()` for cross-field validation.

**Recommendation:** Add `.refine(d => d.maxLength >= d.minLength, ...)`.

---

## 11. Email fields have no format validation

`EmailMessageSchema` accepts any string for `to` and `from`. `TokenPayloadSchema` accepts any string for `email`. `ProviderCredentialsSchema` accepts any string for `email`.

Zod has `z.string().email()` built in. For a contracts package that's supposed to enforce shapes at system boundaries, accepting `""` or `"not-an-email"` as a valid email undermines the point.

**Recommendation:** Use `z.string().email()` for email fields, or document why you intentionally don't (e.g., to allow pre-validation flexibility).

---

## 12. `instanceUrl` has no URL validation

`SalesforceCredentialsSchema` accepts any string for `instanceUrl`. A value like `"hello"` parses fine. Use `z.string().url()`.

---

## 13. Timestamps are unvalidated strings

`PipelineState.createdAt`, `PipelineState.updatedAt`, `Session.createdAt`, `Session.expiresAt`, `Session.lastActivity`, and all `PipelineEvent.timestamp` fields are `z.string()` with no format constraint. They're documented as ISO 8601 but will accept `"banana"`.

Zod has `z.string().datetime()` for ISO 8601 validation.

**Recommendation:** Use `z.string().datetime()`, or define a `TimestampSchema = z.string().datetime()` and reuse it.

---

## 14. `FormSchema` doesn't validate field ID uniqueness

`prototypes.md` line 128: "Rejects duplicate field IDs." The `FormSchemaSchema` uses `z.array(FormFieldSchema).min(1)` with no uniqueness check. Two fields with `id: "name"` would parse successfully.

**Recommendation:** Add `.refine(fields => new Set(fields.map(f => f.id)).size === fields.length, "Duplicate field IDs")`.

---

## 15. `FormSchema` doesn't validate `visibleWhen` references

`prototypes.md` line 129: "Rejects `visibleWhen` referencing nonexistent field." The schema has no such validation. A field can reference `visibleWhen: [{ field: "doesnt_exist", operator: "equals", value: "x" }]` and it will parse fine.

**Recommendation:** Add a `.refine()` on `FormSchemaSchema` that checks all `visibleWhen.field` references point to existing field IDs. Also check for circular dependencies (line 138: "Circular dependency detection throws at parse time").

---

## 16. No `"skipped"` consent status

The consent flow supports deny (prototypes.md line 198: "After `deny()`, check is marked skipped"). But `ConsentStatusSchema` only has `"pending" | "granted" | "denied"`. There's no `"skipped"` or `"expired"` status. Prototypes.md line 199 also mentions consent timeout marking action as expired.

**Recommendation:** Add `"expired"` to `ConsentStatusSchema`. Whether `"skipped"` is a consent status or a check status is a design decision, but it needs to live somewhere.

---

## 17. `toOpenRouterSchema` only sets `additionalProperties: false` at the top level

The function checks for `additionalProperties` at the root object but doesn't recurse into nested objects. OpenRouter strict mode requires `additionalProperties: false` on *every* object in the schema. A schema like `z.object({ nested: z.object({ a: z.string() }) })` will have strict at the top level but not on the nested object.

**Recommendation:** Recursively set `additionalProperties: false` on all object types in the schema tree, or verify that `zod-to-json-schema` with `target: "openApi3"` already does this.

---

## 18. No versioning or migration story

`FormSchemaSchema` has a `version` field, but there's no schema versioning for the contracts themselves. When `CheckOutcomeSchema` gains a new field next month, every prototype that imports it will break simultaneously. There's no compatibility strategy (semver, feature flags, optional fields with defaults).

**Recommendation:** This is fine for prototyping but should be acknowledged. Add a note in the README or EXPLANATION.md about the breaking-change strategy for when prototypes start depending on specific schema shapes.

---

## 19. `IEventEmitter.subscribe` returns a sync unsubscribe but `emit` is async

```typescript
emit(event: PipelineEvent): Promise<void>;
subscribe(filter, listener): () => void;  // sync unsubscribe
```

The listener callback is also sync: `(event: PipelineEvent) => void`. If a subscriber needs to do async work (e.g., write to a database, forward over SSE), they can't await inside the listener. This forces fire-and-forget patterns and swallowed errors.

**Recommendation:** Make the listener async: `(event: PipelineEvent) => void | Promise<void>`.

---

## 20. `zod-to-json-schema` is a runtime dependency in a "no logic" package

The package description says "no logic, no implementations" but it ships a utility function (`toOpenRouterSchema`) that performs non-trivial schema conversion. This also pulls in `zod-to-json-schema` as a production dependency.

This is a pragmatic choice (avoiding duplication across P3/P8), but it contradicts the stated constraint. Either own the contradiction or move `toOpenRouterSchema` to P3 where it belongs.

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | High | snake_case/camelCase mismatch with existing codebase, no adapter |
| 2 | High | Two incompatible check-result types (`CompleteDataCheck` vs `CheckOutcome`) |
| 3 | Medium | Missing `in` operator for visibility conditions |
| 4 | High | `ICompletionProvider` uses `unknown` everywhere, defeats purpose of contracts |
| 5 | High | `ICompletionProvider` missing streaming callbacks needed by P5/P6 |
| 6 | High | `IStorageLayer` covers 2 of 9 entity types needed by P8 |
| 7 | Medium | Inconsistent `screeningId` on SSE events |
| 8 | Medium | `PipelineEvent` / `SSEEvent` overlap with no defined mapping |
| 9 | Low | Session timeout comment contradicts prototypes.md |
| 10 | Low | `PasswordRequirements` allows maxLength < minLength |
| 11 | Medium | No email format validation on email fields |
| 12 | Low | No URL validation on `instanceUrl` |
| 13 | Medium | Timestamps accept any string, not ISO 8601 |
| 14 | Medium | No field ID uniqueness validation in `FormSchema` |
| 15 | Medium | No `visibleWhen` reference validation or cycle detection |
| 16 | Low | Missing `expired` consent status |
| 17 | Medium | `toOpenRouterSchema` doesn't recurse `additionalProperties: false` |
| 18 | Low | No versioning/migration story for contract changes |
| 19 | Low | Sync listener on async event emitter |
| 20 | Low | Utility function contradicts "no logic" constraint |
