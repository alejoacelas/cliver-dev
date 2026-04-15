# LLM+Exa Prompt Research: Steps (a) and (d)

**Purpose:** Identify what the LLM+Exa prompts should focus on for steps (a) and (d), based on the structured API failures and the existing LLM+Exa test results.

**Step (a):** Flag "No public association between the claimed institutional affiliation and the shipping address."
**Step (d):** Flag "Residential address."

These two steps are deeply coupled. The final synthesis recommends reframing step (d) as "step (a) failure IS the residential signal." If step (a) confirms an institution at the address, step (d) is moot. LLM+Exa should handle both in a single prompt with two output verdicts.

---

## 1. Coverage gaps from structured APIs

### 1.1 Gaps relevant to step (a): Address to institution

**Gap A1: Community bio labs are invisible to every registry and funding database.**

All structured APIs return hard zeros. This is the most consistently documented failure across the entire pipeline.

- ROR: 0/5 community labs found (Genspace, BioCurious, La Paillasse, Hackuarium, BioClub Tokyo). Cases 10-14 in institution-registry.yaml.
- GLEIF: 0/5 found.
- Companies House: 0/5 found.
- NIH/NSF/UKRI: 0 grants for all 4 tested community labs (Genspace, BioCurious, Counter Culture Labs, La Paillasse). Cases 9, 15, 16, 25 in funding-legitimacy.yaml.
- PubMed: 2-5 articles each -- likely word matches, not real affiliations.
- Google Places: Returns `non_profit_organization` + `community_center` for Genspace (case 27 in address-classification.yaml), which is actually useful. But LabCentral returns only `point_of_interest`, and BioLabs returns empty (case 11).

However, Exa *did* find BioCurious (adv-1 in llm-exa.yaml: MapQuest listing, biocurious.org website, Meetup group with 4,504 members). And Genspace's website was found via Exa (seed case 7). Community bio labs have web presence; they just lack registry presence. This is exactly the gap LLM+Exa should fill.

**Gap A2: Small biotech startups are invisible to registries.**

- ROR: 0/6 found (Lay Sciences, Virometix AG, AdaptVac, Signablok, Fusix Biotech, Uvax Bio). Cases 7, 28-31, 37 in institution-registry.yaml.
- GLEIF: 0/6 found.
- PubMed: False positive risk -- "Lay Sciences" matched 12,066 articles because "lay" is a common word (case 8 in funding-legitimacy.yaml).
- Google Places (address only): Returns `premise` -- no company identification.
- Google Places (name+address): Would work if the company exists in Google's database, but many small startups don't.

Exa's value: Can find company websites, LinkedIn pages, press releases, state incorporation records in its index. The "Mammoth Biosciences" test (adv-9 in llm-exa.yaml) showed Exa correctly finding the company but at a *different* address (they moved from Letterman Drive to Brisbane). This mismatch detection is uniquely valuable.

**Gap A3: Coworking lab spaces (LabCentral, BioLabs, JLABS) are invisible to all structured APIs.**

This is the single biggest step (a) failure. A customer claiming "Acme Biotech, 700 Main St, Cambridge MA" gets:

- Smarty: Clean commercial address (RDI=Commercial, dpv_match_code=Y). Case 6 in address-classification.yaml.
- Google Places (address only): `subpremise` -- no institutional signal. Case 6.
- Google Places (name="LabCentral"): `point_of_interest` only. No `coworking_space` type. Case 6.
- BioLabs: Empty response from Google Places entirely (case 11 in address-classification.yaml).
- JLABS: `corporate_office` (case 14 in address-classification.yaml). Functionally a coworking lab, classified as a J&J office.
- OSM: Not mapped. Case 6.
- ROR: Not an institution.

Exa excels here. From llm-exa.yaml:
- Seed case 8 ("Helix Therapeutics at LabCentral"): First result correctly identified 700 Main St as LabCentral shared biotech lab space. This is exactly the cross-referencing that structured APIs cannot do.
- Adv-2 (WeWork at 115 Broadway): All 3 results identified it as WeWork coworking space.
- Adv-14 (BioLabs at NYU Langone, 180 Varick St): MapQuest, BioLabs website, and CommercialSearch all confirmed it as a biotech co-working facility.
- Adv-19 (Galvanize at 44 Tehama St): All 3 results identified it as coworking space.
- Adv-22 (JLABS at 3210 Merryfield Row): jnjinnovation.com confirmed JLABS incubator.

