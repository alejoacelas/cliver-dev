# Linear walkthrough: @cliver/executors

This document walks through every source file in `p3-executors` in a logical reading order. It covers the cache layer first, then each API executor, then the AI completion layer, and finally the registry and public index.

## Configuration files

### `package.json`

The package is named `@cliver/executors` and depends on `@cliver/contracts` (a sibling package at `../p0-contracts`), `zod` for schema validation, and `zod-to-json-schema` for converting Zod schemas into JSON Schema (used by the OpenRouter provider). It's an ESM package (`"type": "module"`). Tests run via Vitest with a 60-second timeout configured in `vitest.config.ts`.

### `tsconfig.json`

Targets ES2022 with bundler module resolution. `noEmit` is true—this package is consumed as TypeScript source, not compiled to JS. `verbatimModuleSyntax` is enabled, so all imports must use explicit `type` annotations where appropriate.

---

## 1. `src/cache.ts` — File-based API response cache

The foundation layer. Every API executor checks this cache before making network requests.

The cache is opt-in via the `CACHE_ENABLED=true` environment variable. Cache keys are SHA-256 hashes of a namespace string plus the JSON-serialized parameters. Responses are stored as JSON files in a `.cache/` directory at the package root.

```ts
function cacheKey(namespace: string, params: unknown): string {
  const raw = JSON.stringify({ namespace, params });
  return createHash("sha256").update(raw).digest("hex");
}

export function getCached<T>(namespace: string, params: unknown): T | undefined {
  if (!isEnabled()) return undefined;
  const path = cachePath(cacheKey(namespace, params));
  if (!existsSync(path)) return undefined;
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function setCached<T>(namespace: string, params: unknown, value: T): void {
  if (!isEnabled()) return;
  mkdirSync(CACHE_DIR, { recursive: true });
  const path = cachePath(cacheKey(namespace, params));
  writeFileSync(path, JSON.stringify(value, null, 2), "utf-8");
}
```

Every executor calls `getCached` at the top of its function and `setCached` before returning a successful result. This means tests against real APIs can be cached to avoid redundant network calls during development.

---

## 2. `src/web-search.ts` — Tavily web search executor

The first of five API executors. Each executor exports two things: a raw async function that returns a `ToolResult`, and a class implementing `ICheckExecutor` from `@cliver/contracts`.

The raw function `searchWeb` hits the Tavily search API:

```ts
const res = await fetch(TAVILY_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    api_key: apiKey,
    query,
    search_depth: "advanced",
    max_results: 10,
    chunks_per_source: 5,
  }),
});
```

Results are normalized into `{ url, title, snippet }` items. On API errors, it returns an empty `items` array with error metadata rather than throwing—this is a pattern shared across executors.

The `WebSearchExecutor` class wraps this into the `ICheckExecutor` interface, mapping the raw result to a `CheckOutcome` with status `"pass"` (results found), `"undetermined"` (no results), or `"error"` (missing field or API failure).

The test file (`web-search.test.ts`) validates both tiers: the raw function's `ToolResult` shape (validated against `ToolResultSchema` from contracts) and the executor class's `CheckOutcome` behavior, including error handling when `TAVILY_API_KEY` is missing.

---

## 3. `src/screening-list.ts` — US Consolidated Screening List executor

Searches the US government's consolidated screening list for sanctioned entities, denied parties, and restricted organizations. Uses the ITA Data Services Platform API at `api.trade.gov`.

The key design choice: it accepts an array of queries and runs them in parallel:

```ts
export async function searchScreeningList(queries: string[]): Promise<ToolResult> {
  // ...
  const results = await Promise.all(queries.map((q) => searchSingle(q)));
  for (const batch of results) {
    allResults.push(...batch);
  }

  // Deduplicate by name
  const seen = new Set<string>();
  const unique: Record<string, unknown>[] = [];
  for (const entity of allResults) {
    const name = entity.name;
    if (name && !seen.has(name)) {
      seen.add(name);
      unique.push(parseEntity(entity));
    }
  }
  // ...
}
```

Each individual query uses fuzzy name matching (`fuzzy_name: "true"`) and a 30-second timeout with `AbortController`. The API key is sent via the `Ocp-Apim-Subscription-Key` header.

