# 06F form-check v1 — m14-fido2-stepup

| Field | Verdict | Note |
|---|---|---|
| Gap 1 (no authenticator) | PASS | Category precise; size estimate cites FIDO Alliance 69% figure and reasons about the synthesis-customer skew. |
| Gap 2 (shared-lab accounts) | PASS | Category precise; proxy cites Ithaka S+R and IMARC gene synthesis market share. Size is `[best guess]` with reasoning. |
| Gap 3 (restricted shipping) | PASS | Category precise; size estimate cites OFAC list and Fortune BI OECD concentration. Small gap, correctly sized. |
| Gap 4 (accessibility) | PASS-with-caveat | Size marked `[unknown ...]` with 3-query search list. The <1% best-guess is plausible but unsourced — acceptable given the search came up empty. |
| Gap 5 (CRO staff turnover) | PASS | Category precise; cites Prophecy Market Insights for commercial share. Turnover figure ("20–30% annual") lacks a specific citation — should ideally cite a CRO industry report. |
| Gap 6 (synced passkeys) | PASS | Category precise; cites FIDO Alliance. The 80–95% synced estimate is `[best guess]` with reasoning. |
| false_positive_qualitative | PASS | Cross-referenced to gaps. |
| Notes for stage 7 | PASS | Key trade-off (synced vs device-bound) clearly stated. |

## Issues

1. **Gap 5 turnover figure uncited:** "20–30% annual turnover in CRO clinical roles" lacks a specific source. Should be `[best guess: ...]` or cited. Minor — does not affect the gap's validity.

## Verdict

PASS — proceed to 6C.
