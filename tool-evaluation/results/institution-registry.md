# Institution Registry — Test Results

**Tested:** 2026-04-14 | **Cases:** 35 (2 rounds) | **Covered:** 14 (40%) | **Partial:** 9 (26%) | **Not covered:** 12 (34%)

**Endpoints:** ROR API v2, GLEIF API v1, Companies House API
**KYC step:** (a) Address-to-institution — flag "No public association between affiliation and shipping address"

## Coverage boundaries found

### 1. Community bio labs / makerspaces — NOT COVERED
Tested 5 community labs (Genspace, BioCurious, La Paillasse, Hackuarium, BioClub Tokyo). Zero results in any registry. This is a hard gap with no workaround within these APIs — community labs are invisible to institutional registries.
Evidence: cases 10, 11, 12, 13, 14

### 2. Small biotech startups — NOT COVERED
Tested 6 small biotechs from customer data (Lay Sciences, Virometix AG, AdaptVac, Signablok, Fusix Biotech, Uvax Bio). All returned zero results in ROR, zero in GLEIF, zero relevant in Companies House. Small biotechs are too small for ROR (no significant research output), too small for GLEIF (no LEI required), and not UK-based for Companies House.
Evidence: cases 7, 28, 29, 30, 31, 37

### 3. ROR provides city-level only — no street addresses — PARTIALLY COVERED
ROR never returns street addresses. For address-to-institution verification, city-level data can confirm the right metro area but cannot validate a specific shipping address. Multi-campus institutions (Griffith: Brisbane vs Gold Coast; CSIRO: Canberra HQ vs labs nationwide) make even city-level matching unreliable.
Evidence: cases 1, 6, 21

### 4. GLEIF legal addresses are often misleading — PARTIALLY COVERED
GLEIF provides street addresses, but they are frequently wrong for KYC purposes. Pfizer's legal address is a Delaware registered agent (Corporation Trust Center, 1209 Orange St, Wilmington DE). Oxford's GLEIF entries point to individual colleges, one with a Liverpool investment manager address. Pfizer's HQ address field shows the pre-2024 address. GLEIF addresses reflect corporate registration, not physical operations.
Evidence: cases 2, 3

### 5. GLEIF requires exact current legal names — PARTIALLY COVERED
GLEIF's name filter is exact or prefix-based. "Facebook Inc" finds only "Facebook Overseas Inc" (parent renamed to Meta Platforms). "GSK" returns 56 unrelated entities. "Pfizer" (without "Inc") returns 171 results needing disambiguation. Name changes and abbreviations break GLEIF lookups.
Evidence: cases 3, 26, 32

### 6. Companies House is noise for non-UK entities — NOT COVERED for non-UK
Every non-UK query returned `total_results: 10000` with irrelevant matches. "Scripps" matched "UK SCRIPPSLNS OF OCEANS CELL BIOLOGICAL LTD." Companies House is excellent for UK companies (AstraZeneca: full street address, company status, 23 related entities) but actively harmful for non-UK entities because it returns false matches.
Evidence: cases 1, 7, 33, 36

### 7. Government sub-units are inconsistently covered — PARTIALLY COVERED
Canada's National Microbiology Laboratory (BSL-4, Winnipeg) has no ROR record. The parent (PHAC) is in ROR but mapped to Ottawa HQ, and NML is not a child entity. Contrast: MIT Lincoln Lab IS a separate ROR record in Lexington with MIT as parent. USAMRIID also has its own record. Coverage depends on whether the sub-unit has enough independent publication output to warrant a separate ROR entry.
Evidence: cases 5, 19, 22, 40

### 8. CDC-style disambiguation — PARTIALLY COVERED
Querying "Centers for Disease Control and Prevention" returns Uganda (1st), Kenya (2nd), US (3rd). ROR relevance ranking does not prioritize the "main" or largest entity. Automated matching would select the wrong country. This affects any institution with international offices sharing the same name.
Evidence: case 19

### 9. ROR domains field is inconsistent — PARTIALLY COVERED
Some institutions have domains (Oxford: ox.ac.uk, IIT Kanpur: iitk.ac.in, Makerere: mak.ac.ug). Others do not (Scripps, Baqiyatallah, TiHo Hannover, University of Nairobi, CDC, USAMRIID, WIV). Roughly half of tested institutions lack domain data. Cannot rely on ROR for email-to-institution verification.
Evidence: cases 1, 2, 4, 8, 9, 15, 16

