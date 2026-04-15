# Adversarial review: docs-only (FINAL)

**Iterations:** 1 (documentation review only -- no live API testing possible, no re-run applicable)

## Resolved findings

- **Stripe card.funding is the highest-value field for KYC step (b).** Works globally, available pre-charge, provides binary prepaid detection. This finding is consistent across the payment-bin group (live testing) and the docs-only group (documentation review). The convergence from two independent analyses strengthens confidence.
- **AVS geographic coverage is US/UK/CA strong, partial for AU/NZ/IE, null for continental Europe and most of Asia/Africa/Latin America.** Coverage estimate for a global synthesis provider: 40-60% of card payments get usable AVS data (weighted by biotech customer geography skewing US/UK). This is a documentation-confirmed limitation, not something production testing would materially change.
- **AVS pass does not prove institutional affiliation.** It proves the billing address matches the card issuer's records. A researcher's personal card passes AVS against their home address. This is a structural limitation of AVS for KYC purposes.
- **Plaid Identity Match has ~30% effective coverage.** Approximately 30% of micro-deposit and database-verified Items return identity data. Major banks (Chase, BofA, Wells Fargo, Citi) generally return data; smaller credit unions and community banks often do not. The check silently fails for ~70% of connected accounts.
- **Plaid legal_name.score is the highest-value field from Plaid.** Directly answers the identity question ("is the payer who they claim to be?"). But the ~30% coverage rate means it's supplementary, not primary.
- **Multi-signal cascade architecture confirmed.** Neither Stripe AVS nor Plaid Identity Match is individually sufficient. The recommended stack: (1) card.funding on every card payment, (2) billing-shipping-institution consistency on every order, (3) AVS when available, (4) Plaid Identity Match when available, (5) BIN/card country as tiebreaker.

## Unresolved findings (forwarded to final synthesis)

- **Production-only phenomena cannot be evaluated.** Five areas require production data: (1) AVS unavailable rate by country/region, (2) Plaid score calibration (continuous distribution for edge cases), (3) P-card false positive rate, (4) corporate virtual card funding type classification, (5) Plaid bank coverage rate for biotech researchers specifically. These are quantitative unknowns whose direction is known but magnitude is not.
- **Wire transfer screening not covered.** Neither Stripe AVS nor Plaid covers wire transfers. Only signal from wire transfers is originating bank name/country from SWIFT/BIC code. For providers that accept wire transfers, this is a gap in the payment-to-institution verification step.

## Open medium/low findings (informational, not blocking)

- **MEDIUM: Plaid UX friction may cause checkout abandonment.** Plaid Link requires bank selection, credential entry, and MFA during checkout. For DNA synthesis orders (already complex), the conversion impact is unknown. This is a product decision, not a technical coverage gap.
- **MEDIUM: Sandbox binary scores prevent threshold calibration.** Plaid sandbox returns 0 or 100 scores only. The continuous scoring curve (especially 50-89 range where KYC decisions are hardest) exists only in production. Cannot set thresholds without production data.
- **MEDIUM: Joint and business accounts create noise.** Joint accounts may trigger partial name match (spouse's name). University accounts have the institution's name, triggering is_business_name_detected and producing a name mismatch against the individual researcher's name.
- **LOW: Stripe billing_details is always empty for token-created payment methods.** Billing address must come from a separate source (customer form input). This is a Stripe implementation detail, not a coverage gap.
- **LOW: Stripe test mode always returns country=US.** International card behavior cannot be tested without production credentials. The payment-bin group's testing has the same limitation.
