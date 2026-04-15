# KYC Tool Evaluation Pipeline

This document tells a new Claude Code session how to execute the tool evaluation pipeline. Read this fully, then read each stage file before executing it.

## What this pipeline produces

Empirical assessments of KYC screening endpoints — tested against real and adversarial cases — answering: what does each API actually return in practice, where does coverage break down, how do the response fields map to the CSSWG flags, and what fraction of cases can be automated vs. need human review?

The audience is the CSSWG working group and DNA synthesis providers evaluating which tools to adopt.

## Context

The previous pipeline (in `archive-2026-04-kyc-research/`) researched 103 implementation ideas across 20 measures — desk research documenting what each API *claims* to do. This pipeline is the empirical follow-up for 5 priority KYC steps: actually call the APIs with adversarial test cases, record what happens, and produce field-level assessments.

## The 5 KYC steps

| Step | Measure | Flag | CSSWG table reference |
|---|---|---|---|
| **(a) Address → institution** | M05 | No public association between affiliation and shipping address | Line 77 |
| **(b) Payment → institution** | M12 (+M10) | Billing address not associated with the institution; gift card BIN | Lines 82, 84 |
| **(c) Email → affiliation** | M02 (+M07) | Does not match institution domain / non-institutional domain | Line 74 |
| **(d) Residential address** | M04 | Residential address | Line 76 |
| **(e) PO box / freight forwarder** | M03 (+M06) | P.O. Box; freight forwarder address | Line 75 |

Adjacent measures pulled in because they share endpoints: M06, M07, M10, M18, M19.

## Inputs

| Input | Path | Notes |
|---|---|---|
| Existing idea syntheses | `archive-2026-04-kyc-research/pipeline/outputs/ideas/*/07-synthesis.md` | Per-idea research from previous pipeline |
| Product selections | `archive-2026-04-kyc-research/pipeline/outputs/08-product-measure-{NN}.md` | Which ideas were selected per measure |
| API investigations | `archive-2026-04-kyc-research/investigations/a-address-to-institution/` | Deep-dive API docs (ROR, GLEIF, Companies House, OSM, Smarty, Stripe, Plaid, BIN, GeoNames) |
| Measure definitions | `archive-2026-04-kyc-research/pipeline/measures.md` | Canonical measure list with stable numbering |
| Customer dataset | `tool-evaluation/customers.csv` | 535 deanonymized records (name, institution, email, order) from patent/LinkedIn data |
| Credentials | `.env` | Keys for Smarty, Stripe, Plaid, Companies House, Exa, OpenRouter, Screening List, Google Maps, GeoNames |
| LLM+Exa search script | `tool-evaluation/llm-exa-search.py` | Agentic loop: Gemini 3.1 Pro (OpenRouter) + Exa neural search. Used by stage 3 `llm-exa` group. |

## Endpoint inventory

31 endpoints across 9 groups. See [`stages/01-endpoint-map.md`](stages/01-endpoint-map.md) for the full mapping of endpoints to KYC steps.

**API endpoints (17 requiring network calls):**
ROR, GLEIF, RDAP, Consolidated Screening List, OSM Overpass, binlist.net, InCommon/eduGAIN, Smarty, Stripe (test), Plaid (sandbox), Companies House, Exa, GeoNames, Google Places (New API), NIH RePORTER, NSF Awards, UKRI, PubMed, OpenCorporates, ORCID, OpenAlex.

**Local logic (7):**
Disposable/free-mail blocklist, MX/SPF/DMARC, lookalike domain detector, PO Box regex, BIS Country Groups, ISO 3166 normalization, billing-shipping consistency, fintech BIN denylist.

**Docs-only (2):**
Stripe AVS (production), Plaid Identity Match (production).

---

## Pipeline stages

