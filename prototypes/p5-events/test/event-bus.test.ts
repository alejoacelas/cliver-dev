import { describe, it, expect, vi } from "vitest";
import type { SSEEvent } from "@cliver/contracts";
import { EventBus } from "../src/event-bus.js";

const statusEvent: SSEEvent = {
  type: "status",
  screeningId: "s1",
  message: "Running...",
};

const toolCallEvent: SSEEvent = {
  type: "tool_call",
  screeningId: "s1",
  tool: "web_search",
  args: { query: "test" },
};

const completeEvent: SSEEvent = {
  type: "complete",
  screeningId: "s1",
  data: {
    decision: { status: "PASS", flagCount: 0, summary: "All checks passed", reasons: [] },
    checks: [
      {
        criterion: "Customer Institutional Affiliation",
        status: "NO FLAG",
        evidence: "MIT",
        sources: ["web1"],
      },
    ],
    backgroundWork: null,
    audit: {
      toolCalls: [],
      raw: { verification: "raw", work: null },
    },
  },
};

describe("EventBus", () => {
  it("delivers events to subscribers on the same session", async () => {
    const bus = new EventBus();
    const received: SSEEvent[] = [];

    bus.subscribe("s1", "debug", (e) => received.push(e));
    await bus.emit("s1", statusEvent);
    await bus.emit("s1", toolCallEvent);

    expect(received).toHaveLength(2);
    expect(received[0]).toEqual(statusEvent);
    expect(received[1]).toEqual(toolCallEvent);
  });

  it("multiple subscribers on the same session receive the same events", async () => {
    const bus = new EventBus();
    const received1: SSEEvent[] = [];
    const received2: SSEEvent[] = [];

    bus.subscribe("s1", "debug", (e) => received1.push(e));
    bus.subscribe("s1", "debug", (e) => received2.push(e));
    await bus.emit("s1", statusEvent);

    expect(received1).toHaveLength(1);
    expect(received2).toHaveLength(1);
    expect(received1[0]).toEqual(statusEvent);
    expect(received2[0]).toEqual(statusEvent);
  });

  it("subscriber with customer filter receives filtered subset", async () => {
    const bus = new EventBus();
    const customerEvents: SSEEvent[] = [];
    const debugEvents: SSEEvent[] = [];

    bus.subscribe("s1", "customer", (e) => customerEvents.push(e));
    bus.subscribe("s1", "debug", (e) => debugEvents.push(e));

    await bus.emit("s1", statusEvent);
    await bus.emit("s1", toolCallEvent);
    await bus.emit("s1", completeEvent);

    // Debug sees all 3.
    expect(debugEvents).toHaveLength(3);

    // Customer sees status and a redacted complete, but NOT tool_call.
    expect(customerEvents).toHaveLength(2);
    expect(customerEvents[0]).toEqual(statusEvent);
    expect(customerEvents[1]!.type).toBe("complete");
    // The complete event should be redacted for customer.
    if (customerEvents[1]!.type === "complete") {
      expect(customerEvents[1]!.data.checks).toEqual([]);
    }
  });

  it("unsubscribe stops delivery", async () => {
    const bus = new EventBus();
    const received: SSEEvent[] = [];

    const unsub = bus.subscribe("s1", "debug", (e) => received.push(e));
    await bus.emit("s1", statusEvent);
    expect(received).toHaveLength(1);

    unsub();
    await bus.emit("s1", toolCallEvent);
    expect(received).toHaveLength(1); // No new events.
  });

  it("events for different sessions are isolated", async () => {
    const bus = new EventBus();
    const s1Events: SSEEvent[] = [];
    const s2Events: SSEEvent[] = [];

    bus.subscribe("s1", "debug", (e) => s1Events.push(e));
    bus.subscribe("s2", "debug", (e) => s2Events.push(e));

    await bus.emit("s1", statusEvent);

    const s2Status: SSEEvent = {
      type: "status",
      screeningId: "s2",
      message: "Different session",
    };
    await bus.emit("s2", s2Status);

    expect(s1Events).toHaveLength(1);
    expect(s1Events[0]).toEqual(statusEvent);
    expect(s2Events).toHaveLength(1);
    expect(s2Events[0]).toEqual(s2Status);
  });

  it("emitting to a session with no subscribers does not throw", async () => {
    const bus = new EventBus();
    await expect(bus.emit("nonexistent", statusEvent)).resolves.toBeUndefined();
  });

  it("provider subscriber receives all event types", async () => {
    const bus = new EventBus();
    const received: SSEEvent[] = [];

    bus.subscribe("s1", "provider", (e) => received.push(e));

    await bus.emit("s1", statusEvent);
    await bus.emit("s1", toolCallEvent);
    await bus.emit("s1", completeEvent);

    expect(received).toHaveLength(3);
    // Provider gets unredacted complete.
    if (received[2]!.type === "complete") {
      expect(received[2]!.data.checks).toHaveLength(1);
    }
  });

  it("emit returns a Promise<void>", async () => {
    const bus = new EventBus();
    const result = bus.emit("s1", statusEvent);
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  });

  it("a throwing listener does not prevent other listeners from receiving the event", async () => {
    const bus = new EventBus();
    const received1: SSEEvent[] = [];
    const received2: SSEEvent[] = [];

    // First listener throws.
    bus.subscribe("s1", "debug", () => {
      throw new Error("Listener 1 exploded");
    });
    // Second listener captures the event.
    bus.subscribe("s1", "debug", (e) => received1.push(e));
    // Third listener also captures.
    bus.subscribe("s1", "debug", (e) => received2.push(e));

    // Suppress console.error output during this test.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await bus.emit("s1", statusEvent);

    // Both non-throwing listeners should have received the event.
    expect(received1).toHaveLength(1);
    expect(received1[0]).toEqual(statusEvent);
    expect(received2).toHaveLength(1);
    expect(received2[0]).toEqual(statusEvent);

    // The error should have been logged.
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0]![0]).toContain("listener threw");

    spy.mockRestore();
  });
});
