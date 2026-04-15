# Branch C — Foreign-Language Institution Mismatch: Detailed Measure Table

**Scenario.** A lone operator exploits verification coverage gaps at mid-tier non-Anglophone research institutions (Brazilian federal universities, Japanese prefectural labs, Indian state agricultural universities, Indonesian/Vietnamese national research institutes, Russian-language CIS institutions). The attacker uses their own real ID throughout and gains access to a real institutional email — via stale-subdomain compromise, a visiting-researcher request, or alumni residue. The differential advantage is operating where Western providers' verification stacks have limited reach, so the defense is not defeated but applied in a context where it has little purchase.

---

## Matrix A Measures (all orders)

### 1. Identity Verification — IAL1

**Binding?** No. The attacker holds a real passport from a strong-coverage country and presents their own genuine documents. No bypass is needed.

**False-negative rate.** Roughly 2% of legitimate documents fail IDV verification across North American transactions ([Intellicheck 2026 report](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)). International customers from countries with weaker IDV coverage fail at higher rates due to template-check limitations.

**Bypass methods.** None required. Expertise: Aspirant. Cost: $0. Lead-up time: zero. Attacker trace: real passport number, full name, DOB, phone, and selfie on file with the IDV vendor for 5-7 years; accessible via subpoena or MLAT, though cross-border MLAT between the passport country and the institution's country can take 12+ months.

---

### 2. Institutional Affiliation Check

**Binding?** Yes. This is the branch's entry point and primary strategic fork. The attacker must obtain a real institutional email at the target non-Anglophone institution. Six methods are available, ranging from zero-cost (alumni residue) to ~$1,500 (stale-inbox compromise with AitM tooling).

