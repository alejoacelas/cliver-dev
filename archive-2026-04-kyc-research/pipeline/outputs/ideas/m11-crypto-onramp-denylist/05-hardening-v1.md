# m11-crypto-onramp-denylist — bypass-aware hardening v1

- **measure:** M11 (payment-no-crypto)
- **implementation reviewed:** `04-implementation-v1.md`

## Attacker-story walkthrough

**No attacker stories to walk.** Per the measure-11 attacker-story mapping (`attackers/by-measure/measure-11-payment-no-crypto.md`), no in-corpus branch routes cryptocurrency to the synthesis provider as a payment method. Crypto appears only as an attacker-internal instrument (buying infostealer logs, stolen credentials, lookalike domains) on third-party criminal marketplaces — entirely outside the synthesis provider's payment surface.

The implementation document correctly acknowledges this: "no in-corpus branch routes crypto to the synthesis provider; this is a forward-looking defense-in-depth check."

## bypass_methods_known

None. No corpus stories stress this check.

## bypass_methods_uncovered

None. No corpus stories stress this check.

## Findings

No findings.

**Note for synthesis:** the crypto-debit BIN leg is the more operationally valuable component; the referrer-denylist leg is acknowledged in the implementation as having "near-zero adversarial value" due to trivial suppression. This is an accurate self-assessment. The referrer leg's near-zero value is not a finding because the implementation already flags it.

## Verdict

**PASS** — no Critical findings. Pipeline continues to stage 6.
