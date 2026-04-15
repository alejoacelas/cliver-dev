# Stage 2 Feasibility Check — Measure 17 (pre-approval-list) — v1

Reviewing `01-ideation-measure-17-v1.md`. Two gates: concreteness and relevance. Adversarial.

Measure-17 framing note: the measure spec explicitly states pre-approval "facilitates access for good actors. The process of screening for pre-approval does not stop specific bad actors." This complicates the relevance gate: pure good-actor fast-lane ideas are spec-aligned but technically address zero attacker stories. I rule that such ideas can PASS relevance only if they materially narrow the fast lane in a way that disadvantages a specific manufactured-tenure or inherited-tenure branch — i.e., they have to be exclusionary, not merely inclusive. A fast-lane source that admits good actors but does not raise the bar for any attacker branch fails relevance.

---

## Verdicts

### Idea 1 — Federal Select Agent Program (FSAP) registered entity list
- **Concreteness:** PASS. Names CDC FSAP / APHIS, 42 CFR Part 73, the Responsible Official role, and the public list at selectagents.gov.
- **Relevance:** PASS (narrowly). FSAP registration is essentially impossible for a manufactured-LLC branch (FBI SRA on the RO; CDC inspections), so using FSAP membership as a fast-lane gate genuinely raises the bar against gradual-legitimacy-accumulation, shell-company, and biotech-incubator-tenant if those branches try to claim select-agent-class legitimacy. The ideation file lists no attacker stories addressed; ideation should add the three manufactured-tenure branches in v2 to make the relevance argument explicit.
- **Verdict:** REVISE. Action: in `attacker_stories_addressed`, add gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant with the rationale "FSAP registration is unattainable for these branches; making FSAP one of the only fast lanes raises the bar."

### Idea 2 — NIH IBC roster
- **Concreteness:** PASS. NIH OSP, IBC registration under the NIH Guidelines, BSO/IBC chair as reconcilable contact.
- **Relevance:** PASS. Directly named against the three manufactured-tenure branches with a clean rationale (they have no IBC).
- **Verdict:** PASS.

