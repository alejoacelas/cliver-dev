import type { ToolDefinition } from "@cliver/contracts";

export const WEB_SEARCH_TOOL: ToolDefinition = {
  type: "function",
  name: "search_web",
  description: "Search the web for current information.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "The search query" },
    },
    required: ["query"],
  },
};

export const EPMC_TOOL: ToolDefinition = {
  type: "function",
  name: "search_epmc",
  description: "Search Europe PubMed Central for scientific publications.",
  parameters: {
    type: "object",
    properties: {
      author: { type: "string", description: "Author name" },
      affiliation: { type: "string", description: "Institution" },
      topic: { type: "string", description: "Topic or keywords" },
    },
  },
};

export const ORCID_PROFILE_TOOL: ToolDefinition = {
  type: "function",
  name: "get_orcid_profile",
  description: "Get researcher profile from ORCID.",
  parameters: {
    type: "object",
    properties: {
      orcid_id: { type: "string", description: "ORCID identifier" },
    },
    required: ["orcid_id"],
  },
};

export const RESEARCH_TOOLS: ToolDefinition[] = [
  WEB_SEARCH_TOOL,
  EPMC_TOOL,
  ORCID_PROFILE_TOOL,
];
