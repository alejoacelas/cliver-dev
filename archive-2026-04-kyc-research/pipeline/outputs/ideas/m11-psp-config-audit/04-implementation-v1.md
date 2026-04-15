# m11-psp-config-audit — implementation v1

- **measure:** M11 (payment-no-crypto)
- **name:** PSP config audit (no crypto methods enabled)
- **modes:** D
- **summary:** Periodic (CI-driven) audit that the live Stripe / Adyen / Braintree configuration does not have any cryptocurrency-related payment methods enabled. Code-as-config check that fetches the active payment-method capabilities from the PSP's management API and asserts the absence of `crypto`, `stablecoin`, Coinbase Commerce, BitPay, or any equivalent. Catches configuration drift (manual dashboard toggles, accidental enablement during a "new payment method" promotion).
- **attacker_stories_addressed:** crypto-funding. Defense-in-depth — none of the in-corpus attacker branches route crypto to the synthesis provider, but a misconfigured PSP is a structural footgun this catches.

## external_dependencies

- **Stripe Account / Capabilities API** — exposes which capabilities (including `crypto_payments`) are active on a given account [source](https://docs.stripe.com/crypto/integrate-pay-with-crypto).
- **Adyen Management API** — `GET /merchants/{merchantId}/paymentMethodSettings` returns the configured methods per merchant [source](https://docs.adyen.com/api-explorer/Management/1/get/merchants/(merchantId)/paymentMethodSettings/(paymentMethodId)).
- **Braintree** — Braintree's Adyen forwarding integration shares the underlying configuration; default is Visa/Mastercard/Amex with no crypto [source](https://developer.paypal.com/braintree/articles/adyen/transactions/accepted-payment-methods).
- **CI runner** (GitHub Actions, GitLab CI, internal Jenkins) running the audit script on a schedule and on every infrastructure-touching PR.
- **Alerting** — pager / Slack hook on a non-zero exit.

## endpoint_details

**Stripe leg:**

- **Capabilities check:** `GET /v1/accounts/{account_id}` returns the Account object with a `capabilities` hash. Stripe documents that to detect crypto-enabled connected accounts you "check whether their `crypto_payments` capability is set to `active`" [source](https://docs.stripe.com/crypto/integrate-pay-with-crypto). Equivalent capability names that the audit must check for: `crypto_payments`, `stablecoin_payments` (the 2025-06-30 API version added a stablecoin payment method type [source](https://docs.stripe.com/changelog/basil/2025-06-30/crypto-payment-method)).
- **Payment Method Configurations:** Stripe also exposes a Payment Method Configurations endpoint listing which methods are enabled for the account/connection. Audit must enumerate and assert no entry has type matching crypto/stablecoin.
- **Auth:** Stripe restricted API key with `Account: read` and `Payment Method Configurations: read` scopes.
- **Rate limits:** Stripe's standard 100 read req/sec — far above audit needs.
- **ToS:** standard Stripe ToS; no special restriction on programmatic config reads.

**Adyen leg:**

- **Endpoint:** `GET https://management-test.adyen.com/v1/merchants/{merchantId}/paymentMethodSettings` (test); `https://management-live.adyen.com` (live) [source](https://docs.adyen.com/api-explorer/Management/1/get/merchants/(merchantId)/paymentMethodSettings/(paymentMethodId)).
- Returns the list of payment-method settings, each with a type field. Audit asserts no setting has a crypto-typed `paymentMethodVariant` (e.g., the absence of any `cryptocurrency` or `stablecoin` variant) [source](https://docs.adyen.com/development-resources/paymentmethodvariant).
- **Auth:** Adyen Management API key with read on `paymentMethodSettings`.
- **Rate limits:** Adyen Management API has standard rate limits well above audit needs [best guess].

**Braintree leg:**

- Braintree Merchant Account configuration is not as rich as Stripe / Adyen for "list all enabled methods"; the canonical check is to call the Client Token / Configuration endpoint and inspect the returned `paymentMethods` hash. For most synthesis providers using Braintree, the default config is the right config and the audit asserts the diff is zero.

**Audit harness:**

- A small script (Python or shell) running in CI on a cron schedule (e.g. daily) and on every PR that touches infrastructure. Exits non-zero on any unexpected enabled method. Posts to Slack on failure. Stores the most recent allowed manifest as `payment-methods.allowlist.yaml` in the repo so changes are reviewed via PR.
- Equivalent to standard "code as config" / drift-detection patterns (Terraform, Atlantis, etc.).

## fields_returned

From Stripe Account object:

- `capabilities.crypto_payments` (`active` / `inactive` / `pending`)
- `capabilities.stablecoin_payments` (where applicable post-2025-06-30 API version)
- `capabilities.card_payments` (the legitimate enabled capability; expected `active`)

From Stripe Payment Method Configurations:

- `id`, `name`, list of payment method types currently enabled per configuration

From Adyen `paymentMethodSettings`:

- `id`
- `type` (e.g., `visa`, `mc`, `cryptocurrency`, `bcmc`, ...)
- `currencies`
- `countries`
- `enabled`

## marginal_cost_per_check

- **Per-audit cost:** ~$0. A few API calls. CI runner cost is negligible (seconds of compute).
- **Setup cost:** ~4–8 hours engineering: build the script, define the allowlist, hook into CI and Slack. [best guess]
- **Maintenance:** trivial. Update the allowlist when the provider intentionally enables a new (non-crypto) method.

## manual_review_handoff

When `crypto_method_enabled` fires:

1. CI fails. Slack alert pages the on-call engineer / payments owner.
2. On-call investigates: pulls the most recent Stripe/Adyen audit-log entries for payment-method changes (Stripe Dashboard exposes user-action audit logs).
3. If the change was intentional (PR + reviewer approval, allowlist update merged): the audit's allowlist is out of date — update it.
4. If the change was unintentional (manual dashboard toggle, third-party app installation that auto-enabled a method): revert via the dashboard or API. Communicate with the person who made the change. If no human admits to the change, escalate to security (potential unauthorized access).
5. Post-incident: confirm no orders were processed via the unauthorized method during the drift window.

SOP target: ≤30 minutes from alert to remediation for the common (legitimate-drift) case.

## flags_thrown

- `crypto_method_enabled` — the audit detected an active crypto / stablecoin / Coinbase Commerce / BitPay capability or payment method config. Action: page on-call.

## failure_modes_requiring_review

- **New PSP method names appear without notice.** Stripe added the stablecoin payment method type in mid-2025; if the audit script doesn't know to check for it, it would silently miss the new method. Mitigation: subscribe to the PSP's API changelog (e.g., [Stripe API changelog](https://docs.stripe.com/changelog/basil/2025-06-30/crypto-payment-method)); on each new payment-method release, update the disallowed-keyword list.
- **Allowlist scope creep.** Engineers add a new method to the allowlist quickly to silence the alert without checking whether it's crypto-adjacent.
- **Test vs live mismatch.** Audit runs against test mode but live mode has a different config. Mitigation: run against both.
- **Connect platform.** If the synthesis provider uses Stripe Connect with connected accounts, each connected account has its own capabilities. The audit must enumerate connected accounts and check each.
- **API key scope.** A misconfigured restricted key may not have permission to read the relevant endpoints; the audit fails open. Mitigation: assert non-empty response.

## false_positive_qualitative

- **Allowlisted non-crypto methods.** Any new legitimate payment method (e.g., Apple Pay, iDEAL, ACH) the provider enables intentionally will fail the audit until the allowlist is updated. This is not a false positive in the strict sense — it's a reviewable change — but it generates noise.
- **Stripe's `crypto_payments` capability has been deprecated/renamed in some account types.** If the audit hardcodes the capability name and Stripe renames it, the audit silently passes. Mitigation: also check for `stablecoin_*` and any future variants.
- **Test-mode-only enablement.** A developer enables crypto in test mode for a feasibility experiment; the live-mode audit passes but the test-mode audit fails. Whether this is a false positive depends on whether the policy is "no crypto in any mode" or "no crypto in production."

## record_left

- The CI run log (full API response, masked of secrets), retained per CI policy.
- The allowlist YAML in version control, with git history showing every change.
- For each alert, an incident ticket with timeline, root cause, and remediation.
- Aggregate dashboard: audit runs per day, failure rate, time-to-remediation.

This produces a clean audit trail demonstrating to a regulator that crypto is administratively impossible to enable without leaving a record.

## Sources

- [Stripe — Accept stablecoin payments / crypto integration](https://docs.stripe.com/crypto/integrate-pay-with-crypto)
- [Stripe API changelog — adds support for crypto payment method (2025-06-30)](https://docs.stripe.com/changelog/basil/2025-06-30/crypto-payment-method)
- [Stripe Crypto overview](https://docs.stripe.com/crypto)
- [Stripe — List PaymentMethods endpoint](https://docs.stripe.com/api/payment_methods/list)
- [Adyen Management API — Get payment method details](https://docs.adyen.com/api-explorer/Management/1/get/merchants/(merchantId)/paymentMethodSettings/(paymentMethodId))
- [Adyen — Manage payment methods with API](https://docs.adyen.com/platforms/payment-methods/api)
- [Adyen — paymentMethodVariant reference](https://docs.adyen.com/development-resources/paymentmethodvariant)
- [Braintree-Adyen — accepted payment methods](https://developer.paypal.com/braintree/articles/adyen/transactions/accepted-payment-methods)
