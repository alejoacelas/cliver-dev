# m19-pubmed-scopus — Per-idea synthesis

## Section 1: Filled-in schema

### **name**

PubMed (NCBI E-utilities) + Scopus Author API cross-source author lookup

### **measure**

M19 — individual-legitimacy-soc

### **attacker_stories_addressed**

visiting-researcher (miss — absence is non-denial), unrelated-dept-student (miss), lab-manager-voucher (miss), it-persona-manufacturing (weak — flag fires but non-denial unless all corroboration checks also fail), dormant-account-takeover (miss), account-hijack (miss), foreign-institution (miss — PubMed is US-biomedical-centric), dormant-domain (ambiguous — historical publications persist), insider-recruitment (miss), bulk-order-noise-cover (miss)

### **summary**

Use NCBI E-utilities (ESearch/EFetch on PubMed) and the Elsevier Scopus Author Search API as a second-source corroboration to OpenAlex. Submit author name + affiliation queries; verify the customer's name and claimed institution return at least one indexed work with matching affiliation. PubMed is free and unrestricted; Scopus requires a commercial license for KYC use by a DNA synthesis provider. The primary value is cross-source agreement with OpenAlex, not independent catch capability.

### **external_dependencies**

NCBI E-utilities (free, no commercial restrictions); Elsevier Scopus Search/Author API (**vendor-gated commercial license** for commercial KYC use — free tier is academic-only); human reviewer.

### **endpoint_details**

**PubMed (NCBI E-utilities):** base `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`; `esearch.fcgi?db=pubmed&term=<name>[Author]+AND+<institution>[Affiliation]`; `efetch.fcgi?db=pubmed&id=<PMID>&retmode=xml`; auth: anonymous (3 RPS) or free API key (10 RPS); free; NLM permissive ToS. **Scopus:** base `https://api.elsevier.com/content/`; `search/author?query=AUTHLAST(...)+AND+AUTHFIRST(...)+AND+AFFIL(...)`; `author/author_id/{id}?view=ENHANCED`; auth: API key + institutional token; rate limits [vendor-gated — historically ~5,000 req/week, ~6 RPS; 2026 numbers behind login]; pricing [vendor-gated — commercial license required, likely low-to-mid five figures USD/year]; free tier explicitly prohibits commercial use.

### **fields_returned**

**PubMed:** PMID, Title, Journal, PubDate, AuthorList (LastName, ForeName, Initials, AffiliationInfo[]), MeshHeadingList[], GrantList[], ArticleIdList (PMID, DOI, PMC ID). **Scopus Author (ENHANCED view):** Scopus Author ID, preferred-name, name-variants, affiliation-current (name + Scopus Affiliation ID), affiliation-history[], subject-areas[] (ASJC codes), document-count, cited-by-count, h-index, orcid.

### **marginal_cost_per_check**

**PubMed:** $0 (1 ESearch + optionally 1 EFetch). **Scopus:** $0 per call once licensed, but license itself is [vendor-gated — likely low-to-mid five figures USD/year]. **Setup cost:** PubMed ~1 engineer-day; Scopus ~1 engineer-week + [best guess: 2–6 month sales cycle with Elsevier].

### **manual_review_handoff**

Reviewer receives PubMed search results (PMIDs, titles, years, affiliations) and Scopus author candidate (if licensed). **Playbook:**

1. All sources agree = strong positive
2. PubMed has matches but OpenAlex/ORCID don't = likely under-indexed researcher, verify manually
3. No sources match = does not deny alone; route to institutional verification
4. Sources disagree on affiliation = contact customer, possible recent move

### **flags_thrown**

- `no_pubmed_author` (zero PMIDs for name + affiliation)
- `no_scopus_author` (zero Scopus hits)
- `pubmed_affiliation_stale` (newest matching PMID > 3 years old)
- `pubmed_topic_mismatch` (MeSH headings don't overlap order's life-sciences area)

### **failure_modes_requiring_review**

