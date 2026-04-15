# Stage 1 Ideation — Measure 10 (payment-bin-giftcard) — v1

**Limitation:** The attacker mapping file (`attackers/by-measure/measure-10-payment-bin-giftcard.md`) reports zero relevant attacker stories — no branch in the corpus routes synthesis-provider payment through a gift card. Direct mode only. Attacker-driven mode is empty by construction. Stage 2 should treat the relevance gate as vacuously satisfied for this measure (or apply the mapping file's note that prepaid-virtual-card sub-options in `inbox-compromise` and `foreign-institution` would become marginal if the measure widens from "gift card BIN" to "any prepaid/obscured-identity BIN").

---

## Idea 1 — binlist.io / binlist.net BIN lookup

- **name:** binlist.net public BIN lookup
- **summary:** On checkout, take the first 6–8 digits of the PAN (BIN/IIN), call `https://lookup.binlist.net/{BIN}`, and inspect the JSON response's `type` (`debit` / `credit`), `prepaid` (boolean), `brand`, `bank.name`, and `country` fields. Flag when `prepaid=true` or when `bank.name` matches a known gift-card issuer (Blackhawk, InComm, Pathward/MetaBank prepaid program, Sutton Bank prepaid programs, Green Dot, Bancorp Bank prepaid).
- **attacker_stories_addressed:** none (see limitation)
- **external_dependencies:** binlist.net free tier (rate-limited, ~5 req/hr historically); fallback to a paid mirror.
- **manual_review_handoff:** if `prepaid=true` on a SOC order, hold the order, route to compliance reviewer, ask customer to provide an alternative non-prepaid payment method or institutional PO. Playbook: 1) confirm BIN against second source, 2) email customer, 3) deny if no alternative within 7 days.
- **flags_thrown:** `prepaid=true` → review; issuer in gift-card-issuer allowlist → review; lookup failure → soft flag (log, do not block).
- **failure_modes_requiring_review:** binlist returns 404 (unknown BIN), 429 (rate limit), `prepaid=null` (unknown).
- **record_left:** stored JSON response keyed by BIN + timestamp + order ID.

## Idea 2 — BinDB commercial BIN database

- **name:** BinDB downloadable BIN database
- **summary:** License BinDB's CSV/SQL BIN database (refreshed monthly), load locally, look up incoming BIN; the schema includes `card_category` (CLASSIC/GOLD/PREPAID/GIFT) and `card_type`. Flag any BIN whose `card_category` contains PREPAID or GIFT.
- **external_dependencies:** BinDB license (commercial, flat annual fee `[best guess]`).
- **manual_review_handoff:** same playbook as Idea 1.
- **flags_thrown:** `card_category` ∈ {PREPAID, GIFT}.
- **failure_modes_requiring_review:** BIN missing from local snapshot (newer than last refresh) → fall back to live API.
- **record_left:** local DB version + matched row.

## Idea 3 — Neutrino API BIN Lookup

- **name:** Neutrino API `bin-lookup` endpoint
- **summary:** Call Neutrino API's `bin-lookup` REST endpoint with the BIN; response includes `is-prepaid`, `is-commercial`, `card-type`, `issuer`, `country`. Flag `is-prepaid=true`. Used as a second source to cross-check binlist.
- **external_dependencies:** Neutrino API account (per-request pricing `[best guess]`).
- **manual_review_handoff:** as Idea 1.
- **flags_thrown:** `is-prepaid=true`; disagreement with binlist on prepaid status → manual review.
- **failure_modes_requiring_review:** API down, account quota exceeded.
- **record_left:** stored JSON response.

## Idea 4 — IINAPI.com BIN/IIN lookup

- **name:** IINAPI.com BIN lookup
- **summary:** Third-party BIN database with REST lookup returning `type` (debit/credit/prepaid/charge) and `category`. Used as a tertiary cross-check; if any two of {binlist, Neutrino, IINAPI} return prepaid, treat as confirmed prepaid.
- **external_dependencies:** IINAPI subscription `[best guess]`.
- **manual_review_handoff:** as Idea 1.
- **flags_thrown:** majority-vote prepaid across sources.
- **failure_modes_requiring_review:** API mismatch across sources → reviewer adjudicates.
- **record_left:** all three responses stored.

## Idea 5 — Stripe Radar / Stripe PaymentMethod card metadata