### Idea 3 — IGSC member directory cross-referral
- **Concreteness:** PARTIAL. Names IGSC and the member set, but the operative mechanism — member-to-member confirmation of customer standing — is described as "no public shared API today," which is honest but means stage 4 has nothing to look up. The idea is essentially "have an SOP for emailing other members," which is concrete-as-SOP but very thin.
- **Relevance:** WEAK. The attacker stories cited (gradual-legitimacy-accumulation, shell-company) would not actually claim a multi-year relationship at another major IGSC member, because they explicitly start from a fresh LLC; if they did claim one, the cited member would not confirm. The branch most plausibly addressed is a customer who lies about their other-vendor history, which is not in the seven mapped stories. Pattern-matching the measure name.
- **Verdict:** REVISE. Action: either narrow the idea to "ingest the IGSC public 'do not sell' / 'rejected customer' shared list IF one exists" (and admit if it doesn't, this drops to a research-question for stage 4), or DROP. The vague member-to-member SOP isn't doing real work for the seven mapped branches.

### Idea 4 — ISO/IEC 17025 accredited lab list
- **Concreteness:** PASS. Names A2LA, ANAB, IAS, PJLA directories specifically.
- **Relevance:** FAIL. Ideation explicitly admits zero attacker stories and the rationale "ISO 17025 is too expensive to be a manufactured-tenure target." But measure-17 ideas need to either narrow a real attacker branch or demonstrably narrow the fast lane. ISO 17025 is one positive signal among several; it doesn't actually exclude any of the seven mapped branches because none of them claim ISO 17025 status in the first place. Adding ISO 17025 as a fast-lane source widens the lane without raising any attacker's bar.
- **Verdict:** DROP. Reason: pure good-actor fast-lane with no exclusionary effect on any mapped branch. If there is a class of clinical/forensic-lab attacker the mapping file missed, ideation could revisit.

### Idea 5 — ATCC institutional account verification
- **Concreteness:** PASS-ish. Names ATCC institutional sales as the SOP target. No public API but the SOP is clearly defined.
- **Relevance:** WEAK. The argument that ATCC institutional accounts are hard to obtain is plausible but not load-bearing — gradual-legitimacy-accumulation and shell-company branches generally don't claim ATCC institutional status, so using it as a fast-lane gate doesn't catch them; it just declines to fast-lane them, which is the same outcome as not having the idea. The idea is not exclusionary against the mapped branches; it's a positive signal.
- **Verdict:** REVISE. Action: either reframe as "ATCC institutional account is required for fast-lane access for any customer claiming clinical/diagnostic legitimacy" (which would actually exclude shell-clinical-lab variants if any exist in the mapping) or DROP. Honest admission: the seven mapped branches don't lean on ATCC pretenses, so this idea is probably better dropped.

### Idea 6 — Institutional MSA signatory list (provider's contracts CRM)
- **Concreteness:** PASS. Ironclad / Salesforce CPQ / Agiloft named, with the SOP clearly described.
- **Relevance:** PASS. The bulk-order-noise-cover branch operates from an R1 university that is correctly MSA-pre-approved; ideation correctly notes that this idea names the legitimate basis for the historical pre-approval and makes clear that the bulk-order branch has to be caught by per-individual checks (ideas 11/12). This is genuine reasoning about why measure 17 is the wrong layer for that branch. PASS.
- **Verdict:** PASS.

### Idea 7 — Internal CRM historical-buyer scoring
- **Concreteness:** PASS. Names Salesforce Service Cloud / HubSpot, the data mart, and the specific rollup fields. The SOP is the operative implementation of the measure-17 spec ("previous company records for past SOC orders and outcomes").
- **Relevance:** PASS. Addresses all seven branches, and the framing — that tenure alone is insufficient and must be paired with a positive verification event (idea 10) — is exactly the load-bearing rebuttal to the central row of gradual-legitimacy-accumulation.
- **Verdict:** PASS.

### Idea 8 — NIH RePORTER PI lookup
- **Concreteness:** PASS. Names the API endpoint, the project mechanisms (R/U/P/K), and SBIR/STTR.
- **Relevance:** PASS. Manufactured-tenure branches genuinely cannot get NIH funding on a 6–12 month timeline, and the dormant-account-takeover argument (expired funding > 5y) is a real signal.
- **Verdict:** PASS.

### Idea 9 — NSF Award Search API
- **Concreteness:** PASS. Endpoint named.
- **Relevance:** PASS-ish. Same logic as idea 8 but for non-NIH PIs. The two ideas overlap; not a duplicate because the data sources are distinct, but stage 3 may consolidate.
- **Verdict:** PASS.

### Idea 10 — Trust-scoring SOP requiring a positive verification event
- **Concreteness:** PASS. The SOP defines specific event types (measure-19 interview, measure-20 voucher, MSA confirmation, BSO callback, site visit) and a `last_positive_verification_date` field name. This is the kind of SOP idea the measure spec invites.
- **Relevance:** PASS. This is the single most important idea in the file for addressing the central row of gradual-legitimacy-accumulation: it directly invalidates the branch's load-bearing assumption that tenure + clean order history alone trigger pre-approval. Honest argument with attacker excerpts.
- **Verdict:** PASS.

### Idea 11 — Re-verification trigger on credential / contact / device changes
- **Concreteness:** PASS. Specific trigger conditions named (password reset, MFA reset, dormancy, PI/BSO change, new device fingerprint).
- **Relevance:** PASS. Directly addresses all four account-takeover branches (account-hijack, credential-compromise, dormant-account-takeover, and the shared-facility sub-variant of bulk-order-noise-cover).
- **Verdict:** PASS.

### Idea 12 — Predecessor-account re-IAL2 SOP
- **Concreteness:** PASS-ish. SOP described with a specific 24-month threshold and a `last_individual_reverification` field.
- **Relevance:** PASS. Targets the named shared-facility sub-variant of bulk-order-noise-cover and dormant-account-takeover. Mild overlap with idea 11 but distinct enough (idea 11 is event-driven, 12 is calendar-driven).
- **Verdict:** PASS.

### Idea 13 — Internal "do not fast-lane" outcome blacklist
- **Concreteness:** PASS. Specific CRM table, specific match attributes (legal entity, email domain, billing address, named individual, registered agent).
- **Relevance:** PASS. The shared-attribute matching (registered agent, Delaware filer, WHOIS contact) is the operative idea for catching a second iteration of a previously-caught shell-company / gradual-legitimacy attacker who returns under a fresh LLC.
- **Verdict:** PASS.

### Idea 14 — SAM.gov entity registration
- **Concreteness:** PASS. SAM.gov entity API named with relevant NAICS codes.
- **Relevance:** WEAK. The argument is "manufactured-LLC branches don't bother registering on SAM.gov," but registering is free and easy and any attacker reading public SOPs would just register. Unlike NIH RePORTER (where the underlying peer review is the load-bearing thing), SAM.gov registration is self-asserted and verifies very little. The fast-lane signal is thin.
- **Verdict:** REVISE. Action: either narrow to "SAM.gov + active federal contract / award lookup against USAspending.gov" (which is much harder to fake than mere registration) or DROP. The plain-registration version doesn't earn its slot.

### Idea 15 — CLIA-certified lab list
- **Concreteness:** PASS. CMS CLIA Provider of Services file named.
- **Relevance:** FAIL. Same reason as ISO 17025 (idea 4): pure good-actor fast-lane with no exclusionary effect on any of the seven mapped branches. None of the branches pretend to be CLIA labs.
- **Verdict:** DROP. Reason: no exclusionary effect on any mapped branch.

### Idea 16 — ORCID + ROR + OpenAlex composite real-PI check
- **Concreteness:** PASS. Three specific public APIs with thresholds.
- **Relevance:** PASS. Story 2 (shell-company) explicitly mentions seeding bioRxiv preprints; the N≥3-with-recent-activity-and-ROR-affiliation gate genuinely raises the bar above what the branch describes (one or two preprints with no ROR-resolvable institutional affiliation).
- **Verdict:** PASS.

### Idea 17 — Cross-provider fraud-signal sharing via Sift / Sardine / Alloy
- **Concreteness:** PASS. Three named vendors. Best-guess that the provider already runs one is reasonable.
- **Relevance:** PASS. The device/IP/email reputation network plausibly catches multiple-shell reuse by the same operator (gradual-legitimacy-accumulation, shell-company), and device-change-during-takeover plausibly catches account-hijack and credential-compromise.
- **Verdict:** PASS.

### Idea 18 — Institutional shipping-address corroboration as fast-lane prerequisite (incubator address exclusion)
- **Concreteness:** PASS. ROR API + a provider-maintained list of named incubators (BioLabs, LabCentral, Genspace, JLABS).
- **Relevance:** PASS. Story 2 (shell-company) explicitly names "rents either a virtual office or a co-working lab bench in a biotech hub (Boston, San Diego, RTP, Bay Area)," and story 3 (biotech-incubator-tenant) is named for this exact pattern. Excluding incubator addresses from fast-lane (not from the order itself) is a precise measure-17-shaped intervention.
- **Verdict:** PASS.

---

## Gaps (uncovered or under-covered attacker classes)

1. **Account-hijack and credential-compromise** are addressed only by ideas 7, 11, and 17. Coverage feels thin given that these branches are the dominant cheapest path under the document+selfie baseline. Worth asking in v2: is there a public breach-data / infostealer-log source the provider could subscribe to (Have I Been Pwned Enterprise, SpyCloud, Constella) and use as a fast-lane suspension trigger? That would be a concrete v2 addition.

2. **Dormant-account-takeover via institutional IT admin** is addressed by ideas 7, 8, 11, 12. The institutional-directory cross-check ("is this researcher still here?") that the attacker excerpt names as the single defensive enhancement that "catches the branch cleanly" is not in the file. v2 should add a specific idea: institutional directory / SSO / Grouper / InCommon directory cross-check at fast-lane evaluation time, against the customer's stated PI. This is a measure-17 SOP because it conditions pre-approval on the PI still being affiliated.

3. **The "purchased going-concern with live provider accounts" sub-variant of shell-company** ($150–300K acquisition of an existing biotech with live provider accounts and order history) is not specifically addressed. None of the ideas would detect a quiet ownership change at a long-tenured customer. v2 should add a specific check: monitoring for changes in registered agent, ultimate beneficial owner (OpenCorporates / FinCEN BOI registry [now suspended for many entities; flag this]), or principal officer at customer entities, with a re-verification trigger on detected change.

---

STOP: no
