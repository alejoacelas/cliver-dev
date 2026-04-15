# m10-prepaid-issuer-denylist — implementation v1

- **measure:** M10
- **name:** Prepaid issuer / virtual single-use BIN denylist
- **modes:** A
- **summary:** Maintain an internal denylist of BIN ranges belonging to known prepaid-card programs (Netspend/Pathward, Green Dot Bank, Bancorp Bank prepaid programs) and virtual single-use BIN providers (Privacy.com on Sutton Bank/Patriot Bank, Revolut Disposable, Cash App on Sutton Bank). Cross-check the first 6–8 digits of the customer's PAN against the list at checkout. Hard block on hit; manual override path for legitimate corporate prepaid programs.
- **attacker_stories_addressed:** prepaid-gift-card, virtual-single-use-bin (inbox-compromise method 5.2 "prepaid virtual card"; foreign-institution method 3 "prepaid debit card in real name").

## external_dependencies

- **Internal denylist** of BIN ranges, curated from a commercial BIN-database vendor (BinDB, Neutrino, IINAPI, or Handy API) plus manual additions for newly observed programs.
- **PSP integration** to enforce a hard pre-auth block — Stripe Radar custom rule on `card.bin`, Adyen Risk rule, or equivalent — so the order is rejected before authorization.
- **Curation labor** (~quarterly) to refresh the list as issuers add BIN ranges. Prepaid programs frequently add new BIN ranges, so a static list ages.

## endpoint_details

Two layers:

1. **BIN data source.** Several vendors publish prepaid-flagged BIN data:
   - **BinDB** advertises identification of "over 12,000 different Prepaid, Virtual (temporary card) and Gift cards" with a monthly-updated PCI Data File and a web-service / API option [source](https://www.bindb.com/identify-prepaid-cards). Pricing is not on the public page; the pricing page exists but requires inquiry [vendor-gated — public page lists product tiers (PCI Data File, Web Service) but not prices; would require sales contact for $ figures](https://www.bindb.com/pricing).
   - **Neutrino API** BIN Lookup advertises 6/8/10-digit BINs, weekly updates, and an `is_prepaid` boolean in the response [source](https://www.neutrinoapi.com/api/bin-lookup/).
   - **binlist.net** is free but throttled to 5 requests/hour with bursts of 5 [source](https://binlist.net/) — unsuitable for production but usable for one-shot denylist seeding.
   - **Handy API** and **IINAPI** offer paid BIN lookup with prepaid flag [source](https://www.handyapi.com/bin-list), [source](https://iinapi.com/).
2. **PSP enforcement layer.** Stripe exposes `payment_method.card.funding` (one of `credit`, `debit`, `prepaid`, `unknown`) and `card.bin`; Radar rules can block on either. (See sibling idea m10-stripe-funding for the funding-type approach; this idea is the BIN-list complement that catches issuer-level patterns the funding flag misses, e.g. a single-use virtual card that the network reports as `debit`.)
- **Auth model:** API key per BIN-data vendor; PSP API key for the enforcement leg.
- **Rate limits:** None at enforcement time (the list is loaded into the PSP rule). Refresh-time rate limits depend on vendor.
- **ToS constraints:** Most BIN database vendors prohibit redistribution. Internal use for fraud screening is the canonical permitted use case [best guess: BIN database vendors universally allow internal fraud-screening use; redistribution and resale are the typical prohibited cases — based on BinDB FAQ framing of "use within your organization"].

## fields_returned

From a BIN lookup vendor, per BIN:

- `bin` (6–8 digit prefix)
- `scheme` / `brand` (Visa / Mastercard / Amex)
- `type` (`credit` / `debit` / `prepaid`)
- `prepaid` (boolean)
- `category` or `product` (e.g., `gift`, `virtual`, `reloadable`) — varies by vendor
- `issuer` / `bank_name` (e.g., "The Bancorp Bank", "Sutton Bank", "Pathward N.A.", "Green Dot Bank")
- `country`
- BinDB additionally claims to flag "cards issued under BIN sponsorship" — i.e., where the named issuer is a BIN sponsor for a fintech program rather than the consumer-facing brand [source](https://www.bindb.com/identify-prepaid-cards). [vendor-described, not technically documented in the public page — would need data sample to confirm what the field is named].

Issuer-bank evidence for the canonical denylist members:

- **Netspend** is associated with Bancorp Bank and Pathward National Association [source](https://www.devicemag.com/netspend-bank/) [best guess on Pathward: corroborated by Netspend's own program disclosures, but the search result aggregates several sources].
- **Green Dot** prepaid Visa cards are issued by Green Dot Bank [source](https://www.netspend.com/blog/which-banks-offer-prepaid-debit-cards).
- **Sutton Bank** is a "leading issuer of nationwide payment card programs" and operates BIN ranges for many fintech programs including Cash App and Privacy-related virtual card products [source](https://bincheck.io/us/sutton-bank), [source](https://partner.visa.com/site/partner-directory/sutton-bank.html). Note: Sutton Bank is also the BIN sponsor for legitimate non-prepaid programs (Cash App debit), so a Sutton BIN alone is ambiguous — the denylist must be at the program/BIN-range level, not the issuer level.
- **Privacy.com** virtual single-use cards: Privacy.com markets one-time virtual cards [source](https://www.privacy.com/virtual-card). The exact issuing bank for current Privacy.com cards is [unknown — searched for: "Privacy.com issuing bank 2025", "Privacy.com Sutton Bank BIN", "Privacy.com Patriot Bank issuer", "Privacy.com cardholder agreement issuer"]. Public reporting historically tied Privacy.com to Patriot Bank and Sutton Bank, but a current cardholder-agreement source was not located.

## marginal_cost_per_check

- **Per-check runtime cost:** ~$0. Once the denylist is loaded into the PSP's rule engine (Stripe Radar custom rule, Adyen Risk rule), each check is a string-prefix match with no incremental API call. [best guess: PSP rule evaluation is included in PSP transaction fees; no separate metered cost — based on Stripe Radar and Adyen Risk both pricing rule evaluation as bundled with payment processing rather than per-rule.]
- **Setup / refresh cost:** A BinDB-class subscription is the load-bearing cost. Vendor pricing is gated [vendor-gated — BinDB pricing page exists but requires login/contact; public marketing does not quote $ figures](https://www.bindb.com/pricing). [best guess: $1k–$10k/year for a commercial BIN database with prepaid flag and quarterly refresh — based on the pricing band typical for commercial fraud-data feeds and the fact that BinDB markets to "medium businesses".] Refresh labor: ~2–4 hours/quarter to diff vendor data against the live denylist and re-deploy the PSP rule. [best guess]

## manual_review_handoff

When `prepaid_issuer_denylist_hit` or `virtual_bin_provider_hit` fires:

1. The PSP rule blocks authorization automatically. The order enters a "blocked — payment method" queue.
2. Reviewer pulls the order, the matched BIN, and the issuer name from the audit log.
3. Reviewer checks the customer's institutional context (m05/m07/m18 outputs from sibling checks): if the customer is on an established institutional account with a corporate prepaid program (some research institutes issue Bancorp-sponsored corporate prepaid cards for petty-cash purchases), reviewer may grant a one-time exception and route the customer to ACH/invoice for future orders.
4. Otherwise, reviewer denies the order and emails the customer: "We are unable to accept the payment method provided. Please pay via institutional purchase order, ACH, or a credit card issued in your name by a primary issuing bank."
5. Reviewer logs the decision against the BIN; recurring legitimate hits feed the manual exception list.

SOP target: ≤10 minutes per case for the common (non-exception) path.

## flags_thrown

- `prepaid_issuer_denylist_hit` — PAN BIN matches a denylisted prepaid program. Action: hard block; route to reviewer for exception adjudication.
- `virtual_bin_provider_hit` — PAN BIN matches a denylisted single-use / disposable virtual-card program. Action: hard block; default deny without exception (single-use cards have essentially no legitimate institutional use case for synthesis purchasing).

## failure_modes_requiring_review

- **List curation lag.** A new prepaid program launches with a BIN not yet on the list. Symptom: customer slips through; only detected by retroactive audit if at all. Mitigation: quarterly refresh + subscribing to BinDB-class change feed.
- **Sponsor-bank ambiguity.** Sutton Bank, Bancorp Bank, and Pathward issue BINs for both prepaid and non-prepaid fintech programs. The denylist must be scoped to specific BIN ranges, not the bank name; mis-scoping causes false positives on legitimate Cash App debit (Sutton) and similar consumer debit cards. Reviewer escalates if the PSP report shows `funding=debit` but the BIN matched the prepaid list.
- **PSP-reported funding mismatch.** Stripe `card.funding` says `prepaid` but the BIN is not on the local list — surfaces a curation gap. Reviewer adds the BIN.
- **PSP-reported funding mismatch in reverse.** BIN is on the list but Stripe says `credit` — usually a sponsor-bank collision. Reviewer removes the false-positive BIN.
- **Vendor data error.** BIN database mis-flags an issuer. Reviewer corrects on appeal.

## false_positive_qualitative

- **Corporate prepaid programs.** Some research institutions and government labs issue prepaid procurement cards on Bancorp/Pathward BIN ranges for petty-cash and small-value purchases [best guess: this is a known pattern in US federal procurement and university petty-cash programs, but not heavily documented in public sources — consequently a non-trivial fraction of legitimate institutional small-order traffic could trip on a coarse "Bancorp Bank prepaid" denylist].
- **Non-US prepaid payroll cards.** Some international researchers (especially graduate students at non-US institutions) receive prepaid payroll cards from local programs; if those happen to be issued on a denylisted BIN sponsor, they would trip.
- **Cash App debit.** If the denylist is mis-scoped to "Sutton Bank" rather than the specific Privacy/disposable BIN ranges, every Cash App debit user trips — and Cash App debit cards are widely used by legitimate US consumers.
- **Revolut and Wise consumer cards** for international travelers — if denylisted as "fintech prepaid," would catch large numbers of legitimate international researchers paying out-of-pocket. (Note: this overlaps with sibling idea m12-fintech-denylist.)

## record_left

For each blocked order:

- The matched BIN (first 6–8 digits)
- The denylist entry that matched (issuer name + program label)
- PSP transaction ID (even though no auth was completed, the PSP creates a "blocked" record)
- Reviewer's decision and rationale (exception granted / denied)
- Customer-facing message sent

Stored in the order-screening audit log alongside other m10/m11/m12 outputs. This trail is what an auditor (FBI subpoena, internal compliance review, regulator) would receive to demonstrate that the synthesis provider rejected an obscured-payment instrument.

## Sources

- [BinDB — Identify Prepaid, Gift and Temporary Virtual Cards](https://www.bindb.com/identify-prepaid-cards)
- [BinDB — Pricing](https://www.bindb.com/pricing)
- [Neutrino API — BIN Lookup](https://www.neutrinoapi.com/api/bin-lookup/)
- [binlist.net — free BIN lookup with rate limits](https://binlist.net/)
- [Handy API — BIN List](https://www.handyapi.com/bin-list)
- [IINAPI](https://iinapi.com/)
- [DeviceMAG — Netspend bank associations](https://www.devicemag.com/netspend-bank/)
- [Netspend — which banks issue prepaid debit cards](https://www.netspend.com/blog/which-banks-offer-prepaid-debit-cards)
- [bincheck.io — Sutton Bank BIN list](https://bincheck.io/us/sutton-bank)
- [Visa Partner Directory — Sutton Bank](https://partner.visa.com/site/partner-directory/sutton-bank.html)
- [Privacy.com — Virtual Cards](https://www.privacy.com/virtual-card)
