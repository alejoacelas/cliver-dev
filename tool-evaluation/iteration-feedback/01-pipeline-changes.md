# Pipeline Iteration 2 — Planned Changes

**Author:** Adversarial review agent  
**Date:** 2026-04-15  
**Status:** DRAFT — awaiting user approval  
**Scope:** Changes to pipeline stages and specs for the next run. Does NOT touch LLM+Exa integration (handled by separate agent).

---

## Change 1: Add missing endpoints to the endpoint inventory

**What:** Expand `stages/01-endpoint-map.md` and the manifest with tools that were either mentioned-but-not-tested, found in archive research, or are industry-standard KYC tools omitted from the first run.

### Removed from scope: Entity-level sanctions screening

OFAC SDN, BIS Entity List CSV download, and OpenSanctions were identified as critical tools but are **out of scope** for this pipeline iteration. The pipeline covers BIS country-group screening (which is functional and deterministic). Entity-level sanctions screening (matching specific named parties against OFAC SDN, BIS Entity List, etc.) is a separate concern that the working group should address independently. The "tools not evaluated" section in the final synthesis will note these as available options.

### HIGH — Would meaningfully improve coverage or reduce costs

| # | Tool | KYC step(s) | Access | Eval mode | What it changes |
|---|------|-------------|--------|-----------|-----------------|
| 3 | **Google Places Nearby Search** (type=shipping_service) | e, a | Paid ($0.032/call) | Live test (~10 calls) | Only viable freight forwarder detection approach. Data exists in Google (freight companies appear with keyword) but Nearby Search may surface them without keywords. Test against known freight clusters (Elmont NY, La Cienega LA) + 5 controls. Budget: 173/200 calls remaining. |
| 4 | **EU CORDIS** | a | Free API, no auth | Live test (10-15 cases) | Listed in our own endpoint map header but never tested. EU research funding for ~4,641 orgs across 162 countries. Extends the NIH/NSF/UKRI funder stack to European institutions at zero cost. |
| 5 | **Melissa Global Address Verification** | a, d, e | Paid ($0.003-0.05/call), free trial (1,000 lookups) | Live test via free trial | International address verification with RDI equivalent, PO Box detection, and CMRA flag for 240+ countries. Closes the "no automated residential classification for international addresses" gap (40-55% of orders). |

### MEDIUM — Would refine existing assessments

| # | Tool | KYC step(s) | Access | Eval mode | What it changes |
|---|------|-------------|--------|-----------|-----------------|
| 6 | **SEC EDGAR** | a, b | Free API | Live test (5-8 cases) | US public company filings with precise registered addresses and officer names. Mentioned in Exa results but never standalone-tested. Helps with billing entity verification. |
| 7 | **Google Scholar Profiles** | c | Free (SerpApi ~$0.01/check) | Docs-only + limited live test | Curated researcher profiles with institution and publication list. Could reduce PG-11 (common-name + free email) investigation from 10 min to 3-5 min. Coverage for non-OECD uncertain. |
| 8 | **MaxMind minFraud / Binbase** | b | Paid ($0.005-0.05/check) | Docs-only review | Closes 40% binlist.net null-field coverage gap. But Stripe card.funding is already the primary signal — this adds redundancy, not new capability. |
| 9 | **ORCID OAuth** (proof-of-control) | c | Free (OAuth 2.0) | Docs-only review | Changes the question from "does a matching record exist?" to "does this person control the account?" Partially closes identity binding gap. But only ~2% of records are institution-verified, so binding is to a self-asserted identity. |

### LOW — Deferred (marginal impact, out of scope, or archive already evaluated and dropped)

