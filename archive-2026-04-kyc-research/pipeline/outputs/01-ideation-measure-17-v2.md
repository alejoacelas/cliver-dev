# Stage 1 Ideation — Measure 17 (pre-approval-list) — v2

Revisions over v1: idea 1 attacker_stories_addressed expanded; idea 3 narrowed; idea 5 dropped; idea 14 narrowed to USAspending.gov-cross-check variant; idea 4 and 15 dropped (good-actor fast lanes with no exclusionary effect on any mapped branch). Three new ideas added (19, 20, 21) addressing the gaps stage 2 surfaced: breach-data subscription as a credential-compromise trigger; institutional directory / InCommon cross-check for dormant-PI departures; entity-ownership-change monitoring (registered agent / UBO / principal officer) for the going-concern-acquisition sub-variant of shell-company.

Modes per idea: D = Direct, A = Attacker-driven.

---

## 1. Federal Select Agent Program (FSAP) registered entity list — CDC/APHIS Select Agent Registration

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant)
- **Summary:** The Federal Select Agent Program (CDC Division of Select Agents and Toxins + APHIS Agriculture Select Agent Services) maintains the authoritative US list of entities registered to possess, use, or transfer HHS/USDA select agents and toxins under 42 CFR Part 73 / 9 CFR Part 121 / 7 CFR Part 331. Registration requires an FBI/CJIS Security Risk Assessment on the Responsible Official and individuals with access, periodic CDC/APHIS inspections, and entity-level biosecurity review. Provider treats a current FSAP-registered entity (matched on legal entity name + Responsible Official + address) as pre-approved for select-agent-adjacent SOC orders. Operationally this is a name list maintained by KYC ops with quarterly refresh from selectagents.gov.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant. Rationale: FSAP registration is unattainable on the 6–12 month timescale these branches operate on (FBI SRA on the RO is the binding constraint, not the form-filling), so making FSAP one of a small set of fast lanes raises the bar against any select-agent-adjacent SOC order from a manufactured-tenure org.
- **external_dependencies:** CDC FSAP public entity list at `selectagents.gov` [best guess: published as a static HTML page rather than as an API], APHIS counterpart, internal SOP for refresh, KYC ops to reconcile name variants.
- **manual_review_handoff:** Fuzzy-match (institution name matches a FSAP entry but Responsible Official email domain or shipping address doesn't reconcile) → senior KYC reviewer; playbook is to confirm directly with the named RO before granting fast-lane status.
- **flags_thrown:** `fsap_match=exact` → fast-lane. `fsap_match=fuzzy_only` → review. `fsap_match=none` → no flag, fall through to measures 18–20.
- **failure_modes_requiring_review:** FSAP page unreachable on refresh; entity name variants; security-withheld FSAP entries that won't appear publicly.
- **record_left:** FSAP list snapshot on the evaluation date + matched entry + reviewer notes if any.
- Other fields: # stage 4

---

## 2. NIH-registered Institutional Biosafety Committee (IBC) roster — NIH Office of Science Policy IBC registration database

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant)
- **Summary:** Institutions receiving NIH funding for recombinant or synthetic nucleic acid research must register an Institutional Biosafety Committee with NIH Office of Science Policy under the NIH Guidelines. OSP maintains a registry (~900–1000 institutions) including institution name, IBC chair, and biosafety officer. Customer's stated institution must appear in the IBC registry to be eligible for institution-level pre-approval; the customer's stated PI/biosafety contact must reconcile against the registered IBC chair/BSO. Registering an IBC requires real recombinant DNA research and OSP review, not just an LLC and a website.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant
- **external_dependencies:** NIH OSP IBC registration list [best guess: published via OSP website, possibly FOIA-able if not public], internal SOP for refresh, KYC ops.
- **manual_review_handoff:** Customer claims institutional affiliation but no IBC entry matches → senior reviewer; require written attestation from the named BSO via institutional email before granting fast-lane.
- **flags_thrown:** `ibc_registered=yes` AND BSO/email reconciled → fast-lane. `ibc_registered=yes` BUT BSO mismatch → review. `ibc_registered=no` → no flag (not all legitimate customers need an IBC); fall through.
- **failure_modes_requiring_review:** IBC registry stale; small institutions whose IBC is hosted by a parent system; non-NIH-funded labs with no IBC.
- **record_left:** OSP IBC registry snapshot on evaluation date, matched entry, BSO reconciliation evidence.

