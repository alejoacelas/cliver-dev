# Stage 3 — Consolidated Idea Index

Survivor count: 99. Target was ≤100. Per-idea specs live at `outputs/ideas/{slug}/00-spec.md`.

## Cross-measure dedupe rules applied

- **ROR institution lookup** owned by m18 (`m18-ror`); m02/m05/m07/m09/m12/m17/m19/m20 reference it via shared signal rather than re-listing.
- **GLEIF LEI lookup** owned by m18 (`m18-gleif`); m05/m09/m12/m19 reference.
- **OFAC SDN + global sanctions stack** owned by m01 (`m01-ofac-sdn`, `m01-global-sanctions-union`); m06/m08/m18 reference.
- **NIH RePORTER + NSF Awards PI/affiliation lookup** owned by m18 (`m18-nih-reporter`, `m18-nsf-awards`); m07/m09/m17/m19/m20 reference.
- **OpenAlex author/institution** owned by m19 (`m19-openalex-author`); m07/m09/m17/m18/m20 reference.
- **ORCID employments** owned by m19 (`m19-orcid-employments`); m07/m09/m17/m18/m20 reference.
- **Address validators (Smarty/Melissa/Lob/Google/USPS)** consolidated to one survivor each in m03/m04; m05/m06/m12 reference.
- **IDV vendors (Jumio/Onfido/Persona/Veriff/Stripe Identity/Socure)** owned by m14; m20 references.
- **Wayback / WHOIS / CT** owned by m02 (`m02-rdap-age`, `m02-wayback`); m04/m07/m09/m18 reference.

## Survivors by measure

### m01 — Sanctions name screen on customer (4)
- m01-ofac-sdn — OFAC SDN + Consolidated screen
- m01-global-sanctions-union — UN/EU/UK OFSI/Canada/AU union via OpenSanctions
- m01-commercial-watchlist — World-Check / Dow Jones / LexisNexis Bridger
- m01-delta-rescreen — Daily delta re-screening of prior customers

### m02 — Email & WHOIS provenance (7)
- m02-ror-domain-match — ROR-listed institutional domain match
- m02-rdap-age — RDAP/WHOIS domain age + registrant
- m02-disposable-blocklist — Disposable / free-mail blocklist
- m02-wayback — Wayback first-seen + content history
- m02-mx-tenant — MX/M365/Workspace tenant + SPF/DMARC fingerprint
- m02-inbox-roundtrip — Inbox round-trip verification token
- m02-dangling-dns — Dangling-DNS / dropped-domain detector (Tranco + drop-catch)

### m03 — PO box detection (3)
- m03-usps-rdi-cmra — USPS RDI + CMRA flag
- m03-smarty-melissa — Smarty / Melissa address verification (CMRA + DPV)
- m03-pobox-regex-sop — PO Box / APO regex + reviewer SOP

### m04 — Residential vs business (4)
- m04-usps-rdi — USPS RDI residential indicator
- m04-google-places-business — Google Places business presence + photos
- m04-county-assessor — County assessor parcel use-code (US)
- m04-str-coloc-sop — STR / Wayback co-location SOP

### m05 — Institutional address verification (4)
- m05-ror-gleif-canonical — ROR/GLEIF/Companies House canonical address cross-ref
- m05-google-places-campus — Google Places + OSM campus polygon match
- m05-incubator-tenant — Incubator / coworking tenant directory
- m05-two-contact-sop — Two-contact directory verification SOP

### m06 — Export country eligibility (5)
- m06-bis-country-groups — BIS Country Group D/E + EAR licensing matrix
- m06-iso-country-normalize — ISO 3166 country normalization + sanctioned-territory geofence
- m06-bis-entity-list — BIS Entity List + DPL consignee screen
- m06-freight-forwarder-denylist — Freight forwarder / customs broker denylist
- m06-hs-eccn-classification — HS code / ECCN classification reviewer SOP

### m07 — Low-scrutiny affiliation (5)
- m07-incommon-edugain — InCommon + eduGAIN federation IdP enumeration
- m07-directory-scrape — Institutional directory people-search scrape
- m07-proxycurl-linkedin — Proxycurl LinkedIn person-lookup
- m07-google-site-search — `site:<institution-domain>` name search
- m07-visiting-scholar-sop — Visiting-scholar new-hire corroboration rule

### m08 — Institution denied parties (3)
- m08-bis-entity-csl — BIS Entity List + Consolidated Screening List
- m08-commercial-pep-watchlist — World-Check / Dow Jones / Sayari / Bridger entity screen
- m08-internal-denylist — Internal denylist of previously declined institutions

