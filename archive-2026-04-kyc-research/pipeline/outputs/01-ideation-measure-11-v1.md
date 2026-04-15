# Stage 1 Ideation — Measure 11 (payment-no-crypto) — v1

**Measure recap.** Do not accept cryptocurrency for payment. Flag = customer attempts to pay with crypto. Follow-up = deny.

**Attacker mapping recap.** Zero relevant attacker stories. Crypto only appears in the corpus as an *upstream* attacker payment instrument (buying infostealer logs, lookalike domains, AitM kits) — never paid into the synthesis provider. So the ideas below are mostly enforcement SOPs and detection of crypto-adjacent funding flows that try to launder crypto into ordinary card/ACH at the synthesis provider's checkout.

Modes used: (1) Direct enforcement, (2) Crypto-adjacent funding-trail detection (anticipates a future "prefer crypto" attacker the corpus does not yet contain).

---

## 1. Stripe `prohibited_payment_method_types` checkout config + `card.wallet` filter

- **summary**: At the payment-processor layer, configure Stripe Checkout / PaymentIntents so the only enabled `payment_method_types` are `card`, `us_bank_account` (ACH), and `sepa_debit`. Do not enable `crypto` (Stripe Crypto Onramp) or `link` with crypto-funded balances. Reject any PaymentMethod whose `card.wallet.type` resolves to a known crypto-debit issuer BIN (see idea 4). Produces a deterministic deny at checkout for any crypto attempt and a server-side log.
- **attacker_stories_addressed**: none in mapping (blanket SOP)
- **external_dependencies**: Stripe (`payment_method_configurations` API), checkout SDK
- **manual_review_handoff**: none — automated deny. Edge case: Stripe error → ops queue, ops verifies config not regressed.
- **flags_thrown**: `crypto_payment_method_attempted` → automatic deny + log customer + IP.
- **failure_modes_requiring_review**: Stripe API error during PaymentMethod creation; new Stripe-released payment_method_type appearing without being explicitly excluded (need allowlist not denylist).
- **record_left**: Stripe Dashboard PaymentIntent record with `last_payment_error` + internal audit log row keyed to customer order.
- Other fields: # stage 4

## 2. Adyen / Braintree equivalent: payment-method allowlist at PSP

- **summary**: Same control implemented at Adyen (`allowedPaymentMethods` on `/sessions`) or Braintree (Drop-in `paymentOptionPriority` with crypto omitted, `disable` for `venmo` if the provider treats it as crypto-adjacent). Named separately because providers using non-Stripe PSPs need an analogous SOP. The check is "PSP config snapshot in CI: assert crypto not in allowed list."
- **attacker_stories_addressed**: none (blanket SOP)
- **external_dependencies**: Adyen Checkout API, Braintree Gateway; CI runner
- **manual_review_handoff**: none; CI failure routes to payments-eng on-call.
- **flags_thrown**: CI diff shows `crypto` added to allowed list → block deploy.
- **failure_modes_requiring_review**: PSP silently adds new method types in dashboard outside of code config.
- **record_left**: Git-tracked PSP config + CI assertion log.
- # stage 4

## 3. Written checkout-flow SOP + quarterly config audit

- **summary**: A documented SOP "Synthesis-provider checkout MUST NOT expose any cryptocurrency rail (BTC, ETH, USDC, USDT, stablecoin on/off-ramps, BitPay, Coinbase Commerce, OpenNode, NOWPayments, CoinGate, Triple-A)" with a quarterly compliance review where payments-ops loads each PSP dashboard and confirms crypto rails are disabled, screenshots into the audit folder. Names the prohibited vendors explicitly so future hires don't reintroduce them.
- **attacker_stories_addressed**: none (blanket SOP, audit trail)
- **external_dependencies**: payments-ops human; audit drive
- **manual_review_handoff**: quarterly checklist; deviation → CISO sign-off required to re-enable.
- **flags_thrown**: any of the named vendors found enabled → immediate disable + incident ticket.
- **failure_modes_requiring_review**: vendor renames, new entrant not on the list.
- **record_left**: dated screenshots + signed checklist in compliance archive.
- # stage 4

## 4. Crypto-debit-card BIN denylist (Coinbase, Crypto.com, BitPay, Wirex, Nexo, Binance)