| # | Tool | KYC step(s) | Access | Eval mode | Why deferred |
|---|------|-------------|--------|-----------|--------------|
| 10 | NeutrinoAPI BIN Lookup | b | Free tier (50/day) | Live test | Fills specific testing gap (11 untested BINs) but marginal overall. |
| 11 | ClinicalTrials.gov | a | Free API | Docs-only | Archive dropped it: "no signal for 60-80% of academic customers." |
| 12 | Candid / IRS Form 990 | a | Free tier + paid API | Docs-only + limited test | Only affects US nonprofits within PG-08 (2% of orders). But PG-08 is the most expensive per-order group, so worth noting. |
| 13 | Kickbox email validation | c | Paid (~$0.005/check) | Docs-only | Archive dropped inbox round-trip as redundant with MX/DMARC/SPF stack. |
| 14 | Wayback CDX API | c | Free API | Docs-only | Archive dropped as redundant with RDAP domain-age checks. |
| 15 | Twilio Lookup v2 (VoIP detection) | adjacent | Paid ($0.005/check) | Docs-only | Phone verification is outside the 5 priority KYC steps (M13). |
| 16 | Identity verification vendors (Jumio, Persona) | adjacent | Paid ($1.20-3.50/check) | Docs-only | Structural gap (identity binding) but requires policy decision from working group first. |
| 17 | D&B / Orbis | a, b | Paid (high 5-figures/yr) | Docs-only | OpenCorporates (already identified, blocked) is cheaper and covers the same core function. |

### Tools archive evaluated and correctly excluded

These were researched in the previous pipeline and deliberately dropped. No need to re-evaluate:
- **Commercial PEP watchlists** (World-Check, Dow Jones, Bridger) — 90% false positive rate on academic populations
- **Proxycurl LinkedIn** — LinkedIn ToS risk, self-asserted data
- **County assessor parcel data** (Regrid/ATTOM) — redundant with RDI at 10-100x cost
- **Scopus / Web of Science** — near-zero incremental over free sources at $10K-50K/yr
- **Registered-agent denylist** — 30-50% false positive rate on legitimate small businesses
- **CreditSafe** — lower coverage than OpenCorporates, similar cost tier

### Grouping for pipeline integration

New endpoints join existing groups or form new ones:

| Endpoint | Group | Rationale |
|----------|-------|-----------|
| OFAC SDN CSV | export-control | Natural fit — same KYC step, same agent |
| BIS Entity List CSV | export-control | Same |
| OpenSanctions | export-control (or new `sanctions-screening` group) | Covers broader sanctions than just export control |
| Google Places Nearby Search | address-classification | Same API family, same credentials |
| EU CORDIS | funding-legitimacy | Same pattern as NIH/NSF/UKRI |
| Melissa | address-classification | Same function as Smarty but international |
| SEC EDGAR | institution-registry (or new `corporate-registry` group) | Corporate verification function |
| Google Scholar | individual-affiliation | Same function as ORCID/OpenAlex |

**Files changed:**
- `stages/01-endpoint-map.md` — add new endpoints to per-step tables and deduplicated list
- `00-endpoint-manifest.yaml` — add entries after credential check
- `stages/00-credential-check.md` — add new endpoints to check

---

## Change 2: Split cost estimates into API-only and full-workflow layers

**What:** Modify `stages/06-botec-synthesis.md` to produce two separate cost views:

1. **API-only automation cost:** What it costs to run every order through all automated checks. This is a hard number — API fees, compute, data downloads. Currently ~$0.036/order.

2. **Full-workflow cost (API + human review):** The blended cost including human time. Currently ~$2.76/order. Present this with explicit confidence intervals reflecting:
   - Uncertainty in profile group fractions (the weakest link)
   - Uncertainty in time estimates (lower-bound bias in investigation times)
   - Uncertainty in cross-step overlap (the 15-20% reduction is unvalidated)

**Specific changes to stage 6 spec:**
- Add a "confidence interval" column to the fraction estimates table
- Present human time as a range (optimistic/expected/pessimistic) rather than a point estimate
- Separate the "overlap reduction" as a clearly labeled assumption with a range (0-25%)
- Add a "workflow model sensitivity" section: what changes if reviews are parallel (separate queues) vs. sequential (single reviewer per order)
- Final output should present: "$X API cost + $Y-Z human cost = $A-B total per order"

**Files changed:**
- `stages/06-botec-synthesis.md` — restructure output spec

---

## Change 3: Add "tools not evaluated" section to final synthesis spec

**What:** Modify `stages/07-final-synthesis.md` to require a section listing tools that exist in the market but were not tested, with rough pricing and expected impact. This gives the CSSWG audience a menu of "what else is available" beyond the free/public tools tested.

