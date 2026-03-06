/**
 * Contract check — verifies that P5 exports satisfy the interfaces
 * defined in P0 contracts.
 *
 * This file is never executed. It only needs to compile:
 *   npx tsc --noEmit --project tsconfig.json
 */

import type { SSEEvent, ViewFilter, IEventEmitter, PipelineEvent } from "@cliver/contracts";
import { filterForView, EventBus, EventBusAdapter, streamEvents, connect } from "./src/index.js";
import type { WritableForSSE, SSEConnection, SSEClientOptions, EventListener } from "./src/index.js";

// --- SSEEmitter contract ---
// streamEvents(res, eventSource: AsyncGenerator<SSEEvent>)
{
  const writable: WritableForSSE = null!;
  async function* gen(): AsyncGenerator<SSEEvent> {
    yield {
      type: "status",
      screeningId: "s1",
      message: "Running checks...",
    };
  }
  const _promise: Promise<void> = streamEvents(writable, gen(), "s1");
}

// --- SSEClient contract ---
// connect(url, onEvent, options?): { close() }
{
  const handler = (_event: SSEEvent): void => {};
  const opts: SSEClientOptions = { maxRetries: 3 };
  const conn: SSEConnection = connect("http://localhost:3000/sse", handler, opts);
  conn.close();
}

// --- EventRouter contract ---
// filterForView(event: SSEEvent, view: ViewFilter): SSEEvent | null
{
  const event: SSEEvent = {
    type: "status",
    screeningId: "s1",
    message: "test",
  };
  const view: ViewFilter = "customer";
  const result: SSEEvent | null = filterForView(event, view);
  void result;
}

// --- EventBus contract ---
// emit(screeningId, event), subscribe(screeningId, view, listener)
{
  const bus = new EventBus();
  const event: SSEEvent = {
    type: "status",
    screeningId: "s1",
    message: "test",
  };
  const _emitResult: Promise<void> = bus.emit("s1", event);

  const listener: EventListener = (_e: SSEEvent) => {};
  const unsubscribe: () => void = bus.subscribe("s1", "customer", listener);
  unsubscribe();
}

// --- EventBusAdapter implements IEventEmitter ---
// The adapter wraps EventBus and satisfies the P0 IEventEmitter interface,
// mapping PipelineEvent to SSEEvent on emit and bridging subscribe.
{
  const bus = new EventBus();
  const adapter: IEventEmitter = new EventBusAdapter(bus);

  const pipelineEvent: PipelineEvent = {
    type: "error",
    screeningId: "s1",
    timestamp: new Date().toISOString(),
    message: "test error",
  };
  const _emitResult: Promise<void> = adapter.emit(pipelineEvent);

  const _unsub: () => void = adapter.subscribe(
    { screeningId: "s1", viewFilter: "debug" },
    (_event: PipelineEvent) => {},
  );
}