---

## 3. IGSC shared "rejected customer" list — Harmonized Screening Protocol cross-member denial referrals

- **Modes:** A (gradual-legitimacy-accumulation, shell-company)
- **Summary:** Narrowed from v1. The IGSC (authors of the Harmonized Screening Protocol) is the canonical inter-provider coordination body. The operative idea is to ingest a shared "rejected customer" or "do-not-sell" list maintained or coordinated through IGSC, if one exists or can be established. SOP: any customer matching an IGSC-referred denial (by legal entity, named individual, or shipping address) is blocked from fast-lane and routed to senior review. If no such list exists today, this idea becomes a research-question for stage 4 — and a candidate for the provider to advocate creating one. The vague v1 framing of "member-to-member SOP for confirming customer history" is dropped; that variant did not address any of the seven mapped branches.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company. Rationale: a previously-caught operator returning under a fresh LLC could be detected if another IGSC member previously caught and shared the underlying identifiers (named individual, registered agent, shipping address).
- **external_dependencies:** IGSC member directory at `genesynthesisconsortium.org`, IGSC secretariat contact for any shared-list arrangement [best guess: no public shared list today; this is an admitted research-question for stage 4].
- **manual_review_handoff:** Match → block fast-lane and route to senior reviewer with the referring member's case context (where available).
- **flags_thrown:** `igsc_denial_match` → block fast-lane and review.
- **failure_modes_requiring_review:** No shared list exists today (most likely); unclear data-sharing legal basis between members.
- **record_left:** IGSC referral identifier and the matched attribute, retained.

---

## 6. Institutional Master Service Agreement (MSA) signatory list — provider's own contracts/legal CRM

- **Modes:** D, A (bulk-order-noise-cover)
- **Summary:** Provider's own contracts system (Ironclad / DocuSign CLM / Agiloft / Salesforce CPQ — [best guess: depends on stack]) holds the authoritative list of institutions with a signed MSA / MTA / institutional purchasing agreement. These agreements always go through institutional procurement and legal, which independently verifies institutional existence and authority. SOP: any customer whose billing institution is a current MSA signatory is pre-approved at the institution level (the individual still needs measures 19/20).
- **attacker_stories_addressed:** bulk-order-noise-cover (the R1 university core facility this branch operates from is overwhelmingly likely to be on the provider's MSA list — and that is the legitimate basis for the historical pre-approval the branch exploits. Naming this idea is what lets stage 5 reason about hardening: the institution is correctly pre-approved; per-individual checks (ideas 11/12) are where the branch must be caught.)
- **external_dependencies:** Provider's own contracts system, legal/contracts staff to flag expirations.
- **manual_review_handoff:** Customer cites MSA but billing entity name doesn't reconcile → legal ops; confirm with the named contracting officer before granting fast-lane.
- **flags_thrown:** `msa_active=yes` AND billing matches → institution-level fast-lane. `msa_expired` → review. `msa_none` → no flag, fall through.
- **failure_modes_requiring_review:** MSA on file with parent entity not customer's named subsidiary; MSA expired but in renewal.
- **record_left:** Pointer to MSA record (contract ID, expiration, signatory), captured at evaluation.

---

## 7. Internal CRM historical-buyer scoring — Salesforce / HubSpot prior-order rollups (with tenure + outcomes weighting)

- **Modes:** D, A (all seven branches)
- **Summary:** The operative implementation of "screen against previous company records for past SOC orders and outcomes." Provider's CRM (Salesforce Service Cloud or HubSpot, plus an order-history data mart fed from the OMS) computes per-customer rollups: account tenure (months since first order), count of completed non-SOC orders, count of completed SOC orders, count of orders that triggered any KYC review, count of adverse outcomes (cancelled, refused, escalated to bioethics review, customer's IBC contact actually reached and confirmed the order), date of last positive verification. Pre-approval requires tenure threshold AND minimum non-SOC-order count AND zero adverse outcomes AND a positive verification within a refresh window (see idea 10).
- **attacker_stories_addressed:** all seven (central idea for the measure)
- **external_dependencies:** Salesforce or HubSpot CRM, OMS data mart, KYC ops.
- **manual_review_handoff:** Just-below-threshold or any adverse-outcome flag → KYC ops; fall through to 18–20 rather than auto-fast-lane.
- **flags_thrown:** `tenure>=N AND non_soc_orders>=M AND adverse_outcomes==0 AND last_positive_verification<=K` → fast-lane. `tenure>=N BUT no positive verification on file` → review (catches manufactured-tenure). `adverse_outcomes>0` → block fast-lane and senior review. `account_dormant_then_resumed` → review (catches dormant-account-takeover).
- **failure_modes_requiring_review:** Data mart lag; merged customer records; CRM identifier collision across an account that changed PI.
- **record_left:** CRM rollup snapshot at evaluation time + SOP version applied + verification date used.

