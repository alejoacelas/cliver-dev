# Per-idea synthesis: m10-prepaid-issuer-denylist

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Prepaid issuer / virtual single-use BIN denylist |
| **measure** | M10 — payment-bin-giftcard |
| **attacker_stories_addressed** | None in the current attacker corpus. The two adjacent mentions (inbox-compromise Method 5.2 "prepaid virtual card", foreign-institution Method 3 "prepaid debit card in real name") are non-load-bearing sub-options. The implementation lists hypothetical story labels ("prepaid-gift-card", "virtual-single-use-bin") rather than actual corpus branch slugs. |
| **summary** | Maintain an internal denylist of BIN ranges belonging to known prepaid-card programs (Netspend/Pathward, Green Dot Bank, Bancorp Bank prepaid programs) and virtual single-use BIN providers (Privacy.com, Revolut Disposable, Cash App disposable). Cross-check the first 6–8 digits of the customer's PAN against the list at checkout. Hard block on hit; manual override path for legitimate corporate prepaid programs. |
| **external_dependencies** | Internal denylist of BIN ranges (curated from BinDB, NeutrinoAPI, or similar vendor). PSP integration for hard pre-auth block (Stripe Radar custom rule on `card.bin`, Adyen Risk rule, or equivalent). Quarterly curation labor to refresh list. |
| **endpoint_details** | **Two layers.** (1) BIN data source: BinDB (12,000+ prepaid/virtual/gift identifications, monthly updates, [vendor-gated pricing]); NeutrinoAPI BIN Lookup (`is_prepaid` boolean, weekly updates); binlist.net (free, stale post-2023, unsuitable for production); Handy API and IINAPI as alternatives. (2) PSP enforcement: Stripe `card.funding` + `card.bin` with Radar rules; Adyen Risk rules. Auth model: API key per BIN vendor + PSP API key. No rate limit at enforcement time (list loaded into PSP rule engine). |
| **fields_returned** | Per BIN: bin (6–8 digit prefix), scheme/brand, type (credit/debit/prepaid), prepaid (boolean), category/product (gift/virtual/reloadable — varies by vendor), issuer/bank_name, country. BinDB additionally claims to flag BIN sponsorship (where named issuer is sponsor for a fintech program). Issuer mappings: Netspend → Bancorp/Pathward; Green Dot → Green Dot Bank; Sutton Bank → 140+ programs including Cash App, Privacy-related products; Privacy.com issuing bank [unknown — searched for 4 queries; historically Patriot Bank/Sutton Bank]. |
| **marginal_cost_per_check** | Per-check runtime: ~$0 (PSP rule evaluation bundled with transaction fees; no incremental API call). Setup/refresh: BinDB-class subscription [vendor-gated; best guess: $1k–$10k/year]. Refresh labor: ~2–4 hours/quarter to diff vendor data against live denylist and redeploy. |
| **manual_review_handoff** | Hard block fires at PSP level → order enters "blocked — payment method" queue. Reviewer pulls order, matched BIN, issuer name. Checks institutional context from sibling checks. If established institutional account with corporate prepaid program → may grant one-time exception, route to ACH/invoice for future. Otherwise → deny, email customer requesting alternative payment. Recurring legitimate hits feed manual exception list. SOP target: 10 minutes per case for non-exception path. |
| **flags_thrown** | `prepaid_issuer_denylist_hit` — BIN matches denylisted prepaid program. Hard block + reviewer exception adjudication. `virtual_bin_provider_hit` — BIN matches denylisted single-use/disposable virtual card program. Hard block + default deny (no legitimate institutional use case). |
| **failure_modes_requiring_review** | List curation lag (new prepaid programs launch with BINs not yet on list; quarterly refresh = up to 3 months gap). Sponsor-bank ambiguity (Sutton Bank, Bancorp, Pathward issue BINs for both prepaid and non-prepaid fintech programs; denylist must be BIN-range-level, not issuer-level). PSP-reported funding mismatch in both directions (Stripe says prepaid but BIN not on list; BIN on list but Stripe says credit). Vendor data error. |
| **false_positive_qualitative** | (1) Sponsor-bank ambiguity — most dangerous implementation risk; Sutton Bank has 140+ programs including Cash App (50M+ monthly active users) and Ramp corporate. Issuer-level scoping would hard-block all these users. BIN-range-level scoping requires mapping that is [unknown — not publicly available]. (2) Government procurement cards — ~3M active cards across 350+ agencies, $30B annual spend; some issued on Bancorp/Pathward BINs. Hard-blocking a federal lab's purchase card is a severe customer-experience/contractual failure. (3) International fintech cards — Revolut (70M+ users), Wise (16M+ users) classified as prepaid; hard-blocking alienates large international customer segment. (4) Hard-block design amplifies all FPs — unlike binlist-stack (reviewer adjudication), this idea rejects payment before authorization; every FP is a rejected payment, not a review queue item. |
| **coverage_gaps** | **Gap 1: Government/institutional procurement cards** — est. 5–15% of government/academic synthesis customers may pay with denylisted-sponsor-bank cards. FP via hard block. **Gap 2: Sponsor-bank ambiguity** — Sutton Bank alone has 140+ programs; BIN-to-program mapping [unknown]; without it, denylist is either over-broad or under-inclusive. **Gap 3: International fintech cards** — Revolut/Wise/N26 classified as prepaid; est. 10–20% of international customers (30–50% of market) may use these. Severe FP if denylisted. **Gap 4: Curation lag** — quarterly refresh = up to 3 months gap for new prepaid programs. False-negative window. **Gap 5: Non-card payments** — ACH, wire, PO bypass the check entirely; est. 20–40% of institutional orders [best guess]. Structural scope limitation. |
| **record_left** | Matched BIN (first 6–8 digits), denylist entry (issuer + program label), PSP transaction ID (blocked record), reviewer decision and rationale, customer-facing message sent. Stored in order-screening audit log. |
| **bypass_methods_known** | None — no attacker stories mapped to this measure in the current corpus. |
| **bypass_methods_uncovered** | None in the formal sense — the structural bypass is using any non-prepaid payment method (standard credit/debit card, ACH, wire, PO). The attacker corpus confirms no branch uses prepaid/gift cards as load-bearing payment. |

