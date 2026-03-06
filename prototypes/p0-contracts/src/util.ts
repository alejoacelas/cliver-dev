import { type ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Converts a Zod schema into the format expected by OpenRouter's
 * structured output API (`response_format`).
 *
 * OpenRouter expects:
 * ```json
 * {
 *   "type": "json_schema",
 *   "json_schema": {
 *     "name": "<schema_name>",
 *     "strict": true,
 *     "schema": { ... JSON Schema ... }
 *   }
 * }
 * ```
 *
 * The `strict: true` flag tells OpenRouter to enforce the schema exactly,
 * including `additionalProperties: false` on all objects.
 *
 * @param name - A unique name for this schema (used by OpenRouter for caching).
 * @param schema - The Zod schema to convert.
 * @returns The OpenRouter response_format object.
 */
export function toOpenRouterSchema(
  name: string,
  schema: ZodType,
): {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
} {
  // zodToJsonSchema produces a standard JSON Schema object.
  // We strip the $schema key since OpenRouter doesn't expect it.
  const jsonSchema = zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none",
  }) as Record<string, unknown>;

  // Remove the $schema property if present
  const { $schema, ...schemaBody } = jsonSchema;

  // Ensure additionalProperties: false at the top level for strict mode
  if (schemaBody.type === "object" && !("additionalProperties" in schemaBody)) {
    schemaBody.additionalProperties = false;
  }

  return {
    type: "json_schema",
    json_schema: {
      name,
      strict: true,
      schema: schemaBody,
    },
  };
}