---

## 8. NIH RePORTER grant-awarded PI lookup — NIH RePORTER public API

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant, dormant-account-takeover)
- **Summary:** NIH RePORTER (`api.reporter.nih.gov`) exposes a public API of NIH-funded projects with PI name, institution, project number, abstract, fiscal year, award amount. A customer whose claimed PI + institution returns at least one active R/U/P/K-mechanism award in a relevant scientific area is on a fast-lane: NIH peer review has vouched for scientific legitimacy and the institution is real enough to administer federal funds. Manufactured-LLC branches don't have NIH awards on a 6–12 month timescale. Also addresses dormant-account-takeover by treating "PI's NIH funding ended >5y ago" as a stale-PI signal that suspends inherited fast-lane.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant, dormant-account-takeover
- **external_dependencies:** NIH RePORTER API (`api.reporter.nih.gov/v2/projects/search`), no API key [best guess], rate-limited.
- **manual_review_handoff:** PI name fuzzy-matches but institution doesn't → KYC ops disambiguates (common with PIs who moved).
- **flags_thrown:** `nih_active_award_found` AND PI+institution match → fast-lane. `nih_award_only_expired_>5y` → review (dormant-PI signal). `no_match` → no flag.
- **failure_modes_requiring_review:** PI funded by NSF/DOE/private foundation; name disambiguation; institutional name normalization.
- **record_left:** RePORTER API request/response with project numbers and PI ID.

---

## 9. NSF Award Search public API — NSF-funded PI lookup

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant)
- **Summary:** NSF Award Search (`api.nsf.gov/services/v1/awards`) is the NSF analog of NIH RePORTER. Useful for biology/chemistry PIs at non-NIH institutions (evolutionary biology, environmental microbiology, undergraduate-focused PUIs). Same SOP as idea 8.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant
- **external_dependencies:** NSF Award Search API.
- **manual_review_handoff:** Same as idea 8.
- **flags_thrown:** `nsf_active_award` → fast-lane contributor.
- **failure_modes_requiring_review:** Same as 8.
- **record_left:** API response with award IDs.

---

## 10. Trust-scoring SOP requiring a "positive verification event"

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant)
- **Summary:** SOP that hardens idea 7 against manufactured-tenure branches. Defines "positive verification event" as one of: (a) a measure-19 individual-legitimacy interview successfully completed, (b) a measure-20 voucher confirmation received from a verified third party, (c) an MSA confirmation event (idea 6), (d) an outbound contact to the customer's institutional biosafety officer confirming a specific past order, (e) a successful site visit. Pre-approval requires that the most recent positive verification event was within the refresh window (e.g., 18 months) regardless of order count. Converts "tenure + clean order history" from sufficient to necessary-but-not-sufficient: an attacker who only places clean orders for 12 months never accumulates a positive verification event and is never fast-laned.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant. Directly invalidates the load-bearing assumption of story 1 ("the provider's review actually weights customer tenure and order history (not just point-in-time entity profile)") by making tenure insufficient.
- **external_dependencies:** CRM with custom fields, KYC ops, written SOP and training, audit log.
- **manual_review_handoff:** `last_positive_verification_date` older than refresh window → schedule re-verification (typically measure-19 or measure-20 contact); suspend fast-lane until re-verified.
- **flags_thrown:** `no_positive_verification_on_file` → block fast-lane. `positive_verification_stale` → block fast-lane and schedule re-verification. `positive_verification_fresh_and_clean` → fast-lane.
- **failure_modes_requiring_review:** Verification event recorded as free text and not normalized; customer's biosafety contact has changed.
- **record_left:** Per-customer verification ledger with event type and evidence pointer.

---

## 11. Re-verification trigger on credential / contact / device changes — CRM event-driven re-evaluation SOP

