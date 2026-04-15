# m02-ror-domain-match — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | ROR institutional domain match |
| **measure** | M02 — email-affiliation-whois |
| **attacker_stories_addressed** | `lookalike-domain` (CAUGHT: typosquat domain not in ROR record). `shell-nonprofit` (CAUGHT: shell domain vs. real institution name-collision triggers `ror_domain_mismatch`). `dormant-domain` Bypass A (AMBIGUOUS: depends on whether ROR record retains the defunct domain and whether status is updated to inactive). `dormant-domain` Bypass B dangling-DNS (MISSED: apex domain matches, subdomain compromise invisible). All purpose-built-org stories (cro-identity-rotation, cro-framing, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, shell-company): AMBIGUOUS — `ror_no_record` fires but is suppressed by SOP to avoid false positives. All genuine-institutional-email stories (11 stories): MISSED — receive false-positive clean pass via `ror_domain_match`. |
| **summary** | Look up the customer's claimed institution name against the Research Organization Registry (ROR) v2 API; from the matching record extract `links[type=website]` and the `domains[]` array. Strict-match the customer's email apex domain against either. A match is a strong positive signal that the email domain belongs to the claimed institution. The check functions as a high-confidence fast-pass for the academic segment it covers, not as a standalone gate. |
| **external_dependencies** | ROR v2 API (public, free, CC0 data). Optional: monthly ROR data dump on Zenodo for offline matching. |
| **endpoint_details** | **Base URL:** `https://api.ror.org/v2/organizations`. **Query by name:** `?query=<name>`. **Affiliation matcher:** `?affiliation=<freetext>` returns ranked candidates with score (0-1) and `chosen` flag. **Single record:** `/<ror_id>`. **Auth:** None. **Rate limit:** ~2,000 requests / 5 minutes per IP (historically documented). **ToS:** CC0 public-domain data, no commercial-use restriction. **Pricing:** $0. |
| **fields_returned** | ROR v2: `id`, `names[]` (ror_display, label, alias, acronym), `links[]` (website, wikipedia), `domains[]` (bare domain strings — only ~2.1% of records populated as of v1.54), `established`, `locations[]`, `types[]`, `status` (active/inactive/withdrawn), `relationships[]`. Affiliation matcher: `score`, `chosen`, `matching_type`. |
| **marginal_cost_per_check** | $0. One affiliation query + one detail fetch = ~50ms. Setup: ~1 engineer-day. Ongoing: $0 (or 1 cron job for monthly Zenodo dump). |
| **manual_review_handoff** | SOP: (1) Run `affiliation=<institution_name>`, take top candidate if `chosen=true` and `score > 0.9`; else present top 3 to reviewer. (2) Extract website apex and `domains[]`. (3) Compare to email apex (strip subdomains). (4) Match → `ror_domain_match` → pass. (5) No match → `ror_domain_mismatch` → reviewer checks for multiple domains, free-mail, unrelated commercial domain. (6) No ROR candidate `score > 0.5` → `ror_no_record` → degrade gracefully, do not auto-flag. |
| **flags_thrown** | `ror_domain_match` (positive — pass); `ror_domain_mismatch` (reviewer adjudicates); `ror_no_record` (no candidate with score > 0.5 — recorded but not flagged); `ror_inactive` (matched record status != active — elevate). |
| **failure_modes_requiring_review** | ROR coverage uneven outside US/EU (Africa, South/Southeast Asia, Latin America). Institutions with multiple legitimate email domains not enumerated in ROR. Hospitals/government labs listed under parent ministry names. API outage (fall back to cached Zenodo dump). |
| **false_positive_qualitative** | (1) Researchers using personal email (Gmail): `ror_domain_mismatch` fires; estimated 5-15% of academic orders. (2) Multi-domain institutions (university-hospital systems with 3+ email domains): `ror_domain_mismatch` fires systematically for largest academic customers; ~10-20% of R1-equivalent universities affected. (3) Institutions with outdated website URLs in ROR: apex comparison fails silently. [unknown — searched for: "ROR data quality stale URLs", "ROR record accuracy audit"] |
| **coverage_gaps** | (1) Institutions not in ROR (non-OECD, small, newly founded): ROR covers ~70-80% of institutions producing >1 indexed publication/year, but only ~40-50% of all plausible synthesis buyers; Africa coverage particularly thin. (2) `domains[]` field ~98% empty: only 2,366/111,068 records (~2.1%) have populated `domains[]` (Zenodo v1.54); the rest fall back to website-apex comparison which fails for multi-domain institutions. (3) Commercial/industrial customers (~46% of synthesis revenue): not in ROR by design; check is irrelevant for this segment. (4) Researchers using personal email: [best guess: 5-15%]; flagged as `ror_domain_mismatch`. (5) Multi-domain institutions: ~10-20% of R1 universities operate 3+ email domains; systematic FP source for highest-volume academic customers. |
| **record_left** | ROR ID matched, affiliation score, `chosen` flag, the `links[]` and `domains[]` arrays used, email apex compared, final flag. |
| **bypass_methods_known** | Typosquat / lookalike domain (CAUGHT via domain mismatch). Shell-nonprofit with name-collision claim but different domain (CAUGHT). |
| **bypass_methods_uncovered** | All genuine-institutional-email variants (11 stories — receive false-positive clean passes). Purpose-built-org variants with `ror_no_record` suppressed (6 stories). Dangling-DNS subdomain takeover (false-positive pass). ROR self-curation gaming via coordinated multi-author preprints (shell-nonprofit persistence variant). Dormant-domain reanimation where ROR record is stale and still lists the defunct domain. |

---

## Section 2: Narrative

### What this check is and how it works

