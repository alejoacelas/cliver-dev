/**
 * AI action proposer.
 *
 * Given check results with flags, proposes follow-up actions.
 * Actions are classified as either pre-approved (can run immediately)
 * or consent-required (need customer approval).
 */

import crypto from "node:crypto";
import { z } from "zod";
import type { ICompletionProvider, CheckOutcome } from "@cliver/contracts";

export interface ProposedAction {
  /** Unique action ID. */
  actionId: string;
  /** Human-readable description. */
  description: string;
  /** The check ID this action relates to. */
  relatedCheckId: string;
  /** Whether the customer must consent before this action runs. */
  requiresConsent: boolean;
  /** The check ID to execute if this action is approved. */
  suggestedCheckId: string;
  /** Suggested input fields for the check. */
  suggestedFields: Record<string, unknown>;
}

/**
 * Pre-approved action patterns: these are low-risk follow-ups that
 * can run without explicit consent. They only query public data.
 */
const PRE_APPROVED_PATTERNS = [
  "web_search",
  "screening_list",
  "epmc_search",
  "orcid_lookup",
] as const;

/**
 * Consent-required patterns: these involve accessing non-public
 * information or performing actions with higher risk.
 */
const CONSENT_REQUIRED_PATTERNS = [
  "secure_dna",
] as const;

function requiresConsent(checkId: string): boolean {
  return (CONSENT_REQUIRED_PATTERNS as readonly string[]).includes(checkId);
}

export interface ProposerContext {
  outcomes: CheckOutcome[];
  customerInfo: Record<string, unknown>;
}

const PROPOSER_PROMPT = `You are a KYC screening assistant. Given the following check results, suggest follow-up actions that could resolve flagged or undetermined items.

Customer info:
{{customer_info}}

Check results:
{{check_results}}

For each flagged or undetermined result, suggest ONE specific follow-up action. Each action should be a concrete API call (web search query, ORCID lookup, EPMC search, etc.).

Reply with a JSON array of objects, each with:
- actionId: a unique ID like "follow_up_1"
- description: what the action will do
- relatedCheckId: which check result this follows up
- suggestedCheckId: which executor to use (web_search, screening_list, epmc_search, orcid_lookup, secure_dna)
- suggestedFields: the input fields for the executor

Return ONLY the JSON array, no other text.`;

/** Zod schema for the proposer's structured extraction output. */
const ProposedActionItemSchema = z.object({
  actionId: z.string(),
  description: z.string(),
  relatedCheckId: z.string(),
  suggestedCheckId: z.string(),
  suggestedFields: z.record(z.string(), z.unknown()),
});

const ProposerOutputSchema = z.object({
  actions: z.array(ProposedActionItemSchema),
});

const PROPOSER_EXTRACTION_PROMPT = `Extract the follow-up actions from the KYC screening assistant's response.

For each action:
- actionId: a unique ID like "follow_up_1"
- description: what the action will do
- relatedCheckId: which check result this follows up
- suggestedCheckId: which executor to use (web_search, screening_list, epmc_search, orcid_lookup, secure_dna)
- suggestedFields: the input fields for the executor

Return all proposed actions. If no actions are proposed, return an empty actions array.`;

export async function proposeActions(
  context: ProposerContext,
  provider: ICompletionProvider,
  model: string = "google/gemini-2.5-flash-preview",
): Promise<ProposedAction[]> {
  const flaggedOrUndetermined = context.outcomes.filter(
    (o) => o.status === "flag" || o.status === "undetermined",
  );

  if (flaggedOrUndetermined.length === 0) {
    return [];
  }

  const prompt = PROPOSER_PROMPT
    .replace("{{customer_info}}", JSON.stringify(context.customerInfo, null, 2))
    .replace("{{check_results}}", JSON.stringify(flaggedOrUndetermined, null, 2));

  try {
    const text = await provider.generateText(prompt, model);

    const parsed = await provider.extractStructured(
      text,
      PROPOSER_EXTRACTION_PROMPT,
      ProposerOutputSchema,
      model,
    );

    return parsed.actions.map((item) => {
      const suggestedCheckId = item.suggestedCheckId || "web_search";
      return {
        actionId: item.actionId || `follow_up_${crypto.randomUUID()}`,
        description: item.description || "Follow-up action",
        relatedCheckId: item.relatedCheckId || "",
        requiresConsent: requiresConsent(suggestedCheckId),
        suggestedCheckId,
        suggestedFields: (item.suggestedFields || {}) as Record<string, unknown>,
      };
    });
  } catch {
    return [];
  }
}
