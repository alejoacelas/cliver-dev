# Adversarial review: institution-registry (FINAL)

**Iterations:** 1 (thorough initial testing -- no high-severity untested gaps requiring re-run)

## Resolved findings

- **Community bio labs are a hard zero across all registries.** 5 community labs tested (Genspace, BioCurious, La Paillasse, Hackuarium, BioClub Tokyo) -- all invisible to ROR, GLEIF, and Companies House. Stage 3 tested both US and non-US labs, confirming this is a structural gap, not a geographic one. No re-run needed because additional community lab cases would return the same zero results -- the boundary is established.
- **Small biotech startups are a hard zero.** 6 small biotechs from the customer dataset tested. All invisible to every registry. The customer types "Controlled Agent Industry" and "General Life Science" include companies in this category. The gap is confirmed and stable.
- **ROR provides city-level only.** Multi-campus institutions (Griffith, CSIRO) tested alongside single-campus. The city-level limitation is inherent to ROR's data model, not a coverage gap that additional testing would resolve.
- **GLEIF legal addresses are misleading for KYC.** Pfizer (Delaware registered agent) and Oxford (individual colleges, Liverpool investment manager) tested. GLEIF addresses reflect corporate registration, not physical operations. The assessment holds for any large organization.
- **Non-OECD universities are well-covered in ROR.** 7 institutions tested across Africa, Asia, Middle East (Nairobi, Makerere, Al-Farabi Kazakhstan, Universitas Indonesia, Baqiyatallah Iran). All found with correct city. Contrary to the pre-committed hypothesis. Covers both Sanctioned Institution and General Life Science customer types.
- **CDC-style disambiguation confirmed.** Uganda CDC returned before US CDC in relevance ranking. Automated matching against ROR for institutions with international offices is unreliable without additional disambiguation logic.
- **Companies House is excellent for UK, noise for everything else.** AstraZeneca full coverage; all non-UK queries returned 10,000 irrelevant matches with false-match entity names.

## Unresolved findings (forwarded to final synthesis)

- **Consolidated Screening List not tested (out of scope for this group).** Entity-level screening is covered in the export-control group, but the BLOCKED status there means no group has entity screening coverage. The institution-registry group cannot compensate for this.

## Open medium/low findings (informational, not blocking)

- **MEDIUM: Recently founded companies (2024-2025) not tested.** Stage 3 notes this as a "what I'd test with more budget" item. The hypothesis is a 12-24 month lag for ROR, immediate for Companies House (UK only). This would quantify the lag but not change the structural assessment: small/new companies are invisible.
- **MEDIUM: Dissolved/merged entities not tested.** Whether registries retain historical records and how they flag them is unknown. Relevant for KYC because a customer claiming an affiliation with a dissolved company is a red flag. Not high-severity because the primary use case is confirming current affiliations, not detecting defunct ones.
- **MEDIUM: Coworking space tenants not tested in GLEIF/Companies House.** Would multiple entities share the same GLEIF address at a WeWork? Unknown, but the assessment already classifies GLEIF addresses as unreliable for KYC, so this finding wouldn't change the verdict.
- **LOW: GLEIF fulltext vs. legalName filter comparison not done.** Would improve operational guidance for GLEIF queries but wouldn't change the structural assessment that GLEIF is a narrow niche tool.
- **LOW: Companies House SIC code filtering not tested.** Could improve UK-company result quality, but Companies House is already rated as useful only for the UK niche.
- **LOW: ROR domains field is inconsistent (~50% populated).** Documented but not a blocking issue since email-to-institution is primarily handled by the email-domain group.
