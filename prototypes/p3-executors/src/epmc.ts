/**
 * EpmcExecutor — wraps Europe PubMed Central API.
 * Free API, no key required.
 *
 * Expected fields: { author?: string, affiliation?: string, topic?: string, orcid?: string }
 * Returns publications with title, authors, DOI, abstract.
 */

import type { ICheckExecutor, CheckOutcome, ToolResult } from "@cliver/contracts";
import { getCached, setCached } from "./cache.js";

const EPMC_BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest";
const TIMEOUT = 30_000;

function clean(value: string): string {
  return value.replace(/["',\.]/g, "");
}

function buildQuery(opts: { orcid?: string; author?: string; affiliation?: string; topic?: string }): string {
  const parts: string[] = [];
  if (opts.orcid) parts.push(`AUTHORID:("${clean(opts.orcid)}")`);
  if (opts.author) parts.push(`AUTHOR:("${clean(opts.author)}")`);
  if (opts.affiliation) parts.push(`AFF:(${clean(opts.affiliation)})`);
  if (opts.topic) parts.push(`(${clean(opts.topic)})`);
  return parts.length ? parts.join(" AND ") : "*";
}

interface EpmcSearchOpts {
  orcid?: string;
  author?: string;
  affiliation?: string;
  topic?: string;
  mode?: "lite" | "full";
}

function parseArticleFull(article: Record<string, unknown>): Record<string, unknown> {
  const authorList = article.authorList as Record<string, unknown> | undefined;
  const rawAuthors = (authorList?.author || []) as Record<string, unknown>[];
  const authors = rawAuthors.map((a) => {
    const info: Record<string, unknown> = {
      name: a.fullName,
      first_name: a.firstName,
      last_name: a.lastName,
    };
    const authorId = a.authorId as Record<string, unknown> | undefined;
    if (authorId?.type === "ORCID") info.orcid = authorId.value;
    return info;
  });

  const journalInfo = article.journalInfo as Record<string, unknown> | undefined;
  const journal = journalInfo?.journal as Record<string, unknown> | undefined;

  return {
    doi: article.doi,
    title: article.title,
    authors,
    author_string: article.authorString,
    journal: journal?.title,
    pub_year: article.pubYear,
    abstract: article.abstractText,
    cited_by_count: article.citedByCount,
  };
}

export async function searchEpmc(opts: EpmcSearchOpts): Promise<ToolResult> {
  const { orcid, author, affiliation, topic, mode = "full" } = opts;

  if (!orcid && !author && !affiliation && !topic) {
    return {
      tool: "search_epmc",
      query: opts,
      items: [],
      metadata: { error: true, message: "At least one search parameter is required" },
    };
  }

  const cached = getCached<ToolResult>("epmc", opts);
  if (cached) return cached;

  const maxResults = mode === "lite" ? 25 : 5;
  const query = buildQuery({ orcid, author, affiliation, topic });
  const params = new URLSearchParams({
    query,
    resultType: "core",
    pageSize: String(maxResults),
    format: "json",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${EPMC_BASE}/search?${params}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        tool: "search_epmc",
        query: opts,
        items: [],
        metadata: { error: true, message: `EPMC error: ${res.status}`, query },
      };
    }

    const data = await res.json();
    const results = data.resultList?.result || [];
    const parsed = results.map((a: Record<string, unknown>) => parseArticleFull(a));

    const result: ToolResult = {
      tool: "search_epmc",
      query: opts,
      items: parsed,
      metadata: { query, mode, hit_count: data.hitCount || 0 },
    };

    setCached("epmc", opts, result);
    return result;
  } catch (e: unknown) {
    clearTimeout(timeout);
    const message = e instanceof Error ? e.message : String(e);
    return {
      tool: "search_epmc",
      query: opts,
      items: [],
      metadata: { error: true, message: `EPMC request failed: ${message}`, query },
    };
  }
}

export class EpmcExecutor implements ICheckExecutor {
  readonly checkId = "epmc_search";

  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    const author = fields.author as string | undefined;
    const affiliation = fields.affiliation as string | undefined;
    const topic = fields.topic as string | undefined;
    const orcid = fields.orcid as string | undefined;

    if (!author && !affiliation && !topic && !orcid) {
      return {
        checkId: this.checkId,
        status: "error",
        evidence: "No search parameters provided",
        sources: [],
        errorDetail: "At least one of author, affiliation, topic, or orcid is required",
      };
    }

    try {
      const result = await searchEpmc({ author, affiliation, topic, orcid });

      if (result.items.length === 0) {
        return {
          checkId: this.checkId,
          status: "undetermined",
          evidence: `No publications found in Europe PubMed Central`,
          sources: [],
        };
      }

      const sources = result.items.map((_: unknown, i: number) => `epmc${i + 1}`);
      const titles = result.items
        .slice(0, 3)
        .map((item) => `- ${(item as Record<string, unknown>).title}`)
        .join("\n");

      return {
        checkId: this.checkId,
        status: "pass",
        evidence: `Found ${result.items.length} publication(s) in Europe PubMed Central:\n${titles}`,
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