The `ScreeningListExecutor` class inverts the status logic compared to web search: **no matches = pass** (the entity is clean), **matches found = flag**. This is because appearing on a screening list is a negative signal. Tests use "Huawei" as a known sanctioned entity.

---

## 4. `src/epmc.ts` — Europe PubMed Central executor

Searches for scientific publications. Free API, no key required. Supports four search parameters that can be combined with AND:

```ts
function buildQuery(opts: { orcid?: string; author?: string; affiliation?: string; topic?: string }): string {
  const parts: string[] = [];
  if (opts.orcid) parts.push(`AUTHORID:("${clean(opts.orcid)}")`);
  if (opts.author) parts.push(`AUTHOR:("${clean(opts.author)}")`);
  if (opts.affiliation) parts.push(`AFF:(${clean(opts.affiliation)})`);
  if (opts.topic) parts.push(`(${clean(opts.topic)})`);
  return parts.length ? parts.join(" AND ") : "*";
}
```

The `parseArticleFull` function extracts detailed article metadata including nested author lists with ORCID IDs, journal info, and citation counts. Two modes control result count: `"lite"` returns up to 25 results (for broader searches), `"full"` returns up to 5 (with full metadata).

Like web search, the `EpmcExecutor` treats found publications as `"pass"` and no results as `"undetermined"`. Tests use Jennifer Doudna's publications as known-good test data.

---

## 5. `src/orcid.ts` — ORCID profile and works executor

The most complex executor. It has two raw functions: `getOrcidProfile` (full profile) and `searchOrcidWorks` (keyword-filtered publication list).

`getOrcidProfile` fetches four ORCID endpoints in parallel:

```ts
const [personData, worksData, educationData, employmentData] = await Promise.all([
  fetchEndpoint(orcidId, "person"),
  fetchEndpoint(orcidId, "works"),
  fetchEndpoint(orcidId, "educations"),
  fetchEndpoint(orcidId, "employments"),
]);
```

Each endpoint response is parsed by dedicated functions (`parsePerson`, `parseAffiliations`, `parseWorks`) that navigate ORCID's deeply nested JSON structure using a `safeGet` helper. The profile caps at 5 works (`MAX_WORKS_IN_PROFILE`).

`searchOrcidWorks` fetches all works and filters them client-side by keyword matching against title, journal, and type:

```ts
const matching = allWorks.filter(work => {
  const parts = [work.title, work.journal, work.type].filter(Boolean);
  const text = parts.join(" ").toLowerCase();
  return keywordsLower.some(kw => text.includes(kw));
});
```

Both functions return empty `items` with error metadata (rather than throwing) when an ORCID is not found. The `OrcidExecutor` class wraps `getOrcidProfile` only. Tests use Josiah Carberry (`0000-0002-1825-0097`), the canonical ORCID test profile.

---

## 6. `src/secure-dna.ts` — SecureDNA executor (stub)

A placeholder. This executor validates DNA/RNA sequence format and length but always returns `"undetermined"`:

```ts
const VALID_SEQUENCE_PATTERN = /^[ATCGUNatcgun\s]+$/;

// After validation...
return {
  checkId: this.checkId,
  status: "undetermined",
  evidence: "SecureDNA sequence screening is not yet integrated.",
  sources: [],
};
```

It has no raw function, no caching, and no network calls. The validation catches non-nucleotide characters and sequences shorter than 50 characters. This is the only executor that doesn't follow the two-tier pattern (raw function + class)—it's class-only since there's no real API to wrap.

---

## 7. `src/openrouter.ts` — AI completion provider

The AI layer. This file implements `ICompletionProvider` from contracts, wrapping OpenRouter's API with three capabilities: tool-calling completion, structured extraction, and plain text generation.

**Citation annotation** is handled by `formatForModel`, which assigns sequential IDs (like `web1`, `screen2`, `epmc3`) to tool results before feeding them back to the model:

```ts
const TOOL_PREFIXES: Record<string, string> = {
  search_web: "web",
  search_screening_list: "screen",
  search_epmc: "epmc",
  get_orcid_profile: "orcid",
  search_orcid_works: "orcworks",
};

export function formatForModel(
  toolName: string,
  output: ToolResult,
  counters: Record<string, number>,
): { formatted: string; citations: CitationMapping[] } {
  const prefix = TOOL_PREFIXES[toolName] || toolName.slice(0, 4);
  // ...assigns incremental IDs like web1, web2, and wraps results with
  // instruction: "Cite using [id] format (e.g., [web1], [epmc2])."
}
```

