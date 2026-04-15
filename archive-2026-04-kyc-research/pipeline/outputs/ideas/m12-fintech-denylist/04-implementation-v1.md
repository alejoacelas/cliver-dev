# m12-fintech-denylist — Implementation v1

- **measure:** M12 (billing-institution-association)
- **name:** Mercury / Brex / Wise consumer-fintech denylist
- **modes:** A
- **summary:** When the billing instrument is from a consumer-fintech or neobank (Mercury, Brex, Wise, Revolut Business, Relay, Bluevine), soft-flag the order if the customer claims institutional affiliation. Neobanks are the standard LLC-bank-account rail for shell-company and CRO-framing branches. The check compares the card's BIN (first 6–8 digits) against a maintained denylist of fintech/neobank BIN ranges; a match triggers manual review asking the customer to confirm their procurement channel.

## external_dependencies

- **BIN lookup service** — used to resolve the card's BIN to an issuer name, card type (credit/debit/prepaid), and bank name. Options:
  - **binlist.net** — free, open-source BIN/IIN lookup. Returns scheme, type, brand, prepaid flag, country, and bank name/URL/phone/city. No API key required. [source](https://binlist.net/)
  - **BinDB** — commercial BIN database with broader coverage (250,000+ BIN records). Paid plans. [source](https://www.bindb.com/bin-database)
  - **Stripe Radar** (if provider uses Stripe) — exposes `:card_bin:` as a rule attribute and provides issuer metadata natively; fintech-BIN rules can be written in Radar's rule engine without a separate BIN lookup. [source](https://docs.stripe.com/radar/rules?locale=en-GB)
- **Internal fintech-BIN denylist** — a curated list of BIN ranges known to belong to fintech/neobank issuers (Mercury's BIN sponsor is Choice Financial Group / Evolve Bank & Trust; Brex uses Emigrant Bank / Sutton Bank; Relay uses Thread Bank; Wise uses Community Federal Savings Bank / Evolve). The denylist is maintained internally and updated when new BIN sponsor relationships are announced. [best guess: the specific BIN-to-sponsor mappings are widely discussed in fintech forums but not officially published by all issuers; initial denylist requires manual curation from public BIN databases + fintech product announcements.]
- **Payment processor metadata** — most payment processors (Stripe, Adyen, Braintree) return issuer metadata alongside the charge object, including issuer name and country, which can be matched against the denylist without a separate API call.

## endpoint_details

### binlist.net (free tier)
- **URL:** `https://lookup.binlist.net/{bin}` [source](https://binlist.net/)
- **Auth:** None required.
- **Rate limit:** 10 requests per minute (stated on the site); suitable for low-volume screening but not high-throughput production. [source](https://binlist.net/)
- **Pricing:** Free.
- **Fields returned:** `number.length`, `number.luhn`, `scheme` (visa/mastercard/etc.), `type` (debit/credit), `brand`, `prepaid` (boolean), `country` (alpha2, name, currency, lat/lon), `bank.name`, `bank.url`, `bank.phone`, `bank.city`. [source](https://binlist.net/)

### Stripe Radar (if applicable)
- **URL:** Integrated into Stripe dashboard / API; no separate endpoint.
- **Auth:** Stripe API key.
- **Rate limit:** No separate BIN lookup rate limit; Radar rules execute inline with charge creation.
- **Pricing:** Stripe Radar is $0.05/transaction for Radar; $0.07/transaction for Radar for Fraud Teams. [source](https://stripe.com/radar)
- **Relevant rule attributes:** `:card_bin:`, `:card_issuer:`, `:card_funding:` (credit/debit/prepaid). Custom block/review lists can be created to match fintech BIN ranges. [source](https://docs.stripe.com/radar/lists?locale=en-GB)

### BinDB (commercial)
- **URL:** `https://api.bindb.com/v1/` [source](https://www.bindb.com/bin-database)
- **Auth:** API key.
- **Coverage:** 250,000+ BIN records from 15,000+ issuers across 200+ countries. [source](https://www.bindb.com/bin-database)
- **Pricing:** [vendor-gated — free tier exists with limited queries; paid plans available but pricing requires account creation.]

### BIN format note
Since April 2022, the industry has transitioned to 8-digit BINs (from 6-digit), providing more granular identification of card products. The denylist should support both 6-digit and 8-digit BIN matching. [source](https://www.binsearchlookup.com/)

## fields_returned

Per BIN lookup (from binlist.net or equivalent):
- `scheme` — Visa, Mastercard, Amex, etc.
- `type` — credit, debit
- `brand` — product brand (e.g., "Platinum", "Business")
- `prepaid` — boolean
- `bank.name` — issuing bank name (e.g., "Choice Financial Group", "Evolve Bank & Trust", "Sutton Bank")
- `bank.country` — country of issuance
- `bank.url`, `bank.phone`, `bank.city` — issuer contact details

Per internal denylist match:
- `bin_matched` — the BIN that triggered the match
- `fintech_label` — the neobank brand mapped to the BIN (e.g., "Mercury", "Brex", "Relay")
- `match_confidence` — high (exact BIN match) / medium (BIN sponsor match, brand inferred)
- `customer_claimed_institution` — the institution on file
- `institution_type` — from prior screening (university, government, commercial, etc.)

## marginal_cost_per_check

- **binlist.net:** $0 (free; but rate-limited to 10/min).
- **Stripe Radar:** $0.05–$0.07 per transaction (already incurred if provider uses Stripe for payments; the BIN rule adds no marginal cost). [source](https://stripe.com/radar)
- **BinDB:** [vendor-gated — pricing not publicly listed beyond free tier.]
- **Internal denylist maintenance:** [best guess: ~$500–$2,000/year in analyst time to curate and update BIN-to-fintech mappings as neobanks change BIN sponsors. Initial curation: ~1 engineer-day.]
- **Composite:** $0–$0.07 per check depending on whether a standalone BIN lookup or Stripe Radar inline rule is used. The check adds negligible marginal cost on top of payment processing.

## manual_review_handoff

When `fintech_neobank_billing` fires:

1. **Reviewer sees:** the customer's claimed institution, the card's issuing bank name (from BIN lookup), the matched fintech label, and the customer's order history.
2. **Decision tree:**
   - **Customer is at a known university / government lab / large pharma:** the fintech billing is anomalous. Reviewer contacts the customer: "Your payment method appears to be from [Mercury/Brex/etc.] rather than your institution's procurement system. Can you provide a purchase order, institutional P-card, or a letter from your procurement office confirming this is an authorized purchase?" If confirmed, clear with note. If not, escalate.
   - **Customer is at a small biotech / startup:** fintech billing is expected and common. Reviewer checks whether the company name on the fintech account matches the customer's claimed institution name. If match, clear. If mismatch, request explanation.
   - **Customer has no institutional affiliation (individual):** the fintech BIN is irrelevant (personal payment expected). No flag.
3. **Escalation path:** if the customer cannot explain the billing mismatch, escalate to biosecurity review. The fintech flag alone does not warrant denial; it is a soft signal that weights downstream review.

## flags_thrown

- `fintech_neobank_billing` — card BIN matches the internal fintech/neobank denylist AND customer claims institutional affiliation. **Action:** manual review per playbook above.
- `fintech_neobank_billing_prepaid` — card is both fintech-issued AND flagged as prepaid by BIN lookup. Higher severity. **Action:** manual review with elevated priority.
- `fintech_billing_name_mismatch` — the issuing bank's name (from BIN lookup) does not match any variant of the customer's claimed institution. **Action:** manual review.

## failure_modes_requiring_review

- **BIN sponsor churn.** Neobanks frequently change BIN sponsors (Mercury moved from Evolve Bank & Trust to Choice Financial Group; Brex has used multiple sponsors). The denylist can go stale within months. [best guess: major neobanks change BIN sponsors every 1–3 years; minor fintechs more frequently.]
- **Legitimate small institutions using Brex/Mercury.** Many real small biotechs, startups, and even some university spin-outs use Brex or Mercury as their primary business banking. The check will soft-flag these; the manual review playbook must handle this gracefully.
- **BIN lookup incompleteness.** Free BIN databases (binlist.net) do not cover all BINs; some fintech BINs may return null for `bank.name`. The denylist must work on raw BIN prefix matching in addition to issuer-name matching.
- **Virtual cards.** Some fintechs issue virtual card numbers from different BIN ranges than their physical cards. Denylist must cover both.
- **Corporate P-cards from fintech sponsors.** A legitimate institutional P-card might be issued by a bank that also sponsors a neobank (e.g., Evolve Bank & Trust issues cards for both Mercury and legitimate corporate programs). BIN-level matching may produce false positives at the sponsor level.
- **International fintechs.** Wise, Revolut, and N26 Business use non-US BIN sponsors whose names may not be in US-centric BIN databases.

## false_positive_qualitative

- **Real small biotechs that bank with Mercury/Brex.** This is the dominant false-positive case. The attacker stories (shell-company, cro-framing, cro-identity-rotation) use the exact same banks that legitimate startups use. The check cannot distinguish a real 5-person biotech from a shell; it can only add friction.
- **University purchasing offices that issue cards through a fintech-adjacent sponsor.** Uncommon but possible for newer institutions.
- **International customers whose home-country bank happens to share a BIN range with a US neobank.** Unlikely but possible with 6-digit BIN matching; 8-digit matching reduces this risk.

## record_left

- BIN lookup result (issuer name, card type, prepaid flag, country) stored alongside the order record.
- Denylist match details (which BIN range matched, which fintech label was assigned).
- Reviewer's adjudication memo: whether the fintech billing was explained and cleared.
- Version of the internal denylist at the time of the check (so audits can reconstruct what was flagged).

## attacker_stories_addressed (refined)

- **shell-company:** directly targeted — the source file explicitly names Mercury/Brex as the standard LLC bank account rail. The check soft-flags exactly this pattern. However, the shell satisfies the billing-institution match by construction (the LLC bank account name matches the LLC name), so the flag fires only if the BIN is on the denylist, not because of a name mismatch.
- **shell-nonprofit:** directly targeted — source file names "fintechs (Mercury, Relay, Brex)" as the likely bank-account path and notes "1–3 denials are expected before a successful opening." The check catches the successful opening.
- **cro-framing, cro-identity-rotation, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation:** directly targeted — all use real LLC business bank accounts at fintechs. The check adds a friction layer: the customer must explain why a claimed research institution pays through Mercury/Brex rather than an institutional procurement system.
- **dormant-domain:** partially targeted — source file's Bypass B explicitly names "LLC + EIN + fintech business account (e.g., Mercury)" as the stricter-provider path. The check would flag this.
- **dormant-account-takeover, account-hijack, credential-compromise, inbox-compromise:** NOT targeted — these branches use inherited institutional billing or the attacker's own personal card. The check provides no signal against inherited institutional payment methods.
