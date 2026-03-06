# P1: Dynamic form engine

## What problem this solves

Cliver is a screening platform for synthetic DNA providers. When a customer places an order, they must fill out a form with their personal and institutional information so Cliver can run background checks. Different customers need different fields — an academic researcher should see a "Department" field, while a commercial entity should see a "Registration number" field instead.

Before this prototype, the form was hardcoded: five fixed fields, always visible, with no way to change them without modifying the application's source code. This meant that adding a new question, changing which questions appeared for which customer types, or deploying a different form for a different region all required a developer to write and ship new code.

The dynamic form engine solves this by making the form **schema-driven**. The form's structure — its fields, their types, their validation rules, and the conditions under which they appear — is defined in a JSON configuration file. The engine reads that configuration and renders the appropriate form at runtime. Changing the form is now a matter of editing a JSON document, not rewriting application code.

## How it works at a high level

The engine has four main parts that work together:

**Schema parsing** takes a raw JSON object and validates it. It checks that the JSON has the right shape (every field has an ID, a label, and a type), that no two fields share the same ID, that any visibility conditions reference fields that actually exist, and that there are no circular dependencies (field A can't require field B to be visible if field B also requires field A). If anything is wrong, it throws an error with a specific message. The validation uses Zod, a TypeScript library for runtime data validation — the same Zod schemas defined in the shared P0 contracts package.

**Conditional visibility** determines which fields should be shown given the current form values. Each field can have visibility conditions like "show this field when the 'type' field equals 'academic'." The engine supports five operators: `equals`, `notEquals`, `contains`, `exists` (the field has any non-empty value), and `in` (the value is one of a list). Conditions are transitive — if field B depends on field A, and field C depends on field B, then hiding field A automatically hides both B and C. All conditions on a field must be true simultaneously for it to appear (AND logic).

**Field validation** checks a single field's value against its rules. Rules include required (must have a value), minLength/maxLength (string length limits), and pattern (must match a regular expression). Beyond explicit rules, some field types have built-in validation: email fields check for a valid email format, select fields reject values that aren't in the options list, and multiselect fields check that every selected option is valid.

**The React component** (`DynamicForm`) ties everything together. It maintains the current form values in memory, recomputes which fields are visible whenever a value changes, and renders only the visible fields. When a user finishes filling in a field (clicks or tabs away from it), the component validates the value and emits a `field_completed` event. These events are the critical interface with the rest of the system — the backend pipeline listens for them to start running screening checks progressively, before the customer has even finished the entire form.

Event emission is debounced on a per-field basis. If a user types quickly, the engine waits until they stop for a configurable interval (300 milliseconds by default) before emitting. This prevents flooding the pipeline with intermediate values. Hidden fields never emit events, even if they previously had values.

## What the boundaries are

This prototype covers the form's client-side behavior. It does **not** include:

- **The backend pipeline.** The `onFieldComplete` callback is the boundary. In production, it would send events to a server; here, it calls whatever function the consumer provides.
- **File uploads.** File fields render a file picker and capture the selected filename as a string, but no file data is transmitted anywhere.
- **Custom validators.** The `custom` validation rule type is recognized but skipped — it's a hook for future server-side or plugin-based validation.
- **Styling.** The rendered HTML uses plain semantic elements (labels, inputs, selects, fieldsets) with no CSS. The consuming application is expected to provide its own styles.
- **Form submission.** There is no submit button or submission logic. The form's purpose is to emit field-level events progressively, not to collect and send a batch payload.
- **Persistence.** Form state lives in React component memory. If the page reloads, values are lost. Persistence would be handled by a higher-level component or the pipeline.
