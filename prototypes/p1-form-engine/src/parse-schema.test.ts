import { describe, it, expect } from "vitest";
import { parseFormSchema } from "./parse-schema.js";

describe("parseFormSchema", () => {
  // --- Happy path ---

  it("parses a minimal schema with one text field", () => {
    const raw = {
      id: "kyc-basic",
      version: "1.0.0",
      title: "Basic KYC",
      fields: [{ id: "name", label: "Full name", type: "text" }],
    };
    const schema = parseFormSchema(raw);
    expect(schema.id).toBe("kyc-basic");
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].id).toBe("name");
    expect(schema.fields[0].type).toBe("text");
  });

  it("parses all supported field types", () => {
    const types = [
      "text",
      "email",
      "select",
      "multiselect",
      "file",
      "textarea",
      "date",
      "checkbox",
      "number",
    ] as const;
    const raw = {
      id: "all-types",
      version: "1.0.0",
      title: "All types",
      fields: types.map((t, i) => ({
        id: `field-${i}`,
        label: `Field ${i}`,
        type: t,
        ...(t === "select" || t === "multiselect"
          ? { options: ["a", "b"] }
          : {}),
      })),
    };
    const schema = parseFormSchema(raw);
    expect(schema.fields).toHaveLength(types.length);
    schema.fields.forEach((f, i) => {
      expect(f.type).toBe(types[i]);
    });
  });

  it("defaults required-related validation when omitted", () => {
    const raw = {
      id: "defaults",
      version: "1.0.0",
      title: "Defaults test",
      fields: [{ id: "name", label: "Name", type: "text" }],
    };
    const schema = parseFormSchema(raw);
    // validationRules should be undefined or empty when omitted
    expect(
      schema.fields[0].validationRules === undefined ||
        schema.fields[0].validationRules?.length === 0,
    ).toBe(true);
  });

  // --- Validation errors ---

  it("rejects duplicate field IDs", () => {
    const raw = {
      id: "dup",
      version: "1.0.0",
      title: "Dup",
      fields: [
        { id: "name", label: "Name", type: "text" },
        { id: "name", label: "Name again", type: "text" },
      ],
    };
    expect(() => parseFormSchema(raw)).toThrow(/duplicate.*id/i);
  });

  it("rejects visibleWhen referencing a nonexistent field", () => {
    const raw = {
      id: "bad-ref",
      version: "1.0.0",
      title: "Bad ref",
      fields: [
        {
          id: "dept",
          label: "Department",
          type: "text",
          visibleWhen: [{ field: "ghost", operator: "equals", value: "x" }],
        },
      ],
    };
    expect(() => parseFormSchema(raw)).toThrow(/nonexistent.*field|references.*ghost/i);
  });

  it("throws when a field is missing id", () => {
    const raw = {
      id: "no-id",
      version: "1.0.0",
      title: "No id",
      fields: [{ label: "Name", type: "text" }],
    };
    expect(() => parseFormSchema(raw)).toThrow();
  });

  it("throws when a field is missing type", () => {
    const raw = {
      id: "no-type",
      version: "1.0.0",
      title: "No type",
      fields: [{ id: "name", label: "Name" }],
    };
    expect(() => parseFormSchema(raw)).toThrow();
  });

  it("throws when fields array is empty", () => {
    const raw = {
      id: "empty",
      version: "1.0.0",
      title: "Empty",
      fields: [],
    };
    expect(() => parseFormSchema(raw)).toThrow();
  });

  // --- Circular dependency detection ---

  it("detects direct circular visibleWhen dependency", () => {
    const raw = {
      id: "circular",
      version: "1.0.0",
      title: "Circular",
      fields: [
        {
          id: "a",
          label: "A",
          type: "text",
          visibleWhen: [{ field: "b", operator: "exists" }],
        },
        {
          id: "b",
          label: "B",
          type: "text",
          visibleWhen: [{ field: "a", operator: "exists" }],
        },
      ],
    };
    expect(() => parseFormSchema(raw)).toThrow(/circular/i);
  });

  it("detects transitive circular visibleWhen dependency", () => {
    const raw = {
      id: "transitive",
      version: "1.0.0",
      title: "Transitive",
      fields: [
        {
          id: "a",
          label: "A",
          type: "text",
          visibleWhen: [{ field: "c", operator: "exists" }],
        },
        {
          id: "b",
          label: "B",
          type: "text",
          visibleWhen: [{ field: "a", operator: "exists" }],
        },
        {
          id: "c",
          label: "C",
          type: "text",
          visibleWhen: [{ field: "b", operator: "exists" }],
        },
      ],
    };
    expect(() => parseFormSchema(raw)).toThrow(/circular/i);
  });

  // --- visibleWhen forward references ---

  it("allows visibleWhen to reference a field that appears earlier", () => {
    const raw = {
      id: "forward",
      version: "1.0.0",
      title: "Forward ref",
      fields: [
        { id: "type", label: "Type", type: "select", options: ["a", "b"] },
        {
          id: "dept",
          label: "Department",
          type: "text",
          visibleWhen: [{ field: "type", operator: "equals", value: "a" }],
        },
      ],
    };
    expect(() => parseFormSchema(raw)).not.toThrow();
  });

  it("allows visibleWhen to reference a field that appears later", () => {
    const raw = {
      id: "backward",
      version: "1.0.0",
      title: "Backward ref",
      fields: [
        {
          id: "dept",
          label: "Department",
          type: "text",
          visibleWhen: [{ field: "type", operator: "equals", value: "a" }],
        },
        { id: "type", label: "Type", type: "select", options: ["a", "b"] },
      ],
    };
    expect(() => parseFormSchema(raw)).not.toThrow();
  });
});