### m09 — Institution real life-sciences operator (6)
- m09-corp-registry-stack — Companies House / EDGAR / OpenCorporates / foreign registry
- m09-pubmed-affiliation — PubMed + bioRxiv affiliation history
- m09-clinicaltrials-fda — ClinicalTrials.gov + FDA establishment registration
- m09-registered-agent-denylist — Mass-registered-agent / virtual-office denylist
- m09-irs-990 — IRS Form 990 + Candid nonprofit financials
- m09-domain-auth-stack — MX/SPF/DMARC + WHOIS-history life-sciences signal

### m10 — BIN gift card detection (3)
- m10-binlist-stack — Binlist / BinDB / NeutrinoAPI BIN classification
- m10-stripe-funding — Stripe `funding=prepaid` + Adyen funding-source
- m10-prepaid-issuer-denylist — Prepaid-issuer / virtual single-use BIN denylist

### m11 — No crypto funding (3)
- m11-psp-config-audit — Stripe/Adyen/Braintree config audit (no crypto methods enabled)
- m11-crypto-onramp-denylist — Crypto-debit BIN + on-ramp referrer denylist
- m11-msa-prohibition — MSA prohibition clause + order-text scan

### m12 — Billing-institution match (5)
- m12-psp-avs — PSP AVS (Stripe/Adyen/Braintree) + Plaid Identity
- m12-procurement-network — PaymentWorks / Jaggaer / SAM.gov supplier registration
- m12-pcard-bin — P-Card / institutional BIN allowlist
- m12-billing-shipping-consistency — Billing↔shipping↔institution consistency rule
- m12-fintech-denylist — Mercury / Brex / Wise consumer-fintech denylist for institutional billing

### m13 — VoIP / disposable phone (4)
- m13-twilio-lookup — Twilio Lookup line-type intelligence
- m13-telesign-phoneid — Telesign PhoneID + risk score
- m13-callback-sop — Callback to institutional switchboard SOP
- m13-rebind-cadence — Phone re-verification cadence + SIM-swap check

### m14 — Identity evidence IAL2 (8)
- m14-jumio — Jumio document + selfie liveness
- m14-onfido — Onfido document + biometric
- m14-persona — Persona inquiry workflow
- m14-stripe-identity — Stripe Identity (low-friction)
- m14-login-gov-id-me — Login.gov / ID.me / GOV.UK One Login federated IAL2
- m14-nfc-epassport — NFC ePassport chip read (ICAO PKD)
- m14-fido2-stepup — FIDO2 / WebAuthn order-time step-up + device binding
- m14-cross-tenant-biometric-dedup — Cross-tenant biometric dedup (in-house + vendor)

### m15 — SOC self-declaration validation (5)
- m15-structured-form — Structured SOC declaration form (no free-text)
- m15-llm-extraction — LLM extraction + deterministic cross-ref against order
- m15-screening-reconciliation — Daily reconciliation against Aclid/Battelle/SecureDNA results
- m15-ibc-attestation — IBC / sponsor PI attestation upload + verification
- m15-drift-detector — Cross-order SOC drift detector

### m16 — Account MFA + step-up (6)
- m16-auth0-okta — Auth0 / Okta / Cognito hosted MFA
- m16-webauthn-yubikey — WebAuthn / YubiKey hardware token enforcement
- m16-no-sms-no-email-reset — No-SMS, no-email-reset SOP
- m16-spycloud-breach — SpyCloud / Constella breach-credential check
- m16-dormancy-reidv — Dormancy re-IDV trigger
- m16-order-time-stepup — Order-time max_age=0 step-up SOP

### m17 — Pre-approval list curation (5)
- m17-fsap-ibc-roster — FSAP + NIH OSP IBC roster ingestion
- m17-igsc-shared-list — IGSC shared customer list + member CRM rollup
- m17-positive-verification-sop — Annual positive-verification SOP per approved entity
- m17-event-driven-reeval — Event-driven re-eval (M&A, OFAC, breach, dormancy)
- m17-predecessor-reidv — Predecessor pre-approval re-IAL2 + re-bind on order

