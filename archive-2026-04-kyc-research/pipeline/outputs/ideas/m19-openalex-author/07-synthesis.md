# m19-openalex-author — Per-idea synthesis

## Section 1: Filled-in schema

### **name**

OpenAlex author + affiliation history lookup

### **measure**

M19 — individual-legitimacy-soc

### **attacker_stories_addressed**

visiting-researcher (partial), unrelated-dept-student (partial), lab-manager-voucher (structural miss), it-persona-manufacturing (partial — weak without preprint, bypassed with one preprint), dormant-account-takeover (miss), account-hijack (miss), foreign-institution (structural weakness), dormant-domain (ambiguous), insider-recruitment (miss), bulk-order-noise-cover (miss)

### **summary**

Resolve the customer to an OpenAlex Author ID via name + claimed institution + optionally ORCID. Pull affiliation history (`affiliations[]`, `last_known_institutions`), publication metrics (`works_count`, `cited_by_count`, `h_index`), and research-area tags (`topics[]`, `x_concepts[]`). Verify the claimed institution appears in recent affiliation history and that the publication footprint is consistent with the customer's claimed seniority and research area. OpenAlex is the broadest open bibliometric source (114M authors, CC0), making it the best single check for publication-based individual verification — but it is a positive-signal instrument, not a denial gate.

### **external_dependencies**

OpenAlex REST API (operated by OurResearch, US 501(c)(3)); free API key required; freemium pricing ($1/day free credit); no other vendor required (ROR IDs embedded in OpenAlex institution records).

### **endpoint_details**

- **Base URL:** `https://api.openalex.org/authors` and `/authors/{id}`
- **Search:** `?search=<name>&filter=last_known_institutions.id:<id>` or `?filter=affiliations.institution.ror:<ror_id>`
- **Single author:** `GET /authors/A1234567` or `/authors/orcid:0000-...`
- **Auth:** free API key required (old anonymous/polite-pool model discontinued)
- **Rate limits (current freemium model):** unlimited single-entity lookups; 10,000 list/filter calls per day; 1,000 full-text search calls per day; $1/day free credit, usage billing beyond
- **Pricing:** [vendor-gated — exact per-call rates beyond the $1/day free credit not extracted]
- **Data license:** CC0 (public domain)
- **Bulk snapshot:** free

### **fields_returned**

`id` (OpenAlex Author ID); `orcid` (if linked); `display_name`, `display_name_alternatives`; `works_count`, `cited_by_count`; `summary_stats.h_index`, `summary_stats.i10_index`, `summary_stats.2yr_mean_citedness`; `affiliations[]` (institution with id/ror/display_name/country_code/type + years[]); `last_known_institutions[]`; `topics[]`, `x_concepts[]`; `counts_by_year[]`; `works_api_url`; `updated_date`, `created_date`.

### **marginal_cost_per_check**

Effectively $0 for typical screening volumes (one search + one entity fetch stays within free tier at <10,000 checks/day). [best guess: ~$0.01–$0.05/customer in amortized infra/disambiguation cost]. **Setup cost:** [best guess: 2–4 engineer-weeks for disambiguation/normalization layer and reviewer UI integration].

### **manual_review_handoff**

Reviewer receives top 3 candidate Author records with match scores, plus 5 most-recent works for the top candidate. **Playbook:**

1. High-confidence match with recent affiliation and topic overlap = verified
2. Candidates exist but none match claimed institution = request publication URL or institutional email
3. Zero candidates = not a denial; route to m19-orcid-employments and m18 checks; require positive signal from at least one
4. Topic mismatch = escalate to m19-role-vs-scope
5. Document selected Author ID in customer record

### **flags_thrown**

- `openalex_no_author_found` (zero candidates — not denial, enrichment required)
- `openalex_affiliation_mismatch` (top candidate lacks claimed institution in recent affiliations)
- `openalex_topic_mismatch` (topics don't overlap order's life-sciences area)
- `openalex_ambiguous_match` (multiple candidates, no ORCID tiebreaker)

