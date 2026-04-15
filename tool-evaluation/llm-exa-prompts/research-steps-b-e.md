# LLM+Exa Prompt Research: Steps (b) and (e)

**Purpose:** Identify what the LLM+Exa prompts should focus on for KYC steps (b) and (e), based on known coverage gaps in the structured API endpoints.

**Key principle:** LLM+Exa is complementary coverage. Its prompts should target the specific failure modes where structured APIs return nothing, return ambiguous data, or are systematically broken. The prompts should NOT duplicate what structured endpoints already do well.

---

## Step (b): Payment to Institution

**Flag:** "Billing address not associated with the institution; gift card BIN."

### 1. Coverage gaps from structured APIs

The structured API stack for step (b) has three working layers and two significant blind spots:

**What works well (do NOT replicate in LLM+Exa):**
- Stripe `card.funding` reliably returns credit/debit/prepaid. `funding=prepaid` is the single strongest BIN signal. 6/6 test tokens behaved deterministically.
- Fintech BIN denylist catches Mercury (533248, 535332), Brex (556150, 531993), Relay (556272), Ramp (547302), Wise (535522, 552742), Divvy (541735). 17/17 tests passed with zero false positives.
- Billing-institution consistency check works for 7/8 address comparison scenarios.

**What fails (target these in LLM+Exa):**

1. **Wire transfer screening has zero automated coverage.** For providers accepting wire transfers, the only available data is originating bank name and country from SWIFT/BIC. No structured endpoint validates whether the sending bank or account is associated with the claimed institution. The final synthesis estimates 5% of orders use wire transfer.

2. **Billing entity name verification is weak.** The structured APIs verify card type and address consistency but never verify the billing entity name. When a customer claims to be "Acme Biologics" paying by credit card, no structured endpoint confirms whether "Acme Biologics" is a real entity, whether it is associated with the claimed institution, or whether the billing name matches any known corporate registry entry. The LLM+Exa test found Pfizer and BioNTech confirmable through SEC EDGAR and investor relations pages, but a fictional "Helix Therapeutics Inc." created a name collision with a real, unrelated company (seed case 8, adv-8).

3. **binlist.net is unreliable as a sole BIN data source.** 40% of tested BINs returned 200 with null/empty fields. BIN 411111, commonly cited as a US Visa test BIN, mapped to a Polish fintech (Conotoxia) due to BIN reassignment. 11 fintech/prepaid BINs were untestable due to aggressive rate limiting (HTTP 429 after 5 calls). The fintech denylist backstops this, but there is no way to identify unknown/new fintech issuers whose BIN prefixes are not on the denylist.

4. **International card behavior is completely untested.** Stripe test mode always returns `country=US`. Whether `card.country` mismatch between the card's issuing country and the institution's country is a reliable signal is unvalidated. For a global synthesis provider, this is significant.

5. **Corporate virtual cards may false-flag as prepaid.** Ramp, Brex, and Divvy virtual cards may report `card.funding=prepaid` despite being legitimate institutional purchases. This cannot be confirmed without production Stripe data. The LLM+Exa prompt should help distinguish "legitimate corporate virtual card from a known fintech" from "anonymous prepaid gift card."

6. **PMB/suite designators break naive address parsing.** Mercury's virtual address "548 Market St PMB 82560, San Francisco" was incorrectly hard-flagged (expected soft_flag) because the PMB designator confused the regex parser (seed case 8). Smarty integration fixes this for US addresses, but international address comparison has no reliable solution.

### 2. Cases LLM+Exa is already known to handle well (step b)

From the existing 48-search test:

- **Large public companies with SEC/investor filings.** Pfizer confirmed via SEC EDGAR ("Mailing Address 66 HUDSON BOULEVARD EAST NEW YORK NY 10001-2192"). BioNTech confirmed via German Impressum page (legal requirement for German companies). Exa reliably surfaces corporate registry data that happens to be in its web index.
- **Verifying that a billing entity is a real company.** When the entity exists, Exa can cross-reference the name against corporate registration records, investor relations pages, and business directories.

### 3. Cases LLM+Exa is already known to fail on (step b)

