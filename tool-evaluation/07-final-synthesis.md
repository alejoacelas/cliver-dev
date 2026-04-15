# KYC Tool Evaluation: Final Synthesis

**Audience:** CSSWG working group members, DNA synthesis providers, biosecurity researchers  
**Basis:** 31 endpoints tested, 48 LLM+Exa searches, 134-record customer dataset, 200+ adversarial test cases across 5 KYC steps  
**Date:** April 2026

---

## 1. Executive Summary

This evaluation tested whether five priority KYC screening steps for nucleic acid synthesis orders can be automated using publicly available APIs and local-logic tools. The answer is: **partially.** About 50% of orders can be fully auto-resolved with no human involvement, at an API cost of $0.036/order. The remaining 50% require human review ranging from 1-2 minutes (quick checks) to 30+ minutes (community bio labs). The blended cost across all five steps is approximately **$2.76/order** at 1,000 orders/month, dominated almost entirely by human time, not API fees.

**Step (a) -- Address to institution.** Automatable for ~63% of orders (established universities, large pharma). ROR, Google Places, and PubMed provide strong coverage for institutions in the formal research ecosystem. The biggest gap: community bio labs and small biotechs return hard zeros across every registry and funding database. No API can verify them. Cost: $1.10/order blended. Human review: 27 hrs/month at 1,000 orders.

**Step (b) -- Payment to institution.** The cheapest and most automatable step (85% auto-pass). Stripe's `card.funding` field is the single strongest signal -- prepaid = flag. A fintech BIN denylist catches Mercury, Brex, and other neobank cards. API cost: effectively $0 (KYC-incremental cost is zero; Stripe charges are payment processing costs). Human review: 7 hrs/month. Biggest gap: wire transfers have zero automated coverage, and production-only phenomena (corporate virtual card classification, P-card AVS behavior) remain untested.

**Step (c) -- Email to affiliation.** Automatable for ~51% of orders (institutional email domains). Free email (gmail.com, 163.com, qq.com) is a soft flag, not a hard block -- it is the regional norm for Chinese, Korean, Iranian, and Russian researchers. The most alarming finding: .com impersonation of .edu domains is live (mit-edu.com registered July 2025, stanford-edu.com August 2025, both with functioning email infrastructure). ORCID self-asserted affiliations have zero verification value (0% institution-verified in testing). Cost: $1.01/order blended. Human review: 25 hrs/month. Biggest gap: common-name researchers with free email (Wei Zhang + 163.com = 9,000 OpenAlex results, impossible to disambiguate).

**Step (d) -- Residential address.** Largely subsumed by step (a). If step (a) confirms an institution at the address, the residential question is answered. Smarty's RDI field is bidirectionally unreliable (Harvard science building = Residential, NYC apartment high-rise = Commercial). Cost: $0.58/order blended. Human review: 15 hrs/month, but 50% likely redundant with step (a). Biggest gap: no automated residential classification for international addresses.

**Step (e) -- PO Box / freight forwarder / export control.** PO Box regex is essentially solved (100% precision and recall for Latin script). BIS country group screening is deterministic and correct (17/17 tested countries). Freight forwarder detection is completely unsolved -- no tested endpoint can identify a freight forwarder from a street address alone. And the **single most critical gap across all five steps**: the Consolidated Screening List API is deprecated, leaving zero automated entity-level screening against OFAC SDN and BIS Entity/Denied Persons Lists. An order to a named denied party in China would pass every working check. Cost: $0.36/order blended. Human review: 9 hrs/month.

---

## 2. Per-KYC-Step Detail

### Step (a): Address to Institution

**Flag definition (M05):** No public association between the claimed institutional affiliation and the shipping address. The order claims "MIT" but ships to an address with no connection to MIT.

**Recommended endpoint combination:**

1. **ROR API v2** (free) -- city-level institutional match, ~110K organizations, strong international coverage including non-OECD universities
2. **PubMed affiliation search** (free) -- broadest legitimacy signal, found publications for 22/25 tested institutions
3. **Google Places Text Search** ($0.032/call) -- international type classification (university, manufacturer, research_institute) when institution name is included in query
4. **LLM+Exa web search** ($0.007/call, ~20% of orders) -- coworking/incubator detection, address mismatch signals
5. **NIH RePORTER / UKRI** (free) -- supplementary funding signal for US/UK institutions

**Decision logic:** ROR city match + PubMed >100 articles + Google Places returns institutional type = auto-pass. Any failure = escalate to quick review or investigation. Exa runs on cases where primary signals are inconclusive.