### 10. Non-OECD established universities — COVERED (contrary to hypothesis)
ROR covers established non-OECD universities well. All tested (Nairobi, Makerere, Al-Farabi Kazakhstan, Universitas Indonesia, Baqiyatallah Iran) were found with correct city. Sanctioned-country institutions (Iran IRGC-affiliated, PLA-affiliated) are present with native-script aliases. ROR presence says nothing about sanctions status.
Evidence: cases 8, 15, 16, 17, 18, 34, 35

## Iteration log

### Round 1 (seed cases 1-10)
Ran 10 seed cases. 6 covered (2 only partially), 2 partially covered, 2 not covered. Key findings:
- ROR is the only broadly useful registry. GLEIF and Companies House have narrow niches.
- ROR's city-level-only addressing is a fundamental limitation for address verification.
- GLEIF addresses can be misleading (registered agents, investment managers).
- Small entities (startups, community labs) are invisible everywhere.
- Non-ASCII and alias matching works well in ROR.
- Government sub-unit coverage is inconsistent.

Decided to probe in round 2: community labs (hard gap), non-OECD universities, government labs, CROs, name changes, abbreviations, multi-site companies.

### Round 2 (cases 11-41)
Ran 25 additional adversarial cases. Confirmed:
- Community labs are a hard zero across all registries (5/5 miss)
- Small biotechs are a hard zero (6/6 miss)
- Non-OECD universities are well-covered in ROR (7/7 hit)
- Government labs covered when they have independent publication presence
- CROs covered but fragmented across country subsidiaries
- GLEIF name matching is brittle (abbreviations, name changes)
- Companies House excellent for UK companies, actively misleading for everything else
- CDC disambiguation is a real risk for automated matching

## Key fields and their usefulness for address-to-institution

| Endpoint | Field | Useful for flag (a) | Coverage quality | Notes |
|---|---|---|---|---|
| ROR | locations[].city | City-level match | ~70% of institutions | No street address. Multi-campus institutions may show wrong campus city. |
| ROR | domains[] | Email-to-institution (flag c) | ~50% of institutions | Inconsistently populated. Some major institutions lack domain data. |
| ROR | names[] (aliases) | Name resolution | Good | Non-ASCII, abbreviations, and old names generally handled well. |
| ROR | relationships[] | Hierarchy validation | Inconsistent | Some sub-units have parent links (MIT Lincoln Lab), others don't (NML). |
| GLEIF | entity.legalAddress | Street-level match | ~15% of institutions | Often a registered agent address, not actual office. |
| GLEIF | entity.headquartersAddress | Street-level match | ~15% of institutions | Better than legalAddress but may be outdated. |
| Companies House | address | Street-level match (UK only) | ~5% of institutions (UK companies only) | Excellent when applicable. Full street address with postal code. |

## Assessment for KYC step (a): Address-to-institution

**Bottom line:** These registries cannot reliably verify address-to-institution associations.

- **Best case (established university):** ROR confirms the institution exists in the right city. That's useful but insufficient — it doesn't confirm a specific street address.
- **Worst case (small biotech, community lab):** Complete miss. No registry has any data. These entities are legitimate synthesis customers who would be flagged by any system relying solely on registry lookups.
- **Dangerous case (large multinational):** GLEIF provides street addresses that are wrong — registered agents, outdated HQs, investment managers. Automated matching against these addresses would produce false negatives (failing to confirm legitimate addresses) and false confidence in the address data.

The fundamental problem: **institutional registries track organizational existence, not physical site locations.** A company with 50 offices worldwide has one or two addresses in GLEIF (legal registration and declared HQ). ROR provides only city-level data. Companies House is UK-only. None of these can answer "does Institution X have a presence at Address Y?" for the majority of cases.

## What I'd test with more budget

- **Recently founded companies (2024-2025):** Would test 5-10 very new biotech companies to determine the lag between incorporation and appearance in registries. Hypothesis: 12-24 month lag for ROR, immediate for Companies House (UK only), 6-12 months for GLEIF (if LEI is registered at all).
- **Dissolved/merged entities:** Would test 5-10 recently dissolved or merged companies to see if registries retain historical records and how they're flagged.
- **Coworking space tenants:** Would test 5 companies known to be at WeWork/Regus addresses to see if multiple entities share the same GLEIF/Companies House address.
- **GLEIF fulltext vs. legalName filter:** Would systematically compare the two search modes for recall and precision across 20 entity names.
- **Companies House SIC code filtering:** Would test whether filtering by biotech SIC codes (72110, 72190) improves result quality for UK entities.
