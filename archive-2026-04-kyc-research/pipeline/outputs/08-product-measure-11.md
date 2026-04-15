# Measure 11 — Payment No Crypto: Product Prioritization

## Selected stack

### 1. PSP config audit (`m11-psp-config-audit`)

Selected as the foundation. This is the only idea in the set that provides structural prevention rather than detection — it asserts that cryptocurrency payment methods are never enabled on the provider's Stripe, Adyen, or Braintree account in the first place. If the PSP cannot accept crypto, the entire attack surface collapses regardless of what the customer attempts. The check runs in CI on a daily cron and on infrastructure-touching PRs, querying each PSP's management API and asserting the absence of crypto-related capabilities. Cost is effectively zero (a few API calls, seconds of CI compute, 4-8 hours initial setup). It generates zero customer-facing false positives — a major operational advantage — because it inspects provider configuration, not customer behavior. The audit trail (CI logs, allowlist YAML in version control, incident tickets) demonstrates to regulators that crypto payment methods cannot be enabled without a visible, reviewable record. The primary coverage gap — lag between a PSP introducing a new crypto method type and the audit script being updated — is a manageable operational discipline issue, not an architectural weakness.

### 2. MSA prohibition + order-text crypto-reference scan (`m11-msa-prohibition`)

Selected for legal foundation and audit completeness. The MSA clause is the policy statement that gives the technical controls their contractual teeth: it provides customer notice, legal grounds for order denial and relationship termination, and audit-trail evidence that the provider explicitly prohibits crypto payment. Without it, denying a crypto-debit card (via sibling measure m10) or refusing to enable a crypto payment method lacks explicit contractual backing. The regex scan over order metadata is a thin detection layer with near-zero adversarial resistance, but it catches naive or accidental crypto references (a customer asking "Can I pay in BTC?" in an order note) and routes them to a four-category triage. False-positive burden is low (10-60 min/week reviewer time, primarily from cryptography researchers triggering keyword matches). The two components together cost under $2,000 to set up (legal review plus 4 hours engineering) and near-zero to operate. The MSA clause composes naturally with every other M11 idea by providing the policy layer they enforce.

## Dropped ideas

- **Crypto-debit BIN + on-ramp referrer denylist (`m11-crypto-onramp-denylist`):** The BIN-denylist leg substantially overlaps with the existing m10-stripe-funding idea (which blocks prepaid cards, catching most crypto-debit cards by funding type). The residual coverage — crypto cards that report as `debit` rather than `prepaid` and whose BINs are on the denylist — is estimated at a small fraction of an already-rare scenario. The referrer-denylist leg has acknowledged "near-zero adversarial value" due to Referrer-Policy suppression and trivial spoofability. Quarterly BIN-list curation adds ongoing maintenance for marginal incremental signal. The cost is low, but so is the incremental value over the selected stack plus m10.

## Composition note

The two selected ideas operate on different planes and compose without overlap:

- **Layer 1 — Policy (MSA prohibition):** The MSA clause establishes the contractual rule. It applies to 100% of customers at onboarding click-through and provides the legal basis for all downstream enforcement actions. The click-through acceptance log (timestamp, customer ID, ToS version) is the foundational audit record.
- **Layer 2 — Structural prevention (PSP config audit):** The CI audit ensures the PSP infrastructure cannot accept crypto payments. This is the primary technical control and operates entirely on the provider side — no customer interaction, no false positives, no manual review burden on orders. It runs daily and on infrastructure PRs.
- **Layer 3 — Residual detection (order-text scan):** The regex scan catches edge cases where a customer references crypto in free-text order fields despite the structural block. Hits route to the same reviewer queue used by other measures. Near-zero true positives are expected when the PSP config audit is healthy, making this a low-cost backstop.
- **Shared audit trail:** MSA acceptance logs, CI audit results, and regex-hit dispositions combine into a single measure-level record demonstrating that the provider (a) contractually prohibits crypto, (b) structurally prevents crypto payment enablement, and (c) monitors for residual crypto references in order metadata.
- **Dependency on m10:** The dropped BIN-denylist idea's primary value (catching crypto-debit cards) is largely absorbed by the m10-stripe-funding prepaid-card block. The selected stack assumes m10 is implemented; if it is not, the BIN-denylist leg should be reconsidered.
