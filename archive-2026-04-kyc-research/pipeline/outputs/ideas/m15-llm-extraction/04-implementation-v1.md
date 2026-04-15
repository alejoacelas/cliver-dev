# m15-llm-extraction — Implementation v1

- **measure:** M15 — soc-self-declaration
- **name:** LLM extraction + deterministic cross-reference
- **modes:** D, A
- **summary:** Use Claude or GPT with structured-output / JSON-schema mode to extract a canonical SOC declaration object from any free-text the customer provides (project description, end-use note, biosafety summary, voucher email body). Compare deterministically to (a) the structured form (m15-structured-form), and (b) the sequence-screening output. Disagreements between the LLM-extracted picture and the form, or between the picture and the sequence content, become flags.

## external_dependencies

- LLM API: Anthropic Claude (Sonnet 4.6 or Haiku 4.5) ([structured outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)) or OpenAI GPT-4o / 5 with structured outputs ([guide](https://developers.openai.com/api/docs/guides/structured-outputs)).
- Internal canonical SOC schema (JSON Schema or Pydantic model — same schema used by m15-structured-form).
- Deterministic comparator (Python).
- Reviewer queue.

## endpoint_details

- **Anthropic Messages API:** `https://api.anthropic.com/v1/messages` with `tools` or `output_format` set to a JSON schema. Auth: `x-api-key` Bearer.
- **OpenAI Responses API:** `https://api.openai.com/v1/responses` with `response_format: {type: "json_schema", strict: true}`. Auth: Bearer.
- **Rate limits:** Anthropic per-org rate-limit tier ranges; OpenAI tier-based RPM/TPM. Both well above any synthesis provider's per-order LLM call rate `[best guess: providers process under 10k orders/day, while tier-2 limits are 60k+ RPM]`.
- **Pricing (April 2026):**
  - Claude Sonnet 4.6: $3 / $15 per million input/output tokens [(Claude pricing)](https://platform.claude.com/docs/en/about-claude/pricing).
  - Claude Haiku 4.5: $1 / $5 per million input/output tokens [(same)](https://platform.claude.com/docs/en/about-claude/pricing).
  - OpenAI GPT-4o: $2.50 / $10 per million input/output tokens [(OpenAI pricing)](https://openai.com/api/pricing/).
  - Batch API: 50% discount on both vendors for asynchronous workloads.
- **ToS:** Both Anthropic and OpenAI permit automated processing of customer-submitted data subject to standard usage policies. Synthesis providers should review the data-retention / training-opt-out terms — Anthropic API does not train on customer data by default, OpenAI API likewise does not since 2023 `[best guess based on standard published vendor policies; legal review required for the actual deployment]`.

## fields_returned

The extractor produces a JSON object matching the canonical SOC schema:

- `intended_use_category` (e.g. `vaccine-development`, `diagnostic-assay`, `protein-expression`, `gene-editing-tool`, `other`)
- `host_organism` (taxonomy: kingdom + species when stated)
- `target_gene_or_protein` (free text but normalized)
- `bsl_level_required` (1–4 or null)
- `select_agent_referenced` (bool + which one if yes)
- `ibc_status_referenced` (bool + protocol id if stated)
- `confidence` (float 0–1, model self-rated; not load-bearing but useful for triage)
- `extracted_quotes` (list of verbatim spans the model relied on — for reviewer audit)

The deterministic comparator returns:

- `form_extracted_diffs` (list of fields where the form value disagrees with the LLM extraction)
- `sequence_extraction_disagreement` (LLM said `host_organism = E. coli`, sequence screening said `Bacillus anthracis`)
- `disagreement_severity` (low / medium / high)

## marginal_cost_per_check

- Per-order tokens: typical end-use note ~500 tokens in, ~300 tokens out → at Sonnet 4.6: ~$0.006 per call; at Haiku 4.5: ~$0.002 per call.
- Allow 2–3 calls per order (extraction + adjudication on disagreement) → ~$0.005–$0.02 marginal per order.
- **setup_cost:** 2–4 engineer-weeks: schema definition, prompt engineering, comparator, eval set, reviewer integration.

## manual_review_handoff

1. LLM extracts canonical object from each free-text field.
2. Deterministic comparator runs against the form submission and the sequence-screening output.
3. If `disagreement_severity = high` (e.g., LLM extracted `select agent: yes` but the form says `no`, OR sequence screening hit a SOC the LLM extraction didn't reference) → priority reviewer queue.
4. Reviewer reviews the LLM's `extracted_quotes` to verify the extraction is faithful to the customer text. If the LLM hallucinated → discard the flag; if faithful → contact customer for clarification.
5. If the customer's free text says "this work is exempt from biosafety review" but sequence content is a SOC → escalate to scientific review.
6. Adjudication note + LLM JSON output saved with the order.

## flags_thrown

- `llm_extraction_disagreement` — LLM-extracted object disagrees with the form on any controlled field → reviewer queue.
- `llm_form_mismatch` — specific case where the form's `intended_use_category` and the LLM's diverge.
- `llm_sequence_disagreement` — LLM-extracted picture doesn't align with sequence-screening output (declared use is `vaccine adjuvant` but sequence is a known toxin gene) → priority queue.
- `llm_low_confidence` — model returns low confidence and free text is too vague to extract → reviewer queue (this is the structural M15 vague-declaration vector).
- `llm_extraction_unparseable` — strict JSON validation failed even after retries → fall back to manual.

## failure_modes_requiring_review

- Model hallucination: extracts something the customer didn't actually say. Mitigated by the `extracted_quotes` audit field but not eliminated.
- Customers writing in non-English languages — extraction quality varies; English performance is best, other major languages are usable, low-resource languages should fall back to manual.
- Customers writing extremely short / vague text where there's nothing to extract — `llm_low_confidence` is the right flag here, not a fail.
- Strict-JSON-mode failure (rare with structured outputs but possible).
- API outage on either vendor — implement vendor failover.

## false_positive_qualitative

- Researchers using non-standard organism names (informal lab shorthand) that the LLM normalizes incorrectly.
- Researchers whose project genuinely spans multiple use categories — single-category extraction loses nuance and triggers false disagreements with the form.
- Researchers writing in dense academic prose with hedging and conditionals — LLM may extract a specific claim where the customer was being deliberately tentative.
- Foreign customers with translated text (machine-translation artifacts).

## record_left

- LLM JSON output (immutable, hashed).
- The exact prompt and model version used.
- The deterministic comparator diff.
- Reviewer adjudication.
- All retained in the order audit record.

## Notes

- Recent literature documents the growing interest in using LLM-driven extraction for synthesis-order legitimacy verification ([Safeguarding Mail-Order DNA Synthesis in the Age of AI](https://pmc.ncbi.nlm.nih.gov/articles/PMC11313546/)). One published evaluation [(AI-Assisted Customer Screening for DNA Synthesis Orders, Turner)](https://blog.stephenturner.us/p/ai-customer-screening-dna-synthesis) found Gemini 2.5 Pro with bibliographic + sanctions tools achieved a ~90% pass rate vs ~80% for human screeners on the legitimacy task — relevant baseline for the marginal value of LLM-in-the-loop here.
- Crucially: this idea is *cross-reference*, not stand-alone judgment. The LLM is doing extraction, not deciding legitimacy.
