/**
 * OrcidExecutor — wraps ORCID public API.
 * Free API, no key required.
 *
 * Expected fields: { orcid_id: string }
 * Returns profile information: name, affiliation, works count.
 */

import type { ICheckExecutor, CheckOutcome, ToolResult } from "@cliver/contracts";
import { getCached, setCached } from "./cache.js";

const ORCID_BASE = "https://pub.orcid.org/v3.0";
const HEADERS = { Accept: "application/vnd.orcid+json" };
const TIMEOUT = 30_000;
const MAX_WORKS_IN_PROFILE = 5;

function safeGet(data: unknown, ...keys: string[]): unknown {
  let current: unknown = data;
  for (const key of keys) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current ?? undefined;
}

function extractDate(dateObj: unknown): string | null {
  if (!dateObj || typeof dateObj !== "object") return null;
  const d = dateObj as Record<string, Record<string, string>>;
  const parts = [d.year?.value, d.month?.value, d.day?.value].filter(Boolean);
  return parts.length ? parts.join("-") : null;
}

async function fetchEndpoint(orcidId: string, endpoint: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${ORCID_BASE}/${orcidId}/${endpoint}`, {
      headers: HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`ORCID API error: ${res.status}`);
    return res.json();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

function parsePerson(data: unknown): Record<string, unknown> {
  const result: Record<string, unknown> = {
    given_name: safeGet(data, "name", "given-names", "value"),
    family_name: safeGet(data, "name", "family-name", "value"),
    credit_name: safeGet(data, "name", "credit-name", "value"),
    biography: safeGet(data, "biography", "content"),
  };

  const keywords = (safeGet(data, "keywords", "keyword") || []) as Record<string, unknown>[];
  result.keywords = keywords.map((kw) => kw.content).filter(Boolean);

  const emails = (safeGet(data, "emails", "email") || []) as Record<string, unknown>[];
  result.emails = emails.map((e) => e.email).filter(Boolean);

  return result;
}

function parseAffiliations(data: unknown, type: string): Record<string, unknown>[] {
  const affiliations: Record<string, unknown>[] = [];
  const groups = (safeGet(data, "affiliation-group") || []) as Record<string, unknown>[];
  for (const group of groups) {
    const summaries = (group.summaries || []) as Record<string, unknown>[];
    for (const summary of summaries) {
      const affData = summary[`${type}-summary`] as Record<string, unknown> | undefined;
      if (!affData) continue;
      const org = (affData.organization || {}) as Record<string, unknown>;
      const addr = (org.address || {}) as Record<string, unknown>;
      affiliations.push({
        organization: org.name,
        department: affData["department-name"],
        role: affData["role-title"],
        city: addr.city,
        country: addr.country,
        start_date: extractDate(affData["start-date"]),
        end_date: extractDate(affData["end-date"]),
      });
    }
  }
  return affiliations;
}

function parseWorks(data: unknown): Record<string, unknown>[] {
  const works: Record<string, unknown>[] = [];
  const groups = (safeGet(data, "group") || []) as Record<string, unknown>[];
  for (const group of groups) {
    const summaries = (group["work-summary"] || []) as Record<string, unknown>[];
    if (!summaries.length) continue;
    const work = summaries[0];
    const extIds = (safeGet(group, "external-ids", "external-id") || []) as Record<string, unknown>[];
    works.push({
      title: safeGet(work, "title", "title", "value"),
      type: work.type,
      publication_date: extractDate(work["publication-date"]),
      journal: safeGet(work, "journal-title", "value"),
      url: safeGet(work, "url", "value"),
      identifiers: extIds.map((eid) => ({
        type: eid["external-id-type"],
        value: eid["external-id-value"],
      })),
    });
  }
  return works;
}

export async function searchOrcidWorks(orcidId: string, keywords: string[]): Promise<ToolResult> {
  const cached = getCached<ToolResult>("orcid_works", { orcidId, keywords });
  if (cached) return cached;

  try {
    const worksData = await fetchEndpoint(orcidId, "works");
    const allWorks = parseWorks(worksData);
    const keywordsLower = keywords.map(kw => kw.toLowerCase());

    const matching = allWorks.filter(work => {
      const parts = [work.title, work.journal, work.type].filter(Boolean);
      const text = parts.join(" ").toLowerCase();
      return keywordsLower.some(kw => text.includes(kw));
    });

    const result: ToolResult = {
      tool: "search_orcid_works",
      query: { orcidId, keywords },
      items: matching,
      metadata: { orcid_id: orcidId, keywords, total_works: allWorks.length },
    };

    setCached("orcid_works", { orcidId, keywords }, result);
    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const msg = message.includes("404") ? `ORCID ID not found: ${orcidId}` : `ORCID error: ${message}`;
    return {
      tool: "search_orcid_works",
      query: { orcidId, keywords },
      items: [],
      metadata: { error: true, message: msg },
    };
  }
}

export async function getOrcidProfile(orcidId: string): Promise<ToolResult> {
  const cached = getCached<ToolResult>("orcid_profile", { orcidId });
  if (cached) return cached;

  try {
    const [personData, worksData, educationData, employmentData] = await Promise.all([
      fetchEndpoint(orcidId, "person"),
      fetchEndpoint(orcidId, "works"),
      fetchEndpoint(orcidId, "educations"),
      fetchEndpoint(orcidId, "employments"),
    ]);

    const allWorks = parseWorks(worksData);
    const profile: Record<string, unknown> = {
      orcid_id: orcidId,
      orcid_url: `https://orcid.org/${orcidId}`,
      ...parsePerson(personData),
      education: parseAffiliations(educationData, "education"),
      employment: parseAffiliations(employmentData, "employment"),
      total_works_count: allWorks.length,
      works: allWorks.slice(0, MAX_WORKS_IN_PROFILE),
    };

    if (allWorks.length > MAX_WORKS_IN_PROFILE) {
      profile.works_note = `Showing ${MAX_WORKS_IN_PROFILE} of ${allWorks.length} works.`;
    }

    const result: ToolResult = {
      tool: "get_orcid_profile",
      query: orcidId,
      items: [profile],
      metadata: {},
    };

    setCached("orcid_profile", { orcidId }, result);
    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const msg = message.includes("404") ? `ORCID ID not found: ${orcidId}` : `ORCID error: ${message}`;
    return {
      tool: "get_orcid_profile",
      query: orcidId,
      items: [],
      metadata: { error: true, message: msg },
    };
  }
}

