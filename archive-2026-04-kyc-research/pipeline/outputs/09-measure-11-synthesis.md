# Measure 11 — payment-no-crypto: Per-measure synthesis

## 1. Side-by-side table of selected ideas

| Field | m11-psp-config-audit | m11-msa-prohibition |
|---|---|---|
| **Name** | PSP config audit (no crypto methods enabled) | MSA prohibition + order-text crypto-reference scan |
| **Layer** | Structural prevention (infrastructure) | Policy (legal) + residual detection (text scan) |
| **Attacker stories addressed** | None in corpus. Defense-in-depth against configuration drift. | None in corpus. Defense-in-depth + audit-trail infrastructure. |
| **What it checks** | PSP management APIs (Stripe, Adyen, Braintree) for enabled crypto payment methods | MSA click-through acceptance; nightly regex scan of order metadata for wallet addresses and crypto keywords |
| **External dependencies** | Stripe Account/Capabilities API, Adyen Management API, Braintree Config endpoint, CI runner, Slack alerting | Legal counsel (one-time), internal database, reviewer queue |
| **Setup cost** | 4-8 hours engineering, ~$0 | Legal review $300-$1,500 + ~4 hours engineering |
| **Marginal cost per check** | ~$0 (API calls + CI seconds) | ~$0 (database regex); 10-60 min/week reviewer time on hits |
| **Customer-facing false positives** | Zero — inspects provider config, not customer behavior | Low — cryptography researchers (~<0.5% of customers), hex-identifier FPs (~1-5 per 10k orders) |
| **Flags thrown** | `crypto_method_enabled` — pages on-call engineer | `order_text_crypto_reference` — routes to reviewer triage; `msa_crypto_clause_violated` — enforcement event |
| **Adversarial resistance** | N/A — operates on provider infrastructure, not attacker behavior | Near-zero — trivially evaded by obfuscation, non-English terms, or image embedding |
| **Record left** | CI logs (masked), allowlist YAML in git, incident tickets, aggregate dashboard | MSA version + click-through log, matched-record snapshots in immutable log, reviewer dispositions, aggregate dashboard |
| **Bypass methods known** | None (no in-corpus stories stress this) | None (no in-corpus stories stress this) |
| **Bypass methods uncovered** | None (no in-corpus stories stress this) | None (no in-corpus stories stress this) |

## 2. Coverage gap cross-cut

### Structural gaps (prevention failures)

These are gaps where the technical architecture does not cover a scenario:

1. **New PSP crypto method types not in the disallowed-keyword list** (m11-psp-config-audit). When a PSP introduces a new crypto-adjacent payment method type, there is a window of vulnerability until the audit script is updated. Estimated frequency: 1-2 types/year across major PSPs. Window length depends on changelog-monitoring discipline (days to months).

2. **Stripe Connect connected accounts** (m11-psp-config-audit). Connected accounts have independent capabilities. Affects <5% of synthesis providers but is a total gap for those affected unless explicitly coded.

3. **Non-PSP crypto payment paths** (m11-psp-config-audit). A direct BitPay or Coinbase Commerce integration bypasses the PSP audit entirely. Requires deliberate engineering effort, so negligible for most providers.

4. **Test vs live mode divergence** (m11-psp-config-audit). Audit may run against one environment but not the other. Low practical risk.

5. **Fail-open on insufficient API key scope** (m11-psp-config-audit). One-time implementation bug; mitigated by asserting non-empty responses.

### Complementary gaps (detection limitations)

These are gaps in the detection/policy layer that do not undermine the structural prevention:

6. **Obfuscated or non-English crypto references** (m11-msa-prohibition). An attacker aware of the regex scan trivially evades it. Near-zero adversarial resistance. This gap is moot when the PSP config audit is healthy — there is no crypto payment method to route to.

7. **Unscanned communication channels** (m11-msa-prohibition). Estimated 20-40% of customer-provider communication surface (phone, unindexed email, external chat, attachments) is invisible to the text scan. Again moot when structural prevention is in place.

