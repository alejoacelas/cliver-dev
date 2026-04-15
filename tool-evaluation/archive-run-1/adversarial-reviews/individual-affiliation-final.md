# Adversarial review: individual-affiliation (FINAL)

**Iterations:** 1 (thorough initial testing -- no high-severity untested gaps requiring re-run)

## Resolved findings

- **ORCID institution-verification is mythical in practice.** 0/11 tested employment entries were institution-verified. All self-asserted. Even a record found via MIT's Ringgold org ID had self-asserted employment. ORCID affiliation data has no more trust than a user's self-reported claim. An attacker could create an ORCID profile claiming any institution in ~5 minutes. This is a definitive finding -- the pre-committed hypothesis was ~2%, and the actual rate is 0%.
- **Common names break both ORCID and OpenAlex.** Wei Zhang: 3,304 ORCID / 9,085 OpenAlex. Maria Garcia: 2,464 / 17,865. Even filtering OpenAlex by institution (Qiang He at Chongqing Medical University) returned 7 different people. Name-based search alone cannot disambiguate common names. This affects ~25% of synthesis customers (Chinese, Indian, and common Western names).
- **OpenAlex conflates and splits authors.** Shuvankar Dey's profile merges publications from "Sarthak Dey", "Sudip Dey", and "S. Dey." George F. Gao's profile has 1,192 works across 100+ institutions. Nathalie Bastien is split across two profiles. Disambiguation is unreliable in both directions.
- **Small companies are invisible.** Lay Sciences, Fusix Biotech, GREENVAX, Lanzhou Yahua Biotech, Darts Bio -- all real synthesis DNA customers, none in OpenAlex. The threshold appears to be ~100 publications. This covers the "Controlled Agent Industry" customer type.
- **Institution changes create persistent lag.** Raiees Andrabi moved from Scripps to UPenn in July 2023; OpenAlex still lists Scripps in April 2026. Gert Zimmer at IVI Switzerland since 2009; OpenAlex shows University of Bern. ORCID is more current but only because the user manually updates it.
- **Industry affiliations invisible for dual-role researchers.** Pierre Charneau (TheraVectys + Pasteur): only Pasteur shows. Jennifer Altomonte (Fusix + TU Munich): only TUM shows. SOHN Myung Hyun (GREENVAX + Yonsei): only Yonsei. Researchers straddling academia and industry show only the academic side.
- **Sanctioned institutions are paradoxically well-covered.** Baqiyatallah has 12,385 works in OpenAlex. Researchers findable with correct affiliations. This makes sense -- sanctioned institutions are typically large publishing universities.
- **Adversarial attack surface fully mapped.** 5 attack vectors identified: fake ORCID (~5 min), common name impersonation, small company claims (unverifiable), stale affiliation exploitation, use of real person's publication record. All tested or analyzed.

## Unresolved findings (forwarded to final synthesis)

- **Identity binding is fundamentally missing.** ORCID/OpenAlex verify that a person-institution association exists in the scholarly record, not that the requester is that person. A separate mechanism (ORCID OAuth login, email verification to institutional address, institutional SSO) is required to bind the requester to the scholarly profile. This is an architectural limitation, not a testing gap.

## Open medium/low findings (informational, not blocking)

- **MEDIUM: Coverage estimate for KYC use is rough.** Stage 3 estimates: 30% unique-name published academics (strong signal), 25% common-name academics (weak/no signal), 20% large-company industry (moderate), 15% small-company industry (no signal), 5% early-career (weak), 5% community/non-traditional (no signal). These percentages are educated guesses, not empirically measured against the customer dataset.
- **MEDIUM: OpenAlex filter=display_name.search combined with institution.id was proposed but not systematically tested.** This is the recommended disambiguation approach. Whether it works for the hardest cases (common names, small institutions) is unvalidated.
- **LOW: ORCID empty employment records.** Some ORCID records exist but have no employment entries at all. This is a silent failure -- the system would need to treat "ORCID found but empty" differently from "ORCID not found."
- **LOW: OpenAlex last_known_institutions ordering.** The first institution in the list is not necessarily the most current. Operational guidance: never trust the ordering without checking publication dates.