**Drop from pipeline:** GeoNames (zero useful signal in testing), GLEIF (addresses reflect corporate registration, not physical operations -- Pfizer's GLEIF address is a Delaware registered agent), OSM Overpass (useful only for large university campuses, adds nothing for commercial/residential).

**Coverage map by profile group:**

| Profile Group | Fraction | Time Tier | Est. Time | Evidence Basis |
|---|---|---|---|---|
| PG-01: Established OECD academic | 35% | Auto | 0 min | ROR city match + PubMed + Google Places = university. MIT, Oxford, Scripps, Pasteur all auto-pass. 22/25 institutions found in ROR. |
| PG-02: Established non-OECD academic | 10% | Auto | 0 min | All 7 tested non-OECD universities found in ROR (Nairobi, Makerere, IIT Bombay, Tsinghua, Al-Farabi). Google Places returns university for all. |
| PG-03: Multi-campus institution | 2% | Quick review | 2-3 min | ROR finds institution but city differs. Griffith (Brisbane/Gold Coast), CSIRO (Australia-wide), CDC (multi-country). Reviewer checks for satellite campus. |
| PG-04: Large pharma / CRO | 15% | Auto | 0 min | In ROR and/or GLEIF, strong PubMed. Pfizer, Charles River, Eurofins. Google Places = manufacturer/corporate_office. |
| PG-05: Mid-size OECD biotech | 8% | Quick review | 1-2 min | Not in ROR. Google Places = premise. Quick web search confirms company. Agilent pattern. |
| PG-06: Small biotech at incubator | 3% | Investigation | 5-15 min | Zero in all registries. Exa identifies incubator (LabCentral, BioLabs, JLABS). LabCentral and BioLabs are invisible to Google Places type taxonomy. |
| PG-07: Small biotech at own address | 3% | Investigation | 10-15 min | Zero in registries, generic commercial address. Must check state incorporation, LinkedIn. "Lay Sciences" pattern: PubMed returned 12K false positives from common-word name. |
| PG-08: Community bio lab | 2% | Customer follow-up | 15-30 min | Hard zero across every registry and funding database. 5/5 tested (Genspace, BioCurious, La Paillasse, Hackuarium, BioClub Tokyo) returned nothing. Must verify biosafety setup. |
| PG-09: Government lab sub-unit | 3% | Quick review | 2-5 min | Parent agency typically in ROR; sub-unit may not be. NML not in ROR, Lincoln Lab has own record. CDC disambiguation risk: Uganda CDC returned before US CDC. |
| PG-10: Sanctioned-country institution | 3% | Auto (export control) | 0 min | Paradoxically well-covered in ROR. But step (e) catches country before step (a) matters. BIS Group E = auto-deny. |

**Cost (1,000 orders/month):**

| Metric | Value |
|---|---|
| API cost | $33/month ($0.033/order) |
| Auto-pass fraction | 63% |
| Total human hours | 26.7 hrs/month |
| Blended cost/order | $1.10 |

**Open issues:**
- PubMed keyword search produces false positives for common-word institution names (e.g., "Lay Sciences" matches 12K articles on the word "lay"). Fix: use exact affiliation field matching instead of keyword search. Proposed but not tested.
- Google Places Nearby Search for freight forwarder detection at address coordinates is the most promising lead for an unsolved problem. Proposed but not tested.
- A wet-lab coworking denylist (~50-100 addresses like LabCentral, BioLabs, JLABS) is the only viable detection method for shared lab spaces, since Google's type taxonomy has no category for these.

---

### Step (b): Payment to Institution

**Flag definition (M12 + M10):** Billing address is not associated with the claimed institution; card is a gift card or prepaid instrument.

**The critical insight:** Most legitimate researchers pay with personal cards billed to their home address. A graduate student at MIT buying reagents uses their personal Visa debit billed to their Somerville apartment. Billing-institution mismatch is the normal case, not the adversarial one. The system must tolerate soft flags and only escalate when multiple independent signals coincide.

**Recommended endpoint combination:**

1. **Stripe card.funding** (free on PaymentMethod creation) -- prepaid = hard flag. Works globally, available pre-charge.
2. **Fintech BIN denylist** (free, local) -- 9 known fintech BIN prefixes (Mercury, Brex, Relay, Ramp, Wise, Divvy). 17/17 tests passed. Soft flag, not hard reject.
3. **Billing-shipping-institution consistency** (free, local) -- three-tier comparison: pass / soft_flag / hard_flag. Requires Smarty normalization for production (naive regex broke on PMB addresses).
4. **Stripe AVS** (included in charge, US/UK/CA only) -- confirms billing address matches card issuer records. Does NOT confirm institutional affiliation.
5. **Plaid Identity Match** (supplementary, ~30% of US ACH payers) -- strongest identity signal but narrowest coverage.

**Drop from pipeline:** binlist.net as production data source (40% of BINs returned null fields, aggressive rate limiting after 5 calls). Evaluate paid BIN databases (Maxmind minFraud, Binbase) for production.

**Coverage map by payment pattern:**

| Payment Pattern | Fraction | Time Tier | Est. Time | Key Signals |
|---|---|---|---|---|
| Institutional card matching institution | 20% | Auto | 0 min | funding=credit, billing=institution, no BIN flags |
| Personal card from home (PG-13) | 55% | Auto | 0 min | funding=credit/debit, soft_flag logged but auto-pass |
| International card, non-AVS country | 10% | Auto | 0 min | funding=credit/debit, card.country matches institution |
| Prepaid / gift card | 2% | Investigation | 5-10 min | funding=prepaid = hard_flag. Check if corporate virtual card. |
| Fintech neobank card | 3% | Quick review | 1-2 min | BIN denylist match = soft_flag. Mercury/Brex normal for startups. |
| Wire transfer | 5% | Quick review | 2-5 min | Only SWIFT/BIC info. Zero automated coverage. |

**Cost (1,000 orders/month):**

| Metric | Value |
|---|---|
| API cost | ~$0/month (incremental KYC cost is zero) |
| Auto-pass fraction | 85% |
| Total human hours | 7.1 hrs/month |
| Blended cost/order | $0.28 |

**Open issues:**
- Corporate virtual cards (Ramp, Brex, Divvy) may report `card.funding=prepaid` despite being legitimate institutional purchases. Cannot confirm without production Stripe data.
- P-card (procurement card) AVS false positive rate is unknown. University finance department addresses may fail line1 match on legitimate institutional purchases.
- Wire transfer screening has zero automated coverage. For providers accepting wire transfers, originating bank name/country from SWIFT/BIC is the only signal.
- Fintech BIN denylist requires quarterly maintenance as issuers get new BIN ranges from partner banks.
- International card behavior (non-US country codes) is untested -- Stripe test mode always returns country=US.

---

### Step (c): Email to Affiliation

**Flag definition (M02 + M07):** Customer email does not match claimed institution's domain, or email is from a non-institutional domain.

**Recommended endpoint combination:**

1. **Disposable email blocklist** (free, local) -- hard block. The only reliable defense against guerrillamail, mailinator, and similar services. These services have *stronger* DMARC policies (p=reject) than IIT Kanpur, Seoul National University, and China Agricultural University.
2. **Free email blocklist** (free, local) -- soft flag. Covers gmail.com, outlook.com, 163.com, 126.com, qq.com, mail.ru, yandex.ru, naver.com, protonmail.com. Must NOT hard-block: free email is the regional norm for Chinese, Korean, Iranian, and Russian researchers.
3. **Lookalike/homoglyph detector** (free, local) -- must cover cross-TLD patterns. The real impersonation threat is `{institution}-edu.com`, not `.edu` typosquats. Tested: mit-edu.com (registered July 2025, self-hosted MX), stanford-edu.com (August 2025, Zoho MX), harvard-edu.com (2019, PrivateEmail). All have functioning email infrastructure. Meanwhile, `.edu` typosquats (rnit.edu, miit.edu) are unregistered because Educause restricts `.edu` registration.
4. **RDAP creation date** (free) -- flag .com domains <2 years old impersonating known institutions. Works for .com/.net/.org. No RDAP for .edu, .cn, .ir, .ru, .ac.uk -- the gap aligns exactly with the hardest KYC countries.
5. **ROR domain match** (free) -- direct match when populated (~50% of institutions).
6. **InCommon/eduGAIN federation** (free) -- strong for US (587 IdPs), China (573 CARSI), India (317 INFED). Sharp dropoff: Iran (2), Russia (0).
7. **LLM+Exa** ($0.007/call, ~15% of orders) -- verify obscure domains, confirm free email status.
8. **OpenAlex** (free) -- publication-backed affiliation confirmation for unique-name researchers.

**Drop from pipeline:** DMARC/SPF as a trust signal (actively misleading -- disposable services rank higher than universities). ORCID self-asserted employment (0% institution-verified in testing; an attacker can create a fake ORCID profile claiming any institution in ~5 minutes).

**Coverage map by email pattern:**

| Email Pattern | Fraction | Time Tier | Est. Time | Resolution Path |
|---|---|---|---|---|
| Institutional email matching institution | 50% | Auto | 0 min | Domain matches ROR or Exa-confirmed institutional website. berkeley.edu, ox.ac.uk, biontech.de. |
| Institutional email, domain mismatch | 3% | Quick review | 2-3 min | Dual affiliation: pasteur.fr + TheraVectys, tum.de + Fusix. |
| Free email, non-OECD norm | 10% | Quick review | 2-5 min | 163.com, qq.com, naver.com. Institution verified via ROR + PubMed. |
| Free email, OECD country | 5% | Quick review | 1-3 min | gmail.com for US/EU researcher. Why not using institutional email? |
| Sanctioned-country, no email infra | 3% | Investigation | 10-15 min | Baqiyatallah (IRGC-affiliated) has zero DNS -- no MX, no SPF, no DMARC. Free email masks affiliation entirely. Entity screening required. |
| Disposable email | <0.5% | Auto (reject) | 0 min | guerrillamail, mailinator: hard block. |
| .com impersonation of .edu | <0.5% | Auto (reject) | 0 min | Lookalike detector + RDAP age. mit-edu.com caught by both. |
| Common-name + free email (PG-11) | 5% | Investigation | 5-15 min | Wei Zhang + 163.com: 9K OpenAlex results. Must request customer evidence. |

**Cost (1,000 orders/month):**

| Metric | Value |
|---|---|
| API cost | ~$1/month |
| Auto-pass fraction | 51% |
| Total human hours | 25.3 hrs/month |
| Blended cost/order | $1.01 |

**Open issues:**
- Cross-TLD homoglyph detection is architecturally defined but not system-tested end-to-end. The threat model is confirmed (live .com impersonation domains with functioning email), but no detection system was run as an integrated endpoint.
- Identity binding is fundamentally missing. ORCID/OpenAlex verify that a person-institution association *exists* in the scholarly record, not that the requester *is* that person. ORCID OAuth login or institutional SSO is required for binding.
- LLM hallucination risk on free email + institutional queries. When queried about gmail.com affiliation with Harvard, Exa returned Harvard's "Gmail for Harvard" Google Workspace pages -- factually correct results that would lead the LLM to a wrong conclusion. Prompt mitigation designed but not validated as a system.
- InCommon MDQ returns all 14K+ entities for any query. Needs exact-domain matching implementation, not substring search.

---

### Step (d): Residential Address

**Flag definition (M04):** Shipping address is a residential address.

**Core finding: step (d) should be reframed as "institutional verification."** Rather than proving an address IS residential (negative detection), the pipeline should confirm the address IS institutional (positive confirmation). If step (a) confirms an institution at the shipping address, the residential flag is moot. If step (a) fails, that failure IS the residential signal. This means step (d) is largely subsumed by step (a).

**Recommended approach:**

1. **Run step (a) first.** Step (d) fires only when step (a) is inconclusive.
2. **Smarty RDI** (US only, $0.003/call) -- directional filter only. Bidirectionally unreliable: Harvard science building at 52 Oxford St Cambridge returns `RDI=Residential` (false positive). NYC residential high-rise at 200 E 89th St returns `RDI=Commercial` (false negative). RDI reflects USPS mail delivery infrastructure, not building occupancy.
3. **Google Places name+address** ($0.032/call, reuse from step (a)) -- strong for institutional verification, blind for residences. Address-only search returns "premise" for everything.
4. **Exa web search** ($0.007/call, ~5% of orders) -- commercial buildings detectable via real estate listings (LoopNet, CommercialCafe). Residential detection is weaker.

**Coverage map by address pattern:**

| Address Pattern | Fraction | Time Tier | Est. Time | Resolution |
|---|---|---|---|---|
| US address at known institution | 35% | Auto | 0 min | Step (a) confirmed. Smarty=Commercial + Google Places=university/manufacturer. |
| International address at known institution | 25% | Auto | 0 min | Step (a) confirmed via ROR + Google Places. |
| US address, Smarty=Residential | 5% | Quick review | 2-3 min | May be false positive (Harvard). Reviewer checks Google Places + web. |
| US residential high-rise, Smarty=Commercial | 2% | Quick review | 1-2 min | RDI misses it. Step (a) failure is the real signal. |
| International, no Smarty coverage | 15% | Quick review | 2-5 min | Google Places name+address. If institutional type returned, pass. Otherwise Exa. |
| Coworking / virtual office | 3% | Quick review | 2-3 min | WeWork/Regus detectable by Google Places. Virtual office invisible. |
| Step (a) already flagged | 10% | 0 min | 0 min | If step (a) triggered investigation, step (d) is subsumed. |

**Cost (1,000 orders/month):**

| Metric | Value |
|---|---|
| API cost | ~$2/month (Smarty only; Google Places reused from step (a)) |
| Auto-pass fraction | 70% |
| Total human hours | 14.5 hrs/month |
| Blended cost/order | $0.58 |

Note: 14.5 hrs/month is likely 50% redundant with step (a), since the same reviewer gains context about the address across both steps. Adjusted estimate: ~7-10 hrs/month incremental.

**Open issues:**
- No automated residential classification for international addresses. Google Places address-only returns "premise" globally. Smarty is US-only.
- Smarty RDI has no available fix for bidirectional unreliability. It is a fundamental limitation of using USPS delivery infrastructure as a proxy for building use.
- Community bio labs at residential addresses (e.g., former Genspace location) are legitimate customers who will always trigger both the step (a) failure and the step (d) flag. These require the customer follow-up path regardless of tool improvements.

---

### Step (e): PO Box / Freight Forwarder / Export Control

**Flag definition (M03 + M06):** Address is a P.O. Box or freight forwarder; destination country is subject to export controls.

This step bundles three operationally distinct sub-problems with radically different automation feasibility.

**Sub-problem 1: PO Box detection -- essentially solved.**

PO Box regex achieves 100% precision (0 false positives on 11 bait addresses including "Boxwood Lane" and "Polar Bear St") and 100% recall (14/14 true positives) across 7 language families, Australian/South African conventions, and US military mail codes (APO/FPO/PSC). Fullwidth Unicode (P O Box) caught via NFKC normalization. Known residual gaps: CJK (Chinese 信箱), Arabic (ص.ب), Russian (а/я) PO Box equivalents are not covered; zero-for-O substitution ("P 0 Box") bypasses the pattern. Both are low-cost fixes.

**Sub-problem 2: Export control country screening -- deterministic and correct.**

ISO country normalization: 97.4% accuracy (76/78 inputs). Custom alias table is essential -- without it, "Rossiya", "PRC", "UK", and "People's Republic of China" all fail. Safety behavior: "Korea" (no qualifier) correctly returns null with ambiguity warning rather than guessing. BIS Country Group lookup: 100% accuracy (17/17), including post-2022 Part 746 Russia/Belarus overlay.

**Sub-problem 3: Freight forwarder detection -- unsolved.**

No tested endpoint can identify a freight forwarder from a street address alone. Two multi-tenant freight buildings tested (Elmont NY with 5 freight companies, La Cienega LA with 8) returned "premise" from every API. Exa found nothing without the forwarding service name in the query. Smarty's CMRA flag (`dpv_cmra`) is systematically broken -- returned `N` for all 4 known CMRA addresses. This matters because freight forwarders are the primary mechanism for circumventing export controls: a US forwarding address makes an embargoed-country customer appear domestic.

**Recommended endpoint combination:**

PO Box: PO Box regex (every order, zero cost) + Smarty `pmb_designator` parsing (US, backup CMRA heuristic).
Export control: ISO country normalization + BIS Country Group lookup (every order, zero cost) + Consolidated Screening List (BLOCKED -- requires vendor solution).
Freight forwarder: freight forwarder address denylist (proposed, ~50-100 curated addresses) + Google Places Nearby Search with type=shipping_service (proposed, not tested).

**Coverage map:**

| Pattern | Fraction | Time Tier | Est. Time | Resolution |
|---|---|---|---|---|
| Standard OECD street address | 65% | Auto | 0 min | PO Box regex = no hit, BIS = pass. |
| Explicit PO Box (Latin script) | 2% | Auto (reject) | 0 min | Regex detects all Latin variants, 14/14 true positive. |
| Embargoed country (Group E / Part 746) | 3% | Auto (deny) | 0 min | Iran, Cuba, North Korea, Syria, Russia, Belarus: auto-deny. |
| Group D country (China, Vietnam, Pakistan) | 8% | Quick review | 2-5 min | BIS = license_required. Check institution + order contents. |
| Freight forwarder address | 1% | Investigation | 5-15 min | Invisible to all automation. Manual investigation required. |
| UPS Store / CMRA (no PMB) | 1% | Investigation | 5-10 min | Smarty CMRA broken (0/4 detected). Manual check needed. |
| CJK/Arabic/Russian PO Box | <1% | Quick review | 1-3 min | Regex misses non-Latin PO Box terms. Most order forms use Latin script. |

**Cost (1,000 orders/month):**

| Metric | Value |
|---|---|
| API cost | ~$0/month |
| Auto-pass fraction | 70% |
| Total human hours | 9.0 hrs/month |
| Blended cost/order | $0.36 |

**Open issues:**
- **Consolidated Screening List API is BLOCKED.** This is the single most critical gap across all five KYC steps. The API endpoint is deprecated (returns HTTP 301). There is zero automated entity-level screening against OFAC SDN, BIS Entity List, Denied Persons List, Unverified List, or Military End-User List. An order to a BIS Entity List entity in China -- a non-embargoed country -- would pass every working automated check. Mitigation: vendor solution ($5K-50K/year), manual CSV/XML download (free but requires building search/matching), or finding a replacement API.
- Google Places Nearby Search for freight forwarder detection at address coordinates is the most promising detection approach. The data exists in Google -- freight forwarder businesses appear with `type=shipping_service` when the keyword is used. The question is whether the Nearby Search endpoint surfaces them without keywords.
- Sub-national sanctioned territories (Crimea, Donetsk, Luhansk) are not modeled. Requires sub-national geocoding beyond country-level classification.
- ECCN x Country Chart cross-reference is not implemented -- BIS check uses country groups only, not item-specific export classification.

---

## 3. Cross-Cutting Findings

### 3.1 Shared Endpoints

Several APIs serve multiple KYC steps. Reusing results avoids redundant calls and cost:

| Endpoint | Steps Served | Reuse Strategy |
|---|---|---|
| **ROR API v2** | (a) institution verification, (c) domain matching | Single lookup per institution. Cache city, country, domains for both steps. |
| **Google Places Text Search** | (a) institutional type, (d) residential check | Single $0.032 call. Cache `primaryType` and address for both steps. |
| **Smarty US Street API** | (a) address normalization, (d) RDI, (e) CMRA/PMB | Single call per US address. Returns all fields simultaneously. |
| **Exa neural search** | (a), (b), (c), (d), (e) | Different queries per step. No reuse opportunity, but a single integration point. |
| **PubMed** | (a) institution legitimacy, (c) affiliation confirmation | Same query serves both steps. |

The optimal call sequence is: ROR + PubMed (free, fast) first, then Google Places (paid but cached), then Exa (paid, on-demand for flagged cases only). With caching, the 5 KYC steps share 3-4 API calls per order, not 15-20.

### 3.2 Shared Gaps

Three profile groups fail across multiple KYC steps simultaneously, creating compounding verification difficulty:

**Community bio labs (PG-08)** fail every automated check in every step:
- Step (a): Zero in ROR, GLEIF, Companies House. Zero in NIH/NSF/UKRI. PubMed returns 2-5 articles (likely word matches).
- Step (c): No institutional email domain. Researchers use free email.
- Step (d): May operate at residential addresses (former Genspace location).
- Combined impact: 37 minutes of human time per order. At 2% of orders, community labs consume more human time (12.3 hrs/month) than the 35% of OECD academics (0 hrs/month).

**Small biotechs at own addresses (PG-07)** fail every registry check:
- Step (a): Zero in all registries, generic commercial address.
- Step (c): May lack institutional email domain. Researcher uses free email.
- Step (b): Likely pays with fintech card (Mercury, Brex), triggering BIN denylist soft flag.
- Combined impact: 23.5 minutes per order. Often overlap with PG-12 (fintech card users).

**Common-name researchers with free email (PG-11)** create disambiguation dead-ends:
- Step (c): Wei Zhang + 163.com = 9,085 OpenAlex results. Impossible to match without customer-provided evidence.
- Step (a): Institution may auto-pass (researcher at Tsinghua), but email verification cannot confirm the requester is actually affiliated.
- Combined impact: 10 minutes per order. Sensitive to customer mix -- a provider with heavy Chinese academic business could see this at 10% instead of 5%.

### 3.3 The "Hard Customers" List

These profile groups cannot be reliably verified by any available tool combination. For each, the working group needs to decide whether the gap is acceptable, whether the standard should change, or whether new tools are required.

**1. Community bio labs (PG-08) -- 2% of orders, 37 min each**

Who: Genspace, BioCurious, La Paillasse, Counter Culture Labs, BioClub Tokyo. Non-profit or informal organizations operating shared wet-lab spaces for citizen scientists and biohackers.

Why hard: They exist outside the formal research ecosystem entirely. No institutional registry coverage (not universities or corporations). No government research funding. No institutional email domain. May operate at residential or atypical addresses. Their legitimacy comes from community reputation, IBC registration, and biosafety training programs -- none of which are queryable via API.

Fallback: Customer follow-up requesting IBC registration documentation, biosafety protocols, and membership verification. Or maintain a curated allowlist of known community bio labs (~20-50 globally). Or accept the gap and apply enhanced scrutiny to every community lab order.

**2. Small biotechs at own addresses with no web presence (PG-07) -- 3% of orders, 23.5 min each**

Who: Early-stage companies at generic commercial addresses. Not in any registry, insufficient publications for PubMed signal, no incubator address to flag. "Lay Sciences" pattern.

Why hard: Indistinguishable from a shell entity. State incorporation records exist but are not queryable via a single API across jurisdictions. The company's web presence may be a single-page website or nothing at all.

Fallback: Investigation via state incorporation records + LinkedIn + web search. This is manual and slow. OpenCorporates would help here if the API were accessible (BLOCKED -- requires paid account, covers 140+ jurisdictions).

**3. Sanctioned-country institution researchers using free email (PG-10 x PG-11) -- ~1% of orders**

Who: Researcher at a sanctioned institution (e.g., Baqiyatallah, Malek Ashtar) using yahoo.com or gmail.com. The institution has zero email infrastructure in public DNS.

Why hard: Step (c) is completely blind -- free email reveals nothing about affiliation. Step (e) catches the country (if embargoed), but Group D countries (China, Pakistan) proceed through. And entity-level screening is BLOCKED. A researcher at a BIS Entity List institution in a Group D country who uses free email would pass every working automated check.

Fallback: Entity-level screening (requires vendor solution or CSV download). Alternatively: customer-provided evidence of institutional affiliation, cross-referenced against known sanctioned entity lists.

**4. Researchers with common names across all profile groups (PG-11) -- 5% of orders, 10 min each**

Who: Wei Zhang, Maria Garcia, Qiang He, Shuvankar Dey. Names with thousands of results in ORCID and OpenAlex.

Why hard: Name-based disambiguation is impossible without additional signals. OpenAlex returns 9,085 results for Wei Zhang. ORCID returns 3,304. Filtering by institution helps for unique institutions but fails for common ones (Chongqing Medical University + Qiang He = 7 different people).

Fallback: Request customer-provided ORCID ID, then verify via ORCID OAuth (confirms the requester controls the ORCID account, not just that a matching record exists). Or request a publication DOI and verify the affiliation metadata. This shifts the burden to the customer.

---

## 4. LLM+Search as Alternative

Exa neural search was tested across all 5 KYC steps as a standalone alternative to structured APIs. 48 searches were executed at $0.007/call ($0.336 total), averaging 1.7 seconds per call.

### Per-step comparison

**Step (a) -- Address to institution: Exa is a strong complement, not a replacement.**

Exa excels at tasks no structured API can do: identifying that 700 Main St Cambridge is LabCentral (incubator), detecting that Genspace has moved from 150 Broadway to 132 32nd St Brooklyn, cross-referencing a claimed entity against the actual occupant at an address. These are uniquely valuable KYC signals. However, ROR + PubMed + Google Places provide faster, cheaper, and more reliable coverage for the ~63% of orders at established institutions. Exa's value is on the ~20% of orders where primary signals are inconclusive.

**Step (b) -- Payment to institution: Exa is inferior to direct registry APIs.**

Exa confirmed Pfizer via SEC EDGAR filings and BioNTech via investor relations pages. But this information is more reliably obtained from corporate registry APIs (Companies House, SEC EDGAR) that happen to be in Exa's index. For billing entity verification, direct API calls are preferable. Exa's test set was small (3 cases), and a fictional "Helix Therapeutics Inc." created a name collision with a real company -- a hallucination risk.

**Step (c) -- Email to affiliation: Exa's strongest step and most dangerous.**

10/12 cases passed. Exa correctly verified institutional domains (.edu, .ac.uk, .de, .africa) and correctly rejected free email providers (163.com, qq.com, mail.ru). But the Harvard/Gmail hallucination case is critical: when queried about gmail.com + Harvard, Exa returned Harvard's "Gmail for Harvard" Google Workspace pages. The search results are factually correct but misleading for the flag question. A naive LLM would conclude that gmail.com is associated with Harvard because Harvard uses Google Workspace. The prompt must explicitly instruct: "If the email domain is a known free provider, the answer is CANNOT VERIFY regardless of search results." This risk makes Exa a supplement to the static blocklists, not a replacement.

**Step (d) -- Residential address: Exa is a fallback only.**

Commercial buildings are detectable through real estate listing sites in Exa's index. Residential detection is weaker. For the binary commercial/residential classification, Smarty RDI (despite its flaws) is faster and cheaper for US addresses. Exa adds value only for ambiguous cases and international addresses where Smarty has no coverage.

**Step (e) -- PO Box / freight forwarder: Exa fails at the hard part.**

PO Box detection is trivial (regex is sufficient -- no API call needed). Freight forwarder detection from address alone is Exa's weakest use case. The Fresno Shipito address (1396 W Herndon Ave) was not identified without "Shipito" in the query. The Sacramento UPS Store was not found at all. This step requires dedicated databases (CMRA list, freight forwarder denylist), not web search.

### Cost comparison

| Approach | Cost per verification | Monthly (1K orders) | Coverage |
|---|---|---|---|
| Structured APIs only | $0.036 | $36 | ~63% auto-pass |
| LLM+Exa only (all 5 steps) | $0.035-0.070 + LLM inference | $35-70 + LLM | ~45% auto-pass (lower due to latency and hallucination risk) |
| Structured APIs + Exa on flagged cases | $0.036-0.043 | $36-43 | ~63% auto-pass + improved investigation quality |

Note: The Exa cost estimate does not include LLM inference cost for interpreting results. Depending on the model used, the total cost per Exa-based verification may be 5-10x the search cost alone.

### Overall verdict

LLM+Exa is a **strong complement** to structured APIs for the ~37% of orders that don't auto-pass. It provides three capabilities no structured API offers: (1) coworking/incubator identification, (2) entity-address cross-referencing and mismatch detection, and (3) web intelligence on entities too small or too new for registries. It is **not viable as a replacement** for structured APIs on the auto-pass population, where ROR + PubMed + Stripe card.funding provide faster, cheaper, and more deterministic results. The hallucination risk on step (c) means it cannot be used without careful prompt engineering and guardrails.

---

## 5. Credential Gaps and Next Steps

### Blocked endpoints

**1. Consolidated Screening List (CRITICAL PRIORITY)**

Status: API endpoint deprecated, returns HTTP 301 redirect to HTML. No entity-level screening available.

Impact: No automated check against OFAC SDN, BIS Entity List, Denied Persons List, Unverified List, or Military End-User List. A named denied party in a non-embargoed country passes every working check. This is the single most critical gap across all 5 KYC steps.

What would change: Entity-level screening would close the gap for PG-10 (sanctioned-country institutions in Group D countries) and catch specific denied persons in otherwise-clean countries. It would also provide the missing link between step (e) export control and the specific entity, not just the country.

Next steps (in priority order):
1. Check if trade.gov has published a replacement API endpoint (the v1 API may have migrated to a v2 location).
2. Download the bulk CSV/XML from sanctionslist.ofac.treas.gov and build local search logic with fuzzy name matching. Free, but requires maintenance and lacks real-time updates.
3. Evaluate vendor solutions: Visual Compliance, Descartes MK Denied Party Screening, SAP GTS. Range: $5K-50K/year depending on volume and features. Provides maintained data, real-time updates, and fuzzy matching.

**2. OpenCorporates (HIGH PRIORITY)**

Status: API returns 401 "Invalid Api Token." Free-tier unauthenticated access no longer supported. Requires paid account.

Impact: Cannot verify small/mid-size companies across 140+ jurisdictions. Currently only Companies House (UK only) provides corporate registry data. PG-07 (small biotech at own address) investigation time is 10-15 minutes partly because there is no multi-jurisdiction corporate registry lookup.

What would change: Would reduce PG-07 investigation time from 10-15 min to 3-5 min by providing incorporation date, registered address, company status, and SIC codes across many countries.

Next steps: Evaluate OpenCorporates pricing for API access. Alternative: use web scraping of opencorporates.com for manual lookups (still works), or evaluate paid alternatives (Dun & Bradstreet, Bureau van Dijk/Orbis).

### Docs-only endpoints

**3. Stripe AVS (production) -- MEDIUM PRIORITY**

Status: Test mode AVS is deterministic and does not reflect real issuer behavior. Production credentials required.

Impact: Cannot measure AVS unavailable rate by country/region, P-card false positive rate, or corporate virtual card funding type classification. The direction of all findings is known from documentation review; magnitude is not.

What would change: Would quantify the ~40-60% unavailability estimate for non-US/UK/CA cards. Would reveal whether university P-cards systematically fail AVS line1. Would confirm whether Ramp/Brex/Divvy cards report as prepaid.

Next steps: Set up a live production Stripe account with a small test transaction volume. Or partner with an existing synthesis provider who uses Stripe to analyze anonymized AVS response data.

**4. Plaid Identity Match (production) -- LOW PRIORITY**

Status: Sandbox returns synthetic data with binary 0/100 scores. Real score distributions exist only in production.

Impact: Cannot calibrate match thresholds for edge cases (nicknames, middle names, apartment number differences). Cannot measure actual bank coverage rate (~30% estimated from documentation). The UX friction of Plaid Link during checkout may cause abandonment.

What would change: Would provide continuous scoring curves for threshold calibration. Would measure real bank coverage for biotech researchers specifically. Would quantify checkout abandonment rate.

Next steps: Requires production Plaid account + real bank connections. Highest barrier to entry of all endpoints. Consider deferring until other payment signals (card.funding, BIN denylist, billing consistency) are validated in production. Plaid may be unnecessary if those three cover the decision space.

### Priority order for credential acquisition

1. **Consolidated Screening List** -- critical gap, no workaround for entity-level screening
2. **OpenCorporates** -- high impact on PG-07 investigation time, 140+ jurisdiction coverage
3. **Stripe AVS production** -- medium impact, quantifies existing estimates
4. **Plaid Identity Match production** -- low priority, supplementary signal only

---

## 6. Open Questions for the Working Group

### 6.1 Ambiguous flag definitions

**What counts as "association" between an address and an institution?**

The M05 flag reads "no public association between affiliation and shipping address." In practice, this requires a chain of inference: (1) verify the institution exists (ROR), (2) verify it has research activity (PubMed), (3) verify it has a presence at or near the shipping address (Google Places + Exa). No single API answers the question directly. The working group should clarify:

- Is city-level match sufficient (ROR provides this), or is street-level required?
- For multi-campus institutions (Griffith University: Brisbane and Gold Coast campuses, 76 km apart), does any campus count?
- For university-affiliated hospitals and satellite facilities that are nearby but at different addresses, does proximity count?

**What does "non-institutional domain" mean for countries where free email is the norm?**

The M02 flag reads "does not match institution domain / non-institutional domain." But Chinese researchers routinely use 163.com/qq.com, Korean researchers use naver.com, Iranian researchers use yahoo.com -- because their institutions either lack email infrastructure or their institutional email doesn't work outside the country. Hard-blocking free email would reject 20-40% of legitimate non-OECD orders. The working group should define:

- Is free email a hard flag, a soft flag, or a regional exception?
- Should the standard differentiate by country (free email acceptable for China/Iran, flagged for US/UK)?
- If free email is a soft flag, what additional evidence clears it?

**How should the residential address flag interact with other steps?**

Our testing showed that step (d) is largely subsumed by step (a). If step (a) confirms an institution at the address, the residential question is moot. If step (a) fails, the failure IS the residential signal. The working group should decide:

- Should step (d) be a standalone flag, or a consequence of step (a) failure?
- Is a residential address always a flag, or only when combined with other signals (e.g., residential address + free email + no institutional match)?

### 6.2 Structural gaps no tool can address

**Identity binding.** Every tool we tested verifies that an association exists between an entity and an institution -- not that the requester IS that entity. ORCID and OpenAlex confirm that "Wei Zhang at Tsinghua" exists in the scholarly record. They do not confirm that the person placing the order is Wei Zhang. Closing this gap requires ORCID OAuth (the requester proves they control the ORCID account), institutional SSO (the requester proves they can authenticate with the institution's identity provider), or email verification to an institutional address. All of these shift burden to the customer and require integration work by the provider.

The working group should decide: does the standard require identity binding, or just association verification? If identity binding, which mechanism is acceptable?

**Entity-level screening without an API.** The Consolidated Screening List API is deprecated. The bulk data download is available but requires building fuzzy name matching logic (critical for transliterated names -- "Mohamad" vs "Mohammad" vs "Mohammed"). Commercial vendors exist but cost $5K-50K/year. The working group should decide: is entity-level screening a mandatory requirement? If so, should the standard specify a minimum acceptable approach (e.g., monthly CSV download) or leave implementation to the provider?

**Freight forwarder detection.** No publicly available API can identify a freight forwarder from a street address. The only viable approaches are (1) a curated denylist of ~50-100 known forwarding addresses, requiring quarterly maintenance, and (2) a Google Places Nearby Search workaround that was proposed but not validated. The working group should decide: is freight forwarder detection a hard requirement, or an aspirational goal? If required, who maintains the denylist?

### 6.3 Cases where the flag triggers but the follow-up action is unclear

**Group D country orders.** BIS returns "license_required" for China, Pakistan, Vietnam, UAE, India. This is not an auto-deny. The follow-up depends on whether the ordered items require an export license (ECCN classification) and whether the end-user is a denied party (entity screening, BLOCKED). Without ECCN classification logic and entity screening, the provider knows the country requires scrutiny but cannot complete the assessment. The standard should clarify what a provider must do at the "license_required" disposition.

**Prepaid cards that might be corporate virtual cards.** Stripe `card.funding=prepaid` is the primary gift card detection signal. But corporate virtual cards (Ramp, Brex, Divvy) may also report as prepaid. Hard-blocking prepaid would reject legitimate institutional purchases from companies that use virtual card platforms. The standard should clarify: is prepaid a hard reject, or a flag requiring additional verification?

**Community bio labs with zero automated verification.** Every check returns zero. The customer is legitimate (a biosafety-trained citizen scientist at a registered community lab), but no automated tool can confirm this. The standard should define: what evidence is sufficient for community bio labs? IBC registration? Biosafety training certificates? Membership in a recognized network (DIYbio.org)?

### 6.4 Cost and burden implications for providers of different sizes

The blended cost of $2.76/order (API + human time) is manageable for a provider processing 1,000+ orders/month. But the human time scales linearly while API costs are negligible. Key considerations:

| Provider Size | Orders/Month | Est. Monthly KYC Cost | FTE Equivalent |
|---|---|---|---|
| Small (startup) | 100 | ~$276 | 0.04 FTE (7 hrs) |
| Medium | 1,000 | ~$2,760 | 0.4 FTE (68 hrs) |
| Large | 10,000 | ~$27,600 | 4.0 FTE (680 hrs) |

The ~14% of orders requiring investigation or customer follow-up drive nearly all the cost. A provider with a disproportionate share of small-biotech or community-lab customers (e.g., an iGEM-adjacent supplier) would face significantly higher per-order costs.

The sensitivity analysis shows worst-case costs (provider serving primarily startups and Chinese academics) reaching $4,200/month at 1,000 orders -- roughly 1.5x the base case. This is driven by PG-08 (community bio labs at 37 min/order), PG-07 (small biotechs at 23.5 min/order), and PG-11 (common-name researchers at 10 min/order).

The working group should consider:
- Should the standard include a tiered implementation based on provider size?
- Are the "hard customer" groups (community labs, small biotechs) common enough to warrant standard-level guidance on verification procedures, or is this left to provider discretion?
- Should community tools (shared denylists, shared allowlists of verified community labs) be a working group deliverable?

---

## Appendix: Detailed Source References

All findings in this document are drawn from the following stage outputs, which contain the full test data, API responses, and adversarial testing details:

- **Endpoint manifest:** `tool-evaluation/00-endpoint-manifest.yaml` -- 31 endpoints with status, cost, auth requirements
- **Credential check:** `tool-evaluation/00-credential-check.md` -- live test results for all endpoints
- **Per-step assessments:** `tool-evaluation/assessments/{a,b,c,d,e}-*.md` -- field-level analysis per KYC step
- **Adversarial review finals:** `tool-evaluation/adversarial-reviews/{group}-final.md` -- 9 endpoint groups, unresolved findings
- **LLM+Exa results:** `tool-evaluation/results/llm-exa.md` -- 48 neural search test cases
- **BOTEC cost synthesis:** `tool-evaluation/06-cost-coverage-synthesis.md` -- profile group inventory, fraction estimates, per-step cost tables, cross-step rollup, sensitivity analysis