8. **MSA provides no technical prevention** (m11-msa-prohibition). The MSA clause is a legal instrument, not a detection or prevention control. Its value is deterrence, legal recourse, and audit-trail completeness.

9. **Ethereum regex false positives on hex identifiers** (m11-msa-prohibition). Low-rate noise from SHA-1 hashes or other 40-char hex strings. Estimated 1-5 per 10k orders.

### Cross-cut summary

The two ideas compose cleanly along a structural/complementary axis. The PSP config audit provides the load-bearing prevention: if crypto payment methods are not enabled on the PSP, no customer can pay in crypto regardless of what they write in order notes or agree to in the MSA. The MSA prohibition and text scan operate as policy + residual detection, catching edge cases and providing legal/audit infrastructure. All structural gaps (1-5) live in the PSP config audit; all complementary gaps (6-9) live in the MSA/scan. The complementary gaps are moot when the structural layer is healthy, meaning the stack's effective gap surface is dominated by items 1-3 above.

## 3. Bypass methods uncovered cross-cut

### Attacker stories surviving the entire selected stack

**None.** The attacker mapping (`measure-11-payment-no-crypto.md`) found zero relevant attacker stories in the corpus. Every in-corpus attacker branch pays the synthesis provider with a real personal credit card, business bank account, institutional PO/P-card, or international wire. No branch routes cryptocurrency to the synthesis provider.

The four mentions of crypto in the attacker corpus are all attacker-internal uses (buying infostealer logs, stolen credentials, or lookalike domains on criminal marketplaces). These transactions occur on third-party platforms entirely outside the synthesis provider's payment surface, so Measure 11 controls do no work against them.

### Implication

Measure 11 is structurally unstressed by the current attacker corpus. The selected stack defends against a hypothetical future scenario — an attacker or legitimate customer who wants to pay in crypto — rather than any observed attack path. This means:

- The PSP config audit's value is primarily as a configuration-integrity safeguard (preventing accidental crypto enablement) and a regulatory compliance demonstration.
- The MSA clause's value is primarily as a legal foundation for the broader M11 policy and as audit-trail evidence.
- Neither idea needs to withstand adversarial pressure from the current corpus.

## 4. Structural gaps flagged as open issues

1. **New PSP crypto method types (changelog monitoring discipline).** The primary structural gap in the stack. The PSP config audit's disallowed-keyword list must be updated whenever a PSP introduces a new crypto-adjacent payment method type. This is an operational discipline requirement, not an architectural one. Whether the synthesis provider maintains this discipline over time is a human judgment call. **Recommendation:** Subscribe to PSP changelogs (Stripe, Adyen, Braintree) and add changelog review to a quarterly operational checklist.

2. **Stripe Connect connected accounts.** If the synthesis provider uses Stripe Connect, connected accounts have independent capabilities not covered by the default audit. Affects <5% of providers but is a total gap for those affected. **Recommendation:** If Stripe Connect is in use, extend the audit to enumerate and check all connected accounts.

3. **Non-PSP crypto integrations.** A direct BitPay or Coinbase Commerce integration is outside the PSP audit's scope. **Recommendation:** Include a code-search step in the CI audit that greps the codebase for BitPay, Coinbase Commerce, or similar SDK imports.

4. **GDPR/CCPA scoping of free-text scanning.** The regex scan over customer order notes is generally permitted under "fraud prevention" lawful basis, but EU/UK providers should document the scan's purpose and legal basis with counsel. This is a legal question, not a technical one.

5. **Dependency on Measure 10.** The dropped BIN-denylist idea's primary value (catching crypto-debit cards that report as `debit` rather than `prepaid`) is assumed to be absorbed by the m10-stripe-funding prepaid-card block. If M10 is not implemented, the BIN-denylist leg of the dropped m11-crypto-onramp-denylist should be reconsidered.

6. **Thin evidence behind communication-channel gap estimate.** The 20-40% unscanned communication surface estimate (Gap 7 above) is a broad best guess with thin supporting evidence. This gap is complementary rather than structural, so it does not undermine the stack's prevention capability, but the estimate should not be treated as precise.