Coworking/incubator detection is Exa's primary value-add for step (a).

**Gap A4: Google Places address-only search returns `premise` for everything.**

Tested 10+ addresses by street address alone in address-classification results. ALL returned `premise` or `subpremise` with no institutional type information -- MIT, Pfizer, Institut Pasteur, freight forwarder buildings, residential addresses. The only exception was Oxford Chemistry (where the building itself has a named entity in Google Maps). Cases 1, 2, 4, 5, 6, 7, 8, 9, 10 in address-classification.yaml.

This means Google Places requires the institution name in the query. But the KYC pipeline might not trust the customer-claimed institution name. Exa can discover what institution is at an address without being told what to look for, which is a fundamentally different capability.

**Gap A5: ROR provides city-level only -- no street addresses.**

ROR never returns street addresses. For multi-campus institutions, even city-level is unreliable:
- Griffith University: Brisbane vs Gold Coast campuses.
- CSIRO: Canberra HQ vs labs across Australia.
- CDC: Atlanta HQ, but ROR returns Uganda and Kenya offices before the US CDC (case 19 in institution-registry.yaml).

Exa can verify specific street addresses against institutional web pages (MIT contact page, BioNTech Impressum, Chulalongkorn campus map -- see seed cases 1, 4, 5 in llm-exa.yaml).

**Gap A6: GLEIF addresses are misleading for KYC.**

- Pfizer's GLEIF legal address: Corporation Trust Center, 1209 Orange St, Wilmington DE (a registered agent, not an office). Case 2 in institution-registry.yaml.
- Pfizer's GLEIF HQ address: 235 E 42nd St (outdated, pre-2024 move to 66 Hudson Blvd).
- Oxford's GLEIF: Individual colleges, one with a Liverpool investment manager address. Case 3.

Exa is less likely to surface registered agent addresses. Exa confirmed Pfizer at 66 Hudson Blvd E via MapQuest, SalesTools, and immihelp.com listings (seed case 2 in llm-exa.yaml).

**Gap A7: Outdated addresses create false negatives in structured APIs (but true positives for KYC).**

Exa's behavior on stale addresses is actually *useful* for KYC:
- Genspace: Customer claims 150 Broadway, but Exa found current address at 132 32nd St Brooklyn. Seed case 7 -- result: FAIL on address confirmation, which is correct because the address is outdated.
- Mammoth Biosciences: Customer claims 1 Letterman Drive, but Exa found current address at 1000 Marina Blvd, Brisbane. Adv-9 -- result: PARTIAL with address mismatch detected.
- African Academy of Sciences: Customer claims Mwalimu Mutual Towers, but Exa found current address at 8 Miotoni Lane, Karen. Seed case 6 -- result: PARTIAL.

The mismatch IS the KYC signal. The prompt should instruct the LLM to report both the claimed and the found address, and flag discrepancies as requiring investigation.

### 1.2 Gaps relevant to step (d): Residential address

**Gap D1: Smarty RDI is bidirectionally unreliable.**

Two critical misclassifications from address-classification.yaml:
- Case 29: Harvard science building at 52 Oxford St, Cambridge returns `RDI=Residential`. A KYC pipeline would incorrectly flag this legitimate university shipment.
- Case 30: NYC residential high-rise at 200 E 89th St returns `RDI=Commercial`. A customer ordering to their apartment would NOT trigger the residential flag.

RDI reflects USPS mail delivery infrastructure (how mail is sorted/delivered), not building occupancy or zoning. Large apartment buildings with managed mailrooms get Commercial. Small university buildings on residential streets get Residential.

**Gap D2: No residential classification for international addresses.**

Smarty is US-only. Google Places address-only returns `premise` globally. There is no structured API that classifies international addresses as residential or commercial.

