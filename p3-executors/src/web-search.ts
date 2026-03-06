/**
 * WebSearchExecutor — wraps Tavily search API.
 * Implements ICheckExecutor from P0 contracts.
 *
 * Expected fields: { query: string }
 * Returns normalized items with title, url, snippet.
 */

import type { ICheckExecutor, CheckOutcome, ToolResult } from "@cliver/contracts";
import { getCached, setCached } from "./cache.js";

const TAVILY_URL = "https://api.tavily.com/search";

export interface TavilyItem {
  url: string;
  title: string;
  content: string;
}

export async function searchWeb(query: string): Promise<ToolResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is required");

  const cached = getCached<ToolResult>("tavily", { query });
  if (cached) return cached;

  const res = await fetch(TAVILY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: 10,
      chunks_per_source: 5,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const result: ToolResult = {
      tool: "search_web",
      query,
      items: [],
      metadata: { error: `Tavily error ${res.status}: ${text}` },
    };
    return result;
  }

  const data = await res.json();
  const items = (data.results || [])
    .filter((r: TavilyItem) => r.url)
    .map((r: TavilyItem) => ({
      url: r.url,
      title: r.title || "",
      snippet: (r.content || "").slice(0, 500),
    }));

  const result: ToolResult = {
    tool: "search_web",
    query,
    items,
    metadata: {},
  };

  setCached("tavily", { query }, result);
  return result;
}

export class WebSearchExecutor implements ICheckExecutor {
  readonly checkId = "web_search";

  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    const query = fields.query as string | undefined;
    if (!query) {
      return {
        checkId: this.checkId,
        status: "error",
        evidence: "No query provided",
        sources: [],
        errorDetail: "Missing required field: query",
      };
    }

    try {
      const result = await searchWeb(query);

      if (result.items.length === 0) {
        return {
          checkId: this.checkId,
          status: "undetermined",
          evidence: `No results found for query: ${query}`,
          sources: [],
        };
      }

      const sources = result.items.map((_: unknown, i: number) => `web${i + 1}`);
      const snippets = result.items
        .slice(0, 3)
        .map((item) => `- ${(item as Record<string, unknown>).title}: ${(item as Record<string, unknown>).snippet}`)
        .join("\n");

      return {
        checkId: this.checkId,
        status: "pass",
        evidence: `Found ${result.items.length} results for "${query}":\n${snippets}`,
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
