# m11-psp-config-audit — bypass-aware hardening v1

- **measure:** M11 (payment-no-crypto)
- **implementation reviewed:** `04-implementation-v1.md`

## Attacker-story walkthrough

**No attacker stories to walk.** Per the measure-11 attacker-story mapping, no in-corpus branch routes cryptocurrency to the synthesis provider. The PSP config audit is a structural defense-in-depth control that prevents accidental enablement of crypto payment methods.

The implementation correctly notes: "Defense-in-depth — none of the in-corpus attacker branches route crypto to the synthesis provider, but a misconfigured PSP is a structural footgun this catches."

## bypass_methods_known

None. No corpus stories stress this check.

## bypass_methods_uncovered

None. No corpus stories stress this check.

## Findings

No findings.

**Note for synthesis:** this idea addresses configuration drift rather than attacker behavior. Its value is in preventing the synthesis provider from accidentally opening a crypto payment channel that an attacker could then exploit. The implementation's coverage of Stripe capabilities (`crypto_payments`, `stablecoin_payments`) and Adyen `paymentMethodSettings` is concrete and well-documented.

## Verdict

**PASS** — no Critical findings. Pipeline continues to stage 6.
