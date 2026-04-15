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
| **(c) Email → affiliation** | M02 | Does not match institution domain / non-institutional domain | Line 74 |
| **(d) Residential address** | M04 | Residential address | Line 76 |
| **(e) PO box / freight forwarder** | M03 (+M06) | P.O. Box; freight forwarder address | Line 75 |

Adjacent measures pulled in because they share endpoints: M06, M07, M10.

## Inputs

| Input | Path | Notes |
|---|---|---|
| Existing idea syntheses | `archive-2026-04-kyc-research/pipeline/outputs/ideas/*/07-synthesis.md` | Per-idea research from previous pipeline |
| Product selections | `archive-2026-04-kyc-research/pipeline/outputs/08-product-measure-{NN}.md` | Which ideas were selected per measure |
| API investigations | `archive-2026-04-kyc-research/investigations/a-address-to-institution/` | Deep-dive API docs (ROR, GLEIF, Companies House, OSM, Smarty, Stripe, Plaid, BIN, GeoNames) |
| Measure definitions | `archive-2026-04-kyc-research/pipeline/measures.md` | Canonical measure list with stable numbering |
| Customer dataset | `tool-evaluation/customers.csv` | 535 deanonymized records (name, institution, email, order) from patent/LinkedIn data |
| Credentials | `.env` | Keys for Smarty, Stripe, Plaid, Companies House, Exa, Tavily, Screening List |

## Endpoint inventory

After deduplication by underlying API, the distinct endpoints:

**Free / no-auth (hit live):**
- ROR API v2 — research org registry (~110K orgs). Measures: M02, M05, M07, M12.
- GLEIF API — legal entity identifiers (~2.9M entities). Measures: M05, M12.
- RDAP/WHOIS — domain registration data. Measures: M02.
- Consolidated Screening List API — OFAC SDN, BIS Entity List, DPL, UVL, etc. Measures: M06.
- OSM Overpass — campus polygon containment. Measures: M05.
- binlist.net — free BIN lookup. Measures: M10.
- InCommon/eduGAIN — academic federation IdP list. Measures: M07.
- ISO country normalization — local logic, no API. Measures: M06.
- PO Box regex — local logic. Measures: M03.

**Credentialed (have keys in .env):**
- Smarty US Street API — address verification (RDI, CMRA, DPV). 250 free/month. Measures: M03, M04, M05.
- Stripe test mode — card metadata + AVS. Free, deterministic test responses. Measures: M10, M12.
- Plaid sandbox — bank account Identity Match. Free, synthetic data. Measures: M12.
- Companies House — UK company registry. Free, 600 req/5min. Measures: M05, M12.
- Exa neural search — standalone LLM+search tool. Measures: all (as alternative to structured APIs).
- Tavily search — fallback web search.

**Missing credentials (document setup, don't test):**
- GeoNames — reverse geocoding, campus coordinates. Needs account creation.
- Google Places — business presence detection. Needs API key.
- BinDB — commercial BIN database. Optional, paid.

**Documentation-only (use docs + coverage matrices, not live calls):**
- Stripe AVS in production — live responses vary by issuer/country; test mode is deterministic.
- Plaid Identity Match in production — sandbox is synthetic.
- Google Places business detection — docs sufficient for coverage assessment.

---

## Pipeline stages

| Stage | File | Agents | Parallelism | Depends on | Effort |
|---|---|---|---|---|---|
| 0 — Credential check | [`stages/00-credential-check.md`](stages/00-credential-check.md) | 1 | Sequential | — | Light |
| 1 — Relevance classification | [`stages/01-relevance-classification.md`](stages/01-relevance-classification.md) | 2 | Parallel | Stage 0 | Light |
| 2 — Test set construction | [`stages/02-test-set-construction.md`](stages/02-test-set-construction.md) | ~8 | Parallel | Stage 1 | Medium |
| 3 — Endpoint testing | [`stages/03-endpoint-testing.md`](stages/03-endpoint-testing.md) | ~8 | Parallel | Stage 2 | Heavy |
| 4 — Field assessment | [`stages/04-field-assessment.md`](stages/04-field-assessment.md) | 5 | Parallel | Stage 3 | Medium |
| 5 — Adversarial review | [`stages/05-adversarial-review.md`](stages/05-adversarial-review.md) | 5 | Parallel | Stage 4 | Medium |
| 6 — BOTEC synthesis | [`stages/06-botec-synthesis.md`](stages/06-botec-synthesis.md) | 1 | Sequential | Stage 5 | Light |
| 7 — Final synthesis | [`stages/07-final-synthesis.md`](stages/07-final-synthesis.md) | 1 | Sequential | Stage 6 | Light |

Read each stage file for the full prompt, schema, and output spec.

---

## Output directory structure

```
tool-evaluation/
  run.md                                 # this file
  customers.csv                          # deanonymized test data (535 records)
  stages/                                # stage execution specs
    00-credential-check.md
    01-relevance-classification.md
    02-test-set-construction.md
    03-endpoint-testing.md
    04-field-assessment.md
    05-adversarial-review.md
    06-botec-synthesis.md
    07-final-synthesis.md
  00-endpoint-manifest.yaml              # stage 0 output
  00-credential-check.md                 # stage 0 output
  setup-guides/                          # stage 0 (blocked endpoints)
    geonames.md
    google-places.md
  01-endpoint-relevance.md               # stage 1 output
  test-sets/                             # stage 2 output
    {endpoint-id}.yaml
  results/                               # stage 3 output
    {endpoint-id}.yaml
    {endpoint-id}.md
  assessments/                           # stage 4 output (revised after stage 5)
    {kyc-step}.yaml
    {kyc-step}.md
  adversarial-reviews/                   # stage 5 output
    {kyc-step}.md
  06-cost-coverage-synthesis.md          # stage 6 output
  07-final-synthesis.md                  # stage 7 output
```

## Verification

After the pipeline completes:
1. Every endpoint in the manifest has a corresponding results file.
2. Every assessment references real test results (not hallucinated).
3. Spot-check 2-3 API responses by re-running calls manually.
4. Cost numbers in the final synthesis are internally consistent.

## Notes

- **Resumability:** Each stage writes outputs before the next starts. If interrupted, re-run from the last incomplete stage. YAML outputs are source of truth; markdown is derived.
- **Rate limit safety:** Stage 3 agents for rate-limited APIs (Smarty, OSM Overpass) implement delays and respect the budget in the manifest.
- **No credential setup automation:** Stage 0 documents what's missing but does NOT create accounts. That's a manual step.
- **LLM+Exa tool:** Runs as a standalone "endpoint" alongside structured APIs. Uses Exa's neural search mode by default. Each search prompt is measure-specific.
- **Cross-referencing:** Each API is tested once; results are cross-referenced to multiple KYC steps in stage 4. The agent testing an endpoint knows which measures it serves and evaluates fields against all relevant flags.
