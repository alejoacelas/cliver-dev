# Stage 1 Ideation — Measure 17 (pre-approval-list) — v1

Measure: For SOC orders, screen the customer against pre-authorized / pre-approved lists or designations, and/or against the provider's prior records of past SOC orders and outcomes. Pre-approval is a "fast lane" mechanism — its absence is not itself a flag, but its presence routes a customer past the costlier institution/individual legitimacy checks (measures 18–20). Two failure surfaces matter for ideation: (a) what external lists / designations are robust enough to safely seed the fast lane, and (b) what internal SOPs around prior-order history avoid treating manufactured tenure or hijacked accounts as pre-approved.

The seven attacker stories cluster into two patterns: **manufactured tenure** (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant — purpose-built orgs that build a clean order history specifically to be pre-approved) and **inherited tenure** (bulk-order-noise-cover, account-hijack, credential-compromise, dormant-account-takeover — attackers who silently inherit a real customer's pre-approved status). Ideation must address both.

Modes per idea: D = Direct, A = Attacker-driven.

---

## 1. Federal Select Agent Program (FSAP) registered entity list — CDC/APHIS Select Agent Registration

- **Modes:** D
- **Summary:** The Federal Select Agent Program (jointly run by CDC Division of Select Agents and Toxins and APHIS Agriculture Select Agent Services) maintains the authoritative list of US entities registered to possess, use, or transfer HHS/USDA select agents and toxins under 42 CFR Part 73 / 9 CFR Part 121 / 7 CFR Part 331. An entity on this list has already passed an FBI/CJIS Security Risk Assessment (SRA) on its Responsible Official and individuals with access, periodic CDC/APHIS inspections, and entity-level biosafety/biosecurity review. Provider treats a current FSAP-registered entity (matched on legal entity name + Responsible Official) as pre-approved for select-agent-adjacent SOC orders. Note that the public FSAP list is not exhaustive (some entries are withheld for security) so operationally this is a name list the provider maintains plus a vendor/SOP for keeping it current.
- **attacker_stories_addressed:** none directly — this is a "good-actor fast lane" idea, not an attacker filter. It is included because measure 17's purpose statement is "facilitates access for good actors"; ideas that build the legitimate fast lane are in scope.
- **external_dependencies:** CDC FSAP public entity list (`selectagents.gov`) [best guess: list is published as a static page rather than as an API], APHIS counterpart list, internal SOP for periodic refresh (quarterly), human roles: KYC ops to maintain the list and reconcile name variants.
- **manual_review_handoff:** When a customer's stated institution name fuzzy-matches a FSAP entry but the responsible-official email domain or shipping address doesn't match the registered entity, ticket goes to a senior KYC reviewer with playbook: confirm the customer's affiliation directly with the registered Responsible Official before granting fast-lane status.
- **flags_thrown:** `fsap_match=exact` → fast-lane (no flag). `fsap_match=fuzzy_only` → review. `fsap_match=none` → no flag, fall through to measures 18–20 (consistent with the measure-17 spec: lack of pre-approval is not itself a flag).
- **failure_modes_requiring_review:** FSAP list page unreachable on refresh day; entity name variants (e.g., "Univ. of X" vs "University of X System"); newly-registered entities not yet on the publicly visible list.
- **record_left:** Snapshot of the FSAP list on the date of the customer's pre-approval evaluation, plus the matched entry, plus the reviewer's reconciliation notes if any. Auditable per CDC list version.
- Other fields: # stage 4

---

## 2. NIH-registered Institutional Biosafety Committee (IBC) roster — NIH Office of Science Policy IBC registration database

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant)
- **Summary:** Any US institution receiving NIH funding for recombinant or synthetic nucleic acid research must register an Institutional Biosafety Committee (IBC) with the NIH Office of Science Policy (OSP) under the NIH Guidelines for Research Involving Recombinant or Synthetic Nucleic Acid Molecules. OSP maintains a registry of registered IBCs (roughly 900–1000 institutions) including institution name, IBC chair, and biosafety officer. Customer's stated institution must appear in the IBC registry to be eligible for pre-approval; the customer's stated PI/biosafety contact must reconcile against the registered IBC chair/BSO. This both seeds the fast lane for legitimate academic customers and is a high bar for manufactured-tenure attackers — registering an IBC requires real recombinant DNA research and OSP review, not just an LLC and a website.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant (these branches build a hollow LLC with no IBC; they are not eligible for an IBC-keyed fast lane, and the absence of an IBC is the discriminator the provider would use against them when they later try to claim institutional status)
- **external_dependencies:** NIH OSP IBC registration list [best guess: published via OSP website, possibly FOIA-able if not public], internal SOP for refresh, KYC ops for name reconciliation.
- **manual_review_handoff:** When customer claims institutional affiliation but no IBC entry matches, route to senior reviewer; playbook is to require a written attestation from the named BSO via institutional email before granting fast-lane status.
- **flags_thrown:** `ibc_registered=yes` AND BSO/email reconciled → fast-lane. `ibc_registered=yes` BUT BSO mismatch → review. `ibc_registered=no` → no flag (not all legitimate customers need an IBC; e.g., contract orgs); fall through to measures 18–20.
- **failure_modes_requiring_review:** IBC registry stale; small institutions whose IBC is hosted by a parent system; non-NIH-funded labs with no IBC.
- **record_left:** Snapshot of OSP IBC registry on evaluation date, matched entry, BSO reconciliation evidence.

