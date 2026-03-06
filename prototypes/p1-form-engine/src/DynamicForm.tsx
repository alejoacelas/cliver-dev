import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { FormSchema, FormField } from "@cliver/contracts";
import { evaluateVisibility } from "./visibility.js";
import { validateField, type ValidationResult } from "./validate-field.js";
import { createFieldEventEmitter, type FieldEvent } from "./field-events.js";

const DEFAULT_DEBOUNCE_MS = 300;

export interface DynamicFormProps {
  schema: FormSchema;
  onFieldComplete: (event: FieldEvent) => void;
  debounceMs?: number;
}

export function DynamicForm({
  schema,
  onFieldComplete,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Keep a ref to always read the latest values (fixes stale closure in handleBlur — finding #6)
  const valuesRef = useRef(values);
  valuesRef.current = values;

  // Create emitter with stable reference
  const emitterRef = useRef<ReturnType<typeof createFieldEventEmitter> | null>(null);
  const callbackRef = useRef(onFieldComplete);
  callbackRef.current = onFieldComplete;

  useEffect(() => {
    emitterRef.current = createFieldEventEmitter(
      (event) => callbackRef.current(event),
      { debounceMs },
    );
    return () => emitterRef.current?.cleanup();
  }, [debounceMs]);

  // Compute visible fields
  const visibleFields = useMemo(
    () => evaluateVisibility(schema, values),
    [schema, values],
  );

  const hiddenFields = useMemo(() => {
    const all = new Set(schema.fields.map((f) => f.id));
    for (const id of visibleFields) {
      all.delete(id);
    }
    return all;
  }, [schema, visibleFields]);

  const handleChange = useCallback(
    (fieldId: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [fieldId]: value }));
    },
    [],
  );

  const handleBlur = useCallback(
    (field: FormField) => {
      setTouched((prev) => new Set(prev).add(field.id));
      // Read from ref to avoid stale closure (finding #6)
      const value = valuesRef.current[field.id];
      const result = validateField(field, value);
      setValidationErrors((prev) => ({ ...prev, [field.id]: result.errors }));

      // Only emit if field is visible AND validation passes (finding #7)
      if (visibleFields.has(field.id) && result.valid) {
        emitterRef.current?.fieldCompleted(field.id, value, hiddenFields);
      }
    },
    [values, visibleFields, hiddenFields],
  );

  // For select/checkbox/file, emit immediately on change (finding #2).
  // These are discrete-value controls where the value is final at selection time.
  const handleSelectChange = useCallback(
    (field: FormField, value: unknown) => {
      setValues((prev) => ({ ...prev, [field.id]: value }));
      setTouched((prev) => new Set(prev).add(field.id));

      // Validate with the new value
      const result = validateField(field, value);
      setValidationErrors((prev) => ({ ...prev, [field.id]: result.errors }));

      // Emit immediately if valid and visible (findings #2, #7)
      if (result.valid) {
        emitterRef.current?.fieldCompleted(field.id, value);
      }
    },
    [],
  );

  // Emit on blur for select fields too (consistent with other fields)
  const handleSelectBlur = useCallback(
    (field: FormField) => {
      const value = values[field.id];
      if (visibleFields.has(field.id)) {
        emitterRef.current?.fieldCompleted(field.id, value, hiddenFields);
      }
    },
    [values, visibleFields, hiddenFields],
  );

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      aria-label={schema.title}
      noValidate
    >
      <h1>{schema.title}</h1>
      {schema.fields
        .filter((field) => visibleFields.has(field.id))
        .map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={values[field.id]}
            errors={touched.has(field.id) ? validationErrors[field.id] ?? [] : []}
            onChange={handleChange}
            onBlur={handleBlur}
            onSelectChange={handleSelectChange}
            onSelectBlur={handleSelectBlur}
          />
        ))}
    </form>
  );
}

// --- Field renderer ---

interface FieldRendererProps {
  field: FormField;
  value: unknown;
  errors: string[];
  onChange: (fieldId: string, value: unknown) => void;
  onBlur: (field: FormField) => void;
  onSelectChange: (field: FormField, value: unknown) => void;
  onSelectBlur: (field: FormField) => void;
}

