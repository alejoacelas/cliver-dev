# Coverage research: Crypto-debit BIN + on-ramp referrer denylist

## Coverage gaps

### Gap 1: New or unlisted crypto-debit card programs
- **Category:** Customers (legitimate or otherwise) paying with a crypto-debit card issued by a program not yet on the internally curated BIN denylist — newly launched crypto card products, regional crypto cards (e.g., cards available only in the EU or Asia), or rebranded programs after a BIN sponsor change.
- **Estimated size:** The crypto card market consolidated after 2022 but active programs as of 2025 include Coinbase Card, Crypto.com, Gemini, Bybit, Wirex, Plutus, and Nexo [source](https://coinbureau.com/analysis/best-crypto-debit-cards). The total number of distinct BIN ranges is not publicly documented [unknown — searched for: "number of crypto debit card programs BIN ranges active 2025"]. New programs launch regularly. [best guess: at any given time, a manually curated list covers 70–85% of active crypto-card BIN ranges; the remainder are new entrants, regional programs, or programs whose BIN sponsor changed since last curation. This means 15–30% of crypto-card transactions could evade the BIN denylist.]
- **Behavior of the check on this category:** no-signal (the BIN is not on the list; the card passes)
- **Reasoning:** The denylist is static between quarterly refreshes. The implementation doc identifies this as the primary failure mode and recommends pairing with m10-stripe-funding's `prepaid` detection as a fallback (most crypto cards report as `prepaid`). But some crypto-debit cards report as `debit`, not `prepaid` (drawn from a custodial USD balance), so neither the BIN list nor the funding-type fallback catches them.

### Gap 2: Crypto-debit cards reported as `debit` (not `prepaid`) by the issuer
- **Category:** Crypto-debit card products that are technically debit cards drawn from a custodial fiat balance (not a prepaid instrument) — e.g., some Crypto.com card tiers, some Wirex configurations.
- **Estimated size:** [unknown — searched for: "crypto debit card funding type debit vs prepaid issuer reporting"]. The implementation doc flags this as a known issue. [best guess: a minority of crypto-card products — perhaps 2–4 out of ~10 major programs — report as `debit` rather than `prepaid`, based on the architecture: if the card is backed by a fiat-denominated deposit account at the sponsor bank, the network metadata says `debit`.]
- **Behavior of the check on this category:** no-signal (if the BIN is also not on the denylist, the card passes entirely; if the BIN is on the denylist, it is caught regardless of funding type)
- **Reasoning:** This gap interacts with Gap 1. A crypto card that reports as `debit` AND is not on the BIN denylist evades both legs of detection. The referrer leg is the only remaining signal, and it is near-useless (see Gap 3).

### Gap 3: Referrer-header suppression rendering the on-ramp referrer leg near-useless
- **Category:** Any customer arriving at the synthesis-provider checkout from a crypto on-ramp domain (MoonPay, Ramp Network, Transak, etc.) whose browser suppresses or strips the `Referer` header.
- **Estimated size:** Modern browsers default to `strict-origin-when-cross-origin`, which still sends the origin (e.g., `https://moonpay.com`) on cross-origin navigations [source](https://web.dev/articles/referrer-best-practices). However, if the on-ramp sets `Referrer-Policy: no-referrer` (common for privacy-focused crypto services), the header is entirely suppressed. [best guess: the referrer leg catches <5% of actual on-ramp-originated traffic, because (a) few customers navigate directly from an on-ramp checkout to a synthesis-provider checkout, and (b) privacy-focused on-ramps suppress the header.] The implementation doc itself rates this leg as having "near-zero adversarial value."
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The referrer leg is architecturally weak. It exists as a defense-in-depth signal but should not be counted as meaningful coverage. The implementation doc correctly identifies this.

### Gap 4: Non-card crypto funding paths (stablecoins, direct wallet transfer)
- **Category:** A customer who attempts to fund a synthesis purchase not through a crypto-debit card but through a direct stablecoin transfer, a crypto-to-fiat on-ramp that settles via bank wire (not card), or a peer-to-peer crypto transaction. This idea only covers the card-BIN and referrer surfaces.
- **Estimated size:** This gap is out-of-scope for this idea by design — it is covered by sibling ideas m11-psp-config-audit (no crypto payment methods enabled) and m11-msa-prohibition (contractual prohibition + text scan). [best guess: the probability of a synthesis provider accidentally accepting a direct crypto transfer is near-zero if the PSP config audit is in place. The residual risk is a bank-wire settlement from a crypto on-ramp, which is indistinguishable from any other bank wire.]
- **Behavior of the check on this category:** no-signal (out of scope by design)
- **Reasoning:** Documenting this for completeness; the implementation doc scopes itself to the card-BIN and referrer surfaces and defers the rest to sibling ideas.

## Refined false-positive qualitative

1. **Researcher who personally uses a Coinbase Card for everyday spending** — the BIN denylist hard-blocks the card. The implementation doc estimates "plausibly tens of customers per year." The false-positive is real but the SOP has no exception path because there is no legitimate institutional use case for a crypto-debit card in synthesis purchasing. The customer is asked to pay with a different card.
2. **Referrer false positives** — near-zero in practice. A content scraper or link aggregator that happens to set a denylisted referrer origin could trigger the WAF rule, but this would not affect a real customer checkout flow.

## Notes for stage 7 synthesis

- This idea's effective coverage is almost entirely the BIN-denylist leg. The referrer leg adds negligible value and should be presented as a minor defense-in-depth signal, not a real control.
- The primary detection gap (Gaps 1+2 combined) is crypto cards that are both (a) not on the BIN denylist and (b) not reported as `prepaid`. The mitigation is quarterly denylist refresh + pairing with m10-stripe-funding, but a residual gap remains for `debit`-reporting crypto cards from new programs.
- The false-positive surface is tiny because legitimate institutional synthesis customers essentially never use crypto-debit cards.
