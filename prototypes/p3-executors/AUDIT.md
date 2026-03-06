# P3 check executors + AI layer: adversarial audit

Audited: 2026-03-05
Auditor: Claude Opus 4.6 (adversarial mode)
Scope: `/Users/alejo/code/cliver/dev/p3-executors/` compared against P0 contracts, prototypes.md spec, design.md, and existing codebase.

---

## Findings

### 1. Screening list API URL and authentication scheme differ from existing codebase

**Severity: High**

The existing codebase (`/Users/alejo/code/cliver/tool/server/tools/screening-list.ts`) uses:
- URL: `https://data.trade.gov/consolidated_screening_list/v1`
- Auth: `subscription-key` query parameter

P3 (`/Users/alejo/code/cliver/dev/p3-executors/src/screening-list.ts`, lines 15, 51-52) uses:
- URL: `https://api.trade.gov/gateway/v2/consolidated_screening_list/search`
- Auth: `Ocp-Apim-Subscription-Key` header
- Also: search parameter changed from `name` to `q`

These are different ITA API versions. The v2 gateway endpoint may be the correct migration target (ITA has deprecated v1), but this is undocumented in the prototype. If the API key is absent, P3 silently proceeds without it (line 51: `if (apiKey)`) and gets empty results instead of errors, which masks misconfiguration.

**Recommendation:** Document the API version migration. If v2 truly works without a key for some queries, test and document that explicitly. If not, the silent failure path will cause false negatives in screening---a compliance risk.

### 2. Screening list silently returns empty results on API errors

**Severity: High**

In `/Users/alejo/code/cliver/dev/p3-executors/src/screening-list.ts`, `searchSingle()` (lines 58-73) returns `[]` on any HTTP error or non-JSON response. The executor then maps empty results to `status: "pass"` (line 140-144), meaning "No matches found."

A network failure, rate limit, or API misconfiguration produces the same outcome as "customer is not sanctioned." For a compliance tool, this is a critical failure mode. The executor should return `status: "error"` or `status: "undetermined"` when the API is unreachable.

The existing codebase had the same problem, but the prototype was an opportunity to fix it.

**Recommendation:** Propagate API errors to the executor. Return `status: "undetermined"` with error metadata when the API fails, rather than treating failure as "pass."

### 3. `searchOrcidWorks` function entirely missing

**Severity: Medium**

The existing codebase (`/Users/alejo/code/cliver/tool/server/tools/orcid.ts`) exposes `searchOrcidWorks(orcidId, keywords)` which searches a researcher's publications by keyword. The existing registry (`/Users/alejo/code/cliver/tool/server/tools/registry.ts`) includes `search_orcid_works` as a tool. The prototypes.md spec (line 278) calls for "Works search with keyword filtering."

P3 implements `getOrcidProfile` but omits `searchOrcidWorks` entirely. The tool registry (`/Users/alejo/code/cliver/dev/p3-executors/src/registry.ts`) does not include it. The index.ts exports don't mention it.

**Recommendation:** Implement `searchOrcidWorks` and register it as a tool. This is a spec requirement.

### 4. EPMC executor drops lite mode parsing

**Severity: Medium**

The existing codebase (`/Users/alejo/code/cliver/tool/server/tools/epmc.ts`, lines 40-55, 112-114) has two parsers: `parseArticleLite` (returns matching authors with affiliation details) and `parseArticleFull`. The mode selection determines which parser is used.

P3 (`/Users/alejo/code/cliver/dev/p3-executors/src/epmc.ts`, line 110) always uses `parseArticleFull` regardless of mode. The `mode` parameter still affects `maxResults` (25 vs 5) but not parsing. The lite mode's author-matching logic---which was useful for identifying the specific author among co-authors---is completely absent.

**Recommendation:** Restore the lite mode parser from the existing codebase, or deliberately document why it was dropped.

### 5. `OpenRouterProvider.completeWithTools` cannot execute tools

**Severity: High**

