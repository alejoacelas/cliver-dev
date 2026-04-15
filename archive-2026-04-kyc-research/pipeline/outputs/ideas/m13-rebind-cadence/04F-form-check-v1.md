# 04F form check — m13-rebind-cadence v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | Notes the M13 extension. |
| attacker_stories_addressed | PASS | Refined; covers account-hijack (sim-swap), credential-compromise. |
| summary | PASS | |
| external_dependencies | PASS | Telesign primary; Vonage, tru.ID, CAMARA, Glide as alternates. |
| endpoint_details | PASS | URLs, auth, pricing markers, NIST guidance. CAMARA pricing unknown with explicit search list. |
| fields_returned | PASS | risk_indicator scale, sim_swap fields, CAMARA boolean. |
| marginal_cost_per_check | PASS | Per-query, per-SMS, annualized; explicit "third-party blog" caveat on Telesign pricing. |
| manual_review_handoff | PASS | Scheduled + event + outcome SOP. |
| flags_thrown | PASS | Four flags. |
| failure_modes_requiring_review | PASS | MVNOs, CAMARA gap, legitimate swaps, roaming, dropped numbers. |
| false_positive_qualitative | PASS | Five FP categories. |
| record_left | PASS | Concrete schema. |

## For 4C to verify

- Telesign sim_swap risk_indicator scale 1–4 — verify on the developer.telesign.com page.
- Telesign SIM swap pricing $0.10/$0.05 — third-party (dropcowboy.com); should be replaced with a Telesign-direct quote if possible.
- NIST SP 800-63B does not prescribe a fixed phone re-verification cadence — verify.
- CAMARA Number Verification project hosts a SIM Swap API — verify.

## Verdict

PASS