- **Name collisions.** "Helix Therapeutics Inc." (fictional entity at LabCentral) produced an ambiguous result because a real, unrelated Helix Therapeutics (HIV/AIDS biotech, Series A, $4.06M raised) exists. Exa found the real company and an LLM might incorrectly match the billing entity to this unrelated company (adv-8, result: AMBIGUOUS).
- **Only 3 step (b) cases were tested.** The test set is too small to draw strong conclusions. Billing entity data is rarely available on the public web for non-public companies.
- **Exa is inferior to direct registry APIs for corporate verification.** SEC EDGAR, Companies House, and similar registries are more reliable when queried directly. Exa adds value only for jurisdictions without API access or when the registry API is blocked (OpenCorporates returned 401).

### 4. Proposed focus areas for the step (b) prompt

The LLM+Exa prompt for step (b) should focus on cases where the structured BIN/address stack produces no signal or a soft flag that needs resolution:

**Primary focus: Billing entity verification for flagged orders**
- When `card.funding=prepaid` or fintech BIN denylist triggers, the prompt should instruct the LLM to search for the billing entity name in corporate registries, business directories, and company databases.
- The key question: "Is [billing entity name] a real company associated with [claimed institution name] or [institution address]?"
- This is the only automated way to distinguish "prepaid card from a legitimate corporate virtual card program at a known company" from "anonymous prepaid gift card."

**Secondary focus: Wire transfer originating bank validation**
- When the payment method is wire transfer, the prompt should search for the originating bank name to determine whether it is (a) a real bank, (b) located in a country consistent with the claimed institution, and (c) a bank commonly used by the type of institution claimed.
- Example: an order claiming to be from the University of Tokyo, paid via wire transfer from Mizuho Bank (a major Japanese bank), is consistent. An order claiming to be from the University of Tokyo, paid via wire transfer from a bank in the Cayman Islands, is a flag.

**Tertiary focus: Fintech issuer identification for unknown BINs**
- When binlist.net returns empty data (40% of the time) and the BIN is not on the fintech denylist, the LLM could search for the BIN prefix to determine the issuing institution. This is a speculative use case -- it is unclear whether BIN-to-issuer data is reliably available via web search.

### 5. Known pitfalls to guard against (step b)

1. **Name collision hallucination.** The Helix Therapeutics case demonstrates that common company names produce false matches. The prompt must instruct the LLM: "If the search finds a company with the same name but at a different address or in a different industry, this is NOT confirmation. Report the mismatch explicitly."

2. **Stale corporate registry data.** Companies move, rename, merge, and dissolve. SEC EDGAR filings reflect the address at filing time, which may be years old. The prompt should instruct the LLM to note the date of the most recent evidence found.

3. **Overconfidence on thin evidence.** A single business directory listing is weaker evidence than an SEC filing or a government registry. The prompt should require the LLM to cite the source type (government filing, business directory, company website, social media) and adjust confidence accordingly.

4. **The "billing entity vs. cardholder" distinction.** In academic purchases, the billing entity may be "University of X" (institutional card), "John Smith" (personal card), or "Mercury Technologies Inc." (fintech card). The prompt must not assume the billing entity name matches the institution name -- personal card payments are the norm for academic researchers.

5. **Virtual card provider names in billing entity field.** If the billing entity is "Ramp Financial" or "Brex Inc." rather than the actual company, the LLM should recognize these as fintech card issuers, not the end institution.

### 6. Draft input/output schema (step b)

**Input fields:**

```yaml
billing_entity_name: "Acme Biologics LLC"         # from payment form
billing_address: "548 Market St PMB 82560, SF, CA" # from payment form
claimed_institution: "Stanford University"          # from order form
institution_address: "450 Serra Mall, Stanford, CA" # from order form or ROR
card_funding_type: "prepaid"                        # from Stripe (credit/debit/prepaid)
fintech_bin_match: "Mercury"                        # from denylist (null if no match)
payment_method: "card"                              # card | wire_transfer | ach
wire_originating_bank: null                         # bank name if wire transfer
wire_originating_country: null                      # ISO country code if wire transfer
billing_consistency_result: "soft_flag"             # from consistency check (pass/soft_flag/hard_flag)
```

**Output schema:**

