import { describe, it, expect } from "vitest";
import { parseFormSchema } from "./parse-schema.js";
import { evaluateVisibility } from "./visibility.js";
import type { FormSchema } from "@cliver/contracts";

function makeSchema(fields: FormSchema["fields"]): FormSchema {
  return parseFormSchema({
    id: "test",
    version: "1.0.0",
    title: "Test",
    fields,
  });
}

describe("evaluateVisibility", () => {
  it("shows a field with no visibleWhen unconditionally", () => {
    const schema = makeSchema([
      { id: "name", label: "Name", type: "text" },
    ]);
    const visible = evaluateVisibility(schema, {});
    expect(visible.has("name")).toBe(true);
  });

  it("shows a field when equals condition is met", () => {
    const schema = makeSchema([
      { id: "type", label: "Type", type: "select", options: ["academic", "commercial"] },
      {
        id: "dept",
        label: "Department",
        type: "text",
        visibleWhen: [{ field: "type", operator: "equals", value: "academic" }],
      },
    ]);
    expect(evaluateVisibility(schema, { type: "academic" }).has("dept")).toBe(true);
    expect(evaluateVisibility(schema, { type: "commercial" }).has("dept")).toBe(false);
    expect(evaluateVisibility(schema, {}).has("dept")).toBe(false);
  });

  it("hides a field when notEquals condition is not met", () => {
    const schema = makeSchema([
      { id: "type", label: "Type", type: "select", options: ["academic", "commercial"] },
      {
        id: "reg",
        label: "Reg number",
        type: "text",
        visibleWhen: [{ field: "type", operator: "notEquals", value: "academic" }],
      },
    ]);
    expect(evaluateVisibility(schema, { type: "academic" }).has("reg")).toBe(false);
    expect(evaluateVisibility(schema, { type: "commercial" }).has("reg")).toBe(true);
  });

  it("supports the 'in' operator", () => {
    const schema = makeSchema([
      { id: "country", label: "Country", type: "select", options: ["US", "UK", "DE", "FR"] },
      {
        id: "eu-tax",
        label: "EU Tax ID",
        type: "text",
        visibleWhen: [{ field: "country", operator: "in", value: ["DE", "FR"] }],
      },
    ]);
    expect(evaluateVisibility(schema, { country: "DE" }).has("eu-tax")).toBe(true);
    expect(evaluateVisibility(schema, { country: "US" }).has("eu-tax")).toBe(false);
  });

  it("supports the 'exists' operator (field has a non-empty value)", () => {
    const schema = makeSchema([
      { id: "notes", label: "Notes", type: "textarea" },
      {
        id: "confirm",
        label: "Confirm notes",
        type: "checkbox",
        visibleWhen: [{ field: "notes", operator: "exists" }],
      },
    ]);
    expect(evaluateVisibility(schema, {}).has("confirm")).toBe(false);
    expect(evaluateVisibility(schema, { notes: "" }).has("confirm")).toBe(false);
    expect(evaluateVisibility(schema, { notes: "hello" }).has("confirm")).toBe(true);
  });

  it("supports the 'contains' operator", () => {
    const schema = makeSchema([
      { id: "tags", label: "Tags", type: "multiselect", options: ["bio", "chem", "phys"] },
      {
        id: "bio-details",
        label: "Bio details",
        type: "textarea",
        visibleWhen: [{ field: "tags", operator: "contains", value: "bio" }],
      },
    ]);
    expect(evaluateVisibility(schema, { tags: ["bio", "chem"] }).has("bio-details")).toBe(true);
    expect(evaluateVisibility(schema, { tags: ["chem"] }).has("bio-details")).toBe(false);
  });

  // --- Chained conditions ---

  it("hides B and C when A is hidden (A -> B -> C chain)", () => {
    const schema = makeSchema([
      { id: "root", label: "Root", type: "select", options: ["show", "hide"] },
      {
        id: "a",
        label: "A",
        type: "text",
        visibleWhen: [{ field: "root", operator: "equals", value: "show" }],
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
    ]);

    // When root = "hide", A is hidden, so B and C must also be hidden
    const hiddenSet = evaluateVisibility(schema, { root: "hide", a: "val", b: "val" });
    expect(hiddenSet.has("root")).toBe(true);
    expect(hiddenSet.has("a")).toBe(false);
    expect(hiddenSet.has("b")).toBe(false);
    expect(hiddenSet.has("c")).toBe(false);

    // When root = "show" and a has value, chain is visible
    const visibleSet = evaluateVisibility(schema, { root: "show", a: "val", b: "val" });
    expect(visibleSet.has("a")).toBe(true);
    expect(visibleSet.has("b")).toBe(true);
    expect(visibleSet.has("c")).toBe(true);
  });

  // --- Multiple conditions (AND) ---

  it("requires all visibleWhen conditions to be true (AND)", () => {
    const schema = makeSchema([
      { id: "type", label: "Type", type: "select", options: ["academic", "commercial"] },
      { id: "country", label: "Country", type: "select", options: ["US", "UK"] },
      {
        id: "special",
        label: "Special",
        type: "text",
        visibleWhen: [
          { field: "type", operator: "equals", value: "academic" },
          { field: "country", operator: "equals", value: "UK" },
        ],
      },
    ]);
    expect(evaluateVisibility(schema, { type: "academic", country: "UK" }).has("special")).toBe(true);
    expect(evaluateVisibility(schema, { type: "academic", country: "US" }).has("special")).toBe(false);
    expect(evaluateVisibility(schema, { type: "commercial", country: "UK" }).has("special")).toBe(false);
  });
});
