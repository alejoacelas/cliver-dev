# Stage 1 Ideation — Measure 20: Voucher-legitimacy (SOC) — v1

Measure 20 requires the provider, for each SOC order, to (a) collect a structured voucher from a referent, (b) confirm the referent is institutionally legitimate, (c) verify the voucher's identity with STRONG evidence (NIST 800-63 IAL2 / GPG45 score-2-equivalent), and (d) check the structural fields: relationship length ≥1yr, referent not junior to customer, SOC scope alignment, written necessity assessment, and a trust score ≥6.

The attacker-mapping file lists 19 stories. The dominant attack patterns are: (1) rubber-stamping by a real long-tenured voucher, (2) self-vouching (same person plays both roles, or accomplice in same shell), (3) credential / session compromise of the voucher, (4) recruited voucher (insider, gig-platform, co-tenant), (5) cross-org voucher manufactured via second shell or foreign asymmetry, (6) gradual cultivation of a voucher relationship.

Ideas span: voucher-identity verification (similar IDV vendor stack as measure 14), voucher institutional legitimacy (SOPs and registries), seniority and relationship-length verification (scientometric data), independence enforcement (graph checks), workflow controls against rubber-stamping, and STRONG-evidence SOPs.

---

## 1. Jumio Identity Verification for voucher identity (STRONG-evidence IDV)

- **modes:** direct, attacker-driven
- **summary:** Voucher (the referent) is sent a one-time identity-verification link before their voucher is accepted. Jumio's Netverify performs document capture (passport / national ID / driver's license), MRZ + chip parsing where available, NFC read on eMRTD documents, and a liveness-controlled selfie matched to the document portrait. This satisfies NIST 800-63 IAL2 / GPG45 STRONG evidence requirement enumerated in the measure ("confirm the identity of the voucher with STRONG evidence"). The voucher cannot be accepted from an anonymous or session-only identity.
- **attacker_stories_addressed:** account-hijack, credential-compromise, inbox-compromise, dormant-account-takeover, it-persona-manufacturing, shell-nonprofit (gig-platform recruited voucher), foreign-institution
- **external_dependencies:** Jumio Netverify API (vendor-gated), human reviewer for fallback
- **manual_review_handoff:** Jumio "rejected" or "needs review" cases route to compliance analyst with the captured document image, liveness video frame, and Jumio confidence breakdown. Playbook: analyst either re-requests capture, escalates to live-video SOP (idea 6), or denies the voucher.
- **flags_thrown:** doc-mismatch → reject; liveness fail → re-request; name mismatch with voucher form → analyst review; high-risk country issuance → SOC-scope review.
- **failure_modes_requiring_review:** API outage → fallback to live-video SOP; voucher in jurisdiction Jumio doesn't support → manual passport scan + notary attestation; partial liveness → second attempt then human review.
- **record_left:** Jumio transaction ID, hashed document images, liveness video, signed JSON receipt — all retained against the voucher's record on the SOC order.
- Other fields: `# stage 4`

## 2. Onfido Document + Facial Similarity for voucher identity

- **modes:** direct, attacker-driven
- **summary:** Same use as idea 1, alternate vendor. Onfido's Studio workflow can be configured to require "Document + Facial Similarity Photo + Known Faces Check," which yields IAL2-comparable evidence. Useful as a multi-vendor strategy because Onfido has stronger UK/EU document coverage than Jumio in some segments.
- **attacker_stories_addressed:** account-hijack, credential-compromise, inbox-compromise, it-persona-manufacturing, foreign-institution
- **external_dependencies:** Onfido API (vendor-gated)
- **manual_review_handoff:** "consider" verdicts → analyst review with Onfido report PDF.
- **flags_thrown:** "consider" → review; "clear" → pass; "rejected" → deny.
- **failure_modes_requiring_review:** unsupported jurisdiction → fallback SOP; capture failures → re-attempt limit then human.
- **record_left:** Onfido check ID and report PDF.

## 3. Persona Verifications for voucher identity

