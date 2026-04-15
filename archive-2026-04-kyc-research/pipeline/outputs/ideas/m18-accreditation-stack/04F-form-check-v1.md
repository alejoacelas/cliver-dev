# 04F form check — m18-accreditation-stack v1

| Field | Verdict | Notes |
|---|---|---|
| name / measure / summary | PASS | |
| external_dependencies | PASS | All 9+ registries named. |
| endpoint_details | PASS | Each registry has URL, auth, pricing, ToS, and an explicit `[unknown]` admission for the API question with plausible search lists. CAP and UKAS have minor `[unknown]`s for exact directory tool URL. |
| fields_returned | PASS | Per-registry minimal field list. AAALAC fields marked `[vendor-described, not technically documented]`. |
| marginal_cost_per_check | PASS | Free per-registry; engineering and analyst-time best-guess with reasoning. |
| manual_review_handoff | PASS | Seven-step playbook with concrete escalation paths. |
| flags_thrown | PASS | Five distinct flags. |
| failure_modes_requiring_review | PASS | Seven concrete modes. |
| false_positive_qualitative | PASS | Six concrete cases. |
| record_left | PASS | |

## Borderline

- The CAP and UKAS exact-tool-URL `[unknown]`s are minor; both are mitigated by alternative paths in the document (CAP via QCOR; UKAS by direct site lookup).
- GLP registry is correctly flagged as the weak link.

## For 4C to verify

- AAALAC "1,140+ orgs in 52 countries" — verify against the [AAALAC directory page](https://www.aaalac.org/accreditation-program/directory/directory-of-accredited-organizations/).
- Global BioLabs 69 BSL-4 across 27 countries — verify against the [Global BioLabs Report 2023 PDF](https://www.kcl.ac.uk/warstudies/assets/global-biolabs-report-2023.pdf).
- A2LA "largest accreditor of calibration laboratories in the United States" — verify on [a2la.org](https://a2la.org/).
- CMS QCOR weekly update cadence — verify on the CMS Laboratory Registry page.

**Verdict:** PASS
