# 4F form check — m20-voucher-idv v1

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | |
| summary | PASS | |
| external_dependencies | PASS | Six vendors enumerated with IAL2-certification status; Persona's status admitted as unknown with valid query list. |
| endpoint_details | PASS | Stripe used as concrete worked example with real URLs; other vendors clean vendor-gated. |
| fields_returned | PASS | Concrete Stripe schema; analogous note for others. |
| marginal_cost_per_check | PASS | Per-check ranges with vendor-gated markers; setup cost noted. |
| manual_review_handoff | PASS | Six-step SOP with concrete reviewer decisions. |
| flags_thrown | PASS | Seven flags. |
| failure_modes_requiring_review | PASS | Six concrete modes including demographic FR bias. |
| false_positive_qualitative | PASS | Six categories; FRVT bias has [unknown] admission. |
| record_left | PASS | Vendor JSON, retention period, replayable artifact, hash. |

## For 4C to verify

- Jumio IAL2 certification claim.
- Onfido (Entrust) IAL2 certification claim.
- Stripe Identity "first 50 free" claim.
- Login.gov Oct 2024 IAL2 certification by Kantara.
- Onfido pricing band ($1.50–$5).

**Verdict:** PASS
