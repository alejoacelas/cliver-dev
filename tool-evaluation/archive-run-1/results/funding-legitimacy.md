# Funding / Legitimacy — Test Results

**Tested:** 2026-04-14 | **Cases:** 25 (2 rounds) | **Covered:** 15 (60%) | **Partial:** 5 (20%) | **Not covered:** 5 (20%)

## Coverage boundaries found

### 1. Community bio labs / makerspaces — NOT COVERED
Tested 4 community labs (Genspace, BioCurious, Counter Culture Labs, La Paillasse). All returned 0 grants across NIH/NSF/UKRI. PubMed returned 2-5 articles each — likely coincidental word matches, not institutional affiliations.
Evidence: cases 9, 15, 16, 25

### 2. Small biotech startups — NOT COVERED
Tested Lay Sciences Inc. Zero NIH/NSF grants. PubMed returned 12,066 articles but this is a **false positive** — "lay" is a common English word appearing in article text. No legitimate funding signal.
Evidence: case 8

### 3. Non-US institutions in NIH/NSF — PARTIALLY COVERED
NIH has international grants through Fogarty International Center (global health) and collaborative programs. Coverage is clustered:
- **Well covered in NIH:** Makerere (269 grants), Univ of Nairobi (146), Christian Medical College (48) — all recipients of PEPFAR/Fogarty funding
- **Not covered in NIH:** IIT Kanpur (0), Zhejiang Sci-Tech (0), Tsinghua (0), CSIRO (0), INRAE (0)
- **NSF is almost US-only:** Only found MIT, IIT Kanpur, CDC, Univ of Oxford. All others returned 0.
Evidence: cases 4, 5, 6, 7, 11, 12, 13, 17, 21, 23, 24

### 4. PubMed as universal fallback — STRONG
PubMed found publications for **22 of 25** tested institutions. The only exceptions were community bio labs. Even institutions with zero NIH/NSF funding had hundreds to thousands of PubMed articles:
- Zhejiang Sci-Tech: 5,850 articles (but 0 NIH/NSF grants)
- Tsinghua: 58,637 articles (but 0 NIH grants)
- WuXi AppTec: 550 articles (but 0 NIH grants)
**PubMed is by far the most broadly useful legitimacy signal.**

### 5. CROs — PARTIALLY COVERED
Large CROs (Charles River, Eurofins) have their own grants and publications. Smaller/non-US CROs (WuXi AppTec) have publications but no grants. Very small CROs would likely have neither.
Evidence: cases 18, 19, 20

## Iteration log

### Round 1 (seed cases 1-10)
Ran 10 seed cases. Key findings: (1) PubMed is the broadest signal, (2) NIH is US-centric but has Fogarty for international, (3) NSF is almost entirely US academic, (4) community labs and small startups are invisible to all databases. Decided to probe: more non-OECD institutions, CROs, government labs, and community labs.

### Round 2 (cases 11-25)
Targeted: African universities, Asian institutions, CROs, community labs, government labs. Confirmed PubMed's universal coverage. Found that UKRI surprisingly covers many international institutions through UK collaborations. Confirmed the community lab boundary is absolute — no bio lab appears in any funding database.

## Key fields and their usefulness

| Endpoint | Key field | Useful for KYC | Coverage quality |
|---|---|---|---|
| NIH RePORTER | total grants > 0 | Legitimacy signal | Strong for US biomedical; moderate for international via Fogarty; weak for non-biomedical |
| NIH RePORTER | org_name exact match | Institution identification | Good — exact match on org_names field |
| NSF Awards | awardeeName | Legitimacy signal | Strong for US academic only; near-zero international coverage |
| UKRI | totalSize > 0 | Legitimacy signal | Strong for UK; moderate for international collaborators; zero for community labs |
| PubMed | article count | Legitimacy signal | **Strongest overall** — covers any institution with publishing researchers. Caveats: common-word institution names cause false positives (Lay Sciences = 12K); count alone doesn't prove institutional legitimacy |

## Critical caveats

1. **PubMed false positives:** Institution names that are common English words (e.g., "Lay Sciences," "Cell Signaling") will match articles containing those words. Need exact affiliation field matching, not keyword search.
2. **NIH is org_names-sensitive:** Exact name required. "INDIAN INSTITUTE OF TECHNOLOGY" returns 0 even though "INDIAN INSTITUTE OF TECHNOLOGY KANPUR" might work differently in the full search. Name normalization is critical.
3. **NSF search quirks:** The `awardeeName` parameter does full-text search by default. Must quote the name for exact match. Even then, non-US institutions are almost never NSF awardees.
4. **Absence ≠ illegitimacy:** A community bio lab with 0 grants and 0 publications is not necessarily illegitimate — it's just outside the formal research ecosystem. This check identifies institutional activity, not legitimacy per se.

## What I'd test with more budget
- SBIR/STTR grants in NIH RePORTER for small US companies
- EU CORDIS database for European institutions (endpoint not in this pipeline)
- Fogarty specifically for low- and middle-income country institutions
- PubMed affiliation field matching vs. keyword matching to reduce false positives
