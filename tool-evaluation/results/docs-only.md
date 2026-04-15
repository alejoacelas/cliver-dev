# Docs-Only Group -- Documentation Review Results

**Reviewed:** 2026-04-14 | **Method:** Documentation research (no live API calls) | **KYC step:** (b) Payment -> Institution

## Why docs-only

Both endpoints require production infrastructure to test meaningfully:
- **Stripe AVS** requires real card charges against real cards. Test mode returns deterministic AVS results per token -- it cannot simulate real issuer behavior.
- **Plaid Identity Match** requires production credentials and real bank connections via Plaid Link. Sandbox returns binary 0/100 scores -- the continuous scoring curve only exists in production.

---

## Stripe AVS (production)

### What it does

When a card charge is processed, Stripe sends the customer-provided billing address to the card-issuing bank for verification. The issuer compares against its records and returns two per-field results:

| Field | Values | Available |
|---|---|---|
| `address_line1_check` | pass, fail, unavailable, unchecked, not_provided | After charge |
| `address_postal_code_check` | pass, fail, unavailable, unchecked, not_provided | After charge |
| `card.funding` | credit, debit, prepaid, unknown | Before charge |
| `card.country` | ISO alpha-2 code | Before charge |
| `outcome.risk_score` | 0-100 (Radar) | After charge |

### Geographic coverage

AVS was designed for US/UK/CA. That's where it works.

| Region | AVS support | Notes |
|---|---|---|
| US, UK, Canada | Strong | Most issuers return full AVS data |
| Australia, NZ, Ireland | Partial | Some issuers, postal code only |
| Continental Europe | Weak/null | Most issuers return "unavailable" |
| Asia, Africa, Latin America | Null | Issuers generally don't support AVS |

**Coverage estimate for a global synthesis provider:** 40-60% of card payments get usable AVS data (weighted by biotech customer geography, which skews heavily US/UK).

### Key limitations for KYC step (b)

1. **AVS pass does not prove institutional affiliation.** It proves the billing address is correct -- not that the address belongs to an institution. A researcher's personal card passes AVS against their home address.

2. **International coverage gap is severe.** For 40-60% of payments, AVS returns "unavailable" and provides no signal. Fallback to card.funding + card.country + billing-shipping consistency is required.

3. **Prepaid cards can pass AVS** against their activation address while being anonymous. `card.funding=prepaid` is the real detection signal, not AVS.

4. **P-cards create false positives.** University procurement cards have the finance department's address on file. AVS line1 fails on legitimate institutional purchases. The rate of this in practice is unknown without production data.

5. **Corporate virtual cards may flag as prepaid.** Cards issued by Ramp, Brex, Divvy may report `card.funding=prepaid`, falsely flagging legitimate institutional purchases. Unknown frequency without production testing.

### What matters most from Stripe

**`card.funding` is the highest-value field.** It works globally, is available before the charge, and provides a binary decision: prepaid = flag. AVS is supplementary -- useful when available, absent for much of the world.

### False positive/negative profile

- **False positives:** P-card billing mismatches, corporate virtual cards as prepaid, personal cards at home address (correct AVS but wrong institution).
- **False negatives:** Stolen card with known billing address passes AVS. Attacker who provides correct billing address is invisible to AVS.

---

## Plaid Identity Match (production)

### What it does

After a customer connects their bank account via Plaid Link, Identity Match compares customer-provided identity fields against what the bank has on file. Returns per-field scores (0-100):

| Field | Score range | Boolean flags | KYC value |
|---|---|---|---|
| `legal_name.score` | 0-100 | `is_nickname_match`, `is_first_name_or_last_name_match`, `is_business_name_detected` | **Primary signal** -- is the payer who they claim to be? |
| `address.score` | 0-100 | `is_postal_code_match` | Secondary -- bank address may be stale |
| `email_address.score` | 0-100 | -- | Weak -- personal vs. institutional email is normal |
| `phone_number.score` | 0-100 | -- | Weak -- bank phone records often stale |

### Score interpretation (from Plaid docs)

| Range | Name | Address | Email/Phone |
|---|---|---|---|
| 90-100 | Strong match | Strong match | Perfect match |
| 70-89 | Partial match | Partial match | Partial match |
| 50-69 | Unlikely | Weak | Mismatch |
| 0-49 | Mismatch | Mismatch | Mismatch |

**Recommended threshold:** 70+ (per Plaid documentation). "Do not require perfect 100 scores" -- formatting variations affect results.

### Geographic coverage

Initially documented as "US only" in the seed cases, but Plaid docs confirm broader availability:

| Region | Support | Notes |
|---|---|---|
| US | Full | Most use cases; ACH is US-only |
| Canada | Available | Requires Growth or Custom plan |
| Europe | Available | Via supported European banks |

The US-only limitation is less severe than it sounds: ACH is itself a US-only payment method. If a customer is paying via ACH, they have a US bank account.

### Bank coverage: the critical gap

Plaid documentation states **approximately 30% of micro-deposit and database-verified Items return identity data.** This means:

- Major banks (Chase, BofA, Wells Fargo, Citi): generally return identity data
- Smaller credit unions and community banks: often do not
- The check silently fails for ~70% of connected accounts -- no error, just no data

**For KYC step (b), this means Identity Match is a strong-when-available signal, not a reliable gate.** You cannot require it; you can only benefit from it when the data happens to be there.

### Key limitations for KYC step (b)

1. **UX friction from Plaid Link.** Customers must select their bank, enter credentials, and complete MFA during checkout. For DNA synthesis orders (already complex), this may cause checkout abandonment.

2. **~70% silent failure rate.** Most connected bank Items don't return identity data. The check looks like it's working but returns nothing.

3. **Stale bank data.** Addresses, emails, and phone numbers in bank records may be months or years old. A low address score may mean the customer moved, not that they're suspicious.

4. **Joint and business accounts.** Joint accounts have multiple holders -- partial name match may be the spouse. Departmental/university accounts have the institution's name, not the researcher's, triggering `is_business_name_detected` and producing a name mismatch.

5. **Sandbox is binary.** Cannot calibrate thresholds without production data. The continuous score distribution for edge cases (nicknames, middle names, apartment numbers) is invisible in sandbox.

### What matters most from Plaid

**`legal_name.score` is the highest-value field.** It directly answers the identity question. But the ~30% coverage rate means it's a supplementary signal, not a primary one.

---

## Combined assessment: KYC step (b) signal ranking

| Rank | Signal | Source | Reliability | Coverage | Notes |
|---|---|---|---|---|---|
| 1 | `card.funding` (prepaid detection) | Stripe | High | Global | Binary, works everywhere, available pre-charge |
| 2 | `legal_name.score` | Plaid | High (when available) | ~30% of US ACH | Best identity signal, but narrow coverage |
| 3 | Billing-shipping-institution consistency | Local logic + Smarty + ROR | Medium | US + international | No AVS dependency; uses entered address |
| 4 | AVS address match | Stripe | Medium (when available) | US/UK/CA (~40-60%) | Confirms address is real, not institutional |
| 5 | `address.score` | Plaid | Medium (when available) | ~30% of US ACH | Bank address may be stale |
| 6 | BIN/card country | Stripe + binlist | Low-medium | Global | Soft signal; many legitimate mismatches |

## Coverage gaps

### High severity

1. **International card payments (non-US/UK/CA):** AVS returns "unavailable." Plaid not applicable. Only signals: card.funding, card.country, billing-shipping consistency. Affects 40-60% of payments for a global provider.

2. **Wire transfers and non-card/non-ACH payments:** Neither Stripe AVS nor Plaid covers wire transfers. Only signal is originating bank name/country from SWIFT/BIC code.

### Medium severity

3. **ACH payments where bank doesn't return identity data:** Plaid silently fails for ~70% of connected accounts. Must fall back to other signals.

## What production testing would reveal

| Area | Impact | What we'd learn |
|---|---|---|
| AVS unavailable rate | Medium | Exact % by country/region. Direction is known; magnitude isn't. |
| Plaid score calibration | High | Continuous score distribution for edge cases. Cannot set thresholds without this. |
| P-card false positive rate | Medium | How often legitimate university purchases fail AVS. |
| Corporate virtual card funding type | Medium | Whether Ramp/Brex/Divvy cards flag as prepaid. |
| Plaid bank coverage rate | High | Whether the ~30% figure holds for biotech researchers specifically. |

## Bottom line

For KYC step (b), the documentation review confirms that **neither Stripe AVS nor Plaid Identity Match is individually sufficient.** The recommended architecture is:

1. **card.funding check** on every card payment (global, reliable, binary)
2. **Billing-shipping-institution address consistency** on every order (no issuer dependency)
3. **AVS** as a supplementary confirmation when available (US/UK/CA cards)
4. **Plaid Identity Match** as a supplementary confirmation when available (US ACH, ~30% of connected accounts)
5. **BIN/card country** as a weak tiebreaker signal

Production testing would refine thresholds and quantify coverage gaps, but would not change this architectural conclusion. The fundamental insight is that payment-to-institution verification must be a multi-signal cascade, not a single-endpoint check.
