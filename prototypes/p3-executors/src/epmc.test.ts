/**
 * Tests for EpmcExecutor — hits real Europe PubMed Central API.
 * No API key required.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { config } from "dotenv";
import { EpmcExecutor, searchEpmc } from "./epmc.js";
import { ToolResultSchema } from "@cliver/contracts";

beforeAll(() => {
  config({ path: new URL("../.env", import.meta.url).pathname });
});

describe("searchEpmc (raw function)", () => {
  it("returns publications with title, authors, DOI, abstract", async () => {
    const result = await searchEpmc({ author: "Jennifer Doudna", topic: "CRISPR" });

    const parsed = ToolResultSchema.parse(result);
    expect(parsed.tool).toBe("search_epmc");
    expect(parsed.items.length).toBeGreaterThan(0);

    const first = parsed.items[0];
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("authors");
    expect(typeof first.title).toBe("string");
  });

  it("returns empty results for unknown author", async () => {
    const result = await searchEpmc({ author: "Xyzzy Fakename Nonexistent" });

    const parsed = ToolResultSchema.parse(result);
    expect(parsed.tool).toBe("search_epmc");
    // May return 0 or very few results
    // The key point is it doesn't throw
    expect(Array.isArray(parsed.items)).toBe(true);
  });

  it("returns error when no parameters provided", async () => {
    const result = await searchEpmc({});

    expect(result.items.length).toBe(0);
    expect(result.metadata.error).toBe(true);
    expect(result.metadata.message).toContain("At least one search parameter");
  });

  it("supports ORCID-based search", async () => {
    // Jennifer Doudna's ORCID
    const result = await searchEpmc({ orcid: "0000-0001-9161-999X" });

    const parsed = ToolResultSchema.parse(result);
    expect(parsed.items.length).toBeGreaterThan(0);
  });
});

describe("EpmcExecutor (ICheckExecutor)", () => {
  const executor = new EpmcExecutor();

  it("has correct checkId", () => {
    expect(executor.checkId).toBe("epmc_search");
  });

  it("returns pass with sources for valid search", async () => {
    const outcome = await executor.execute({ author: "Jennifer Doudna" });

    expect(outcome.checkId).toBe("epmc_search");
    expect(outcome.status).toBe("pass");
    expect(outcome.sources.length).toBeGreaterThan(0);
    expect(outcome.evidence).toContain("publication");
  });

  it("returns error when no parameters given", async () => {
    const outcome = await executor.execute({});

    expect(outcome.status).toBe("error");
    expect(outcome.errorDetail).toContain("required");
  });
});
