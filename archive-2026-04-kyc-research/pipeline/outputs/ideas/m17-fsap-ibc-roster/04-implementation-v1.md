# m17-fsap-ibc-roster — Implementation v1

- **measure:** M17 (pre-approval-list)
- **name:** FSAP + NIH OSP IBC roster ingestion
- **modes:** D
- **summary:** Pre-approve customers whose home institution is on (a) the CDC/APHIS Federal Select Agent Program (FSAP) registered-entities list, OR (b) the NIH OSP IBC-RMS roster of institutions with an active Institutional Biosafety Committee. Customers with both an active IBC and a registered FSAP entity covering their work area are treated as known-good for SOC orders. Closes the no-IBC-approval and unauthorized-select-agent attacker stories — but only weakly, because the FSAP entity list is **not publicly disclosed** at the level of individual entities (security-sensitive program), and the IBC roster is institution-level, not researcher-level.

## external_dependencies

- **Federal Select Agent Program (FSAP)** — operated jointly by CDC/HHS DRSC and USDA/APHIS DASAT ([selectagents.gov](https://www.selectagents.gov/index.htm)). 230 entities were registered in 2024 ([2024 FSAP Annual Report PDF](https://www.selectagents.gov/resources/publications/docs/2024-FSAP-Annual-Report_508.pdf)). The eFSAP system maintains a national database with names, locations, BSAT covered, and individuals with access ([eFSAP — what is it](https://www.selectagents.gov/efsap/whatis.htm)) — but this database is **not publicly accessible**. Public disclosure is limited to aggregate statistics in the annual report.
- **NIH OSP IBC Registration Management System (IBC-RMS)** ([ibc-rms.od.nih.gov](https://ibc-rms.od.nih.gov/)). As of June 1, 2025, NIH OSP publicly posts the rosters of all active and registered IBCs, including the IBC Chair, Biological Safety Officer, and IBC Contact ([NIH OSP — NIH Strengthens Transparency Measures for IBCs](https://osp.od.nih.gov/nih-strengthens-transparency-measures-for-institutional-biosafety-committees/), [CITI Program — NIH Reinforces Transparency](https://about.citiprogram.org/blog/nih-reinforces-transparency-in-biosafety-oversight-with-new-ibc-requirements/), [NIH Guide notice NOT-OD-25-082](https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-082.html)).
- **Institutional name normalization layer** (mapping customer organization strings to canonical institution names; ROR is the standard).

## endpoint_details

### FSAP
- **Public URL:** `https://www.selectagents.gov`
- **Public data:** annual report PDFs (aggregate statistics only).
- **Per-entity registration list:** **NOT publicly available.** [searched for: "FSAP registered entities list public download", "selectagents.gov entity directory API", "eFSAP public access"; no public list located.] FSAP entity disclosure has historically been resisted on security grounds. A FOIA request might surface partial information but would not yield a maintainable feed.
- **Auth model:** N/A (no public API).
- **Pricing:** N/A.
- **Workaround:** the provider can ASK the customer to attest in writing that their institution is FSAP-registered and to provide their Responsible Official's name + contact, then verify by directly emailing the RO at the institutional domain. This is a manual SOP, not an automated check.

### NIH OSP IBC-RMS
- **URL:** `https://ibc-rms.od.nih.gov/`
- **Public data:** institutional IBC rosters with Chair, BSO, IBC Contact names and contact info ([NIH OSP transparency announcement](https://osp.od.nih.gov/nih-strengthens-transparency-measures-for-institutional-biosafety-committees/)).
- **Auth model:** Public web interface; no documented API as of mid-2025. [unknown — searched for: "IBC-RMS API public", "NIH IBC-RMS bulk download data feed", "ibc-rms.od.nih.gov export"]. Likely scraped via the search interface or via a periodic CSV/PDF export if NIH publishes one.
- **Pricing:** $0.
- **Coverage:** All institutions registered with NIH OSP for recombinant / synthetic nucleic acid research per the NIH Guidelines. Covers most US R1 / R2 universities and many smaller institutions; does NOT cover purely commercial biotechs that have not voluntarily registered, foreign institutions, or institutions doing only non-NIH-funded work.

### Public FSAP annual reports (the only feed available)
- **2024 Annual Report PDF:** [selectagents.gov/resources/publications/docs/2024-FSAP-Annual-Report_508.pdf](https://www.selectagents.gov/resources/publications/docs/2024-FSAP-Annual-Report_508.pdf). Aggregate counts only.

## fields_returned

### From IBC-RMS (per institution roster)
- `institution_name`
- `ibc_chair_name`, `ibc_chair_email`
- `bso_name` (Biological Safety Officer), `bso_email`
- `ibc_contact_name`, `ibc_contact_email`
- `registration_date`, `last_updated`

### From FSAP (per the annual report — aggregate only)
- Total registered entities (national count)
- Distribution by type (academic, government, commercial)
- Compliance statistics

### Internal (per pre-approval check)
- `customer_institution`, `matched_ibc_record`, `matched_fsap_attestation`, `match_confidence`, `decided_at`

## marginal_cost_per_check

- **IBC-RMS:** $0 (public data).
- **FSAP:** $0 in API costs but **non-trivial human cost** because verification is manual: the SOP requires emailing the RO and waiting for a reply.
- **Per-customer one-time onboarding check:** [best guess: $5–$25 in human time per FSAP attestation verification; ~$0 for an IBC-only check.]
- **Setup cost:** Engineering for the IBC-RMS scraper / ingest pipeline (since there's no documented API, this is screen-scraping or manual CSV download). [best guess: 2–4 engineer-weeks for the ingest, ongoing maintenance against UI changes.]

## manual_review_handoff

SOP for the pre-approval check:

1. **Customer onboarding** asks: institution name, role, supervising PI, IBC registration claim, FSAP registration claim (if relevant), Biological Safety Officer name and contact.
2. **Auto-match** customer institution to IBC-RMS roster. If matched, record the IBC record ID and the BSO contact.
3. **Confirm with the institution.** Send a short verification email to the BSO listed in IBC-RMS — "Your institution's IBC roster lists you as the BSO. We are onboarding [Customer Name] from [Department] as a customer for synthetic DNA orders. Can you confirm this person is affiliated with your institution and operates within your IBC's purview?" Wait for reply.
4. **For FSAP-claimed customers:** the customer provides their RO's name and institutional email; provider emails the RO directly to confirm. (No automated check possible — the FSAP entity list is not public.)
5. **On positive confirmation:** mark customer as `pre_approved`, store the confirmation email and IBC record ID.
6. **On no reply within 14 days:** route to reviewer; reviewer may proceed with measures 18 (institution-legitimacy-soc) and 19 (individual-legitimacy) instead.
7. **On negative confirmation** (BSO says "no, this person is not affiliated"): reject pre-approval and escalate.

## flags_thrown

- `fsap_not_listed` — customer claims FSAP registration but no RO confirmation received. **Action:** human review.
- `ibc_not_listed` — customer's institution is not in IBC-RMS. **Action:** does not auto-reject; routes to alternative legitimacy check (m18, m19).
- `bso_confirmation_negative` — BSO replied that the customer is not legitimate. **Action:** reject + retain evidence.
- `bso_confirmation_pending` — outreach sent, no reply, > 14 days. **Action:** fall through to alternate verification.
- `fsap_attestation_unverifiable` — provider has no automated way to confirm; manual SOP only. **Action:** escalate.

## failure_modes_requiring_review

- **FSAP entity list is not public** — the central limitation. The check degrades to a manual attestation-and-callback SOP. Structural, not fixable inside this idea.
- **IBC-RMS has no documented API** — ingest must be a scraper, fragile to UI changes.
- **Institution name mismatch** — "MIT" vs "Massachusetts Institute of Technology" vs "Mass. Inst. of Technology" — needs ROR-style normalization.
- **BSO email bounces or BSO has departed** — IBC-RMS data freshness varies.
- **Researcher operates outside their IBC's protocols** — IBC oversight is at the protocol level, not the individual order level. The IBC roster check confirms institutional governance exists, not that this specific order is covered by an approved protocol.
- **Foreign institutions** — entirely uncovered by FSAP / IBC; FSAP is US-only, IBC is US-NIH-funded primarily.
- **Commercial biotechs** — many do not have an IBC and are not FSAP-registered for any agent they work with; the check provides no signal for them.

## false_positive_qualitative

- **Researchers at IBC-registered institutions doing work outside the IBC's scope** (e.g., purely chemical synthesis) — the check passes them as pre-approved without validating the actual order is in scope.
- **Adjunct / visiting researchers** at IBC-registered institutions whose status is ambiguous — BSO may not recognize them.
- **Core facility staff** placing orders on behalf of multiple PIs — BSO confirms the staff exist but cannot vouch for every downstream PI.

## record_left

- **IBC-RMS snapshot** stored at the time of pre-approval (institution name, BSO name, BSO email, snapshot date).
- **BSO confirmation email thread** retained verbatim — load-bearing audit artifact, since this is the actual human-attested confirmation that downstream investigators can re-verify.
- **For FSAP attestations:** the RO email confirmation thread, stored similarly.
- **Cross-link** to all SOC orders the customer subsequently places under this pre-approval.

## attacker stories addressed (cross-ref)

- **gradual-legitimacy-accumulation:** weakly addressed — a fake institution will not be in IBC-RMS; the BSO callback adds a human check that's hard to fake. But the central branch builds a *real* small biotech, which would simply not have an IBC at all and would route through the alternative verification (m18, m19) — defeating the IBC check by going around it.
- **shell-company:** addressed — shell companies generally have no IBC and no FSAP registration, so they fall through to alternate verification with a `ibc_not_listed` flag that should weight downstream review.
- **biotech-incubator-tenant:** weakly addressed — incubators sometimes have a shared IBC but the tenant LLC is often not formally on the roster.
- **bulk-order-noise-cover:** **addressed** — this attacker is at a real R1 university which is on the IBC roster, but the BSO callback specifically asks "is this person operating within your IBC's purview" — a competent BSO catches an unauthorized SOC order. Effectiveness depends on BSO diligence.
- **dormant-account-takeover:** addressed when the dormant account's institutional affiliation can be re-verified against current IBC-RMS data, which would surface "this researcher has departed" via the BSO callback.
- **account-hijack / credential-compromise:** weakly addressed — the legitimate PI is real and on the IBC, so the check passes; provides no signal against attackers operating from inside legitimate accounts.