---

## 3. International Gene Synthesis Consortium (IGSC) member directory — Harmonized Screening Protocol customer-list cross-referral

- **Modes:** D
- **Summary:** The IGSC is the industry consortium that authored the Harmonized Screening Protocol; members include Twist, IDT, GenScript, Eurofins Genomics, Telesis Bio, etc. The IGSC's published member list defines the universe of providers who screen to a common standard. Two distinct uses for pre-approval: (a) a customer who can demonstrate a verified, in-good-standing account at another IGSC member is on a higher-trust track (pending member-to-member confirmation under whatever data-sharing arrangement IGSC permits), and (b) the IGSC member list itself is the canonical place to look for any future shared "denied / disqualified customer" registry. Operationally for v1 the idea is: ingest the IGSC member directory and define an SOP for member-to-member customer verification when a customer cites prior history at another member.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company (customer who claims tenure at "another major synthesis vendor" can be cross-checked rather than taken at their word)
- **external_dependencies:** IGSC member directory (`genesynthesisconsortium.org`) [best guess: static web page list], member-to-member contact SOP (no public shared API today — this is a human-mediated check), KYC ops staff.
- **manual_review_handoff:** When customer cites a prior multi-year relationship with another IGSC member as evidence of legitimacy, KYC ops emails that member's KYC contact to confirm account standing; playbook is to refuse the citation as evidence if the other member cannot or will not confirm within N business days.
- **flags_thrown:** `igsc_member_referral_confirmed` → fast-lane. `igsc_member_referral_unconfirmed` → fall through to 18–20 (no flag). `customer_claims_relationship_other_member_refuses_to_confirm` → review (possible misrepresentation).
- **failure_modes_requiring_review:** No standard data-sharing agreement between members; member contacted is slow to respond; customer's claimed prior account at the other member is itself a hijacked one (cross-references measure 17's general weakness against account-takeover branches).
- **record_left:** Email thread or ticket recording the member-to-member confirmation, retained per audit policy.

---

## 4. ISO/IEC 17025 accredited testing/calibration lab list — A2LA / ANAB / IAS accreditation directories

