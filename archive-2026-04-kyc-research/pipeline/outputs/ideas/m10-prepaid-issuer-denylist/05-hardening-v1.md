# m10-prepaid-issuer-denylist — bypass-aware hardening v1

- **measure:** M10 (payment-bin-giftcard)
- **implementation reviewed:** `04-implementation-v1.md`

## Attacker-story walkthrough

**No attacker stories to walk.** Per the measure-10 attacker-story mapping (`attackers/by-measure/measure-10-payment-bin-giftcard.md`), no in-corpus branch routes a gift card or prepaid card BIN to the synthesis provider as the load-bearing payment method. The two adjacent mentions (inbox-compromise Method 5.2 "prepaid virtual card" and foreign-institution Method 3 "prepaid debit card in real name") are non-load-bearing sub-options, and the mapping file classifies them as not on-target for measure 10's gift-card-specific BIN check.

The implementation itself acknowledges this in `attacker_stories_addressed`, which lists hypothetical story labels ("prepaid-gift-card", "virtual-single-use-bin") rather than actual corpus branch slugs. The two inbox-compromise / foreign-institution references are noted parenthetically.

## bypass_methods_known

None. No corpus stories stress this check.

## bypass_methods_uncovered

None. No corpus stories stress this check.

## Findings

No findings. There are no attacker stories against which to evaluate the implementation's bypass coverage.

**Note for synthesis:** the absence of attacker stories does not mean the check is unnecessary — it means the current attacker corpus does not include a branch that uses gift cards or prepaid cards as the primary payment instrument at the synthesis provider. The check is forward-looking / defense-in-depth. This structural observation should be carried into the stage 7 synthesis.

## Verdict

**PASS** — no Critical findings. Pipeline continues to stage 6.