- PubMed Affiliation field is free-text, only consistently attached post-2014
- PubMed has no native author IDs (weak disambiguation)
- E-utilities 429s
- Scopus institutional token expiry / IP binding
- Scopus license absence (entire path inoperable — degrade to PubMed-only)
- non-life-sciences researchers under-represented in PubMed

### **false_positive_qualitative**

1. Non-biomedical researchers (chemistry, engineering, plant biology) — ~10–20% of customers, PubMed scope limitation
2. Industry scientists — ~40–60% of industry staff
3. Scopus license unavailability — structural; entire Scopus path may be inoperable
4. Non-publishing staff — ~15–25% of academic order-placers
5. Early-career researchers — ~10–20%
6. Pre-2014 affiliation gap — ~5–10% of senior researchers
7. Name disambiguation failures — ~10–15% of common-name PubMed queries

### **coverage_gaps**

1. Non-biomedical researchers — ~10–20% of customers
2. Industry/commercial scientists — ~40–60% invisible
3. Scopus commercial license barrier — structural gap affecting entire Scopus path
4. Early-career researchers — ~10–20%
5. Non-publishing staff — ~15–25% of academic orders
6. Pre-2014 PubMed affiliation limitation — ~5–10% of senior researchers
7. PubMed name disambiguation weakness — ~10–15% of common-name queries

### **record_left**

ESearch query + JSON response (PMID list); EFetch XML for matched PMIDs (AuthorList with AffiliationInfo); Scopus Author ID + Author Retrieval JSON (if licensed); reviewer notes + decision; stable URLs (`pubmed.ncbi.nlm.nih.gov/<PMID>/`).

### **bypass_methods_known**

Manufactured persona without PubMed-indexed publication (it-persona-manufacturing) — CAUGHT weakly (flag fires, routes to enrichment, not denial).

### **bypass_methods_uncovered**

1. No PubMed record is non-denial (visiting-researcher, unrelated-dept-student, lab-manager-voucher, foreign-institution)
2. Seeded PubMed-indexed publication (it-persona-manufacturing, visiting-researcher)
3. Grad-student footprint floor
4. Non-biomedical scope gap
5. Real insider with no publications (lab-manager-voucher, insider-recruitment, bulk-order-noise-cover)
6. Original account holder's record (dormant-account-takeover, account-hijack)
7. Historical affiliation persistence (dormant-domain)
8. Scopus license barrier limiting practical deployment

---

## Section 2: Narrative

### What this check is and how it works

This check queries PubMed (via NCBI E-utilities) and optionally the Elsevier Scopus Author API to verify that a customer has published at least one indexed work under their name at their claimed institution. PubMed is queried using the `Author[Author]` and `Affiliation[Affiliation]` search tags, returning a list of matching PMIDs; for each hit, the full record is fetched including author affiliations, MeSH headings, and grant information. If a Scopus commercial license is available, the Scopus Author Search provides a richer signal: a disambiguated Scopus Author ID, h-index, document count, current and historical affiliations, and subject-area codes. PubMed is free with no commercial-use restrictions (3 RPS anonymous, 10 RPS with API key). Scopus requires a paid commercial license for KYC use by a commercial entity, with pricing that is vendor-gated and likely in the low-to-mid five figures USD per year.

### What it catches

The check's value is primarily as a cross-source corroboration for OpenAlex. When both OpenAlex and PubMed independently confirm the same author-at-institution, the combined signal is stronger than either alone. The `pubmed_topic_mismatch` flag (based on MeSH headings) can catch role-versus-scope anomalies — a customer claiming biology research whose PubMed record is entirely in a different field. For the IT-persona-manufacturing story, a manufactured persona without publications triggers `no_pubmed_author`, which — when combined with failures across all other M19 checks — contributes to denial. Scopus adds author disambiguation and h-index, partially compensating for PubMed's lack of native author IDs.

### What it misses