| Stage | File | Agents | Parallelism | Depends on | Effort |
|---|---|---|---|---|---|
| 0 — Credential check | [`stages/00-credential-check.md`](stages/00-credential-check.md) | 1 | Sequential | — | Light |
| 1 — Endpoint map | [`stages/01-endpoint-map.md`](stages/01-endpoint-map.md) | — | Static file | — | — |
| 2 — Seed cases | [`stages/02-seed-cases.md`](stages/02-seed-cases.md) | ~9 | Parallel | Stage 0 | Light |
| 3 — Adversarial testing | [`stages/03-adversarial-testing.md`](stages/03-adversarial-testing.md) | ~9 | Parallel | Stage 2 | **Heavy** |
| 5 — Adversarial review | [`stages/05-adversarial-review.md`](stages/05-adversarial-review.md) | ~9 | Parallel | Stage 3 | Medium |
| 3↺ — Testing re-run | (same as stage 3) | ~9 | Parallel | Stage 5 | Heavy |
| 4 — Field assessment | [`stages/04-field-assessment.md`](stages/04-field-assessment.md) | 5 | Parallel | Stages 3+5 loop | Medium |
| 6 — BOTEC synthesis | [`stages/06-botec-synthesis.md`](stages/06-botec-synthesis.md) | 1 | Sequential | Stage 4 | Medium |
| 7 — Final synthesis | [`stages/07-final-synthesis.md`](stages/07-final-synthesis.md) | 1 | Sequential | Stage 6 | Light |

Stage 1 is a static file (hardcoded endpoint-to-measure mapping), not an agent stage.

**Stage 3↔5 loop:** Stage 5 reviews stage 3 results per endpoint group. High-severity findings trigger a stage 3 re-run with expanded test cases. Up to 3 iterations. Stage 4 runs after the loop completes.

Read each stage file for the full prompt, schema, and output spec.

---

## Output directory structure

```
tool-evaluation/
  run.md                                 # this file
  customers.csv                          # deanonymized test data (535 records)
  stages/                                # stage specs (read before executing)
    00-credential-check.md
    01-endpoint-map.md                   # static — endpoint-to-KYC-step mapping
    02-seed-cases.md
    03-adversarial-testing.md
    04-field-assessment.md
    05-adversarial-review.md
    06-botec-synthesis.md
    07-final-synthesis.md
  00-endpoint-manifest.yaml              # stage 0 output
  00-credential-check.md                 # stage 0 output
  setup-guides/                          # stage 0 (blocked endpoints)
  seed-cases/                            # stage 2 output
    {group-name}.yaml
  results/                               # stage 3 output
    {group-name}.yaml
    {group-name}.md
  assessments/                           # stage 4 output
    {kyc-step}.yaml
    {kyc-step}.md
  adversarial-reviews/                   # stage 5 output (per endpoint group, versioned)
    {group-name}-v{N}.md                 # per-iteration findings
    {group-name}-final.md                # final state after loop
  06-cost-coverage-synthesis.md          # stage 6 output
  07-final-synthesis.md                  # stage 7 output
```

## Verification

After the pipeline completes:
1. Every endpoint group in the manifest has a corresponding results file.
2. Every assessment references real test results (not hallucinated).
3. Spot-check 2-3 API responses by re-running calls manually.
4. Cost numbers in the final synthesis are internally consistent.

## Notes

- **Resumability:** Each stage writes outputs before the next starts. If interrupted, re-run from the last incomplete stage. YAML outputs are source of truth; markdown is derived.
- **Rate limits and budgets:** Stage 0 determines rate limits and sets `max_test_budget` per endpoint. Stage 3 agents read these from the manifest — they are not hardcoded in stage 3.
- **No credential setup automation:** Stage 0 documents what's missing but does NOT create accounts. That's a manual step.
- **LLM+Exa tool:** Runs via `tool-evaluation/llm-exa-search.py` — an agentic loop that sends prompts to Gemini 3.1 Pro (via OpenRouter) with Exa neural search as a tool. The model calls Exa as many times as needed, then produces a final answer. Run with `uv run tool-evaluation/llm-exa-search.py "prompt"` (or `--prompt-file`, `--json` for structured output). Each search prompt is measure-specific. Agents doing case discovery in stages 2-3 use their own web search, not this script.
- **Cross-referencing:** Each API is tested once (in stage 3, grouped by endpoint group). Results are cross-referenced to multiple KYC steps in stage 4.
- **Adversarial mindset:** Stage 3 is the core of the pipeline. The goal is to find where endpoints fail, not confirm they work. A test run that only finds successes has failed at its job.
