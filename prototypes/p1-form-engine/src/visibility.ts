import type { FormSchema, VisibilityCondition } from "@cliver/contracts";

/**
 * Evaluates which fields in a schema are currently visible given the
 * current form values. Returns a Set of visible field IDs.
 *
 * A field is visible if:
 * 1. It has no visibleWhen conditions, OR
 * 2. ALL of its visibleWhen conditions are met AND all fields it
 *    depends on are themselves visible (transitive check).
 */
export function evaluateVisibility(
  schema: FormSchema,
  values: Record<string, unknown>,
): Set<string> {
  const visibleSet = new Set<string>();
  // Cache to avoid recomputation
  const cache = new Map<string, boolean>();
  const fieldMap = new Map(schema.fields.map((f) => [f.id, f]));

  function isVisible(fieldId: string): boolean {
    if (cache.has(fieldId)) return cache.get(fieldId)!;

    const field = fieldMap.get(fieldId);
    if (!field) {
      cache.set(fieldId, false);
      return false;
    }

    // No conditions -> always visible
    if (!field.visibleWhen || field.visibleWhen.length === 0) {
      cache.set(fieldId, true);
      return true;
    }

    // ALL conditions must be met (AND logic)
    const allConditionsMet = field.visibleWhen.every((condition) => {
      // The field this condition depends on must itself be visible
      if (!isVisible(condition.field)) return false;
      return evaluateCondition(condition, values);
    });

    cache.set(fieldId, allConditionsMet);
    return allConditionsMet;
  }

  for (const field of schema.fields) {
    if (isVisible(field.id)) {
      visibleSet.add(field.id);
    }
  }

  return visibleSet;
}

function evaluateCondition(
  condition: VisibilityCondition,
  values: Record<string, unknown>,
): boolean {
  const fieldValue = values[condition.field];

  switch (condition.operator) {
    case "equals":
      return fieldValue === condition.value;

    case "notEquals":
      return fieldValue !== condition.value;

    case "contains": {
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      if (typeof fieldValue === "string" && typeof condition.value === "string") {
        return fieldValue.includes(condition.value);
      }
      return false;
    }

    case "exists":
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== "";

    case "in": {
      if (Array.isArray(condition.value)) {
        return condition.value.includes(fieldValue);
      }
      return false;
    }

    default:
      return false;
  }
}