- **modes:** direct
- **summary:** Same use as ideas 1–2, alternate vendor. Persona's Inquiry templates support "Government ID + Selfie + Database (US SSN/DL trace)," providing STRONG evidence for US vouchers and a configurable workflow for non-US.
- **attacker_stories_addressed:** account-hijack, credential-compromise, it-persona-manufacturing, dormant-account-takeover
- **external_dependencies:** Persona API (vendor-gated)
- **manual_review_handoff:** Persona "needs review" → analyst with Persona case URL.
- **flags_thrown:** ID-document tamper → deny; selfie-similarity below threshold → re-request; database-trace mismatch → analyst review.
- **failure_modes_requiring_review:** template misconfiguration → SOP review.
- **record_left:** Persona inquiry ID + retained artifacts.

## 4. ORCID-bound voucher identity confirmation

- **modes:** direct, attacker-driven
- **summary:** Voucher must authenticate via ORCID OAuth and assert their ORCID iD as part of the voucher submission. The provider then pulls the public ORCID record (employments, education, peer-review activity, works) via the public ORCID API and matches the voucher's claimed institutional affiliation against the record's `employments` block. ORCID iDs are durable, hard to fabricate at scale, and tie the voucher to a longitudinal scientific identity. Combined with STRONG IDV (idea 1–3), it ties a verified human face to a verified scientific identity.
- **attacker_stories_addressed:** visiting-researcher, foreign-institution, it-persona-manufacturing, gradual-legitimacy-accumulation, shell-nonprofit, cro-framing, dormant-domain
- **external_dependencies:** ORCID public API (free, OAuth), ORCID Member API for the OAuth flow (free for non-commercial / paid membership for commercial)
- **manual_review_handoff:** Empty ORCID record, or no employments block, or employments block doesn't list the claimed institution → analyst inspects record creation date, work history, peer-review badges; decides whether to require additional evidence.
- **flags_thrown:** ORCID created within last 12 months → flag; no employments → flag; institution-employment mismatch → flag; zero works → flag (combine with seniority check, idea 9).
- **failure_modes_requiring_review:** ORCID outage → manual ORCID URL submission + analyst lookup; voucher refuses ORCID auth → escalate to higher-touch SOP.
- **record_left:** ORCID iD, signed OAuth token receipt, snapshot of ORCID employments JSON at time of vouching.

## 5. Institutional-email out-of-band confirmation via SMTP + DKIM-verified reply

- **modes:** direct, attacker-driven
- **summary:** After the voucher submits the form, the provider sends a uniquely-tokenized confirmation email to the voucher's institutional email (the email must be on a domain matching the institution's ROR-listed domains — see measure 18 stack). The voucher must reply or click a link delivered only inside the email; the inbound message is verified via DKIM/SPF/DMARC alignment to the institutional domain. This binds the voucher act to control of an institutional inbox at vouch time, not just at registration time.
- **attacker_stories_addressed:** inbox-compromise (limited — see flags), visiting-researcher, foreign-institution, dormant-domain, it-persona-manufacturing, shell-nonprofit, lab-manager-voucher (forces fresh intent per order)
- **external_dependencies:** internal SMTP infrastructure, ROR for institutional domain list, DMARC validator (OpenDMARC or AWS SES inbound)
- **manual_review_handoff:** DMARC fail / domain-mismatch / open relay → analyst review.
- **flags_thrown:** email domain not in ROR for claimed institution → flag; DMARC fail → flag; reply from forwarded mailbox (Received chain mismatch) → flag; reply outside business hours from institution timezone → soft signal.
- **failure_modes_requiring_review:** institution has no DMARC policy → fallback to live-video SOP; small foreign institutions absent from ROR → manual check.
- **record_left:** raw inbound message with full headers, DMARC verdict, ROR domain match record.

## 6. STRONG-evidence live-video SOP (analyst + credential check)

