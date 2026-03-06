import http from "node:http";
import type { SSEEvent } from "@cliver/contracts";
import { streamEvents } from "../src/sse-emitter.js";
import type { WritableForSSE } from "../src/sse-emitter.js";

/**
 * Creates a real HTTP server for SSE testing.
 *
 * The server exposes a GET /sse endpoint that streams events using
 * the `streamEvents()` function from src/sse-emitter.ts. The test
 * controls what events are sent by pushing to a channel.
 */
export interface TestServer {
  /** Base URL of the running server, e.g., "http://localhost:54321". */
  url: string;
  /** Port the server is listening on. */
  port: number;
  /** Push an event to be sent to connected SSE clients. */
  push(event: SSEEvent): void;
  /** Signal that the event stream is complete (closes the SSE response). */
  end(): void;
  /** Signal an error in the event stream. */
  error(err: Error): void;
  /** Shut down the server. */
  close(): Promise<void>;
  /** The heartbeat interval used by this server, in ms. */
  heartbeatMs: number;
  /** The screeningId used for error events. */
  screeningId: string;
}

export async function createTestServer(
  options?: { heartbeatMs?: number; screeningId?: string },
): Promise<TestServer> {
  const heartbeatMs = options?.heartbeatMs ?? 100; // Short for tests.
  const screeningId = options?.screeningId ?? "test-screening";

  // Channel for passing events from test code to the SSE handler.
  let pushResolve: ((value: SSEEvent | null) => void) | null = null;
  let errorReject: ((err: Error) => void) | null = null;
  const eventQueue: (SSEEvent | null)[] = [];
  let ended = false;

  function push(event: SSEEvent): void {
    if (pushResolve) {
      const resolve = pushResolve;
      pushResolve = null;
      resolve(event);
    } else {
      eventQueue.push(event);
    }
  }

  function end(): void {
    ended = true;
    if (pushResolve) {
      const resolve = pushResolve;
      pushResolve = null;
      resolve(null);
    } else {
      eventQueue.push(null);
    }
  }

  function signalError(err: Error): void {
    if (errorReject) {
      const reject = errorReject;
      errorReject = null;
      reject(err);
    }
  }

  async function* eventGenerator(): AsyncGenerator<SSEEvent> {
    while (true) {
      // Check queue first.
      if (eventQueue.length > 0) {
        const item = eventQueue.shift()!;
        if (item === null) return;
        yield item;
        continue;
      }

      // Wait for next event.
      const event = await new Promise<SSEEvent | null>((resolve, reject) => {
        pushResolve = resolve;
        errorReject = reject;
      });

      if (event === null) return;
      yield event;
    }
  }

  const server = http.createServer(async (req, res) => {
    if (req.url === "/sse" && req.method === "GET") {
      // Wrap Node's http.ServerResponse as WritableForSSE.
      const writable: WritableForSSE = {
        writeHead(statusCode, headers) {
          res.writeHead(statusCode, headers);
        },
        write(chunk) {
          return res.write(chunk);
        },
        end() {
          res.end();
        },
        on(event, listener) {
          res.on(event, listener);
        },
      };

      await streamEvents(writable, eventGenerator(), screeningId, {
        heartbeatMs,
      });
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  // Start listening on a random port.
  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;

  return {
    url: `http://localhost:${port}`,
    port,
    push,
    end,
    error: signalError,
    heartbeatMs,
    screeningId,
    async close() {
      // End any pending streams.
      end();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      // Give connections a moment to drain.
      await new Promise((resolve) => setTimeout(resolve, 50));
    },
  };
}

/**
 * Wait for a condition to become true, polling every `intervalMs`.
 */
export async function waitFor(
  condition: () => boolean,
  timeoutMs = 5000,
  intervalMs = 10,
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`waitFor timed out after ${timeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