- **Modes:** A (account-hijack, credential-compromise, dormant-account-takeover, bulk-order-noise-cover)
- **Summary:** SOP that automatically suspends fast-lane / pre-approved status whenever the underlying account exhibits any of: password reset within last N days, MFA reset within last N days, addition of a new shipping address, change of billing institution, addition of a new device fingerprint, dormancy >18 months followed by login, change of stated PI or biosafety contact. Every account-takeover branch relies on pre-approval status surviving the takeover silently; tying pre-approval to "no recent suspicious-state-change events" forces a re-verification gate after any takeover-shaped event.
- **attacker_stories_addressed:** account-hijack, credential-compromise, dormant-account-takeover, bulk-order-noise-cover (the shared-facility-account sub-variant where the registered IAL2 belongs to a long-departed predecessor)
- **external_dependencies:** CRM, IAM/auth log feed, OMS event stream, ticketing for re-verification queue.
- **manual_review_handoff:** Trigger fires → KYC ops; require fresh measure-19 or measure-20 verification before fast-lane resumes.
- **flags_thrown:** `password_reset_recent` → suspend fast-lane. `mfa_reset_recent` → suspend fast-lane. `dormancy_then_resumption` → suspend fast-lane. `pi_or_bso_changed` → suspend fast-lane.
- **failure_modes_requiring_review:** Legitimate password resets are common; SOP must distinguish event volume thresholds.
- **record_left:** Event log per trigger + re-verification ticket and outcome.

---

## 12. Predecessor-account re-IAL2 SOP for shared-facility accounts — calendar-driven re-verification

- **Modes:** A (bulk-order-noise-cover, dormant-account-takeover)
- **Summary:** Any institutional/facility account whose registered individual has not personally re-verified within 24 months is removed from fast-lane status until re-verified. Specific instance of idea 11 but focused on the shared-account pattern named directly in the bulk-order-noise-cover excerpt.
- **attacker_stories_addressed:** bulk-order-noise-cover, dormant-account-takeover
- **external_dependencies:** CRM with `last_individual_reverification` field, KYC ops scheduler.
- **manual_review_handoff:** Annual sweep produces queue; KYC ops contacts the institution's currently-listed responsible person via institutional email.
- **flags_thrown:** `account_age>2y AND last_individual_reverification stale` → suspend fast-lane.
- **failure_modes_requiring_review:** Institution legitimately uses a shared role-based account with documented succession.
- **record_left:** Sweep output + per-account re-verification ticket.

---

## 13. Outcome-based "do not fast-lane" provider-internal blacklist — derived from prior negative outcomes, with shared-attribute matching

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company)
- **Summary:** Symmetric counterpart to the pre-approval list: a provider-internal "do not fast-lane" list of customer identifiers (legal entity, primary email domain, billing address, named individual, registered agent, Delaware filer, WHOIS contact) tied to a prior adverse outcome (cancelled SOC order, BWC concern raised by reviewer, customer who failed measure-19 or measure-20, customer whose stated institution was found not to exist). Applied at order time as a hard block on fast-lane status. Lives in the same CRM as ideas 7/10 but in an access-controlled table because additions are sensitive.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company. The shared-attribute matching catches a previously-caught operator returning under a fresh LLC.
- **external_dependencies:** Hardened CRM table; legal review SOP for additions/removals.
- **manual_review_handoff:** Match → block fast-lane and senior review with full prior-outcome context.
- **flags_thrown:** `dnf_match=exact` → block fast-lane. `dnf_match_by_shared_attribute` → review.
- **failure_modes_requiring_review:** False-positive risk on shared attributes; legal exposure on additions.
- **record_left:** Audit log of every addition/removal with reviewer's justification and underlying ticket.

---

## 14. USAspending.gov federal-award lookup — verifying actual federal contracts/awards (not mere SAM.gov registration)

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company)
- **Summary:** Narrowed from v1. Mere SAM.gov registration is self-asserted and free, so it does not earn a fast-lane slot. The harder-to-fake variant: USAspending.gov publishes the canonical record of actual federal contracts, grants, and assistance awards by recipient (UEI / legacy DUNS), with award amounts, dates, awarding agency, and product/service codes. SOP: a customer whose stated entity has at least one active or recently-completed federal R&D award (NAICS 541714 / 325414 / etc., or NIH/NSF assistance award) is fast-lane eligible at the institution level. This requires that a federal agency actually awarded money, which the manufactured-LLC branches cannot manufacture on their timescale.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company. Rationale: SBIR/STTR awards are the cheapest federal-money path for a small biotech, but each requires a competitive scientific review and 6+ months of agency processing — not feasible inside the 6–12 month window the branches operate on.
- **external_dependencies:** USAspending.gov public API (`api.usaspending.gov/api/v2/recipient/duns/` or recipient-search endpoint), no key required [best guess].
- **manual_review_handoff:** Recipient name fuzzy-matches but UEI doesn't → KYC ops disambiguates.
- **flags_thrown:** `usaspending_active_award AND naics_relevant` → fast-lane contributor. `usaspending_no_match` → no flag.
- **failure_modes_requiring_review:** Multiple recipient registrations under similar names; name normalization across legacy DUNS / current UEI.
- **record_left:** USAspending API response with award IDs and recipient UEI.

