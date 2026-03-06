# Linear walkthrough: p5-events

This document walks through every source file in `p5-events`, in a logical reading order, so you can understand the full codebase without opening any files.

The package implements a server-sent events (SSE) layer for cliver's screening pipeline. It handles serializing events to the SSE wire format, parsing them back on the client side, filtering events by viewer permission level, and routing events through an in-memory pub/sub bus.

---

## Configuration files

### `package.json`

The package is `@cliver/p5-events`, an ESM module. It depends on `@cliver/contracts` (linked from the sibling `p0-contracts` directory), Hono for HTTP, and Zod for schema validation. Dev tooling is TypeScript and Vitest.

### `tsconfig.json`

Targets ES2022 with bundler module resolution. `noEmit` is true—this package is consumed as source, not built to `dist`. Includes both `src/` and `test/`.

### `vitest.config.ts`

Aliases `@cliver/contracts` to the sibling package's source so tests can resolve contract types directly. Sets a 15-second test timeout (the SSE integration tests need room for network timing).

```ts
resolve: {
  alias: {
    "@cliver/contracts": path.resolve(__dirname, "../p0-contracts/src/index.ts"),
  },
},
```

---

## Source files

### 1. `src/sse-emitter.ts` — server-side SSE streaming

This is the server half of the SSE protocol. The `streamEvents` function takes a writable response and an async generator of events, and streams them as SSE `data:` lines.

The core loop is straightforward—iterate the generator, serialize each event as JSON on a `data:` line, and write it:

```ts
export async function streamEvents(
  writable: WritableForSSE,
  eventSource: AsyncGenerator<SSEEvent>,
  screeningId: string,
  options?: { heartbeatMs?: number },
): Promise<void> {
```

It sets the three standard SSE headers:

```ts
writable.writeHead(200, {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
});
```

Each event becomes a `data: JSON\n\n` line:

```ts
for await (const event of eventSource) {
  if (closed) break;
  const line = `data: ${JSON.stringify(event)}\n\n`;
  writable.write(line);
}
```

Two additional concerns are handled here. First, a heartbeat timer sends `:heartbeat\n\n` comments at a configurable interval (default 15 seconds) to keep the connection alive through proxies. Second, if the generator throws, the error is serialized as an SSE error event before the stream closes:

```ts
const message =
  err instanceof Error ? err.message : "Unknown generator error";
const errorEvent = JSON.stringify({ type: "error", screeningId, message });
writable.write(`data: ${errorEvent}\n\n`);
```

The writable interface is deliberately minimal—four methods—so it works with Node's `http.ServerResponse` or Hono's streaming response:

```ts
export interface WritableForSSE {
  writeHead(statusCode: number, headers: Record<string, string>): void;
  write(chunk: string): boolean;
  end(): void;
  on(event: "close", listener: () => void): void;
}
```

Client disconnection is detected via the `"close"` event on the writable, which sets a `closed` flag that breaks the generator loop and clears the heartbeat timer.

This file defines the wire format. The next file is its counterpart—the client that reads this format.

---

### 2. `src/sse-client.ts` — browser/client-side SSE consumer

The `connect` function opens a fetch-based SSE connection to a URL and delivers parsed events to a callback. It returns an `SSEConnection` handle with a `close()` method.

```ts
export function connect(
  url: string,
  onEvent: (event: SSEEvent) => void,
  options?: SSEClientOptions,
): SSEConnection {
```

Instead of using the browser's `EventSource` API, it uses `fetch` with a `ReadableStream` reader. This gives it more control over parsing and reconnection. The stream is read in chunks, accumulated in a buffer, and split on `\n\n` boundaries (the SSE event delimiter):

```ts
buffer += decoder.decode(value, { stream: true });
const parts = buffer.split("\n\n");
buffer = parts.pop()!; // last part is incomplete — keep in buffer

for (const part of parts) {
  const trimmed = part.trim();
  if (!trimmed) continue;
  if (trimmed.startsWith(":")) continue;       // skip heartbeat comments
  if (!trimmed.startsWith(dataPrefix)) continue;

  const payload = trimmed.slice(dataPrefix.length);
  const parsed = JSON.parse(payload);
  const result = SSEEventSchema.safeParse(parsed);
  if (result.success) {
    onEvent(result.data);
  }
}
```

Key behaviors:

- **Heartbeat filtering**: Lines starting with `:` are SSE comments (the heartbeats from the emitter) and are silently skipped.
- **Schema validation**: Every parsed event is validated against `SSEEventSchema` from `@cliver/contracts` via Zod's `safeParse`. Malformed or invalid events are reported through the `onParseError` callback and skipped.
- **Reconnection with exponential backoff**: When the stream ends or a connection error occurs, the client retries with exponential backoff (500ms initial, 2x multiplier, 30s cap). Retry count resets on successful connection. `maxRetries` defaults to `Infinity`.
- **Clean shutdown**: Calling `close()` sets a `closed` flag and aborts the in-flight fetch via `AbortController`.

