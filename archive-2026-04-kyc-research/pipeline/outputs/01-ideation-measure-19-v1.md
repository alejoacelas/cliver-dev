# Stage 1 Ideation — Measure 19 (individual-legitimacy-soc) — v1

Measure: Confirm that the individual customer is a legitimate user of an SOC, via grants, publication history, prior affiliations, biosafety committee approval; and that they are affiliated with a life-sciences institution.

Modes: D=Direct, A=Attacker-driven, H=Hardening (n/a v1).

---

## 1. ORCID record lookup (public API)
- **Modes:** D, A
- **Summary:** Query the ORCID public API for the customer-supplied ORCID iD (or name+affiliation search). Pull employments, educations, works, fundings, and — critically — the `source` / verification status of each affiliation (institution-asserted vs self-asserted). Score: institution-verified employment at a life-sciences unit + works in a life-sciences field + works dated within last 3y → green; self-asserted-only with no verified employment → yellow.
- **attacker_stories_addressed:** visiting-researcher (catches M4 Option 2 self-asserted ORCID — only if we *require* institution-verified affiliation, since ~2% of records have one), unrelated-dept-student (department field on verified employment may not be wet-lab), it-persona-manufacturing, foreign-institution, dormant-domain
- **external_dependencies:** ORCID Public API (free, OAuth2 public client), member API for richer data
- **manual_review_handoff:** Reviewer sees ORCID record summary card with verification badges; decides whether self-asserted-only record + thin works list is acceptable for the requested SOC.
- **flags_thrown:** (a) no ORCID supplied → request one or escalate; (b) ORCID present but employment self-asserted only → manual review; (c) zero works in life-sciences field → manual review; (d) most recent work >5y old → manual review.
- **failure_modes_requiring_review:** ORCID record private/limited; ambiguous name match when no iD supplied; API 5xx; record exists but is empty (common for early-career).
- **record_left:** Stored JSON snapshot of the ORCID record at order time + the verification-badge audit string.

