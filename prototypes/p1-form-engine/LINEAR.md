# Linear walkthrough: `@cliver/form-engine`

A JSON-schema-driven dynamic form engine for the Cliver screening platform. It takes a declarative form definition (fields, validation rules, visibility conditions) and renders a React form that validates input and emits `field_completed` events as the user works through it.

---

## 1. Project configuration

### `package.json`

The package is `@cliver/form-engine`. It depends on `@cliver/contracts` (the shared type/schema package, linked locally), React 19, and Zod. Dev tooling is Vitest with Testing Library and jsdom.

### `tsconfig.json`

Targets ES2022 with bundler module resolution. Uses `verbatimModuleSyntax` (all imports/exports must use `import type` where appropriate). Paths alias `@cliver/contracts` to the sibling package source so TypeScript resolves types directly.

### `vitest.config.ts`

```ts
export default defineConfig({
  resolve: {
    alias: {
      "@cliver/contracts": path.resolve(__dirname, "../p0-contracts/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

Mirrors the tsconfig path alias at the bundler level. Uses jsdom for React component tests.

### `src/test-setup.ts`

One line—imports `@testing-library/jest-dom/vitest` to add DOM matchers (`toBeInTheDocument`, etc.) to Vitest's `expect`.

---

## 2. Contracts: the form schema types (`@cliver/contracts` — `p0-contracts/src/form.ts`)

Before entering P1's source, you need to know the shapes it consumes. The contracts package defines everything with Zod schemas that double as runtime validators and TypeScript types.

**`FieldType`** — one of: `text`, `email`, `textarea`, `select`, `multiselect`, `file`, `date`, `checkbox`, `number`.

**`ValidationRule`** — a discriminated union on `type`:

```ts
const ValidationRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("required"), message: z.string().optional() }),
  z.object({ type: z.literal("minLength"), value: z.number().int().min(1), message: z.string().optional() }),
  z.object({ type: z.literal("maxLength"), value: z.number().int().min(1), message: z.string().optional() }),
  z.object({ type: z.literal("pattern"), value: z.string(), message: z.string().optional() }),
  z.object({ type: z.literal("custom"), value: z.string(), message: z.string().optional() }),
]);
```

**`VisibilityCondition`** — controls when a field appears:

```ts
const VisibilityConditionSchema = z.object({
  field: z.string(),                                            // references another field's id
  operator: z.enum(["equals", "notEquals", "contains", "exists", "in"]),
  value: z.unknown().optional(),                                // not needed for "exists"
});
```

**`FormField`** — one field in the form: `id`, `label`, `type`, optional `placeholder`, `description`, `options` (for select/multiselect), `validationRules`, and `visibleWhen`.

**`FormSchema`** — the top-level object: `id`, `version`, `title`, and a non-empty `fields` array.

With these shapes understood, we can trace how P1 processes them.

---

## 3. Schema parsing — `src/parse-schema.ts`

This is the entry point for any form definition. It takes raw JSON and returns a validated `FormSchema`, or throws with a descriptive error.

**Step 1: Structural validation** via the Zod schema from contracts:

```ts
const result = FormSchemaSchema.safeParse(raw);
if (!result.success) {
  const firstIssue = result.error.issues[0];
  throw new Error(`Schema parse error: ${firstIssue.message} at ${firstIssue.path.join(".")}`);
}
```

**Step 2: Duplicate field IDs.** Iterates fields and rejects any repeated `id`.

**Step 3: Dangling visibility references.** Every `visibleWhen` condition must reference a field that actually exists in the schema.

**Step 4: Circular dependency detection.** Builds a dependency graph (field → fields it depends on via `visibleWhen`) and runs DFS with three-color marking:

```ts
function detectCircularDependencies(fields: FormSchema["fields"]): void {
  const dependsOn = new Map<string, string[]>();
  for (const field of fields) {
    if (field.visibleWhen && field.visibleWhen.length > 0) {
      dependsOn.set(field.id, field.visibleWhen.map((c) => c.field));
    }
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  // ... DFS that throws on GRAY→GRAY edge (cycle)
}
```

If A depends on B and B depends on A, the error message includes the full cycle path: `a -> b -> a`.

The test file (`parse-schema.test.ts`) covers: minimal valid schemas, all field types, duplicate IDs, dangling references, missing required properties, empty fields arrays, direct cycles, transitive cycles (A→C→B→A), and forward/backward references (which are valid as long as they're acyclic).

**Connection to next file:** Once you have a validated `FormSchema`, the runtime needs to determine which fields to show. That's `visibility.ts`.

---

## 4. Visibility evaluation — `src/visibility.ts`

Given a `FormSchema` and the current form `values`, returns a `Set<string>` of visible field IDs.

```ts
export function evaluateVisibility(
  schema: FormSchema,
  values: Record<string, unknown>,
): Set<string>
```

The core logic is a recursive `isVisible` function with memoization:

```ts
function isVisible(fieldId: string): boolean {
  if (cache.has(fieldId)) return cache.get(fieldId)!;

  const field = fieldMap.get(fieldId);
  if (!field) { cache.set(fieldId, false); return false; }

  // No conditions -> always visible
  if (!field.visibleWhen || field.visibleWhen.length === 0) {
    cache.set(fieldId, true);
    return true;
  }

  // ALL conditions must be met (AND logic)
  const allConditionsMet = field.visibleWhen.every((condition) => {
    if (!isVisible(condition.field)) return false;  // transitive: parent must be visible too
    return evaluateCondition(condition, values);
  });

  cache.set(fieldId, allConditionsMet);
  return allConditionsMet;
}
```

Two important design decisions:

1. **AND semantics** — all `visibleWhen` conditions must be satisfied simultaneously.
2. **Transitive visibility** — if field B depends on field A, and A is itself hidden, then B is also hidden regardless of whether B's condition value matches. This prevents orphaned visible fields when a parent is hidden.

The private `evaluateCondition` function implements the five operators:

| Operator | Logic |
|---|---|
| `equals` | `fieldValue === condition.value` |
| `notEquals` | `fieldValue !== condition.value` |
| `contains` | Array `includes` or string `includes` |
| `exists` | Value is not `undefined`, `null`, or `""` |
| `in` | `condition.value` (an array) includes `fieldValue` |

Tests cover each operator, chained visibility (root→A→B→C where hiding root cascades), and multi-condition AND logic.

**Connection to next file:** Visible fields need to be validated when the user interacts with them. That's `validate-field.ts`.

---

## 5. Field validation — `src/validate-field.ts`

Validates a single field's value against its rules and type-specific constraints.

```ts
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateField(field: FormField, value: unknown): ValidationResult
```

The function collects all errors (doesn't short-circuit), so the UI can display multiple issues at once.

**Explicit rule checking** (`checkRule`) handles five rule types:

```ts
function checkRule(rule: ValidationRule, value: unknown): string | null {
  switch (rule.type) {
    case "required":
      if (isEmpty(value)) return rule.message ?? "This field is required";
      return null;
    case "minLength":
      if (isEmpty(value)) return null;  // skip if empty; use "required" for presence
      if (String(value).length < rule.value) return rule.message ?? `Must be at least ${rule.value} characters`;
      return null;
    case "maxLength": // analogous
    case "pattern":
      if (isEmpty(value)) return null;
      if (!new RegExp(rule.value).test(String(value))) return rule.message ?? `Must match pattern: ${rule.value}`;
      return null;
    case "custom":
      return null;  // placeholder for externally registered validators
  }
}
```

Key design: `minLength`, `maxLength`, and `pattern` all skip validation on empty values. Presence checking is the exclusive job of the `required` rule.

**Type-specific validation** (`checkTypeConstraints`) runs only when the value is non-empty:

- `email` — checks against `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- `select` — rejects values not in the `options` array
- `multiselect` — rejects any array element not in `options`

Tests cover: required with empty/undefined/valid values, email format, select option enforcement, multiselect invalid options, regex patterns, min/max length, custom error messages, and multiple simultaneous failures.

**Connection to next file:** When validation passes on blur, the engine needs to emit a `field_completed` event. That's `field-events.ts`.

---

## 6. Event emission — `src/field-events.ts`

Provides a debounced event emitter for `field_completed` events—the mechanism by which the form engine signals the rest of the pipeline that a user has entered a value.

```ts
export interface FieldEvent {
  type: "field_completed";
  fieldId: string;
  fieldValue: unknown;
  timestamp: string;  // ISO 8601
}
```

The doc comment explains a deliberate boundary: `FieldEvent` is a subset of the pipeline's `PipelineEvent`. It omits `screeningId` because the form engine doesn't know about screenings—the integration layer adds that when bridging P1 to P2.

The factory function:

```ts
export function createFieldEventEmitter(
  callback: (event: FieldEvent) => void,
  options: FieldEventEmitterOptions,
): FieldEventEmitter
```

Internally it maintains a `Map<string, Timer>` for per-field debounce timers. When `fieldCompleted` is called:

1. If the field is in the `hiddenFields` set, return immediately (no event).
2. Clear any existing timer for this field.
3. Set a new timer. When it fires, it builds the `FieldEvent` with the current timestamp and calls the callback.

If `debounceMs <= 0`, it uses `setTimeout(emit, 0)` (next microtask) to keep the async API consistent.

`cleanup()` clears all pending timers—called when the React component unmounts.

Tests use `vi.useFakeTimers()` to verify: basic event shape, re-emission on edit, hidden field suppression, debounce (5 rapid edits → only the last value emits), independent per-field timers, and cleanup cancellation.

**Connection to next file:** All four modules above come together in the React component, `DynamicForm.tsx`.

---

## 7. The React component — `src/DynamicForm.tsx`

The single exported component that renders a schema-driven form with live visibility, validation, and event emission.

### Props and state

```ts
export interface DynamicFormProps {
  schema: FormSchema;
  onFieldComplete: (event: FieldEvent) => void;
  debounceMs?: number;  // defaults to 300
}
```

Three pieces of state:
- `values: Record<string, unknown>` — current form data
- `validationErrors: Record<string, string[]>` — per-field error messages
- `touched: Set<string>` — which fields the user has interacted with (errors only show after touch)

### Wiring the subsystems

**Visibility** is computed as a derived value:

```ts
const visibleFields = useMemo(() => evaluateVisibility(schema, values), [schema, values]);
```

Recomputed on every value change—this is what makes conditional fields appear/disappear in real time.

**The event emitter** is created once (or when `debounceMs` changes) and stored in a ref. The callback is also stored in a ref to avoid stale closures:

```ts
useEffect(() => {
  emitterRef.current = createFieldEventEmitter(
    (event) => callbackRef.current(event),
    { debounceMs },
  );
  return () => emitterRef.current?.cleanup();
}, [debounceMs]);
```

### Two interaction patterns

The component distinguishes between text-like fields and discrete-value fields:

**Text fields** (text, email, textarea, date, number) — validate and emit on blur:

```ts
const handleBlur = useCallback((field: FormField) => {
  setTouched((prev) => new Set(prev).add(field.id));
  const value = valuesRef.current[field.id];  // ref avoids stale closure
  const result = validateField(field, value);
  setValidationErrors((prev) => ({ ...prev, [field.id]: result.errors }));

  if (visibleFields.has(field.id) && result.valid) {
    emitterRef.current?.fieldCompleted(field.id, value, hiddenFields);
  }
}, [values, visibleFields, hiddenFields]);
```

**Discrete fields** (select, checkbox, file, multiselect) — validate and emit immediately on change, because the value is final at selection time:

```ts
const handleSelectChange = useCallback((field: FormField, value: unknown) => {
  setValues((prev) => ({ ...prev, [field.id]: value }));
  setTouched((prev) => new Set(prev).add(field.id));
  const result = validateField(field, value);
  setValidationErrors((prev) => ({ ...prev, [field.id]: result.errors }));

  if (result.valid) {
    emitterRef.current?.fieldCompleted(field.id, value);
  }
}, []);
```

Events are suppressed when validation fails (e.g., a required field blurred while empty) or when the field is hidden.

### Field rendering

The `FieldRenderer` component is a switch on `field.type`:

| Type | Element | Event pattern |
|---|---|---|
| `text`, `email`, `date`, `number` | `<input>` | change + blur |
| `textarea` | `<textarea>` | change + blur |
| `select` | `<select>` | selectChange + selectBlur |
| `checkbox` | `<input type="checkbox">` | selectChange (on toggle) |
| `file` | `<input type="file">` | selectChange (filename only) |
| `multiselect` | `<fieldset>` of checkboxes | selectChange (on each toggle) |

Accessibility: fields use `htmlFor`/`id` linking, `aria-invalid` on error, `aria-describedby` pointing to the error `<p>`, and `role="alert"` on error messages.

The multiselect is its own sub-component (`MultiSelectField`) that renders a `<fieldset>` with a `<legend>` and one checkbox per option:

```ts
function MultiSelectField({ field, value, errors, onSelectChange }) {
  const selected = Array.isArray(value) ? (value as string[]) : [];
  return (
    <fieldset>
      <legend>{field.label}</legend>
      {field.options?.map((opt) => (
        <label key={opt}>
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={(e) => {
              const next = e.target.checked
                ? [...selected, opt]
                : selected.filter((s) => s !== opt);
              onSelectChange(field, next);
            }}
          />
          {opt}
        </label>
      ))}
    </fieldset>
  );
}
```

### Component tests (`DynamicForm.test.tsx`)

Tests cover: rendering all field types, conditional field show/hide on select change, `field_completed` emission on blur, re-emission on edit, hidden field suppression, select fields emitting without blur, required fields not emitting when empty, multiselect emitting on each toggle, and tab order.

---

## 8. Public API — `src/index.ts`

Barrel file that re-exports everything:

```ts
export { parseFormSchema } from "./parse-schema.js";
export { evaluateVisibility } from "./visibility.js";
export { validateField, type ValidationResult } from "./validate-field.js";
export { createFieldEventEmitter, type FieldEvent, type FieldEventEmitter, type FieldEventEmitterOptions } from "./field-events.js";
export { DynamicForm, type DynamicFormProps } from "./DynamicForm.js";
```

The four pure-logic modules (`parseFormSchema`, `evaluateVisibility`, `validateField`, `createFieldEventEmitter`) are independently usable outside React. The `DynamicForm` component composes all four together.

---

## Data flow summary

```
JSON schema
    │
    ▼
parseFormSchema()        — validate structure, check for dupes/cycles/dangling refs
    │
    ▼
FormSchema               — clean, validated schema object
    │
    ├──▶ evaluateVisibility(schema, values)  → Set<fieldId>   (recomputed on every value change)
    │
    ├──▶ validateField(field, value)         → { valid, errors }  (run on blur or select-change)
    │
    └──▶ createFieldEventEmitter(callback)   → emitter.fieldCompleted(id, value, hidden)
                                                (debounced, suppressed for hidden/invalid fields)
    │
    ▼
DynamicForm              — React component that wires it all together
```