```yaml
verdict: "flag" | "pass" | "inconclusive"
confidence: "high" | "medium" | "low"
billing_entity_verified: true | false | null
billing_entity_evidence:
  - source: "SEC EDGAR filing"
    date: "2025-03-15"
    finding: "Acme Biologics LLC registered at 548 Market St, San Francisco"
  - source: "California Secretary of State"
    date: "2026-01-10"
    finding: "Active LLC, formed 2022"
institution_association: "confirmed" | "unconfirmed" | "contradicted"
institution_association_evidence: "Acme Biologics has no documented connection to Stanford University"
risk_factors:
  - "Billing entity address is a known virtual office (548 Market St PMB = Mercury virtual address)"
  - "Prepaid card funding type"
name_collision_warning: false
sources_checked:
  - "SEC EDGAR"
  - "California SOS business search"
  - "LinkedIn"
```

---

## Step (e): PO Box / Freight Forwarder / Export Control

**Flag:** "P.O. Box; freight forwarder address."

### 1. Coverage gaps from structured APIs

Step (e) bundles three sub-problems with radically different automation levels. The structured API stack is strong on two and completely broken on the third.

**What works well (do NOT replicate in LLM+Exa):**

- **PO Box regex: essentially solved.** 100% precision (0 FP on 11 bait addresses), 100% recall (14/14 TP) across 7 language families, Australian/South African conventions, and US military mail codes (APO/FPO/PSC). Fullwidth Unicode caught via NFKC. The regex handles the detection; the LLM+Exa prompt should not re-detect PO Boxes.
- **BIS Country Group screening: deterministic and correct.** 17/17 tested countries classified correctly, including Part 746 Russia/Belarus overlay. ISO normalization at 97.4% accuracy with safe failure on ambiguous inputs ("Korea" returns null, not a guess). The country-level export control check is reliable.

**What partially works:**

- **CJK/Arabic/Russian PO Box equivalents bypass the regex.** Chinese 信箱, Arabic ص.ب, Russian а/я, Turkish P.K. are not detected (cases 33-35). Estimated impact: 20-40% of customers in non-covered-language countries, though most synthesis order forms use Latin script. LLM+Exa could potentially detect these since the LLM understands non-Latin scripts.
- **PO Box obfuscation bypasses the regex.** "P 0 Box" (zero-for-O, case 30) and "Post Office Lock Box" (creative rewording, case 31) are not detected. These are known low-cost regex fixes but represent the kind of creative evasion an LLM could catch via semantic understanding.

**What completely fails (primary LLM+Exa target):**

1. **Freight forwarder detection from street address alone: UNSOLVED.** This is the weakest area across the entire pipeline. No tested endpoint can identify a freight forwarder from a street address.
   - Shipito at 1396 W Herndon Ave, Fresno: Exa found nothing freight-related without "Shipito" in the query (adv-3, result: WEAK_FAIL). WITH "Shipito" in the query, detection was easy (adv-18, result: FLAG_DETECTED).
   - UPS Store at 8950 Cal Center Dr Suite 208, Sacramento: Exa found nothing. LoopNet showed it as an office building. The UPS Store tenant was invisible (adv-8, result: WEAK_FAIL).
   - Google Places returns `premise` for freight forwarder buildings (Elmont NY with 5 freight companies, La Cienega LA with 8) when searched by address only.
   - Smarty `dpv_cmra` flag returned `N` for ALL 4 tested CMRA addresses. The flag is systematically broken.

2. **CMRA (Commercial Mail Receiving Agency) detection: BROKEN.** Smarty's `dpv_cmra` flag -- the only structured endpoint for this -- returned `N` for every tested UPS Store/PMB address. The backup heuristic (Smarty `pmb_designator` parsing) works only when the customer explicitly includes "PMB" in the address. CMRA addresses using suite numbers instead of PMB are invisible.

3. **Consolidated Screening List API is BLOCKED (deprecated, HTTP 301).** Zero automated entity-level screening against OFAC SDN, BIS Entity List, Denied Persons List, Unverified List, or Military End-User List. The final synthesis calls this "the single most critical gap across all 5 KYC steps." An order to a BIS Entity List entity in China (Group D, not embargoed) would pass every working check.

4. **Sub-national sanctioned territories (Crimea, Donetsk, Luhansk) are not modeled.** Country-level screening cannot distinguish a Crimean address from a general Russian or Ukrainian address.

