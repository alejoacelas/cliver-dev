# Individual-Affiliation Endpoint Testing: ORCID + OpenAlex

**Date:** 2026-04-14
**KYC step:** (c) Email-to-affiliation — verify whether an individual is actually affiliated with the claimed institution.
**Cases tested:** 28 (9 seed + 19 adversarial)
**API calls used:** ~25 ORCID, ~30 OpenAlex (within budget of 100/150)

## Bottom line

ORCID and OpenAlex can confirm affiliation for **well-published researchers with unique names at established institutions**. They fail for the hardest KYC cases: common names, industry researchers at small companies, early-career researchers, and community lab members. The "institution-verified" ORCID trust marker that would make this conclusive is effectively absent — 0/11 tested records were institution-verified.

## Coverage summary

| Category | Covered | Partially | Not covered |
|----------|---------|-----------|-------------|
| Unique name, published, academic | 5 | 2 | 0 |
| Common name (Chinese/Indian/Western) | 0 | 1 | 5 |
| Industry — large biotech | 1 | 0 | 0 |
| Industry — small startup | 0 | 0 | 4 |
| Institution change (recent mover) | 0 | 2 | 0 |
| Email-institution mismatch | 0 | 1 | 2 |
| Community bio lab | 0 | 0 | 1 |
| Early career / thin profile | 0 | 2 | 0 |
| Sanctioned institution | 2 | 0 | 0 |
| Government researcher | 0 | 1 | 0 |
| **Total** | **8** | **9** | **11** |

## Key findings

### 1. ORCID institution-verification is a myth in practice

The pre-committed hypothesis was that ~2% of ORCID records have institution-verified affiliations. In practice we found **0%**. Across 5 researchers (Andrabi, Faber, Dey, Zimmer, Saberfar), all 11 employment entries were self-asserted. Even a record found via MIT's ringgold org ID had self-asserted employment. This means **ORCID affiliation data has no more trust than a user's self-reported claim**. An attacker could create an ORCID profile claiming any institution.

### 2. Common names break both systems

| Name | ORCID results | OpenAlex results |
|------|--------------|-----------------|
| Wei Zhang | 3,304 | 9,085 |
| Maria Garcia | 2,464 | 17,865 |
| Yi Shi | — | 1,820 |
| Qiang He | 1 (empty) | 706 |
| John Smith | 262 | 1,415 |

For "Qiang He" at Chongqing Medical University, even filtering OpenAlex by institution still returned **7 different people**. Name-based search alone cannot disambiguate researchers with common names.

### 3. OpenAlex conflates authors with similar names

Shuvankar Dey's OpenAlex profile merges publications from "Sarthak Dey", "Sudip Dey", and "S. Dey" — different people. George F. Gao's profile has 1,192 works across 100+ institutions, clearly mixing multiple researchers. Nathalie Bastien is split across two profiles (146 works vs 15 works). OpenAlex disambiguation is unreliable in both directions — it both merges different people and splits the same person.

### 4. Small companies are invisible

Institutions not found in OpenAlex: Lay Sciences, Fusix Biotech, GREENVAX, Lanzhou Yahua Biotech, Darts Bio. These are all real companies that order synthetic DNA. Large biotechs like Genentech (936 works) and Twist Bioscience (119 works) are present, but the threshold appears to be roughly >100 publications.

### 5. Institution changes create persistent lag

- **Raiees Andrabi** moved from Scripps to UPenn in July 2023 (per ORCID). OpenAlex still lists Scripps as first in `last_known_institutions` in April 2026 — nearly 3 years behind.
- **Gert Zimmer** moved to IVI Switzerland in 2009. OpenAlex shows "University of Bern" (a related but different entity). Our seed data says Hannover. Three different answers for "current institution."
- ORCID is more current for self-reported moves, but only because the user updates it manually. OpenAlex depends on publication metadata, which lags.

### 6. Industry affiliations are invisible even for dual-role researchers

