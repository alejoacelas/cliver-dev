# Adversarial review: funding-legitimacy (FINAL)

**Iterations:** 1 (thorough initial testing -- no high-severity untested gaps requiring re-run)

## Resolved findings

- **PubMed is the broadest legitimacy signal.** Found publications for 22 of 25 tested institutions. Works for non-US institutions with zero NIH/NSF funding (Zhejiang Sci-Tech: 5,850 articles, Tsinghua: 58,637, WuXi AppTec: 550). Even CROs have publications. The only exceptions are community bio labs. This is the single most universal signal for institutional legitimacy.
- **Community bio labs have zero coverage across all funding databases.** 4 community labs tested (Genspace, BioCurious, Counter Culture Labs, La Paillasse). Zero grants in NIH/NSF/UKRI. PubMed returned 2-5 articles each -- likely word matches, not real affiliations. This is a hard boundary: community labs are outside the formal research funding ecosystem.
- **Small biotech startups have zero funding signal.** Lay Sciences Inc. returned 0 NIH/NSF grants. PubMed returned 12,066 articles -- a false positive because "lay" is a common English word. The common-word institution name problem is real and would affect any keyword-based search.
- **NIH is US-centric with Fogarty international coverage.** Well-covered via Fogarty: Makerere (269 grants), Nairobi (146), Christian Medical College (48) -- all PEPFAR/Fogarty recipients. Not covered: IIT Kanpur (0), Zhejiang Sci-Tech (0), Tsinghua (0), CSIRO (0), INRAE (0). The coverage tracks global health funding, not general research.
- **NSF is almost US-only.** Only found US institutions plus rare international collaborators. Not useful as a general institutional legitimacy signal outside the US.
- **UKRI has moderate international reach through UK collaborations.** Covers many international institutions as collaborators on UK grants. This was a positive surprise in round 2 testing.
- **All four customer types tested.** Controlled Agent Academia (MIT, Scripps, international universities), Controlled Agent Industry (pharma, CROs), General Life Science (community labs, small biotechs), Sanctioned Institution (Baqiyatallah via Makerere/Nairobi as Fogarty proxies). 25 cases across 2 rounds.

## Unresolved findings (forwarded to final synthesis)

- **PubMed false positives from common-word institution names.** Keyword-based PubMed search matches article text, not just affiliation fields. "Lay Sciences" returns 12K articles. "Cell Signaling" would have the same problem. The fix (exact affiliation field matching instead of keyword search) was proposed but not tested. Forward to final synthesis as an implementation requirement for PubMed integration.

## Open medium/low findings (informational, not blocking)

- **MEDIUM: SBIR/STTR grants not tested.** NIH RePORTER includes SBIR/STTR grants for small US companies. These could provide legitimacy signal for small US biotechs that have zero standard NIH grants. Stage 3 notes this as a "more budget" item.
- **MEDIUM: EU CORDIS database not in this pipeline.** Would cover European institutions that have zero NIH/NSF/UKRI funding. This is an endpoint-level gap (the endpoint wasn't included in the pipeline), not a testing gap.
- **MEDIUM: PubMed affiliation field matching vs. keyword matching not compared.** The difference between keyword search (current) and affiliation field matching (proposed) could significantly reduce false positives. This is an implementation concern, not a coverage gap.
- **LOW: NIH org_names sensitivity.** Exact name required -- "INDIAN INSTITUTE OF TECHNOLOGY" returns 0 even though the full name might work. Name normalization is critical for NIH RePORTER integration.
- **LOW: Absence does not equal illegitimacy.** A community bio lab with 0 grants and 0 publications is not necessarily illegitimate. This check identifies institutional research activity, not legitimacy per se. The pipeline must not treat zero-funding as a hard block.