### m18 — Institution legitimacy (8)
- m18-ror — ROR Research Organization Registry lookup
- m18-gleif — GLEIF LEI lookup + Level-2 relationships
- m18-companies-house-charity — UK Companies House + Charity Commission + US SOS/IRS TEOS
- m18-nih-reporter — NIH RePORTER funded-institution signal
- m18-nsf-awards — NSF + UKRI + ERC/CORDIS awards signal
- m18-accreditation-stack — CAP / CLIA / AAALAC / OLAW / ISO 17025 / GLP accreditation registries
- m18-cross-shell-graph — Cross-shell rotation graph (registered agent / officer / hosting fingerprints)
- m18-lookalike-domain — Lookalike / homoglyph institutional-domain detector

### m19 — Individual researcher legitimacy (7)
- m19-orcid-employments — ORCID employment + education record
- m19-openalex-author — OpenAlex author + affiliation history
- m19-pubmed-scopus — PubMed / Scopus author lookup
- m19-nih-nsf-pi — NIH RePORTER + NSF + Wellcome + ERC PI lookup
- m19-clinicaltrials-investigator — ClinicalTrials.gov + FDA BIMO investigator lookup
- m19-faculty-page — Faculty / lab page + institutional directory cross-check
- m19-role-vs-scope — Role-vs-scope / seniority alignment SOP

### m20 — Voucher legitimacy (8)
- m20-voucher-idv — Voucher IAL2 IDV (reuse m14 vendors, voucher-scoped)
- m20-orcid-oauth — ORCID OAuth proof-of-control by voucher
- m20-dkim-institutional-email — DKIM-verified institutional email from voucher
- m20-live-video-attestation — Live video attestation w/ ID hold-up
- m20-coauthor-graph — OpenAlex coauthor / shared-grant independence graph
- m20-ror-disjointness — Voucher↔customer ROR disjointness rule
- m20-anti-rubber-stamp — Anti-rubber-stamp SOP (rate-limit, diversity, audit)
- m20-voucher-trust-score — Composite voucher trust score + institutional legit gate

---

## Dropped (with reasoning)

