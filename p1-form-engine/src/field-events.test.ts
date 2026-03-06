import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFieldEventEmitter, type FieldEvent } from "./field-events.js";

describe("field event emission", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("emits a field_completed event with field ID, value, and timestamp", () => {
    const events: FieldEvent[] = [];
    const emitter = createFieldEventEmitter((e) => events.push(e), {
      debounceMs: 0,
    });

    emitter.fieldCompleted("name", "Alice");
    vi.advanceTimersByTime(1);

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("field_completed");
    expect(events[0].fieldId).toBe("name");
    expect(events[0].fieldValue).toBe("Alice");
    expect(typeof events[0].timestamp).toBe("string");
    // ISO 8601
    expect(() => new Date(events[0].timestamp)).not.toThrow();
  });

  it("emits a new event when an already-completed field is edited", () => {
    const events: FieldEvent[] = [];
    const emitter = createFieldEventEmitter((e) => events.push(e), {
      debounceMs: 0,
    });

    emitter.fieldCompleted("name", "Alice");
    vi.advanceTimersByTime(1);
    emitter.fieldCompleted("name", "Bob");
    vi.advanceTimersByTime(1);

    expect(events).toHaveLength(2);
    expect(events[0].fieldValue).toBe("Alice");
    expect(events[1].fieldValue).toBe("Bob");
  });

  it("does not emit events for hidden fields", () => {
    const events: FieldEvent[] = [];
    const emitter = createFieldEventEmitter((e) => events.push(e), {
      debounceMs: 0,
    });

    const hiddenFields = new Set(["secret"]);
    emitter.fieldCompleted("secret", "value", hiddenFields);
    vi.advanceTimersByTime(1);

    expect(events).toHaveLength(0);
  });

  it("debounces rapid edits and only emits the settled value", () => {
    const events: FieldEvent[] = [];
    const emitter = createFieldEventEmitter((e) => events.push(e), {
      debounceMs: 300,
    });

    emitter.fieldCompleted("name", "A");
    vi.advanceTimersByTime(100);
    emitter.fieldCompleted("name", "Al");
    vi.advanceTimersByTime(100);
    emitter.fieldCompleted("name", "Ali");
    vi.advanceTimersByTime(100);
    emitter.fieldCompleted("name", "Alic");
    vi.advanceTimersByTime(100);
    emitter.fieldCompleted("name", "Alice");

    // Not yet fired
    expect(events).toHaveLength(0);

    // After debounce period, only the final value fires
    vi.advanceTimersByTime(300);
    expect(events).toHaveLength(1);
    expect(events[0].fieldValue).toBe("Alice");
  });

  it("emits events for different fields independently during debounce", () => {
    const events: FieldEvent[] = [];
    const emitter = createFieldEventEmitter((e) => events.push(e), {
      debounceMs: 200,
    });

    emitter.fieldCompleted("name", "Alice");
    vi.advanceTimersByTime(50);
    emitter.fieldCompleted("email", "alice@example.com");

    vi.advanceTimersByTime(200);

    // Both should have fired (name debounce elapsed at t=250, email at t=250)
    expect(events).toHaveLength(2);
    expect(events.find((e) => e.fieldId === "name")?.fieldValue).toBe("Alice");
    expect(events.find((e) => e.fieldId === "email")?.fieldValue).toBe("alice@example.com");
  });

  it("cleanup cancels pending debounced events", () => {
    const events: FieldEvent[] = [];
    const emitter = createFieldEventEmitter((e) => events.push(e), {
      debounceMs: 200,
    });

    emitter.fieldCompleted("name", "Alice");
    emitter.cleanup();
    vi.advanceTimersByTime(300);

    expect(events).toHaveLength(0);
  });
});