- **summary**: Even if the PSP only accepts "card," some cards are crypto-funded debit cards: Coinbase Card (issued by MetaBank/Marqeta BINs), Crypto.com Visa (issued by Pannercard / Metropolitan Commercial), BitPay Card (Metropolitan Commercial Bank), Wirex (Contis/Solaris), Nexo Card (DiPocket), Binance Card (Contis, EU). Maintain a denylist of the issuer BIN ranges these programs use and reject at PaymentIntent creation. Produces a deny + flag "crypto-debit BIN attempted." This is the actual operational way "no crypto" gets bypassed today via plain card rails.
- **attacker_stories_addressed**: none in mapping; addresses the latent "prefer crypto" attacker pattern flagged in the mapping file
- **external_dependencies**: BIN database (Bin-IIN list, `binlist.net` [best guess], or commercial BIN data from Mastercard / Visa BIN attribute service); internal denylist table
- **manual_review_handoff**: BIN match → auto-deny; ambiguous (BIN range partially crypto, partially not) → payments-ops reviews customer + signal bundle, decides per playbook (deny if any other crypto-adjacent signal present).
- **flags_thrown**: `crypto_debit_bin` → deny; `prepaid_unknown_issuer` → review.
- **failure_modes_requiring_review**: BIN list staleness; new crypto-card programs launched between updates; co-branded cards where the BIN is a generic issuer.
- **record_left**: BIN-match log row with BIN, issuer name, program name, decision.
- # stage 4

## 5. Chainalysis KYT / TRM Labs / Elliptic Navigator address screen on inbound ACH originator metadata

- **summary**: For ACH/wire payments, capture the originating-bank account name + reference text. If the originator name resolves to a known crypto exchange off-ramp (Coinbase Inc, Kraken Payward, Gemini Trust, Binance.US, Crypto.com, Bitstamp USA), flag as "ACH funded directly from crypto exchange — possible crypto laundering into fiat checkout." Use Chainalysis KYT, TRM Labs, or Elliptic Navigator's entity-attribution data to map originator names to exchange entities. This addresses the "Wyre/MoonPay/Coinbase → ACH" funding pattern called out in the prompt.
- **attacker_stories_addressed**: none in mapping (forward-looking)
- **external_dependencies**: Chainalysis KYT API, TRM Labs Entities API, or Elliptic Navigator (one-of); ACH originator metadata from acquiring bank (Plaid `auth` + `transactions` could surface the same)
- **manual_review_handoff**: ACH originator = exchange → ops reviews; playbook: request customer to re-pay from a non-exchange bank account or deny.
- **flags_thrown**: `ach_originator_crypto_exchange` → review; `ach_originator_known_mixer_offramp` → deny.
- **failure_modes_requiring_review**: ACH metadata stripped by intermediary; originator name ambiguous; legitimate user just happens to bank with a crypto-friendly neobank.
- **record_left**: KYT query ID + originator name + entity attribution + decision.
- # stage 4

## 6. Plaid `auth` + `transactions` pre-charge bank-funding-source check