## Section 2: Narrative

### What this check is and how it works

This check maintains a curated denylist of BIN ranges belonging to known consumer prepaid-card programs (Netspend/Pathward, Green Dot Bank, Bancorp Bank programs) and virtual single-use card providers (Privacy.com, Revolut Disposable). The denylist is loaded into the payment service provider's rule engine (e.g., Stripe Radar custom rule on `card.bin`), where it executes as a hard pre-authorization block: if the first 6–8 digits of the customer's payment card match a denylisted BIN range, the payment is rejected before authorization completes. The order enters a "blocked — payment method" queue where a reviewer can grant a one-time exception for legitimate corporate prepaid programs and route the customer to alternative payment methods (ACH, wire, institutional PO). The denylist is seeded from a commercial BIN database vendor (BinDB, NeutrinoAPI) and refreshed quarterly.

### What it catches

In the current attacker corpus, this check catches nothing. No attacker branch routes synthesis-provider payment through a gift card or consumer prepaid card. The two nearest references (inbox-compromise Method 5.2 "prepaid virtual card," foreign-institution Method 3 "prepaid debit card in real name") are tertiary sub-options, not load-bearing payment paths. The check is forward-looking defense-in-depth against a payment method that the current threat model does not stress. If the threat model were expanded to include low-sophistication attackers purchasing prepaid cards at retail, the hard block would catch them.

### What it misses

The structural bypass is trivial: any attacker who uses a standard credit or debit card, ACH, wire transfer, or institutional purchase order bypasses the check entirely. Since the current attacker corpus avoids prepaid/gift-card payment, the check screens for a method sophisticated attackers do not use. New prepaid programs that launch with BIN ranges not yet on the denylist slip through during the up-to-3-month curation lag. Non-card payment methods (estimated 20–40% of institutional orders) are structurally outside scope.

### What it costs

Runtime cost is approximately $0 per check because the denylist is pre-loaded into the PSP rule engine and evaluated as part of normal transaction processing. The load-bearing cost is the BIN database subscription (estimated $1k–$10k/year, vendor-gated) and the curation labor (~2–4 hours/quarter to diff vendor data against the live denylist). Setup is approximately 2 engineering days to wire the PSP rule and build the refresh workflow.

