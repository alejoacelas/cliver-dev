# 04F Form check — m04-str-coloc-sop v1

| Field | Verdict |
|---|---|
| name / measure / summary | PASS |
| external_dependencies | PASS — names Airbnb (no API), VRBO, Inside Airbnb, AirDNA, Wayback CDX, reviewer |
| endpoint_details | PASS — concrete CDX URL, AirDNA vendor-gated marker, Inside Airbnb URL, Airbnb-no-API noted; one borderline thin-search marker on commercial-use license (2 queries). |
| fields_returned | PASS — Inside Airbnb schema and Wayback CDX schema named explicitly |
| marginal_cost_per_check | PASS — reviewer time dominant cost calculated |
| manual_review_handoff | PASS — 7-step playbook with decision rule |
| flags_thrown | PASS |
| failure_modes_requiring_review | PASS |
| false_positive_qualitative | PASS |
| record_left | PASS |

## For 4C to verify
- Inside Airbnb lat/lng obfuscation distance (~150m) — verify, this number is from memory not citation
- AirDNA "10 million listings" — verify
- Wayback CDX field list — verify

**Verdict:** PASS-with-minor-flags (acceptable v1)
