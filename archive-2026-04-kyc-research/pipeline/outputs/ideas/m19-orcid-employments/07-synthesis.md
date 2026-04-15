# m19-orcid-employments — Per-idea synthesis

## Section 1: Filled-in schema

### **name**

ORCID employment + education record lookup

### **measure**

M19 — individual-legitimacy-soc

### **attacker_stories_addressed**

visiting-researcher (partial — flags fire but institutional email clears them), unrelated-dept-student (miss), lab-manager-voucher (miss), it-persona-manufacturing (partial — catches impatient variant via `orcid_recent`, defeated by patient or IT-admin variant), dormant-account-takeover (miss), account-hijack (miss), foreign-institution (structural weakness), dormant-domain (flags fire but attacker controls corroboration path), insider-recruitment (miss), bulk-order-noise-cover (miss), gradual-legitimacy-accumulation (partial — `orcid_self_asserted_only` fires but persistence clears it)

### **summary**

Resolve the customer to an ORCID iD (collected at order time or matched via search API). Fetch `/employments` and `/educations` records. Verify the customer's claimed current employer appears as a current employment. Critically, distinguish institution-verified affiliations (strong positive signal — the institution pushed the assertion via its ORCID member integration) from self-asserted ones (weak signal — no harder to fabricate than any other self-reported claim). The institution-verified check is very strong evidence but applies to only ~2% of ORCID records; for the other 98%, the check degrades to a self-reported corroboration.

### **external_dependencies**

ORCID Public API v3.0 (free, OAuth client_credentials required); optional ORCID Member API (out of scope for read-only KYC).

### **endpoint_details**

- **Base URL:** `https://pub.orcid.org/v3.0/`
- **Employments:** `GET /{ORCID-iD}/employments`
- **Educations:** `GET /{ORCID-iD}/educations`
- **Full record:** `GET /{ORCID-iD}/record`
- **Search:** `GET /expanded-search/?q=given-names:...+AND+family-name:...+AND+affiliation-org-name:...`
- **Auth:** free public API client credentials (OAuth client_credentials grant, `/read-public` token)
- **Rate limits:** [vendor-gated — RPS/burst thresholds documented at ORCID FAQ but specific numbers not extracted; 503 on overflow]
- **Pricing:** free
- **Data:** CC0 for public records; researcher-controlled visibility settings

### **fields_returned**

