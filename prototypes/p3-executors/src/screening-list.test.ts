/**
 * Tests for ScreeningListExecutor — hits real US Consolidated Screening List API.
 *
 * The ITA API at api.trade.gov requires a subscription key (SCREENING_LIST_API_KEY).
 * If the key is not set, tests that need API results are skipped.
 * Shape and error-handling tests run regardless.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { config } from "dotenv";
import { ScreeningListExecutor, searchScreeningList } from "./screening-list.js";
import { ToolResultSchema } from "@cliver/contracts";

beforeAll(() => {
  config({ path: new URL("../.env", import.meta.url).pathname });
});

const hasApiKey = () => !!process.env.SCREENING_LIST_API_KEY;

describe("searchScreeningList (raw function)", () => {
  it.runIf(hasApiKey())("conforms to ToolResult schema for any query", async () => {
    const result = await searchScreeningList(["Huawei"]);
    const parsed = ToolResultSchema.parse(result);
    expect(parsed.tool).toBe("search_screening_list");
    expect(Array.isArray(parsed.items)).toBe(true);
  });

  it.runIf(hasApiKey())("returns hits for a known sanctioned entity when API key is set", async () => {
    const result = await searchScreeningList(["Huawei"]);

    const parsed = ToolResultSchema.parse(result);
    expect(parsed.items.length).toBeGreaterThan(0);

    const first = parsed.items[0];
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("programs");
    expect(parsed.metadata.status).toBe("matches_found");
  });

  it.runIf(hasApiKey())("returns empty items for a name with no match", async () => {
    const result = await searchScreeningList(["John Q Fakeperson ZZZZZ"]);

    const parsed = ToolResultSchema.parse(result);
    expect(parsed.tool).toBe("search_screening_list");
    expect(parsed.items.length).toBe(0);
    expect(parsed.metadata.status).toBe("no_matches");
  });

  it.runIf(hasApiKey())("passes queries in parallel and records them in metadata", async () => {
    const result = await searchScreeningList(["Huawei", "ZTE Corporation"]);

    const parsed = ToolResultSchema.parse(result);
    expect(parsed.metadata.queries_searched).toEqual(["Huawei", "ZTE Corporation"]);
  });

  it("throws on API errors instead of returning empty results", async () => {
    const originalKey = process.env.SCREENING_LIST_API_KEY;
    process.env.SCREENING_LIST_API_KEY = "invalid-key-for-test";
    const originalCache = process.env.CACHE_ENABLED;
    process.env.CACHE_ENABLED = "false";

    try {
      await expect(searchScreeningList(["Test"])).rejects.toThrow();
    } finally {
      if (originalKey !== undefined) {
        process.env.SCREENING_LIST_API_KEY = originalKey;
      } else {
        delete process.env.SCREENING_LIST_API_KEY;
      }
      process.env.CACHE_ENABLED = originalCache;
    }
  });

  it("returns no_queries status for empty input", async () => {
    const result = await searchScreeningList([]);

    expect(result.items.length).toBe(0);
    expect(result.metadata.status).toBe("no_queries");
  });
});

describe("ScreeningListExecutor (ICheckExecutor)", () => {
  const executor = new ScreeningListExecutor();

  it("has correct checkId", () => {
    expect(executor.checkId).toBe("screening_list");
  });

  it.runIf(hasApiKey())("returns flag for known sanctioned entity when API key is set", async () => {
    const outcome = await executor.execute({ queries: ["Huawei"] });

    expect(outcome.checkId).toBe("screening_list");
    expect(outcome.status).toBe("flag");
    expect(outcome.sources.length).toBeGreaterThan(0);
    expect(outcome.evidence).toContain("Screening List");
  });

  it.runIf(hasApiKey())("returns pass when no matches found (clean name)", async () => {
    const outcome = await executor.execute({ queries: ["John Q Fakeperson ZZZZZ"] });

    expect(outcome.checkId).toBe("screening_list");
    expect(outcome.status).toBe("pass");
    expect(outcome.sources.length).toBe(0);
  });

  it("returns error when API call fails", async () => {
    const originalKey = process.env.SCREENING_LIST_API_KEY;
    process.env.SCREENING_LIST_API_KEY = "invalid-key-for-test";
    const originalCache = process.env.CACHE_ENABLED;
    process.env.CACHE_ENABLED = "false";

    try {
      const outcome = await executor.execute({ queries: ["Test Name"] });
      expect(outcome.checkId).toBe("screening_list");
      expect(outcome.status).toBe("error");
      expect(outcome.errorDetail).toBeDefined();
    } finally {
      if (originalKey !== undefined) {
        process.env.SCREENING_LIST_API_KEY = originalKey;
      } else {
        delete process.env.SCREENING_LIST_API_KEY;
      }
      process.env.CACHE_ENABLED = originalCache;
    }
  });

  it("returns error when queries missing", async () => {
    const outcome = await executor.execute({});

    expect(outcome.status).toBe("error");
    expect(outcome.errorDetail).toContain("queries");
  });
});