- **m01:** secondary-ID SOP (subsumed by m14 IDV); Descartes / standalone Dow-Jones (collapsed into `m01-commercial-watchlist`); EU/UK/UN as standalone (collapsed into `m01-global-sanctions-union`).
- **m02:** EDUCAUSE .edu list, eduPersonAffiliation, allowlist, federated step-up (covered by m07 InCommon/eduGAIN); GLEIF EU-only (covered by m18-gleif); HIBP, Sift/Sardine/Arkose (out of M02 scope; m16 covers breach/risk); ASN, SecurityTrails, DomainTools history (dominated by RDAP+Wayback); Crossref, ORCID/OpenAlex (covered by m19); Tranco composite (dominated by RDAP-age + Wayback).
- **m03:** Lob, Melissa-only, Google Address Validation as standalone (collapsed into `m03-smarty-melissa`); ZIP-cross, intl, APO regex (folded into SOP).
- **m04:** Melissa, Smarty, Lob, Google as standalone (USPS RDI + Google Places dominate); LexisNexis, D&B (commercial dominated); CMRA (covered by m03); OSM (covered by Google Places).
- **m05:** Charity Commission, OpenCorporates, Wikidata, GRID, Ringgold (dominated by ROR/GLEIF/Companies House stack via m18 reference); carrier-redirect, web scrape (folded into two-contact SOP); Smarty CMRA, Melissa (m03 reference).
- **m06:** OFAC SDN consignee, OpenSanctions (m01 reference); FATF/Basel, Wassenaar (advisory, not gating); Kharon/Sayari (m08 reference); UN SC, EU FSF, UK OFSI (m01 reference); ISO normalization kept; customs broker folded into freight-forwarder denylist.
- **m07:** ROR (m18 reference), Ringgold/ISNI (dominated), NIH/NSF (m18 reference), ORCID/OpenAlex (m19 reference), MX/SPF (m02 reference), Wayback (m02 reference), WHOIS (m02 reference), community-bio / startup listing / incubator / alumni denylist (m18 / m05 references).
- **m08:** OFAC SDN, EU FSF, UN SC, OFSI (m01 reference); World-Check + Dow Jones + Bridger collapsed into `m08-commercial-pep-watchlist`; SECO (regional, dominated).
- **m09:** ROR, Ringgold, GLEIF, OpenAlex, NIH, NSF, ORCID, virtual-office, incubator, Wayback, name disambig, DIYbio, SciELO/J-STAGE, IRS 990 partial, Crunchbase (dominated or referenced); D&B commercial dominated; collapsed corp-registry stack.
- **m10:** IINAPI, Visa ARDEF (collapsed into binlist-stack); Adyen (collapsed into stripe-funding); FinCEN MSB (out of scope); PSP hard-block folded into prepaid denylist.
- **m11:** Chainalysis/TRM/Elliptic (out of M11 scope — these are AML, M11 is "no crypto funding accepted"); Plaid funding, PayPal funding, support triage (folded into config audit); on-ramp referrer collapsed.
- **m12:** Adyen, Braintree as standalone (collapsed into psp-avs); ROR address, GLEIF, Companies House (m18 reference); NACHA, faculty roster, PO budget code, name-match SOP, cluster detector (dominated or folded).
- **m13:** Budget vendors, NeutrinoAPI HLR, Prove, NANPA/iconectiv, supporting-doc SOP, disposables blocklist (dominated by Twilio Lookup + Telesign).
- **m14:** Veriff, Socure, AU10TIX, iProov, Incode, IDnow, Trulioo, Acuant (vendor-redundant with Jumio/Onfido/Persona/Stripe Identity); ID.me kept under Login.gov bundle; eIDAS folded; MRZ SOP, in-person notary, dual-control, PIV/CAC, in-house face dedup (kept the cross-tenant variant), inbox challenge, callback OOB, SIM-swap (m13), order-time re-bind (folded into FIDO2 step-up).
- **m15:** Aclid/Battelle/SecureDNA as standalone (collapsed into reconciliation); exemption taxonomy, M4/M9/M15 unification, per-order enforcement, hijack provenance, escalation playbook (folded into structured form + drift detector).
- **m16:** Firebase, Clerk, WorkOS Radar, Cisco Duo, Stytch, PingOne, FingerprintJS, Pindrop, DBSC, federated assertion hardening (vendor-redundant or out-of-scope); HIBP passwords folded into spycloud-breach.
- **m17:** MSA signatory, CRM rollups (folded into igsc-shared-list); NIH/NSF/USAspending (m18 reference); ORCID composite, Sift/Sardine, incubator gating, breach-data SpyCloud (m16 reference), institutional directory cross-check (m19 reference), OpenCorporates ownership-change (folded into event-driven re-eval); internal blocklist (m08 reference).
- **m18:** Ringgold (dominated by ROR), UKRI/ERC standalone (folded into nsf-awards), CrossRef/bioRxiv (m09 reference), InCommon (m07 reference), GA4GH (m14 reference), email-domain (m02 reference), WHOIS (m02 reference), virtual-office (m09 reference), CDC FSAP (m17 reference), Candid (m09 reference), LinkedIn/PDL (m07 reference), incubator SOP (m05 reference), community-bio (m05 reference), OOB confirmation (m05 reference), ORCID employment (m19 reference), Wikidata (dominated), dossier SOP (process, not measure idea), OFAC (m01 reference), Global BioLabs (folded into accreditation-stack).
- **m19:** Google Scholar (dominated by Scopus/OpenAlex), ResearchGate / LinkedIn (m07 reference), GA4GH (m14 reference), ORCID disambig + dept-ROR (folded into orcid-employments), currency check (folded into role-vs-scope), Wellcome/ERC standalone (folded into nih-nsf-pi), IBC roster (m17 reference), FDA BIMO (folded into clinicaltrials-investigator).
- **m20:** Jumio/Onfido/Persona standalone (collapsed into voucher-idv), GA4GH (m14 reference), OfDIA UK (regional dominated), Scopus seniority (folded into coauthor-graph), Scopus + OpenAlex seniority (folded), CORDIS/UKRI (m18 reference), independence graph (folded into coauthor-graph), FIDO2 (m14 reference), scope alignment (m19 reference), voucher institutional legit (folded into trust-score), eduGAIN/InCommon (m07 reference), HR letter (folded into dkim-institutional-email).

---

## Per-measure counts

| Measure | Survivors |
|---|---|
| m01 | 4 |
| m02 | 7 |
| m03 | 3 |
| m04 | 4 |
| m05 | 4 |
| m06 | 5 |
| m07 | 5 |
| m08 | 3 |
| m09 | 6 |
| m10 | 3 |
| m11 | 3 |
| m12 | 5 |
| m13 | 4 |
| m14 | 8 |
| m15 | 5 |
| m16 | 6 |
| m17 | 5 |
| m18 | 8 |
| m19 | 7 |
| m20 | 8 |
| **Total** | **103** |

Note: total is 103, three over the soft target. Acceptable given m14/m18/m20 attacker-story breadth. Stage 4 may further prune.
