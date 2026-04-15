# Adversarial review: payment-bin (FINAL)

**Iterations:** 1 (thorough initial testing -- no high-severity untested gaps requiring re-run)

## Resolved findings

- **Stripe card.funding is the single strongest BIN-level signal.** Reliably distinguishes credit/debit/prepaid from the card network via the payment processor. Works globally. Available pre-charge. 6 test tokens validated the field's deterministic behavior. funding=prepaid is the primary gift card detection signal.
- **binlist.net is unreliable as a sole BIN data source.** 40% of tested BINs returned 200 with null/empty fields (no way to distinguish "not found" from "found with no data"). BIN reassignment is real (411111 mapped to Polish fintech Conotoxia instead of the commonly cited US test BIN). Rate limiting aggressive (HTTP 429 after 5 calls, 5+ minute lockout, no Retry-After header). 11 additional BINs untestable due to rate limiting.
- **Fintech BIN denylist is essential and deterministic.** 17/17 tests passed: 9 positive matches (Mercury, Brex, Relay, Ramp, Wise, Divvy), 6 negative matches (standard bank BINs), 2 edge cases (off-by-one BINs). Exact 6-digit prefix match is the right granularity. The denylist is the critical backstop for binlist.net's coverage gaps.
- **Billing-shipping-institution consistency logic works for 7/8 scenarios.** One failure: PMB designator confuses naive regex parser (Mercury's "548 Market St PMB 82560" vs. "548 Market St" triggers hard_flag instead of soft_flag). Smarty address normalization is needed, not regex.
- **Three-layer defense is complementary.** Stripe funding type + fintech BIN denylist + billing-institution consistency stack independent signals. A prepaid card from a fintech BIN with a mismatched billing address stacks three signals. Any one missing still leaves two.
- **Most legitimate researchers trigger soft flags.** Personal debit cards billed to home addresses are the norm for academic purchases. billing != institution is the default case. The system must tolerate this and only escalate when combined with other flags.

## Unresolved findings (forwarded to final synthesis)

- **binlist.net coverage for fintech/prepaid BINs is untestable.** 11 BINs (the entire fintech/prepaid test set) could not be tested due to rate limiting. Whether binlist.net can identify Mercury, Brex, Ramp, etc. BINs as prepaid/fintech remains unknown. A paid BIN database (Maxmind minFraud, Binbase) should be evaluated for production.
- **International card behavior untested.** Stripe test mode always returns country=US. Cannot test international card detection (non-US country codes, international BIN ranges). For a global synthesis provider, this is significant -- card.country mismatch between billing country and institution country is a KYC signal that was not validated.

## Open medium/low findings (informational, not blocking)

- **MEDIUM: Corporate virtual cards (Ramp, Brex, Divvy) may flag as prepaid.** Stripe docs suggest these may report card.funding=prepaid despite being legitimate institutional cards. Cannot confirm without production data. The fintech BIN denylist should be a soft flag, not a hard reject, to avoid blocking legitimate corporate purchases.
- **MEDIUM: P-card (procurement card) false positive rate unknown.** University procurement cards have the finance department's address on file. AVS line1 would fail on legitimate institutional purchases. Rate of this in practice is unknown without production data.
- **MEDIUM: Fintech BIN denylist requires quarterly maintenance.** The denylist is static. New fintech issuers and BIN ranges appear regularly. No maintenance process defined yet.
- **LOW: PMB/suite/unit designator parsing needs Smarty integration.** Simple string comparison breaks on address variations. Documented and the fix (Smarty normalization) is identified.
- **LOW: International address comparison.** Non-US addresses cannot be parsed with US-format regex. Falls back to unreliable string comparison. A geocoding service (lat/long proximity) would handle international addresses better.