- **modes:** direct, attacker-driven
- **summary:** A scheduled live video call between the voucher and a provider compliance analyst. The voucher holds up a government photo ID adjacent to their face, recites a one-time challenge code shown on screen (defeats deepfake replay), confirms verbally the customer they are vouching for and the SOC scope, and shares their institutional-directory profile URL on screen. The analyst cross-checks the directory entry, the ID, and the live face. This is the "STRONG evidence" fallback when IDV vendors fail or where the voucher's institution is not covered. Functions also as a deepfake-aware liveness step.
- **attacker_stories_addressed:** lab-manager-voucher (forces conscious affirmation, breaks rubber-stamp), insider-recruitment (raises friction), shell-nonprofit (gig-platform vouchers must do live video), foreign-institution, it-persona-manufacturing, account-hijack, credential-compromise, inbox-compromise, dormant-account-takeover
- **external_dependencies:** Zoom / WebEx / internal video tool with recording; trained compliance analyst; one-time challenge generator
- **manual_review_handoff:** This IS the manual review. Analyst's structured checklist drives the decision (see flags).
- **flags_thrown:** ID name ≠ voucher form name → deny; refusal to recite challenge → deny; institutional-directory URL not loadable / doesn't match → deny; voucher cannot describe customer's research area in own words → flag (rubber-stamp signal); voucher hesitates on SOC scope → flag.
- **failure_modes_requiring_review:** scheduling lag → SOP allows up to 5 business days; tech-failure attempts → reschedule once.
- **record_left:** recorded video (consented), analyst checklist artifact, signed PDF voucher form.

## 7. GA4GH Passport / Visa-based voucher attestation

- **modes:** direct
- **summary:** Voucher authenticates via a GA4GH-Passport-issuing broker (e.g., ELIXIR AAI, eduGAIN/REMS, NIH RAS). The Passport contains Visas asserting `AffiliationAndRole` (e.g., "faculty@institution.edu"), `ResearcherStatus` ("bona fide researcher" per Toronto Statement), and `AcceptedTermsAndPolicies`. These Visas are cryptographically signed by the Passport Visa Issuer, which is typically the home institution's IdP or a trusted broker. The provider verifies signature + claim and accepts the voucher only when `ResearcherStatus` and `AffiliationAndRole` are both present and current.
- **attacker_stories_addressed:** visiting-researcher, foreign-institution (where home IdP is in eduGAIN), gradual-legitimacy-accumulation, it-persona-manufacturing, shell-nonprofit
- **external_dependencies:** GA4GH Passport broker (ELIXIR AAI [best guess as primary], NIH RAS, CRG, EGA), JWKS for Visa signature verification
- **manual_review_handoff:** Passport missing `ResearcherStatus` Visa → analyst escalation; Visa expired → re-request.
- **flags_thrown:** Visa from non-trusted issuer → deny; missing required Visa types → flag; institutional affiliation in Visa ≠ claimed institution → flag.
- **failure_modes_requiring_review:** voucher's institution not in any GA4GH-participating IdP → fall through to ideas 1–3 + 5.
- **record_left:** Passport JWT, parsed Visas, signature verification receipt.

## 8. UK Office for Digital Identities and Attributes (OfDIA) — certified voucher provider

- **modes:** direct
- **summary:** For UK-resident vouchers, route the identity step through an OfDIA-certified Identity Service Provider conformant with the UK Digital Identity and Attributes Trust Framework (DIATF). This provides a government-recognized assurance level (medium / high) that the voucher is who they claim to be, with statutory accountability behind the assurance. Aligns with the measures.md note that the source doc lists OfDIA voucher guidance as a starting point.
- **attacker_stories_addressed:** foreign-institution (UK side), visiting-researcher (UK universities), shell-company (UK shells), shell-nonprofit (UK charities)
- **external_dependencies:** an OfDIA-certified IDSP [best guess: Yoti, OneID, Post Office EasyID]; DIATF compliance documentation
- **manual_review_handoff:** assurance-level-low result → analyst review.
- **flags_thrown:** assurance level below "medium" → reject as STRONG evidence; mismatch with voucher form → flag.
- **failure_modes_requiring_review:** non-UK voucher → fall through to ideas 1–3 + 7.
- **record_left:** IDSP certificate / verification token, retained.

