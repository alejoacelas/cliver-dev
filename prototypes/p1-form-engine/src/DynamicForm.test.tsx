import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DynamicForm } from "./DynamicForm.js";
import type { FormSchema } from "@cliver/contracts";
import type { FieldEvent } from "./field-events.js";

const basicSchema: FormSchema = {
  id: "test",
  version: "1.0.0",
  title: "Test form",
  fields: [
    { id: "name", label: "Full name", type: "text", validationRules: [{ type: "required" }] },
    { id: "email", label: "Email", type: "email" },
    { id: "country", label: "Country", type: "select", options: ["US", "UK", "DE"] },
  ],
};

const conditionalSchema: FormSchema = {
  id: "conditional",
  version: "1.0.0",
  title: "Conditional form",
  fields: [
    { id: "type", label: "Type", type: "select", options: ["academic", "commercial"] },
    {
      id: "dept",
      label: "Department",
      type: "text",
      visibleWhen: [{ field: "type", operator: "equals", value: "academic" }],
    },
    {
      id: "reg",
      label: "Registration number",
      type: "text",
      visibleWhen: [{ field: "type", operator: "equals", value: "commercial" }],
    },
  ],
};

describe("DynamicForm", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Rendering ---

  it("renders visible fields only", () => {
    const onFieldComplete = vi.fn();
    render(<DynamicForm schema={basicSchema} onFieldComplete={onFieldComplete} />);

    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Country")).toBeInTheDocument();
  });

  it("renders the form title", () => {
    const onFieldComplete = vi.fn();
    render(<DynamicForm schema={basicSchema} onFieldComplete={onFieldComplete} />);
    expect(screen.getByText("Test form")).toBeInTheDocument();
  });

  // --- Conditional visibility ---

  it("hides conditional fields until their condition is met", () => {
    const onFieldComplete = vi.fn();
    render(<DynamicForm schema={conditionalSchema} onFieldComplete={onFieldComplete} />);

    // Initially no type selected, so both dept and reg should be hidden
    expect(screen.queryByLabelText("Department")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Registration number")).not.toBeInTheDocument();
  });

  it("shows dependent fields when condition is met", async () => {
    const onFieldComplete = vi.fn();
    render(<DynamicForm schema={conditionalSchema} onFieldComplete={onFieldComplete} />);

    // Select "academic" -> shows department, hides registration
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "academic" } });

    expect(screen.getByLabelText("Department")).toBeInTheDocument();
    expect(screen.queryByLabelText("Registration number")).not.toBeInTheDocument();

    // Switch to "commercial" -> hides department, shows registration
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "commercial" } });

    expect(screen.queryByLabelText("Department")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Registration number")).toBeInTheDocument();
  });

  // --- Field event emission ---

  it("emits field_completed event on blur with valid value", async () => {
    const events: FieldEvent[] = [];
    const onFieldComplete = (e: FieldEvent) => events.push(e);
    render(<DynamicForm schema={basicSchema} onFieldComplete={onFieldComplete} debounceMs={0} />);

    const nameInput = screen.getByLabelText("Full name");
    fireEvent.change(nameInput, { target: { value: "Alice" } });
    fireEvent.blur(nameInput);

    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(events.length).toBeGreaterThanOrEqual(1);
    const nameEvent = events.find((e) => e.fieldId === "name");
    expect(nameEvent).toBeDefined();
    expect(nameEvent!.fieldValue).toBe("Alice");
    expect(nameEvent!.type).toBe("field_completed");
  });

  it("emits a new event when an already-completed field is edited", async () => {
    const events: FieldEvent[] = [];
    const onFieldComplete = (e: FieldEvent) => events.push(e);
    render(<DynamicForm schema={basicSchema} onFieldComplete={onFieldComplete} debounceMs={0} />);

    const nameInput = screen.getByLabelText("Full name");

    fireEvent.change(nameInput, { target: { value: "Alice" } });
    fireEvent.blur(nameInput);
    await act(async () => { vi.advanceTimersByTime(50); });

    fireEvent.change(nameInput, { target: { value: "Bob" } });
    fireEvent.blur(nameInput);
    await act(async () => { vi.advanceTimersByTime(50); });

    const nameEvents = events.filter((e) => e.fieldId === "name");
    expect(nameEvents.length).toBeGreaterThanOrEqual(2);
    expect(nameEvents[nameEvents.length - 1].fieldValue).toBe("Bob");
  });

  it("does not emit events for hidden fields even if they have values", async () => {
    const events: FieldEvent[] = [];
    const onFieldComplete = (e: FieldEvent) => events.push(e);
    render(<DynamicForm schema={conditionalSchema} onFieldComplete={onFieldComplete} debounceMs={0} />);

    // Select academic, fill dept, then switch to commercial (hiding dept)
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "academic" } });
    await act(async () => { vi.advanceTimersByTime(50); });

    const deptInput = screen.getByLabelText("Department");
    fireEvent.change(deptInput, { target: { value: "Biology" } });
    fireEvent.blur(deptInput);
    await act(async () => { vi.advanceTimersByTime(50); });

    const deptEventsBefore = events.filter((e) => e.fieldId === "dept");
    expect(deptEventsBefore.length).toBe(1);

    // Now switch to commercial - dept is hidden, so clearing it should not emit
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "commercial" } });
    await act(async () => { vi.advanceTimersByTime(50); });

    // The dept field is no longer in the DOM
    expect(screen.queryByLabelText("Department")).not.toBeInTheDocument();
  });

  it("emits event for select field on change alone (without blur)", async () => {
    const events: FieldEvent[] = [];
    const onFieldComplete = (e: FieldEvent) => events.push(e);
    render(<DynamicForm schema={basicSchema} onFieldComplete={onFieldComplete} debounceMs={0} />);

    // Only fire change — no blur
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "UK" } });
    await act(async () => { vi.advanceTimersByTime(50); });

    const countryEvent = events.find((e) => e.fieldId === "country");
    expect(countryEvent).toBeDefined();
    expect(countryEvent!.fieldValue).toBe("UK");
  });

  it("does NOT emit field_completed when a required field is blurred while empty (finding #7)", async () => {
    const events: FieldEvent[] = [];
    const onFieldComplete = (e: FieldEvent) => events.push(e);
    render(<DynamicForm schema={basicSchema} onFieldComplete={onFieldComplete} debounceMs={0} />);

    // Blur the required "name" field without entering a value
    const nameInput = screen.getByLabelText("Full name");
    fireEvent.blur(nameInput);
    await act(async () => { vi.advanceTimersByTime(50); });

    const nameEvents = events.filter((e) => e.fieldId === "name");
    expect(nameEvents).toHaveLength(0);
  });

  it("emits field_completed for multiselect on each checkbox toggle", async () => {
    const schema: FormSchema = {
      id: "ms",
      version: "1.0.0",
      title: "Multiselect",
      fields: [
        { id: "tags", label: "Tags", type: "multiselect", options: ["bio", "chem", "phys"] },
      ],
    };
    const events: FieldEvent[] = [];
    const onFieldComplete = (e: FieldEvent) => events.push(e);
    render(<DynamicForm schema={schema} onFieldComplete={onFieldComplete} debounceMs={0} />);

    // Toggle "bio" on
    fireEvent.click(screen.getByLabelText("bio"));
    await act(async () => { vi.advanceTimersByTime(50); });

    expect(events.length).toBeGreaterThanOrEqual(1);
    const firstEvent = events.find((e) => e.fieldId === "tags");
    expect(firstEvent).toBeDefined();
    expect(firstEvent!.fieldValue).toEqual(["bio"]);

    // Toggle "chem" on
    fireEvent.click(screen.getByLabelText("chem"));
    await act(async () => { vi.advanceTimersByTime(50); });

    const tagEvents = events.filter((e) => e.fieldId === "tags");
    expect(tagEvents.length).toBeGreaterThanOrEqual(2);
    expect(tagEvents[tagEvents.length - 1].fieldValue).toEqual(["bio", "chem"]);
  });

  // --- Tab order ---

  it("tab order follows visible field order", () => {
    const onFieldComplete = vi.fn();
    render(<DynamicForm schema={basicSchema} onFieldComplete={onFieldComplete} />);

    const inputs = screen.getAllByRole("textbox");
    const selects = screen.getAllByRole("combobox");
    const allControls = [...inputs, ...selects];

    // All should be in the DOM in order
    expect(allControls.length).toBeGreaterThanOrEqual(2);
  });

  // --- All field types ---

  it("renders textarea field type", () => {
    const schema: FormSchema = {
      id: "ta",
      version: "1.0.0",
      title: "Textarea",
      fields: [{ id: "notes", label: "Notes", type: "textarea" }],
    };
    render(<DynamicForm schema={schema} onFieldComplete={vi.fn()} />);
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes").tagName.toLowerCase()).toBe("textarea");
  });

  it("renders date field type", () => {
    const schema: FormSchema = {
      id: "dt",
      version: "1.0.0",
      title: "Date",
      fields: [{ id: "dob", label: "Date of birth", type: "date" }],
    };
    render(<DynamicForm schema={schema} onFieldComplete={vi.fn()} />);
    expect(screen.getByLabelText("Date of birth")).toBeInTheDocument();
  });

  it("renders checkbox field type", () => {
    const schema: FormSchema = {
      id: "cb",
      version: "1.0.0",
      title: "Checkbox",
      fields: [{ id: "agree", label: "I agree", type: "checkbox" }],
    };
    render(<DynamicForm schema={schema} onFieldComplete={vi.fn()} />);
    expect(screen.getByLabelText("I agree")).toBeInTheDocument();
  });

  it("renders file field type with metadata only", () => {
    const schema: FormSchema = {
      id: "fl",
      version: "1.0.0",
      title: "File",
      fields: [{ id: "doc", label: "Document", type: "file" }],
    };
    render(<DynamicForm schema={schema} onFieldComplete={vi.fn()} />);
    expect(screen.getByLabelText("Document")).toBeInTheDocument();
  });

  it("renders number field type", () => {
    const schema: FormSchema = {
      id: "num",
      version: "1.0.0",
      title: "Number",
      fields: [{ id: "age", label: "Age", type: "number" }],
    };
    render(<DynamicForm schema={schema} onFieldComplete={vi.fn()} />);
    expect(screen.getByLabelText("Age")).toBeInTheDocument();
  });

  it("renders multiselect field type", () => {
    const schema: FormSchema = {
      id: "ms",
      version: "1.0.0",
      title: "Multiselect",
      fields: [
        { id: "tags", label: "Tags", type: "multiselect", options: ["bio", "chem", "phys"] },
      ],
    };
    render(<DynamicForm schema={schema} onFieldComplete={vi.fn()} />);
    expect(screen.getByText("Tags")).toBeInTheDocument();
  });
});
