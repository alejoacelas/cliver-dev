# Per-idea synthesis: m08-internal-denylist

## Section 1: Filled-in schema

**name**

Internal institution denylist

**measure**

M08 — institution-denied-parties

**attacker_stories_addressed**

No wg attacker stories engage M08 directly. The spec lists previously-declined, beneficial-owner-laundering, and cro-identity-rotation as addressed stories, but none appear in the wg attacker mapping for measure 08. The internal denylist's value against these patterns is real but untestable against the current wg branch set. Primary value is deterrence, audit compliance, and catching repeat offenders.

**summary**

Maintain a per-provider internal database of institutions and identifiers (legal name, registry IDs, addresses, domain names, beneficial owners, payment-instrument hashes) that have previously been declined for cause. On every new order, screen the customer institution against the denylist; a high-confidence hit hard-blocks the order and routes to compliance. Optionally federate the denylist to other IGSC members through an independent third-party administrator (with antitrust review).

**external_dependencies**

Internal database (Postgres/DynamoDB/equivalent); internal CRM/ticketing for compliance disposition; identity normalization library (name canonicalization, address standardization). Optional external federation: IGSC is the natural sharing forum, but its Harmonized Screening Protocol v3.0 does not document a shared customer denylist. [unknown — searched for: "IGSC shared customer denylist members", "gene synthesis consortium shared blacklist" — no public documentation exists.] Antitrust counsel required for any cross-provider sharing.

**endpoint_details**

Internal system; no public URL. Internal RBAC: only KYC subsystem and compliance reviewers can read; only compliance leads can write. Rate limits: internal. Pricing: $0 marginal.

**ToS/legal (load-bearing):** Cross-provider denylists raise antitrust concerns; DOJ withdrew the information-sharing safe harbor in February 2023. Any cross-provider list must be (a) narrow to documented bad-faith customers, (b) administered by an independent third party, (c) reviewed for procompetitive justification under the rule of reason. [best guess: defensible but untested in biosecurity context; legal review required.] Defamation/tortious-interference risk requires tight evidentiary standards + appeals process. GDPR right-to-erasure and right-to-rectification apply to EU-based customers.

**fields_returned**

Internal denylist record: `record_id` (UUID); `institution_canonical_name`; `institution_aka[]`; `registry_ids[]` (LEI, EIN, Companies House, ROR, GLEIF LEI); `addresses[]`; `email_domains[]`; `phone_numbers[]` (hashed); `payment_instrument_hashes[]` (BIN-prefix + last-4); `beneficial_owners[]`; `principal_individuals[]`; `reason_code` (bypass_attempt_documented, false_affiliation, sanctioned_after_onboarding, payment_fraud, IGSC_referral, compliance_directive); `evidence_links[]`; `listed_by`; `listed_on`; `expires_on` (optional); `appeal_status`; `sharing_scope` (internal_only, IGSC_member_pool, IBBIS_pool).

**marginal_cost_per_check**

O(1) index lookup; effectively $0. **Setup cost:** ~$25-75k engineering for schema, write workflow, audit log, identity normalization, and appeals/erasure surface (est. 4-8 engineer-weeks plus legal review). Legal review for cross-provider sharing: ~$25-50k initial outside-counsel engagement.

**manual_review_handoff**

7-step SOP: (1) Pull matching denylist record + originating incident ticket. (2) Confirm new customer is same entity (not name collision or re-evaluated successor). (3) High-confidence match (3+ identifiers: name + address + domain, or name + registry ID): hard-block, notify compliance lead. (4) Medium-confidence (1-2 identifiers): request additional documentation, re-screen. (5) Low-confidence (name only): treat as soft signal, document disposition. (6) Appeals: route to compliance lead; if listing predates current relationship, consider whether basis still applies. (7) GDPR right-to-erasure: EU customers can request erasure; requires legal review of whether procompetitive safety basis overrides under Article 17(3)(e).

**flags_thrown**