**Tool-calling loop** (`completeWithTools`) uses OpenRouter's Responses API. It sends a prompt and tool definitions, receives function call requests, executes them via a `toolExecutor` callback, formats results with citation IDs, and feeds them back. This loops up to 20 iterations until the model produces a text response:

```ts
for (let i = 0; i < maxIterations; i++) {
  const payload: Record<string, unknown> = { model, input: inputItems };
  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = "auto";
  }

  const res = await fetch(RESPONSES_URL, { method: "POST", headers: getHeaders(), body: JSON.stringify(payload) });
  // ...
  const functionCalls = outputItems.filter((item) => item.type === "function_call");
  if (!functionCalls.length) break;

  for (const fc of functionCalls) {
    // Execute tool, format output, push back into inputItems
  }
}
```

**Structured extraction** (`extractStructured`) uses the Chat Completions API with `response_format` for JSON Schema-constrained output. It converts a Zod schema to JSON Schema via `toOpenRouterSchema` (from contracts), gets the model to output conforming JSON, then validates with Zod:

```ts
const responseFormat = toOpenRouterSchema("extraction", schema);
const res = await fetch(CHAT_URL, {
  method: "POST",
  headers: getHeaders(),
  body: JSON.stringify({
    model,
    messages: [{ role: "user", content: `${extractionPrompt}\n\n${context}` }],
    response_format: responseFormat,
  }),
});
// ...
return schema.parse(raw);
```

**`OpenRouterProvider`** is the class wrapper implementing `ICompletionProvider`. It accepts an optional `toolExecutor` in its constructor, which `completeWithTools` uses to resolve tool calls.

Tests cover both error handling (missing/invalid API keys) and real API calls (with `isOpenRouterKeyValid()` gating). The completion model for tool-calling tests is `anthropic/claude-sonnet-4`; extraction tests use `google/gemini-2.5-flash-preview`.

---

## 8. `src/prompts.ts` — Prompt templates

All prompt templates for the KYC screening workflow, using `{{placeholder}}` syntax. There are six prompts:

- **`VERIFICATION_PROMPT`** — The main screening prompt. Instructs the model to evaluate four criteria: customer institutional affiliation, institution type/biomedical focus, email domain verification, and sanctions/export control screening. Specifies FLAG/NO FLAG/UNDETERMINED logic and source standards (must be independent, editorially overseen).

- **`WORK_PROMPT`** — Searches for the customer's laboratory work. Prioritizes by relevance: customer + same organism > customer + related organism > customer + any work > institution work.

- **`EXTRACTION_PROMPT_EVIDENCE`** — Extracts the evidence table (criterion, sources, evidence summary) from the verification report's markdown output.

- **`EXTRACTION_PROMPT_DETERMINATIONS`** — Extracts the flag status table from the verification report.

- **`EXTRACTION_PROMPT_WORK`** — Extracts the work table (relevance level, organism, sources, summary).

- **`SUMMARY_PROMPT`** — Generates a sub-25-word summary. Notes that prior work with controlled agents is not a negative signal.

Template filling is handled by:

```ts
export function fillTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
```

The prompts encode the business logic of the KYC screening process—what constitutes a flag, what sources are acceptable, how to structure the output for downstream structured extraction.

---

## 9. `src/proposer.ts` — AI action proposer

Takes check outcomes and suggests follow-up actions for flagged or undetermined results. This is the "what to do next" AI layer.

The core function `proposeActions` short-circuits immediately if no outcomes are flagged or undetermined:

```ts
const flaggedOrUndetermined = context.outcomes.filter(
  (o) => o.status === "flag" || o.status === "undetermined",
);
if (flaggedOrUndetermined.length === 0) return [];
```

When there are flags, it uses a two-step AI process: first `generateText` to get free-form suggestions, then `extractStructured` to parse them into a typed array using `ProposerOutputSchema`:

```ts
const text = await provider.generateText(prompt, model);
const parsed = await provider.extractStructured(
  text,
  PROPOSER_EXTRACTION_PROMPT,
  ProposerOutputSchema,
  model,
);
```

Each proposed action is classified as pre-approved or consent-required based on the suggested check:

```ts
const PRE_APPROVED_PATTERNS = ["web_search", "screening_list", "epmc_search", "orcid_lookup"];
const CONSENT_REQUIRED_PATTERNS = ["secure_dna"];
```

Pre-approved actions query only public data and can run automatically. Consent-required actions (currently only SecureDNA) need customer approval first. The entire function is wrapped in a try/catch that returns `[]` on any failure—the proposer never crashes the workflow.

Tests use mock `ICompletionProvider` implementations to verify consent classification and error handling without hitting the API.

---

## 10. `src/registry.ts` — Tool registry

Maps tool names to their definitions (for the model) and their executor functions (for runtime). This is the glue between the AI layer and the API executors.

`TOOL_DEFINITIONS` contains OpenRouter-compatible function definitions with descriptions and JSON Schema parameters for all five tools: `search_web`, `search_screening_list`, `search_epmc`, `get_orcid_profile`, and `search_orcid_works`.

`getToolDefinitions` formats these for the Responses API, optionally filtering by name:

```ts
export function getToolDefinitions(toolNames?: string[]): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  for (const [name, spec] of Object.entries(TOOL_DEFINITIONS)) {
    if (toolNames && !toolNames.includes(name)) continue;
    tools.push({ type: "function", name, description: spec.description, parameters: spec.parameters });
  }
  return tools;
}
```

`executeTool` is the runtime dispatcher—a switch statement that routes tool names to executor functions, filtering out empty/null arguments first:

```ts
export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  // ...filter empty args...
  switch (name) {
    case "search_web":
      return searchWeb((filtered.query || "") as string);
    case "search_screening_list":
      return searchScreeningList((filtered.queries || []) as string[]);
    case "search_epmc":
      return searchEpmc(filtered as { orcid?: string; author?: string; affiliation?: string; topic?: string });
    case "get_orcid_profile":
      return getOrcidProfile((filtered.orcid_id || "") as string);
    case "search_orcid_works":
      return searchOrcidWorks((filtered.orcid_id || "") as string, (filtered.keywords || []) as string[]);
    default:
      return { tool: name, query: args, items: [], metadata: { error: true, message: `Unknown tool: ${name}` } };
  }
}
```

This is the function you'd pass as `toolExecutor` to `OpenRouterProvider`—connecting the model's tool calls to real API requests.

---

## 11. `src/index.ts` — Public API

The barrel export file. Organizes all exports into four groups:

1. **Check executors** — `WebSearchExecutor`, `ScreeningListExecutor`, `EpmcExecutor`, `OrcidExecutor`, `SecureDnaExecutor`, plus the raw functions `searchWeb`, `searchScreeningList`, `searchEpmc`, `getOrcidProfile`, `searchOrcidWorks`
2. **AI completion provider** — `OpenRouterProvider`, `completeWithTools`, `extractStructured`, `generateText`, `formatForModel`, `CitationMapping`
3. **Tool registry** — `getToolDefinitions`, `executeTool`
4. **AI action proposer** — `proposeActions`, `ProposedAction`, `ProposerContext`
5. **Prompt templates** — all six prompt constants plus `fillTemplate`
6. **Cache** — `getCached`, `setCached`

---

## Data flow summary

A typical screening run flows like this:

1. The caller fills `VERIFICATION_PROMPT` with customer info using `fillTemplate`
2. It creates an `OpenRouterProvider` with `executeTool` as the tool executor
3. It calls `completeWithTools` with the prompt and `getToolDefinitions()` for the available tools
4. The model decides which tools to call (web search, screening list, EPMC, ORCID)
5. Each tool call goes through `executeTool` -> raw executor function -> cache check -> API call
6. Results come back as `ToolResult` objects, get annotated with citation IDs by `formatForModel`, and feed back to the model
7. The model produces a markdown report citing sources like `[web1]`, `[screen1]`
8. The caller uses `extractStructured` with the extraction prompts to parse the markdown into typed data
9. If any criteria are flagged, `proposeActions` suggests follow-up checks
