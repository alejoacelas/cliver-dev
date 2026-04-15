# Coverage research: PSP AVS (Stripe / Adyen / Braintree) + Plaid Identity Match

## Coverage gaps

### Gap 1: International cardholders (non-US/UK/CA issuers)
- **Category:** Customers paying with cards issued outside the US, UK, and Canada — covering most of Europe (except some Visa EU issuers), Asia-Pacific, Latin America, Africa, and the Middle East.
- **Estimated size:** Gene synthesis market share outside North America is ~60% by revenue. [source](https://www.gminsights.com/industry-analysis/gene-synthesis-market) AVS is "currently only used by US, UK, and Canadian-based issuing banks" per Adyen and industry documentation. [source](https://docs.adyen.com/risk-management/avs-checks) [source](https://en.wikipedia.org/wiki/Address_verification_service) For a US-based synthesis provider, international orders may be 30–50% of total card-paid orders. [best guess: based on the ~60% non-North-American market share, discounted because some international customers use wire/invoice rather than card] For these orders, AVS returns `unavailable` — no signal.
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The implementation itself notes: "AVS unavailable for non-US issuers (effective only for US/CA/UK/Visa-EU per Adyen docs)." This is a structural limitation of the issuer-side AVS system, not of the PSP integration.

### Gap 2: Customers with address data-entry errors or recent moves
- **Category:** Legitimate US/UK/CA cardholders who mistype their billing address, recently moved but the issuer has not updated records, or whose address format does not match the issuer's format (apartment number variants, PO box vs street).
- **Estimated size:** 3.6% of ecommerce shoppers enter the wrong billing address (91.9% of those are legitimate), and 6.7% enter a partially correct address (98.1% legitimate). [source](https://www.signifyd.com/blog/avs-mismatches-kill-revenue/) Combined, ~10% of US card transactions may produce AVS partial-match or mismatch, of which the vast majority are legitimate. [best guess: for a synthesis provider's customer base, the rate may be slightly lower (more careful B2B buyers) — perhaps 5–8%]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** AVS mismatch fires `avs_zip_mismatch` or `avs_address_mismatch`. The implementation routes these to manual review, which absorbs the false positive but adds friction and analyst cost.

### Gap 3: Corporate/institutional P-card with HQ billing address
- **Category:** Legitimate institutional customers using a university or corporate purchasing card (P-card) whose billing address is the institution's HQ or accounts-payable office, not the lab's shipping address.
- **Estimated size:** [unknown — searched for: "percentage university purchasing card billing address mismatch shipping address", "corporate P-card HQ billing address different from user location"] No direct proxy found. [best guess: 15–30% of institutional card-paid orders use P-cards where the billing address is centralized at the institution's AP office, based on the common structure of university P-card programs where billing rolls up to a departmental or central account]
- **Behavior of the check on this category:** false-positive (specifically `avs_zip_mismatch` when billing ZIP is HQ and shipping ZIP is a different campus/lab location)
- **Reasoning:** The implementation identifies this: "a legitimate institutional P-card may have HQ billing address that differs from the lab's shipping address." This is a known weakness of AVS for B2B/institutional commerce.

### Gap 4: ACH-paid orders without Plaid Link completion
- **Category:** Customers who pay via ACH/bank transfer but do not complete the Plaid Link OAuth flow — either because they abandon it, their bank is not supported by Plaid, or they object to sharing bank credentials with a third party.
- **Estimated size:** Plaid claims over 95% coverage of US banks and 12,000+ financial institutions. [source](https://plaid.com/docs/institutions/) However, Plaid Link completion rates are a separate matter — users must actively consent and authenticate. [unknown — searched for: "Plaid Link completion rate abandonment rate", "Plaid OAuth conversion rate"] No public data on Plaid Link completion rates found. [best guess: 20–40% of users who are presented with Plaid Link may not complete it, based on general OAuth-flow abandonment rates in fintech of 25–45%]
- **Behavior of the check on this category:** no-signal (no Identity Match data available; fall back to AVS or invoice path)
- **Reasoning:** The implementation notes: "Plaid Link not completed (user abandons OAuth flow) → no Identity Match available."

### Gap 5: ACH-paid orders from personal accounts (legitimate expense-later)
- **Category:** Researchers who pay from a personal bank account and expense to their institution later. The bank-on-file name is the individual's personal name, not the institution.
- **Estimated size:** [unknown — searched for: "researchers paying lab supplies from personal bank account reimbursement percentage"] [best guess: overlaps with Gap 4 in m12-procurement-network; perhaps 5–15% of ACH-paid orders]
- **Behavior of the check on this category:** false-positive (`plaid_name_mismatch` fires because bank holder name is personal, not institutional)
- **Reasoning:** Implementation notes: "ACH from a personal account where the customer expenses the order later — plaid_name_mismatch will fire even though the order is legitimate."

### Gap 6: Invoice/PO/wire-paid orders (non-card, non-ACH)
- **Category:** Customers who pay by institutional invoice, purchase order, or international wire transfer — bypassing both the card-payment path (no AVS) and the ACH path (no Plaid).
- **Estimated size:** [best guess: In B2B scientific supply transactions, invoice/PO billing may account for 30–50% of order volume at established providers, since university procurement offices strongly prefer PO/invoice over card payments for orders above ~$500. ACH is less common than credit card but growing. The check produces no signal for the invoice/PO segment.] [unknown — searched for: "gene synthesis purchase order versus credit card payment percentage", "B2B laboratory supply payment method breakdown"]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** AVS fires only on card payments. Plaid Identity Match fires only on ACH. Invoice/PO/wire customers are invisible to this check entirely. These customers should be routed through m12-procurement-network instead.

## Refined false-positive qualitative

The primary false-positive-generating categories are:
1. **Gap 2 (address errors/moves):** ~5–8% of US card orders. Produces `avs_zip_mismatch` or `avs_address_mismatch`. Absorbed by manual review comparing ZIP to institution location.
2. **Gap 3 (P-card HQ address):** Perhaps 15–30% of institutional card orders. Produces `avs_zip_mismatch`. This is the most operationally significant false-positive source because it is systematic (not a data-entry error) and will recur on every order from that customer.
3. **Gap 5 (personal ACH):** Produces `plaid_name_mismatch`. Lower volume but generates a stronger flag than AVS partial-match.

The no-signal categories (Gaps 1, 4, 6) do not generate false positives but represent large segments where the check adds no screening value.

## Notes for stage 7 synthesis

- AVS is the cheapest M12 check ($0 incremental) but its effective coverage is limited to US/UK/CA card-paying customers. For a provider with a global customer base, this may be only 30–50% of orders.
- The P-card false-positive problem (Gap 3) is structural and will not self-resolve. The implementation correctly notes pairing with m12-procurement-network to absorb this case — if the institution has an active supplier registration, the P-card AVS mismatch can be overridden.
- Invoice/PO orders (Gap 6) are completely invisible to this check. These are the primary payment path for large institutional customers — precisely the segment where M12 matters most.
- Plaid Identity Match adds meaningful signal for ACH orders but depends on user completing the Plaid Link flow and on bank coverage.
