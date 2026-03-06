import http from "node:http";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { SSEEvent } from "@cliver/contracts";
import { connect } from "../src/sse-client.js";
import { createTestServer, waitFor } from "./helpers.js";
import type { TestServer } from "./helpers.js";

describe("SSE Client (via real HTTP)", () => {
  let server: TestServer;

  afterEach(async () => {
    if (server) await server.close();
  });

  it("receives and parses each SSE event correctly", async () => {
    server = await createTestServer();

    const received: SSEEvent[] = [];
    const conn = connect(`${server.url}/sse`, (e) => received.push(e), {
      maxRetries: 0,
    });

    // Give client time to connect.
    await new Promise((r) => setTimeout(r, 100));

    const event1: SSEEvent = {
      type: "status",
      screeningId: "s1",
      message: "Check started",
    };
    const event2: SSEEvent = {
      type: "tool_call",
      screeningId: "s1",
      tool: "web_search",
      args: { query: "test" },
    };

    server.push(event1);
    server.push(event2);

    await waitFor(() => received.length >= 2, 3000);

    expect(received[0]).toEqual(event1);
    expect(received[1]).toEqual(event2);

    conn.close();
    server.end();
  });

  it("calls onEvent with typed events", async () => {
    server = await createTestServer();

    const received: SSEEvent[] = [];
    const conn = connect(`${server.url}/sse`, (e) => received.push(e), {
      maxRetries: 0,
    });

    await new Promise((r) => setTimeout(r, 100));

    const completeEvent: SSEEvent = {
      type: "complete",
      screeningId: "s1",
      data: {
        decision: { status: "PASS", flagCount: 0, summary: "All checks passed", reasons: [] },
        checks: [],
        backgroundWork: null,
        audit: {
          toolCalls: [],
          raw: { verification: "", work: null },
        },
      },
    };

    server.push(completeEvent);
    await waitFor(() => received.length >= 1, 3000);

    expect(received[0]!.type).toBe("complete");
    if (received[0]!.type === "complete") {
      expect(received[0]!.data.decision.status).toBe("PASS");
    }

    conn.close();
    server.end();
  });

  it("close() terminates cleanly, no further events", async () => {
    server = await createTestServer();

    const received: SSEEvent[] = [];
    const conn = connect(`${server.url}/sse`, (e) => received.push(e), {
      maxRetries: 0,
    });

    await new Promise((r) => setTimeout(r, 100));

    server.push({
      type: "status",
      screeningId: "s1",
      message: "Before close",
    });

    await waitFor(() => received.length >= 1, 3000);

    conn.close();

    // Push more events after close.
    await new Promise((r) => setTimeout(r, 50));
    server.push({
      type: "status",
      screeningId: "s1",
      message: "After close",
    });

    await new Promise((r) => setTimeout(r, 200));

    // Should not have received the second event.
    expect(received).toHaveLength(1);
    expect(received[0]!.type === "status" && received[0]!.message).toBe(
      "Before close",
    );

    server.end();
  });

  it("handles malformed event data gracefully (skips, logs)", async () => {
    // Custom Node http server that sends a mix of valid and malformed data.
    const malformedServer = http.createServer((req, res) => {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      // Valid event.
      res.write(
        `data: ${JSON.stringify({ type: "status", screeningId: "s1", message: "ok" })}\n\n`,
      );
      // Malformed JSON.
      res.write("data: {not valid json\n\n");
      // Invalid schema (missing required fields).
      res.write(
        `data: ${JSON.stringify({ type: "status" })}\n\n`,
      );
      // Another valid event.
      res.write(
        `data: ${JSON.stringify({ type: "status", screeningId: "s1", message: "still ok" })}\n\n`,
      );
      res.end();
    });

    await new Promise<void>((resolve) => malformedServer.listen(0, resolve));
    const addr = malformedServer.address();
    const port = typeof addr === "object" && addr !== null ? addr.port : 0;

    const received: SSEEvent[] = [];
    const parseErrors: { raw: string; error: Error }[] = [];

    const conn = connect(
      `http://localhost:${port}/sse`,
      (e) => received.push(e),
      {
        maxRetries: 0,
        onParseError: (raw, error) => parseErrors.push({ raw, error }),
      },
    );

    // Wait for stream to complete and client to process everything.
    await new Promise((r) => setTimeout(r, 500));

    // Should have received the 2 valid events.
    expect(received).toHaveLength(2);
    expect(
      received[0]!.type === "status" && received[0]!.message,
    ).toBe("ok");
    expect(
      received[1]!.type === "status" && received[1]!.message,
    ).toBe("still ok");

    // Should have logged 2 parse errors.
    expect(parseErrors).toHaveLength(2);

    conn.close();
    malformedServer.close();
    await new Promise((r) => setTimeout(r, 50));
  });

  it("reconnects on connection drop (with backoff)", async () => {
    // Custom Node http server that closes the connection after 1 event.
    let connectionCount = 0;

    const reconnectServer = http.createServer((req, res) => {
      connectionCount++;
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write(
        `data: ${JSON.stringify({ type: "status", screeningId: "s1", message: `connection ${connectionCount}` })}\n\n`,
      );
      // Close immediately to trigger reconnect.
      res.end();
    });

    await new Promise<void>((resolve) => reconnectServer.listen(0, resolve));
    const addr = reconnectServer.address();
    const port = typeof addr === "object" && addr !== null ? addr.port : 0;

    const received: SSEEvent[] = [];

    const conn = connect(
      `http://localhost:${port}/sse`,
      (e) => received.push(e),
      {
        maxRetries: 2,
        initialBackoffMs: 50,
        maxBackoffMs: 100,
      },
    );

    // Wait for reconnection attempts.
    await waitFor(() => connectionCount >= 3, 5000);
    await new Promise((r) => setTimeout(r, 200));

    // Should have connected 3 times (initial + 2 retries).
    expect(connectionCount).toBeGreaterThanOrEqual(3);
    // Should have received an event from each connection.
    expect(received.length).toBeGreaterThanOrEqual(3);

    conn.close();
    reconnectServer.close();
    await new Promise((r) => setTimeout(r, 50));
  });
});