### **failure_modes_requiring_review**

- Common-name disambiguation collisions
- author profile merging/splitting
- recently-changed institution (6–18 month lag)
- non-publishing roles invisible
- non-English/non-Latin name normalization failures
- API 429 throttling

### **false_positive_qualitative**

1. Non-publishing staff (lab managers, technicians) — ~15–25% of academic order-placers, 100% miss
2. Industry researchers — ~40–60% of industry staff invisible or stale
3. Under-indexed-venue researchers (non-English, Global South) — ~15–30% of non-OECD researchers; non-English monolingual journals only ~64% covered, multilingual ~55%
4. Early-career researchers — ~10–20% of academic customers with 0–3 publications
5. Recently moved researchers — ~5–10% transient, triggers affiliation mismatch
6. Common-name disambiguation failures — ~5–15% of lookups for common names

### **coverage_gaps**

1. Non-publishing researchers — ~15–25% of academic order-placers
2. Industry/commercial R&D scientists — ~40–60% invisible or stale
3. Early-career researchers — ~10–20% with thin records
4. Under-indexed-venue researchers (non-English, Global South) — ~15–30% of non-OECD researchers
5. Recently moved researchers — ~5–10% transient affiliation mismatch
6. Author disambiguation errors (common names) — ~5–15% of lookups

### **record_left**

Full OpenAlex Author JSON for selected candidate (or top-N set); query string; timestamp and OpenAlex `updated_date`; reviewer's selected Author ID, decision, and free-text note; snapshot URL for re-fetching. CC0 data, stable IDs, re-fetchable.

### **bypass_methods_known**

Manufactured persona with no preprint (it-persona-manufacturing) — CAUGHT weakly (flag fires, routed to corroboration).

### **bypass_methods_uncovered**

1. Institution signal piggyback / no personal footprint needed (visiting-researcher, unrelated-dept-student) — absence is non-denial
2. LLM-assisted preprint seeding ($0–$240) (visiting-researcher, it-persona-manufacturing) — one preprint creates an OpenAlex record with affiliation match
3. Grad-student footprint floor (unrelated-dept-student) — 0–3 pubs is population-normal
4. Real insider with legitimate non-publishing role (lab-manager-voucher, insider-recruitment, bulk-order-noise-cover) — structurally invisible to publication index
5. Dormant-account authentication bypass (dormant-account-takeover, account-hijack) — check validates registered name, not current operator
6. Foreign institution coverage asymmetry (foreign-institution)
7. Dormant-domain historical footprint exploitation (dormant-domain)

---

## Section 2: Narrative

### What this check is and how it works

The OpenAlex author check resolves a customer's name and claimed institution against the OpenAlex bibliometric database, the largest open index of scholarly authors with approximately 114 million author records under a CC0 license. At onboarding, the system queries the OpenAlex API for authors matching the customer's name, filtering by institution (via ROR ID or name). For the top candidates, it retrieves affiliation history, publication count, h-index, citation metrics, and research-area tags. The system then verifies that the claimed institution appears in the author's recent affiliation history and that the research topics are consistent with the order's domain. The API requires a free API key and offers a freemium model with $1/day of free usage credit, sufficient for typical screening volumes.

### What it catches

When a match exists, it provides strong positive evidence: the customer has a real, verifiable publication track at the claimed institution, with metrics that can be assessed for consistency with their claimed seniority and research area. This is most useful for established mid-career and senior academic researchers at OECD institutions who publish regularly in English-language journals with Crossref DOIs. The `openalex_topic_mismatch` flag can catch role-vs-scope anomalies (e.g., a social scientist ordering BSL-3 reagents). For the IT-persona-manufacturing story, a manufactured persona with no publication record triggers `openalex_no_author_found`, which — when combined with null results from other M19 checks — should lead to denial.

### What it misses