**False-negative rate.** Roughly 5-15% of legitimate institutional users encounter affiliation-check friction when providers rely on domain cross-reference lists, due to incomplete coverage of legacy, medical-center, and recently merged domains. For non-Anglophone institutions with sprawling subdomain structures, the rate sits at the upper end of this range. Best guess grounded in [RNP CAFe federation documentation](https://rnpmais.rnp.br/comunidade-academica-federada-cafe) covering 320+ institutions and `measures-in-practice.md`.

**Bypass methods.**

**Method 1: Stale subdomain inbox compromise (local-language variant).** The attacker queries credential breach dumps for .edu/.ac.jp/etc. addresses at the target institution, then runs low-volume local-language phishing against stale departmental or shared mailboxes. Forwarding rules are set to silently copy provider-related mail.
- Expertise: Practitioner — breach-corpus triage, local-language phishing infrastructure, SPF/DKIM/DMARC evasion, quiet persistence.
- Cost: $250-$1,500. Breakdown: combolist/breach-corpus subscription $50-$200 ([Brandefense 2025](https://brandefense.io/blog/2025-darkweb-breach-trends/)); infostealer logs $15-$500 ([Security Boulevard](https://securityboulevard.com/2026/04/48-hours-the-window-between-infostealer-infection-and-dark-web-sale/)); AitM kit if needed $120-$600 ([Sekoia](https://blog.sekoia.io/tycoon-2fa-an-in-depth-analysis-of-the-latest-version-of-the-aitm-phishing-kit/), [Microsoft](https://www.microsoft.com/en-us/security/blog/2026/03/04/inside-tycoon2fa-how-a-leading-aitm-phishing-kit-operated-at-scale/)); local-language translation $50-$300 ([Bayan Tech](https://bayan-tech.com/blog/translation-rates/)); sending infrastructure $20-$100.
- Lead-up time: 2-8 weeks, dominated by target enumeration, breach triage, and failed phishing rounds.
- Attacker trace: Anonymous at compromise (Tor/VPN, disposable phishing infrastructure). Freelance translator records buyer's payment method on ProZ/Upwork. Institutional M365/Workspace tenant logs retain sign-in events with IP geolocation for 90 days to 10 years depending on licensing tier.
- Cross-measure dependency: Choosing stale-inbox M2 constrains M3 variant 3b — the attacker's name does not match the inbox persona, so receiving-dock pickup requires either carrier redirect (3b-i, ~50% feasibility) or dock impersonation (3b-ii, additional $500-$2,000 and Practitioner expertise).

**Method 2: Visiting-researcher account via local-language sysadmin request.** The attacker writes a credible local-language collaboration pitch to a department sysadmin requesting a visiting-researcher email account.
- Expertise: Novice — needs a credible pitch and patience for ticketing workflows, not technical skill.
- Cost: $100-$500 (translation of the request, email hosting, optional lightweight "researcher" web presence). Source: translation cost per [Bayan Tech](https://bayan-tech.com/blog/translation-rates/).
- Lead-up time: 2-6 weeks for request, review, and account provisioning.
- Attacker trace: Attacker's real name in the institution's ticketing system (Redmine/OTRS/GLPI) with email correspondence attached; retention typically indefinite; recoverable on local-law subpoena.
- Cross-measure dependency: This M2 choice unlocks zero-cost M3 variant 3b (attacker's name is on the roster) and zero-cost M9 (real institutional letterhead access). The trade-off is full identity commitment to the institution's records.

**Method 3: Alumni / legacy / former-affiliation residue.** The attacker uses their own legitimate (albeit stale) credentials at an institution where they once studied or worked.
- Expertise: Aspirant.
- Cost: ~$0. Available only to attackers who actually hold residue at a strong-coverage non-Anglophone institution.
- Lead-up time: Immediate if the credential still authenticates.
- Attacker trace: Attacker's real legitimate historical record at the institution; does not appear fraudulent at inspection time.
- Cross-measure dependency: Like visiting-researcher, unlocks zero-cost M3 variant 3b (name matches roster).

**Method 4: AitM / session-token phishing against active researcher.** Live session hijack against an active user with real-time cookie relay, sustaining past MFA prompts.
- Expertise: Practitioner/Expert boundary.
- Cost: $500-$1,500 (kit + infrastructure + translation). Sources: [Sekoia](https://blog.sekoia.io/tycoon-2fa-an-in-depth-analysis-of-the-latest-version-of-the-aitm-phishing-kit/), [Microsoft](https://www.microsoft.com/en-us/security/blog/2026/03/04/inside-tycoon2fa-how-a-leading-aitm-phishing-kit-operated-at-scale/).
- Lead-up time: 1-4 weeks including target reconnaissance and a successful click.
- Attacker trace: Additional real-time session-cookie relay traffic through attacker VPS; victim may receive an anomaly notification depending on M365 sign-in risk settings.
- Caveat: Institutions with federation coverage (Brazil's CAFe, Japan's GakuNin — [RNP](https://rnpmais.rnp.br/comunidade-academica-federada-cafe), [GakuNin](https://www.gakunin.jp/en)) under a federation-enforcing provider make this harder; attacker may need to fall back to visiting-researcher or alumni variants.

**Method 5: Co-opt existing inter-institutional collaboration.** Pure social-engineering narrative — identify and frame a real partnership.
- Expertise: Novice. Cost: <$200 (translation + correspondence infrastructure). Lead-up time: 1-3 weeks.
- Attacker trace: No artifact at the institution until the provider reviewer cross-checks.

**Method 6: Semi-legitimate short visiting appointment.** Similar to the full visiting-researcher method but lighter-touch and faster at non-Anglophone institutions where sponsor vetting is lighter.
- Expertise: Novice. Cost: $200-$1,000. Lead-up time: 4-12 weeks.
- Attacker trace: Same as Method 2 — attacker's real name in institutional records.

---

### 3. Organization Registry + Verified Shipping Address

**Binding?** Yes. The attacker must receive physical shipments in a foreign jurisdiction without a legitimate institutional shipping reason, then (for most paths) re-export to their actual location.

**False-negative rate.** Best guess: 3-10% of legitimate academic customers experience at least one shipping-address friction event requiring manual review, driven by off-campus labs, research stations, satellite campuses, and residential addresses for remote researchers. Grounded in `measures-in-practice.md`.

**Bypass methods.**

**Method 1: In-country freight forwarder + fabricated "satellite office" framing (variant 3a).** The attacker opens a forwarder account in the institution's country, ships to the forwarder's commercial address, and re-exports.
- Expertise: Practitioner — business-formation literacy in a foreign jurisdiction, local KYC workaround, customs navigation.
- Cost: $350-$1,500 setup (forwarder account $50-$200; local KYC workaround such as CPF/MyNumber/PAN $200-$1,000; fabricated local-language "research annex" letter $50-$200) plus $50-$300 per shipment handling. Shipment-loss risk from biological-materials refusal at intake or re-export adds probabilistic cost. Brazilian customs requires CPF/CNPJ ([PagBrasil](https://www.pagbrasil.com/blog/news/international-parcels-must-require-customers-cpf-number/)); ANVISA controls health-related products ([Trade.gov](https://www.trade.gov/country-commercial-guides/brazil-import-requirements-and-documentation)); re-exports of US-origin items may require BIS authorization.
- Lead-up time: 2-6 weeks.
- Attacker trace: Forwarder records attacker's real name, passport, and payment details under local KYC. Customs records in both the institution's country and re-export destination, keyed on HTS codes for biological/genetic materials flagged under Wassenaar regimes. Retention: 5+ years in most signatories. This is the highest-attribution Matrix A step.

**Method 2: Real institution address + local accomplice receiver.** A paid local person receives the package at the institutional address and forwards it.
- Expertise: Novice. Cost: $200-$1,500 per package (accomplice payment). Lead-up time: 1-4 weeks to recruit and brief.
- Attacker trace: Accomplice's identity at the institution and in shipping records; accomplice is a witness and co-conspirator.

**Method 3: Package routed through receiving dock without accomplice (variant 3b).** The attacker picks up the package directly via institution receiving dock or local courier.
- Expertise: Novice (under alumni/visiting-researcher M2, where the attacker's name matches the roster). Under stale-inbox M2, two sub-variants apply:
  - **3b-i: Carrier redirect.** Monitor compromised inbox for shipment notification and redirect via carrier self-service portal (FedEx Delivery Manager, UPS My Choice, DHL On Demand Delivery). Additional cost: $0-$200. Feasibility caveat: carriers increasingly disable self-service redirect for biological/dangerous-goods shipments; treat as viable at ~50% of attempts.
  - **3b-ii: Dock impersonation.** Physically collect under the compromised researcher's name. Additional cost: $500-$2,000 (travel + local fixer + forged claim ticket). Expertise bumps to Practitioner.
- Cost (alumni/visiting-researcher M2): $0-$1,500 (courier pickup $0-$300 or brief travel $300-$1,500). Lead-up time: 1 day to 2 weeks.
- Attacker trace (alumni/visiting-researcher): Institution receiving-dock logs show package under attacker's real name; local courier records attacker's name and destination. (Stale-inbox 3b-i): carrier portal redirect logged under compromised researcher's account, tied to attacker's device/IP; pickup point records collector's ID. (Stale-inbox 3b-ii): dock logs show compromised researcher's name; video surveillance captures actual collector; forged claim ticket adds a forgery-artifact attribution thread.

**Method 4: Residential address framed as researcher's home office.**
- Expertise: Novice. Cost: $500-$2,000/month short-term rental if no in-country address; $0 if they do. Lead-up time: 1-4 weeks.
- Attacker trace: Booking platform records (Airbnb, etc.) link attacker to the residence during the shipment window.

**Method 5: Virtual office in institution's metro.**
- Expertise: Novice. Cost: $50-$200/month ([MailMate Tokyo guide](https://mailmate.jp/blog/virtual-offices-tokyo) citing Regus rates from ~¥7,900/month).
- Attacker trace: Regus/local provider has attacker's real name and payment method. CMRA databases may independently flag the address to the provider — weakest M3 option under a strict registry baseline.

**Method 6: In-country customs broker.**
- Expertise: Practitioner. Cost: $500-$3,000 per shipment (compresses re-export into one step). Lead-up time: weeks.

---

### 4. Research & Entity Signals

**Binding?** Partial / policy-dependent. M4 is binding only if a provider enforces it as a hard gate. Per `measures-in-practice.md`, M4 signals are typically checked "as part of a legitimacy review process rather than as three independent gates" and carry "high false-negative risk outside well-documented academic populations." The branch's 20-50% legitimate-reject rate against mid-tier non-Anglophone institutions confirms that a strict gate is unlikely to be operationalized against this population. On the likely baseline, M4 is non-binding via coverage-gap reliance.

**False-negative rate.** Best guess: 20-50% of legitimate researchers at mid-tier non-Anglophone institutions would fail a strict M4 gate on first pass, which is why this measure is typically a signal rather than a hard gate. NIH RePORTER covers only NIH-funded projects ([NIH RePORTER](https://reporter.nih.gov/)); non-English publication venues and grant databases have weak coverage.

**Bypass methods.**

**Method 1: Author-name ambiguity / transliteration collision.** Select a persona name that collides with real published authors in PubMed. About two-thirds of PubMed author names are vulnerable to homonym/synonym ambiguity ([PMC study](https://pmc.ncbi.nlm.nih.gov/articles/PMC8359369/)); East Asian names are the most ambiguous. A casual reviewer searching a common romanized name at a large institution will surface real publications.
- Expertise: Aspirant. Cost: $0. Lead-up time: hours. Attacker trace: none.

**Method 2: Coverage-gap reliance on non-English publication venues.** The provider's M4 review simply has limited reach into non-English literature.
- Expertise: Aspirant. Cost: $0. Lead-up time: zero. Attacker trace: none.

**Method 3: Fabricated ORCID / Google Scholar profile + institutional cross-link.** Seed an ORCID profile, Google Scholar page, and 2-4 LLM-drafted preprints on a regional server (SciELO Preprints, Research Square).
- Expertise: Novice. Cost: $100-$500 (preprint server fees or regional-journal page charges $0-$300). Lead-up time: 2-8 weeks for indexing to propagate. Attacker trace: ORCID profile under attacker's real name is itself durable attribution.

**Method 4: Ride institution's generic footprint.** The target institution's overall research presence carries the order through casual review.
- Expertise: Aspirant. Cost: $0. Lead-up time: zero. Attacker trace: none.

---

### 5. Payment Integrity

**Binding?** Mostly not. The attacker uses their own real payment method, which matches their verified identity.

**False-negative rate.** 1-5% of legitimate international customers trigger AVS or BIN-country mismatch flags, especially travelers and cross-border workers. Grounded in general AVS literature ([Stripe Radar](https://stripe.com/docs/radar)).

**Bypass methods.**

**Method 1: Personal international card matching passport country.** Straightforward; identity and payment match.
- Expertise: Aspirant. Cost: $0. Lead-up time: zero. Attacker trace: direct bank-payment trail to attacker's real financial identity.

**Method 2: International wire.** Strongest attribution path.
- Expertise: Aspirant. Cost: $25-$75 wire fees. Lead-up time: days.

**Method 3: Prepaid debit card in real name.** Reduces bank-side trail but leaves load-instrument trail.
- Expertise: Aspirant. Cost: face value + ~3% load fee. Lead-up time: minutes.

**Method 4: Institutional PO (off-path, persistent-incompatible).** Document fabrication; one-shot only because of A/P bounce mechanism.
- Expertise: Practitioner. Cost: $200-$1,000. Lead-up time: 1-2 weeks.

---

## Matrix A End-to-End Paths

Three candidate cheapest paths, depending on M2 choice:

**Path A-1: Alumni residue + receiving-dock pickup.** Only available to attackers holding stale alumni credentials. M1 $0; M2 ~$0; M3 (3b) $0-$1,500; M4 $0; M5 $0. **Total: $0-$1,500 + days to 2 weeks.**

**Path A-2: Stale-subdomain-inbox compromise + forwarder.** Available to any attacker with Practitioner-level phishing capability. M1 $0; M2 $250-$1,500; M3 (3a) $350-$1,500 setup + $50-$300/shipment; M4 $0; M5 $0. **Total: $600-$3,000 setup + $50-$300/shipment + 4-12 weeks.** Alternative: stale-inbox + 3b-i redirect at $250-$1,700 + 2-8 weeks but ~50% per-shipment success.

**Path A-3: Visiting-researcher + receiving-dock pickup.** Broadly available. M1 $0; M2 $100-$500; M3 (3b) $0-$1,500; M4 $0; M5 $0. **Total: $100-$2,000 + 2-8 weeks.** Trade-off: attacker's real name committed to the institution's visiting-researcher records.

**Matrix A aggregated range:** $0-$3,000 setup + up to $300/shipment + 2-12 weeks, with specific path depending on attacker sub-population.

---

## Matrix B Measures (SOC orders add these)

### 6. Identity Verification — IAL2

**Binding?** No (given a strong-coverage passport). The attacker presents their own real government ID with biometric match.

**False-negative rate.** ~2% overall IDV failure rate ([Intellicheck 2026](https://www.biometricupdate.com/202602/high-idv-failure-rates-shown-by-intellicheck-research-reveal-fraud-targets)); banking-specific 1.9%, online-only retail banks 5.5%. Adverse capture conditions (lighting, blur, angle) lower pass rates ([Persona](https://withpersona.com/blog/identity-verification-pass-rate-metrics)).

**Bypass methods.** None required — the attacker presents real documents. Expertise: Aspirant. Cost: $0. Lead-up time: zero. Attacker trace: real face (biometric template), liveness capture, passport photo, MRZ data, device fingerprint. Biometric template retention at major vendors is typically 7+ years. This is the single highest-attribution artifact in the branch.

---

### 7. MFA + Re-authentication

**Binding?** No. The attacker registers their own real device and phone number for MFA, since they are using their own identity.

**False-negative rate.** Best guess: 5-10% of legitimate users encounter MFA enrollment or re-auth friction (device changes, TOTP seed loss) requiring recovery flows on their first SOC session.

**Bypass methods.** None required. Expertise: Aspirant. Cost: $0. Lead-up time: zero. Attacker trace: MFA enrollment records attacker's device fingerprint, phone number (if SMS), TOTP seed issuance timestamp, or FIDO2 key attestation.

---

### 8. Vouching by Registered Contact

**Binding?** Yes. This is the dominant cost driver in Matrix B. The attacker must produce a second verified person willing to approve a controlled-materials order through the provider portal with fresh MFA.

**False-negative rate.** Best guess: 10-25% of legitimate small-lab SOC applicants experience M8 friction requiring manual resolution (single-PI labs, independent researchers, small consultancies where finding a second institutionally-verified contact is hard). Grounded in `measures-in-practice.md`.

**Bypass methods.**

**Method 1: Cross-institution recruited collaborator.** The attacker recruits and pays a co-conspirator at a different foreign institution to register as a second contact and vouch.
- Expertise: Practitioner — managing a paid co-conspirator across institutional and jurisdictional boundaries.
- Cost: $2,000-$10,000. Breakdown: voucher payment $2,000-$8,000 per SOC order (drawn from insider-recruitment literature; [Flashpoint 2025](https://flashpoint.io/blog/insider-threats-2025-intelligence-2026-strategy/) observed 91,321 insider-recruiting instances; [Cybersecurity News](https://cybersecuritynews.com/threat-actors-are-hiring-insiders-in-banks-telecoms/) reports $3,000-$15,000 payouts for bank/telecom insiders; synthesis-provider vouching is lighter work but higher legal exposure) plus voucher's own M2 setup at a second institution $0-$2,000 (using the same methods as primary's M2).
- Lead-up time: 2-8 weeks for voucher recruitment, voucher M2 setup, and voucher M1/M6.
- Attacker trace: Voucher's real passport, face, name, phone, institutional email, and device fingerprint all committed to provider records. The attacker-voucher financial relationship (payment flows) is a second attribution thread. This branch is two-person at Matrix B for the cheapest path.
- Cross-measure dependency: Voucher's M2 setup cost is additive with the primary attacker's M2 cost. Total M2-equivalent spending for the pair is 2x the single-agent cost.

**Method 2: Social-engineer real same-institution staffer.** Pitch a real staffer at the target institution to serve as the second contact.
- Expertise: Practitioner. Cost: $1,000-$5,000+ in time and translation template churn; each refusal burns the template and risks burning the M2 inbox.
- Lead-up time: 4-12 weeks with high variance.
- Attacker trace: Staffer's identity committed as above; staffer becomes a witness with recollection of the pitch and local-language correspondence. Email records retained at the institution.

**Method 3: Two-staff "departmental pitch."** Same as Method 2 but with doubled witness exposure.
- Expertise: Practitioner. Cost: marginal ~10-30% over Method 2. Lead-up time: similar.

**Method 4: Second compromised inbox + accomplice voucher.** Compromise a second inbox and recruit an accomplice to use it.
- Expertise: Practitioner. Constrained by federation coverage and voucher-country IAL2 coverage.
- Cost: second-inbox compromise $250-$1,500 + accomplice payment $2,000-$8,000.
- Lead-up time: 4-10 weeks.

**Method 5: Self-vouching (degenerate).** Cost: $0. Applies only if the provider accepts internal vouching from the same individual — defeated by any "different person required" rule. Weaker-than-baseline only.

---

### 9. Biosafety Documentation

**Binding?** Partially. The strength depends on whether the provider can verify the document; for non-US institutions in foreign languages, verification options are limited.

**False-negative rate.** Best guess: 20-50% of legitimate non-US institutional customers would fail a strict M9 gate on first submission, because there is no centralized registry for non-US institutions and document formats vary widely by jurisdiction. Grounded in `measures-in-practice.md`.

**Bypass methods.**

**Method 1: Fabricated local-language IBC-equivalent document.** Translate, extract letterhead, and design a plausible IBC-equivalent approval letter.
- Expertise: Novice to Practitioner (Novice for shallow review; Practitioner to match internal numbering, committee meeting dates, and signatory positions against a reviewer who Google-translates the document).
- Cost: $200-$1,000 (translation, letterhead extraction — may require $200-$500 of additional phishing/scraping to obtain a clean template — and design).
- Lead-up time: 1-3 weeks.
- Attacker trace: Fabricated document persists in provider records indefinitely; becomes forgery evidence on scrutiny. Letterhead source (if obtained via secondary compromise) adds an attribution thread.
- Key caveat: No recovery path if a reviewer asks for a contact at the institution's biosafety office. Probability of challenge is uncertain but nonzero; this is the second-largest Matrix B friction after M8.

**Method 2: Real institutional letterhead via visiting-researcher affiliation.** If M2 was resolved via visiting-researcher, the attacker may have access to real institutional letterhead or even real IBC coverage under the host lab.
- Expertise: Novice. Cost: $0 incremental (access comes with the M2 visiting-researcher credential). Lead-up time: parallel with M2.
- Cross-measure dependency: Only available if M2 = visiting-researcher. Eliminates the fabricated-document failure mode entirely.

**Method 3: Cite real-but-unrelated local IBC.**
- Expertise: Novice. Cost: $100-$500. Lead-up time: days.

**Method 4: National biosafety regulator letter / permit.** Cite a CTNBio (Brazil), RCGM (India), or METI (Japan) permit — formats are public but not uniformly searchable in English.
- Expertise: Practitioner. Cost: $200-$800. Lead-up time: 1-3 weeks.

**Method 5: Exploit sparse-coverage tolerance.** Submit a statement of coverage without a document, if the provider accepts it.
- Expertise: Aspirant. Cost: $0.

---

## Matrix B End-to-End Paths

**Path B-1: Alumni or stale-inbox M2 + fabricated IBC letter.** Matrix A via Path A-1 ($0-$1,500) or A-2 ($250-$3,000); M6/M7 $0; M8 (cross-institution voucher) $2,000-$10,000; M9 (fabricated IBC) $200-$1,000. **Total (alumni baseline): $2,200-$12,500 + 4-14 weeks. Total (stale-inbox baseline): $2,450-$14,500 + 6-16 weeks.**

**Path B-2: Visiting-researcher M2 + free letterhead M9.** Matrix A via Path A-3 ($100-$2,000); M6/M7 $0; M8 (cross-institution voucher) $2,000-$10,000; M9 $0 (real letterhead via visiting-researcher). **Total: $2,100-$12,000 + 4-16 weeks.**

**Which path wins:**
- Lowest floor: B-2 ($2,100) and B-1 alumni ($2,200) are within rounding. Alumni is unavailable to most attackers; visiting-researcher is broadly available.
- Lowest ceiling: B-2 ($12,000) beats B-1 stale-inbox ($14,500) by avoiding both the fabricated-biosafety-letter failure mode and the stale-inbox tooling stack.
- Attacker exposure trade-off: B-2 commits the attacker's real name to institutional records; B-1 stale-inbox keeps the attacker anonymous at M2 but adds the fabricated biosafety letter as a forgery artifact.

**Matrix B aggregated range: $2,100-$14,500 + 4-16 weeks**, dominated by M8 voucher cost.

**Matrix B-over-A delta: $2,000-$11,000 + 2-8 weeks**, composed of M8 ($2,000-$10,000) + M9 ($0-$1,000).

**Trace profile:** Attacker's own biometrics, real passport, real card, real phone, and real device fingerprint on file with IDV vendor for 5-10 years. Voucher's identical stack committed as a paid co-conspirator. M3 trace per chosen sub-variant. Freelance translator records at ProZ/Upwork. Institutional M365/Workspace sign-in logs for 90 days to 10 years. Fabricated biosafety letter (Path B-1 only) in provider records indefinitely.
