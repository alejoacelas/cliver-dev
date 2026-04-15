# m18-ror — Per-idea synthesis

## Section 1: Filled-in schema

### **name**

ROR Research Organization Registry

### **measure**

M18 — institution-legitimacy-soc

### **attacker_stories_addressed**

shell-nonprofit, shell-company, biotech-incubator-tenant, cro-framing, cro-identity-rotation, community-bio-lab-network, gradual-legitimacy-accumulation, dormant-domain, foreign-institution

### **summary**

At onboarding, resolve the customer's claimed institution to a Research Organization Registry (ROR) ID via the ROR REST API's affiliation/match endpoints. ROR is a community-curated, CC0-licensed registry of ~120k research organizations. The check produces (a) match / no-match, (b) match confidence, and (c) red-flag indicators: record younger than 6 months, structural signals of a self-listed shell (zero relationships, zero cross-IDs, single domain, sparse names), inactive/withdrawn status, and metadata anomalies. It is the foundational institution-identity primitive that several other M18/M19 ideas reference.

### **external_dependencies**

ROR REST API v2 (free, optional client ID for higher rate limits); ROR Zenodo data dump (CC0, monthly); human reviewer for ambiguous matches and curation-anomaly review.

### **endpoint_details**

- **Base URL:** `https://api.ror.org/v2/organizations`
- **Match modes:** `?affiliation=<string>` (scored matches for affiliation strings); `?query=<string>` (keyword search, quoted for exact-match); `?query.advanced=<elasticsearch>` (power-user DSL)
- **Auth:** none required; optional free client ID
- **Rate limits:** 2000 req/5min with client ID (indefinite); drops to 50 req/5min after Q3 2026 without client ID
- **Pricing:** free
- **License:** CC0
- **ToS:** none beyond rate-limit politeness; commercial use permitted
- **Data dump:** monthly Zenodo releases

### **fields_returned**

`id` (ROR ID URL), `names` (value/lang/types array), `domains`, `established` (year, nullable), `links` (website, wikipedia), `locations` (geonames details incl. country), `relationships` (parent/child/related/predecessor/successor), `external_ids` (fundref, grid, isni, wikidata), `status` (active/inactive/withdrawn), `types` (Education, Healthcare, Company, Archive, Nonprofit, Government, Facility, Other, Funder), `admin` (created/last_modified with date and schema_version). Affiliation-match responses wrap each match in `{substring, score, matching_type, chosen, organization}`.

### **marginal_cost_per_check**

$0 monetary; 1–2 API calls (~300–800ms wall time [best guess]). **Setup cost:** ~0.5 engineer-day for client + red-flag feature extraction; ~1 hour to register a client ID.

### **manual_review_handoff**

1. `ror_no_match`: try alternate names; if still no match, combine with NIH/NSF/CORDIS null results for reject signal; for foreign/unusual institutions, route to country-specific verification
2. `ror_recent`: pull the curation request from ROR's GitHub issues queue to check provenance
3. `ror_self_listed`: record has no relationships, no cross-IDs, single domain, sparse names — combine with funding null results
4. Document: ROR ID (or null), score, red-flag features, curation issue link, final disposition

### **flags_thrown**

- `ror_no_match` (no record above threshold [best guess: 0.8])
- `ror_match_low_confidence` (top match below 0.95 but above threshold)
- `ror_recent` (record created within 6 months)
- `ror_self_listed` (zero relationships, zero external IDs, ≤1 domains, single name)
- `ror_inactive` (status inactive/withdrawn — hard reject)
- `ror_metadata_anomaly` (type `Other`, no locations, suspicious `established` year)

### **failure_modes_requiring_review**

- API timeout/5xx (fall back to in-memory dump)
- affiliation-string parser misses on heavy abbreviation (try `query` mode fallback)
- Unicode normalization mismatches (NFC vs NFD)
- ROR coverage gaps in non-Anglophone regions
- multi-record orgs where customer matches parent but lab is an unlisted child

### **false_positive_qualitative**