From the final synthesis: "No automated residential classification for international addresses. Google Places address-only returns 'premise' globally. Smarty is US-only."

This is 15% of orders by the final synthesis coverage map.

**Gap D3: Google Places cannot distinguish residential from commercial from address alone.**

Address-only search returns `premise` for MIT, Pfizer, freight forwarders, AND residential addresses (cases 1, 2, 7, 9, 10, 29, 30 in address-classification.yaml). Zero signal for the residential question.

**Gap D4: Mixed-use buildings defeat all classifiers.**

42 Brattle St, Cambridge (case 7 in address-classification.yaml): Expected residential, got RDI=Commercial because the building hosts a commercial entity. Mixed-use buildings are common in urban areas and create ambiguity for both Smarty and Exa.

### 1.3 Summary of what structured APIs handle well (so LLM+Exa doesn't need to duplicate)

- **ROR**: Reliably identifies established universities (OECD and non-OECD) at the city level. 7/7 non-OECD universities found. Good name resolution including non-ASCII and aliases. ~63% of orders auto-pass via ROR + PubMed + Google Places.
- **Google Places (name+address)**: Reliable institutional type classification for universities, pharma, hospitals, government labs, and mainstream coworking spaces (WeWork, Regus) -- *when the institution name is included in the query*. International coverage is strong.
- **PubMed**: Broadest legitimacy signal. Found publications for 22/25 institutions tested. Works for non-US institutions with zero NIH/NSF funding.
- **Smarty RDI**: Despite bidirectional unreliability, `RDI=Residential` on a non-university street is a useful soft flag. Gets single-family homes right.
- **NIH/NSF/UKRI**: Supplementary funding signal for US/UK institutions.

---

## 2. Cases LLM+Exa is already known to handle well

From the existing llm-exa.yaml and llm-exa.md test results:

### 2.1 Step (a) strengths

**Well-known institutions (OECD and non-OECD):** 13/16 pass. Specific evidence:
- MIT: "Massachusetts Institute of Technology, 77 Massachusetts Ave" confirmed via mit.edu, opengovwa.com, MapQuest. Seed case 1.
- Pfizer: "66 Hudson Blvd E" confirmed via MapQuest, SalesTools, immihelp.com. Seed case 2.
- Oxford: "Wellington Square, Oxford, OX1 2JD" confirmed via estates.admin.ox.ac.uk. Seed case 3.
- BioNTech: "An der Goldgrube 12, 55131 Mainz" confirmed via biontech.de Impressum page. Seed case 5.
- Chulalongkorn: "254 Phayathai Road, Bangkok" confirmed via uniRank.org and official website. Seed case 4.
- IIT Bombay: "Powai, Mumbai 400076" confirmed via iitb.ac.in contact page. Adv-17.
- University of Lagos: "Akoka, Yaba, Lagos" confirmed via admissions.unilag.edu.ng. Adv-4.
- Universiti Malaya: "50603 Kuala Lumpur" confirmed via um.edu.my. Adv-11.
- Broad Institute: "415 Main Street, Cambridge, MA 02142" confirmed via broadinstitute.org. Adv-13.

**Coworking/incubator identification (unique strength):**
- LabCentral: Correctly identified 700 Main St as LabCentral shared biotech lab space. Seed case 8.
- WeWork: All 3 results identified 115 Broadway as WeWork coworking space. Adv-2.
- BioLabs at NYU Langone: Confirmed as biotech co-working facility at 180 Varick St. Adv-14.
- Galvanize: All 3 results identified 44 Tehama St as coworking space. Adv-19.
- JLABS San Diego: Confirmed as J&J incubator at 3210 Merryfield Row. Adv-22.

**Fictional entity detection:**
- "Helix Therapeutics at LabCentral": Correctly surfaced LabCentral as the actual occupant. Seed case 8.
- "Pacific Biosystems Research, PO Box 330267 Miami": No results linking the fictional entity to the address. Seed case 10.

**Community bio lab verification (unique strength):**
- BioCurious: Found via MapQuest, biocurious.org, Meetup group. Adv-1.
- Genspace: Found via genspace.org, confirmed as real organization. Seed case 7.