Per employment summary: `organization.name`, `organization.address` (city/region/country), `organization.disambiguated-organization` (identifier + disambiguation-source: RINGGOLD/ROR/GRID/FUNDREF/LEI), `department-name`, `role-title`, `start-date`, `end-date` (null = current), `source.source-name` and `source.source-client-id` (institution's client = verified; user = self-asserted), `put-code`, `created-date`, `last-modified-date`, `visibility`, `url`, `external-ids`. Same structure for educations.

### **marginal_cost_per_check**

$0 (free public API). 1 search + 1 record fetch = 2 calls per customer. **Setup cost:** ~1 engineer-day for OAuth wiring and affiliation parsing; [best guess: ~$2k–$5k for production integration including source-client-id parsing].

### **manual_review_handoff**

- **Strong positive:** institution-asserted current employment with matching source-client-id = `orcid-institution-verified`, proceed
- **Weak positive:** self-asserted current employment at claimed institution = require corroboration (OpenAlex, domain match, institutional email)
- **No record/mismatch:** route to enrichment (m02, m18); request documentation. **`orcid_recent`:** ORCID created within 60 days, sole self-asserted employment, no linked works = escalate as potential manufactured persona. Persist selected ORCID iD in customer record

### **flags_thrown**

- `orcid_no_record` (no match — enrichment, not denial)
- `orcid_employer_mismatch` (no current employment at claimed institution)
- `orcid_self_asserted_only` (claimed institution present but only self-asserted — weak signal)
- `orcid_recent` (created <60 days, sole self-asserted employment, no works — high suspicion)

### **failure_modes_requiring_review**

- Sparse ORCID records (only ~2% have institution-verified affiliations)
- multiple ORCID iDs for same person
- name disambiguation (multiple candidates)
- privacy-restricted records (public API returns nothing, indistinguishable from empty)
- API 503 burst overflow

### **false_positive_qualitative**

1. The ~98% without institution-verified affiliations — strong check applies to only ~2%
2. No ORCID at all — ~20–40% of order-placers (industry, support staff, low-adoption regions)
3. Privacy-restricted records — ~5–15% of holders [unknown — searched for prevalence data]
4. Industry researchers — <5% have corporate-verified ORCID
5. Recently moved — ~5–10% transient, stale employer
6. Newly created ORCIDs (legitimate new researchers) — 2–5%, triggers `orcid_recent`

### **coverage_gaps**

1. ~98% of ORCID records without institution-verified affiliations — strong signal applies to only ~2%
2. No ORCID at all — ~20–40% of order-placers
3. Privacy-restricted records — ~5–15% [unknown]
4. Industry/commercial researchers — <5% corporate-verified
5. Recently moved researchers — ~5–10% transient mismatch
6. Newly created ORCIDs — 2–5% legitimate false positives

### **record_left**

Full ORCID JSON/XML record; query used; selected put-code(s) for matched employment; per-employment source-client-id and disambiguation-source; fetch timestamp. ORCID iD is a stable, citable, public identifier with strong audit value.

### **bypass_methods_known**

Fresh ORCID <60 days (it-persona-manufacturing) — CAUGHT weakly (evadable by patience).

### **bypass_methods_uncovered**

1. Self-asserted ORCID + institutional email corroboration (visiting-researcher, unrelated-dept-student, dormant-domain) — flag fires but clears via attacker-controlled email
2. Patient ORCID creation >60 days before order (it-persona-manufacturing) — evades `orcid_recent`
3. IT admin pushes institution-verified assertion via Member API (it-persona-manufacturing) — strong signal fabricated by insider
4. Non-publishing role ORCID absence is population-normal (lab-manager-voucher)
5. Authentication-layer attacks (dormant-account-takeover, account-hijack) — validates registered name, not current operator
6. Foreign-institution low ORCID adoption
7. Real insider/established researcher (insider-recruitment, bulk-order-noise-cover) — genuine records pass

---

## Section 2: Narrative

### What this check is and how it works

The ORCID check resolves a customer to an ORCID iD and fetches their employment and education records from the ORCID Public API v3.0. The critical design insight is the distinction between institution-verified and self-asserted affiliations. Each employment record carries a `source-client-id` field: if this ID belongs to the institution's own ORCID member integration (indicating the institution's HR system pushed the assertion), the affiliation is institution-verified and constitutes strong positive evidence. If the source is the user themselves, the affiliation is self-asserted and no stronger than the claim on the order form. The API is free, requires only a registered OAuth client credential, and returns structured data including the institution's disambiguated identifier (ROR, RINGGOLD, etc.), role title, department, and start/end dates.

### What it catches

The institution-verified signal is among the strongest available individual-level evidence: it confirms that an institution's HR system has asserted that this person is currently employed there. This is very difficult to fabricate externally. The `orcid_recent` flag provides a targeted catch for the IT-persona-manufacturing story: a freshly created ORCID with a sole self-asserted employment and no linked works matches the manufactured-persona pattern. Against the gradual-legitimacy-accumulation story, `orcid_self_asserted_only` fires on long-cultivated but never institution-verified records.

### What it misses