export class OrcidExecutor implements ICheckExecutor {
  readonly checkId = "orcid_lookup";

  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    const orcidId = fields.orcid_id as string | undefined;
    if (!orcidId) {
      return {
        checkId: this.checkId,
        status: "error",
        evidence: "No ORCID ID provided",
        sources: [],
        errorDetail: "Missing required field: orcid_id",
      };
    }

    try {
      const result = await getOrcidProfile(orcidId);

      if (result.items.length === 0) {
        return {
          checkId: this.checkId,
          status: "undetermined",
          evidence: `ORCID profile not found for ${orcidId}`,
          sources: [],
        };
      }

      const profile = result.items[0] as Record<string, unknown>;
      const name = profile.credit_name || `${profile.given_name || ""} ${profile.family_name || ""}`.trim() || "Unknown";
      const employment = profile.employment as Record<string, unknown>[] | undefined;
      const affiliation = employment?.[0]?.organization || "Unknown";
      const worksCount = profile.total_works_count || 0;

      return {
        checkId: this.checkId,
        status: "pass",
        evidence: `ORCID profile found: ${name}, affiliated with ${affiliation}, ${worksCount} works`,
        sources: ["orcid1"],
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        checkId: this.checkId,
        status: "error",
        evidence: "",
        sources: [],
        errorDetail: message,
      };
    }
  }
}
