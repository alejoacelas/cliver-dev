# m10-stripe-funding — bypass-aware hardening v1

- **measure:** M10 (payment-bin-giftcard)
- **implementation reviewed:** `04-implementation-v1.md`

## Attacker-story walkthrough

**No attacker stories to walk.** Per the measure-10 attacker-story mapping (`attackers/by-measure/measure-10-payment-bin-giftcard.md`), no in-corpus branch routes a gift card or prepaid card to the synthesis provider. The same two adjacent mentions apply (inbox-compromise Method 5.2 "prepaid virtual card", foreign-institution Method 3 "prepaid debit card in real name") — both non-load-bearing sub-options. Stripe's `card.funding = prepaid` flag would catch both if they were attempted, but no corpus branch attempts them as the primary path.

The implementation correctly notes these as secondary references and does not over-claim coverage against corpus branches.

## bypass_methods_known

None. No corpus stories stress this check.

## bypass_methods_uncovered

None. No corpus stories stress this check.

## Findings

No findings.

**Note for synthesis:** like the sibling m10-prepaid-issuer-denylist, this is a defense-in-depth control. The two ideas are complementary: Stripe funding catches issuer-misreported BINs that the denylist misses (and vice versa — the denylist catches BINs whose issuers report `debit` or `unknown` instead of `prepaid`). The implementation document already notes this complementarity.

## Verdict

**PASS** — no Critical findings. Pipeline continues to stage 6.