- **Modes:** D
- **Summary:** ISO/IEC 17025 accredited labs are listed publicly by their accreditation bodies (A2LA, ANAB, IAS, PJLA in the US; UKAS in the UK; DAkkS in DE; etc.). An accredited lab has passed a documented technical-competence audit and committed to a documented quality system. Provider treats customers whose stated organization appears on an accreditation body's directory (at the same physical address as the customer's shipping address) as pre-approved at the institution level. This is most useful for clinical / forensic / environmental testing labs that order primers and probes routinely but don't have an academic publication footprint.
- **attacker_stories_addressed:** none directly (ISO 17025 accreditation is too expensive and slow to be a manufactured-tenure target; this is purely a good-actor fast-lane idea)
- **external_dependencies:** A2LA directory (`a2la.org/directory`), ANAB directory, IAS directory, PJLA directory [best guess: each is a public web search interface, not a single API], internal SOP to refresh quarterly.
- **manual_review_handoff:** When customer's organization name fuzzy-matches an accredited lab but at a different shipping address, route to KYC ops to confirm whether the customer is an off-site employee (rare and verifiable) before granting fast-lane status.
- **flags_thrown:** `iso17025_accredited_match=exact` AND address matches → fast-lane. `iso17025_accredited_match=fuzzy` → review. None → no flag.
- **failure_modes_requiring_review:** Lab's accreditation lapsed since last refresh; multi-site lab with one accredited site and others not.
- **record_left:** Snapshot of relevant directory entries at evaluation time + matched entry.

---

## 5. ATCC institutional account verification — ATCC customer-account cross-check

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company)
- **Summary:** ATCC (American Type Culture Collection) sells biological reference materials and maintains institutional accounts that themselves require institutional documentation (PI letter, biosafety attestation, MTA acceptance). A customer who has an active institutional ATCC account has already passed an independent institutional vetting process. Provider treats demonstrated ATCC institutional account standing — verified via the customer providing an ATCC account number and the provider confirming with ATCC's institutional sales group under a member-to-member SOP, or via the customer forwarding an order confirmation from an ATCC institutional invoice — as a positive pre-approval signal. This is harder for manufactured-tenure attackers because ATCC's onboarding is itself non-trivial.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company (their LLCs may register an ATCC account but the institutional-account variant requires a real PI letter and biosafety attestation, raising the bar)
- **external_dependencies:** ATCC institutional sales contact (no public API; this is an SOP), internal KYC ops staff, written customer authorization to contact ATCC.
- **manual_review_handoff:** When customer cites an ATCC institutional account, KYC ops emails ATCC institutional sales for confirmation; playbook is to require the customer's written authorization first.
- **flags_thrown:** `atcc_institutional_confirmed=yes` → fast-lane. `atcc_individual_only` → no fast-lane (individual ATCC accounts don't carry the same institutional vetting). `atcc_unconfirmed` → fall through.
- **failure_modes_requiring_review:** ATCC won't confirm without customer release; customer has only an individual account.
- **record_left:** Confirmation email from ATCC + customer's release authorization.

---

## 6. Institutional Master Service Agreement (MSA) signatory list — provider's own contracts/legal CRM

- **Modes:** D, A (bulk-order-noise-cover)
- **Summary:** The provider's own legal/contracts system (Ironclad, DocuSign CLM, Agiloft, or a Salesforce contracts module — [best guess: depends on provider's internal stack]) holds the authoritative list of institutions that have a signed Master Service Agreement, MTA, or institutional purchasing agreement with the provider. These agreements always go through institutional procurement and legal, which independently verifies the institution's legal existence and authority. SOP: any customer whose billing institution is a current MSA signatory is pre-approved at the institution level (the individual still needs measures 19/20). The MSA list is typically authoritative because the provider's own legal team ratified it.
- **attacker_stories_addressed:** bulk-order-noise-cover (the R1 university core facility this branch operates from is overwhelmingly likely to be on the provider's MSA list — and that is the legitimate basis for the historical pre-approval the branch exploits. Naming this idea is what lets stage 5 reason about hardening: the institution is correctly pre-approved; the per-order or per-individual checks are where the bulk-order branch must be caught.)
- **external_dependencies:** Provider's own contracts system (Ironclad / Salesforce CPQ / equivalent), legal/contracts staff to flag expirations.
- **manual_review_handoff:** When customer cites institutional MSA but billing entity name doesn't reconcile against contracts system, route to legal ops; playbook is to confirm with the named contracting officer at the institution before granting fast-lane status.
- **flags_thrown:** `msa_active=yes` AND billing entity matches → institution-level fast-lane. `msa_expired` → review. `msa_none` → no flag, fall through to measures 18–20.
- **failure_modes_requiring_review:** MSA on file but with a parent entity, not the customer's named subsidiary; MSA expired but still in renewal negotiation.
- **record_left:** Pointer to MSA record (contract ID, expiration, signatory) in the contracts system, captured at evaluation time.

---

## 7. Internal CRM historical-buyer scoring — Salesforce / HubSpot prior-order rollups (with tenure + outcomes weighting)

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant, bulk-order-noise-cover, account-hijack, credential-compromise, dormant-account-takeover)
- **Summary:** This is the operative implementation of "screen against previous company records for past SOC orders and outcomes." Provider's CRM (Salesforce Service Cloud or HubSpot, plus an order-history data mart fed from the order management system) computes per-customer rollups: account tenure (months since first order), count of completed non-SOC orders, count of completed SOC orders, count of orders that triggered any KYC review, count of adverse outcomes (cancelled, refused, escalated to bioethics review, customer's IBC contact actually reached and confirmed the order), and a date of last positive verification. Pre-approval requires a tenure threshold AND a minimum non-SOC-order count AND zero adverse outcomes AND at least one prior positive verification within a refresh window. The weighting matters: simply "12 months and 20 orders" would allow gradual-legitimacy-accumulation, so the SOP must require a positive verification event (see idea 10) within the window.
- **attacker_stories_addressed:** all seven (this is the central idea for the measure)
- **external_dependencies:** Salesforce or HubSpot CRM, order management system data mart, KYC ops for SOP definition and threshold tuning.
- **manual_review_handoff:** When a customer is just below threshold or has any adverse outcome flag, route to KYC ops; playbook is to fall through to measures 18–20 rather than auto-grant fast-lane.
- **flags_thrown:** `tenure>=N AND non_soc_orders>=M AND adverse_outcomes==0 AND last_positive_verification<=K_days` → fast-lane. `tenure>=N BUT no positive verification on file` → review (catches manufactured-tenure branches that have orders but no live institutional confirmation). `adverse_outcomes>0` → block fast-lane and route to senior reviewer. `account_dormant_then_resumed` → review (catches dormant-account-takeover by treating long dormancy followed by resumption as a re-verification trigger).
- **failure_modes_requiring_review:** Data mart lag; merged customer records (acquisitions); CRM identifier collision across an account that changed PI.
- **record_left:** CRM rollup snapshot at evaluation time + the SOP version applied + the verification date used.

