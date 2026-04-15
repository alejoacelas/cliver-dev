# m11-msa-prohibition — bypass-aware hardening v1

- **measure:** M11 (payment-no-crypto)
- **implementation reviewed:** `04-implementation-v1.md`

## Attacker-story walkthrough

**No attacker stories to walk.** Per the measure-11 attacker-story mapping, no in-corpus branch routes cryptocurrency to the synthesis provider. The MSA prohibition + regex scan is a defense-in-depth / audit-trail control.

The implementation correctly frames this: "Per the measure-11 attacker mapping, no in-corpus branch routes crypto to the synthesis provider, so this is a defense-in-depth + audit-trail control rather than a primary block."

## bypass_methods_known

None. No corpus stories stress this check.

## bypass_methods_uncovered

None. No corpus stories stress this check.

## Findings

No findings.

**Note for synthesis:** the MSA clause is not a technical block — it provides legal grounds and audit-trail evidence. The regex scan catches naive textual references but is trivially evaded by obfuscation. The implementation already documents both limitations. The combination with m11-psp-config-audit and m11-crypto-onramp-denylist provides the technical enforcement layer.

## Verdict

**PASS** — no Critical findings. Pipeline continues to stage 6.
