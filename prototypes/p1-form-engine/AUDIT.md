# P1 dynamic form engine audit

Audited against: `prototypes.md` (P1 section), `p0-contracts/src/`, and `design.md` (section 2.1).

All 55 tests pass. Type-checking passes. Findings below are ordered by severity.

---

## Findings

### 1. FieldEvent type diverges from P0 PipelineEvent schema

**Severity:** High

P1 defines its own `FieldEvent` type in `/Users/alejo/code/cliver/dev/p1-form-engine/src/field-events.ts` (lines 9--14):

```typescript
export interface FieldEvent {
  type: "field_completed";
  fieldId: string;
  value: unknown;
  timestamp: string;
}
```

The P0 `PipelineEvent` `field_completed` variant (`/Users/alejo/code/cliver/dev/p0-contracts/src/pipeline.ts`, lines 109--114) uses a different field name for the value:

```typescript
z.object({
  type: z.literal("field_completed"),
  screeningId: z.string(),
  timestamp: z.string(),
  fieldId: z.string(),
  fieldValue: z.unknown(),  // <-- "fieldValue", not "value"
})
```

P1's `FieldEvent` uses `value` where P0 uses `fieldValue`, and P1 omits `screeningId` entirely. The `contract-check.ts` file does not catch this because it only checks that `FieldEvent` compiles as its own standalone type---it never asserts compatibility with `PipelineEvent`.

**Recommendation:** Either (a) import and use the `PipelineEvent` type directly (adding `screeningId` as a required parameter or making it injected at the integration boundary), or (b) make `FieldEvent` a strict subset/projection of the `PipelineEvent` `field_completed` variant and document the mapping. At minimum, rename `value` to `fieldValue` so the field name matches.

---

### 2. Select fields do not emit `field_completed` on change---only on blur

**Severity:** High

The spec says: "Completing a field (blur + valid value) emits `field_completed` event." For text inputs this makes sense, but for `<select>` elements, the user's action is the change itself---many users never explicitly blur a select. The component's `handleSelectChange` (`/Users/alejo/code/cliver/dev/p1-form-engine/src/DynamicForm.tsx`, lines 74--83) validates but does **not** call `emitterRef.current?.fieldCompleted(...)`. Emission only happens in `handleSelectBlur` (lines 87--95), which fires on blur.

In a real form, a user who selects a value and immediately tabs to the next field will get a blur event. But a user who selects a value and then does nothing else (common on mobile, or when the select is the last field) will never trigger the pipeline.

The test "emits event for select field on change" (`/Users/alejo/code/cliver/dev/p1-form-engine/src/DynamicForm.test.tsx`, lines 161--173) explicitly fires both `fireEvent.change` **and** `fireEvent.blur`, masking this issue. It does not test the change-only case.

**Recommendation:** Emit `field_completed` immediately on select/checkbox change (not just on blur). These are discrete-value controls where the value is fully determined at the moment of selection. The test should verify emission with change alone.

---

### 3. Spec operator name mismatch: `filled` vs `exists`

**Severity:** Medium

The prototypes spec (`/Users/alejo/code/cliver/dev/prototypes.md`, line 138) lists visibility operators as:

> Supports `equals`, `notEquals`, `in`, `filled` operators

The P0 contract (`/Users/alejo/code/cliver/dev/p0-contracts/src/form.ts`, line 68) and P1 implementation both use `exists`, not `filled`. The behavior is identical (checks for non-empty value), but the naming inconsistency between the spec and the code means someone reading the spec will expect `filled` and not find it.

**Recommendation:** Either update the spec to say `exists` or add `filled` as an alias. The P0 contract is the authoritative source, so updating the spec is simpler.

---

### 4. `contains` operator not listed in spec but implemented

**Severity:** Low

The spec lists four operators: `equals`, `notEquals`, `in`, `filled`. The implementation supports all five P0 operators including `contains`. This is correct behavior (it matches the P0 contract), but the spec is incomplete. This is a documentation gap, not a code bug.

**Recommendation:** Update the spec's operator list to match P0.

---

### 5. `notEquals` with undefined value returns true (may surprise)

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p1-form-engine/src/visibility.ts`, line 65:

```typescript
case "notEquals":
  return fieldValue !== condition.value;
