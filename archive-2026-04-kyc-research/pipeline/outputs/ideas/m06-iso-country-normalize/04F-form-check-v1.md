# 4F form check — m06-iso-country-normalize v1

## Field verdicts

- `external_dependencies` — **PASS.** Names ISO 3166 open mirrors (Debian iso-codes, CLDR, pycountry) explicitly noting the standard is gated; OFAC EO authorities; 31 CFR 589; EU 2022/263; DPRK transliteration variants.
- `endpoint_details` — **PASS.** Open-ingest pattern + vendor alternatives (Smarty, Loqate, Google Maps) with cost estimates and ToS notes.
- `fields_returned` — **PASS.** Concrete normalization output schema.
- `marginal_cost_per_check` — **PASS.** Two paths costed.
- `manual_review_handoff` — **PASS.** Geofence-hit auto-block, ambiguity, and re-export-text-mention paths distinguished.
- `flags_thrown` — **PASS.** Five flags including the keyword-in-unrelated-line case.
- `failure_modes_requiring_review` — **PASS.** Including the important Kherson/Zaporizhzhia scope nuance.
- `false_positive_qualitative` — **PASS.** Five concrete legitimate-customer populations including the Crimea-displaced institutions case.
- `record_left` — **PASS.** Includes both BIS 762.6 and OFAC 501.601 retention.

## For 4C to verify

- ISO 3166-2:RU does NOT code Crimea/DPR/LPR/Kherson/Sevastopol/Zaporizhzhia
- EO 13660 / EO 14065 dates and scope
- Kherson/Zaporizhzhia NOT in OFAC's comprehensively-sanctioned set (current guidance)
- 31 CFR 589 codification
- 31 CFR 501.601 5-year retention

## Verdict

PASS.