1. Legitimate new institutions → trip `ror_recent` or `ror_no_match`; low absolute numbers, high per-capita rate
2. Commercial/biotech customers → trip `ror_no_match`; largest false-positive population (~30–50% of commercial customers)
3. Under-represented-region researchers → trip `ror_no_match`; disproportionately affects lower-income countries
4. Community bio labs / independents → trip `ror_no_match`; ~100% miss rate for this population
5. Large-company R&D staff → match exists but is uninformative (weak signal)
6. Government sub-units → partial match to parent; may trip `ror_match_low_confidence`

### **coverage_gaps**

1. Commercial/industrial R&D entities not in ROR — ~30–50% of commercial synthesis customers [best guess]
2. Research institutions in under-represented regions (Africa, MENA, Central Asia, parts of Latin America) — 10–25% of non-OECD institution customers lack ROR records [best guess]
3. Community bio labs, makerspaces, independent researchers — ~0% coverage
4. Government agencies/military labs with classified sub-units — <5% of customers, high sensitivity
5. Very new legitimate institutions — 50–200 in curation queue at any time
6. Industrial R&D groups in non-research parent companies — 5–15% of commercial customers get uninformative match

### **record_left**

"ROR resolution report" per check: input (claimed institution string, claimed country); API request URL and full JSON response; computed red-flag features (record age, relationship count, external_ids count, domains count); final flag set + reviewer disposition; ROR API release version.

### **bypass_methods_known**

- ROR self-listing (shell-nonprofit) — CAUGHT
- name-collision reflected legitimacy (shell-nonprofit) — CAUGHT partial
- build entity signals from scratch (shell-company) — CAUGHT
- acquire existing company (shell-company) — AMBIGUOUS
- incubator tenant own LLC (biotech-incubator-tenant) — CAUGHT
- CRO façade (cro-framing) — CAUGHT
- rotated CRO shells (cro-identity-rotation) — CAUGHT
- community lab (community-bio-lab-network) — CAUGHT mostly
- gradual legitimacy accumulation — CAUGHT but degrades over time
- typosquat/lookalike (dormant-domain) — CAUGHT
- foreign institution fabricated — CAUGHT.

### **bypass_methods_uncovered**

1. Acquire lapsed canonical domain (dormant-domain) — ROR status may not reflect institutional closure
2. Long-term legitimacy accumulation >2 years (gradual-legitimacy-accumulation) — red-flag features clear as entity accumulates cross-references
3. Real-institution branches (inbox-compromise, credential-compromise, it-persona-manufacturing) — check validates institution not individual
4. Dangling-DNS subdomain takeover (dormant-domain) — parent institution is valid; fraud is at individual level
5. Real foreign institution misrepresented — institution is legitimate; misrepresentation is at M19 level

---

## Section 2: Narrative

### What this check is and how it works

The ROR check resolves a customer's claimed institutional affiliation against the Research Organization Registry, a community-curated, openly licensed (CC0) database of approximately 120,000 research organizations worldwide. At onboarding, the system sends the customer's claimed institution name to the ROR REST API v2 affiliation-match endpoint, which returns scored candidate matches. If a match exceeds the confidence threshold, the system fetches the full organization record and computes red-flag features: whether the record was created within the past 6 months (`ror_recent`), whether it has the structural hallmarks of a self-listed shell organization (`ror_self_listed` — no parent/child relationships, no cross-references to GRID, ISNI, or Wikidata, single domain, sparse name variants), whether its status is inactive or withdrawn, and whether its metadata is anomalous. The API is free, requires no authentication (though a free client ID is recommended to maintain the 2,000 requests per 5 minutes rate limit beyond Q3 2026), and returns responses in sub-second latency. A monthly Zenodo data dump serves as a fallback if the API is unavailable.

### What it catches

