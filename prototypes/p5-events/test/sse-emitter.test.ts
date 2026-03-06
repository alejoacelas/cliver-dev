import { describe, it, expect, vi, afterEach } from "vitest";
import type { SSEEvent } from "@cliver/contracts";
import { createTestServer, waitFor } from "./helpers.js";
import type { TestServer } from "./helpers.js";

describe("SSE Emitter (via real HTTP)", () => {
  let server: TestServer;

  afterEach(async () => {
    if (server) await server.close();
  });

  it("sets correct SSE headers", async () => {
    server = await createTestServer();

    const response = await fetch(`${server.url}/sse`);
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(response.headers.get("cache-control")).toBe("no-cache");

    // Clean up: end the stream and consume the body.
    server.end();
    await response.text();
  });

  it("writes each event as data: JSON\\n\\n", async () => {
    server = await createTestServer();

    const event1: SSEEvent = {
      type: "status",
      screeningId: "s1",
      message: "Starting...",
    };
    const event2: SSEEvent = {
      type: "status",
      screeningId: "s1",
      message: "Finished.",
    };

    // Start reading.
    const response = await fetch(`${server.url}/sse`);
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    // Push events and end.
    server.push(event1);
    server.push(event2);

    // Small delay to ensure events are sent.
    await new Promise((r) => setTimeout(r, 50));
    server.end();

    // Read the full stream.
    let body = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      body += decoder.decode(value, { stream: true });
    }

    // Parse data lines (ignoring heartbeats and empty lines).
    const dataLines = body
      .split("\n\n")
      .filter((line) => line.startsWith("data: "))
      .map((line) => JSON.parse(line.replace("data: ", "")));

    expect(dataLines).toHaveLength(2);
    expect(dataLines[0]).toEqual(event1);
    expect(dataLines[1]).toEqual(event2);
  });

  it("generator error emits error event before closing stream", async () => {
    server = await createTestServer();

    const response = await fetch(`${server.url}/sse`);
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    // Signal an error on the generator.
    server.error(new Error("Database connection lost"));

    // Read the full stream.
    let body = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      body += decoder.decode(value, { stream: true });
    }

    // Should contain an error event.
    const dataLines = body
      .split("\n\n")
      .filter((line) => line.startsWith("data: "))
      .map((line) => JSON.parse(line.replace("data: ", "")));

    expect(dataLines.length).toBeGreaterThanOrEqual(1);
    const errorLine = dataLines.find(
      (d: any) => d.type === "error",
    );
    expect(errorLine).toBeDefined();
    expect(errorLine.screeningId).toBe(server.screeningId);
    expect(errorLine.message).toBe("Database connection lost");
  });

  it("heartbeat keeps connection alive during idle periods", async () => {
    // Use a very short heartbeat for testing.
    server = await createTestServer({ heartbeatMs: 50 });

    const response = await fetch(`${server.url}/sse`);
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    // Wait for heartbeats.
    await new Promise((r) => setTimeout(r, 200));
    server.end();

    let body = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      body += decoder.decode(value, { stream: true });
    }

    // Should contain heartbeat comments.
    const heartbeats = body
      .split("\n\n")
      .filter((line) => line.trim().startsWith(":heartbeat"));
    expect(heartbeats.length).toBeGreaterThanOrEqual(2);
  });
});