---

## 8. NIH RePORTER grant-awarded PI lookup — NIH RePORTER public API

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant)
- **Summary:** NIH RePORTER (`api.reporter.nih.gov`) exposes a public API of all NIH-funded projects with PI name, institution, project number, abstract, fiscal year, and award amount. A customer whose claimed PI name + institution returns at least one active R-, U-, P-, or K-mechanism award in a relevant scientific area is on a fast-lane: the NIH peer-review system has already vouched for that PI's scientific legitimacy and the institution is real enough to administer federal funds. Manufactured-LLC branches don't have NIH awards (NIH grants to a brand-new shell biotech with no track record are essentially impossible on the timescale of these branches). NIH SBIR/STTR awards extend the lookup to small biotechs.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant (these branches build hollow orgs with no NIH funding; the absence of any RePORTER hit is a non-flag but it disqualifies the fast lane). Also weakly addresses dormant-account-takeover (an ex-PI whose NIH funding has ended for >N years should not still be auto-fast-laned).
- **external_dependencies:** NIH RePORTER API (`api.reporter.nih.gov/v2/projects/search`), no API key required [best guess], rate-limited.
- **manual_review_handoff:** When PI name fuzzy-matches but institution doesn't, route to KYC ops to disambiguate (common with PIs who have moved institutions).
- **flags_thrown:** `nih_active_award_found` AND PI+institution match → fast-lane. `nih_award_only_expired_>5y` → review (dormant-PI signal). `no_match` → no flag, fall through.
- **failure_modes_requiring_review:** PI is funded by NSF/DOE/private foundation and has no NIH presence (legitimate); name disambiguation across common surnames; institutional name normalization.
- **record_left:** RePORTER API request/response with project numbers and PI ID, retained.

