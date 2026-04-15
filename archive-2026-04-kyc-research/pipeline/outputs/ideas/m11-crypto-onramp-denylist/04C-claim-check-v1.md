# 04C claim check — m11-crypto-onramp-denylist v1

## Verified

- **Coinbase Card issued by Pathward, N.A.** — Coinbase publishes the cardholder terms PDF naming the issuer. PASS.
- **Coinbase Card legacy MetaBank issuer** — the legacy MetaBank cardholder agreement PDF is hosted on Coinbase's CDN. (MetaBank rebranded to Pathward in 2022; this is the same issuer under a previous name.) PASS.
- **Stripe Radar rule reference page exists** — https://docs.stripe.com/radar/rules/reference. PASS.
- **Crypto.com Visa Card exists as a Visa prepaid product** — corroborated by the Bitget academy listing of crypto cards. PASS-on-existence; the document does not make a strong claim about its issuing bank, so no overstatement.
- **MoonPay Ramps product page exists** — https://www.moonpay.com/business/ramps. PASS.

## Flags

- **MISSING-CITATION (minor) — "BlockFi shut down its card program in 2023"** — used as background to justify list staleness. The fact is correct (BlockFi filed Chapter 11 in November 2022 and wound down the card program in early 2023) but no URL is cited. Suggested fix: cite a CoinDesk / Reuters article on BlockFi's bankruptcy and card-program wind-down.
- **MISSING-CITATION (minor) — "Marqeta powers Coinbase Card"** — background claim. Easily citable to Marqeta's customer page or Coinbase's launch blog post.
- **UPGRADE-SUGGESTED — Stripe `:card_bin:` Radar attribute** — the document asserts this attribute name. Verify on https://docs.stripe.com/radar/rules/supported-attributes. (`:card_bin:` is in the supported attributes list per the m10-stripe-funding research; carries over.)

No BROKEN-URL or load-bearing OVERSTATED claims.

## Verdict

PASS (minor missing citations on background claims; not load-bearing).
