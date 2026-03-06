import { FormSchemaSchema, type FormSchema } from "@cliver/contracts";

/**
 * Parses and validates a raw JSON object into a FormSchema.
 *
 * Beyond Zod structural validation, this performs semantic checks:
 * - No duplicate field IDs
 * - All visibleWhen references point to existing fields
 * - No circular visibility dependencies
 */
export function parseFormSchema(raw: unknown): FormSchema {
  // Step 1: Structural validation via Zod
  const result = FormSchemaSchema.safeParse(raw);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new Error(`Schema parse error: ${firstIssue.message} at ${firstIssue.path.join(".")}`);
  }
  const schema = result.data;

  // Step 2: Check for duplicate field IDs
  const fieldIds = new Set<string>();
  for (const field of schema.fields) {
    if (fieldIds.has(field.id)) {
      throw new Error(`Duplicate field ID: "${field.id}"`);
    }
    fieldIds.add(field.id);
  }

  // Step 3: Check visibleWhen references
  for (const field of schema.fields) {
    if (!field.visibleWhen) continue;
    for (const condition of field.visibleWhen) {
      if (!fieldIds.has(condition.field)) {
        throw new Error(
          `Field "${field.id}" references nonexistent field "${condition.field}" in visibleWhen`,
        );
      }
    }
  }

  // Step 4: Detect circular visibility dependencies
  detectCircularDependencies(schema.fields);

  return schema;
}

/**
 * Builds a dependency graph from visibleWhen conditions and checks for cycles
 * using depth-first search.
 */
function detectCircularDependencies(fields: FormSchema["fields"]): void {
  // Build adjacency list: field -> fields it depends on (via visibleWhen)
  const dependsOn = new Map<string, string[]>();

  for (const field of fields) {
    if (field.visibleWhen && field.visibleWhen.length > 0) {
      dependsOn.set(
        field.id,
        field.visibleWhen.map((c) => c.field),
      );
    }
  }

  // DFS cycle detection
  const WHITE = 0; // unvisited
  const GRAY = 1; // in current path
  const BLACK = 2; // fully explored

  const color = new Map<string, number>();
  for (const field of fields) {
    color.set(field.id, WHITE);
  }

  function dfs(nodeId: string, path: string[]): void {
    color.set(nodeId, GRAY);
    const deps = dependsOn.get(nodeId) ?? [];
    for (const dep of deps) {
      const depColor = color.get(dep);
      if (depColor === GRAY) {
        throw new Error(
          `Circular visibility dependency detected: ${[...path, nodeId, dep].join(" -> ")}`,
        );
      }
      if (depColor === WHITE) {
        dfs(dep, [...path, nodeId]);
      }
    }
    color.set(nodeId, BLACK);
  }

  for (const field of fields) {
    if (color.get(field.id) === WHITE) {
      dfs(field.id, []);
    }
  }
}