### 2.2 Step (d) strengths

**Commercial building identification via real estate listings:**
- Pfizer (66 Hudson Blvd E): CommercialCafe "The Spiral" + office space listings on Realgraph and office-hub. Seed case 2.
- Genspace old address (150 Broadway): LoopNet and CityFeet confirm commercial office space. Seed case 7.
- Regus virtual office (1201 3rd Ave, Seattle): Regus page, CommercialSearch, CommercialCafe. Adv-6.

Real estate listing sites (LoopNet, CommercialCafe, CityFeet, Realgraph, office-hub) are strong positive signals for commercial buildings. If an address appears on these sites, it is clearly not residential.

---

## 3. Cases LLM+Exa is already known to fail on

### 3.1 Step (a) failures

**Outdated addresses produce FAIL verdicts (but this is actually correct KYC behavior):**
- Genspace: Seed case 7. Customer claims 150 Broadway, Exa found 132 32nd St Brooklyn. Result: FAIL. The address mismatch IS a valid flag.
- Mammoth Biosciences: Adv-9. Customer claims 1 Letterman Drive, Exa found Brisbane, CA. Result: PARTIAL.
- African Academy of Sciences: Seed case 6. Customer claims Mwalimu Mutual Towers, Exa found 8 Miotoni Lane. Result: PARTIAL.

These are not really Exa failures -- they are correct KYC signals. The prompt should treat address mismatches as flags requiring investigation, not as verification failures.

**Name collisions with unrelated real entities:**
- "Helix Therapeutics at LabCentral" (seed case 8): Found a real Helix Therapeutics (HIV/AIDS biotech) that is unrelated to the claimed entity. The search correctly surfaced LabCentral as the address occupant, but also created confusion with the real Helix Therapeutics company. The step (b) query for "Helix Therapeutics Inc billing corporate entity" was rated AMBIGUOUS because of this name collision.

The prompt must instruct the LLM: when search results show an entity with the right name but at a different address, that is NOT a confirmation -- it is a mismatch signal.

### 3.2 Step (d) failures

**Specific residential addresses not in real estate listings:**
- "4512 Oak Lane, Bethesda, MD 20817" (adv-12): Found nearby Redfin/RE/MAX listings but not the specific address. Result: WEAK_PASS. The LLM had to infer from context (Oak Lane in Bethesda is likely residential) rather than finding definitive proof.
- "742 Evergreen Terrace, Springfield" (adv-10): Returned Simpsons references and a real nearby address. Result: UNUSUAL. For real residential addresses (as opposed to fictional ones), coverage depends on whether the address is in Zillow/Redfin's database.

**International residential addresses untested:**
No international residential addresses were tested with Exa. This is a gap in the test coverage itself. The prompt for step (d) must handle addresses from countries without English-language real estate listing sites.

---

## 4. Proposed focus areas for the prompt

The LLM+Exa prompts for steps (a) and (d) should target the specific gaps where structured APIs fail. Given the overlap between the two steps, I recommend a **single combined prompt** that produces two verdicts.

### 4.1 Primary focus: Things only LLM+Exa can do

**Focus 1: Coworking/incubator/shared-lab detection.**

This is the highest-value capability. The prompt should instruct the LLM to search for whether the address is a known shared workspace, biotech incubator, or coworking lab. Specific search strategies:
- Search for the address + "coworking" / "incubator" / "shared lab" / "co-working"
- Search for the address alone and check if the top results mention shared workspace operators
- If a shared workspace is found, report the operator name (LabCentral, BioLabs, JLABS, WeWork, Regus, etc.)

Known working examples from testing: LabCentral, WeWork, BioLabs at NYU Langone, Galvanize, JLABS San Diego.

**Focus 2: Entity-address cross-referencing (mismatch detection).**

Search for the claimed entity at the claimed address. If search results show:
- The address belongs to a different entity than claimed
- The claimed entity exists but at a different address
- The claimed entity has moved from the claimed address

Any of these is a flag. The prompt must instruct the LLM to explicitly compare found addresses against claimed addresses and report discrepancies.