## 9. Seniority verification via OpenAlex publication history

- **modes:** direct, attacker-driven
- **summary:** Measure 20 explicitly requires "referent may not be junior to customer." Operationalize "junior" via scientometric proxies pulled from the OpenAlex authors API. For both customer and voucher, fetch: works count, h-index, years-since-first-publication, most-recent affiliation, and (where available) institutional rank in author position (last author / corresponding author proxy). Voucher must dominate customer on at least two of: years-since-first-pub, works count, last-author count. If customer has no OpenAlex record but voucher does, voucher is by default more senior — but if voucher also has no OpenAlex record, this check fails closed and routes to manual review.
- **attacker_stories_addressed:** lab-manager-voucher (lab manager often junior — flagged), unrelated-dept-student (student vouches inherited from grad-student peer), insider-recruitment, shell-nonprofit (accomplice with no pubs), shell-company, cro-framing, gradual-legitimacy-accumulation, it-persona-manufacturing, dormant-domain, community-bio-lab-network
- **external_dependencies:** OpenAlex API (free, public, no auth required for low rate), OpenAlex authors index
- **manual_review_handoff:** Customer-equals-or-exceeds-voucher on the metrics → analyst reviews with side-by-side metric comparison and decides if voucher is structurally junior; voucher with no pubs → analyst.
- **flags_thrown:** voucher years-since-first-pub < customer's → flag (likely junior); voucher works < customer works → flag; voucher has 0 last-author works while customer has many → flag (PhD-supervisor relationship is reversed).
- **failure_modes_requiring_review:** ambiguous name → use OpenAlex disambiguated author ID seeded by the voucher's ORCID (ties idea 4 to this idea); foreign-script names → manual lookup; OpenAlex outage → fall through.
- **record_left:** snapshot of OpenAlex author records for both parties at vouch time.

## 10. Seniority verification via institutional rank from public directory + Scopus author ID

- **modes:** direct
- **summary:** Backup / complement to idea 9. For institutions where OpenAlex is thin, scrape the institution's public faculty directory (the URL collected in measure 7) for the voucher's title (Professor, Associate Professor, Lab Manager, Postdoc, PhD Student) and parse the title against a fixed seniority lattice. Cross-check with the voucher's Scopus Author ID record (h-index, years active, document count) via the Scopus API.
- **attacker_stories_addressed:** lab-manager-voucher, unrelated-dept-student, visiting-researcher, gradual-legitimacy-accumulation, shell-nonprofit, it-persona-manufacturing
- **external_dependencies:** Scopus Author Retrieval API (Elsevier, paid), institution-directory URL from measure 7
- **manual_review_handoff:** title-not-parseable → analyst.
- **flags_thrown:** voucher title at or below customer's title in the lattice → flag.
- **failure_modes_requiring_review:** institution has no public directory; non-English directory → manual.
- **record_left:** snapshot of directory page + Scopus record.

## 11. Relationship-length verification via OpenAlex co-authorship history

- **modes:** direct, attacker-driven
- **summary:** Measure 20 requires "years working together ≥ 1 year." Operationalize via OpenAlex co-authorship: pull all works co-authored by both the voucher and the customer (joined by OpenAlex author IDs, anchored on ORCID where available). Compute earliest co-authorship year. If gap-from-today ≥ 12 months, the relationship-length claim is independently corroborated. If no co-authored works exist, this doesn't disprove the relationship (advisor-of-thesis-not-yet-published, lab manager who never co-authors) but it lowers the trust score and triggers a fallback corroboration (idea 12).
- **attacker_stories_addressed:** lab-manager-voucher (a, b sub-variants), unrelated-dept-student, gradual-legitimacy-accumulation, shell-nonprofit, shell-company, cro-framing, cro-identity-rotation, it-persona-manufacturing, biotech-incubator-tenant, community-bio-lab-network, dormant-domain, foreign-institution
- **external_dependencies:** OpenAlex API
- **manual_review_handoff:** zero co-authored works AND voucher claims ≥1y → analyst reviews and asks customer for grant-shared / lab-roster corroboration.
- **flags_thrown:** earliest co-authorship < 12 months ago → fail relationship-length gate; zero co-authorships → flag for fallback (idea 12).
- **failure_modes_requiring_review:** name-disambiguation false negatives → use ORCID-anchored author IDs.
- **record_left:** list of co-authored work IDs, earliest publication date.

