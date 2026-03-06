/**
 * Contract check: verifies that P1 exports satisfy the P0 interfaces.
 *
 * This file must compile with `npx tsc --noEmit --project tsconfig.json`.
 * It does not run at runtime — it's a compile-time-only type assertion.
 */

import type { FormSchema, FormField, VisibilityCondition, ValidationRule } from "@cliver/contracts";
import { parseFormSchema } from "./src/parse-schema.js";
import { evaluateVisibility } from "./src/visibility.js";
import { validateField, type ValidationResult } from "./src/validate-field.js";
import { createFieldEventEmitter, type FieldEvent } from "./src/field-events.js";

// --- parseFormSchema contract ---
// Must accept unknown and return FormSchema
const _parseResult: FormSchema = parseFormSchema({} as unknown);

// --- evaluateVisibility contract ---
// Must accept FormSchema + values dict, return Set<string>
const _visibleSet: Set<string> = evaluateVisibility(
  {} as FormSchema,
  {} as Record<string, unknown>,
);

// --- validateField contract ---
// Must accept FormField + value, return ValidationResult
const _validationResult: ValidationResult = validateField(
  {} as FormField,
  "test" as unknown,
);
// ValidationResult must have valid: boolean and errors: string[]
const _valid: boolean = _validationResult.valid;
const _errors: string[] = _validationResult.errors;

// --- Field events contract ---
// FieldEvent must match the pipeline's field_completed shape
const _event: FieldEvent = {
  type: "field_completed" as const,
  fieldId: "test",
  fieldValue: "test",
  timestamp: new Date().toISOString(),
};

// Verify the emitter factory returns the right shape
const _emitter = createFieldEventEmitter((_e: FieldEvent) => {}, { debounceMs: 300 });
_emitter.fieldCompleted("fieldId", "value");
_emitter.fieldCompleted("fieldId", "value", new Set<string>());
_emitter.cleanup();

// --- DynamicForm contract ---
// Verify the component type signature (not rendering — just type checking)
import type { DynamicFormProps } from "./src/DynamicForm.js";

const _props: DynamicFormProps = {
  schema: {} as FormSchema,
  onFieldComplete: (_event: FieldEvent) => {},
  debounceMs: 300,
};

// --- PipelineEvent compatibility check (finding #20) ---
// Verify that FieldEvent's fields are compatible with PipelineEvent's field_completed
// variant, minus screeningId (which is added at the integration boundary by P6/P8).
type FieldCompletedFromPipeline = {
  type: "field_completed";
  fieldId: string;
  fieldValue: unknown;
  timestamp: string;
};
// Assert that FieldEvent is assignable to the PipelineEvent field_completed shape
// (excluding screeningId, which the form engine does not own).
const _pipelineCompat: FieldCompletedFromPipeline = _event;

// Suppress unused variable warnings
void _parseResult;
void _visibleSet;
void _validationResult;
void _valid;
void _errors;
void _event;
void _emitter;
void _props;
void _pipelineCompat;
