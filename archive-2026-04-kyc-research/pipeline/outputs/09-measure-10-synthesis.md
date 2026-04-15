# Stage 9 — Per-measure synthesis: Measure 10 (payment-bin-giftcard)

## Selected stack

Single check: **Stripe / Adyen funding-source** (`m10-stripe-funding`). No multi-idea composition required.

---

## Side-by-side table of selected ideas

| Field | m10-stripe-funding |
|---|---|
| **Summary** | Read PSP-native `card.funding` field at checkout. Block `prepaid`; soft-flag `unknown` for review. |
| **Attacker stories addressed** | inbox-compromise method 5.2 (prepaid virtual card); foreign-institution method 3 (prepaid debit in real name). Both secondary, non-primary paths. |
| **External dependencies** | Stripe Payments + Radar for Fraud Teams (or Adyen Payments + Risk). No third-party data subscription. |
| **Marginal cost** | 2–7 ¢/tx (Stripe Radar). At 10k tx/month: $200–$700/month. Adyen: vendor-gated. |
| **Setup effort** | ~30 min engineering + ~1 hr QA. Single Radar rule. |
| **Flags thrown** | `psp_funding_prepaid` (hard block, corporate-prepaid exception path) · `psp_funding_unknown` (soft flag, reviewer adjudication) |
| **False-positive classes** | Corporate prepaid procurement (~2–5% institutional tx); non-US `unknown` cards (~4.5–13.5% of tx); underbanked consumer prepaid (<0.5%); non-US payroll-on-prepaid (<1%) |
| **Coverage gaps** | `unknown` funding type returns (no signal); issuer misreporting (prepaid reported as credit/debit); gift-card-specific classification not available (PSP reports `prepaid` not `gift`) |
| **Bypass methods known** | None |
| **Bypass methods uncovered** | None |
| **Record left** | PSP funding string, transaction/PaymentMethod ID (7+ yr PSP retention), issuer metadata, reviewer decision + rationale |

---

## Coverage gap cross-cut

### Structural gaps (inherent to the data source)

1. **`unknown` funding type prevalence.** The PSP returns `unknown` for an estimated 4.5–13.5% of card transactions, concentrated among non-US issuers (Africa, Southeast Asia, Latin America). The check is effectively blind to this population. The SOP treats `unknown` as a soft flag, not a hard block, to avoid unworkable FP rates — but this means an attacker using a card from a non-US issuer that reports `unknown` passes the check with only a soft flag.

2. **Issuer misreporting.** When an issuer reports a substantively prepaid card as `credit` or `debit` to the card network, the PSP inherits that misclassification. Estimated at low single-digit percentage of prepaid cards in circulation. No remediation exists within the PSP-native approach — this is a card-scheme data-quality problem.

3. **No gift-card-specific classification.** The PSP reports `prepaid`, not `gift`. A non-gift prepaid card (e.g., corporate procurement, payroll) and a gift card both map to the same `prepaid` value. The measure's original intent — identifying gift cards specifically — is only partially served. If gift-card-specific detection becomes necessary, BinDB can be added as a supplementary layer (per Stage 8 composition note).

### Complementary gaps (addressable by composition with other measures)

4. **Corporate prepaid false positives.** Hard-blocking `prepaid` catches legitimate corporate procurement cards. Mitigable via: (a) corporate-prepaid exception list maintained by ops, (b) cross-signal corroboration with m07/m18 institutional-context checks — if institutional identity is verified and the card is issued by a known corporate program, the reviewer can override.

5. **Tokenized wallet pass-through uncertainty.** Stripe "generally" exposes the underlying card's funding type for Apple Pay / Google Pay, but documentation is not perfectly explicit. This is a documentation gap, not necessarily a detection gap, but it introduces uncertainty for tokenized transactions.

---

## Bypass methods uncovered cross-cut

### Attacker stories surviving the entire selected stack

**All 19 corpus attacker stories survive this measure.** The attacker mapping (Stage 6) found no relevant stories: no in-corpus branch routes payment through a gift card or prepaid card as a primary, load-bearing method.

The two marginally adjacent stories are:

| Story | Adjacent method | Why it survives |
|---|---|---|
| **inbox-compromise** | Method 5.2: prepaid virtual card (secondary sub-option) | Not the primary payment path. If used, `psp_funding_prepaid` would hard-block it — so the check *would* catch this sub-option. But the attacker's primary path (real personal credit card) is unaffected. |
| **foreign-institution** | Method 3: prepaid debit card in real name (secondary sub-option) | Same as above. The primary path (institutional PO / real credit card) is unaffected. |

**Net assessment:** This measure does not defeat any primary attacker path in the current corpus. Its value is defense-in-depth against a currently theoretical attack surface (gift-card or prepaid-card payment to a synthesis provider). If the threat model evolves to include prepaid/gift-card payment as a load-bearing attacker method, the check is already in place.

---

## Structural gaps — open issues

| # | Gap | Severity | Resolution path | Status |
|---|---|---|---|---|
| 1 | `unknown` funding-type rate for non-US cards undocumented | Medium | Stripe/Mastercard documentation search yielded nothing. Requires direct Stripe support inquiry or empirical measurement from production data. | **Open — [unknown, searched for]** |
| 2 | Corporate prepaid procurement card share of institutional synthesis purchases | Low | No market data found. Requires empirical measurement post-launch. | **Open — [unknown, searched for]** |
| 3 | Issuer misreporting rate (prepaid → credit/debit) | Low | No public data. Card-scheme data-quality issue; not remediable by the implementer. | **Open — [unknown, searched for]** |
| 4 | Adyen Risk per-tx pricing | Low | Contract-negotiated. Requires sales conversation. | **Open — [vendor-gated]** |
| 5 | Adyen Risk rule syntax for `fundingSource` branching | Low | Configured in Customer Area, not public docs. Requires Adyen sandbox access. | **Open — [vendor-gated]** |
| 6 | Tokenized wallet (Apple Pay / Google Pay) funding-type pass-through | Low | Stripe docs are not perfectly explicit. Requires empirical test with tokenized prepaid card in sandbox. | **Open — needs sandbox verification** |
| 7 | Stale citation: 70% P-card program adoption (2008 Wikipedia source) | Informational | Needs updated source if used in any customer-facing or policy document. | **Open — stale data** |
