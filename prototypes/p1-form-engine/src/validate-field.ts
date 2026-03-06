import type { FormField, ValidationRule } from "@cliver/contracts";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a single field's value against its validation rules and
 * type-specific constraints.
 *
 * Returns { valid: true, errors: [] } if all rules pass,
 * or { valid: false, errors: [...messages] } with all failing rules.
 */
export function validateField(field: FormField, value: unknown): ValidationResult {
  const errors: string[] = [];

  // Run explicit validation rules
  if (field.validationRules) {
    for (const rule of field.validationRules) {
      const error = checkRule(rule, value);
      if (error) errors.push(error);
    }
  }

  // Type-specific validation (only when value is non-empty)
  if (!isEmpty(value)) {
    const typeError = checkTypeConstraints(field, value);
    if (typeError) errors.push(typeError);
  }

  return { valid: errors.length === 0, errors };
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function checkRule(rule: ValidationRule, value: unknown): string | null {
  switch (rule.type) {
    case "required": {
      if (isEmpty(value)) {
        return rule.message ?? "This field is required";
      }
      return null;
    }

    case "minLength": {
      if (isEmpty(value)) return null; // Skip if empty (use required for presence)
      const str = String(value);
      if (str.length < rule.value) {
        return rule.message ?? `Must be at least ${rule.value} characters`;
      }
      return null;
    }

    case "maxLength": {
      if (isEmpty(value)) return null;
      const str = String(value);
      if (str.length > rule.value) {
        return rule.message ?? `Must be at most ${rule.value} characters`;
      }
      return null;
    }

    case "pattern": {
      if (isEmpty(value)) return null;
      const regex = new RegExp(rule.value);
      if (!regex.test(String(value))) {
        return rule.message ?? `Must match pattern: ${rule.value}`;
      }
      return null;
    }

    case "custom": {
      // Custom validators would be registered externally.
      // For this prototype, we skip them.
      return null;
    }

    default:
      return null;
  }
}

/**
 * Type-specific validation beyond what explicit rules cover.
 * For example, email fields check format, select fields check
 * that the value is in the options list.
 */
function checkTypeConstraints(field: FormField, value: unknown): string | null {
  switch (field.type) {
    case "email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return "Invalid email address";
      }
      return null;
    }

    case "select": {
      if (field.options && !field.options.includes(String(value))) {
        return `Value must be one of: ${field.options.join(", ")}`;
      }
      return null;
    }

    case "multiselect": {
      if (field.options && Array.isArray(value)) {
        const invalid = value.filter((v) => !field.options!.includes(String(v)));
        if (invalid.length > 0) {
          return `Invalid options: ${invalid.join(", ")}`;
        }
      }
      return null;
    }

    default:
      return null;
  }
}
