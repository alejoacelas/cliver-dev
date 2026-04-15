# 06F Form check: m10-binlist-stack — coverage v1

## Field-by-field verdicts

### coverage_gaps
**PASS** — Five gaps identified with precise categories. The analysis correctly surfaces the fundamental cost-benefit problem: near-zero true-positive rate (no attacker stories use gift cards) against significant false-positive rate (corporate virtual cards). The 8-digit BIN transition analysis (Gap 3) and single-vendor dependency for gift classification (Gap 4) are technically specific and useful.

### false_positive_qualitative (refined)
**PASS** — Cross-references gaps and correctly highlights the implementation's own admission that "the FP picture dominates the TP picture." Actionable.

### Notes for stage 7 synthesis
**PASS** — Raises the correct question about marginal value over the PSP's built-in `card.funding` field. This is the key synthesis question.

## Flags

### VAGUE: Gap 2 non-US BIN coverage
The claim "10–30% thinner" coverage for non-US BINs is a best guess with no derivation. What does "thinner" mean operationally — higher `bin_unknown` rate, lower accuracy on prepaid flag, or both?

## For 4C to verify

1. The virtual card adoption figure "70% of US corporations by 2024" from CoinLaw — verify the primary source and whether this refers to all corporations or a specific segment.
2. BinDB's claim of "12,000+ prepaid/virtual/gift card" identifications — verify this number is current.
3. The April 2022 Visa/Mastercard 8-digit BIN mandate — verify the effective date and whether 6-digit lookups are still supported.

## Verdict: PASS

One minor VAGUE flag on non-US BIN coverage. The coverage analysis is strong, particularly the identification of the near-zero true-positive rate. No revision needed.