```

When a field has no value (`undefined`) and the condition is `notEquals: "academic"`, this returns `true` (`undefined !== "academic"`). A field that hasn't been touched yet will satisfy `notEquals` conditions. This means a field gated on `notEquals` will flash visible before the controlling field is touched, then disappear when the matching value is selected. This is technically correct strict-inequality behavior, but it is likely counterintuitive for form authors who expect "not equals X" to mean "has been filled in with something other than X."

The visibility test (`/Users/alejo/code/cliver/dev/p1-form-engine/src/visibility.test.ts`, lines 39--51) only tests `{ type: "academic" }` and `{ type: "commercial" }` but not `{}` (untouched state).

**Recommendation:** Document this behavior explicitly. Consider whether `notEquals` should require the field to have a value (i.e., combine with an implicit `exists` check). Add a test case for the empty/untouched state.

---

### 6. `handleBlur` uses stale `values` via closure

**Severity:** High

In `/Users/alejo/code/cliver/dev/p1-form-engine/src/DynamicForm.tsx`, lines 58--71:

```typescript
const handleBlur = useCallback(
  (field: FormField) => {
    setTouched((prev) => new Set(prev).add(field.id));
    const value = values[field.id];  // <-- reads from `values` in closure
    const result = validateField(field, value);
    // ...
    emitterRef.current?.fieldCompleted(field.id, value, hiddenFields);
  },
  [values, visibleFields, hiddenFields],
);
```

`handleBlur` captures `values` in its dependency array, so it gets re-created on every `values` change. However, React's state batching means the `values` object inside `handleBlur` may not reflect the most recent `handleChange` call if both are triggered in the same render cycle. In practice, `fireEvent.change` followed by `fireEvent.blur` in the tests works because React batches and re-renders between them in the test environment. In production with concurrent React 19 features or certain event orderings, the blur handler could read a stale value.

**Recommendation:** Use a ref for `values` (similar to how `callbackRef` is used for the callback) or use the functional setter pattern to access current state. This is a subtle race condition that may not manifest in simple scenarios but could cause incorrect values to be emitted under rapid interaction.

---

### 7. Validation on blur does not gate event emission

**Severity:** Medium

The spec says "Completing a field (blur + **valid** value) emits `field_completed` event." In `handleBlur` (`/Users/alejo/code/cliver/dev/p1-form-engine/src/DynamicForm.tsx`, lines 58--71), the code validates the field and stores errors, but then emits the event regardless of whether validation passed. There is no `if (result.valid)` check before calling `emitterRef.current?.fieldCompleted(...)`.

This means invalid values (e.g., a malformed email, a required field left empty) will still trigger pipeline checks. The pipeline would then operate on bad data.

**Recommendation:** Only emit `field_completed` when `result.valid === true`. Add a test case that verifies a blur on an invalid required field does not emit.

---

### 8. No test for "required defaults to false when omitted"

**Severity:** Low

The spec says: "`required` defaults to `false` when omitted." The test "defaults required-related validation when omitted" (`/Users/alejo/code/cliver/dev/p1-form-engine/src/parse-schema.test.ts`, lines 53--66) checks that `validationRules` is undefined or empty, which is correct since `required` is modeled as a validation rule rather than a top-level boolean. However, the test doesn't verify the behavioral consequence: that a field without a `required` rule actually passes validation when empty.

There is a test for this in `validate-field.test.ts` ("passes when no validation rules exist and value is empty"), so the behavior is covered, but the parse-schema test description is misleading---it says "defaults required" but really tests "validationRules absence."

**Recommendation:** Rename the test to clarify what it actually checks, or add a cross-cutting integration test that parses a schema without required rules and then validates an empty value against it.

---

### 9. File field handler calls both `onChange` and `onSelectChange`, duplicating state updates

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p1-form-engine/src/DynamicForm.tsx`, lines 265--271:

```typescript
onChange={(e) => {
  const file = e.target.files?.[0];
  const filename = file?.name ?? "";
  onChange(field.id, filename);      // sets values
  onSelectChange(field, filename);   // also sets values + validates
}}
```

Both `onChange` (which calls `handleChange`) and `onSelectChange` (which calls `handleSelectChange`) update `values` state. This causes two state updates for the same field in the same event handler. While React will batch these, the second `setValues` call in `handleSelectChange` will overwrite the first with the same value. More importantly, `handleSelectChange` runs validation but `handleChange` does not, creating an inconsistent code path.