The check shares all the structural limitations of publication-based verification: non-publishing populations (lab managers, technicians, ~15–25% of academic order-placers), industry researchers (~40–60%), and early-career researchers (~10–20%) are invisible. PubMed is additionally limited by its biomedical scope — researchers in chemistry, engineering, plant biology, and environmental science (~10–20% of synthesis customers) may have robust publication records but zero PubMed-indexed papers. PubMed's lack of native author IDs makes disambiguation weaker than OpenAlex or Scopus: approximately 10–15% of common-name queries produce ambiguous results. The affiliation field is free-text and inconsistently attached to older (pre-2014) records, reducing recall for senior researchers. Authentication-layer attacks, real insiders, and dormant-domain exploitation are all missed for the same structural reasons as the other M19 bibliometric checks.

### What it costs

PubMed is free with minimal setup (approximately one engineer-day). Scopus is the expensive component: a commercial API license likely costs low-to-mid five figures USD per year, with a 2–6 month sales cycle. The incremental bypass-detection capability of Scopus over PubMed + OpenAlex combined is near-zero — its value is in cross-validation and author disambiguation, not in catching attacks that the free sources miss. The cost-benefit of Scopus licensing should be evaluated carefully; PubMed + OpenAlex may provide sufficient bibliometric coverage for most providers.

### Operational realism

The check integrates naturally into the multi-source M19 review pipeline. The reviewer sees PubMed results alongside OpenAlex and ORCID data; cross-source agreement strengthens confidence, disagreement triggers follow-up. The playbook explicitly frames null results as non-denial, preventing the check from becoming a blocking gate on the ~40–60% of customers who have no PubMed presence. If the Scopus license is unavailable, the implementation degrades gracefully to PubMed-only. The audit trail includes ESearch queries, full EFetch XML for matched papers, and stable PubMed URLs for each cited PMID. The `pubmed_affiliation_stale` flag (3-year threshold) catches researchers whose institutional affiliation may no longer be current.

### Open questions

The moderate hardening finding M2 questions whether the Scopus commercial license cost is justified given near-zero incremental bypass detection over free sources. This is a procurement decision that should be informed by the provider's volume and willingness to maintain the Elsevier relationship. The `pubmed_affiliation_stale` threshold of 3 years was flagged as potentially too generous — a 2-year window may be more appropriate, particularly for short-term appointments. PubMed's coverage figure of ~70.9% of all publications (cited to a Cochrane review study) should be verified for the specific subfields relevant to DNA synthesis customers. The pre-2014 affiliation limitation is a permanent gap in PubMed's historical data that cannot be remediated.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.**
- **Moderate finding M1 (PubMed adds no discriminating power beyond OpenAlex):** The check shares all structural limitations of publication-based verification. Its value is cross-source corroboration, not independent detection. This should inform the stage 8 synthesis about whether to recommend PubMed as a separate implementation or fold it into the OpenAlex check as a secondary query.
- **Moderate finding M2 (Scopus commercial license cost vs. incremental value):** Scopus requires [vendor-gated — likely low-to-mid five figures USD/year] for a commercial license. The incremental bypass-detection capability over free sources (OpenAlex + PubMed) is near-zero. Procurement decision needed.
- **Moderate finding M3 (PubMed biomedical-only scope):** ~10–20% of synthesis customers work in non-biomedical fields where PubMed has sparse coverage. PubMed should not be the sole bibliometric check for these populations.
- **[vendor-gated] Scopus commercial API pricing:** Custom-quoted by Elsevier; not published. Likely low-to-mid five figures USD/year.
- **[vendor-gated] Scopus rate limits (2026 numbers):** Behind Elsevier developer portal login. Historical figures (~5,000 req/week, ~6 RPS) may have changed.
- **[unknown — searched for: specific 2026 Scopus quota] Scopus weekly quota:** Single search attempt documented but not confirmed.
- **Minor finding m1 (`pubmed_affiliation_stale` 3-year threshold):** May be too generous for short-term appointments. Consider 2-year window or parameterization by claimed role duration.
- **PubMed pre-2014 affiliation limitation:** Permanent gap in historical metadata. Affects ~5–10% of senior researchers. No remediation possible.
- **Design question: separate implementation or folded into OpenAlex?** PubMed-only (without Scopus) is a strictly weaker version of the OpenAlex check. The stage 8 synthesis should evaluate whether to recommend PubMed as an independent implementation or integrate it as a secondary confirmation within the OpenAlex check flow.