The `OpenRouterProvider` class method (`/Users/alejo/code/cliver/dev/p3-executors/src/openrouter.ts`, lines 203-214) delegates to the standalone `completeWithTools` function but does not pass a `toolExecutor` argument. The standalone function (line 93-95) falls back to returning `{ error: "No executor registered for tool: <name>" }` when no executor is provided.

This means `OpenRouterProvider.completeWithTools()` can never actually execute tools---it will always report "no executor registered." The `ICompletionProvider` interface doesn't include `toolExecutor` in its signature, which means there's no way to make the class method work with real tools without either:
1. Breaking the P0 interface contract (adding a parameter), or
2. Injecting the executor at construction time

The standalone `completeWithTools` function works fine because it accepts `toolExecutor` as a 5th parameter, but this parameter is outside the P0 contract.

**Recommendation:** Accept a `toolExecutor` in the `OpenRouterProvider` constructor and use it in the class method. Alternatively, redesign so the registry's `executeTool` is the default executor.

### 6. Prompt templates diverge from existing codebase

**Severity: Medium**

Comparing `/Users/alejo/code/cliver/dev/p3-executors/src/prompts.ts` against `/Users/alejo/code/cliver/tool/server/prompts.ts`:

- **EXTRACTION_PROMPT_EVIDENCE** (P3 line 53): uses `evidenceSummary` (camelCase), existing codebase uses `evidence_summary` (snake_case). P0's `EvidenceRowSchema` uses `evidenceSummary`. This is intentional per the P0 note "P3 is responsible for converting snake_case API responses to camelCase shapes." However, the extraction prompt tells the AI to produce `evidenceSummary`, which then must match the Zod schema. If the AI is instructed to produce camelCase but the existing prompts used snake_case, the AI training data may be more familiar with the snake_case field names, potentially reducing extraction accuracy.

- **EXTRACTION_PROMPT_EVIDENCE** is missing the "Tool ID mapping reference" section that exists in the original (lines 56-59 of existing). This helps the AI understand what the citation IDs mean.

- **EXTRACTION_PROMPT_WORK** (P3 line 70): uses `relevanceLevel` and `workSummary` (camelCase), existing uses `relevance_level` and `work_summary`. Same note applies.

- **SUMMARY_PROMPT** (P3 lines 82-99): Missing the note about "Prior laboratory work with controlled agents or sequences of concern is not by itself a reason to flag." This is a substantive screening guidance omission.

**Recommendation:** Restore the Tool ID mapping references and the controlled-agents note from the existing prompts. The camelCase field names are a deliberate choice but should be tested against real extraction accuracy.

### 7. SecureDNA executor throws instead of returning error CheckOutcome

**Severity: Medium**

In `/Users/alejo/code/cliver/dev/p3-executors/src/secure-dna.ts`, lines 33-41, invalid sequences cause `throw new Error(...)` rather than returning a `CheckOutcome` with `status: "error"`. Every other executor wraps errors in a try/catch and returns a proper `CheckOutcome`.

The spec (prototypes.md lines 282-283) says "Invalid sequence format throws validation error" and "Empty sequence throws." However, the `ICheckExecutor.execute()` contract returns `Promise<CheckOutcome>`, and all other executors consistently return error outcomes rather than throwing. Callers of `ICheckExecutor` may not expect thrown errors.

The tests (`/Users/alejo/code/cliver/dev/p3-executors/src/secure-dna.test.ts`, lines 24-31) explicitly test for `rejects.toThrow`, confirming this is deliberate---but it's inconsistent with the other 4 executors.

**Recommendation:** Return `status: "error"` CheckOutcome for validation failures instead of throwing, matching the pattern of all other executors. If throwing is intentional, document that callers must wrap `execute()` in try/catch for this executor specifically.

### 8. WebSearchExecutor always returns "pass" for any results

**Severity: Medium**

In `/Users/alejo/code/cliver/dev/p3-executors/src/web-search.ts`, lines 103-108, the executor returns `status: "pass"` whenever there are results. A web search executor doesn't really make a compliance determination---it gathers data. Returning "pass" implies the check is conclusive, but web search results may contain adverse information.