---

## 9. NSF Award Search public API — NSF-funded PI lookup (parallel to NIH RePORTER)

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant)
- **Summary:** NSF Award Search (`api.nsf.gov/services/v1/awards`) is the NSF analog of NIH RePORTER. Useful for biology/chemistry PIs at non-NIH institutions (e.g., evolutionary biology, environmental microbiology, undergraduate-focused PUIs). Same SOP as idea 8: a current NSF award disambiguates an academic customer; absence is not a flag.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant
- **external_dependencies:** NSF Award Search API.
- **manual_review_handoff:** Same playbook as idea 8.
- **flags_thrown:** `nsf_active_award` → fast-lane contributor. None alone is a block.
- **failure_modes_requiring_review:** Same as 8.
- **record_left:** API response with award IDs.

---

## 10. Trust-scoring SOP based on prior-order outcomes — explicit "positive verification event" requirement

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant)
- **Summary:** This is the SOP that hardens idea 7 against the manufactured-tenure branches. The SOP defines a "positive verification event" as one of: (a) a measure-19 individual-legitimacy interview successfully completed, (b) a measure-20 voucher confirmation received from a verified third party, (c) an MSA confirmation event (idea 6), (d) an outbound call/email to the customer's institutional biosafety officer (idea 2) confirming a specific past order, (e) a successful site visit. Pre-approval requires that the most recent positive verification event was within the refresh window (e.g., 18 months) regardless of how many SOC orders the customer has placed. This converts "tenure + clean order history" from sufficient to necessary-but-not-sufficient: an attacker who only places clean orders for 12 months never accumulates a positive verification event and is never fast-laned. Operationally lives in the same CRM as idea 7 with a `last_positive_verification_date` field.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant (these branches' load-bearing assumption — restated in story 1 — is "the provider's review actually weights customer tenure and order history (not just point-in-time entity profile)"; this SOP makes that weighting insufficient by adding an active-verification leg)
- **external_dependencies:** CRM with custom fields, KYC ops, written SOP and training, audit log of verification events.
- **manual_review_handoff:** When `last_positive_verification_date` is older than the refresh window, route to KYC ops to schedule a re-verification (typically a measure-19 or measure-20 contact); playbook is to suspend fast-lane access until re-verified.
- **flags_thrown:** `no_positive_verification_on_file` → block fast-lane. `positive_verification_stale` → block fast-lane and schedule re-verification. `positive_verification_fresh_and_clean` → fast-lane.
- **failure_modes_requiring_review:** Verification event recorded but free-text only and not normalized into the field; customer's biosafety contact has changed.
- **record_left:** Per-customer verification ledger entries, each citing a specific event type and a specific evidence pointer (email, call recording reference, ticket).

---

## 11. Re-verification trigger on credential / contact / device changes — CRM event-driven re-evaluation SOP

