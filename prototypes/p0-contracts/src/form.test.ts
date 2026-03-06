import { describe, it, expect } from "vitest";
import {
  FieldTypeSchema,
  ValidationRuleSchema,
  VisibilityConditionSchema,
  FormFieldSchema,
  FormSchemaSchema,
} from "./form.js";

// --- FieldType ---

describe("FieldType", () => {
  it("accepts all valid field types", () => {
    for (const t of [
      "text",
      "email",
      "textarea",
      "select",
      "multiselect",
      "file",
      "date",
      "checkbox",
      "number",
    ]) {
      expect(FieldTypeSchema.parse(t)).toBe(t);
    }
  });

  it("rejects invalid field type", () => {
    expect(() => FieldTypeSchema.parse("color")).toThrow();
  });
});

// --- ValidationRule ---

describe("ValidationRule", () => {
  it("accepts a required rule", () => {
    const rule = { type: "required" as const, message: "Field is required" };
    expect(ValidationRuleSchema.parse(rule)).toEqual(rule);
  });

  it("accepts a minLength rule", () => {
    const rule = { type: "minLength" as const, value: 15, message: "Too short" };
    expect(ValidationRuleSchema.parse(rule)).toEqual(rule);
  });

  it("accepts a maxLength rule", () => {
    const rule = { type: "maxLength" as const, value: 200 };
    expect(ValidationRuleSchema.parse(rule)).toEqual(rule);
  });

  it("accepts a pattern rule", () => {
    const rule = { type: "pattern" as const, value: "^[a-z]+$", message: "Letters only" };
    expect(ValidationRuleSchema.parse(rule)).toEqual(rule);
  });

  it("accepts a custom rule", () => {
    const rule = { type: "custom" as const, value: "isValidEmail", message: "Invalid email" };
    expect(ValidationRuleSchema.parse(rule)).toEqual(rule);
  });

  it("rejects a rule with unknown type", () => {
    expect(() => ValidationRuleSchema.parse({ type: "bogus" })).toThrow();
  });

  it("rejects minLength without a value", () => {
    expect(() => ValidationRuleSchema.parse({ type: "minLength" })).toThrow();
  });
});

// --- VisibilityCondition ---

describe("VisibilityCondition", () => {
  it("accepts an equals condition", () => {
    const cond = { field: "institution_type", operator: "equals" as const, value: "academic" };
    expect(VisibilityConditionSchema.parse(cond)).toEqual(cond);
  });

  it("accepts a notEquals condition", () => {
    const cond = { field: "country", operator: "notEquals" as const, value: "US" };
    expect(VisibilityConditionSchema.parse(cond)).toEqual(cond);
  });

  it("accepts a contains condition", () => {
    const cond = { field: "tags", operator: "contains" as const, value: "bio" };
    expect(VisibilityConditionSchema.parse(cond)).toEqual(cond);
  });

  it("accepts an exists condition (value optional)", () => {
    const cond = { field: "orcid", operator: "exists" as const };
    expect(VisibilityConditionSchema.parse(cond)).toEqual(cond);
  });

  it("rejects missing field", () => {
    expect(() =>
      VisibilityConditionSchema.parse({ operator: "equals", value: "x" })
    ).toThrow();
  });

  it("rejects invalid operator", () => {
    expect(() =>
      VisibilityConditionSchema.parse({ field: "x", operator: "greaterThan", value: 5 })
    ).toThrow();
  });
});

// --- FormField ---

describe("FormField", () => {
  it("accepts a minimal text field", () => {
    const field = { id: "name", label: "Full Name", type: "text" as const };
    const parsed = FormFieldSchema.parse(field);
    expect(parsed.id).toBe("name");
    expect(parsed.label).toBe("Full Name");
    expect(parsed.type).toBe("text");
  });

  it("accepts a fully specified select field", () => {
    const field = {
      id: "institution_type",
      label: "Institution Type",
      type: "select" as const,
      placeholder: "Select type...",
      options: ["academic", "commercial", "government"],
      validationRules: [{ type: "required" as const, message: "Required" }],
      visibleWhen: [{ field: "has_institution", operator: "equals" as const, value: "yes" }],
      description: "The type of your institution",
    };
    const parsed = FormFieldSchema.parse(field);
    expect(parsed.options).toHaveLength(3);
    expect(parsed.validationRules).toHaveLength(1);
    expect(parsed.visibleWhen).toHaveLength(1);
  });

  it("rejects a field without id", () => {
    expect(() => FormFieldSchema.parse({ label: "Name", type: "text" })).toThrow();
  });

  it("rejects a field without label", () => {
    expect(() => FormFieldSchema.parse({ id: "name", type: "text" })).toThrow();
  });

  it("rejects a field without type", () => {
    expect(() => FormFieldSchema.parse({ id: "name", label: "Name" })).toThrow();
  });
});

// --- FormSchema ---

describe("FormSchema", () => {
  it("accepts a valid form schema", () => {
    const schema = {
      id: "kyc-intake",
      version: "1.0.0",
      title: "KYC Customer Intake Form",
      fields: [
        { id: "name", label: "Full Name", type: "text" as const },
        { id: "email", label: "Email", type: "email" as const },
      ],
    };
    const parsed = FormSchemaSchema.parse(schema);
    expect(parsed.id).toBe("kyc-intake");
    expect(parsed.fields).toHaveLength(2);
  });

  it("rejects a form schema with empty fields", () => {
    expect(() =>
      FormSchemaSchema.parse({ id: "test", version: "1", title: "Test", fields: [] })
    ).toThrow();
  });

  it("rejects a form schema missing id", () => {
    expect(() =>
      FormSchemaSchema.parse({
        version: "1",
        title: "Test",
        fields: [{ id: "x", label: "X", type: "text" }],
      })
    ).toThrow();
  });
});
