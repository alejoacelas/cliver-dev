# Coverage research: PSP config audit (no crypto methods enabled)

## Coverage gaps

### Gap 1: New PSP payment method types not in the disallowed-keyword list
- **Category:** Any scenario where the PSP introduces a new payment method type with a crypto/stablecoin capability under a name the audit script does not check for. The script checks for `crypto_payments`, `stablecoin_payments`, and known variants — but Stripe adds new payment method types regularly (e.g., the `stablecoin` type added in the 2025-06-30 API version [source](https://docs.stripe.com/changelog/basil/2025-06-30/crypto-payment-method)). Adyen similarly adds new `paymentMethodVariant` values.
- **Estimated size:** Stripe's changelog shows multiple new payment method additions per year [source](https://docs.stripe.com/changelog). [best guess: 1–2 crypto-adjacent method types per year could appear across major PSPs, based on the pace of crypto/stablecoin product launches. The window of vulnerability (from PSP launch to audit-script update) depends on how quickly the provider monitors the PSP changelog — plausibly days to weeks for a diligent team, months for an inattentive one.]
- **Behavior of the check on this category:** no-signal (the audit passes because it does not know to check for the new method name)
- **Reasoning:** This is the primary coverage gap. The implementation doc identifies it and recommends subscribing to the PSP's API changelog. The mitigation is operational discipline, not technical architecture.

### Gap 2: Connected accounts (Stripe Connect) with independent capabilities
- **Category:** Synthesis providers using Stripe Connect with connected accounts. Each connected account has its own capabilities hash. The audit must enumerate all connected accounts and check each — if it only checks the platform account, a connected account could have `crypto_payments: active` without triggering the alert.
- **Estimated size:** Most DNA synthesis providers are not marketplaces and do not use Stripe Connect with multiple connected accounts. [best guess: this gap affects <5% of synthesis providers — those with a marketplace-style checkout or those using Connect for multi-entity billing.] For the affected providers, the gap is total: the audit misses the connected accounts entirely unless specifically coded to enumerate them.
- **Behavior of the check on this category:** no-signal (audit checks only the platform account)
- **Reasoning:** The implementation doc identifies this as a failure mode. The fix is straightforward (enumerate connected accounts in the audit script) but must be implemented explicitly.

### Gap 3: Test-mode vs live-mode configuration divergence
- **Category:** Scenarios where crypto is enabled in test mode (for developer experimentation) but not in live mode, or vice versa. If the audit only runs against one mode, the other mode's configuration is unchecked.
- **Estimated size:** [best guess: a minor gap — test-mode crypto enablement is low-risk (no real payments processed) but could indicate organizational intent or accidental promotion to live. The implementation doc recommends running the audit against both modes.]
- **Behavior of the check on this category:** no-signal (for the unchecked mode)
- **Reasoning:** Low practical risk but an audit completeness issue. The fix is to run against both modes.

### Gap 4: Non-PSP crypto payment paths
- **Category:** Crypto payment acceptance through channels outside the PSP — e.g., a direct integration with BitPay, Coinbase Commerce, or a crypto payment gateway that does not route through the provider's primary PSP. The audit checks Stripe/Adyen/Braintree configurations but not external integrations.
- **Estimated size:** [best guess: negligible for most synthesis providers. Adding a crypto payment gateway requires deliberate engineering effort and is unlikely to happen accidentally. But the audit's scope is limited to PSP configuration; it does not cover the full application stack.]
- **Behavior of the check on this category:** no-signal (out of audit scope)
- **Reasoning:** This is a scoping limitation. The implementation doc focuses on PSP config drift, not application-level payment routing. A comprehensive crypto prohibition requires the MSA clause (m11-msa-prohibition) and the BIN denylist (m11-crypto-onramp-denylist) as complementary controls.

### Gap 5: API key scope insufficient — audit fails open
- **Category:** The audit script uses a restricted API key that lacks permission to read the relevant endpoints (e.g., `capabilities` or `paymentMethodSettings`). The API returns a permission error, and the script may fail open (treating an error as "no crypto found") rather than fail closed.
- **Estimated size:** [best guess: a one-time implementation bug, not a recurring gap. If the audit is properly coded to assert non-empty responses and fail closed on errors, this gap is eliminated. But a poorly written script could silently pass.] The implementation doc identifies this and recommends asserting non-empty responses.
- **Behavior of the check on this category:** no-signal (audit passes erroneously)
- **Reasoning:** Implementation quality issue. The mitigation is defensive coding (assert non-empty, fail closed).

## Refined false-positive qualitative

1. **Legitimate new payment method enablement** — any new non-crypto payment method (Apple Pay, iDEAL, ACH) triggers the audit until the allowlist is updated. This is by design (the audit flags all changes for review) but generates noise. [best guess: a few alerts per year, each resolved in minutes by updating the allowlist.]
2. **Test-mode enablement for experimentation** — a developer enables a method in test mode; the audit fails. Whether this is a false positive depends on policy. If policy is "no crypto in any mode," it is a true positive. If "no crypto in production," it is a false positive.
3. **Renamed/deprecated capability names** — if Stripe renames a capability (e.g., `crypto_payments` becomes something else), the audit may silently pass on the new name AND alert on the old name's absence. This is a variant of Gap 1.

## Notes for stage 7 synthesis

- This idea is architecturally strong but operationally dependent: its coverage is only as good as the maintainer's diligence in tracking PSP changelog updates (Gap 1) and coding the audit correctly (Gap 5).
- For most synthesis providers (single Stripe/Adyen account, no Connect), Gaps 2–4 are minor or non-applicable. Gap 1 is the load-bearing risk.
- The idea is a negative control (asserts absence) rather than a positive detection. It does not detect crypto usage — it prevents the configuration that would enable crypto usage. This means it has zero false-positive cost on the customer side (no customer interaction), which is a significant advantage over other M11 ideas.