**Focus 3: Community bio lab and small biotech verification.**

For entities invisible to registries, Exa can find:
- Organization websites (genspace.org, biocurious.org)
- Meetup groups, social media presence
- Press mentions, directory listings
- State incorporation records in Exa's index

The prompt should instruct the LLM to distinguish between "entity has no web presence at all" (red flag) and "entity exists but is not in formal registries" (community lab / small startup pattern).

**Focus 4: Residential vs. commercial classification for international addresses.**

For non-US addresses where Smarty has no coverage:
- Search for the address + "office" / "commercial" / "building" / "for lease"
- Check if real estate listing sites (international equivalents of LoopNet) appear
- Look for institutional or business presence at the address

This is step (d)'s primary independent contribution (not subsumed by step (a)).

### 4.2 Secondary focus: Supplement what structured APIs do weakly

**Focus 5: Street-level address confirmation for institutions in ROR.**

ROR provides city-level only. Exa can confirm street-level address matches by finding the institution's contact page, campus map, or directory listing with the specific street address.

Use this to upgrade ROR's city-level match to a street-level confirmation, or to flag cases where the claimed address is in the right city but wrong location.

**Focus 6: Disambiguating multi-campus institutions.**

When ROR returns an institution but at a different city (CDC, CSIRO, Griffith), Exa can search for whether the institution has a specific campus or satellite at the claimed address.

### 4.3 What the prompt should NOT focus on

**Do NOT duplicate registry lookups.** If ROR + Google Places already confirm an institution at the right city with the right type, Exa adds nothing. The pipeline should only invoke LLM+Exa when primary signals are inconclusive.

**Do NOT attempt freight forwarder or CMRA detection.** Testing proved Exa cannot identify freight forwarders or UPS Stores from a street address alone (adv-3: Shipito not found without name; adv-8: UPS Store at 8950 Cal Center Dr not found). This is step (e)'s domain, and it requires dedicated databases, not web search.

**Do NOT attempt definitive residential classification for US addresses.** Smarty RDI, despite its flaws, is faster and cheaper for a first pass. Exa should only run on cases where Smarty is absent (international) or flagged (RDI=Residential but the customer claims institutional affiliation).

---

## 5. Known pitfalls to guard against

### 5.1 Hallucination on tangentially related results

**The Harvard/Gmail pattern (highest risk).**

From adv-7 in llm-exa.yaml: When queried about gmail.com affiliation with Harvard, Exa returned Harvard's "Gmail for Harvard" Google Workspace pages. The search results are factually correct (Harvard does use Google infrastructure) but misleading for the KYC question.

**Mitigation for steps (a)/(d):** The analogous risk is when the LLM finds content about an institution near an address but not at the address. For example, LabCentral is 500m from MIT campus -- a search for an address at 700 Main St might return MIT-related results and lead the LLM to conclude the address is MIT-affiliated when it is actually LabCentral.

The prompt should instruct: "Only count results that explicitly mention the specific street address. Proximity (nearby, same neighborhood, same city) is not the same as presence at the address."

### 5.2 Name collisions with unrelated entities

From seed case 8 in llm-exa.yaml: "Helix Therapeutics" matched a real but unrelated company. The LLM might conflate search results about the real Helix Therapeutics (HIV/AIDS biotech, different address) with the claimed entity (fictional startup at LabCentral).

**Mitigation:** The prompt must instruct: "When an entity with the claimed name appears in results, verify that the address in the result matches the claimed address. An entity with the right name but wrong address is NOT a confirmation -- it is a different organization."

### 5.3 Stale information in Exa's index