## 2. OpenAlex author profile lookup
- **Modes:** D, A
- **Summary:** Resolve the customer to an OpenAlex `Author` entity (by ORCID iD if present, else name + last-known institution ROR). Pull `works_count`, `cited_by_count`, `last_known_institution`, `concepts` (life-sciences topical match), and the works list. Cross-check `last_known_institution.ror` against the affiliation the customer claims on the order form.
- **attacker_stories_addressed:** visiting-researcher (M4 Option 1 piggyback — OpenAlex shows whether the *individual* has any first-author works at the host, not just the host's footprint), unrelated-dept-student (concepts list reveals topical mismatch — physics concepts ≠ wet-lab), it-persona-manufacturing, dormant-account-takeover (last work date), foreign-institution
- **external_dependencies:** OpenAlex REST API (free, no key required, polite-pool email)
- **manual_review_handoff:** Reviewer sees author card: works count, top concepts, last institution, gap-since-last-publication. Decides on topical fit vs requested SOC taxa.
- **flags_thrown:** (a) zero OpenAlex author match → review; (b) author found but top concepts have no life-sciences overlap → review; (c) `last_known_institution.ror` ≠ claimed affiliation → review; (d) gap >3y since last work → review for currency.
- **failure_modes_requiring_review:** Name collisions / poor disambiguation; common-name false-merges; author exists but ORCID-less so confidence low.
- **record_left:** OpenAlex author ID + JSON snapshot.

## 3. PubMed / NCBI E-utilities author search
- **Modes:** D, A
- **Summary:** ESearch PubMed for `Author[au]` filtered by claimed affiliation (`AD` field) and date window. Use ELink to fetch MeSH terms and check for life-sciences relevance. Specifically intended to surface biomedical publication footprint and detect "wrong-domain author" cases the OpenAlex concept tagger may miss.
- **attacker_stories_addressed:** unrelated-dept-student (PubMed coverage of biomedical literature is the canonical filter for "actually does wet-lab work"), visiting-researcher, lab-manager-voucher (lab managers often appear in author lists despite no first-author papers), foreign-institution
- **external_dependencies:** NCBI E-utilities (free, API key recommended for >3 req/s)
- **manual_review_handoff:** Reviewer sees PubMed result list; decides whether MeSH coverage matches the SOC taxa.
- **flags_thrown:** (a) zero PubMed hits with claimed affiliation → review; (b) hits exist but MeSH terms unrelated to life sciences → review; (c) most recent PubMed publication >5y old → currency review.
- **failure_modes_requiring_review:** Affiliation strings inconsistent across papers; transliteration variants; common surnames.
- **record_left:** PMID list + ESearch query string + result snapshot.

## 4. Scopus Author ID lookup (Elsevier API)
- **Modes:** D
- **Summary:** Resolve the customer to a Scopus Author ID via the Author Search API; pull h-index, document count, subject areas, affiliation history. Use as a second disambiguation source to confirm OpenAlex/PubMed results.
- **attacker_stories_addressed:** unrelated-dept-student, visiting-researcher, foreign-institution (Scopus has stronger non-US coverage than PubMed for some regions)
- **external_dependencies:** Elsevier Scopus APIs (institutional/paid subscription, API key)
- **manual_review_handoff:** Disambiguation tiebreaker only — if Scopus says different subject areas than OpenAlex, escalate.
- **flags_thrown:** Conflicts between Scopus subject areas and claimed research domain.
- **failure_modes_requiring_review:** Quota exhaustion; auth errors; missing record for early-career researchers.
- **record_left:** Scopus Author ID + retrieved JSON.

## 5. Google Scholar profile presence check [best guess]
- **Modes:** D
- **Summary:** Check whether the customer has a public Google Scholar profile at the claimed institution; pull h-index and topical labels. Note: no public API; would need a scraper (SerpAPI or scholarly library) — formally ToS-restricted.
- **attacker_stories_addressed:** visiting-researcher, unrelated-dept-student
- **external_dependencies:** SerpAPI Google Scholar endpoint [best guess], or `scholarly` python lib (unstable)
- **manual_review_handoff:** Soft signal only — feeds reviewer's overall impression.
- **flags_thrown:** Profile exists at a different institution than claimed.
- **failure_modes_requiring_review:** Captcha/blocks; no profile (population-normal for many legit researchers).
- **record_left:** Profile URL screenshot.

## 6. NIH RePORTER PI grant search
- **Modes:** D, A
- **Summary:** Query NIH RePORTER (`https://api.reporter.nih.gov/`) for grants where the customer is listed as PI, co-PI, or "Other PI" within the last 5 years. Active R01/R21/U01/etc. with a life-sciences activity code is a strong positive signal directly aligned with the measure ("relevant grants awarded to customer").
- **attacker_stories_addressed:** unrelated-dept-student (no NIH PI record → not a wet-lab PI), visiting-researcher (true visiting scholar likely lacks NIH PI history), it-persona-manufacturing (manufactured personas cannot insert themselves into NIH RePORTER), lab-manager-voucher (lab manager will not be PI — surfaces role/title mismatch), bulk-order-noise-cover (legitimate PI passes; signal validates the cover)
- **external_dependencies:** NIH RePORTER public API (free, no auth)
- **manual_review_handoff:** Reviewer sees list of grants with role, project number, dates, institution. Decides if grant scope justifies the SOC.
- **flags_thrown:** (a) no PI/co-PI grant in last 5y on a US-based applicant claiming PI status → review; (b) grant institution ≠ claimed affiliation → review; (c) only role is "Other Significant Contributor" → soft review.
- **failure_modes_requiring_review:** Common name collisions; non-US researchers (no coverage); industry researchers (no coverage).
- **record_left:** RePORTER project numbers + JSON snapshot.

## 7. NSF Award Search PI lookup
- **Modes:** D, A
- **Summary:** Query NSF Award Search API (`https://api.nsf.gov/services/v1/awards.json`) for awards with the customer as PI/co-PI. Filter for life-sciences directorate (BIO) or relevant cross-cutting programs (MCB, IOS, DEB, etc.). Complements NIH coverage for non-medical biology and US academia.
- **attacker_stories_addressed:** unrelated-dept-student, visiting-researcher, it-persona-manufacturing
- **external_dependencies:** NSF Award Search public API (free, no auth)
- **manual_review_handoff:** As above; reviewer assesses program fit.
- **flags_thrown:** No NSF PI record where one would be expected (e.g., academic ecologist).
- **failure_modes_requiring_review:** Name collisions; non-US researchers.
- **record_left:** NSF award IDs.

## 8. Wellcome Trust grants directory lookup
- **Modes:** D, A
- **Summary:** Search the Wellcome Trust grants database for the customer as PI/co-applicant. Provides UK + global biomedical grant coverage to complement NIH/NSF.
- **attacker_stories_addressed:** foreign-institution, visiting-researcher, unrelated-dept-student
- **external_dependencies:** Wellcome Trust grants directory (web search; bulk download / 360Giving feed [best guess])
- **manual_review_handoff:** Reviewer assesses scope and recency.
- **flags_thrown:** Customer claims UK biomedical PI but absent from Wellcome.
- **failure_modes_requiring_review:** Limited coverage outside Wellcome's portfolio.
- **record_left:** Grant IDs.

## 9. ERC grant search (CORDIS)
- **Modes:** D, A
- **Summary:** Query CORDIS (`https://cordis.europa.eu/`) for ERC / Horizon Europe / FP7 awards where the customer is a PI or participant. Covers EU researchers; complements US-only NIH/NSF.
- **attacker_stories_addressed:** foreign-institution, visiting-researcher
- **external_dependencies:** CORDIS public API / open data portal
- **manual_review_handoff:** Reviewer evaluates program fit.
- **flags_thrown:** Customer claims EU PI but absent from CORDIS.
- **failure_modes_requiring_review:** Coverage limited to EU-funded work; nationals funded by national agencies missing.
- **record_left:** CORDIS project IDs.

## 10. ClinicalTrials.gov investigator lookup
- **Modes:** D, A
- **Summary:** Search ClinicalTrials.gov via its v2 API for registered trials where the customer is listed as Principal Investigator, Sub-Investigator, or Study Director. A registered trial PI is strong evidence of life-sciences legitimacy with a public paper trail.
- **attacker_stories_addressed:** unrelated-dept-student (no trials), visiting-researcher, it-persona-manufacturing (cannot easily insert into CT.gov), insider-recruitment (real insider passes)
- **external_dependencies:** ClinicalTrials.gov v2 REST API (free, no auth)
- **manual_review_handoff:** Reviewer sees trials list and decides if relevant to SOC taxa.
- **flags_thrown:** Customer claims clinical investigator role but no NCT records.
- **failure_modes_requiring_review:** Bench scientists won't have trials (population-normal); name collisions.
- **record_left:** NCT IDs.

## 11. FDA principal investigator / inspection database lookup [best guess]
- **Modes:** D
- **Summary:** Cross-check customer name against FDA Bioresearch Monitoring (BIMO) inspection database / FDA Form 1572 PI listings to confirm regulated research history. Likely scrape-based since no clean public API.
- **attacker_stories_addressed:** unrelated-dept-student, it-persona-manufacturing
- **external_dependencies:** openFDA APIs [best guess for BIMO endpoint]; FDA datasets
- **manual_review_handoff:** Soft positive signal only; absence is not actionable.
- **flags_thrown:** (positive only — absence is uninformative for most researchers).
- **failure_modes_requiring_review:** Coverage limited to FDA-regulated work.
- **record_left:** Match record.

## 12. Institutional Biosafety Committee (IBC) roster check
- **Modes:** D, A
- **Summary:** Many US institutions publish their IBC membership / approved-protocol lists (NIH OBA registers IBCs but doesn't publish member lists; institutional sites often do). For customers ordering BSL-2+/SOC-relevant material, check whether the customer is named on an approved IBC protocol at the claimed institution. Where no public list exists, request a copy of the IBC approval letter as out-of-band evidence.
- **attacker_stories_addressed:** visiting-researcher (visiting scholars rarely on IBC protocols), unrelated-dept-student (non-wet-lab depts are not on biosafety protocols — this is the strongest catch for Bypass A/B), it-persona-manufacturing, lab-manager-voucher (lab managers ARE often on IBC protocols — passes appropriately), insider-recruitment, dormant-domain
- **external_dependencies:** NIH OBA IBC registry (institutional list only); per-institution IBC web pages; manual upload channel for IBC approval letter
- **manual_review_handoff:** Reviewer compares IBC protocol scope vs SOC order; decides whether the protocol covers the requested taxa.
- **flags_thrown:** (a) no IBC protocol on file for SOC order → require approval letter; (b) protocol scope doesn't match SOC taxa → review; (c) protocol expired → review.
- **failure_modes_requiring_review:** Most institutions do NOT publish member rosters publicly; requires customer self-upload, which can be forged → tie to verified institutional contact.
- **record_left:** Stored IBC approval letter PDF + protocol number; or absence note.

## 13. Institutional faculty/staff page scrape + cross-match
- **Modes:** D, A
- **Summary:** Fetch the customer's purported institutional profile page (faculty directory, lab website) at the claimed institution and verify (a) name match, (b) title contains research role, (c) department is life-sciences, (d) page links to research outputs. Use a structured scraper with allow-listed institution domains derived from ROR.
- **attacker_stories_addressed:** unrelated-dept-student (department mismatch surfaced), visiting-researcher (visiting scholars are often listed but with explicit "Visiting" title — surfaces context for reviewer), it-persona-manufacturing (would need attacker to populate the directory page — hard at most universities), dormant-domain (defunct institution → no live faculty page), foreign-institution (works only where the foreign institution publishes a directory)
- **external_dependencies:** ROR for institution → domain mapping; HTTP fetcher; HTML parser; reviewer
- **manual_review_handoff:** Reviewer sees screenshot of the faculty page + extracted fields; decides match.
- **flags_thrown:** (a) no faculty page found at claimed institution → review; (b) page found but title is non-research (admin, IT, undergrad) → review; (c) page in dept that's not life-sciences → review.
- **failure_modes_requiring_review:** Many legit researchers have no individual page (especially industry, junior trainees) — population-normal thinness.
- **record_left:** Page snapshot HTML + extracted fields.

## 14. ResearchGate profile lookup [best guess]
- **Modes:** D
- **Summary:** Search ResearchGate for a profile under the customer's name + claimed institution; check publications, departments, RG Score. Soft signal — useful tiebreaker. No public API; scrape-only and ToS-hostile.
- **attacker_stories_addressed:** visiting-researcher, unrelated-dept-student, foreign-institution
- **external_dependencies:** Scraper (ToS-restricted) [best guess]
- **manual_review_handoff:** Soft signal; reviewer impression only.
- **flags_thrown:** Profile shows different institution or non-life-sciences department.
- **failure_modes_requiring_review:** Many researchers are not on RG; ToS blockage.
- **record_left:** Screenshot if accessible.

## 15. LinkedIn employment history check
- **Modes:** D, A
- **Summary:** Verify the customer's LinkedIn shows current employment at the claimed institution in a research-relevant role. Use a vendor like Proxycurl, PDL (People Data Labs), or LinkedIn Talent Solutions API. Check tenure (currency for dormant-account-takeover) and role (research vs admin/IT).
- **attacker_stories_addressed:** dormant-account-takeover (LinkedIn shows the original holder left → currency mismatch), it-persona-manufacturing (fabricated persona unlikely to have multi-year LinkedIn history with connections), lab-manager-voucher (passes — real role), insider-recruitment (passes), foreign-institution, account-hijack (timing mismatch may surface)
- **external_dependencies:** Proxycurl / People Data Labs / similar enrichment vendor (paid)
- **manual_review_handoff:** Reviewer sees employment timeline + role; decides currency and role-fit.
- **flags_thrown:** (a) no LinkedIn match → soft review; (b) LinkedIn shows different employer than claimed → review; (c) profile created <6mo ago with no connections → fabrication suspicion; (d) most recent role at claimed institution ended → currency review (catches dormant-account-takeover).
- **failure_modes_requiring_review:** Many legit researchers (esp. international, senior academics) have minimal LinkedIn presence; fakes are now LLM-feasible.
- **record_left:** Vendor JSON snapshot + LinkedIn URL.

## 16. GA4GH Researcher Passport / RAS verification
- **Modes:** D, A
- **Summary:** Require customer to authenticate with a GA4GH Passport-issuing broker (e.g., NIH RAS, ELIXIR AAI, eduGAIN-bridged broker). The passport carries `ResearcherStatus`, `AffiliationAndRole`, `AcceptedTermsAndPolicies`, and `ControlledAccessGrants` claims signed by an authoritative source. A live `faculty@<institution>` or `bona fide researcher` claim from a recognized visa issuer is the strongest cryptographic version of "individual is a legitimate researcher at this institution."
- **attacker_stories_addressed:** visiting-researcher (passport captures exact appointment type; visiting-scholar status is visible to reviewer), unrelated-dept-student (passport carries department), it-persona-manufacturing (requires the attacker to enroll the persona into the passport broker, which itself requires institutional IT cooperation), dormant-account-takeover (passport requires fresh login → catches stale credentials), account-hijack (live federated SSO defeats stored credentials), foreign-institution (eduGAIN coverage extends here), dormant-domain (eduGAIN won't issue for dead institution)
- **external_dependencies:** GA4GH Passport broker(s); OAuth2/OIDC client integration; trust framework (which visa issuers are accepted)
- **manual_review_handoff:** Reviewer reviews passport visa contents; decides whether `AffiliationAndRole` and `ResearcherStatus` together justify SOC.
- **flags_thrown:** (a) customer cannot present a passport → fall back to other checks; (b) passport visa issuer not on accepted-issuer list → review; (c) `ResearcherStatus` absent or not "bona fide researcher" → review; (d) `AffiliationAndRole` shows role like `student`, `member`, `affiliate` rather than `faculty`/`staff` → review against requested SOC.
- **failure_modes_requiring_review:** Many institutions don't yet issue passports; coverage gap is large; passport ecosystem still maturing.
- **record_left:** Signed passport JWT + claims dump.

## 17. PubMed Author disambiguation via affiliation+ORCID join
- **Modes:** A
- **Summary:** Specifically address Bypass D (transliteration / name-collision) of unrelated-dept-student: rather than searching PubMed by name alone, require ORCID iD on the order, then ESearch PubMed by `ORCID[au]` to get a name-collision-immune publication count, then cross-validate with the claimed affiliation in `AD`. If ORCID isn't supplied, do a name + AD search but flag low-confidence.
- **attacker_stories_addressed:** unrelated-dept-student (specifically the Bypass D collision case), visiting-researcher, foreign-institution
- **external_dependencies:** NCBI E-utilities; ORCID
- **manual_review_handoff:** Reviewer sees disambiguation confidence band + matched papers.
- **flags_thrown:** Name match without ORCID match → low-confidence flag.
- **failure_modes_requiring_review:** ORCID not present in PubMed records before ~2015.
- **record_left:** Disambiguation report.

## 18. Currency-of-affiliation re-verification (anti-dormant)
- **Modes:** A
- **Summary:** SOP: for any returning customer whose last order is >6 months old, re-run the institutional-email bounce check + ORCID employment current-end-date check + LinkedIn current-employer check. Specifically targets dormant-account-takeover and account-hijack. The technical primitives are bounce probe + ORCID API + LinkedIn vendor (idea 15), bundled into a "currency check" gate.
- **attacker_stories_addressed:** dormant-account-takeover, account-hijack, dormant-domain
- **external_dependencies:** SMTP probe; ORCID API; LinkedIn vendor; SOP
- **manual_review_handoff:** Reviewer compares prior affiliation snapshot vs current; decides whether to require fresh ID re-verification.
- **flags_thrown:** (a) ORCID `employment.end-date` now populated → review; (b) email bounce → review; (c) LinkedIn shows new employer → review.
- **failure_modes_requiring_review:** Vendor signals lag reality.
- **record_left:** Diff between prior and current snapshot.

## 19. Role-vs-order-scope check (anti-insider)
- **Modes:** A
- **Summary:** SOP: at order time, classify the customer's role (PI / postdoc / grad student / lab manager / technician / visiting / other) from the strongest legitimacy source available (ORCID employment role, LinkedIn title, institutional faculty page title). Cross with order: if role is `lab manager`/`technician` AND order is large/SOC, route to a second reviewer for "is this within the lab's scope of work" review (calls measure-20-style voucher in the worst case). Specifically targets lab-manager-voucher and bulk-order-noise-cover.
- **attacker_stories_addressed:** lab-manager-voucher, bulk-order-noise-cover, insider-recruitment
- **external_dependencies:** Role-classification rule table; reviewer
- **manual_review_handoff:** Second-reviewer queue with role + order summary.
- **flags_thrown:** Lab manager / technician + first SOC order in 90 days → review.
- **failure_modes_requiring_review:** Role taxonomy is institution-dependent; titles are noisy.
- **record_left:** Role classification + reviewer note.

## 20. ORCID `employment.organization.disambiguated-organization` ROR cross-check
- **Modes:** A
- **Summary:** Specifically catch Bypass A (reflected legitimacy from home institution): check that ORCID employment organization's ROR matches the claimed affiliation's ROR, AND that the `department-name` field maps to a life-sciences department. If department is missing or non-life-sciences (philosophy, comp-sci, business), flag — even though the institution itself is a research powerhouse.
- **attacker_stories_addressed:** unrelated-dept-student (Bypass A specifically), visiting-researcher (department=Visiting Scholar vs core dept distinction)
- **external_dependencies:** ORCID API; ROR; allow-list of life-sciences department keywords
- **manual_review_handoff:** Reviewer sees department string + classification confidence.
- **flags_thrown:** Department non-life-sciences or missing → review.
- **failure_modes_requiring_review:** Many ORCID employments lack department-name; many real wet-lab researchers are in eclectic departments (BME, ChemE, EEB).
- **record_left:** ORCID department string + classification.

---

## Coverage notes
- **Account-hijack** is only addressed by passport/SSO (idea 16) and currency re-verification (idea 18). It is fundamentally outside individual-legitimacy review at the data layer.
- **Insider-recruitment** is only addressed by role-vs-scope (idea 19) — and weakly. M19 cannot solve this; it should fall through to M20 (voucher).
- **Bulk-order-noise-cover** is only addressed by role-vs-scope (idea 19), and only by anomaly detection on order content (out of M19 scope).

## Dropped
(none — first iteration)