---

## 16. ORCID + ROR + OpenAlex composite "real-PI" check for fast-lane qualification

- **Modes:** A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant)
- **Summary:** Pre-approval at the individual-PI level is conditioned on the customer presenting a verified ORCID iD whose author record (via OpenAlex) shows at least N publications (e.g., N≥3) affiliated with the customer's stated institution (resolved via ROR), with at least one publication in the last 24 months. Story 2 mentions seeding bioRxiv preprints, but a single preprint will not pass an N≥3-with-recent-activity threshold and the affiliation must reconcile through ROR to the customer's institution.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant
- **external_dependencies:** ORCID public API (`pub.orcid.org/v3.0`), OpenAlex authors API (`api.openalex.org/authors`), ROR API (`api.ror.org`).
- **manual_review_handoff:** Borderline (N-1 publications; affiliation in transition) → KYC ops disambiguates.
- **flags_thrown:** `orcid_pubcount<threshold` → no fast-lane. `orcid_recent_activity_absent` → no fast-lane.
- **failure_modes_requiring_review:** Early-career PI legitimately below threshold; PI in a non-publishing field.
- **record_left:** ORCID iD, OpenAlex work IDs, ROR ID.

---

## 17. Cross-provider fraud-signal sharing via Sift / Sardine / Alloy — provider's existing fraud network

- **Modes:** A (gradual-legitimacy-accumulation, shell-company, account-hijack, credential-compromise)
- **Summary:** Provider already runs orders through a fraud-detection vendor for payment risk (e.g., Sift, Sardine, Alloy) [best guess: at least one is in the stack]. These vendors maintain cross-customer fraud-signal networks: device fingerprints, email reputations, IP reputations, velocity patterns. SOP: pre-approval / fast-lane is conditional on a clean Sift/Sardine/Alloy score over the tenure window — not just clean order outcomes inside provider records. Addresses manufactured-tenure if devices/emails/IPs are reused across other shell operations the network has seen, and addresses account-takeover if Sift/Sardine flags the device/IP change at takeover time.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, account-hijack, credential-compromise
- **external_dependencies:** Sift / Sardine / Alloy account.
- **manual_review_handoff:** Score above threshold during review window → block fast-lane and KYC ops with vendor reason codes.
- **flags_thrown:** `sift_score_elevated_in_window` → block fast-lane. `device_change_during_review_window` → review.
- **failure_modes_requiring_review:** Vendor false positives; opaque reason codes.
- **record_left:** Vendor score history retained.

---

## 18. Institutional shipping-address corroboration as fast-lane prerequisite — incubator/coworking address exclusion

- **Modes:** A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant)
- **Summary:** Fast-lane status is gated on the customer's shipping address normalizing to an address publicly listed for the customer's stated institution in ROR or in the institution's directory. SOP: virtual offices, co-working labs, and incubator addresses (BioLabs, LabCentral, Genspace, JLABS, Indie Bio) are not eligible for fast-lane shipping (they fall through to measures 18–20). This is a measure-17 SOP, not a measure-3 check, because it conditions pre-approval rather than blocking the order. Story 2 explicitly names "rents either a virtual office or a co-working lab bench in a biotech hub"; story 3 is named for this exact pattern.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant
- **external_dependencies:** ROR API (`api.ror.org`), Smarty / Lob for normalization, provider-maintained list of named incubators (BioLabs locations, LabCentral, Genspace, JLABS, IndieBio).
- **manual_review_handoff:** Shipping is a known incubator/coworking address → not eligible for fast-lane; fall through to 18–20.
- **flags_thrown:** `shipping_is_known_incubator_address` → block fast-lane. `shipping_normalized_match_to_ror` → fast-lane contributor.
- **failure_modes_requiring_review:** Real small biotechs do legitimately operate from incubators (the false-positive cost).
- **record_left:** Address normalization result + ROR match record + incubator-list version applied.

