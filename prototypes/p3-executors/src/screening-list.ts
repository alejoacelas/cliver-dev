/**
 * ScreeningListExecutor — wraps US Consolidated Screening List API.
 *
 * Uses ITA's Data Services Platform API at api.trade.gov.
 * Requires a subscription key (set via SCREENING_LIST_API_KEY env var).
 * Free to register at https://developer.trade.gov.
 *
 * Expected fields: { queries: string[] }
 * Returns matching entities with name, programs, source.
 */

import type { ICheckExecutor, CheckOutcome, ToolResult } from "@cliver/contracts";
import { getCached, setCached } from "./cache.js";

const BASE_URL = "https://api.trade.gov/gateway/v2/consolidated_screening_list/search";
const TIMEOUT = 30_000;

interface ScreeningEntity {
  name: string;
  programs?: string | string[];
  source?: string;
}

function parseEntity(entity: ScreeningEntity): Record<string, unknown> {
  const programsRaw = entity.programs;
  let programs: string[] = [];
  if (typeof programsRaw === "string") programs = programsRaw ? [programsRaw] : [];
  else if (Array.isArray(programsRaw)) programs = programsRaw;

  return {
    name: entity.name,
    programs,
    source: entity.source,
  };
}

async function searchSingle(query: string): Promise<ScreeningEntity[]> {
  const apiKey = process.env.SCREENING_LIST_API_KEY;

  const params = new URLSearchParams({
    q: query,
    fuzzy_name: "true",
  });

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "Cliver-KYC/1.0",
  };

  // The ITA gateway requires a subscription key via header
  if (apiKey) {
    headers["Ocp-Apim-Subscription-Key"] = apiKey;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${BASE_URL}?${params}`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`Screening list API error ${res.status}: ${await res.text()}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Screening list API returned unexpected content-type: ${contentType}`);
    }
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

export async function searchScreeningList(queries: string[]): Promise<ToolResult> {
  if (!queries.length) {
    return {
      tool: "search_screening_list",
      query: queries,
      items: [],
      metadata: { status: "no_queries", message: "No search queries provided.", queries_searched: queries },
    };
  }

  const cached = getCached<ToolResult>("screening_list", { queries });
  if (cached) return cached;

  // Run queries in parallel
  const allResults: ScreeningEntity[] = [];
  const results = await Promise.all(queries.map((q) => searchSingle(q)));
  for (const batch of results) {
    allResults.push(...batch);
  }

  // Deduplicate by name
  const seen = new Set<string>();
  const unique: Record<string, unknown>[] = [];
  for (const entity of allResults) {
    const name = entity.name;
    if (name && !seen.has(name)) {
      seen.add(name);
      unique.push(parseEntity(entity));
    }
  }

  const result: ToolResult = {
    tool: "search_screening_list",
    query: queries,
    items: unique,
    metadata: unique.length
      ? { status: "matches_found", total: unique.length, queries_searched: queries }
      : { status: "no_matches", message: "No matches found in the US Consolidated Screening List.", queries_searched: queries },
  };

  setCached("screening_list", { queries }, result);
  return result;
}

export class ScreeningListExecutor implements ICheckExecutor {
  readonly checkId = "screening_list";

  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    const queries = fields.queries as string[] | undefined;
    if (!queries || !queries.length) {
      return {
        checkId: this.checkId,
        status: "error",
        evidence: "No queries provided",
        sources: [],
        errorDetail: "Missing required field: queries",
      };
    }

    try {
      const result = await searchScreeningList(queries);

      if (result.items.length === 0) {
        return {
          checkId: this.checkId,
          status: "pass",
          evidence: `No matches found in US Consolidated Screening List for: ${queries.join(", ")}`,
          sources: [],
        };
      }

      const sources = result.items.map((_: unknown, i: number) => `screen${i + 1}`);
      const matches = result.items
        .slice(0, 5)
        .map((item) => {
          const r = item as Record<string, unknown>;
          const programs = Array.isArray(r.programs) ? (r.programs as string[]).join(", ") : "";
          return `- ${r.name} (${programs})`;
        })
        .join("\n");

      return {
        checkId: this.checkId,
        status: "flag",
        evidence: `Found ${result.items.length} match(es) in US Consolidated Screening List:\n${matches}`,
        sources,
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