The check has extensive blind spots. It is structurally silent on non-publishing populations: lab managers, technicians, and core-facility staff (~15–25% of academic order-placers) never appear in OpenAlex. Industry researchers (~40–60% of industry R&D staff) are invisible or show stale academic affiliations. Early-career researchers with 0–3 publications are indistinguishable from attackers with thin footprints. The most concerning bypass is preprint seeding: an attacker who posts a single preprint on bioRxiv ($0, 1–2 weeks) creates a valid OpenAlex record with institutional affiliation, fully defeating the check. Authentication-layer attacks (account hijack, dormant-account takeover) are invisible because the check validates the registered identity, not the current operator. Geographic and linguistic biases reduce effectiveness for non-OECD researchers: non-English monolingual journals have only ~64% OpenAlex coverage, and Africa is proportionally as under-represented as in Scopus.

### What it costs

Marginal cost per check is effectively $0 at typical screening volumes (the free tier covers unlimited single-entity lookups and 10,000 filter calls per day). The real cost is in the disambiguation and normalization layer, estimated at 2–4 engineer-weeks for setup. There is no licensing or subscription fee for the data itself (CC0).

### Operational realism

The central operational challenge is that the most common outcome — `openalex_no_author_found` — is not actionable in isolation. The implementation correctly handles this by treating absence as "not a denial" and routing to corroboration checks (ORCID, institutional checks). The reviewer playbook is a five-step process that produces a verified Author ID when a match exists, requests additional evidence when candidates are ambiguous, and escalates when topic distribution is implausible. The audit trail is strong: OpenAlex IDs are stable, the data is CC0, and the full Author JSON is persisted. The main reviewer burden is disambiguation for common names without ORCID linkage — approximately 5–15% of lookups for common names produce ambiguous results requiring manual adjudication.

### Open questions

The 04C claim check flagged that the implementation's rate-limit and authentication descriptions were stale — OpenAlex has transitioned from the anonymous polite-pool model to a required API key with freemium pricing. The implementation document has been updated to reflect this, but the exact per-call pricing beyond the $1/day free credit remains [vendor-gated]. The hardening report's moderate finding M2 raises the question of whether a minimum-footprint threshold (e.g., works_count >= 3 with at least one cited work) should be required before treating an OpenAlex match as positive signal — this would mitigate preprint seeding but increase false positives on legitimate early-career researchers. The reviewer playbook's handling of topic mismatch (step 4) depends on the order containing structured domain information, which may not always be available.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.**
- **Moderate finding M1 (early-career/non-publishing populations make absence non-informative):** 15–30% of legitimate customers have thin footprints; the check must treat absence as non-denial, which means it provides zero negative signal against the dominant attacker patterns. Structural — no fix within the OpenAlex check alone.
- **Moderate finding M2 (single seeded preprint defeats the check for $0–$240):** OpenAlex indexes preprints; one preprint = affiliation match. No mechanism to evaluate publication quality/depth. A minimum-footprint threshold would mitigate this but increase false positives on early-career researchers. Design decision needed.
- **Moderate finding M3 (authentication-layer attacks invisible):** Account hijack and dormant-account takeover are structural misses — M19 validates identity, not current operator. These are M16 concerns.
- **[vendor-gated] Exact per-call pricing beyond the $1/day free credit:** Described in OpenAlex API docs but specific $/unit not extracted.
- **Stale rate-limit/auth model (corrected):** The 04C claim check identified the old polite-pool model description as stale. The implementation v1 document has been updated to reflect the current API-key + freemium model, but should be re-verified before production deployment.
- **Minor finding m1 (dormant-domain institutional currency):** Reviewer playbook does not specify checking whether the matched institution has recent indexed works. A defunct institution with historical OpenAlex presence would appear legitimate. Suggested fix: add a playbook step to verify recent institutional activity.
- **Minor finding m2 (foreign-institution coverage gap):** OpenAlex coverage is lowest where M19 verification is most needed (non-OECD, non-English venues). Structural limitation, no fix within OpenAlex.
- **ORCID linkage:** Only ~8M of 114M OpenAlex authors have ORCID links. Requiring ORCID at order time would dramatically improve disambiguation but creates its own coverage barrier (see m19-orcid-employments).