- **Modes:** A (account-hijack, credential-compromise, dormant-account-takeover)
- **Summary:** SOP that automatically suspends fast-lane / pre-approved status whenever the underlying account exhibits any of: password reset within last N days, MFA reset within last N days, addition of a new shipping address, change of billing institution, addition of a new device fingerprint, dormancy for >18 months followed by login, change of stated PI or biosafety contact. This addresses the "inherited tenure" cluster directly: every one of the four account-takeover branches relies on the pre-approval status surviving the takeover event silently. Tying pre-approval to "no recent suspicious-state-change events" forces a re-verification gate after any takeover-shaped event.
- **attacker_stories_addressed:** account-hijack, credential-compromise, dormant-account-takeover, bulk-order-noise-cover (the shared-facility-account sub-variant where the registered IAL2 belongs to a predecessor — long-ago-set-up shared accounts trip the dormancy condition)
- **external_dependencies:** CRM, IAM/auth log feed, order management system event stream, ticketing for re-verification queue.
- **manual_review_handoff:** When trigger fires, route to KYC ops; playbook is to require a fresh measure-19 or measure-20 verification before fast-lane access resumes.
- **flags_thrown:** `password_reset_recent` → suspend fast-lane. `mfa_reset_recent` → suspend fast-lane. `dormancy_then_resumption` → suspend fast-lane. `pi_or_bso_changed` → suspend fast-lane.
- **failure_modes_requiring_review:** Legitimate password resets are common; SOP must distinguish event volume thresholds.
- **record_left:** Event log per trigger + the re-verification ticket and outcome.

---

## 12. Predecessor-account re-IAL2 SOP for shared-facility accounts — periodic re-verification of long-tenured accounts

- **Modes:** A (bulk-order-noise-cover, dormant-account-takeover)
- **Summary:** The bulk-order-noise-cover branch's shared-facility-account sub-variant explicitly relies on the registered IAL2 belonging to a long-departed predecessor. SOP that any institutional/facility account whose registered individual has not personally re-verified within (e.g.) 24 months is removed from fast-lane status until re-verified. This is a specific instance of the broader idea 11 but focused on the shared-account pattern that the bulk-order branch names directly.
- **attacker_stories_addressed:** bulk-order-noise-cover, dormant-account-takeover
- **external_dependencies:** CRM with `last_individual_reverification` field, KYC ops scheduler.
- **manual_review_handoff:** Annual sweep produces a queue of accounts due for re-verification; KYC ops contacts the institution's currently-listed responsible person via institutional email.
- **flags_thrown:** `account_age>2y AND last_individual_reverification stale` → suspend fast-lane.
- **failure_modes_requiring_review:** Institution legitimately uses a shared role-based account with a documented succession process.
- **record_left:** Sweep output + per-account re-verification ticket.

---

## 13. Outcome-based blacklist / "do not fast-lane" provider-internal list — derived from prior negative outcomes

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-company)
- **Summary:** Symmetric counterpart to the pre-approval list: a provider-internal "do not fast-lane" list of customer identifiers (legal entity, primary email domain, billing address, named individual) tied to a prior adverse outcome (cancelled SOC order, BWC concern raised by reviewer, customer who failed a measure-19 or measure-20 check, customer whose stated institution was found not to exist). Applied at order time as a hard block on fast-lane status. Lives in the same CRM as ideas 7/10 but with a separate access-controlled table because additions are sensitive (false-accusation risk). This complements measure 17 by making outcomes operational beyond the single customer record.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company (when one shell entity is caught, related entities — same registered agent, same Delaware filer, same WHOIS contact — should be findable on the do-not-fast-lane list)
- **external_dependencies:** Hardened CRM table; legal review SOP for additions/removals.
- **manual_review_handoff:** Match → block fast-lane and route to senior reviewer with full prior-outcome context.
- **flags_thrown:** `dnf_match=exact` → block fast-lane. `dnf_match_by_shared_attribute (e.g., shared registered agent)` → review.
- **failure_modes_requiring_review:** False-positive risk on shared attributes; legal exposure on additions.
- **record_left:** Audit log of every addition/removal with the reviewer's justification and the underlying ticket.

---

## 14. SAM.gov entity registration cross-check — System for Award Management active registrants

