import type { SSEEvent } from "@cliver/contracts";
import { SSEEventSchema } from "@cliver/contracts";

/** Backoff parameters for reconnection. */
const INITIAL_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

export interface SSEClientOptions {
  /** Maximum number of reconnection attempts. Default: Infinity. */
  maxRetries?: number;
  /** Initial backoff in ms. Default: 500. */
  initialBackoffMs?: number;
  /** Maximum backoff in ms. Default: 30000. */
  maxBackoffMs?: number;
  /** Called when a parse error is encountered (malformed event data). */
  onParseError?: (raw: string, error: Error) => void;
  /** Called on connection errors (for logging/debugging). */
  onConnectionError?: (error: Error) => void;
  /** Custom fetch function (for testing). */
  fetch?: typeof globalThis.fetch;
}

export interface SSEConnection {
  /** Terminates the connection. No further events will be delivered. */
  close(): void;
}

/**
 * Connects to an SSE endpoint using the fetch API and a ReadableStream reader.
 *
 * - Parses `data: JSON\n\n` lines into typed SSEEvent objects.
 * - Reconnects on connection drop with exponential backoff.
 * - Skips malformed events (logs via onParseError).
 * - Ignores heartbeat comments (lines starting with `:`).
 * - `close()` terminates cleanly with no further events.
 */
export function connect(
  url: string,
  onEvent: (event: SSEEvent) => void,
  options?: SSEClientOptions,
): SSEConnection {
  const maxRetries = options?.maxRetries ?? Infinity;
  const initialBackoffMs = options?.initialBackoffMs ?? INITIAL_BACKOFF_MS;
  const maxBackoffMs = options?.maxBackoffMs ?? MAX_BACKOFF_MS;
  const onParseError = options?.onParseError;
  const onConnectionError = options?.onConnectionError;
  const fetchFn = options?.fetch ?? globalThis.fetch;

  let closed = false;
  let abortController = new AbortController();
  let retryCount = 0;

  const readStream = async () => {
    while (!closed && retryCount <= maxRetries) {
      try {
        abortController = new AbortController();
        const response = await fetchFn(url, {
          signal: abortController.signal,
          headers: { Accept: "text/event-stream" },
        });

        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        // Reset retry count on successful connection.
        retryCount = 0;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!closed) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines (SSE events are terminated by \n\n).
          const parts = buffer.split("\n\n");
          // The last part is incomplete — keep it in the buffer.
          buffer = parts.pop()!;

          for (const part of parts) {
            if (closed) break;

            const trimmed = part.trim();
            if (!trimmed) continue;

            // Skip SSE comments (heartbeat, etc.).
            if (trimmed.startsWith(":")) continue;

            // Parse `data: ...` lines. SSE spec allows multiple data: lines
            // per event, but our server sends single-line JSON.
            const dataPrefix = "data: ";
            if (!trimmed.startsWith(dataPrefix)) continue;

            const payload = trimmed.slice(dataPrefix.length);

            try {
              const parsed = JSON.parse(payload);
              const result = SSEEventSchema.safeParse(parsed);
              if (result.success) {
                onEvent(result.data);
              } else {
                onParseError?.(
                  payload,
                  new Error(`Validation failed: ${result.error.message}`),
                );
              }
            } catch (err: unknown) {
              onParseError?.(
                payload,
                err instanceof Error ? err : new Error(String(err)),
              );
            }
          }
        }

        // Stream ended naturally. If not closed by us, attempt reconnect.
        if (!closed) {
          retryCount++;
          if (retryCount > maxRetries) break;
          await backoff(retryCount, initialBackoffMs, maxBackoffMs);
        }
      } catch (err: unknown) {
        if (closed) break;

        // AbortError means we called close().
        if (err instanceof DOMException && err.name === "AbortError") break;
        if (
          err instanceof Error &&
          err.message.includes("abort")
        )
          break;

        onConnectionError?.(
          err instanceof Error ? err : new Error(String(err)),
        );

        retryCount++;
        if (retryCount > maxRetries) break;
        await backoff(retryCount, initialBackoffMs, maxBackoffMs);
      }
    }
  };

  // Start reading in the background.
  readStream();

  return {
    close() {
      closed = true;
      abortController.abort();
    },
  };
}

function backoff(
  attempt: number,
  initialMs: number,
  maxMs: number,
): Promise<void> {
  const delay = Math.min(
    initialMs * Math.pow(BACKOFF_MULTIPLIER, attempt - 1),
    maxMs,
  );
  return new Promise((resolve) => setTimeout(resolve, delay));
}
