# Stage 1 Ideation — Measure 10 (payment-bin-giftcard) — v2

**Limitation:** Still zero attacker stories in the mapping file. Direct mode only.

Carrying forward all PASS ideas from v1 unchanged. Revising Idea 10. Adding Idea 11 to close the virtual-single-use-card gap surfaced by stage 2.

## Idea 1 — binlist.net public BIN lookup
**(PASS — copied from v1, unchanged.)** First 6–8 digits → `https://lookup.binlist.net/{BIN}`; flag `prepaid=true` or issuer in gift-card-issuer allowlist. Free tier rate-limited; store JSON keyed by BIN+order.

## Idea 2 — BinDB downloadable BIN database
**(PASS — copied from v1, unchanged.)** Licensed CSV/SQL DB with `card_category` field; flag PREPAID/GIFT.

## Idea 3 — Neutrino API `bin-lookup`
**(PASS — copied from v1, unchanged.)** REST endpoint with `is-prepaid`; second source.

## Idea 4 — IINAPI.com BIN lookup
**(PASS — copied from v1, unchanged.)** Tertiary cross-check; majority vote across three sources.

## Idea 5 — Stripe `PaymentMethod.card.funding` + Radar
**(PASS — copied from v1, unchanged.)** No extra API call; Radar rule blocks `funding=prepaid` on SOC carts.

## Idea 6 — Adyen `additionalData.fundingSource` + RevenueProtect
**(PASS — copied from v1, unchanged.)** PREPAID value in fundingSource; RevenueProtect rule.

## Idea 7 — Visa ARDEF / Mastercard BIN Table prepaid ranges
**(PASS — copied from v1, unchanged.)** Authoritative network range files via acquirer/PSP relationship.

## Idea 8 — Curated prepaid-issuer blocklist (Pathward, Sutton, Bancorp, Green Dot, MetaBank, Stride, Republic Bank)
**(PASS — copied from v1, unchanged.)** Issuer-name match on top of any BIN lookup.

## Idea 9 — PSP checkout config: hard-block `funding=prepaid` for SOC SKUs
**(PASS — copied from v1, unchanged.)** Preventive variant of Ideas 5/6.

## Idea 10 (revised) — FinCEN MSB Registrant Search filtered for "Provider/Seller of Prepaid Access"

- **name:** FinCEN MSB Registrant Search — Prepaid Access category
- **summary:** FinCEN's MSB Registrant Search (`https://www.fincen.gov/msb-registrant-search`) lets users filter registered MSBs by activity type, including "Provider of Prepaid Access" and "Seller of Prepaid Access" (per 31 CFR 1010.100(ff)(4)). Periodically scrape the registrant list filtered to those activity types, extract the legal entity names, and feed them into Idea 8's curated issuer blocklist as additional names. This grounds the blocklist in a regulatory list rather than hand-curation.
- **attacker_stories_addressed:** none
- **external_dependencies:** FinCEN MSB Registrant Search (public web form, HTML scrape; no documented API).
- **manual_review_handoff:** same as Idea 8 — issuer hit triggers compliance review.
- **flags_thrown:** issuer name fuzzy-matches a FinCEN-registered Provider/Seller of Prepaid Access.
- **failure_modes_requiring_review:** registrant entity name differs from issuer-bank name on the BIN (program manager vs issuing bank); fuzzy matcher needs reviewer adjudication.
- **record_left:** registrant snapshot date + matched name pair.

## Idea 11 (new) — Virtual single-use card BIN detection (Privacy.com, Capital One Eno, Citi Virtual Account Numbers)

- **name:** Issuer-virtual-card BIN allowlist matching
- **summary:** Stage 2 noted that virtual single-use cards (Privacy.com via Patriot Bank/Sutton Bank, Capital One Eno virtual numbers, Citi Virtual Account Numbers, Apple Card virtual numbers, Capital One Eno) are not flagged as `prepaid` by BIN lookups because the underlying account is a real credit/debit account, but they obscure identity in the same way the measure cares about. Build a list of known virtual-card BIN ranges/issuers and flag matches separately as "virtual single-use card" with a softer review action (request name+billing match, not auto-deny). Sources for the BIN list: Privacy.com publicly documents that their cards are issued by Patriot Bank N.A. and Sutton Bank `[best guess]`; the BIN ranges are observable from any test transaction. Capital One Eno virtual numbers ride on the user's underlying card BIN, so this idea catches Privacy.com-style independent virtual-card services, not Eno.
- **attacker_stories_addressed:** none in mapping file; addresses the spirit of the measure ("payment method can be used to obscure identity") for a payment instrument the existing ideas miss.
- **external_dependencies:** observed BIN ranges for Privacy.com, Lithic, Marqeta-issued consumer virtual-card programs; manually maintained.
- **manual_review_handoff:** flag as "virtual card" rather than "gift card"; reviewer asks customer for the actual underlying funding source and a billing-name match.
- **flags_thrown:** BIN ∈ virtual-card-issuer list.
- **failure_modes_requiring_review:** Privacy.com BINs may overlap with non-virtual products from the same issuing bank → reviewer adjudicates.
- **record_left:** matched BIN + virtual-card list version.

## Dropped

(none — Idea 10 was revised, not dropped)
