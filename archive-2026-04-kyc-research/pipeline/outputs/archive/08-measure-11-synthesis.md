# Measure 11 — payment-no-crypto: Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (which) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| **m11-psp-config-audit** | Stripe/Adyen/Braintree management APIs | ~$0/audit (CI compute) | Near-zero per order; ~30 min incident response when audit fires | 0 in current corpus (crypto-funding — no branch routes crypto to synthesis provider); prevents configuration drift | New PSP payment-method types not in disallowed-keyword list — est. 1–2 crypto-adjacent types/year; Stripe Connect accounts with independent capabilities | Operational discipline dependency: team must track PSP changelog updates to maintain keyword list |
| **m11-crypto-onramp-denylist** | Internal BIN denylist of crypto-debit programs; WAF/edge referrer inspection | ~$0/check runtime | Near-zero (hard block, minimal exception path; referrer hits near-zero volume) | 0 in current corpus (crypto-funding, crypto-debit-card — forward-looking defense) | 15–30% of crypto-card BIN ranges uncovered between quarterly refreshes; referrer leg has near-zero adversarial value (suppressed by modern browser policies) | Crypto-debit cards reported as `debit` not `prepaid` evade both BIN list and m10-stripe-funding fallback |
| **m11-msa-prohibition** | Legal clause in MSA/ToS; internal regex scan over order metadata | ~$0/scan runtime; $300–$1,500 legal review (one-time) | 10–60 min/week on regex FP triage (cryptography researchers, hex identifiers) | 0 in current corpus (crypto-funding — deterrence + audit trail only) | MSA provides zero technical prevention (100% legal, not detection); regex has near-zero adversarial resistance (trivially evaded by obfuscation); 20–40% of communication surface unscanned | Any attacker aware of the scan trivially evades it; MSA clause deters only compliant customers |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

One coverage gap is shared and inherent to the measure itself:

1. **No attacker story routes cryptocurrency to the synthesis provider.** The corpus confirms crypto appears exclusively as an attacker-internal payment instrument (buying infostealer logs, stolen credentials, phishing kits) on third-party criminal marketplaces — entirely outside the synthesis provider's payment surface. Every branch pays the synthesis provider with a standard credit/debit card, LLC bank account, or institutional PO/invoice. The measure is unstressed because attackers have no operational reason to prefer crypto payment at the provider level.

There are no customer-category coverage gaps in the traditional sense because M11 does not screen customers — it screens infrastructure configuration (psp-config-audit), payment instruments (crypto-onramp-denylist), and contractual/textual references (msa-prohibition). The gap is between the measure's scope and the threat model.

### Complementary gaps

The three ideas form a layered defense along different surfaces:

| Defense surface | Idea covering it | What it prevents |
|---|---|---|
| PSP configuration (payment methods available) | psp-config-audit | Accidental enablement of crypto payment rails |
| Payment instrument (card BIN at checkout) | crypto-onramp-denylist | Crypto-debit card used as payment instrument |
| Contractual + textual (ToS + order metadata) | msa-prohibition | Legal basis for denial; naive/accidental crypto references |

These three surfaces are genuinely complementary — no single idea covers all three. The psp-config-audit prevents the structural precondition (crypto rails enabled); the crypto-onramp-denylist catches the instrument if it slips through; the MSA provides the legal framework.

### Net coverage estimate

If a provider implemented all three ideas, the probability of a customer successfully paying with cryptocurrency would be near-zero — not because the ideas catch attacker attempts, but because they prevent the payment rails from existing in the first place. The psp-config-audit is the load-bearing control: if crypto payment methods are not enabled at the PSP level, no crypto payment can be processed regardless of BIN denylist or MSA clause coverage. Qualitative band: **most** crypto-payment attempts would be blocked (structurally, not by detection). Against the current threat model: **zero** attacker stories affected.

## 3. Bypass cross-cut

### Universally uncovered bypasses

One bypass is universal and trivial:

1. **Pay with a standard credit/debit card or bank account.** Every idea in the M11 suite screens for crypto-specific payment methods or references. Any attacker who pays with conventional instruments bypasses the entire suite. The corpus confirms this is universal practice.

### Bypass methods caught by at least one idea

| Bypass | Caught by | Not caught by |
|---|---|---|
| Crypto payment method accidentally enabled on PSP | psp-config-audit | crypto-onramp-denylist, msa-prohibition (react to payments, not configuration) |
| Known crypto-debit card BIN at checkout | crypto-onramp-denylist | psp-config-audit (checks config, not transactions), msa-prohibition (scans text, not BINs) |
| Customer mentions "BTC" or wallet address in order notes | msa-prohibition (regex scan) | psp-config-audit, crypto-onramp-denylist (do not scan text) |
| Unlisted crypto-debit card reporting as `debit` | None | All three ideas miss this |

### Attacker stories where every idea fails

All 19 attacker stories in the corpus bypass M11 trivially because none attempts to pay the synthesis provider with cryptocurrency. The measure is not stressed by the current threat model.

## 4. Bundling recommendations

### Recommended core: psp-config-audit alone

The PSP config audit is the only M11 idea that provides structural prevention rather than detection:
- **Near-zero cost** (~$0 runtime, 4–8 hours setup).
- **Zero customer-facing friction** (no false positives on customer orders).
- **Zero reviewer burden** per order (fires only on configuration drift, not transaction patterns).
- **Prevents the precondition** for crypto payment rather than trying to detect it after the fact.

This single idea satisfies the measure's intent ("do not accept cryptocurrency for payment") by ensuring cryptocurrency payment methods are never enabled. If crypto rails are disabled at the PSP level, the BIN denylist and MSA clause are redundant for the payment-blocking function.

### Recommended add-on: msa-prohibition (MSA clause only, not regex scan)

The MSA/ToS prohibition clause should be included for legal and audit-trail reasons:
- Provides contractual basis for refusing crypto payment if it is ever attempted.
- Creates a documented policy artifact for regulators.
- Near-zero cost ($300–$1,500 one-time legal review).

The regex-scan component of this idea is optional. Its adversarial value is near-zero (trivially evaded), and the false-positive load from cryptography researchers is manageable but non-zero. Including it provides marginal audit-trail depth at the cost of 10–60 min/week reviewer time.

### Not recommended as core: crypto-onramp-denylist

The BIN denylist catches crypto-debit cards, but:
- If the PSP config audit prevents crypto payment methods from being enabled, the remaining attack surface is limited to crypto-debit cards (which look like regular debit cards to the PSP).
- The denylist has a 15–30% coverage gap between quarterly refreshes.
- The referrer leg has "near-zero adversarial value" per the implementation's own assessment.
- Sponsor-bank ambiguity (Pathward issues both crypto and non-crypto BINs) creates the same curation challenge as the M10 prepaid-issuer-denylist.

If included, it adds a thin layer of defense against crypto-debit cards specifically. The cost is low (~$0 runtime, 2 hours/quarter maintenance), so it is not harmful — but it should not be counted as meaningful coverage in policy calculations.

### Residual uncovered risk

The measure's residual risk is the same as M10's: it defends against a payment method no modeled attacker uses at the synthesis-provider level. The psp-config-audit ensures crypto rails stay disabled. The remaining theoretical gap — a crypto-debit card from an unlisted program reporting as `debit` — requires the attacker to both want to use crypto (which no modeled attacker does) and to find a card that evades both the PSP `funding` field and the BIN denylist. This is a low-probability scenario that does not appear in the current threat model.