### 2. Cases LLM+Exa is already known to handle well (step e)

From the existing 48-search test:

- **Named forwarding services when the name is included.** MyUS at 1501 E Concord St Orlando was detected when "MyUS" was in the query (adv-16, FLAG_DETECTED). Shipito at 1396 W Herndon Ave was detected with "Shipito" in the query (adv-18, FLAG_DETECTED). The data exists in Exa's web index for named services.
- **Coworking space detection at known addresses.** WeWork at 115 Broadway (adv-2, FLAG_DETECTED), Regus at 1201 Third Ave Seattle (adv-6, FLAG_DETECTED), Galvanize at 44 Tehama St SF (adv-19, FLAG_DETECTED). All correctly identified as coworking/virtual office.
- **PO Box detection from address string.** Trivially detected (seed case 10) -- but this is redundant with regex and should NOT be done via LLM+Exa.

### 3. Cases LLM+Exa is already known to fail on (step e)

- **Freight forwarder addresses without service name: WEAK_FAIL.** Shipito's Fresno address (1396 W Herndon Ave) was not identified as a freight forwarder when searched by address alone (adv-3). The search returned MapQuest results and nearby UPS Stores but nothing specific to the freight forwarder at that address.
- **UPS Store / CMRA addresses: WEAK_FAIL.** 8950 Cal Center Dr Suite 208 Sacramento was not identified as a UPS Store (adv-8). Exa's index does not contain CMRA-specific location data for individual UPS Store branches by address.
- **"Absence of evidence" reasoning.** For the MIT baseline (seed case 1, step e), Exa returned results about nearby USPS/FedEx locations, not about 77 Mass Ave itself. The LLM must reason from absence of evidence ("no results showing this is a freight forwarder") rather than positive confirmation ("results confirming this is NOT a freight forwarder"). This reasoning mode is inherently less reliable.
- **Noisy tangential results.** For Pfizer at 66 Hudson Blvd (seed case 2, step e), results included "Hudson's Worldwide Logistics" -- a freight forwarder with "Hudson" in the name but at a different address. Generic NYC virtual office providers also appeared. The results are tangentially related but do not answer the flag question, creating hallucination risk.

### 4. Proposed focus areas for the step (e) prompt

The LLM+Exa prompt for step (e) should focus exclusively on the unsolved problem: freight forwarder and CMRA detection. It should NOT attempt PO Box detection (regex does this) or country-level export control (BIS lookup does this). It should also cover non-Latin PO Box detection and entity-level screening as secondary capabilities.

**Primary focus: Freight forwarder / re-shipping service detection**

This is the single weakest area in the entire pipeline. The prompt should instruct the LLM to:

1. **Search for the address itself** to determine what businesses operate there. The key signal is whether the address hosts multiple shipping/logistics/forwarding companies, or is known as a re-shipping hub.

2. **Search for the building/complex name** if a multi-tenant building is identified. Many freight forwarder clusters operate in the same building. If one freight forwarder is found at the address, that building should be flagged even if the customer's specific suite is not a forwarder.

3. **Search for the customer's suite/unit number + address** to identify if the specific tenant is a known forwarding service. Some forwarding services like Shipito allocate suite numbers to customers (e.g., "Suite 200" at 1396 W Herndon Ave is Shipito's customer numbering).

4. **Search for known freight forwarder characteristics** at the address: "package forwarding", "mail forwarding", "international shipping", "re-shipping". The Exa tests showed that including freight-related keywords in the query surfaces the data that address-only searches miss.

5. **Identify virtual office providers.** Some addresses that are not traditional freight forwarders still serve as mail-forwarding services (Regus virtual offices, iPostal1, Earth Class Mail). The LLM should recognize these.

**Secondary focus: Non-Latin PO Box detection**

The regex cannot catch Chinese 信箱, Arabic ص.ب, Russian а/я, or Turkish P.K. The LLM can understand non-Latin scripts and detect PO Box equivalents semantically. The prompt should instruct the LLM:

- "If the address contains non-Latin characters, check whether any portion is a PO Box equivalent in that language."
- Provide a reference list of common non-Latin PO Box terms: 信箱 (Chinese), 私書箱 (Japanese), ص.ب (Arabic), а/я (Russian), P.K. (Turkish), 사서함 (Korean).