**Categories to cover:**
- Corporate verification (D&B, Orbis, CreditSafe) — would reduce PG-07 investigation time
- Sanctions/PEP screening vendors (World-Check, ComplyAdvantage, OpenSanctions) — would address the Consolidated Screening List gap
- Identity verification (Persona, Jumio) — would address the identity binding gap
- International address verification (Melissa, Loqate) — would address the non-US residential classification gap
- Academic databases (Scopus, Web of Science) — would complement OpenAlex/PubMed

**Files changed:**
- `stages/07-final-synthesis.md` — add section 7 to output structure

---

## Change 4: Add end-to-end workflow simulation step

**What:** Add a lightweight validation step between stage 6 (BOTEC) and stage 7 (final synthesis). Take 15-20 representative orders from `customers.csv` spanning all major profile groups, run them through the full 5-step pipeline, and time the human review for non-auto-pass cases.

**Purpose:** Ground-truth the time estimates and overlap reduction. Currently the time estimates are "what a reviewer would probably spend" — this step would produce "what actually happened when we simulated it."

**Implementation:** This doesn't require a new stage file — it can be a section within stage 6 or a brief stage 6.5. The agent would:
1. Select 15-20 orders from customers.csv that span PG-01 through PG-11
2. For each, trace through the 5-step decision logic using existing stage 3 results
3. For non-auto-pass cases, estimate the actual review workflow (what would the reviewer look at, in what order, how long would each lookup take)
4. Compare against the stage 4 profile group time estimates
5. Compute the actual overlap between steps (does step (a) investigation genuinely speed up step (c) for the same order?)

**Files changed:**
- `stages/06-botec-synthesis.md` — add workflow simulation section (or new `stages/06b-workflow-simulation.md`)

---

## Change 5: Acknowledge framework limitations in final synthesis

**What:** Add a brief section to the final synthesis noting that steps (a) and (d) are operationally one step, and step (e) bundles three unrelated problems. Frame this as a recommendation to the working group, not a change to the pipeline's structure.

**Rationale:** The pipeline should map to the CSSWG's current 5-step framework (user's preference), but the empirical findings show that the operational workflow doesn't match the conceptual framework. The synthesis should say this explicitly so the working group can decide whether to restructure.

**Files changed:**
- `stages/07-final-synthesis.md` — add to section 6 (open questions for working group)

---

## Changes NOT being made here (handled by other agents)

- **LLM+Exa integration as a regular endpoint** — separate agent is handling this
- **Re-running stages 2-5** — will happen after these spec changes are approved
- **Expanding the customer dataset** — out of scope for this iteration

---

## Summary of iteration 2 scope

**Status:** APPLIED — all changes below have been made to the pipeline spec files.

**New endpoints added:** 6 live (Google Places Nearby Search, EU CORDIS, SEC EDGAR, Melissa, Google Scholar Profiles) + 2 docs-only (MaxMind/Binbase, ORCID OAuth). Consolidated Screening List removed (entity-level sanctions out of scope).

**Stage spec changes applied:**
- `stages/01-endpoint-map.md` — 37 endpoints (up from 31), updated per-step tables, deduplicated list, and grouping
- `stages/00-credential-check.md` — new endpoint test commands added
- `stages/06-botec-synthesis.md` — API-only vs full-workflow cost split, time estimate ranges, overlap assumption as explicit range (0-25%), workflow simulation section (15-20 case walkthroughs)
- `stages/07-final-synthesis.md` — section 7 "tools not evaluated" with pricing/impact, framework observations in section 6 (steps a/d overlap, step e bundles 3 problems)
- `run.md` — updated endpoint inventory count and list

**Not touched (changed by other agents):**
- `stages/02-seed-cases.md`, `stages/03-adversarial-testing.md`, `stages/04-field-assessment.md`, `stages/05-adversarial-review.md` — already modified by user/other agents

**Estimated impact on pipeline conclusions:**
- Step (e) freight forwarder detection may move from "unsolved" to "partially solved" (Google Places Nearby Search)
- Step (d) international coverage gap partially closed by Melissa
- Step (a) European funding coverage extended by CORDIS
- Step (c) common-name disambiguation may improve with Google Scholar Profiles
- Cost estimates gain confidence intervals, range presentation, and workflow simulation validation
- Final synthesis gains a "what else exists" menu for the working group
