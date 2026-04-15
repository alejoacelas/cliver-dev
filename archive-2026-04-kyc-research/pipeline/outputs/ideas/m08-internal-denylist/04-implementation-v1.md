# m08-internal-denylist — Implementation v1

- **measure:** M08 — institution-denied-parties
- **name:** Internal institution denylist
- **modes:** D, A
- **summary:** Maintain a per-provider internal database of institutions and identifiers (legal name, registry IDs, addresses, domain names, beneficial owners, payment-instrument hashes) that have previously been declined for cause. On every new order, screen the customer institution against the denylist; a high-confidence hit hard-blocks the order and routes to compliance. Optionally federate the denylist to other IGSC members through whatever shared mechanism is operationally feasible (with antitrust review).

## external_dependencies

- **Internal database** (Postgres / DynamoDB / equivalent) holding the denylist records.
- **Internal CRM / ticketing** for compliance disposition.
- **Identity normalization library** (institution name canonicalization, address standardization).
- **Optional external federation:** the **International Gene Synthesis Consortium (IGSC)** is the natural sharing forum among DNA synthesis providers; it operates a Harmonized Screening Protocol but the public-facing artifact does **not** describe a shared customer denylist as part of v3.0. ([source](https://genesynthesisconsortium.org/), [source](https://genesynthesisconsortium.org/wp-content/uploads/IGSC-Harmonized-Screening-Protocol-v3.0-1.pdf)) [unknown — searched for: "IGSC shared customer denylist members", "gene synthesis consortium shared blacklist" — IGSC's public materials do not document a formal shared denylist; if one exists it is operated privately among members.]
- **Antitrust counsel** to scope any cross-provider sharing — see ToS / legal considerations below.

## endpoint_details

This is an internal system; "endpoints" are internal database queries plus an optional federation channel.

- **Internal query path:** standard backend service call; no public URL.
- **Auth:** internal RBAC; only KYC subsystem and compliance reviewers can read; only compliance leads can write.
- **Rate limits:** internal (set by infra capacity).
- **Pricing:** $0 marginal beyond storage and engineering.
- **ToS / legal constraints (the load-bearing question for this idea):**
  - **Antitrust:** Cross-provider customer denylists raise antitrust concerns under US law. The DOJ withdrew the historical "safe harbor" for information-sharing among competitors in February 2023, removing the safety zone that previously protected historical, anonymous, third-party-administered exchanges. ([source](https://www.afslaw.com/perspectives/alerts/doj-antitrust-division-announces-withdrawal-information-sharing-safety-zone), [source](https://www.morganlewis.com/pubs/2024/10/doj-statement-of-interest-states-information-sharing-among-competitors-warrants-closer-scrutiny)) Any cross-provider denylist must be (a) narrow to identified bad-faith customers, (b) administered by an independent third party (e.g., IGSC secretariat or IBBIS), (c) reviewed by counsel for procompetitive justification under the rule of reason. [best guess: a denylist limited to customers with documented attempted dual-use/SOC misuse is likely defensible as a procompetitive safety mechanism — but no published DOJ guidance specific to bioscience supply-chain denylists exists. Legal review required.]
  - **Defamation / tortious interference:** the listed customer may sue if the listing is shared and they can show pretext. Mitigation: tight evidentiary standards for listing; appeals process; per-listing audit trail.
  - **Privacy:** GDPR considerations for any EU-based customer denylisted; right-to-erasure and right-to-rectification apply.

## fields_returned

The internal denylist record schema (write-once, append-only audit log + a current-state view):

- `record_id` (UUID)
- `institution_canonical_name`
- `institution_aka[]` (collected names, including local-script and English transliterations)
- `registry_ids[]` (LEI, EIN, Companies House number, ROR, GLEIF LEI)
- `addresses[]`
- `email_domains[]`
- `phone_numbers[]` (hashed)
- `payment_instrument_hashes[]` (BIN-prefix hash + last-4 hash)
- `beneficial_owners[]` (with their own subordinate records)
- `principal_individuals[]` (PI names, lab managers)
- `reason_code` (controlled vocabulary: `bypass_attempt_documented`, `false_affiliation`, `sanctioned_after_onboarding`, `payment_fraud`, `IGSC_referral`, `compliance_directive`)
- `evidence_links[]` (to internal incident tickets)
- `listed_by` (analyst ID)
- `listed_on` (timestamp)
- `expires_on` (optional; some categories may auto-expire)
- `appeal_status`
- `sharing_scope` (one of: `internal_only`, `IGSC_member_pool`, `IBBIS_pool`)

## marginal_cost_per_check

- Per-customer query: O(1) hashmap / index lookup. **Effectively $0.**
- Storage: trivial; thousands to low tens of thousands of records.
- **setup_cost:** ~$25–75k engineering for the schema, write workflow, audit log, identity normalization, and the appeals/erasure surface. [best guess: 4–8 engineer-weeks plus legal review.]
- Legal review for cross-provider sharing: ~$25–50k initial outside-counsel review. [best guess: standard antitrust scoping engagement.]

## manual_review_handoff

When the check fires `internal_denylist_hit`:

1. Reviewer pulls the matching denylist record + the originating incident ticket.
2. Reviewer compares the matching identifiers — confirm the new customer is the *same* entity as the listed one (not a name collision or a successor entity that should be re-evaluated).
3. **High-confidence match** (3+ identifiers align: name + address + domain, or name + registry ID): hard-block the order; notify compliance lead; document in the incident system.
4. **Medium-confidence match** (1–2 identifiers): request additional documentation from the customer (registry ID, beneficial-owner attestation, institutional letter); re-screen.
5. **Low-confidence match** (name only): treat as soft signal; require human triage and document the disposition; do not deny on a name-only collision.
6. **Appeals:** if the customer disputes the listing, reviewer routes to compliance lead and (if the listing predates the current relationship) considers whether the underlying basis still applies.
7. **GDPR right-to-erasure**: EU-based customers can request erasure; requires legal review of whether the listing's procompetitive safety basis overrides.

## flags_thrown

- `internal_denylist_hit_high_confidence` — 3+ identifier matches. **Action:** auto-deny; notify compliance.
- `internal_denylist_hit_medium_confidence` — 1–2 identifier matches. **Action:** human review.
- `internal_denylist_name_only_collision` — fuzzy name match only. **Action:** soft signal; document disposition.
- `internal_denylist_beneficial_owner_match` — institution differs but a listed beneficial owner is named on the new institution. **Action:** human review.

## failure_modes_requiring_review

- **Identifier drift:** the listed entity rebrands, relocates, or restructures; new submission no longer matches stored identifiers.
- **Successor / corporate-rotation evasion** (the `cro-identity-rotation` attacker): listed person re-files a new LLC with a slightly different name; only beneficial-owner matching catches this, and only if BO data is collected.
- **Data quality:** historical denylist records may have incomplete identifier sets; older records lose matching power as identifiers drift.
- **Collisions** with legitimate institutions sharing names with listed bad-faith ones.
- **Federation lag:** if cross-provider sharing is implemented, latency between one provider listing and another seeing the listing creates a window of vulnerability.
- **Legal challenge** to a specific listing forces reviewer to defend the basis on short notice.

## false_positive_qualitative

- New legitimate customers at institutions that share a name with a denylisted institution but are unaffiliated.
- Successor organizations to denylisted ones where the underlying issue has been remedied (new management, divestiture).
- Customers whose only connection is sharing a payment-instrument BIN with a denylisted customer.
- Researchers at universities where one prior individual was denylisted; the institution itself should not be tarred (record_type matters — individual vs. institution denylisting).

## record_left

- The matching denylist record_id.
- The full evidence link chain back to the originating incident.
- Reviewer disposition + timestamp + reviewer ID.
- Audit log of all reads and writes against the denylist.
- For appeals: full appeal correspondence + outcome.

## Open issues for v2

- **Existence and operational status of any IGSC-member shared denylist** is the load-bearing public-information question, currently `[unknown]`. v2 could attempt direct contact with the IGSC secretariat for clarification.
- Concrete antitrust counsel guidance specific to cross-provider biosecurity denylists. (Currently `[best guess]`.)
- Whether **IBBIS** (the International Biosecurity and Biosafety Initiative for Science) has positioned itself as a neutral third-party administrator for such a list — its mission overlaps but explicit denylist hosting is not in their public materials.
- GDPR-specific operational handling for EU customers.