The check's central limitation is that the institution-verified signal applies to only approximately 2% of ORCID records (per ORCID's own August 2023 reporting). For the other 98%, the check provides only a self-asserted corroboration that is trivially fabricated. The `orcid_recent` flag catches manufactured personas only in a narrow 60-day window; an attacker who creates the ORCID months in advance easily evades it. For attackers with real institutional access (visiting-researcher, unrelated-dept-student, dormant-domain), the `orcid_self_asserted_only` flag fires but is cleared by institutional email corroboration — which the attacker controls. An IT admin with access to the institution's ORCID member integration can push a fraudulent institution-verified assertion, defeating even the strong check. Authentication-layer attacks and real-insider scenarios are entirely invisible. An estimated 20–40% of order-placers have no ORCID at all, concentrated in industry, support staff, and low-adoption regions.

### What it costs

Marginal cost per check is $0 — the public API is free. Two API calls per customer (one search, one record fetch). Setup cost is approximately one engineer-day for OAuth wiring and affiliation parsing, with an estimated $2,000–$5,000 for full production integration including the source-client-id parsing logic that distinguishes verified from self-asserted.

### Operational realism

The check operates on a tiered-confidence model. An institution-verified match produces the highest confidence and requires no further review. A self-asserted match requires corroboration from another M19 check or institutional email. No match routes to enrichment. The `orcid_recent` flag escalates suspicious new records. The main operational burden is that 98% of ORCID-holding customers will produce only the weak self-asserted signal, meaning the reviewer must almost always seek corroboration — the strong check fires rarely. Privacy-restricted records are indistinguishable from empty records via the public API, creating an irreducible ambiguity. Every check persists the full ORCID JSON, the source-client-id for each employment, and the fetch timestamp; the ORCID iD itself is a stable public identifier with strong audit value.

### Open questions

The exact ORCID API rate-limit thresholds for the public read tier are [vendor-gated] — the FAQ confirms limits exist but does not always publish precise numbers. The ~2% institution-verified rate is the key statistic governing this check's utility; whether it has improved since August 2023 is unknown but likely still in the single digits. The 60-day `orcid_recent` threshold is arbitrary and the hardening report suggests a sliding threshold (6 months + <3 works + sole self-asserted employment) to narrow evasion, but this requires empirical calibration against false-positive rates on legitimate new registrants. Whether to require ORCID at order time is a policy design question: it increases lookupable records but creates friction and excludes ~20–40% of the customer base.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.**
- **Moderate finding M1 (self-asserted ORCID + institutional email corroboration clears flags for attackers with real institutional access):** The primary discriminating signal (`orcid_self_asserted_only`) is cleared by institutional email, which attackers with real institutional access control. Suggested mitigation: require non-email corroboration (OpenAlex match, supervisor confirmation), but this significantly increases friction for the ~98% of legitimate users with self-asserted affiliations.
- **Moderate finding M2 (`orcid_recent` 60-day window easily evaded):** The attacker's operational timeline (months) exceeds the detection window. Suggested: sliding threshold (6 months + <3 works + sole self-asserted). Design decision needed on false-positive tolerance.
- **Moderate finding M3 (institution-verified signal available to only ~2% of population):** Structural limitation of the ORCID ecosystem. The strong check is correctly framed as confidence-upgrading, not gatekeeping.
- **Moderate finding M4 (authentication-layer attacks invisible):** Dormant-account-takeover and account-hijack are M16 concerns, not M19.
- **Minor finding m1 (IT admin ORCID member API access):** An IT admin with member API credentials could push institution-verified assertions for manufactured personas. Reviewer playbook should note this possibility but detection is extremely difficult.
- **[vendor-gated] ORCID API rate-limit specifics:** Documented at ORCID FAQ but exact RPS/burst numbers not extracted.
- **[unknown] Percentage of ORCID holders with privacy-restricted affiliations:** No data found. Estimated 5–15%.
- **Policy decision: require ORCID at order time?** Increases lookupable population but creates friction and excludes ~20–40% without ORCID.
- **The ~2% institution-verified rate is improving but slowly.** The check's utility will grow as more institutions integrate ORCID, but this is outside the provider's control.
