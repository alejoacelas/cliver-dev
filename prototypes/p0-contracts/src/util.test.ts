import { describe, it, expect } from "vitest";
import { z } from "zod";
import { toOpenRouterSchema } from "./util.js";

describe("toOpenRouterSchema", () => {
  it("wraps a Zod schema in OpenRouter format", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const result = toOpenRouterSchema("test_schema", schema);

    expect(result.type).toBe("json_schema");
    expect(result.json_schema.name).toBe("test_schema");
    expect(result.json_schema.strict).toBe(true);
    expect(result.json_schema.schema).toBeDefined();
    expect(result.json_schema.schema.type).toBe("object");
    expect(result.json_schema.schema.properties).toHaveProperty("name");
    expect(result.json_schema.schema.properties).toHaveProperty("age");
    expect(result.json_schema.schema.required).toContain("name");
    expect(result.json_schema.schema.required).toContain("age");
  });

  it("produces additionalProperties: false for strict mode", () => {
    const schema = z.object({ x: z.string() });
    const result = toOpenRouterSchema("strict_test", schema);
    expect(result.json_schema.schema.additionalProperties).toBe(false);
  });

  it("handles nested objects", () => {
    const schema = z.object({
      rows: z.array(
        z.object({
          criterion: z.string(),
          flag: z.enum(["FLAG", "NO FLAG"]),
        })
      ),
    });

    const result = toOpenRouterSchema("nested", schema);
    const props = result.json_schema.schema.properties as Record<string, Record<string, unknown>>;
    expect(props.rows.type).toBe("array");
  });

  it("handles enums", () => {
    const schema = z.object({
      status: z.enum(["PASS", "FLAG", "REVIEW"]),
    });

    const result = toOpenRouterSchema("enum_test", schema);
    const props = result.json_schema.schema.properties as Record<string, Record<string, unknown>>;
    const statusProp = props.status;
    // zod-to-json-schema represents enums as { type: "string", enum: [...] }
    expect(statusProp.enum).toContain("PASS");
    expect(statusProp.enum).toContain("FLAG");
    expect(statusProp.enum).toContain("REVIEW");
  });
});