- **Modes:** D
- **Summary:** SAM.gov is the canonical US federal vendor registry; any entity that does business with the US government has a SAM.gov record (with UEI, formerly DUNS) that includes the legal entity name, address, NAICS codes, and active/expired status. Provider treats a current SAM.gov registration in a relevant NAICS (e.g., 541714 Research and Development in Biotechnology, 325414 Biological Product Manufacturing, 611310 Universities) as a positive pre-approval signal. Manufactured-LLC branches can register on SAM.gov but the registration is auditable and rare for purpose-built shells; legitimate biotechs and universities have it.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company (manufactured-LLC branches don't typically bother with SAM.gov registration since they aren't bidding on federal contracts; absence narrows the fast lane)
- **external_dependencies:** SAM.gov public Entity Information API (`api.sam.gov/entity-information/v3/entities`), API key required [best guess].
- **manual_review_handoff:** When customer name fuzzy-matches a SAM.gov entry at a different address, route to KYC ops to disambiguate.
- **flags_thrown:** `sam_active AND naics_relevant` → fast-lane contributor. `sam_expired` → no contribution. `sam_none` → no flag, fall through.
- **failure_modes_requiring_review:** Multiple registrations under similar names; UEI not on the customer's stated identifiers.
- **record_left:** SAM.gov API response with UEI and registration status.

---

## 15. CLIA-certified laboratory list — CMS CLIA Provider of Services / Laboratory Lookup

- **Modes:** D
- **Summary:** CMS publishes the list of CLIA-certified clinical laboratories (Provider of Services file / CLIA Laboratory Lookup). Any clinical/diagnostic lab customer should be CLIA-certified at the address the provider ships to. Match → fast-lane at the institution level. This catches a customer category (clinical labs ordering primers/probes for in-house assays) that academic-leaning fast-lanes (NIH RePORTER, IBC) miss.
- **attacker_stories_addressed:** none directly — good-actor fast-lane idea.
- **external_dependencies:** CMS CLIA data file (`data.cms.gov` [best guess]), refreshed periodically.
- **manual_review_handoff:** When CLIA name matches but address differs, KYC ops disambiguates.
- **flags_thrown:** `clia_active AND address matches` → fast-lane. None alone is a block.
- **failure_modes_requiring_review:** CLIA cert lapsed; multi-site lab.
- **record_left:** CLIA file snapshot + matched record.

---

## 16. ORCID + ROR + OpenAlex composite "real-PI" check for fast-lane qualification

- **Modes:** A (gradual-legitimacy-accumulation, shell-company)
- **Summary:** Pre-approval at the individual-PI level is conditioned on the customer presenting a verified ORCID iD whose author record (via OpenAlex) shows at least N publications affiliated with the customer's stated institution (resolved via ROR), with at least one publication in the last 24 months. Manufactured-LLC branches in story 1 explicitly mention seeding ORCID profiles and bioRxiv preprints, but a single preprint will not pass an N≥3-with-recent-activity threshold and the affiliation must reconcile through ROR to the customer's institution, which the shell-company branch cannot easily provide. Distinct from measures 18/19 because here it's specifically a fast-lane gate (good-actor accelerator), not a general check.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant
- **external_dependencies:** ORCID public API (`pub.orcid.org/v3.0`), OpenAlex authors API (`api.openalex.org/authors`), ROR API (`api.ror.org`).
- **manual_review_handoff:** Borderline (N-1 publications; affiliation in transition) → KYC ops disambiguates.
- **flags_thrown:** `orcid_pubcount<threshold` → no fast-lane. `orcid_recent_activity_absent` → no fast-lane. None alone blocks; all are fast-lane gates.
- **failure_modes_requiring_review:** Early-career PI legitimately below threshold; PI in a non-publishing field.
- **record_left:** ORCID iD, list of matched OpenAlex work IDs, ROR ID, all stored.

---

## 17. Cross-provider fraud-signal sharing via a Tier-1 KYC vendor (Sift / Sardine / Alloy network signals) — provider's existing fraud network

