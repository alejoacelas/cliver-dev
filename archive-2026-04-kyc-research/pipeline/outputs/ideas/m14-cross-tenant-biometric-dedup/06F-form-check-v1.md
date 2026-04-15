# Form check: 06-coverage-v1.md — m14-cross-tenant-biometric-dedup

## Schema field: `coverage_gaps`

**Status: POPULATED**

Seven gaps identified with all required subfields.

## Citation / sourcing audit

| Gap | Cited? | Notes |
|-----|--------|-------|
| Gap 1 (cross-provider) | Sourced from implementation's own search findings | Adequate — the implementation explicitly searched for cross-vendor systems and found none. |
| Gap 2 (privacy/consent) | Yes — Wikipedia for BIPA; [unknown] for opt-out rates | Acceptable. |
| Gap 3 (cold-start) | Derived from implementation's own estimate | Adequate. |
| Gap 4 (deepfake) | Yes — kyc-chain.com for 6.5% fraud-attempt share; Mitek for >99% detection rate | Adequate. |
| Gap 5 (identical twins) | Yes — Notre Dame/NIST research for twin FAR rates | Adequate. |
| Gap 6 (institution change) | Marked [best guess] | Acceptable — no external proxy exists for academic IDV re-enrollment rates. |
| Gap 7 (demographic bias) | Yes — NIST FRVT demographic effects page for 7203x variation | Strong citation from authoritative source. |

## Completeness check

- All gaps have behavior classification: **PASS**
- `false_positive_qualitative` updated: **PASS**
- Notes for stage 7 synthesis present: **PASS**

## Flags

- **FLAG (minor):** Gap 1's "30–50% of active synthesis customers may order from 2+ providers" is a significant claim about customer behavior with no citation. This is hard to source but the estimate should be explicitly labeled as speculative.

## Verdict: PASS with minor flag