**Recommendation:** File fields should use only `onSelectChange` (like checkbox), not both handlers. Remove the `onChange(field.id, filename)` call.

---

### 10. Multiselect does not emit `field_completed` events

**Severity:** High

The `MultiSelectField` component (`/Users/alejo/code/cliver/dev/p1-form-engine/src/DynamicForm.tsx`, lines 292--335) uses `onBlur` which calls `handleBlur`. However, `handleBlur` reads from `values[field.id]` which may not yet reflect the checkbox change because `onChange` (not `onSelectChange`) is used. More critically, the multiselect `onBlur` fires per-checkbox, meaning every individual checkbox blur triggers an event---and since the blur fires before the parent fieldset's value is settled, it may emit intermediate states.

Additionally, there is no test for multiselect event emission at all. The test "renders multiselect field type" only checks that the element appears in the DOM.

**Recommendation:** Use `onSelectChange` for multiselect checkboxes (emit on each toggle, like regular checkboxes) or debounce multiselect changes at the component level. Add integration tests for multiselect event emission.

---

### 11. Tab order test is weak

**Severity:** Low

The test "tab order follows visible field order" (`/Users/alejo/code/cliver/dev/p1-form-engine/src/DynamicForm.test.tsx`, lines 177--187) only asserts that at least 2 controls exist. It does not actually verify ordering. It collects `textbox` and `combobox` roles separately and concatenates them, but this concatenation does not reflect DOM order---it's `[...textboxes, ...selects]`, not "all controls in DOM order."

The spec says "Tab order follows visible field order," which implies the test should use `document.querySelectorAll` or check `tabIndex` values or actual focus progression.

**Recommendation:** Rewrite this test to verify actual DOM order using `document.querySelectorAll('input, select, textarea')` and asserting the order matches the schema's field order. Or use `userEvent.tab()` to verify focus moves in the correct sequence.

---

### 12. No test for "rapid edits debounce" at the React component level

**Severity:** Medium

Debouncing is tested thoroughly in `field-events.test.ts` at the emitter level, but the React component test suite (`DynamicForm.test.tsx`) does not test rapid typing + blur to verify that only the settled value is emitted through the component. The spec lists "Rapid edits debounce: only the settled value emits" as a key test scenario for the form engine.

**Recommendation:** Add a DynamicForm test that types rapidly, blurs, and verifies only one event is emitted with the final value (using non-zero `debounceMs`).

---

### 13. `visibleWhen` uses array (AND logic) but spec implies single condition

**Severity:** Low

The P0 contract defines `visibleWhen` as `z.array(VisibilityConditionSchema).optional()` (an array, AND logic). The spec examples use singular conditions ("visibleWhen: { field: 'type', equals: 'academic' }"), which could confuse readers into thinking it's a single object. The implementation correctly handles the array, and there's a test for multiple conditions (AND). This is not a code bug but a spec clarity issue.

**Recommendation:** The spec examples should show the array syntax to avoid confusion.

---

### 14. Email regex is permissive

**Severity:** Low

The email regex in `/Users/alejo/code/cliver/dev/p1-form-engine/src/validate-field.ts` (line 97):

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

This accepts strings like `a@b.c` and `"user name"@domain.com`. It does not check for valid TLD length, consecutive dots, or other RFC 5322 violations. For a client-side validation this is acceptable (server-side should do deeper validation), but it's worth noting.

**Recommendation:** Document that this is intentionally permissive client-side validation. Consider adding a test for a known-invalid address that this regex incorrectly accepts, to document the limitation.

---

### 15. No test for empty schema (all fields hidden)

**Severity:** Medium

The spec mentions edge cases like "all fields hidden." There is no test that evaluates visibility when all fields have `visibleWhen` conditions that evaluate to false. Similarly, there is no test for what the DynamicForm renders when all fields are hidden (should render just the `<form>` wrapper with a title and no inputs).

**Recommendation:** Add a visibility test for the all-hidden case and a DynamicForm render test for a schema where all fields are conditionally hidden.

---

### 16. `number` field type has no type-specific validation

**Severity:** Low

The `checkTypeConstraints` function (`/Users/alejo/code/cliver/dev/p1-form-engine/src/validate-field.ts`, lines 94--124) handles `email`, `select`, and `multiselect` but has no case for `number`. A number field with a non-numeric string value like `"abc"` will pass validation (the HTML `<input type="number">` prevents this in the browser, but `validateField` can be called programmatically with any value).