- **Modes:** A (gradual-legitimacy-accumulation, shell-company, account-hijack, credential-compromise)
- **Summary:** Provider already runs orders through a fraud-detection vendor for payment risk (e.g., Sift, Sardine, Alloy) [best guess: at least one of these is in the stack]. These vendors maintain cross-customer fraud-signal networks: device fingerprints, email reputations, IP reputations, velocity patterns. SOP is to make pre-approval / fast-lane status conditional on the customer's account having a clean Sift/Sardine/Alloy score over its tenure window — not just a clean order outcome inside the provider's own records. This addresses manufactured-tenure branches if their devices, emails, or IPs are reused across other shell operations the network has seen, and addresses account-takeover branches if Sift/Sardine flags the device/IP change at takeover time.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, account-hijack, credential-compromise
- **external_dependencies:** Sift / Sardine / Alloy account (provider's existing).
- **manual_review_handoff:** Score above threshold during review window → block fast-lane and route to KYC ops with the vendor's reason codes.
- **flags_thrown:** `sift_score_elevated_in_window` → block fast-lane. `device_change_during_review_window` → review.
- **failure_modes_requiring_review:** Vendor false positives; reason codes opaque.
- **record_left:** Vendor score history retained.

---

## 18. Institutional shipping-address corroboration as a fast-lane prerequisite — ROR + USPS standardized address match SOP

- **Modes:** A (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant)
- **Summary:** Fast-lane status is gated on the customer's shipping address being a normalized match to an address publicly listed for the customer's stated institution in ROR (Research Organization Registry) or in the institution's directory. Manufactured-tenure branches can use a virtual office or co-working lab bench (story 2 explicitly names this); incubator-tenant branches use BioLabs/LabCentral/Genspace addresses, which are themselves identifiable. SOP: virtual offices, co-working labs, and incubator addresses are not eligible for fast-lane shipping (they fall through to measures 18–20). This is a Measure-17 SOP, not a Measure-3 check, because it conditions pre-approval rather than blocking the order.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant
- **external_dependencies:** ROR API (`api.ror.org`), Smarty / Lob (for normalization), provider-maintained list of known incubator and co-working biotech addresses (BioLabs locations, LabCentral, Genspace, JLABS, etc.).
- **manual_review_handoff:** Shipping is a known incubator/coworking address → not eligible for fast-lane; fall through to 18–20. No reviewer action is needed unless the customer disputes.
- **flags_thrown:** `shipping_is_known_incubator_address` → block fast-lane. `shipping_normalized_match_to_ror` → fast-lane contributor.
- **failure_modes_requiring_review:** Real small biotechs do legitimately operate from incubators (this is the false-positive cost).
- **record_left:** Address normalization result + ROR match record + incubator-list version applied.

---

Coverage summary (by attacker story):

- **gradual-legitimacy-accumulation:** ideas 2, 3, 5, 7, 8, 9, 10, 13, 14, 16, 17, 18 — addressed primarily by ideas 7+10 (CRM trust scoring conditioned on a positive verification event) and 16+18 (research/affiliation/address gates a hollow LLC cannot pass)
- **shell-company:** ideas 2, 3, 5, 7, 8, 9, 10, 13, 14, 16, 17, 18 — same cluster
- **biotech-incubator-tenant:** ideas 2, 7, 8, 9, 10, 16, 18 — incubator-address rule (18) is the most direct
- **bulk-order-noise-cover:** ideas 6, 7, 11, 12 — fast-lane status correctly granted by MSA, but periodic re-verification (12) and event-driven suspension (11) are the operative hardenings; this branch is also primarily a measure-18/19 problem
- **account-hijack:** ideas 7, 11, 17 — credential-event-driven re-evaluation (11) is the operative hardening
- **credential-compromise:** ideas 7, 11, 17 — same
- **dormant-account-takeover:** ideas 7, 8 (expired-funding signal), 11, 12 — dormancy-then-resumption is the trigger that suspends inherited fast-lane

Open question carried into stage 2: ideas 1, 4, 15 are "good-actor fast-lane" ideas with no direct attacker mapping. The measure description explicitly says pre-approval "facilitates access for good actors" and "does not stop specific bad actors," so good-actor fast-lane ideas are in scope per the measure spec, but stage 2's relevance gate is keyed on attacker-story coverage. I have flagged these openly so stage 2 can rule on whether to keep them.

## Dropped

(none — first iteration)
