# Step (a): Address to Institution — Field Assessment

**Measure:** M05 — No public association between affiliation and shipping address
**Endpoint groups assessed:** institution-registry, address-classification, funding-legitimacy, llm-exa

---

## The fundamental problem

No API answers the question "Does Institution X have a presence at Address Y?" What we actually have:

- **Registries** (ROR, GLEIF, Companies House) answer: "Does Institution X exist, and what city is it in?"
- **Address classification** (Smarty, Google Places) answers: "What type of building is at this address?" -- but only with the institution name in the query.
- **Funding databases** (NIH, PubMed) answer: "Is Institution X a real research entity?"
- **Web search** (Exa) answers: "What does the web say about Institution X at Address Y?" -- the closest to the actual question.

The pipeline must chain these together: verify the institution exists, verify it has research activity, then use Google Places or Exa to check if the claimed institution has a plausible presence at the given address.

---

## Field-by-field assessment

### ROR API v2 — city-level match only

ROR is the backbone of institutional verification. It covers ~110K research organizations with city-level location data, and it works surprisingly well internationally. All 7 tested non-OECD universities were found (Nairobi, Makerere, Al-Farabi Kazakhstan, Universitas Indonesia, Baqiyatallah Iran, NUDT China, WIV China). Sanctioned-country institutions are present with native-script aliases -- ROR presence says nothing about sanctions status.

**Hard gaps:** Community bio labs (5/5 tested returned zero) and small biotech startups (6/6 returned zero). These entities are outside ROR's scope entirely -- they have no significant research publication output.

**Key limitation:** City-level only. ROR never provides street addresses. Multi-campus institutions (Griffith University in Brisbane vs Gold Coast, CSIRO across all of Australia) make even city-level matching unreliable. And CDC disambiguation is a real risk: querying "Centers for Disease Control" returns Uganda first, Kenya second, US third.

### GLEIF — misleading addresses

GLEIF provides street-level addresses but they are frequently wrong for KYC purposes. Pfizer's legal address is a Delaware registered agent (Corporation Trust Center, Wilmington). Oxford's GLEIF entries point to individual colleges, one listing a Liverpool investment manager. GLEIF also requires exact legal name matching -- "GSK" returns 56 unrelated entities, "Facebook Inc" finds only "Facebook Overseas Inc" because the parent renamed to Meta.

**Verdict:** GLEIF is a narrow niche tool for entities that happen to have LEIs. Academic institutions rarely do. Even when present, addresses reflect corporate registration, not physical operations. ~15% of tested institutions had any GLEIF data.

### Companies House — UK-only excellence

Excellent for UK entities (AstraZeneca: full street address, company status, 23 related entities). Actively harmful for non-UK queries -- every search returns 10,000 irrelevant matches ("Scripps" -> "UK SCRIPPSLNS OF OCEANS CELL BIOLOGICAL LTD").

### Google Places — verification tool, not discovery tool

This was the most surprising finding. **Address-only search is useless.** MIT, Pfizer, Institut Pasteur, freight forwarders -- all return "premise" or "subpremise" with no type information. Only when the institution name is included does Google Places return typed results (university, manufacturer, research_institute, coworking_space).

This transforms Google Places from a discovery tool ("what's at this address?") into a verification tool ("is the claimed institution at this address?"). The dependency on institution name is a fundamental pipeline constraint.

International coverage is strong: IIT Bombay, Tsinghua, USP, Makerere, NUST, CSIR-CCMB all correctly classified as university or research_institute. But wet-lab coworking spaces (LabCentral, BioLabs, JLABS) are systematically absent from Google's type taxonomy. WeWork and Regus are correctly classified as coworking_space, but LabCentral returns "point_of_interest" only, and BioLabs returns an empty response.

### Smarty — US-only, tells you nothing about institutions

Smarty's RDI (Residential/Commercial) field tells you how USPS delivers mail to the address. It does not tell you which institution occupies the building. A commercial address could be MIT, Pfizer, a freight forwarder, or a WeWork. Not useful for step (a).

### PubMed — broadest legitimacy signal

PubMed found publications for 22 of 25 tested institutions. The only exceptions were community bio labs. Even institutions with zero NIH/NSF funding have substantial PubMed presence (Tsinghua: 58,637, Zhejiang Sci-Tech: 5,850, WuXi AppTec: 550). PubMed keyword search has one dangerous failure mode: common-word institution names produce false positives ("Lay Sciences" -> 12,066 articles from matching the word "lay" in text).

### LLM+Exa — the unique value-add

Exa is the only tool that can:
1. **Detect coworking/incubator addresses.** LabCentral, BioLabs, WeWork, JLABS -- Exa identifies these as shared spaces when no structured API can.
2. **Cross-reference claims against web data.** When a fictional "Helix Therapeutics" claimed the LabCentral address, Exa correctly surfaced LabCentral as the actual occupant.
3. **Detect address staleness.** Genspace moved from 150 Broadway to 132 32nd St Brooklyn. Mammoth moved to Brisbane. Exa shows the mismatch, which is itself a valid KYC signal.

**Weak for:** Freight forwarder detection from address alone (Shipito address not identified without "Shipito" in query).

---

## Profile groups and resolution time

| Group | Time tier | Est. time | Fraction | Resolution |
|---|---|---|---|---|
| Established university (OECD or major non-OECD) | Auto | 0 min | ~50% | ROR city match + PubMed + Google Places type |
| Large pharma / CRO | Auto | 0 min | ~10% | ROR/GLEIF + PubMed + Google Places |
| Multi-campus institution, city mismatch | Quick review | 2-3 min | ~5% | ROR hit but city differs -- reviewer checks for satellite campus |
| Government sub-unit (lab within agency) | Quick review | 2-5 min | ~5% | Check ROR for both sub-unit and parent agency |
| Small biotech at incubator | Investigation | 5-15 min | ~10% | Zero registry results. Exa identifies incubator. Web search for company. |
| Small biotech at own address | Investigation | 10-15 min | ~10% | Zero registry results. Web search for company, incorporation records. |
| Community bio lab | Customer follow-up | 15-30 min | ~5% | Zero in all databases. May need to contact customer for biosafety setup. |

---

## Recommended endpoint combination

1. **ROR** city match (free, fast, global coverage for established institutions)
2. **PubMed** article count (broadest legitimacy signal, 22/25 institutions covered)
3. **Google Places** name+address (international type classification)
4. **LLM+Exa** web search (coworking/incubator detection, mismatch signals)
5. **NIH RePORTER / UKRI** (supplementary funding signal)

**Drop:** GeoNames (zero useful signal). **Niche only:** GLEIF (entities with LEI), Companies House (UK only).

---

## Unresolved issues

1. **Screening List API is BLOCKED** -- no entity-level screening against OFAC/BIS lists. Critical gap forwarded to final synthesis.
2. **PubMed false positives** from common-word institution names need exact affiliation field matching (proposed, not tested).
3. **Google Places Nearby Search** for freight forwarder detection proposed but not tested.
4. **Coworking wet-lab denylist** (~50-100 addresses like LabCentral, BioLabs, JLABS) is the only viable detection method for shared lab spaces.
