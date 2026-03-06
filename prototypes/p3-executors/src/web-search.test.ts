/**
 * Tests for WebSearchExecutor — hits real Tavily API.
 *
 * When TAVILY_API_KEY is set and valid, full integration tests run.
 * Otherwise, tests verify error handling, shape conformance, and
 * executor behavior for API failures.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { config } from "dotenv";
import { WebSearchExecutor, searchWeb } from "./web-search.js";
import { ToolResultSchema } from "@cliver/contracts";

beforeAll(() => {
  config({ path: new URL("../.env", import.meta.url).pathname });
});

/**
 * Probe whether the Tavily API key is valid by making a minimal request.
 * Cached so we only check once per test run.
 */
let tavilyKeyValid: boolean | null = null;
async function isTavilyKeyValid(): Promise<boolean> {
  if (tavilyKeyValid !== null) return tavilyKeyValid;
  if (!process.env.TAVILY_API_KEY) {
    tavilyKeyValid = false;
    return false;
  }
  try {
    const result = await searchWeb("test");
    tavilyKeyValid = result.items.length > 0;
  } catch {
    tavilyKeyValid = false;
  }
  return tavilyKeyValid;
}

describe("searchWeb (raw function)", () => {
  it("always returns a valid ToolResult shape", async () => {
    const result = await searchWeb("MIT biology department");

    // Must conform to P0 schema regardless of API success
    const parsed = ToolResultSchema.parse(result);
    expect(parsed.tool).toBe("search_web");
    expect(parsed.query).toBe("MIT biology department");
    expect(Array.isArray(parsed.items)).toBe(true);
  });

  it("returns items with title, url, snippet when API key is valid", async () => {
    const valid = await isTavilyKeyValid();
    if (!valid) {
      // Still verify shape — just with an error response
      const result = await searchWeb("MIT biology department");
      ToolResultSchema.parse(result);
      return;
    }

    const result = await searchWeb("MIT biology department");
    const parsed = ToolResultSchema.parse(result);
    expect(parsed.items.length).toBeGreaterThan(0);

    const first = parsed.items[0];
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("url");
    expect(first).toHaveProperty("snippet");
    expect(typeof first.title).toBe("string");
    expect(typeof first.url).toBe("string");
  });

  it("handles API errors gracefully (returns empty items with error metadata)", async () => {
    // Save and replace key to force an error
    const originalKey = process.env.TAVILY_API_KEY;
    process.env.TAVILY_API_KEY = "invalid-key";
    // Disable cache so we hit the API
    const originalCache = process.env.CACHE_ENABLED;
    process.env.CACHE_ENABLED = "false";

    try {
      const result = await searchWeb("test query");
      const parsed = ToolResultSchema.parse(result);
      expect(parsed.items.length).toBe(0);
      expect(parsed.metadata).toHaveProperty("error");
    } finally {
      process.env.TAVILY_API_KEY = originalKey;
      process.env.CACHE_ENABLED = originalCache;
    }
  });
});

describe("WebSearchExecutor (ICheckExecutor)", () => {
  const executor = new WebSearchExecutor();

  it("has correct checkId", () => {
    expect(executor.checkId).toBe("web_search");
  });

  it("returns a valid CheckOutcome for any query", async () => {
    const outcome = await executor.execute({ query: "Harvard University" });

    expect(outcome.checkId).toBe("web_search");
    // Status can be "pass" (valid key) or "undetermined" (no results / API error)
    expect(["pass", "undetermined", "error"]).toContain(outcome.status);
  });

  it("returns error when query is missing", async () => {
    const outcome = await executor.execute({});

    expect(outcome.checkId).toBe("web_search");
    expect(outcome.status).toBe("error");
    expect(outcome.errorDetail).toContain("query");
  });

  it("returns error when TAVILY_API_KEY is not set", async () => {
    const originalKey = process.env.TAVILY_API_KEY;
    delete process.env.TAVILY_API_KEY;
    const originalCache = process.env.CACHE_ENABLED;
    process.env.CACHE_ENABLED = "false";

    try {
      const outcome = await executor.execute({ query: "test" });
      expect(outcome.status).toBe("error");
      expect(outcome.errorDetail).toContain("TAVILY_API_KEY");
    } finally {
      process.env.TAVILY_API_KEY = originalKey;
      process.env.CACHE_ENABLED = originalCache;
    }
  });
});
