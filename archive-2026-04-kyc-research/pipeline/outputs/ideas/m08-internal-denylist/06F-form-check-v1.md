# 06F Form check — m08-internal-denylist v1

| Field | Verdict |
|---|---|
| coverage_gaps | PASS — 6 gaps identified with precise categories. |
| Gap 1 estimated size | PASS — 65+ providers cited, 50% small/new cited; cold-start reasoning is sound. |
| Gap 2 estimated size | PASS — [best guess] with reasoning about first-time offenders. |
| Gap 3 estimated size | PASS — top-3 market share cited; DOJ safe-harbor withdrawal cited; IGSC public docs cited. IGSC shared denylist status marked [unknown] with 2 search queries. |
| Gap 4 estimated size | PASS — [best guess] with reasoning about identifier rotation. |
| Gap 5 estimated size | PASS — [best guess] with reasoning about successor orgs. |
| Gap 6 estimated size | PASS — GDPR Article 17(3)(e) exemption referenced; marked as untested. |
| false_positive_qualitative (refined) | PASS — separates FP from FN with clear categorization. |
| Notes for stage 7 | PASS — actionable synthesis guidance on cross-provider sharing and deterrence value. |

## For 6C to verify
- 65+ DNA synthesis companies and 50% small/recently established — verify market report source
- Top 3 providers hold ~53% share — verify GM Insights source
- DOJ February 2023 safe-harbor withdrawal — verify ArentFox Schiff source
- IGSC Harmonized Screening Protocol does not document shared denylist — verify against genesynthesisconsortium.org

## Verdict
**PASS**
