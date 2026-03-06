/**
 * Field event emission with per-field debouncing.
 *
 * When a field is completed (blur + valid value), we emit a FieldEvent
 * to the pipeline callback. Rapid edits to the same field are debounced
 * so only the settled value is emitted.
 */

/**
 * P1's local representation of a field_completed event.
 *
 * This is intentionally a subset of P0's PipelineEvent field_completed variant:
 * it carries the same `type`, `fieldId`, `fieldValue`, and `timestamp` fields,
 * but omits `screeningId` because the form engine has no knowledge of screenings.
 * The integration layer (P6/P8) is responsible for wrapping a FieldEvent into a
 * full PipelineEvent by adding `screeningId` at the boundary.
 */
export interface FieldEvent {
  type: "field_completed";
  fieldId: string;
  fieldValue: unknown;
  timestamp: string;
}

export interface FieldEventEmitterOptions {
  debounceMs: number;
}

export interface FieldEventEmitter {
  /**
   * Signal that a field has been completed.
   * @param fieldId - The field ID
   * @param value - The current value
   * @param hiddenFields - Set of currently hidden field IDs; if this field is hidden, no event is emitted
   */
  fieldCompleted(fieldId: string, value: unknown, hiddenFields?: Set<string>): void;

  /** Cancel all pending debounced events. */
  cleanup(): void;
}

export function createFieldEventEmitter(
  callback: (event: FieldEvent) => void,
  options: FieldEventEmitterOptions,
): FieldEventEmitter {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  function fieldCompleted(
    fieldId: string,
    value: unknown,
    hiddenFields?: Set<string>,
  ): void {
    // Don't emit for hidden fields
    if (hiddenFields?.has(fieldId)) return;

    // Clear any existing debounce timer for this field
    const existing = timers.get(fieldId);
    if (existing !== undefined) {
      clearTimeout(existing);
    }

    const emit = () => {
      timers.delete(fieldId);
      const event: FieldEvent = {
        type: "field_completed",
        fieldId,
        fieldValue: value,
        timestamp: new Date().toISOString(),
      };
      callback(event);
    };

    if (options.debounceMs <= 0) {
      // No debounce: emit on next microtask to keep the API consistent
      const timer = setTimeout(emit, 0);
      timers.set(fieldId, timer);
    } else {
      const timer = setTimeout(emit, options.debounceMs);
      timers.set(fieldId, timer);
    }
  }

  function cleanup(): void {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
  }

  return { fieldCompleted, cleanup };
}