**Tertiary focus: Entity-level screening (partial gap-fill for blocked CSL API)**

While the Consolidated Screening List API is blocked and a proper solution requires a vendor product or CSV download, the LLM+Exa prompt could provide a lightweight first-pass check:

- "Is [institution name] or [individual name] on any publicly accessible sanctions list, denied party list, or export control entity list?"
- This is NOT a replacement for proper screening -- web search cannot provide the comprehensive, real-time coverage of a maintained sanctions database. But it can catch the most prominent sanctioned entities (those with significant media coverage or public listing pages).
- The prompt must explicitly state: "A negative result (no sanctions found) does NOT constitute clearance. It only means no publicly searchable web evidence was found."

### 5. Known pitfalls to guard against (step e)

1. **"No evidence found" != "clean."** The most dangerous failure mode for step (e) is the LLM concluding "I found no evidence this is a freight forwarder, so it's clean." The Shipito Fresno case (adv-3) demonstrates that the absence of web search results does NOT mean the address is not a freight forwarder. The prompt must explicitly instruct: "If you find no information about what operates at this address, the verdict is INCONCLUSIVE, not PASS."

2. **Name-in-query dependency.** Freight forwarders are findable when their name is in the query but invisible when searched by address alone. The prompt cannot include the freight forwarder name (the whole point is that we don't know it's a forwarder). The prompt must rely on address-based and keyword-based search strategies.

3. **Tangential name matches create hallucination risk.** "Hudson's Worldwide Logistics" appeared in results for Pfizer's 66 Hudson Blvd address because "Hudson" matched. The prompt must instruct: "Only count evidence where the address in the search result matches the queried address. Do not flag based on business names that contain a word from the address."

4. **Virtual office listings flood results.** Searching "[address] virtual office mail forwarding" may surface generic virtual office marketplace results (Regus, WeWork, Davinci) that list available virtual offices in the same city but NOT at the specific address. The prompt must instruct: "Only flag results where the freight forwarding or virtual office service is specifically AT the queried address, not nearby or in the same city."

5. **Multi-tenant building false positives.** A large commercial building may host one freight forwarder among hundreds of tenants. If the customer is a legitimate tenant (e.g., a biotech company) at the same building, flagging the entire building would create false positives. The prompt should instruct the LLM to note the co-location but distinguish between "the customer's specific suite is a forwarder" and "there is a forwarder elsewhere in the same building."

6. **Hallucination on sanctions/entity screening.** This is the highest-stakes hallucination risk. The LLM might "recall" that an entity is sanctioned based on training data rather than search results. The prompt must instruct: "For sanctions/entity screening, cite ONLY information from the search results. Do not rely on your own knowledge of sanctioned entities, which may be outdated or incorrect. If the search finds no sanctions information, report that explicitly."

7. **Non-Latin script false positive risk.** When checking for CJK/Arabic/Russian PO Box equivalents, the LLM must not over-flag addresses that contain characters superficially similar to PO Box terms. For example, not every Chinese address containing 箱 is a PO Box. The prompt should specify the exact patterns and require context (i.e., the PO Box term should be a destination designator, not part of a street name or building name).

### 6. Draft input/output schema (step e)

**Input fields:**

```yaml
shipping_address: "1396 W Herndon Ave Suite 200, Fresno, CA 93711"
shipping_country: "US"                              # ISO code from normalization
claimed_institution: "Pacific Genomics Inc"          # from order form
institution_address: "1396 W Herndon Ave Suite 200, Fresno, CA 93711"  # if different from shipping
customer_name: "Jane Doe"                            # individual name on order
po_box_regex_hit: false                              # from PO Box regex (already run)
bis_disposition: "pass"                              # from BIS lookup (already run)
smarty_rdi: "Commercial"                             # from Smarty (if US)
smarty_cmra: "N"                                     # from Smarty (known broken, included for context)
smarty_pmb_designator: null                          # from Smarty parsed components
address_contains_non_latin: false                    # pre-check for non-Latin character presence
```

**Output schema:**