This is arguably a design issue inherited from the executor pattern: web search is a data-gathering tool, not a compliance check. The `ICheckExecutor` interface forces it into a pass/flag/undetermined/error shape.

**Recommendation:** Consider whether `WebSearchExecutor` should always return `status: "undetermined"` (since it doesn't evaluate the results), or document that "pass" means "data gathered successfully" rather than "compliance check passed."

### 9. Cache has no TTL/expiration mechanism

**Severity: Medium**

`/Users/alejo/code/cliver/dev/p3-executors/src/cache.ts` stores cached responses indefinitely as files. There is no TTL, no size limit, and no invalidation mechanism beyond manually deleting the `.cache/` directory.

The question "Does cache invalidation work?" in the audit scope---the answer is no, there is no cache invalidation at all. For development, this is fine. For any non-development use, stale screening data from cached API responses is a compliance risk.

**Recommendation:** Add TTL-based expiration (check file mtime against a configurable max age). Document that the cache is development-only and must not be used in production.

### 10. Cache key collisions: JSON serialization order dependency

**Severity: Low**

In `/Users/alejo/code/cliver/dev/p3-executors/src/cache.ts`, line 19, the cache key is `SHA-256(JSON.stringify({ namespace, params }))`. `JSON.stringify` is sensitive to object key ordering. Two calls with `{ author: "Smith", topic: "CRISPR" }` vs `{ topic: "CRISPR", author: "Smith" }` produce different cache keys despite being semantically identical.

In practice, the same code paths produce the same key order, so this is unlikely to cause issues. But it's a latent bug.

**Recommendation:** Sort keys before hashing, or accept the limitation and document it.

### 11. `import.meta.dirname` may be undefined

**Severity: Low**

In `/Users/alejo/code/cliver/dev/p3-executors/src/cache.ts`, line 12:
```typescript
const CACHE_DIR = join(import.meta.dirname ?? ".", "..", ".cache");
```

`import.meta.dirname` is a Node.js 21.2+ feature. The fallback `"."` would place the cache at `./../.cache` relative to the current working directory, which changes depending on how the process is invoked. This is not a problem when running via vitest from the project root, but would be in other contexts.

**Recommendation:** Use `fileURLToPath(import.meta.url)` with `dirname()` for broader compatibility.

### 12. `.env` file committed with real API keys

**Severity: High**

`/Users/alejo/code/cliver/dev/p3-executors/.env` contains real `OPENROUTER_API_KEY` and `TAVILY_API_KEY` values. While `.gitignore` lists `.env`, if the dev directory is ever placed under version control or shared, these keys are exposed.

The `.gitignore` is present and correct, but the directory is not a git repo (confirmed). If/when it becomes one, the keys are safe only if `.gitignore` is respected from the start.

**Recommendation:** Replace with `.env.example` containing placeholder values. Ensure real keys are in `.env.local` or sourced from environment.

### 13. Proposer uses hardcoded model and fragile JSON extraction

**Severity: Medium**

In `/Users/alejo/code/cliver/dev/p3-executors/src/proposer.ts`:

- Line 89: Model is hardcoded to `"google/gemini-2.5-flash-preview"` rather than being a parameter. This couples the proposer to a specific model.

- Lines 94-100: JSON extraction uses regex `\[[\s\S]*\]` to find an array in the response. This is fragile---if the model returns nested arrays, text containing brackets, or multiple arrays, the regex will match incorrectly. The `extractStructured` function with a Zod schema would be more reliable.

- Line 109: `Math.random().toString(36).slice(2, 8)` for action IDs is not cryptographically secure. For a compliance tool, predictable action IDs could be a security concern if they're used for authorization.

**Recommendation:** Accept model as a parameter. Use `extractStructured` with a Zod schema for the proposer output instead of regex-based JSON extraction. Use `crypto.randomUUID()` for action IDs.

### 14. Consent classification is overly simplistic

**Severity: Medium**

In `/Users/alejo/code/cliver/dev/p3-executors/src/proposer.ts`, lines 30-47, only `secure_dna` requires consent. The spec (prototypes.md lines 301-304, design.md section 2.3) specifies consent-required actions include:
- Sending a verification email to an institutional contact
- Requesting the customer upload additional documents
- Contacting a third party on the customer's behalf

None of these are represented. The proposer only knows about existing executor check IDs. There's no mechanism for the AI to propose non-executor actions like "send email" or "request document upload."

**Recommendation:** Expand the action type system beyond executor check IDs. The proposer should be able to propose email verification, document requests, etc., each with their own consent classification.

### 15. EPMC executor drops author affiliation details from parsePerson

**Severity: Low**

The existing codebase's `parsePerson` in orcid.ts extracts `external_ids` and `urls` from the ORCID person data. P3's `parsePerson` (`/Users/alejo/code/cliver/dev/p3-executors/src/orcid.ts`, lines 50-65) omits `external_ids` and `urls`.

For KYC screening, external identifiers (Scopus ID, ResearcherID) and researcher URLs can be useful corroborating evidence.

**Recommendation:** Restore the `external_ids` and `urls` extraction.

### 16. Test quality: API-dependent tests silently skip

**Severity: Medium**

Most test files use a pattern like:
```typescript
if (!(await isOpenRouterKeyValid())) return;
```

This means tests silently pass when API keys are missing. In CI, all API-dependent tests would appear to pass while testing nothing. Vitest's `it.runIf()` (used in screening-list.test.ts) is better because it marks tests as skipped.

The inconsistency between `if (!valid) return` (web-search, openrouter, proposer tests) and `it.runIf()` (screening-list tests) means different test files behave differently when keys are absent.

**Recommendation:** Standardize on `it.runIf()` or `describe.runIf()` so skipped tests are visible in test output.

### 17. Streaming not implemented

**Severity: Medium**

The spec (prototypes.md lines 287-288) calls for:
- "Streaming: yields text chunks in order, ends with done"
- "Tool calling: yields tool_call events with correct name and parsed args"

P3's `completeWithTools` makes synchronous (non-streaming) requests to the Responses API. There is no streaming implementation at all. The existing codebase didn't stream either (it used the non-streaming Responses API), but the spec explicitly lists streaming as a test scenario.

**Recommendation:** Either implement streaming or update the spec to clarify that streaming is deferred.

### 18. P0 contracts modified with `zod-to-json-schema` and `toOpenRouterSchema`

**Severity: Medium**

The P0 contracts package now contains `/Users/alejo/code/cliver/dev/p0-contracts/src/util.ts` exporting `toOpenRouterSchema`, which depends on `zod-to-json-schema`. P3 imports this function.

P0's stated purpose is "Types, interfaces, and Zod schemas shared by all prototypes. No logic, no implementations." The `toOpenRouterSchema` function is conversion logic, not a type or schema. This was likely added to serve P3's needs.

The `package.json` for P0 now includes `"zod-to-json-schema": "^3.24.0"` as a production dependency. This is a P3-motivated change to a shared package.

**Recommendation:** This is pragmatic but should be documented. Consider whether `toOpenRouterSchema` belongs in a utility module within P3 rather than in the shared contracts package.

### 19. No `normalizeToolCalls` equivalent

**Severity: Low**

The existing codebase (`/Users/alejo/code/cliver/tool/server/openrouter.ts`, lines 119-137) has `normalizeToolCalls` which converts raw tool calls into a structured audit-friendly format with citation IDs, titles, and URLs. P3 has no equivalent---tool calls are stored as raw `ToolCallResult` objects.

The existing codebase also has `formatForModel` (lines 40-62) which annotates tool results with citation IDs (`[web1]`, `[screen1]`, etc.) before feeding them back to the model. P3 sends raw `JSON.stringify(output)` to the model (line 97), losing the citation ID annotation. This means the model won't produce citation references in its output, breaking the entire citation system that the prompts depend on.

**Severity upgrade: High.** Without citation ID annotation, the model cannot produce `[web1]`, `[screen1]` references that the extraction prompts ask for in EXTRACTION_PROMPT_EVIDENCE and EXTRACTION_PROMPT_WORK.

**Recommendation:** Implement `formatForModel` equivalent that annotates tool results with citation IDs. This is essential for the verification pipeline to produce usable evidence.

### 20. `SCREENING_LIST_API_KEY` inconsistency

**Severity: Low**

The existing codebase uses `SCREENING_LIST_API_KEY`. P3 also uses `SCREENING_LIST_API_KEY` but it's not in the `.env` file. The `.env` file only has `OPENROUTER_API_KEY`, `TAVILY_API_KEY`, and `CACHE_ENABLED`. This means screening list tests that require an API key will always skip/fail.

**Recommendation:** Add `SCREENING_LIST_API_KEY` to `.env.example`.

### 21. WebSearch executor truncates to 500 chars but existing codebase sends full content

**Severity: Low**

In `/Users/alejo/code/cliver/dev/p3-executors/src/web-search.ts`, line 56, snippets are truncated to 500 characters. The existing codebase (`/Users/alejo/code/cliver/tool/server/tools/web-search.ts`, line 33) sends full `content` to the model. The spec says "Truncates excessively long snippets" which P3 addresses, but the snippet is what gets sent to the model via tool results, and 500 chars may be insufficient for the model to extract meaningful evidence.

The existing codebase relies on `chunks_per_source: 5` from Tavily to get multiple content chunks per source. The truncation in P3 applies after Tavily has already chunked, so it may be cutting useful content.

**Recommendation:** Review whether 500 chars is sufficient. The existing codebase sends full content for a reason.

### 22. `extractStructured` has no retry or error recovery

**Severity: Low**

In `/Users/alejo/code/cliver/dev/p3-executors/src/openrouter.ts`, lines 140-171, if the model returns JSON that fails Zod validation, the function throws immediately. There's no retry with a corrective prompt, no partial extraction, no fallback. The spec says "Partially formatted output -> extracts what it can" but P3 does strict-or-fail.

**Recommendation:** Add retry logic: if Zod validation fails, send the error message back to the model with the original context and ask it to correct the output.

### 23. `WebSearchExecutor` maps results to wrong field name

**Severity: Low**

In `/Users/alejo/code/cliver/dev/p3-executors/src/web-search.ts`, line 56, Tavily results are mapped with `snippet` field. The existing codebase uses `content`. The `ToolResult` schema accepts `Record<string, unknown>` for items, so this doesn't fail validation, but downstream consumers expecting `content` will break.

**Recommendation:** Use `content` to match the existing codebase, or document the field name change.

---

## Spec coverage analysis

Checking each test scenario from prototypes.md against implementation:

### Check executors

| Scenario | Status | Notes |
|---|---|---|
| Web search: normalized items | Implemented | Field name changed (snippet vs content) |
| Web search: empty results, API errors, rate limits | Partial | Rate limits not specifically tested |
| Web search: truncates long snippets | Implemented | 500 char limit |
| Screening list: exact match | Implemented | API URL changed from v1 to v2 |
| Screening list: fuzzy matching | Implemented | Via `fuzzy_name: "true"` |
| Screening list: parallel query execution | Implemented | `Promise.all` |
| Screening list: deduplication | Implemented | By name |
| Screening list: no match | Implemented | |
| EPMC: publications with title, authors, DOI, abstract | Implemented | |
| EPMC: lite vs full mode | **Partial** | maxResults differs, but parsing is identical (lite parser dropped) |
| EPMC: author name variant matching | **Missing** | Lite mode parser with `authorNameMatches` dropped |
| EPMC: empty results | Implemented | |
| ORCID: profile found | Implemented | |
| ORCID: profile not found | Implemented | |
| ORCID: works search with keyword filtering | **Missing** | `searchOrcidWorks` not implemented |
| SecureDNA: clean sequence | **Stub** | Always returns undetermined |
| SecureDNA: flagged sequence | **Stub** | Not implemented |
| SecureDNA: invalid format | Implemented | Throws instead of returning error |
| SecureDNA: empty sequence | Implemented | Returns error CheckOutcome |

### AI completion wrapper

| Scenario | Status | Notes |
|---|---|---|
| Streaming: text chunks | **Missing** | No streaming implementation |
| Tool calling: yields tool_call events | Implemented | Via callbacks |
| Agentic loop | Implemented | Multi-iteration tool calling |
| Max iteration limit (20) | Implemented | |
| Model API errors | Implemented | Throws on non-200 |

### Structured extraction

| Scenario | Status | Notes |
|---|---|---|
| Well-formatted -> Zod output | Implemented | |
| Partially formatted -> extracts what it can | **Missing** | Strict-or-fail, no partial extraction |
| Schema validation failure -> typed error | Implemented | Throws ZodError |
| Evidence extraction | Implemented | Prompts present |
| Determination extraction | Implemented | Prompts present |
| Background work extraction | Implemented | Prompts present |

### AI action proposer

| Scenario | Status | Notes |
|---|---|---|
| Flags -> proposes verification email | **Partial** | Can only propose executor-based actions, not email |
| Insufficient evidence -> proposes document request | **Partial** | Same limitation |
| Pre-approved actions | Implemented | But only executor-based |
| Consent-required actions | Implemented | Only secure_dna |
| Empty list when no follow-up | Implemented | |

---

## Summary table

| # | Severity | Finding |
|---|---|---|
| 1 | High | Screening list API URL and auth scheme changed without documentation |
| 2 | High | Screening list returns "pass" on API failures (compliance risk) |
| 3 | Medium | `searchOrcidWorks` function missing (spec requirement) |
| 4 | Medium | EPMC lite mode parser dropped, losing author-matching logic |
| 5 | High | `OpenRouterProvider.completeWithTools` cannot execute tools |
| 6 | Medium | Prompt templates diverge: missing Tool ID mapping and controlled-agents note |
| 7 | Medium | SecureDNA throws instead of returning error CheckOutcome (inconsistent) |
| 8 | Medium | WebSearchExecutor returns "pass" for any results (semantic mismatch) |
| 9 | Medium | Cache has no TTL or invalidation |
| 10 | Low | Cache key order-dependent on JSON serialization |
| 11 | Low | `import.meta.dirname` fallback unreliable |
| 12 | High | `.env` contains real API keys |
| 13 | Medium | Proposer uses hardcoded model and fragile JSON parsing |
| 14 | Medium | Consent classification limited to executor check IDs only |
| 15 | Low | ORCID profile drops external_ids and urls |
| 16 | Medium | API-dependent tests silently pass (inconsistent skip patterns) |
| 17 | Medium | Streaming not implemented (spec requires it) |
| 18 | Medium | P0 contracts modified with logic function (`toOpenRouterSchema`) |
| 19 | **High** | No citation ID annotation in tool results---breaks entire citation system |
| 20 | Low | `SCREENING_LIST_API_KEY` missing from .env |
| 21 | Low | Snippet truncation may reduce model evidence quality |
| 22 | Low | No retry/partial extraction for structured output failures |
| 23 | Low | WebSearch uses `snippet` field instead of `content` |

**High severity: 5 findings** (screening list false passes, provider can't execute tools, missing citation annotation, API keys in env, screening list API change)
**Medium severity: 10 findings**
**Low severity: 8 findings**

### Overall assessment

The prototype successfully implements the structural skeleton: 5 executors conforming to `ICheckExecutor`, an `OpenRouterProvider` conforming to `ICompletionProvider`, a tool registry, prompt templates, and a file-based cache. The contract-check.ts file verifies type-level conformance.

However, there are several functional gaps that would prevent the prototype from producing correct screening results in an end-to-end test:

1. The **citation ID system** (finding 19) is entirely absent, which means the verification prompts asking for `[web1]`, `[screen1]` references will not work. This is the single most impactful omission.

2. The **OpenRouterProvider class** (finding 5) cannot execute tools, making it unusable as an `ICompletionProvider` for the pipeline orchestrator.

3. The **screening list** (findings 1-2) silently converts API failures into "pass" outcomes, which is a compliance hazard.

4. Several spec-required features are missing: ORCID works search, streaming, partial extraction, and non-executor action types in the proposer.
