import type { SSEEvent } from "@cliver/contracts";

/** Interval between heartbeat comments, in milliseconds. */
const HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Streams SSE events from an AsyncGenerator to a writable response.
 *
 * - Sets the required SSE headers.
 * - Writes each event as `data: JSON\n\n`.
 * - Sends heartbeat comments (`:heartbeat\n\n`) during idle periods.
 * - On generator error, emits an error event and closes.
 * - Stops consuming the generator if the client disconnects.
 *
 * @param writable - A Node.js-style writable (e.g., ServerResponse).
 * @param eventSource - An async generator that yields SSEEvent objects.
 * @param screeningId - The screening session ID, used to construct valid error events.
 * @param options - Optional configuration (heartbeat interval override for testing).
 */
export async function streamEvents(
  writable: WritableForSSE,
  eventSource: AsyncGenerator<SSEEvent>,
  screeningId: string,
  options?: { heartbeatMs?: number },
): Promise<void> {
  const heartbeatMs = options?.heartbeatMs ?? HEARTBEAT_INTERVAL_MS;

  // Write SSE headers.
  writable.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  let closed = false;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    closed = true;
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  // Listen for client disconnect.
  writable.on("close", cleanup);

  // Start heartbeat.
  heartbeatTimer = setInterval(() => {
    if (!closed) {
      writable.write(":heartbeat\n\n");
    }
  }, heartbeatMs);

  try {
    for await (const event of eventSource) {
      if (closed) break;
      const line = `data: ${JSON.stringify(event)}\n\n`;
      writable.write(line);
    }
  } catch (err: unknown) {
    if (!closed) {
      const message =
        err instanceof Error ? err.message : "Unknown generator error";
      const errorEvent = JSON.stringify({ type: "error", screeningId, message });
      writable.write(`data: ${errorEvent}\n\n`);
    }
  } finally {
    cleanup();
    if (!closed) {
      writable.end();
    } else {
      // Already closed by client; just ensure end is called.
      try {
        writable.end();
      } catch {
        // Ignore errors if already ended.
      }
    }
  }
}

/**
 * Minimal interface for a writable that supports SSE.
 * Compatible with Node's http.ServerResponse and Hono's streaming response.
 */
export interface WritableForSSE {
  writeHead(statusCode: number, headers: Record<string, string>): void;
  write(chunk: string): boolean;
  end(): void;
  on(event: "close", listener: () => void): void;
}