```ts
function backoff(attempt: number, initialMs: number, maxMs: number): Promise<void> {
  const delay = Math.min(initialMs * Math.pow(BACKOFF_MULTIPLIER, attempt - 1), maxMs);
  return new Promise((resolve) => setTimeout(resolve, delay));
}
```

The emitter and client together form a complete SSE transport. The next file adds access-control filtering on top.

---

### 3. `src/event-router.ts` — view-based event filtering

The `filterForView` function decides which SSE events a given viewer is allowed to see, and optionally redacts sensitive fields. It takes an event and a `ViewFilter` (one of `"debug"`, `"provider"`, or `"customer"`) and returns the event (possibly redacted) or `null` if it should be hidden.

```ts
export function filterForView(
  event: SSEEvent,
  view: ViewFilter,
): SSEEvent | null {
```

The filtering rules:

- **`debug`**: Sees everything, unmodified.
- **`provider`**: Sees everything, unmodified. (The comment notes this may diverge from debug in the future.)
- **`customer`**: The restrictive view. Customers see `consent_request`, `action_proposed`, `status`, and `field_event` events unchanged. They see `complete` events but with evidence stripped—only the decision survives:

```ts
case "complete": {
  return {
    type: "complete",
    screeningId: event.screeningId,
    data: {
      decision: event.data.decision,
      checks: [],
      backgroundWork: null,
      audit: {
        toolCalls: [],
        raw: { verification: "", work: null },
      },
    },
  };
}
```

Customers never see `tool_call`, `tool_result`, `delta`, or `error` events—those return `null`.

The function ends with a `never` exhaustiveness check, so adding a new event type to the `SSEEvent` union without handling it here produces a compile error:

```ts
default: {
  const _exhaustive: never = event;
  return _exhaustive;
}
```

This filter is consumed by the event bus, which is the next file.

---

### 4. `src/event-bus.ts` — in-memory pub/sub

The `EventBus` class is the central event dispatch mechanism. It manages subscriptions keyed by `screeningId`, and each subscriber declares a `ViewFilter` that determines which events they receive.

```ts
export class EventBus {
  private subscriptions = new Map<string, Set<Subscription>>();
```

A `Subscription` bundles the screening ID, view filter, and listener callback:

```ts
interface Subscription {
  screeningId: string;
  view: ViewFilter;
  listener: EventListener;
}
```

`subscribe()` adds a subscription and returns an unsubscribe function. When the last subscriber for a screening ID unsubscribes, the entry is removed from the map:

```ts
return () => {
  subs!.delete(sub);
  if (subs!.size === 0) {
    this.subscriptions.delete(screeningId);
  }
};
```

`emit()` looks up all subscriptions for the event's screening ID, runs each event through `filterForView` for the subscriber's view, and calls the listener if the event passes. Listener errors are caught and logged so one broken listener cannot block others:

```ts
async emit(screeningId: string, event: SSEEvent): Promise<void> {
  const subs = this.subscriptions.get(screeningId);
  if (!subs) return;

  for (const sub of subs) {
    const filtered = filterForView(event, sub.view);
    if (filtered !== null) {
      try {
        sub.listener(filtered);
      } catch (err: unknown) {
        console.error(
          `EventBus: listener threw for screeningId="${screeningId}", event type="${event.type}":`,
          err,
        );
      }
    }
  }
}
```

The event bus works with SSE events directly. The next file bridges the gap between the pipeline layer (which emits `PipelineEvent`s) and this SSE layer.

---

### 5. `src/event-bus-adapter.ts` — pipeline-to-SSE bridge

The `EventBusAdapter` implements the `IEventEmitter` interface from `@cliver/contracts`, which is what the pipeline layer expects. It wraps an `EventBus` and translates between `PipelineEvent` and `SSEEvent`.

Not every pipeline event has an SSE equivalent. The mapping is defined in `mapPipelineToSSE`:

```ts
function mapPipelineToSSE(event: PipelineEvent): SSEEvent | null {
  switch (event.type) {
    case "error":
      return { type: "error", screeningId: event.screeningId, message: event.message };
    case "action_proposed":
      return {
        type: "action_proposed",
        screeningId: event.screeningId,
        actionId: event.actionId,
        description: event.description,
        requiresConsent: event.requiresConsent,
      };
    case "consent_requested":
      return {
        type: "consent_request",   // note: renamed from "consent_requested"
        screeningId: event.screeningId,
        checkId: event.checkId,
        description: event.description,
      };
    // These pipeline events have no SSE equivalent and are dropped:
    case "field_completed":
    case "check_started":
    case "check_completed":
    case "consent_received":
    case "pipeline_complete":
      return null;
  }
}
```

The adapter's `emit()` maps the pipeline event and forwards to the bus. Its `subscribe()` wraps the bus subscription, casting SSE events back to the `PipelineEvent` type the caller expects—this works because the overlapping types are structurally compatible:

```ts
async emit(event: PipelineEvent): Promise<void> {
  const mapped = mapPipelineToSSE(event);
  if (mapped) {
    await this.eventBus.emit(event.screeningId, mapped);
  }
}
```

