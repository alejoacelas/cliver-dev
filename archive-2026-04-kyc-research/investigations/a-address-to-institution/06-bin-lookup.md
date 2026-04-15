# Investigation 06: BIN Lookup for Fintech Denylist Screening

**Date:** 2026-04-14
**API used:** [binlist.net](https://lookup.binlist.net/) (free, no auth, 5 req/hr rate limit)

## Concept

A BIN (Bank Identification Number) is the first 6 digits of a payment card. It identifies the issuing bank. In DNA synthesis screening, the idea is: if a customer claims affiliation with a research institution but pays with a card issued by a neobank (Mercury, Brex, Relay), that's a soft signal worth flagging. These neobanks are the standard banking rails for LLC-based entities, including both legitimate small biotechs and shell companies.

The denylist works by maintaining a list of BIN sponsor banks associated with fintech/neobank card programs and checking incoming payment card BINs against it.

## Live API Results

All queries made to `https://lookup.binlist.net/{BIN}` with header `Accept-Version: 3`.

### Query 1: Traditional Bank — JPMorgan Chase (428837)

```bash
curl -s -H "Accept-Version: 3" "https://lookup.binlist.net/428837"
```

```json
{
  "number": {},
  "scheme": "visa",
  "type": "credit",
  "brand": "Visa Purchasing",
  "country": {
    "numeric": "840",
    "alpha2": "US",
    "name": "United States of America (the)",
    "currency": "USD"
  },
  "bank": {
    "name": "Jpmorgan Chase Bank N.A. - Commercial"
  }
}
```

**Result:** Bank name is `Jpmorgan Chase Bank N.A. - Commercial`. This is a major traditional bank. **No fintech flag.**

---

### Query 2: Traditional Bank — Capital One (414709)

```bash
curl -s -H "Accept-Version: 3" "https://lookup.binlist.net/414709"
```

```json
{
  "number": {},
  "scheme": "visa",
  "type": "credit",
  "brand": "Visa Traditional",
  "country": {
    "numeric": "840",
    "alpha2": "US",
    "name": "United States of America (the)",
    "currency": "USD"
  },
  "bank": {
    "name": "Capital One, National Association"
  }
}
```

**Result:** Bank name is `Capital One, National Association`. Traditional bank. **No fintech flag.**

Note: This BIN (414709) is widely cited online as a Chase BIN, but binlist.net returns Capital One. BIN databases disagree with each other — this is a real operational problem (see "Maintenance" section below).

---

### Query 3: Mercury / Choice Financial Group (555665)

```bash
curl -s -H "Accept-Version: 3" "https://lookup.binlist.net/555665"
```

```json
{
  "number": null,
  "country": {},
  "bank": {}
}
```

**Result:** Empty response — binlist.net has no data for this BIN. This is a significant gap. Mercury cards are issued via sponsor banks (Choice Financial Group, Evolve Bank & Trust), and the BIN 555665 is discussed in fintech forums as Mercury-associated. But the free lookup API simply doesn't have it.

**This means the free API would fail to flag exactly the cards we care about most.**

---

### Query 4: Brex / Sutton Bank (485944)

```bash
curl -s -H "Accept-Version: 3" "https://lookup.binlist.net/485944"
```

```json
{
  "number": null,
  "country": {},
  "bank": {}
}
```

**Result:** Same problem — empty response. Brex cards are issued via Sutton Bank or Emigrant Bank, but the BIN isn't in binlist.net's database.

---

### Query 5: Citibank / Costco co-brand (410039)

```bash
curl -s -H "Accept-Version: 3" "https://lookup.binlist.net/410039"
```

```json
{
  "number": {},
  "scheme": "visa",
  "type": "credit",
  "brand": "Visa Traditional",
  "country": {
    "numeric": "840",
    "alpha2": "US",
    "name": "United States of America (the)",
    "currency": "USD"
  },
  "bank": {
    "name": "Citibank, N.A.- Costco"
  }
}
```

**Result:** Citibank co-brand card. Traditional bank. **No fintech flag.** Included as a control query.

---

## Worked Examples

### Example A — Traditional Bank Card (No Flag)

> A postdoc at MIT places a 2,000 bp gene synthesis order. They pay with a JPMorgan Chase Visa.
>
> BIN `428837` -> lookup returns `Jpmorgan Chase Bank N.A. - Commercial`.
>
> Chase is not on the fintech denylist. Order proceeds through normal KYC (institutional email verification, end-use questionnaire). No additional review triggered by payment method.

### Example B — Fintech Card on Institutional Order (Flag)

> A customer claiming affiliation with "Apex Genomics LLC" orders a gene construct containing a regulated sequence. They pay with a Mercury debit card.
>
> BIN lookup returns `Choice Financial Group` or `Evolve Bank & Trust` (Mercury's sponsor banks).
>
> The fintech denylist fires. This doesn't block the order — it routes it to human review. The reviewer checks:
> - Does "Apex Genomics LLC" have a real web presence, publications, or lab address?
> - Is the LLC registered recently? (Shell entities are often <6 months old.)
> - Does the shipping address match a coworking space, residential address, or actual lab?
> - Can the customer provide an IBC approval letter or PI name?
>
> If Apex Genomics turns out to be a real two-person startup with a Mercury account (extremely common), the order proceeds. If it's a mailbox address with no verifiable lab, it gets escalated.

## The Critical Finding: Free BIN APIs Don't Cover Fintech

The most important result from this investigation is that **binlist.net returned empty data for the exact BINs we need to screen**. Both the Mercury-associated BIN (555665) and the Brex-associated BIN (485944) came back with `"bank": {}`.

This makes sense: binlist.net is a community-maintained free database. It has good coverage of major banks (Chase, Capital One, Citi) but poor coverage of newer fintech card programs issued through sponsor banks.

### What you'd actually need

| Approach | Coverage | Cost | Notes |
|---|---|---|---|
| **binlist.net** (free) | Major banks only | Free | Misses fintech BINs entirely, as demonstrated above |
| **Mastercard/Visa BIN tables** | Authoritative | Requires network membership | Payment processors get these; synthesis providers don't |
| **Commercial BIN APIs** (BINBase, bincheck.io, etc.) | Good | $50-500/mo | Much better fintech coverage; this is what you'd actually use |
| **Payment processor metadata** | Best | Built into Stripe/Adyen | Stripe already knows the issuing bank for every charge; use their metadata |

**The practical answer:** If you use Stripe, you already have BIN-level data on every charge via the `card.issuer` field on the Charge object. You don't need an external BIN lookup at all. The denylist logic should live in your payment processing pipeline, not as a separate API call.

## Denylist Maintenance

### The sponsor bank problem

Fintech companies don't issue cards directly. They use sponsor banks:

| Fintech | Known Sponsor Banks |
|---|---|
| Mercury | Choice Financial Group, Evolve Bank & Trust |
| Brex | Sutton Bank, Emigrant Bank |
| Relay | Thread Bank (formerly Stride Bank) |
| Ramp | Sutton Bank |
| Divvy/BILL | Cross River Bank |

The denylist targets the **sponsor bank names**, not the fintech brand names. A BIN lookup will never return "Mercury" — it returns "Choice Financial Group."

### How often does this change?

- **BIN ranges rotate:** Networks reassign BIN ranges periodically. A BIN that maps to Sutton Bank today might not in 18 months.
- **Sponsor bank switches:** Mercury moved from Evolve Bank & Trust to Choice Financial Group for some card programs in 2023. When a fintech switches sponsors, your denylist needs updating.
- **New fintechs appear:** The neobank landscape keeps expanding. A new fintech card program using a new sponsor bank won't be caught until you add it.
- **Realistic maintenance cadence:** Quarterly review of sponsor bank relationships, plus event-driven updates when major switches are announced (these are typically reported in fintech press).

### Keeping the list current

1. Monitor fintech press (e.g., The Information, Fintech Business Weekly) for sponsor bank changes.
2. Maintain test cards from each fintech of interest; periodically run BIN lookups to verify the mapping hasn't changed.
3. Subscribe to a commercial BIN database that updates monthly.
4. If using Stripe: monitor the `card.issuer` values appearing on flagged orders and add new sponsor bank strings as they appear.

## Signal-to-Noise Problem

This is the fundamental weakness of the fintech denylist approach:

- **Mercury alone has 300,000+ business customers** as of 2025, most of them legitimate startups and small businesses.
- Many real biotech startups use Mercury, Brex, or Relay as their primary banking. A two-person synthetic biology startup operating out of a shared lab is exactly the kind of entity that would use Mercury AND place legitimate synthesis orders.
- **The false positive rate will be high.** The fintech flag is a soft signal, not a hard block. It must be combined with other signals to be useful:
  - Institutional email domain vs. generic email
  - Shipping to a known research address vs. residential/coworking
  - Customer has prior order history vs. first-time customer
  - Sequence content (regulated vs. benign)
  - LLC age and web presence

**The denylist is a feature in a scoring system, not a standalone screen.** By itself, it would flag thousands of legitimate orders from real small biotechs. Its value is as one weighted input among many, where the combination of fintech card + no institutional email + new LLC + residential shipping address + regulated sequence collectively triggers review.

## Summary

| What we tested | What we found |
|---|---|
| Free BIN API (binlist.net) coverage | Good for major banks, **empty for fintech BINs** |
| Chase BIN (428837) | Returns `Jpmorgan Chase Bank N.A.` — works as expected |
| Mercury BIN (555665) | **Empty response** — free API doesn't have it |
| Brex BIN (485944) | **Empty response** — free API doesn't have it |
| BIN database accuracy | 414709 widely cited as Chase, returned as Capital One. Databases disagree. |

**Bottom line:** The BIN denylist concept is sound as one signal in a multi-factor scoring system. But implementation requires either a commercial BIN database or (better) leveraging your payment processor's built-in issuer metadata. Free APIs like binlist.net don't cover the fintech BINs that are the whole point of the screen.