function FieldRenderer({
  field,
  value,
  errors,
  onChange,
  onBlur,
  onSelectChange,
  onSelectBlur,
}: FieldRendererProps) {
  const hasError = errors.length > 0;
  const describedBy = hasError ? `${field.id}-error` : undefined;

  switch (field.type) {
    case "text":
    case "email":
    case "date":
    case "number":
      return (
        <div>
          <label htmlFor={field.id}>{field.label}</label>
          <input
            id={field.id}
            type={field.type}
            value={String(value ?? "")}
            placeholder={field.placeholder}
            onChange={(e) => onChange(field.id, e.target.value)}
            onBlur={() => onBlur(field)}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
          />
          {field.description && <p>{field.description}</p>}
          {hasError && (
            <p id={`${field.id}-error`} role="alert">
              {errors[0]}
            </p>
          )}
        </div>
      );

    case "textarea":
      return (
        <div>
          <label htmlFor={field.id}>{field.label}</label>
          <textarea
            id={field.id}
            value={String(value ?? "")}
            placeholder={field.placeholder}
            onChange={(e) => onChange(field.id, e.target.value)}
            onBlur={() => onBlur(field)}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
          />
          {field.description && <p>{field.description}</p>}
          {hasError && (
            <p id={`${field.id}-error`} role="alert">
              {errors[0]}
            </p>
          )}
        </div>
      );

    case "select":
      return (
        <div>
          <label htmlFor={field.id}>{field.label}</label>
          <select
            id={field.id}
            value={String(value ?? "")}
            onChange={(e) => onSelectChange(field, e.target.value)}
            onBlur={() => onSelectBlur(field)}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
          >
            <option value="">{field.placeholder ?? "Select..."}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {field.description && <p>{field.description}</p>}
          {hasError && (
            <p id={`${field.id}-error`} role="alert">
              {errors[0]}
            </p>
          )}
        </div>
      );

    case "multiselect":
      return (
        <MultiSelectField
          field={field}
          value={value}
          errors={errors}
          onSelectChange={onSelectChange}
        />
      );

    case "checkbox":
      return (
        <div>
          <label>
            <input
              id={field.id}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onSelectChange(field, e.target.checked)}
              onBlur={() => onSelectBlur(field)}
              aria-invalid={hasError || undefined}
              aria-describedby={describedBy}
            />
            {field.label}
          </label>
          {field.description && <p>{field.description}</p>}
          {hasError && (
            <p id={`${field.id}-error`} role="alert">
              {errors[0]}
            </p>
          )}
        </div>
      );

    case "file":
      return (
        <div>
          <label htmlFor={field.id}>{field.label}</label>
          <input
            id={field.id}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              const filename = file?.name ?? "";
              // Use only onSelectChange for file fields (finding #9)
              onSelectChange(field, filename);
            }}
            onBlur={() => onSelectBlur(field)}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
          />
          {field.description && <p>{field.description}</p>}
          {hasError && (
            <p id={`${field.id}-error`} role="alert">
              {errors[0]}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}

// --- Multiselect as checkbox group ---

function MultiSelectField({
  field,
  value,
  errors,
  onSelectChange,
}: {
  field: FormField;
  value: unknown;
  errors: string[];
  onSelectChange: (field: FormField, value: unknown) => void;
}) {
  const selected = Array.isArray(value) ? (value as string[]) : [];
  const hasError = errors.length > 0;

  return (
    <fieldset>
      <legend>{field.label}</legend>
      {field.options?.map((opt) => (
        <label key={opt}>
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={(e) => {
              const next = e.target.checked
                ? [...selected, opt]
                : selected.filter((s) => s !== opt);
              // Use onSelectChange to emit immediately on each toggle (finding #10)
              onSelectChange(field, next);
            }}
          />
          {opt}
        </label>
      ))}
      {field.description && <p>{field.description}</p>}
      {hasError && (
        <p id={`${field.id}-error`} role="alert">
          {errors[0]}
        </p>
      )}
    </fieldset>
  );
}