Like `event-router.ts`, this function has an exhaustiveness guard so new `PipelineEvent` types must be explicitly handled.

---

### 6. `src/index.ts` — public API surface

The barrel file re-exports everything the package exposes:

```ts
export { filterForView } from "./event-router.js";
export { EventBus } from "./event-bus.js";
export type { EventListener } from "./event-bus.js";
export { EventBusAdapter } from "./event-bus-adapter.js";
export { streamEvents } from "./sse-emitter.js";
export type { WritableForSSE } from "./sse-emitter.js";
export { connect } from "./sse-client.js";
export type { SSEClientOptions, SSEConnection } from "./sse-client.js";
```

---

## Test files

### 7. `test/helpers.ts` — shared test infrastructure

Provides `createTestServer()`, which spins up a real Node HTTP server with a `/sse` endpoint backed by `streamEvents`. Tests control the event flow through `push()`, `end()`, and `error()` methods.

The key mechanism is a channel pattern using an async generator. The generator blocks on a promise until the test pushes an event or signals the end:

```ts
async function* eventGenerator(): AsyncGenerator<SSEEvent> {
  while (true) {
    if (eventQueue.length > 0) {
      const item = eventQueue.shift()!;
      if (item === null) return;
      yield item;
      continue;
    }
    const event = await new Promise<SSEEvent | null>((resolve, reject) => {
      pushResolve = resolve;
      errorReject = reject;
    });
    if (event === null) return;
    yield event;
  }
}
```

The server listens on port 0 (random available port). The writable adapter satisfies the `WritableForSSE` interface by delegating to `http.ServerResponse`.

Also exports `waitFor()`, a polling utility that resolves when a condition becomes true or times out.

---

### 8. `test/sse-emitter.test.ts` — SSE emitter integration tests

Tests the server-side emitter through real HTTP connections (using the test server from helpers). Four tests:

- **Correct SSE headers**: Verifies `Content-Type: text/event-stream` and `Cache-Control: no-cache`.
- **Event serialization**: Pushes two events, reads the response body, and checks that both appear as `data: JSON\n\n` lines.
- **Generator error handling**: Triggers an error on the event generator and confirms an error event is written to the stream with the correct message and screening ID.
- **Heartbeat keepalive**: Uses a 50ms heartbeat interval, waits 200ms, and verifies at least 2 `:heartbeat` comments appeared in the stream.

---

### 9. `test/sse-client.test.ts` — SSE client integration tests

Tests the client's `connect()` function against real HTTP servers. Five tests:

- **Event parsing**: Pushes events through the test server and verifies the client's `onEvent` callback receives correctly parsed `SSEEvent` objects.
- **Typed events**: Sends a `complete` event and verifies the client can access nested fields like `data.decision.status`.
- **Clean close**: Calls `conn.close()`, then pushes more events, and verifies no further events are delivered.
- **Malformed data handling**: Uses a custom HTTP server that sends a mix of valid JSON, invalid JSON, and schema-invalid payloads. Verifies only the 2 valid events are delivered and 2 parse errors are reported.
- **Reconnection with backoff**: Uses a server that closes the connection after one event. Verifies the client reconnects at least 3 times (initial + 2 retries) and receives an event from each connection.

---

### 10. `test/event-router.test.ts` — view filtering tests

Exercises `filterForView` across all three view levels using fixtures for every SSE event type. Key assertions:

- **Customer view**: Passes `consent_request`, `action_proposed`, `status`, `field_event`. Blocks `tool_call`, `tool_result`, `delta`, `error`. Redacts `complete` events—keeps `decision` but empties `checks`, `backgroundWork`, and `audit`.
- **Provider view**: Passes all event types with full data intact.
- **Debug view**: Passes all event types unfiltered (identical to input).

---

### 11. `test/event-bus.test.ts` — pub/sub bus tests

Tests the `EventBus` class in isolation. Eight tests covering:

- Basic delivery to a subscriber on the correct screening ID.
- Multiple subscribers on the same session both receive events.
- A `customer` subscriber receives a filtered subset (status and redacted complete, but not tool_call), while a `debug` subscriber on the same session sees all three.
- Unsubscribe stops delivery.
- Events for different screening IDs are isolated.
- Emitting to a session with no subscribers does not throw.
- A `provider` subscriber sees all events with full (unredacted) data.
- A throwing listener is caught and logged without blocking other listeners from receiving the event.

---

## Architecture summary

The data flow through these files:

1. The **pipeline** emits `PipelineEvent`s.
2. The **`EventBusAdapter`** maps them to `SSEEvent`s and publishes to the **`EventBus`**.
3. The **`EventBus`** applies **`filterForView`** per subscriber's view level and dispatches.
4. On the server boundary, **`streamEvents`** (the SSE emitter) serializes events to the SSE wire format over HTTP.
5. On the client side, **`connect`** (the SSE client) parses the stream back into typed `SSEEvent` objects with reconnection and validation.