- **name:** Stripe `PaymentMethod.card` funding + Radar rules
- **summary:** If the provider uses Stripe as PSP, the `PaymentMethod.card` object exposes `funding` (`credit` / `debit` / `prepaid` / `unknown`), `brand`, `country`, `issuer` (where available), and Radar adds risk signals. Add a Radar rule: `Block if :card_funding: = 'prepaid' and :metadata[soc_order]: = 'true'`. No external API call needed — the data is on the PaymentIntent.
- **external_dependencies:** Stripe account with Radar (Standard or Radar-for-Fraud-Teams).
- **manual_review_handoff:** Radar review queue; reviewer requests alternative payment method.
- **flags_thrown:** `funding == prepaid`; Radar risk_score above threshold.
- **failure_modes_requiring_review:** `funding == 'unknown'` (Stripe couldn't classify) → manual BIN lookup as backup.
- **record_left:** Stripe PaymentIntent + Radar evaluation log.

## Idea 6 — Adyen card risk signals (`fundingSource`, RevenueProtect)

- **name:** Adyen `additionalData.fundingSource` + RevenueProtect
- **summary:** Adyen returns `additionalData.fundingSource` (`CREDIT`/`DEBIT`/`PREPAID`/`CHARGE`/`DEFERRED_DEBIT`) and `additionalData.cardIssuingBank`, `cardIssuingCountry`, `issuerBin`. Configure a RevenueProtect risk rule that scores or blocks `fundingSource == PREPAID` for SOC orders.
- **external_dependencies:** Adyen merchant account with RevenueProtect.
- **manual_review_handoff:** Adyen case management → compliance reviewer.
- **flags_thrown:** `fundingSource == PREPAID`; mismatch between `cardIssuingCountry` and shipping country (correlated heuristic).
- **failure_modes_requiring_review:** `fundingSource` absent from response → fallback BIN lookup.
- **record_left:** Adyen authorization response + risk evaluation.

## Idea 7 — Visa & Mastercard official prepaid BIN files

- **name:** Visa/Mastercard prepaid BIN range files (issuer-licensed)
- **summary:** Visa and Mastercard distribute BIN range tables to acquirers and licensed parties identifying prepaid product ranges (Visa's "Account Range" / ARDEF file; Mastercard's BIN Table / Mastercard Connect "Customer Interface Specification" BIN file). These are the authoritative source for prepaid/gift identification (since binlist and friends are derived from them). A provider with acquirer access can ingest the range file directly. `[best guess]` on exact filenames.
- **external_dependencies:** acquirer or PSP relationship that grants access to the network's BIN file; license terms.
- **manual_review_handoff:** as Idea 1.
- **flags_thrown:** BIN ∈ network-published prepaid range.
- **failure_modes_requiring_review:** ranges drift; need monthly refresh.
- **record_left:** range file version + matched range.

## Idea 8 — Merchant Category Code (MCC) cross-check on the issuer

- **name:** Issuer-MCC heuristic via PSP issuer metadata
- **summary:** Some BIN data sources expose the issuer's MCC or business type. Gift-card program managers (Blackhawk Network MCC 5499/6051, InComm, Pathward prepaid programs) have characteristic issuer footprints. Maintain a manually curated allowlist/blocklist of issuer names (`Pathward N.A.`, `Sutton Bank`, `Bancorp Bank`, `MetaBank`, `Green Dot Bank`, `Stride Bank`, `Republic Bank & Trust prepaid`, `The Bancorp Bank`) and flag any BIN whose `bank.name` matches.
- **external_dependencies:** any BIN lookup that returns issuer name; manually maintained issuer blocklist.
- **manual_review_handoff:** as Idea 1; if issuer matches blocklist, treat as high-confidence prepaid even if `prepaid` field is null.
- **flags_thrown:** issuer name in blocklist.
- **failure_modes_requiring_review:** issuer name returned in non-canonical form (string-match drift) → fuzzy match + reviewer.
- **record_left:** matched issuer string + blocklist version.

## Idea 9 — Require non-prepaid funding via PSP-side rule (preventive)

- **name:** PSP checkout config: disable prepaid funding for SOC product SKUs
- **summary:** Rather than detecting after the fact, configure the PSP (Stripe, Adyen, Braintree) to reject `funding=prepaid` at authorization for any cart containing a SOC SKU. Implements measure 10's intent as a hard block rather than a flag. Pairs with Idea 5 or 6.
- **external_dependencies:** PSP rules engine.
- **manual_review_handoff:** customer sees decline; CS playbook offers alternative payment.
- **flags_thrown:** authorization decline event logged.
- **failure_modes_requiring_review:** false-decline of legitimate corporate prepaid cards used as P-cards (some institutional P-cards are technically prepaid) → CS escalation playbook.
- **record_left:** PSP decline event with reason code.

## Idea 10 — FinCEN GPR/prepaid access program registry cross-reference

- **name:** FinCEN "Prepaid Access" registered program issuers
- **summary:** `[best guess]` Under 31 CFR 1010.100(ff)(4) FinCEN's prepaid-access rule, providers/sellers of prepaid access register; the issuer list overlaps strongly with gift-card and GPR-card issuers. Use the registered-issuer list as an additional issuer blocklist source for Idea 8. Adds regulatory grounding to the issuer list.
- **external_dependencies:** FinCEN registration data `[best guess — may not be public in machine-readable form]`.
- **manual_review_handoff:** same as Idea 8.
- **flags_thrown:** issuer ∈ FinCEN prepaid-access registrants.
- **failure_modes_requiring_review:** registry not actually published / stale.
- **record_left:** matched issuer + registry snapshot date.

## Note on ISO 3779

The brief mentioned "ISO 3779 BIN ranges." ISO 3779 is the vehicle WMI standard, not a payment standard. The relevant standard is **ISO/IEC 7812** ("Identification cards — Identification of issuers"), which defines the IIN/BIN structure. No idea is built around ISO 3779; an ISO/IEC 7812 reference is implicit in every BIN-lookup idea above.

---

## Dropped

(none — first iteration)