## 12. Relationship-length verification via NIH RePORTER shared-grant history

- **modes:** direct, attacker-driven
- **summary:** Backup / complement to idea 11 for non-publishing relationships (lab manager / postdoc who hasn't published yet, advisor on a new thesis). Query NIH RePORTER's API for grants where both the customer and the voucher appear (PI, contact PI, project lead, key personnel where parseable). Earliest shared grant year ≥12 months ago corroborates the relationship-length claim. NIH RePORTER also exposes IC, mechanism, project number, and abstract — useful for SOC-scope alignment (measure 20 field iii).
- **attacker_stories_addressed:** lab-manager-voucher, unrelated-dept-student, gradual-legitimacy-accumulation, shell-nonprofit, shell-company, cro-framing, biotech-incubator-tenant, community-bio-lab-network, foreign-institution (US-funded only)
- **external_dependencies:** NIH RePORTER API (free public)
- **manual_review_handoff:** non-NIH-funded labs → fall through to idea 11 + analyst.
- **flags_thrown:** zero shared grants and zero co-authorships → strong flag against the relationship.
- **failure_modes_requiring_review:** non-US researchers (RePORTER only covers NIH) — combine with EU CORDIS / UK UKRI Gateway to Research equivalents (note: EU/UK best guess, future ideas).
- **record_left:** list of shared grant numbers + abstracts.

## 13. Relationship-length corroboration via EU CORDIS / UK Gateway to Research

- **modes:** direct
- **summary:** Same as idea 12 but for EU/UK funded research. Query CORDIS (EU Horizon project participant database) and UKRI Gateway to Research API for grants listing both customer and voucher as participants. Provides parallel coverage to NIH RePORTER for non-US researchers.
- **attacker_stories_addressed:** foreign-institution, visiting-researcher, gradual-legitimacy-accumulation, lab-manager-voucher
- **external_dependencies:** CORDIS public API, UKRI Gateway to Research API (both free)
- **manual_review_handoff:** non-EU/UK voucher → fall through.
- **flags_thrown:** zero shared projects → flag (combine with ideas 11–12).
- **failure_modes_requiring_review:** participants listed at institution-level only, not person-level → cannot corroborate.
- **record_left:** project IDs + participant lists snapshot.

## 14. Voucher-customer independence graph check (anti-self-vouching)

- **modes:** direct, attacker-driven
- **summary:** Build a directed graph of voucher relationships: nodes = registered persons (by IDV-verified identity hash), edges = (voucher → customer, vouch event). Enforce (a) no self-loops (voucher_identity_hash ≠ customer_identity_hash), (b) no shared payment instrument BIN-account (ties to measure 10), (c) no shared shipping address (ties to measure 5), (d) no shared institutional admin email, (e) cycle detection: A vouches for B, B vouches for A within X months → flag, (f) clique detection: ≥3 personnel mutually vouching for each other → flag (community-bio-lab pattern). The check fires at vouch time and on retrospective sweeps.
- **attacker_stories_addressed:** lab-manager-voucher (sub-variant a — same person both roles), shell-nonprofit (self-vouching from accomplice), shell-company, cro-framing, community-bio-lab-network, biotech-incubator-tenant, gradual-legitimacy-accumulation, insider-recruitment
- **external_dependencies:** internal graph DB (Neo4j or PostgreSQL recursive CTEs), ties to ROR + payment + shipping records
- **manual_review_handoff:** any cycle / clique / shared-attribute hit → analyst with the subgraph visualization.
- **flags_thrown:** self-loop → hard deny; mutual vouching cycle → review; >3-clique → review.
- **failure_modes_requiring_review:** identity-hash collision (different people with same name + DoB) → use IDV-derived hashes from idea 1–3 to disambiguate.
- **record_left:** graph snapshot with the offending subgraph highlighted.

## 15. Cross-organization independence requirement (ROR-domain disjointness)

- **modes:** direct, attacker-driven
- **summary:** The voucher's ROR-resolved institution must be different from the customer's ROR-resolved institution (configurable: cross-org-required for high-risk SOC, same-org allowed otherwise). Where same-org is allowed, the voucher's institutional email domain must not be the same mailbox prefix or alias of the customer's. Eliminates the "self-vouching from accomplice within the shell" pattern and forces shell-attackers to either build a second shell or recruit externally — both raise cost dramatically (per attacker stories shell-company / shell-nonprofit).
- **attacker_stories_addressed:** shell-nonprofit, shell-company, cro-framing, cro-identity-rotation, dormant-domain, biotech-incubator-tenant, it-persona-manufacturing, lab-manager-voucher (sub-variant a)
- **external_dependencies:** ROR API, internal customer institution record
- **manual_review_handoff:** voucher and customer share ROR ID and order is high-risk SOC → analyst decides whether to require an external second voucher.
- **flags_thrown:** same ROR + high-risk SOC → require additional external voucher; shared mailbox alias → deny.
- **failure_modes_requiring_review:** institution not in ROR → fall back to manual.
- **record_left:** customer ROR ID + voucher ROR ID + decision.

## 16. Anti-rubber-stamp interaction friction SOP

- **modes:** attacker-driven
- **summary:** Workflow controls explicitly aimed at the lab-manager-voucher and bulk-order-noise-cover stories' rubber-stamping bypass. (a) The voucher form requires the voucher to free-text two fields that cannot be pre-filled: a one-paragraph description of the customer's current research area, and a one-paragraph necessity assessment specific to the SOC. These are graded by an analyst against the customer's own stated project (from measure 15). (b) Time-on-form telemetry: forms submitted in <60 seconds → flag. (c) Periodic "voucher-attestation freshness" requirement: the same voucher cannot approve more than N orders for the same customer in M months without re-doing live video. (d) Random audit: 1-in-K vouchers selected for live-video re-confirmation (idea 6) regardless of risk score; voucher knows the rate.
- **attacker_stories_addressed:** lab-manager-voucher (b, b', c), bulk-order-noise-cover, unrelated-dept-student (B), gradual-legitimacy-accumulation, insider-recruitment, dormant-account-takeover
- **external_dependencies:** internal voucher form telemetry, analyst review queue, semantic-similarity scoring for the free-text vs the customer's measure-15 declaration (LLM or rule-based)
- **manual_review_handoff:** low-similarity free-text → analyst compares; rapid-submit forms → analyst; periodic audit selections → live-video.
- **flags_thrown:** time-on-form <60s → flag; semantic-similarity <threshold → flag; voucher approval volume above 95th percentile → flag.
- **failure_modes_requiring_review:** voucher genuinely terse → analyst overrides; LLM scoring drift → human override always available.
- **record_left:** form telemetry, free-text submissions, similarity scores.

## 17. Voucher MFA + session binding via FIDO2 / WebAuthn

- **modes:** direct, attacker-driven
- **summary:** Voucher approval requires WebAuthn / FIDO2 with a hardware authenticator bound at first registration (with the IDV step from idea 1–3 as the binding ceremony). Resists AitM phishing kits (Tycoon 2FA, EvilProxy) named in shell-nonprofit, prevents account-hijack and credential-compromise, and prevents inbox-compromise from being upgradable to a full session.
- **attacker_stories_addressed:** account-hijack, credential-compromise, inbox-compromise, shell-nonprofit (AitM phishing path), dormant-account-takeover, insider-recruitment (raises lateral cost)
- **external_dependencies:** internal IdP with WebAuthn support, hardware key shipping at onboarding (or platform authenticator)
- **manual_review_handoff:** lost-key reset → must redo IDV (ideas 1–3) before re-binding.
- **flags_thrown:** session anomaly → step-up; impossible travel → step-up; new-device WebAuthn enrollment → IDV re-bind required.
- **failure_modes_requiring_review:** lost key → re-onboarding SOP.
- **record_left:** WebAuthn attestation, signed assertion per vouch event.

## 18. SOC-scope alignment check against voucher-supplied scope statement

- **modes:** direct, attacker-driven
- **summary:** Measure 20 field (iii) lets the referent indicate scope (single SOC, taxa, broader). Operationalize: store voucher-declared scope as a structured object (taxa list, SOC categories, time window). At each new SOC order, check the customer's order falls inside the voucher's declared scope. If not, a fresh voucher is required. Also semantic-check the voucher's necessity assessment (field iv) against the SOC sequence's known biological function — e.g., voucher claims "yeast metabolic engineering" but the SOC is a viral hemagglutinin → mismatch.
- **attacker_stories_addressed:** lab-manager-voucher (c — clinical batch vouching), bulk-order-noise-cover, gradual-legitimacy-accumulation, unrelated-dept-student
- **external_dependencies:** internal SOC taxonomy, semantic similarity (LLM or curated mapping), customer order metadata
- **manual_review_handoff:** out-of-scope orders → analyst decides whether to re-voucher or deny.
- **flags_thrown:** SOC outside declared taxa → require fresh voucher; necessity-assessment ↔ SOC mismatch → flag.
- **failure_modes_requiring_review:** legitimate scope expansion → analyst overrides.
- **record_left:** voucher scope object + order-vs-scope diff.

## 19. Voucher institutional-legitimacy check via ROR + GRID + Charity Commission / Companies House / GLEIF

- **modes:** direct
- **summary:** Measure 20 says "Confirm the institution-based legitimacy of the referent." Reuse the measure-18 stack against the voucher's claimed institution: ROR (research org index), GRID, GLEIF (LEI), Companies House (UK), Charity Commission (UK), state-level US incorporation registries via OpenCorporates. The voucher's institution must resolve in at least one research-org registry (ROR / GRID) OR be a recognized life-sciences entity in a corporate / charity registry, AND the voucher's affiliation in ORCID/Scopus must list it.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, cro-framing, cro-identity-rotation, dormant-domain, biotech-incubator-tenant, community-bio-lab-network, foreign-institution, it-persona-manufacturing
- **external_dependencies:** ROR API, GRID, GLEIF API, Companies House API, Charity Commission API, OpenCorporates API
- **manual_review_handoff:** institution resolves only in corporate registry without research signal → analyst confirms life-sciences mission via website + ROR alternative names.
- **flags_thrown:** not in ROR/GRID + not in any registry → deny; in registry but registered <12mo ago → flag; dissolved status → deny.
- **failure_modes_requiring_review:** small foreign research institute absent from registries → live-video + advisor letter SOP.
- **record_left:** all registry hits, snapshot of records.

## 20. eduGAIN / InCommon federated identity for voucher authentication

- **modes:** direct
- **summary:** Voucher authenticates via their home institution's IdP through eduGAIN (international) or InCommon (US R&E federation). The SAML assertion includes `eduPersonAffiliation` (faculty, staff, member), `eduPersonScopedAffiliation` with the institutional scope, and `schacHomeOrganization`. This binds the voucher act to a real institutional credential at vouch time, and is harder to fake than email confirmation because the IdP is operated by the institution. Note: assertion alone is not STRONG identity evidence (it's authentication, not IDV) — pair with idea 1–3 for the IDV layer.
- **attacker_stories_addressed:** visiting-researcher, foreign-institution (where home IdP is in eduGAIN), gradual-legitimacy-accumulation, it-persona-manufacturing, dormant-domain, dormant-account-takeover
- **external_dependencies:** eduGAIN metadata feed, InCommon federation, SAML SP infrastructure
- **manual_review_handoff:** institution not in eduGAIN/InCommon → fall through to ideas 5+19.
- **flags_thrown:** affiliation = "alum" or "library-walk-in" → reject; institution scope mismatch → flag.
- **failure_modes_requiring_review:** small / non-R1 institutions absent from federations.
- **record_left:** SAML assertion XML retained.

## 21. Voucher-relationship corroboration via institutional HR / lab-roster letter

- **modes:** attacker-driven
- **summary:** For relationships not covered by OpenAlex/RePORTER (idea 11–13) or where the relationship-length signal is too thin, request a signed letter from the institution's HR or department admin (NOT the voucher themselves) confirming both parties have been affiliated with the same lab/department for ≥12 months. Letter must arrive on letterhead, from an institutional email domain, with a verifiable contact phone (cross-checked against the institution's directory).
- **attacker_stories_addressed:** lab-manager-voucher, unrelated-dept-student (Bypass A — host-lab inheritance), gradual-legitimacy-accumulation, visiting-researcher, foreign-institution
- **external_dependencies:** institution directory, manual analyst SOP
- **manual_review_handoff:** This IS the manual review path. Analyst verifies letterhead + contact + email DKIM.
- **flags_thrown:** letter not on letterhead → reject; HR contact not in directory → reject; phone callback fails → reject.
- **failure_modes_requiring_review:** small institutions without HR → escalate.
- **record_left:** signed letter PDF, callback log.