- `internal_denylist_hit_high_confidence` — 3+ identifier matches; auto-deny, notify compliance.

- `internal_denylist_hit_medium_confidence` — 1-2 identifier matches; human review.

- `internal_denylist_name_only_collision` — fuzzy name match only; soft signal.

- `internal_denylist_beneficial_owner_match` — institution differs but listed beneficial owner appears on new institution; human review.

**failure_modes_requiring_review**

Identifier drift (entity rebrands, relocates, restructures); successor/corporate-rotation evasion (new LLC with slightly different name — only BO matching catches this); data quality of historical records; name collisions with legitimate institutions; federation lag (cross-provider sharing latency); legal challenge to a specific listing.

**false_positive_qualitative**


- **True false positives:** successor organizations to denylisted entities (new management, divestiture); name collisions with unaffiliated legitimate institutions; payment-instrument-hash collisions (over-broad BIN matching); researchers at universities where one prior individual was denylisted but the institution itself should not be tarred.

- **False negatives:** first-time offenders not in any provider's denylist (the dominant gap); entities denied by other providers but not shared; reconstituted entities with rotated identifiers; GDPR-erased entities.

**coverage_gaps**


- **Gap 1 — Cold-start problem:** ~30-40 of 65+ providers have <5 denial events; effectively empty denylists.

- **Gap 2 — First-time bad actors:** denylist is purely retrospective; zero predictive power for new threats.

- **Gap 3 — Cross-provider sharing blocked:** DOJ 2023 safe-harbor withdrawal; IGSC does not publicly document shared denylist; entity denied by one provider has 60+ alternatives. Top 3 providers hold ~53% market share; remaining ~47% distributed across dozens.

- **Gap 4 — Identifier drift/reconstitution:** entities that change name + address + domain + payment instrument evade all but BO matching.

- **Gap 5 — Legitimate successors incorrectly denied:** small case count but high stakes.

- **Gap 6 — GDPR right-to-erasure:** untested whether Article 17(3)(e) exemption applies to biosecurity denylists.

**record_left**

Matching denylist record_id; full evidence link chain to originating incident; reviewer disposition + timestamp + reviewer ID; audit log of all reads/writes; for appeals: full correspondence + outcome.

**bypass_methods_known**

None — no wg attacker stories engage this measure.

**bypass_methods_uncovered**

None — no wg attacker stories engage this measure. The denylist's primary adversarial limitation is that sophisticated adversaries change identifiers (Gap 4), but this is untestable against the current wg branch set.


## Section 2: Narrative


### What this check is and how it works

This check maintains a per-provider internal database of institutions and associated identifiers that have previously been declined for cause — documented bypass attempts, false affiliations, sanctions imposed after onboarding, payment fraud, or IGSC/compliance referrals. On every new order, the provider screens the customer's institution name, registry IDs, email domains, addresses, payment-instrument hashes, and beneficial-owner names against the denylist using fuzzy matching and identity normalization. A high-confidence match (3+ identifiers aligning) hard-blocks the order; medium and low-confidence matches route to human review. The denylist schema is write-once with an append-only audit log, supporting appeals and GDPR erasure requests. Optionally, the denylist could be federated to other IGSC members through an independent third-party administrator, though this requires careful antitrust structuring.


### What it catches

The denylist catches repeat offenders — entities that have previously been identified and declined by the same provider. Its primary value is not first-contact detection but rather preventing known bad actors from returning under the same identifiers. The check also catches beneficial-owner matches: if a denylisted individual appears as a beneficial owner or principal on a new institution, the cross-reference fires. In practice, the denylist is most valuable as a deterrence mechanism (customers know they will be permanently banned if caught) and as an audit-compliance artifact (demonstrating a documented denied-parties process). No wg attacker story models a previously-denied customer attempting re-entry, so the check's adversarial effectiveness is untestable against the current threat model.


### What it misses