---

## 19. Breach-data / infostealer-log subscription as a credential-compromise fast-lane suspension — SpyCloud / Have I Been Pwned Enterprise / Constella

- **Modes:** A (account-hijack, credential-compromise, dormant-account-takeover)
- **Summary:** New in v2 to address the gap stage 2 surfaced: the dominant cheapest path under the document+selfie baseline is account takeover via credentials sourced from breach corpora and infostealer logs. SOP: subscribe to a breach/infostealer feed (SpyCloud, Have I Been Pwned Enterprise, Constella Intelligence, Recorded Future Identity Intelligence — pick one), monitor the email addresses associated with all pre-approved customer accounts, and on a fresh hit (especially infostealer-log hits, which carry session cookies and credential pairs) automatically suspend fast-lane status and require a fresh measure-19 verification plus a forced password+MFA reset. This is a direct measure-17 SOP because it conditions pre-approval status on a continuously-evaluated external signal.
- **attacker_stories_addressed:** credential-compromise (named directly — the branch's cheapest path is "compromises a faculty member who already has a verified account"), account-hijack (PI inbox compromise leaves residue in infostealer logs), dormant-account-takeover (a long-dormant credential is more likely to have appeared in a breach corpus over its lifetime).
- **external_dependencies:** SpyCloud API, Have I Been Pwned Enterprise API, or Constella API; KYC ops to triage hits; integration with the auth system to force a reset.
- **manual_review_handoff:** Breach hit on a pre-approved account's email → suspend fast-lane and queue a re-verification ticket; KYC ops contacts the account holder out-of-band (institutional phone or institutional secondary email) to initiate the reset.
- **flags_thrown:** `infostealer_log_hit` → immediate fast-lane suspension and forced reset. `breach_corpus_hit_with_password` → fast-lane suspension. `breach_corpus_hit_email_only` → review (lower urgency).
- **failure_modes_requiring_review:** Stale or false breach attributions; institutional email aliases that look like personal addresses; vendor latency between leak and feed.
- **record_left:** Breach feed event ID + the matched account + the action taken + the reset confirmation.
- Other fields: # stage 4

---

## 20. Institutional directory / SSO / InCommon affiliation cross-check at fast-lane evaluation time

- **Modes:** A (dormant-account-takeover, account-hijack, credential-compromise)
- **Summary:** New in v2 to address the gap stage 2 surfaced and the attacker excerpt from dormant-account-takeover that explicitly names this as the single defensive enhancement that "catches the branch cleanly." At fast-lane evaluation time, query the customer's stated institution's public directory or InCommon Federation metadata or Grouper-exposed group memberships to confirm the named PI is currently affiliated. For institutions exposing a SCIM directory or eduPersonAffiliation via SSO, the check is automated; for institutions with only an HTML faculty directory, the check is a scraped/manual lookup against the published faculty list. SOP: a stated PI who is no longer in the institutional directory triggers fast-lane suspension and a re-verification ticket. This is a measure-17 SOP because it conditions whether the inherited pre-approval status survives.
- **attacker_stories_addressed:** dormant-account-takeover (the branch's mapping file says explicitly: "a single defensive enhancement (institutional-directory cross-check asking 'is this researcher still here?') catches the branch cleanly"), account-hijack and credential-compromise (a hijacked account whose registered PI has since left the institution should also fail this check).
- **external_dependencies:** InCommon Federation metadata (`md.incommon.org`) for participating US R1s, institutional public faculty directories, optional SCIM endpoints where available, KYC ops for institutions without machine-readable directories.
- **manual_review_handoff:** PI not found in institution's public directory → suspend fast-lane and contact the institution's biosafety officer or department chair for confirmation.
- **flags_thrown:** `pi_not_in_institutional_directory` → suspend fast-lane and review. `pi_listed_as_emeritus_or_former` → suspend fast-lane and review.
- **failure_modes_requiring_review:** Directory lag (newly-departed PI still listed); directory privacy settings; PIs with name variants.
- **record_left:** Directory query result with timestamp + matched/unmatched record + reviewer notes.
- Other fields: # stage 4

---

## 21. Customer-entity ownership-change monitoring — registered-agent / UBO / principal-officer change detection via OpenCorporates

- **Modes:** A (shell-company)
- **Summary:** New in v2 to address the gap stage 2 surfaced: the "purchased going-concern with live provider accounts" sub-variant of shell-company ($150–300K acquisition of an existing biotech with live provider accounts). None of the v1 ideas would detect a quiet ownership change at a long-tenured customer. SOP: for every pre-approved entity customer, periodically (quarterly) re-query OpenCorporates by jurisdiction + entity number for any change in registered agent, principal officer, or filing status; for US entities, supplement with the FinCEN Beneficial Ownership Information registry where accessible (note: BOI access is currently restricted/in flux per recent rulings, flag for stage 4); on detected change, suspend fast-lane and route to senior review for re-verification of the new ownership.
- **attacker_stories_addressed:** shell-company (specifically the going-concern-acquisition sub-variant: "Buys an existing biotech/consulting entity from a business brokerage (e.g., Acquire.com), inheriting its formation history, aged domain, and — in the premium version — live synthesis-provider accounts and order history.")
- **external_dependencies:** OpenCorporates API (`api.opencorporates.com`, paid tier for write access and full company data), FinCEN BOI registry [access status: restricted, see stage 4], state Secretary of State business filings APIs where OpenCorporates is incomplete.
- **manual_review_handoff:** Detected change in registered agent / principal officer / UBO → senior reviewer; require a fresh measure-19 contact with the (potentially new) ownership before fast-lane resumes.
- **flags_thrown:** `registered_agent_changed` → suspend fast-lane. `principal_officer_changed` → suspend fast-lane. `ubo_changed` (where observable) → suspend fast-lane. `entity_status=dissolved_or_inactive` → block fast-lane.
- **failure_modes_requiring_review:** OpenCorporates lag relative to state filings; BOI registry inaccessible; legitimate succession events (e.g., founder retires).
- **record_left:** Periodic OpenCorporates snapshot + change detection record + the resulting re-verification ticket.
- Other fields: # stage 4

---

Coverage summary (by attacker story):

- **gradual-legitimacy-accumulation:** 1, 2, 7, 8, 9, 10, 13, 14, 16, 17, 18 — primarily 7+10 (CRM trust scoring + positive verification event) and 16+18 (research/affiliation/address gates a hollow LLC cannot pass)
- **shell-company:** 1, 2, 7, 8, 9, 10, 13, 14, 16, 17, 18, 21 — same cluster plus 21 for the going-concern-acquisition sub-variant
- **biotech-incubator-tenant:** 1, 2, 7, 8, 9, 10, 16, 18 — incubator-address rule (18) is the most direct
- **bulk-order-noise-cover:** 6, 7, 11, 12 — fast-lane status correctly granted by MSA, with periodic re-verification (12) and event-driven suspension (11) as the operative hardenings
- **account-hijack:** 7, 11, 17, 19, 20 — credential-event triggers (11), breach-data (19), and institutional-directory check (20)
- **credential-compromise:** 7, 11, 17, 19, 20 — same; breach-data (19) is the most direct given the branch explicitly cites infostealer-log marketplaces
- **dormant-account-takeover:** 7, 8, 11, 12, 19, 20 — institutional-directory check (20) is the cleanest single defense

## Dropped

- **(v1) Idea 4 — ISO/IEC 17025 accredited lab list.** Pure good-actor fast lane with no exclusionary effect on any of the seven mapped branches; none of the branches pretend to be ISO 17025 labs, so adding the directory as a fast lane widens the lane without raising any attacker's bar.
- **(v1) Idea 5 — ATCC institutional account verification.** Same reason as idea 4: positive signal but not exclusionary against any mapped branch. None of the seven branches lean on ATCC pretenses, so the SOP would never decline a fast-lane that wasn't already going to be declined.
- **(v1) Idea 15 — CLIA-certified lab list.** Same reason as ideas 4 and 5: good-actor fast lane with no exclusionary effect. None of the seven branches pretend to be CLIA labs.
- **(v1) Idea 14 plain SAM.gov registration.** Replaced (not dropped) by the narrowed USAspending.gov-cross-check variant (idea 14 in v2) because mere SAM.gov registration is self-asserted and free and earned no fast-lane slot on its own.
- **(v1) Idea 3 vague IGSC member-to-member confirmation SOP.** Replaced (not dropped) by the narrowed "IGSC shared rejected-customer list" variant (idea 3 in v2). The original framing did not address any of the seven mapped branches.