## 22. Voucher-trust-score model combining the above signals

- **modes:** direct
- **summary:** Measure 20 explicitly references "level of trust below 6" as a flag trigger. Operationalize as a 0–10 integer score combining: IDV result (idea 1–3), ORCID corroboration (idea 4), institutional email DMARC (idea 5), GA4GH/eduGAIN federation (idea 7/20), seniority gap (idea 9–10), relationship-length corroboration (idea 11–13), independence-graph result (idea 14), institutional legitimacy (idea 19), MFA strength (idea 17), free-text quality (idea 16). Each signal contributes 0–2 points; floor at 6 to accept. Score and signal breakdown stored on the order record. Analysts can override but must write a reason.
- **attacker_stories_addressed:** all stories (this is the synthesis layer — scoring is what makes flag-trigger v "level of trust below 6" enforceable)
- **external_dependencies:** internal scoring service
- **manual_review_handoff:** any score in [4,6] → analyst review with breakdown; below 4 → auto-deny.
- **flags_thrown:** score < 6 → review; signal-coverage < 60% → flag.
- **failure_modes_requiring_review:** missing signals (e.g., voucher in jurisdiction with no IDV coverage) → analyst overrides.
- **record_left:** score breakdown JSON per vouch event.

---

## Coverage map (idea → attacker story sketch)

