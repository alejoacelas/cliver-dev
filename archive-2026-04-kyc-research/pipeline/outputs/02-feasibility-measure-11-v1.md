# Stage 2 Feasibility Check — Measure 11 (payment-no-crypto) — v1

**Reviewing:** `outputs/01-ideation-measure-11-v1.md`

**Special note on relevance gate.** The attacker mapping file lists zero relevant stories and explicitly explains why: crypto only appears in the corpus as an *upstream* attacker payment instrument, never as payment to the synthesis provider. This means Gate 2 (relevance) cannot be applied in the normal way — by construction, no idea under this measure can address an existing attacker story. The mapping file does, however, flag a latent class: "if a future branch wanted to *prefer* crypto (e.g., to avoid the bank-KYC commitment), measure 11 would deny it." I will treat ideas that address this latent class as relevance-passing, and treat blanket-enforcement SOPs as relevance-passing on the basis that the measure itself is defined as a blanket SOP (the mapping file says so explicitly). Without this allowance, every idea would FAIL Gate 2 and the measure would produce zero ideas, which contradicts the measure being in scope at all.

---

## Idea 1 — Stripe `prohibited_payment_method_types` checkout config

**Concreteness:** PASS. Names Stripe API surface (`payment_method_configurations`, `payment_method_types`, `card.wallet`).
**Relevance:** PASS (blanket-SOP allowance).
**Verdict: PASS.**

## Idea 2 — Adyen / Braintree allowlist at PSP

**Concreteness:** PASS. Names Adyen `/sessions allowedPaymentMethods` and Braintree `paymentOptionPriority` — researcher can look these up.
**Relevance:** PASS (blanket-SOP allowance, and necessary for non-Stripe shops — meaningfully different from idea 1).
**Verdict: PASS.**

## Idea 3 — Written checkout-flow SOP + quarterly audit

**Concreteness:** PASS. Names specific prohibited vendors (BitPay, Coinbase Commerce, OpenNode, NOWPayments, CoinGate, Triple-A) and specifies the audit format (screenshots, signed checklist).
**Relevance:** PASS (this is the literal blanket-SOP enforcement).
**Verdict: PASS.**

## Idea 4 — Crypto-debit-card BIN denylist

**Concreteness:** PASS. Names specific card programs (Coinbase, Crypto.com, BitPay, Wirex, Nexo, Binance) and specific issuer banks (Marqeta, Metropolitan Commercial, Pannercard, Contis, Solaris, DiPocket) and a BIN data source (`binlist.net` [best guess], commercial Visa/Mastercard BIN attribute services). Researcher can look these up.
**Relevance:** PASS — this is the actual operational way "no crypto" is bypassed today (crypto-funded debit on the card rails). Addresses the latent-attacker class.
**Verdict: PASS.**

## Idea 5 — Chainalysis KYT / TRM Labs / Elliptic on ACH originator

**Concreteness:** PASS. Names three specific chain-analytics vendors and the specific data product on each (KYT, TRM Entities, Elliptic Navigator). Names specific exchanges to match (Coinbase Inc, Kraken Payward, Gemini Trust, Binance.US, Crypto.com, Bitstamp USA).
**Relevance:** PASS — directly addresses the "Wyre/MoonPay/Coinbase → ACH" pattern flagged in the prompt.
**Verdict: PASS.**

## Idea 6 — Plaid `auth` + `transactions` funding-source check

**Concreteness:** PASS. Names Plaid endpoints (`/auth/get`, `/transactions/get`), Plaid taxonomy (`Transfer > Cryptocurrency`), and the specific exchanges to match against `merchant_name`.
**Relevance:** PASS — addresses the two-hop crypto→bank→ACH bypass.
**Verdict: PASS.**

## Idea 7 — PayPal / Venmo / Cash App crypto-balance refusal

**Concreteness:** PASS. Names PayPal Orders v2 API, the specific field paths (`payment_source.paypal.attributes`, `payer.payment_method`), and `funding_source=CRYPTO`. Researcher can verify the exact field names in stage 4.
**Relevance:** PASS — wallet rails are a real path for crypto-balance funding.
**Verdict: PASS.**

## Idea 8 — Crypto on-ramp referrer block

**Concreteness:** PASS. Names eight specific on-ramp domains (moonpay.com, sendwyre.com, ramp.network, transak.com, banxa.com, simplex.com, mercuryo.io, guardarian.com).
**Relevance:** PASS — narrow but real signal; addresses the on-ramp-widget vector.
**Verdict: PASS.**

## Idea 9 — Customer-support inbound triage script

**Concreteness:** PASS. Names specific CRMs (Zendesk, Intercom, Front), specific substring set, and a specific tag/escalation playbook. SOPs can pass concreteness when the playbook is specified.
**Relevance:** PASS — captures the latent signal of a customer who *wants* to pay in crypto, which is itself the trigger this measure is designed to catch.
**Verdict: PASS.**

## Idea 10 — Order-form free-text scan

**Concreteness:** PASS. Specific fields (PO number, billing notes, shipping notes), specific regex set, specific block-and-tag playbook.
**Relevance:** PASS — same logic as idea 9, applied to order-form free text.
**Verdict: PASS.**

## Idea 11 — Acquiring-bank MSA contractual prohibition

**Concreteness:** PASS. Names specific acquirers (Chase Paymentech, Worldpay, Elavon, Stripe-as-MoR, Adyen-as-MoR), specific MCC code (6051), and a specific annual review SOP.
**Relevance:** PASS — governance backstop ensures the technical controls in 1–8 cannot be silently undone.
**Verdict: PASS.**

---

## Gaps

None within the latent-attacker class as currently scoped. The set covers: PSP-layer config (1, 2, 7), governance (3, 11), card-rail laundering (4), bank-rail laundering (5, 6), web-tier laundering (8), and signal capture (9, 10).

If the corpus later adds a story where the attacker explicitly tries to pay the synthesis provider in crypto, the existing idea set would already catch it via 1/2/3/7/8/9/10. If the corpus adds a "crypto laundered through fiat" story, ideas 4/5/6 would activate. No new ideas needed in v2.

---

## Summary

- PASS: 11
- REVISE: 0
- DROP: 0
- Gaps: 0

**STOP: yes**
