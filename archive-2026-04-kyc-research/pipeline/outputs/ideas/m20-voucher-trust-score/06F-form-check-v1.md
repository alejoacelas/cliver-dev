# 6F form check — m20-voucher-trust-score coverage v1

## Per-gap checklist

| Gap | Category defined? | Size estimate? | Citation / tag? | Behavior labeled? | Verdict |
|---|---|---|---|---|---|
| Gap 1: Industry biotech vouchers | Yes — precise | Yes — 15–25% of vouchers | [best guess] with derivation from cited market share (~50–52%) and estimated ORCID adoption | false-positive | PASS |
| Gap 2: Non-ROR institutions | Yes — precise | Yes — 10–20% of vouchers | [best guess] derived from ROR count (110k, cited) vs estimated total institutions; total institution estimate is rough | weak-signal | PASS with note |
| Gap 3: Early-career researchers | Yes — precise | Yes — 15–25% of vouchers | [best guess] with NSF postdoc data cited; synthesis-specific share is extrapolated | weak-signal | PASS |
| Gap 4: Non-Anglophone domains | Yes — precise | Yes — 5–15% of vouchers | [best guess]; UNESCO researcher count cited for China; allowlist scope is speculative | false-positive | PASS with note |
| Gap 5: Privacy-strict refusers | Yes — precise | Yes — 2–5% of vouchers | [unknown — searched for: ...] on refusal rate; KYC abandonment analogy used | false-positive | PASS |
| Gap 6: Intersectional case | Yes — describes exact intersection | Yes — <2% | [best guess] — logical intersection, no independent source | false-positive | PASS |

## Schema field coverage

| Field | Status | Note |
|---|---|---|
| coverage_gaps | Populated | 6 gaps with categories, sizes, behaviors, and reasoning |
| false_positive_qualitative | Refined | 6-item list with cross-references to gaps; union estimate of 25–40% |

## Flags

### Flag 1: Gap 2 total-institution estimate is weakly grounded
- **Severity:** Minor
- The estimate of 200,000–400,000 research-employing organizations is derived from UNESCO's ~9M researcher count divided by an assumed average institution size of 30–50. The assumed institution size is not cited. This is acceptable as a [best guess] but the range is wide (2x).
- **Recommendation:** Acceptable for v1. A tighter estimate could come from Scopus or OpenAlex affiliation counts, which would be a better proxy for "institutions that actually order synthesis."

### Flag 2: Gap 4 DKIM allowlist scope is assumed, not researched
- **Severity:** Minor
- The gap assumes the DKIM-institutional-email check uses an "allowlist" of recognized institutional domain patterns, but the 04 spec for the sibling check (m20-dkim-institutional-email) was not consulted to confirm the mechanism. If that check uses ROR domains rather than a curated TLD list, the overlap with Gap 2 is larger and Gap 4 as stated may be smaller.
- **Recommendation:** Cross-reference with m20-dkim-institutional-email's 04 spec in stage 7 synthesis.

### Flag 3: No [unknown] tags with thin search lists
- **Severity:** Observation (positive)
- Gap 5 correctly uses `[unknown — searched for: ...]` for the refusal rate. All other gaps use `[best guess]` with stated derivations. Sourcing conventions are followed.

## Verdict: PASS

All required fields populated. Two minor flags for stage 7 awareness, neither requiring a re-iteration of stage 6.