```yaml
verdict: "flag" | "pass" | "inconclusive"
confidence: "high" | "medium" | "low"

freight_forwarder_check:
  detected: true | false | null
  evidence:
    - source: "shipito.com"
      finding: "1396 W Herndon Ave is Shipito's Fresno warehouse"
      address_match: exact          # exact | building_only | nearby | none
  forwarding_service_name: "Shipito"  # null if not identified
  forwarding_service_type: "international_reshipping" | "cmra" | "virtual_office" | "mail_forwarding" | null

po_box_non_latin_check:
  detected: false
  script: null                       # "chinese" | "arabic" | "russian" | "korean" | "japanese" | "turkish" | null
  term_found: null                   # the actual term detected, e.g. "信箱"

entity_screening_check:
  performed: true | false
  matches_found: false
  evidence: []
  disclaimer: "Web search entity screening is NOT comprehensive. A negative result does not constitute clearance."

risk_factors:
  - "Address matches known freight forwarding warehouse (Shipito Fresno)"
  - "Suite number pattern consistent with re-shipping customer allocation"

sources_checked:
  - "Exa search: '1396 W Herndon Ave Fresno CA business'"
  - "Exa search: '1396 W Herndon Ave Fresno package forwarding shipping'"
  - "Exa search: 'Pacific Genomics Inc company registration'"
```

---

## Cross-cutting considerations for both prompts

### Search strategy guidance

The prompts should include explicit search strategy instructions for the LLM, since the Exa test results show that search query formulation dramatically affects result quality:

**For step (b):**
1. First search: `"[billing entity name] company registration corporate entity"` -- verify the entity exists.
2. Second search: `"[billing entity name] [institution name]"` -- check for association.
3. If billing entity is a known fintech (Mercury, Brex, etc.), search: `"[claimed institution] payment method fintech"` -- this is likely uninformative but worth trying.
4. For wire transfers: `"[originating bank name] bank [country]"` -- verify the bank.

**For step (e):**
1. First search: `"[street address] [city] [state] businesses tenants"` -- discover what operates at the address.
2. Second search: `"[street address] [city] package forwarding shipping mail forwarding"` -- specifically probe for freight/mail forwarding.
3. If a building name is found: `"[building name] [city] tenants shipping logistics"` -- check for freight forwarder co-location.
4. For entity screening: `"[customer name] sanctions denied party export control"` and `"[institution name] sanctions denied party entity list"`.
5. For non-Latin addresses: the LLM should apply its multilingual knowledge directly to identify PO Box equivalents without additional search.

### Confidence calibration

Both prompts should include explicit confidence calibration guidance:

- **High confidence:** Multiple independent sources confirm the same finding. Government/legal filings (SEC, Companies House, court records). Official company pages with address confirmation.
- **Medium confidence:** A single credible source (business directory, real estate listing). Or multiple sources that all derive from the same underlying data.
- **Low confidence:** Inference from tangential evidence. "No evidence found" (absence is not evidence). Results where address proximity is assumed but not confirmed.

### Cost and latency considerations

At $0.007 per Exa search call plus LLM inference cost, LLM+Exa should NOT run on every order. The recommended trigger conditions:

**Step (b) LLM+Exa triggers when:**
- `card.funding = prepaid` AND fintech BIN denylist does not match (unknown prepaid card)
- Payment is wire transfer (zero structured coverage)
- Billing-institution consistency = `hard_flag`
- Billing entity name does not match institution name AND is not a recognized fintech issuer

**Step (e) LLM+Exa triggers when:**
- PO Box regex returns no hit AND Smarty `dpv_cmra = N` AND Smarty `pmb_designator = null` (i.e., structured checks found nothing, but we still want to probe for freight forwarders)
- Address is in a known freight-forwarder-dense area (manual seed list of suspicious ZIP codes or building addresses)
- Step (a) failed to identify any institution at the shipping address (the address might be a forwarder if no institution is there)
- Address contains non-Latin characters (for non-Latin PO Box detection)
- Customer name or institution name warrants entity-level screening (e.g., order to a Group D country where BIS = license_required)

Estimated trigger rate: step (b) ~10-15% of orders, step (e) ~15-25% of orders. At 1,000 orders/month, this means ~100-250 LLM+Exa calls per step per month, costing $0.70-$1.75 in Exa fees per step (LLM inference cost separate and likely 5-10x higher).
