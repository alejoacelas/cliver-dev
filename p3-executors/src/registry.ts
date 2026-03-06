/**
 * Tool registry — maps tool names to definitions and executors.
 * Used by the completion provider to resolve tool calls.
 */

import type { ToolDefinition, ToolResult } from "@cliver/contracts";
import { searchWeb } from "./web-search.js";
import { searchScreeningList } from "./screening-list.js";
import { searchEpmc } from "./epmc.js";
import { getOrcidProfile, searchOrcidWorks } from "./orcid.js";

/** All tool definitions available for model tool-calling. */
export const TOOL_DEFINITIONS: Record<string, Omit<ToolDefinition, "type" | "name">> = {
  search_web: {
    description:
      "Search the web for current information using Tavily. Use for real-time data like news, current events, or information not in specialized tools.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query string" },
      },
      required: ["query"],
    },
  },
  search_screening_list: {
    description:
      "Search the US Consolidated Screening List for sanctioned entities, denied parties, and restricted persons or organizations.",
    parameters: {
      type: "object",
      properties: {
        queries: {
          type: "array",
          items: { type: "string" },
          description:
            "List of keywords to match. Each query should be 2-5 distinct words. Multiple queries increase match likelihood.",
        },
      },
      required: ["queries"],
    },
  },
  search_epmc: {
    description:
      "Search Europe PubMed Central for scientific articles and publications by author, institution, topic, or ORCID.",
    parameters: {
      type: "object",
      properties: {
        orcid: { type: "string", description: "Author's ORCID identifier" },
        author: { type: "string", description: "Author name" },
        affiliation: { type: "string", description: "Institution or affiliation" },
        topic: { type: "string", description: "Topic or keywords" },
      },
    },
  },
  get_orcid_profile: {
    description:
      "Get researcher profile from ORCID. Returns name, affiliations, employment, education, and recent publications.",
    parameters: {
      type: "object",
      properties: {
        orcid_id: {
          type: "string",
          description: "ORCID identifier in format XXXX-XXXX-XXXX-XXXX",
        },
      },
      required: ["orcid_id"],
    },
  },
  search_orcid_works: {
    description:
      "Search a researcher's ORCID publications by keyword. Filters their works list by title, journal, or type matching the provided keywords.",
    parameters: {
      type: "object",
      properties: {
        orcid_id: {
          type: "string",
          description: "ORCID identifier in format XXXX-XXXX-XXXX-XXXX",
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Keywords to filter works by (matched against title, journal, type)",
        },
      },
      required: ["orcid_id", "keywords"],
    },
  },
};

/**
 * Get tool definitions formatted for the OpenRouter Responses API.
 */
export function getToolDefinitions(toolNames?: string[]): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  for (const [name, spec] of Object.entries(TOOL_DEFINITIONS)) {
    if (toolNames && !toolNames.includes(name)) continue;
    tools.push({
      type: "function",
      name,
      description: spec.description,
      parameters: spec.parameters,
    });
  }
  return tools;
}

/**
 * Execute a tool by name with the given arguments.
 * Returns a ToolResult conforming to P0 contracts.
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  // Filter out empty/null args
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)) {
      filtered[k] = v;
    }
  }

  switch (name) {
    case "search_web":
      return searchWeb((filtered.query || "") as string);
    case "search_screening_list":
      return searchScreeningList((filtered.queries || []) as string[]);
    case "search_epmc":
      return searchEpmc(filtered as { orcid?: string; author?: string; affiliation?: string; topic?: string });
    case "get_orcid_profile":
      return getOrcidProfile((filtered.orcid_id || "") as string);
    case "search_orcid_works":
      return searchOrcidWorks(
        (filtered.orcid_id || "") as string,
        (filtered.keywords || []) as string[],
      );
    default:
      return {
        tool: name,
        query: args,
        items: [],
        metadata: { error: true, message: `Unknown tool: ${name}` },
      };
  }
}