- **summary**: For ACH-funded orders, require Plaid Link with `auth` + `transactions` scopes pre-charge. Inspect the last 30 days of inbound transactions on the funding account; if the dominant inflow source is a crypto exchange (Coinbase, Kraken, Gemini, Crypto.com, Binance.US — match by Plaid's `merchant_name` and `category` taxonomy `Transfer > Cryptocurrency`), flag. Catches the user who buys crypto on Coinbase, sells to USD, ACHes to their bank, then pays the synthesis provider from that bank — the "two-hop" laundering of crypto into a "no crypto" checkout.
- **attacker_stories_addressed**: none in mapping (forward-looking)
- **external_dependencies**: Plaid (`/auth/get`, `/transactions/get`); customer must consent
- **manual_review_handoff**: dominant crypto inflow → ops reviews; playbook escalate if combined with other red flags; customer can be asked to source funds differently.
- **flags_thrown**: `bank_funding_majority_crypto_offramp` → review.
- **failure_modes_requiring_review**: Plaid coverage gaps for credit unions/small banks; customer declines Plaid; account too new (no 30-day history).
- **record_left**: Plaid item ID + summary stats (no raw txns retained beyond policy window).
- # stage 4

## 7. PayPal / Venmo / Cash App "crypto balance" funding refusal

- **summary**: PayPal, Venmo, and Cash App now allow users to fund payments from a crypto balance (PayPal Crypto, Venmo Crypto, Cash App Bitcoin). Configure the PayPal Commerce Platform integration to reject orders where the `funding_source` returned in the order details = `CRYPTO`. For Venmo/Cash App, disable those rails entirely if the SOP can't enforce funding-source filtering at the per-transaction level. Specific control: in PayPal Orders v2, inspect `payment_source.paypal.attributes.vault.status` and `payer.payment_method` for crypto markers.
- **attacker_stories_addressed**: none in mapping
- **external_dependencies**: PayPal Orders v2 API; Venmo/Cash App business APIs (limited filtering)
- **manual_review_handoff**: `funding_source=CRYPTO` → auto-deny; if API doesn't expose source → disable wallet entirely.
- **flags_thrown**: `wallet_crypto_funded` → deny.
- **failure_modes_requiring_review**: PayPal masks funding source on some merchant tiers; new wallet rails added.
- **record_left**: PayPal order ID + funding source + decision.
- # stage 4

## 8. Stablecoin on-ramp domain referrer block (MoonPay, Wyre, Ramp, Transak, Banxa, Simplex)

- **summary**: At the web-application layer, block checkout sessions that initiate from a referrer in {moonpay.com, sendwyre.com, ramp.network, transak.com, banxa.com, simplex.com, mercuryo.io, guardarian.com}. These are crypto-to-fiat on-ramp widgets that some merchants embed; if the synthesis provider's checkout is being driven from one of those, the funding instrument is by construction crypto-derived even if the rail looks like a card. Lightweight web-tier control with negligible cost.
- **attacker_stories_addressed**: none (forward-looking)
- **external_dependencies**: web app referrer logging; named-domain denylist
- **manual_review_handoff**: hit → block session, customer-support page explains.
- **flags_thrown**: `referrer_crypto_onramp` → deny session.
- **failure_modes_requiring_review**: referrer stripped by browser; legitimate user with a crypto-news site as last-tab referrer (low cost, just deny session not the customer).
- **record_left**: web access log entry + denied session ID.
- # stage 4

## 9. Customer-support inbound triage script: any "can I pay with crypto?" → tag account

- **summary**: An SOP for support / sales channels: any inbound message containing the substrings {bitcoin, btc, ethereum, eth, usdc, usdt, crypto, monero, xmr, "stablecoin", "wallet address"} during the order-intake phase causes the responding agent to (a) decline politely with a templated reply, and (b) tag the customer record `requested_crypto=true`. The tag stays on the record and elevates manual-review priority for any subsequent order from that customer. Auditable string-match in a CRM (Zendesk, Intercom, Front).
- **attacker_stories_addressed**: none (latent-signal capture)
- **external_dependencies**: CRM with searchable transcripts (Zendesk macro, Intercom inbox rule); SOP doc
- **manual_review_handoff**: tag set → next order from this customer routes to manual-review queue with the transcript attached.
- **flags_thrown**: `requested_crypto_in_support` → soft flag, escalates next order.
- **failure_modes_requiring_review**: false positives (researcher saying "we work on crypto-EM proteins"); ambiguous wording.
- **record_left**: CRM ticket with tag + transcript.
- # stage 4

## 10. Order-form free-text scan for crypto-payment intent

- **summary**: At order submission, scan free-text fields (PO number, billing notes, shipping notes) for the same substring set as idea 9. Hit → block submission with a templated message and tag account. Catches the pre-emptive "I'd like to pay in BTC, please send wallet address" note. Trivial regex; runs in the order-validation middleware.
- **attacker_stories_addressed**: none
- **external_dependencies**: in-house order validation
- **manual_review_handoff**: hit → block + tag; ops reviews if the customer disputes (e.g., legit "Cryptocoryne" botanical buyer).
- **flags_thrown**: `order_text_crypto_intent` → deny submission.
- **failure_modes_requiring_review**: false positives on biological/scientific terminology containing "crypto-" prefix.
- **record_left**: order draft snapshot + matched substring + decision.
- # stage 4

## 11. Acquiring-bank MCC / merchant-of-record contractual prohibition

- **summary**: Verify that the synthesis provider's merchant-services agreement with its acquiring bank (Chase Paymentech, Worldpay, Elavon, Stripe-as-MoR, Adyen-as-MoR) explicitly prohibits processing for MCC 6051 (Quasi Cash — Financial Institutions, Merchandise, and Services / cryptocurrency) on the merchant side, and that the merchant's own settlement account is not held at a crypto-friendly neobank that might flip the rule. SOP-level: legal reviews the MSA annually and flags any clause permitting crypto rails. Auditable artifact = signed MSA + annual review memo.
- **attacker_stories_addressed**: none (governance)
- **external_dependencies**: legal counsel; acquiring-bank MSA
- **manual_review_handoff**: MSA permits crypto → legal escalates to CFO.
- **flags_thrown**: `msa_permits_crypto` → governance escalation.
- **failure_modes_requiring_review**: MSA renegotiation cycles; bank-side defaults change.
- **record_left**: signed MSA + annual review memo in legal archive.
- # stage 4

---

## Coverage notes

- The mapping file has zero attacker stories. Per the prompt's note, this measure is a blanket SOP rather than a data-driven check, so most ideas above are "enforcement / governance" (1, 2, 3, 7, 8, 9, 10, 11) rather than detection.
- Ideas 4, 5, 6 anticipate the *latent* "prefer crypto" attacker pattern that the mapping file's closing paragraph flags as a future risk. They are forward-looking — Stage 2 may legitimately drop them on relevance, but they are concrete and addressable.

## Dropped

(none — first iteration)