This check queries the Research Organization Registry (ROR), a free, open, CC0-licensed registry of ~120,000 research organisations worldwide. When a customer claims affiliation with an institution, the check uses ROR's affiliation-matching endpoint to find the best-matching organisation record, then compares the customer's email apex domain against the domains listed in that record. ROR v2 records include a `domains[]` array and `links[type=website]` URLs; the check extracts the apex domain from either. If the email domain matches, the check returns a strong positive signal (`ror_domain_match`). If the institution is found but the domain does not match, `ror_domain_mismatch` triggers manual review. If no ROR record matches the claimed institution at all, `ror_no_record` is recorded but deliberately not flagged, to avoid false positives on legitimate entities outside ROR's coverage. The entire check is free, requires no authentication, and runs in approximately 50 milliseconds per query.

### What it catches

The check reliably catches typosquat and lookalike-domain attacks: a misspelled institutional domain will not appear in the legitimate institution's ROR record, so `ror_domain_mismatch` fires. It also catches the initial phase of shell-nonprofit attacks where the attacker's newly registered domain does not match the name-collision institution's ROR-listed domain. For legitimate academic customers at ROR-listed institutions, the check provides a high-confidence positive signal that accelerates order processing by skipping further manual review. This is the check's primary operational value: it is a fast-pass for the straightforward cases, not a filter for the adversarial ones.

### What it misses

The check misses two structurally distinct categories. First, all genuine-institutional-email attackers (11 stories) receive a false-positive clean pass — the attacker's email domain matches the institution's ROR record because the attacker has a real email on a real institutional domain. The check actively confirms their affiliation, which is the correct technical result but unhelpful for screening. Second, all purpose-built-organisation attackers (6 stories) produce `ror_no_record`, but the SOP deliberately suppresses this signal to avoid flagging the ~46% of customers in the commercial segment who are not in ROR by design. The check also cannot detect dangling-DNS subdomain takeovers (the apex domain matches the parent institution's ROR record) and is potentially gameable via coordinated multi-author preprint submissions to ROR's self-curation pathway. A critical design limitation is that the `domains[]` field is populated for only ~2.1% of ROR records; the remaining ~98% fall back to website-apex comparison, which fails for multi-domain institutions.

### What it costs

Marginal cost per check is $0. ROR is a free, public API with a rate limit of approximately 2,000 requests per 5 minutes — orders of magnitude above any plausible KYC volume. Setup cost is approximately one engineer-day. The optional offline mode (monthly Zenodo data dump) eliminates API dependency entirely. No vendor contract, API key, or ongoing cost is required.

### Operational realism

When `ror_domain_match` fires, the order can proceed without manual review of the affiliation claim — this is the operational payoff. When `ror_domain_mismatch` fires, the reviewer checks whether the institution has multiple legitimate domains (university-hospital systems, alumni email), whether the customer is using personal email, or whether the domain is genuinely unrelated. This review requires institutional knowledge or a quick web search. The main operational concern is false-positive volume from multi-domain institutions (~10-20% of R1 universities) and personal-email researchers (~5-15% of academic orders). The audit trail consists of the ROR ID, affiliation score, domain comparison result, and final flag. A significant limitation is that `ror_no_record` fires on the entire ~46% commercial customer segment and is operationally meaningless for them — the check simply does not apply.

### Open questions

The `domains[]` field population rate of ~2.1% is the check's most significant technical limitation. The implementation discusses `domains[]` as a primary matching path alongside `links[type=website]`, but in practice the check relies almost entirely on website-apex comparison. A design revision to treat `domains[]` as a bonus rather than a co-primary path would better reflect reality. The ROR self-curation pathway's robustness against coordinated manipulation (multi-author preprints creating a false affiliation history) has not been tested. The timeliness with which ROR updates institution status to `inactive` after closure is undocumented — a stale record could give a dormant-domain attacker a clean pass. The rate limit of 2,000/5min is historically documented but the 04C claim check flagged it as worth confirming against current documentation.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 returned PASS with two Moderate and three Minor findings.
- **Stage 5 Moderate finding M1:** `ror_no_record` is suppressed in the SOP, limiting value against 6 purpose-built-organisation stories. Consider redefining `ror_no_record` as a contributing factor in a multi-signal stack rather than a purely suppressed result.
- **Stage 5 Moderate finding M2:** Genuine-institutional-email branches (11 stories) receive false-positive clean passes. Structural to the ROR-as-allowlist approach; not addressable by this idea.
- **Stage 5 Minor finding m1:** Dormant-domain reanimation may receive a clean pass if the defunct institution's ROR record retains the domain and has not been updated to `status=inactive`. ROR's timeliness in updating institution status is undocumented.
- **Stage 5 Minor finding m3:** ROR self-curation is potentially gameable by coordinated multi-author preprint efforts. A platform-level concern for ROR, not fixable in the provider's check.
- **06F Minor flag:** The `domains[]` field is populated for only ~2.1% of records, substantially undermining the check's design. Consider always falling back to website-apex comparison and treating `domains[]` as bonus data when available.
- **[unknown — searched for: "ROR data quality stale URLs", "ROR record accuracy audit"]:** The prevalence of outdated website URLs in ROR records is undocumented. Affects the reliability of the website-apex comparison fallback.
- **[unknown — searched for: "percentage of researchers using personal email for professional orders", "academic scientists gmail for lab purchases"]:** Personal-email prevalence among synthesis customers is unsupported by industry-specific data.
- **[vendor-gated: none]** — ROR is fully open; no vendor-gated fields.
- **Coverage note:** Effective automatic-positive-match coverage is estimated at ~30-40% of academic customers, or ~15-20% of all synthesis customers. The check is a high-confidence fast-pass for the subset it covers, not a comprehensive gate. Must be paired with m02-mx-tenant (commercial segment) and m02-rdap-age (domain freshness).
