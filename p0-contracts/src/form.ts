import { z } from "zod";

// --- FieldType ---

export const FieldTypeSchema = z.enum([
  "text",
  "email",
  "textarea",
  "select",
  "multiselect",
  "file",
  "date",
  "checkbox",
  "number",
]);

export type FieldType = z.infer<typeof FieldTypeSchema>;

// --- ValidationRule ---

/**
 * A validation rule applied to a form field.
 *
 * - "required": field must have a non-empty value.
 * - "minLength" / "maxLength": string length constraints. `value` is the limit.
 * - "pattern": regex pattern the value must match. `value` is the pattern string.
 * - "custom": references a named validation function. `value` is the function name.
 */
export const ValidationRuleSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("required"),
    message: z.string().optional(),
  }),
  z.object({
    type: z.literal("minLength"),
    value: z.number().int().min(1),
    message: z.string().optional(),
  }),
  z.object({
    type: z.literal("maxLength"),
    value: z.number().int().min(1),
    message: z.string().optional(),
  }),
  z.object({
    type: z.literal("pattern"),
    value: z.string(),
    message: z.string().optional(),
  }),
  z.object({
    type: z.literal("custom"),
    value: z.string(),
    message: z.string().optional(),
  }),
]);

export type ValidationRule = z.infer<typeof ValidationRuleSchema>;

// --- VisibilityCondition ---

/**
 * Controls when a form field is visible. The field is shown only when
 * the referenced field's value satisfies the operator.
 */
export const VisibilityConditionSchema = z.object({
  /** The id of the field whose value determines visibility. */
  field: z.string(),
  /** How to compare the field's value. */
  operator: z.enum(["equals", "notEquals", "contains", "exists", "in"]),
  /** The value to compare against. Optional for "exists" operator. */
  value: z.unknown().optional(),
});

export type VisibilityCondition = z.infer<typeof VisibilityConditionSchema>;

// --- FormField ---

/**
 * A single field in the dynamic intake form.
 */
export const FormFieldSchema = z.object({
  /** Unique identifier for this field, used as the key in form data. */
  id: z.string(),
  /** Human-readable label shown to the user. */
  label: z.string(),
  /** The input type for this field. */
  type: FieldTypeSchema,
  /** Placeholder text shown when the field is empty. */
  placeholder: z.string().optional(),
  /** Help text shown below the field. */
  description: z.string().optional(),
  /** For "select" and "multiselect" fields: the list of available options. */
  options: z.array(z.string()).optional(),
  /** Validation rules applied to this field's value. */
  validationRules: z.array(ValidationRuleSchema).optional(),
  /** Conditions that control when this field is visible. All must be true. */
  visibleWhen: z.array(VisibilityConditionSchema).optional(),
});

export type FormField = z.infer<typeof FormFieldSchema>;

// --- FormSchema ---

/**
 * A complete form definition. The form engine reads this schema and
 * renders the appropriate fields with their validation and visibility rules.
 */
export const FormSchemaSchema = z.object({
  /** Unique identifier for this form schema. */
  id: z.string(),
  /** Semantic version of this schema (for migration/compatibility). */
  version: z.string(),
  /** Human-readable title shown at the top of the form. */
  title: z.string(),
  /** The ordered list of fields in this form. At least one field is required. */
  fields: z.array(FormFieldSchema).min(1),
});

export type FormSchema = z.infer<typeof FormSchemaSchema>;