The check directly addresses the primary M18 attacker strategy: fabricating or self-listing a shell organization to pass institution-existence verification. For the shell-nonprofit story, `ror_no_match` fires if the shell has not been listed, and both `ror_recent` and `ror_self_listed` fire if the attacker has submitted a curation request to get the shell into ROR. The reviewer playbook traces provenance by inspecting ROR's public GitHub curation queue. For shell-company, CRO-framing, and biotech-incubator-tenant stories, most fabricated entities are absent from ROR entirely, triggering `ror_no_match`. Typosquat and lookalike domain attacks also produce no-match or ambiguous matches that route to human review. During the buildup phase of gradual-legitimacy-accumulation attacks, the check fires correctly — the entity either has no record or a freshly created one.

### What it misses

The check has three structural blind spots. First, it validates institutions, not individuals — so all attacker branches that compromise real institutional credentials (inbox-compromise, credential-compromise, IT-persona-manufacturing) pass undetected because the institution itself is legitimate. These require M19-level individual verification. Second, the dormant-domain attack can succeed if a defunct institution's ROR record has not been updated to `inactive` status, since ROR's curation pipeline may lag closures by months or years. Third, long-term legitimacy accumulation (2+ years of preprint seeding and cross-referencing) can eventually clear all red-flag features as the shell accumulates GRID, ISNI, and Wikidata cross-references — though this significantly raises the cost and lead time of the attack.

### What it costs

Marginal cost per check is $0 — the API and data dump are free under CC0. Wall time is sub-second for the 1–2 API calls required. Setup cost is approximately half an engineer-day to build the client, implement red-flag feature extraction logic, and register a client ID. There is no ongoing licensing or subscription fee.

### Operational realism

When a flag fires, the order enters a manual review queue with the full ROR resolution report attached: the input affiliation string, the API response JSON, the computed red-flag features, and a link to the ROR curation request on GitHub if the record is recent. The reviewer follows a structured playbook: for `ror_no_match`, they try alternate institution names before concluding the institution is unregistered and combining with NIH/NSF/CORDIS null results; for `ror_recent`, they inspect the curation provenance; for `ror_self_listed`, they look for corroborating signals from other checks. Every disposition is logged with the ROR schema version for audit reproducibility. The main operational burden is the false-positive volume from legitimate commercial and international customers who lack ROR records — the playbook must distinguish "not in ROR because illegitimate" from "not in ROR because the registry is incomplete."

### Open questions

The affiliation-match score threshold of 0.8 is a best guess; the 04C claim check recommended calibrating against empirical data. The API latency estimate (300–800ms) is also unverified. The 06F form check noted that coverage gap size estimates for government sub-units (Gap 4) and industrial R&D groups (Gap 6) lack external citations and rest on reasoning alone. The broader question of how to handle `ror_no_match` for under-represented regions — where absence is not meaningful negative evidence — remains a policy design question rather than a technical one.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** All findings were Moderate or Minor.
- **[best guess] affiliation-match score threshold (0.8):** Not pinned to empirical calibration. Affects the boundary between `ror_no_match` and a match, and thus both false-positive and false-negative rates. (Stage 5, Minor m1; Stage 4C, UPGRADE-SUGGESTED.)
- **[best guess] API latency (300–800ms):** Could be replaced with measured numbers from the publicly accessible API. Non-blocking. (Stage 4C, MINOR.)
- **[best guess] coverage gap size estimates for Gaps 4 and 6:** Government sub-units (<5% of customers) and industrial R&D groups (5–15% of commercial customers) lack external citations. Reasoning is sound but estimates are unverifiable without customer-base data. (Stage 6F, BORDERLINE.)
- **Moderate finding M1 (ROR status lag for dormant-domain attack):** ROR's curation process may lag institutional closures by months or years, allowing an attacker to match a "still-active" defunct institution. Suggestion: add a `ror_stale_record` flag based on `admin.last_modified.date` staleness and cross-reference with domain WHOIS status. Not implemented in current spec.
- **Moderate finding M2 (long-term legitimacy accumulation):** After 2+ years, a persistent attacker can clear all red-flag features. Partially structural — any registry check can be gamed with enough time. Defense-in-depth (ROR + NIH + NSF + CORDIS) is the recommended mitigation.
- **Policy design question:** How to weight `ror_no_match` for customers in under-represented regions where ROR coverage is sparse. This is not a technical fix — it requires a policy decision on differential treatment by geography.