Index freshness is unknown. For recently moved institutions, Exa might return old address data. This can produce both false confirmations (old address matches customer's old address) and false failures (current address doesn't match customer's submitted address).

**Mitigation:** The prompt should instruct the LLM to note the date/recency of sources when possible, and to flag when search results show conflicting addresses (which may indicate a move).

### 5.4 Inferring residential from absence of commercial

From adv-12 (Bethesda address): Exa found nearby listings but not the specific address. The LLM inferred "likely residential" from context (Oak Lane in Bethesda). This is an inference, not a finding.

**Mitigation:** The prompt should distinguish between "positive evidence of residential use" (Zillow listing, residential real estate listing for that address) and "no evidence of commercial use" (which is weaker). The output should reflect the evidence quality.

### 5.5 Overfitting to prominent institution results

When searching for an address near a famous institution, search results may be dominated by the institution even if the address is a separate building. MIT results dominate any Cambridge, MA address search. Stanford results dominate Palo Alto.

**Mitigation:** The prompt should instruct: "If all results are about a nearby institution but none explicitly list the queried address as part of that institution, do not assume the address is affiliated."

### 5.6 Real estate listing misinterpretation

LoopNet/CommercialCafe listings for commercial buildings are strong commercial signals. But the LLM might also find these sites listing properties "near" the queried address, leading to false commercial classification.

**Mitigation:** The prompt should instruct: "Only count real estate listings that match the specific street address, not nearby properties."

---

## 6. Draft input/output schema

### 6.1 Input fields

```yaml
# Fields provided to the prompt for each case
input:
  institution_name: "Lay Sciences Inc"       # Customer's claimed affiliation
  shipping_address: "123 Innovation Way, Cambridge, MA 02139"  # Customer's shipping address
  shipping_country: "US"                     # ISO country code
  
  # Context from earlier pipeline steps (when available)
  ror_result: "not_found"                    # ROR lookup result: "found_city_match", "found_city_mismatch", "not_found"
  ror_city: null                             # City from ROR, if found
  google_places_type: "premise"              # Google Places primaryType for this address, or null
  smarty_rdi: "Commercial"                   # Smarty RDI value: "Residential", "Commercial", null (non-US)
  pubmed_count: 0                            # PubMed article count for the institution name
```

The structured API results are included so the LLM knows what has already been checked and can focus on complementary investigation rather than duplicating work. When `ror_result` is `found_city_match` and `pubmed_count` > 100 and `google_places_type` is `university`, the LLM should be told the case is already auto-passed and should not run.

### 6.2 Output schema

```yaml
output:
  # Step (a) verdict
  address_institution_verdict: "FLAG"  # PASS | FLAG | INCONCLUSIVE | ERROR
  address_institution_confidence: "high"  # high | medium | low
  address_institution_reason: |
    The address 700 Main St, Cambridge, MA 02139 is identified as LabCentral,
    a shared biotech lab incubator. No public evidence links "Acme Biotech Inc"
    to this specific address. The claimed entity may be a LabCentral tenant
    (which is legitimate but should be noted).
  
  # Step (d) verdict
  residential_verdict: "PASS"         # PASS | FLAG | INCONCLUSIVE | NOT_APPLICABLE | ERROR
  residential_confidence: "high"      # high | medium | low
  residential_reason: |
    The address is LabCentral, a commercial biotech incubator. Not residential.
  
  # Signals found (structured, for downstream logic)
  signals:
    institution_confirmed_at_address: false
    institution_found_at_different_address: false
    different_institution_at_address: true
    different_institution_name: "LabCentral"
    coworking_or_incubator_detected: true
    coworking_operator: "LabCentral"
    address_appears_residential: false
    address_appears_commercial: true
    address_moved_detected: false
    entity_has_web_presence: false  # for the claimed entity, not the address occupant
    
  # Evidence trail
  sources:
    - url: "https://labcentral.org/about"
      snippet: "LabCentral at 700 Main Street..."
      relevance: "Confirms address is LabCentral shared lab space"
    - url: "https://www.mapquest.com/..."
      snippet: "LabCentral, 700 Main St, Cambridge, MA"
      relevance: "Independent confirmation of LabCentral at this address"
  
  # Exa search queries used (for debugging/audit)
  searches_performed:
    - query: "Acme Biotech Inc 700 Main St Cambridge MA"
      num_results: 3
    - query: "700 Main St Cambridge MA 02139 coworking incubator shared lab"
      num_results: 3
```

### 6.3 Verdict definitions

**Step (a) address-to-institution:**

| Verdict | Meaning | When to use |
|---|---|---|
| PASS | Public evidence confirms the claimed institution at the claimed address | Institution's own website, directory listings, or multiple independent sources explicitly list the claimed address |
| FLAG | Evidence of mismatch between claimed institution and address | Address belongs to a different entity, institution found at different address, address is a shared/coworking space, or no public evidence of the institution's existence |
| INCONCLUSIVE | Search returned results but none definitively confirm or deny | Tangentially related results, or institution exists but address cannot be verified |
| ERROR | Search failed or returned no results at all | Exa error, timeout, or completely empty results |

**Step (d) residential:**

| Verdict | Meaning | When to use |
|---|---|---|
| PASS | Address is clearly non-residential (commercial, institutional, industrial) | Commercial real estate listings, institutional web pages, or business presence confirmed at address |
| FLAG | Address appears to be residential | Residential real estate listings (Zillow, Redfin), residential zoning evidence, or residential neighborhood with no commercial presence |
| INCONCLUSIVE | Cannot determine residential/commercial status | No real estate listings found, or mixed-use building |
| NOT_APPLICABLE | Step (a) already resolved this (institution confirmed at address) | When the step (a) verdict is PASS and the institution is clearly non-residential |
| ERROR | Search failed | Same as step (a) |

### 6.4 Invocation logic

The LLM+Exa prompt should only be invoked when structured APIs are inconclusive. Proposed trigger conditions:

```
Invoke LLM+Exa for step (a)/(d) when ANY of:
  - ROR returned not_found AND pubmed_count < 100
  - ROR returned found_city_mismatch
  - google_places_type is "premise" or null (address-only search was useless)
  - smarty_rdi is "Residential" but customer claims institutional affiliation
  - Customer's institution name contains keywords: "lab", "bio", "sciences", "therapeutics" 
    AND ror_result is "not_found" (small biotech/community lab pattern)

Do NOT invoke when ALL of:
  - ROR returned found_city_match
  - pubmed_count > 100
  - google_places_type is in [university, manufacturer, research_institute, hospital, 
    government_office]
```

This targets the ~20-37% of orders that don't auto-pass through structured APIs, rather than running on all orders.

### 6.5 Search strategy the prompt should encode

The prompt should instruct the LLM to perform searches in this sequence:

1. **Entity at address search:** "[institution_name] [shipping_address]" -- Does the claimed institution exist at the claimed address?
2. **Address identity search:** "[shipping_address] building office company what is" -- What is at this address? (Catches coworking, different tenant, etc.)
3. **Entity existence search (if step 1 returned nothing):** "[institution_name] biotech laboratory company" -- Does this entity exist anywhere? (Distinguishes "real entity, wrong address" from "fictional entity")
4. **Residential/commercial search (if step (a) is inconclusive):** "[shipping_address] residential commercial office building for lease" -- Is this a residential or commercial address?

The LLM should stop after search 1 if it gets a clear PASS. It should run search 2 on every case (this is where coworking/incubator detection happens). Searches 3 and 4 are conditional.

---

## 7. Open questions for prompt design

1. **Should the prompt receive the customer's email domain?** This could help disambiguation (a gmail.com email from a claimed MIT affiliate is different from an mit.edu email). But it adds complexity and overlaps with step (c).

2. **Should the prompt receive the customer's name?** Useful for cross-referencing (does this person appear on the institution's faculty page?). But this is step (c)'s domain and risks scope creep.

3. **How aggressively should the prompt flag coworking/incubator addresses?** A startup at LabCentral is legitimate. The flag is informational ("this is a shared space tenant"), not blocking. The prompt should be clear that coworking detection is a signal for additional verification, not an automatic rejection.

4. **Should the prompt attempt to classify the institution type?** (University, pharma, CRO, community lab, startup, etc.) This would be useful for downstream routing but adds hallucination risk. Safer to let the structured API types inform this classification and have the LLM focus on address verification.

5. **How should the prompt handle addresses in non-Latin scripts?** The test cases all used Latin-script addresses. For addresses in Chinese, Japanese, Korean, Arabic, etc., the search strategy may need to include transliterated versions.