**Recommendation:** Add a `number` case that checks `isNaN(Number(value))`.

---

### 17. `date` field type has no type-specific validation

**Severity:** Low

Same as finding 16 for date fields. No validation that the value is a parseable date string.

**Recommendation:** Add a `date` case that checks for a valid date.

---

### 18. `checkbox` field type has no type-specific validation

**Severity:** Low

A checkbox with a `required` rule and value `false` passes the `isEmpty` check because `false` is not `undefined`, `null`, empty string, or empty array. The `required` rule only catches truly empty values. A required checkbox (like "I agree to terms") that is unchecked will pass validation.

**Recommendation:** The `isEmpty` function should treat `false` as empty for checkbox fields, or the `required` rule should handle boolean `false`. This is a common form UX pattern.

---

### 19. EXPLANATION.md states "300 milliseconds by default" but code uses a constant

**Severity:** Low

The explanation references 300ms debounce, which matches `DEFAULT_DEBOUNCE_MS = 300` in `DynamicForm.tsx` line 7. This is correct and consistent. No action needed---included for completeness of the audit.

---

### 20. `contract-check.ts` does not verify the `PipelineEvent` field_completed shape

**Severity:** Medium

The contract check file (`/Users/alejo/code/cliver/dev/p1-form-engine/contract-check.ts`) verifies that P1's exports have the right TypeScript types, but it only checks P1's own `FieldEvent` type. It does not assert that `FieldEvent` is assignable to/from the P0 `PipelineEvent` `field_completed` variant. Since these types have diverged (finding 1), the contract check gives false confidence.

**Recommendation:** Add an assignment check: create a `PipelineEvent` of type `field_completed` and verify the P1 `FieldEvent` fields map correctly.

---

## Summary table

| # | Finding | Severity | File(s) |
|---|---------|----------|---------|
| 1 | FieldEvent type diverges from P0 PipelineEvent (value vs fieldValue, missing screeningId) | High | `field-events.ts:9-14`, `pipeline.ts:109-114` |
| 2 | Select fields emit only on blur, not on change | High | `DynamicForm.tsx:74-95` |
| 3 | Spec says `filled`, code uses `exists` | Medium | `prototypes.md:138`, `form.ts:68` |
| 4 | `contains` operator implemented but not in spec | Low | `visibility.ts:69-77` |
| 5 | `notEquals` returns true for untouched fields | Medium | `visibility.ts:65` |
| 6 | `handleBlur` closure may read stale `values` | High | `DynamicForm.tsx:58-71` |
| 7 | Invalid values still emit `field_completed` events | Medium | `DynamicForm.tsx:58-71` |
| 8 | Parse test description misleading re: required default | Low | `parse-schema.test.ts:53-66` |
| 9 | File field handler calls both onChange and onSelectChange | Medium | `DynamicForm.tsx:265-271` |
| 10 | Multiselect does not reliably emit field_completed events | High | `DynamicForm.tsx:292-335` |
| 11 | Tab order test does not verify actual ordering | Low | `DynamicForm.test.tsx:177-187` |
| 12 | No component-level debounce test | Medium | `DynamicForm.test.tsx` |
| 13 | Spec shows singular visibleWhen, code uses array | Low | `prototypes.md:136` |
| 14 | Email regex is permissive | Low | `validate-field.ts:97` |
| 15 | No test for all-fields-hidden edge case | Medium | `visibility.test.ts`, `DynamicForm.test.tsx` |
| 16 | Number field has no type-specific validation | Low | `validate-field.ts:94-124` |
| 17 | Date field has no type-specific validation | Low | `validate-field.ts:94-124` |
| 18 | Required checkbox with `false` passes validation | Low | `validate-field.ts:36-39` |
| 19 | EXPLANATION.md debounce claim matches code | Low | (none---correct) |
| 20 | Contract check does not verify PipelineEvent compatibility | Medium | `contract-check.ts` |

### Severity counts

- **High:** 4 (findings 1, 2, 6, 10)
- **Medium:** 6 (findings 3, 5, 7, 9, 12, 15, 20)
- **Low:** 9 (findings 4, 8, 11, 13, 14, 16, 17, 18, 19)