The denylist misses all first-time offenders — it is purely retrospective with zero predictive power for new threats. Without cross-provider sharing, each provider's denylist is an island: an entity denied by Provider A can simply order from any of 60+ other providers. The cross-provider sharing question is the single most impactful coverage improvement but is blocked by legal uncertainty following the DOJ's February 2023 withdrawal of the information-sharing safe harbor. Even with a populated denylist, sophisticated adversaries can evade it through identifier rotation — changing name, address, domain, and payment instruments defeats all matching except beneficial-owner cross-referencing, which requires separate BO data collection. The cold-start problem affects new and small providers: an estimated 30-40 of the market's 65+ providers have near-empty denylists.


### What it costs

Marginal cost per check is effectively $0 (an index lookup). Setup cost is ~$25-75k engineering (4-8 engineer-weeks) for the schema, write workflow, audit log, identity normalization, and appeals/erasure surface. Legal review for cross-provider sharing adds ~$25-50k for an initial antitrust scoping engagement. The ongoing cost is analyst time for dispositioning matches and processing appeals. The cost is modest relative to commercial AML vendors and the CSL integration — the denylist's engineering cost is a one-time investment that compounds in value as the provider accumulates denial history.


### Operational realism

The operational challenge is building a denylist that is broad enough to catch reconstituted entities but narrow enough to avoid blocking legitimate successor organizations. The multi-identifier matching approach (requiring 3+ identifiers for auto-deny) reduces false positives but means name-only collisions are treated as soft signals. The appeals process adds procedural overhead but is necessary to avoid defamation/tortious-interference liability. For providers operating in the EU, GDPR's right-to-erasure creates a tension: a denylisted EU-based customer can request deletion, potentially re-enabling their access. Article 17(3)(e) may exempt data retention necessary for legal claims, but this is untested in the biosecurity context. The audit trail (write-once, append-only) is strong and supports regulatory review.


### Open questions

The most impactful open question is whether any IGSC-member shared denylist exists or could be established. The IGSC Harmonized Screening Protocol v3.0 does not document such a mechanism publicly. If IGSC or IBBIS could serve as an independent third-party administrator, cross-provider sharing would dramatically increase the denylist's coverage — but this requires antitrust counsel to confirm defensibility under the post-2023 DOJ framework. The GDPR right-to-erasure conflict also needs resolution: specifically, whether a biosecurity denylist qualifies for the Article 17(3)(e) exemption for data processing necessary for the defense of legal claims.

## Section 3: Open issues for human review


- **No wg attacker stories engage M08.** The denylist's value against previously-declined, beneficial-owner-laundering, and cro-identity-rotation patterns is real but untestable against the current wg branch set.


- **Cross-provider sharing blocked by legal uncertainty (Gap 3):** DOJ withdrew the information-sharing safe harbor in February 2023. IGSC does not publicly document a shared customer denylist. Any cross-provider mechanism requires independent third-party administration and antitrust counsel review (~$25-50k initial engagement). This is the single most impactful coverage improvement for this idea.


- **[unknown — searched for: "IGSC shared customer denylist members", "gene synthesis consortium shared blacklist"]:** Whether any IGSC-member shared denylist exists is the load-bearing public-information question.


- **GDPR right-to-erasure conflict (Gap 6):** Untested whether Article 17(3)(e) exemption applies to biosecurity denylists. EU-based customers could request deletion of their denylist records.


- **Cold-start problem (Gap 1):** ~30-40 of 65+ providers have near-empty denylists. The check is most valuable for established high-volume providers; less useful for small/new entrants.


- **Identifier drift defeats matching (Gap 4):** Sophisticated adversaries who change name + address + domain + payment instrument evade all matching except beneficial-owner cross-referencing. BO data collection is a prerequisite for robust denylist matching.


- **[best guess]:** Antitrust defensibility of a cross-provider biosecurity denylist under the rule of reason is hedged as a best guess; no published DOJ guidance specific to this sector exists.