- **lab-manager-voucher (rubber-stamp + self-voucher):** ideas 9, 11, 14, 16, 18, 21
- **visiting-researcher:** ideas 4, 7, 20, 21
- **unrelated-dept-student:** ideas 9, 11, 16, 21
- **shell-nonprofit:** ideas 1–3, 7, 14, 15, 17, 19
- **shell-company:** ideas 14, 15, 19
- **insider-recruitment:** ideas 9, 14, 16, 17
- **account-hijack:** ideas 1–3, 6, 17
- **credential-compromise:** ideas 1–3, 6, 17
- **inbox-compromise:** ideas 5, 17
- **dormant-account-takeover:** ideas 1–3, 6, 17, 20
- **biotech-incubator-tenant:** ideas 14, 15, 19
- **community-bio-lab-network:** ideas 9, 11, 14
- **cro-framing / cro-identity-rotation:** ideas 11, 14, 15, 19
- **gradual-legitimacy-accumulation:** ideas 4, 9, 11, 14, 16, 18
- **dormant-domain:** ideas 4, 5, 14, 15, 19
- **foreign-institution:** ideas 4, 5, 7, 8, 13, 19
- **it-persona-manufacturing:** ideas 1–3, 4, 9, 14, 17
- **bulk-order-noise-cover:** ideas 16, 18

## Dropped

(none in v1)
