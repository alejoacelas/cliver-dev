/**
 * Prompt templates for the AI layer.
 *
 * These are the same prompts used in the existing tool codebase,
 * adapted for the prototype. Templates use {{placeholder}} syntax.
 */

export const VERIFICATION_PROMPT = `Screen the following customer order for a synthetic DNA provider:
{{customer_info}}

Assign FLAG / NO FLAG / UNDETERMINED status for each criterion:

1. Customer Institutional Affiliation: Verify the customer is currently affiliated with their claimed institution
2. Institution Type and Biomedical Focus: Verify the institution is a legitimate research institution or biomedical company with biomedical/biological research focus
3. Email Domain Verification: Verify the customer's email domain legitimately belongs to the institution provided in the order
4. Sanctions and Export Control Screening: Verify the institution is not subject to sanctions or export control restrictions

Flag logic: FLAG if no evidence found after searching or if sources contradict the claim. UNDETERMINED if evidence exists only from insufficient sources. NO FLAG if at least one sufficient source confirms the criterion. If sufficient sources conflict with each other, FLAG.

Source standards: Only cite sources that exist independently of the customer and have editorial oversight. Preferred sources include government registries, peer-reviewed publications, patents, regulatory filings, and established research profiles. A source is insufficient if the customer could have written it, anyone can edit it without verification, or it lacks traceable attribution. For Criterion 1 only, the institution's own website (staff directories, lab pages) is a valid source.

Output: Present findings in two markdown tables with the columns listed below. Include at most 3 sources for each criterion.

Table 1 — Evidence:
- Criterion (1-4)
- Sources: Tool citation placeholder (e.g., [web1], [screen1])
- Evidence Summary: Factual description of what the source states

Table 2 — Determinations:
- Criterion (1-4)
- Flag Status: FLAG, NO FLAG, or UNDETERMINED`;

export const WORK_PROMPT = `Identify relevant laboratory work for the following customer of a synthetic DNA provider:
{{customer_info}}

Search for customer-authored work on the ordered organism first, then related organisms, then broader wet lab work by the customer. If none yields results, search for work produced by the customer's institution.
Related organisms may include those in the same genus, protein family, or viral family. Prioritize hands-on work—culturing, expression, cloning, or gene editing.

Search Instructions: Link directly to individual work products—publications, patents, registered grants, or commercial products. Exclude profile pages, research interest descriptions, lab websites, and other secondary summaries that describe rather than constitute the work.

Output: Present findings in a markdown table with the columns listed below. Include only work per row, and at most 5 works total (prioritizing by relevance).
- Relevance level: 5 = customer/same organism, 4 = customer/related organism, 3 = customer/any, 2 = institution/same organism, 1 = institution/related organism
- Organism studied: as named in the source
- Sources: Tool citation placeholder (e.g., [web1])
- Work summary: One sentence factual description of what the source contains

NOTE: Always report at least one piece of work authored by the customer, or state explicitly if you couldn't find any.`;

export const EXTRACTION_PROMPT_EVIDENCE = `Extract the Evidence table (Table 1) from the following KYC verification report.

The table has columns: Criterion | Sources | Evidence Summary

For each row:
- criterion: One of "Customer Institutional Affiliation", "Institution Type and Biomedical Focus", "Email Domain Verification", or "Sanctions and Export Control Screening"
- sources: List of tool citation IDs from brackets like [web1], [screen1], [epmc1]
- evidenceSummary: The factual description of what the source states

Return exactly 4 rows, one for each criterion (1-4).

Tool ID mapping reference:
- web1, web2, etc. = web search results
- screen1, screen2, etc. = sanctions screening results
- epmc1, epmc2, etc. = PubMed/EPMC article results
- orcid1, orcid2, etc. = ORCID profile results`;

export const EXTRACTION_PROMPT_DETERMINATIONS = `Extract the Determinations table (Table 2) from the following KYC verification report.

The table has columns: Criterion | Flag Status

For each row:
- criterion: One of "Customer Institutional Affiliation", "Institution Type and Biomedical Focus", "Email Domain Verification", or "Sanctions and Export Control Screening"
- flag: Either "FLAG", "NO FLAG", or "UNDETERMINED"

Return exactly 4 rows, one for each criterion (1-4).`;

export const EXTRACTION_PROMPT_WORK = `Extract the background work table from the following laboratory work report.

The table has columns: Relevance level | Organism studied | Sources | Work summary

For each row:
- relevanceLevel: Integer (5=customer/same organism, 4=customer/related, 3=customer/any, 2=institution/same, 1=institution/related)
- organism: The organism as named in the source
- sources: List of tool citation IDs from brackets like [web1], [epmc1]
- workSummary: One sentence factual description

Return all work rows found (up to 5). If no work was found, return empty rows array.

Tool ID mapping reference:
- web1, web2, etc. = web search results
- epmc1, epmc2, etc. = PubMed/EPMC article results
- orcid1, orcid2, etc. = ORCID profile results`;

export const SUMMARY_PROMPT = `Generate a brief summary (under 25 words) of this KYC verification result for a synthetic DNA order:

{{customer_info}}

=== Verification Analysis ===
{{verification_raw}}

=== Background Work Analysis ===
{{work_raw}}

Guidelines:
- Do NOT include the decision status (PASS/REVIEW/FLAG) in your summary - that is shown separately.
- Focus on the key findings: what was verified, any concerns found, and relevant customer work.
- For clean verifications: briefly note the customer's research focus if present.
- For flagged items: explain the specific concern.
- Be factual and specific.

Note: Prior laboratory work with controlled agents or sequences of concern is a by itself not a reason to flag. It demonstrates the customer has appropriate credentials and biosafety experience to handle such materials.

Write a single sentence summary under 25 words. Respond with only the sentence summary and nothing else.`;

/**
 * Replace template placeholders with actual values.
 */
export function fillTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
