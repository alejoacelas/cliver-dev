// ============================================================
// @cliver/executors — Check executors + AI layer
//
// All external API wrappers and AI completion layer for the
// Cliver screening platform.
// ============================================================

// --- Check executors ---
export { WebSearchExecutor, searchWeb } from "./web-search.js";
export { ScreeningListExecutor, searchScreeningList } from "./screening-list.js";
export { EpmcExecutor, searchEpmc } from "./epmc.js";
export { OrcidExecutor, getOrcidProfile, searchOrcidWorks } from "./orcid.js";
export { SecureDnaExecutor } from "./secure-dna.js";

// --- AI completion provider ---
export {
  OpenRouterProvider,
  completeWithTools,
  extractStructured,
  generateText,
  formatForModel,
} from "./openrouter.js";
export type { CitationMapping } from "./openrouter.js";

// --- Tool registry ---
export { getToolDefinitions, executeTool } from "./registry.js";

// --- AI action proposer ---
export { proposeActions } from "./proposer.js";
export type { ProposedAction, ProposerContext } from "./proposer.js";

// --- Prompt templates ---
export {
  VERIFICATION_PROMPT,
  WORK_PROMPT,
  EXTRACTION_PROMPT_EVIDENCE,
  EXTRACTION_PROMPT_DETERMINATIONS,
  EXTRACTION_PROMPT_WORK,
  SUMMARY_PROMPT,
  fillTemplate,
} from "./prompts.js";

// --- Cache ---
export { getCached, setCached } from "./cache.js";
