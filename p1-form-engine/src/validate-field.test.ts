import { describe, it, expect } from "vitest";
import { validateField } from "./validate-field.js";
import type { FormField } from "@cliver/contracts";

function makeField(overrides: Partial<FormField> & { id: string; label: string; type: FormField["type"] }): FormField {
  return { ...overrides };
}

describe("validateField", () => {
  // --- Required validation ---

  it("fails when a required field has an empty string", () => {
    const field = makeField({
      id: "name",
      label: "Name",
      type: "text",
      validationRules: [{ type: "required" }],
    });
    const result = validateField(field, "");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("fails when a required field has undefined", () => {
    const field = makeField({
      id: "name",
      label: "Name",
      type: "text",
      validationRules: [{ type: "required" }],
    });
    const result = validateField(field, undefined);
    expect(result.valid).toBe(false);
  });

  it("passes when a required field has a value", () => {
    const field = makeField({
      id: "name",
      label: "Name",
      type: "text",
      validationRules: [{ type: "required" }],
    });
    const result = validateField(field, "Alice");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("passes when no validation rules exist and value is empty", () => {
    const field = makeField({ id: "notes", label: "Notes", type: "textarea" });
    const result = validateField(field, "");
    expect(result.valid).toBe(true);
  });

  // --- Email validation ---

  it("validates email format", () => {
    const field = makeField({
      id: "email",
      label: "Email",
      type: "email",
      validationRules: [{ type: "required" }],
    });
    expect(validateField(field, "bad").valid).toBe(false);
    expect(validateField(field, "user@example.com").valid).toBe(true);
    expect(validateField(field, "user@sub.domain.co.uk").valid).toBe(true);
  });

  it("skips email format check when value is empty and not required", () => {
    const field = makeField({ id: "email", label: "Email", type: "email" });
    expect(validateField(field, "").valid).toBe(true);
  });

  // --- Select validation ---

  it("rejects a select value not in options", () => {
    const field = makeField({
      id: "country",
      label: "Country",
      type: "select",
      options: ["US", "UK", "DE"],
      validationRules: [{ type: "required" }],
    });
    expect(validateField(field, "FR").valid).toBe(false);
    expect(validateField(field, "US").valid).toBe(true);
  });

  it("rejects multiselect values not in options", () => {
    const field = makeField({
      id: "tags",
      label: "Tags",
      type: "multiselect",
      options: ["bio", "chem"],
      validationRules: [{ type: "required" }],
    });
    expect(validateField(field, ["bio", "phys"]).valid).toBe(false);
    expect(validateField(field, ["bio", "chem"]).valid).toBe(true);
  });

  // --- Pattern validation ---

  it("validates custom regex pattern", () => {
    const field = makeField({
      id: "code",
      label: "Code",
      type: "text",
      validationRules: [
        { type: "pattern", value: "^[A-Z]{3}-\\d{4}$", message: "Must be XXX-1234" },
      ],
    });
    expect(validateField(field, "ABC-1234").valid).toBe(true);
    expect(validateField(field, "abc-1234").valid).toBe(false);
    expect(validateField(field, "AB-123").valid).toBe(false);
  });

  it("skips pattern check when value is empty", () => {
    const field = makeField({
      id: "code",
      label: "Code",
      type: "text",
      validationRules: [
        { type: "pattern", value: "^[A-Z]+$" },
      ],
    });
    expect(validateField(field, "").valid).toBe(true);
  });

  // --- Length validations ---

  it("validates minLength", () => {
    const field = makeField({
      id: "bio",
      label: "Bio",
      type: "textarea",
      validationRules: [{ type: "minLength", value: 10 }],
    });
    expect(validateField(field, "short").valid).toBe(false);
    expect(validateField(field, "this is long enough").valid).toBe(true);
  });

  it("validates maxLength", () => {
    const field = makeField({
      id: "code",
      label: "Code",
      type: "text",
      validationRules: [{ type: "maxLength", value: 5 }],
    });
    expect(validateField(field, "toolong").valid).toBe(false);
    expect(validateField(field, "ok").valid).toBe(true);
  });

  // --- Custom error messages ---

  it("returns custom error message when provided", () => {
    const field = makeField({
      id: "name",
      label: "Name",
      type: "text",
      validationRules: [{ type: "required", message: "Please enter your name" }],
    });
    const result = validateField(field, "");
    expect(result.errors[0]).toBe("Please enter your name");
  });

  // --- Multiple rules ---

  it("returns all errors when multiple rules fail", () => {
    const field = makeField({
      id: "code",
      label: "Code",
      type: "text",
      validationRules: [
        { type: "required" },
        { type: "minLength", value: 5 },
      ],
    });
    const result = validateField(field, "");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });
});
