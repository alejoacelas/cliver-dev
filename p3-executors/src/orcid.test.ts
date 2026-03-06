/**
 * Tests for OrcidExecutor — hits real ORCID public API.
 * No API key required.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { config } from "dotenv";
import { OrcidExecutor, getOrcidProfile, searchOrcidWorks } from "./orcid.js";
import { ToolResultSchema } from "@cliver/contracts";

beforeAll(() => {
  config({ path: new URL("../.env", import.meta.url).pathname });
});

describe("getOrcidProfile (raw function)", () => {
  it("returns profile with name, affiliation, works count", async () => {
    // Josiah Carberry — the ORCID test profile
    const result = await getOrcidProfile("0000-0002-1825-0097");

    const parsed = ToolResultSchema.parse(result);
    expect(parsed.tool).toBe("get_orcid_profile");
    expect(parsed.query).toBe("0000-0002-1825-0097");
    expect(parsed.items.length).toBe(1);

    const profile = parsed.items[0];
    expect(profile).toHaveProperty("orcid_id");
    expect(profile).toHaveProperty("given_name");
    expect(profile).toHaveProperty("family_name");
    expect(profile.orcid_id).toBe("0000-0002-1825-0097");
  });

  it("returns empty result for nonexistent ORCID (not an error)", async () => {
    const result = await getOrcidProfile("0000-0000-0000-0000");

    const parsed = ToolResultSchema.parse(result);
    expect(parsed.items.length).toBe(0);
    expect(parsed.metadata.error).toBe(true);
    // Should not throw — returns empty result
  });
});

describe("searchOrcidWorks", () => {
  it("returns matching works filtered by keyword", async () => {
    // Josiah Carberry — the ORCID test profile
    const result = await searchOrcidWorks("0000-0002-1825-0097", ["psychoceramics"]);

    const parsed = ToolResultSchema.parse(result);
    expect(parsed.tool).toBe("search_orcid_works");
    expect(Array.isArray(parsed.items)).toBe(true);
    expect(parsed.metadata).toHaveProperty("total_works");
    expect(parsed.metadata).toHaveProperty("keywords");
  });

  it("returns empty items when no works match keywords", async () => {
    const result = await searchOrcidWorks("0000-0002-1825-0097", ["nonexistentkeywordxyz123"]);

    const parsed = ToolResultSchema.parse(result);
    expect(parsed.items.length).toBe(0);
    expect(parsed.metadata.total_works).toBeDefined();
  });

  it("handles nonexistent ORCID gracefully", async () => {
    const result = await searchOrcidWorks("0000-0000-0000-0000", ["biology"]);

    const parsed = ToolResultSchema.parse(result);
    expect(parsed.items.length).toBe(0);
    expect(parsed.metadata.error).toBe(true);
  });
});

describe("OrcidExecutor (ICheckExecutor)", () => {
  const executor = new OrcidExecutor();

  it("has correct checkId", () => {
    expect(executor.checkId).toBe("orcid_lookup");
  });

  it("returns pass with profile info for valid ORCID", async () => {
    const outcome = await executor.execute({ orcid_id: "0000-0002-1825-0097" });

    expect(outcome.checkId).toBe("orcid_lookup");
    expect(outcome.status).toBe("pass");
    expect(outcome.sources).toContain("orcid1");
    expect(outcome.evidence).toContain("ORCID profile found");
  });

  it("returns undetermined for nonexistent ORCID (not error)", async () => {
    const outcome = await executor.execute({ orcid_id: "0000-0000-0000-0000" });

    expect(outcome.checkId).toBe("orcid_lookup");
    expect(outcome.status).toBe("undetermined");
    expect(outcome.evidence).toContain("not found");
  });

  it("returns error when orcid_id missing", async () => {
    const outcome = await executor.execute({});

    expect(outcome.status).toBe("error");
    expect(outcome.errorDetail).toContain("orcid_id");
  });
});