### Operational realism

The hard-block design is the defining operational characteristic — and the key risk. Unlike the sibling binlist-stack idea (which sends prepaid flags to reviewer adjudication), this idea rejects payment at the PSP level before authorization. Every false positive is a rejected payment, not a review queue item. The customer-experience impact is severe: a federal lab's procurement card issued on a Bancorp BIN range gets hard-blocked; a biotech startup paying with a Ramp corporate card issued via Sutton Bank gets hard-blocked. The reviewer override path exists but only after the customer has already been rejected and contacts support. The sponsor-bank ambiguity problem is the implementation's Achilles heel: Sutton Bank alone operates 140+ active card programs, including Cash App debit (50M+ users) and Ramp corporate cards. Without a precise BIN-to-program mapping — which is not publicly available — the denylist is either over-broad (catching legitimate programs) or under-inclusive (missing new prepaid programs).

### Open questions

The coverage analysis raised several fundamental questions. First, does this check provide marginal value over the sibling ideas (m10-binlist-stack for reviewer adjudication, m10-stripe-funding for PSP-native `card.funding` classification)? If those checks already flag prepaid cards for review, the denylist's unique contribution is hard-blocking virtual single-use cards (Privacy.com type) — but the Privacy.com issuing bank mapping is itself unknown. Second, is hard-blocking (versus reviewer adjudication) justified given the near-zero true-positive rate? Third, if the synthesis provider serves a global market, hard-blocking Revolut/Wise BINs is a market-access decision, not just a fraud decision — estimated 10–20% of international customers could be affected. These are policy decisions, not engineering decisions.

## Section 3: Open issues for human review

- **No hardening findings at all.** No attacker stories were mapped; nothing to evaluate.
- **Fundamental cost-benefit question:** Near-zero true-positive rate (no attacker story uses prepaid/gift-card payment) against severe false-positive risk (government procurement cards, Cash App debit, Ramp corporate, Revolut/Wise international cards). The hard-block design amplifies every FP into a rejected payment. Human review should determine whether hard-blocking is justified or whether reviewer adjudication (per the sibling binlist-stack approach) is sufficient.
- **Sponsor-bank ambiguity — load-bearing implementation risk:** Sutton Bank has 140+ programs. The BIN-to-program mapping required for safe denylist scoping is [unknown — searched for: "Sutton Bank BIN range mapping by program", "BIN to fintech program mapping database"]. Without this mapping, the denylist cannot be safely deployed at BIN-range level. This is not solvable with public data alone.
- **`[unknown]` fields:**
  - Privacy.com current issuing bank — searched for 4 queries; historically Patriot Bank/Sutton Bank, no current cardholder agreement source located.
  - BIN-to-program mapping for Sutton Bank/Bancorp/Pathward — not publicly available.
  - NeutrinoAPI data refresh cadence — not published.
- **`[vendor-gated]` items:**
  - BinDB pricing — page exists, per-tier numbers require sales contact.
  - BIN-to-program mapping — may be available from Visa/Mastercard under NDA but not public.
- **`[best guess]` fields with weak derivation:**
  - BinDB subscription cost ($1k–$10k/year) — based on typical fraud-data-feed pricing bands, not vendor-confirmed.
  - Government procurement card usage among synthesis customers (5–15%) — plausible but unsourced.
  - Non-card payment share of institutional orders (20–40%) — unsourced.
  - International fintech card usage among international customers (10–20%) — derived from Revolut/Wise user counts but no synthesis-market-specific data.
- **04C claim check unresolved flags:**
  - OVERSTATED (mild): Netspend → Bancorp/Pathward citation is a third-party SEO blog, not a primary source.
  - UPGRADE-SUGGESTED: Privacy.com issuing bank — search `site:privacy.com cardholder agreement`.
- **Overlap with sibling ideas:** This check overlaps heavily with m10-binlist-stack and (hypothetical) m10-stripe-funding. Stage 8 per-measure synthesis should determine whether both the hard-block denylist and the reviewer-adjudication BIN stack are needed, or whether one dominates the other.
- **International customer impact as policy decision:** Hard-blocking Revolut/Wise BINs affects a significant fraction of international customers. This should be an explicit business decision, not an engineering default.