- **Pierre Charneau** founded TheraVectys and directs a Pasteur lab. OpenAlex shows Pasteur but NOT TheraVectys in his personal affiliations (despite TheraVectys existing as an institution with 178 works).
- **Jennifer Altomonte** (Fusix Biotech / tum.de email): only TU Munich appears. Fusix not in OpenAlex at all.
- **SOHN Myung Hyun** (GREENVAX / yuhs.ac email): only Yonsei appears. GREENVAX not in OpenAlex.
- Pattern: researchers who straddle academia and industry show only the academic side.

### 7. Sanctioned institutions are paradoxically well-covered

Baqiyatallah University of Medical Sciences (Iranian military-affiliated) has **12,385 works** in OpenAlex. Researchers like Saberfar (31 works) and Hashemzadeh (52 works) are findable with correct institutional affiliations. This makes sense — sanctioned institutions are typically large universities that publish extensively. The harder screening problem is whether the institution itself should be flagged, not whether the person is there.

## ORCID vs OpenAlex comparison

| Dimension | ORCID | OpenAlex |
|-----------|-------|---------|
| **Data source** | Self-reported by researcher | Derived from publication metadata |
| **Trust level** | Low (all tested records self-asserted) | Medium (can't fake having published) |
| **Spoofability** | High (anyone can create ORCID with any affiliation) | Low (need actual publications) |
| **Currency** | More current (manual updates) | 1-3 year lag behind reality |
| **Industry coverage** | Worse (most industry researchers don't fill in employment) | Better (captures co-author affiliations) |
| **Disambiguation** | Slightly better (unique ORCID ID) | Worse (conflation/splitting problems) |
| **Coverage floor** | Many records with empty employment | Requires publications to exist |

## Implications for KYC verification

1. **ORCID alone is insufficient** for affiliation verification. Self-asserted data has no more trust than the customer's own claim. An attacker could create an ORCID profile in minutes.

2. **OpenAlex is more useful** because publication metadata is harder to fake, but it has blind spots for industry, early-career, and common-name researchers.

3. **The combination helps** when both agree. If ORCID says "Person X at Institution Y" AND OpenAlex shows publications from that institution, confidence increases. But disagreement between the two (as with Andrabi's Scripps vs UPenn) creates ambiguity.

4. **Critical gap: name-based lookup** is the bottleneck. Both systems work well when you already have the ORCID ID or can unambiguously identify the person. For common names, you need additional signals (email, co-authors, publication titles, institution filtering).

5. **Recommended disambiguation approach:** Search OpenAlex with `filter=display_name.search:{name},affiliations.institution.id:{id}`. If that returns 1 result, high confidence. If >1, need secondary signals. If 0, person may not publish from that institution.

6. **Coverage estimate for KYC use:** For a random synthesis order, roughly:
   - 30% unique-name published academics: strong signal available
   - 25% common-name academics: weak-to-no signal, need email domain or other corroboration
   - 20% industry researchers at large companies: moderate signal
   - 15% industry researchers at small companies: no signal
   - 5% early-career/postdocs: weak signal
   - 5% community/non-traditional: no signal

## Adversarial attack surface

An attacker trying to pass ORCID/OpenAlex verification could:

1. **Create a fake ORCID** with any claimed affiliation (self-asserted, no verification). Takes ~5 minutes.
2. **Claim a common name** (e.g., "Wei Zhang at Tsinghua") — the system cannot distinguish the real person from the attacker.
3. **Claim a small company** not in either database — no data exists to refute or confirm the claim.
4. **Claim a former affiliation** that still appears in OpenAlex — a researcher who left MIT in 2023 would still show MIT affiliations in OpenAlex through 2026.
5. **Use a real person's publications** — if the attacker knows a real researcher's name and institution, OpenAlex will confirm the affiliation. The system verifies "does this person-institution pair exist?" not "is the requester actually that person?"

The fundamental limitation: **ORCID/OpenAlex verify that a person-institution association exists in the scholarly record, not that the person making the request is that person.** Identity binding (linking the requester to the scholarly profile) requires separate mechanisms (email verification, ORCID login OAuth, etc.).
