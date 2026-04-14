# 08 — Stripe AVS, Card Funding Type, and Issuer Metadata

**Date:** 2026-04-14
**API:** Stripe Payments API (test mode)
**Purpose:** Demonstrate how Stripe's Address Verification System (AVS), card funding type detection, and card metadata can serve as KYC signals for DNA synthesis provider screening.

---

## Overview

When a customer pays by card, Stripe automatically performs AVS checks against the card issuer and returns metadata about the card itself. Three signals are useful for KYC:

1. **AVS checks** — Did the billing address the customer entered match what the card issuer has on file?
2. **Card funding type** — Is this a `credit`, `debit`, or `prepaid` card? Prepaid = possible anonymous gift card.
3. **Card country** — Which country issued the card? Cross-reference against the claimed institution's country.

All tests below use Stripe test mode. Charges are simulated (no real money moves).

---

## Test Setup

Stripe test mode blocks raw card numbers on accounts without PCI DSS access enabled. Instead, we use Stripe's **test tokens** (e.g., `tok_visa`, `tok_avsFail`), which map to specific test card numbers and produce deterministic AVS/CVC results.

**Flow for each test:**

```
1. Create PaymentMethod with test token + billing address
2. Create PaymentIntent with confirm=true
3. Retrieve the Charge to read payment_method_details.card.checks
```

**Base curl pattern:**

```bash
# Step 1: Create PaymentMethod
curl -s https://api.stripe.com/v1/payment_methods \
  -u "sk_test_...:" \
  -d "type=card" \
  -d "card[token]=tok_visa" \
  -d "billing_details[address][line1]=77 Massachusetts Ave" \
  -d "billing_details[address][city]=Cambridge" \
  -d "billing_details[address][state]=MA" \
  -d "billing_details[address][postal_code]=02139" \
  -d "billing_details[address][country]=US"

# Step 2: Create + confirm PaymentIntent
curl -s https://api.stripe.com/v1/payment_intents \
  -u "sk_test_...:" \
  -d "amount=10000" \
  -d "currency=usd" \
  -d "payment_method=pm_xxx" \
  -d "confirm=true" \
  -d "return_url=https://example.com"

# Step 3: Retrieve Charge (ID from payment_intent.latest_charge)
curl -s https://api.stripe.com/v1/charges/ch_xxx \
  -u "sk_test_...:"
```

---

## Test Results

### Scenario 1: AVS Full Pass (tok_visa)

**Token:** `tok_visa` (maps to 4242424242424242)
**Billing address:** 77 Massachusetts Ave, Cambridge, MA 02139, US

**Charge response — `payment_method_details.card`:**

```json
{
  "checks": {
    "address_line1_check": "pass",
    "address_postal_code_check": "pass",
    "cvc_check": "pass"
  },
  "funding": "credit",
  "brand": "visa",
  "country": "US",
  "last4": "4242"
}
```

**Outcome:**

```json
{
  "network_status": "approved_by_network",
  "risk_level": "normal",
  "risk_score": 26,
  "type": "authorized"
}
```

**KYC interpretation:** All checks pass. Card is a standard credit card issued in the US. No flags.

---

### Scenario 2a: AVS Address Line 1 Fail (tok_avsLine1Fail)

**Token:** `tok_avsLine1Fail` (maps to card ending 0028)
**Billing address:** 123 Main St, Boston, MA 02101, US

**Charge response — `payment_method_details.card.checks`:**

```json
{
  "checks": {
    "address_line1_check": "fail",
    "address_postal_code_check": "pass",
    "cvc_check": "pass"
  },
  "funding": "credit",
  "last4": "0028"
}
```

**KYC interpretation:** Street address mismatch, but zip code matches. Soft flag. Could mean:
- Customer typed the wrong street address
- Institutional procurement card (P-card) billed to a headquarters address, not the lab's address
- Genuinely mismatched — warrants follow-up

---

### Scenario 2b: AVS Postal Code Fail (tok_avsZipFail)

**Token:** `tok_avsZipFail` (maps to card ending 0036)
**Billing address:** 123 Main St, Boston, MA 02101, US

**Charge response — `payment_method_details.card.checks`:**

```json
{
  "checks": {
    "address_line1_check": "pass",
    "address_postal_code_check": "fail",
    "cvc_check": "pass"
  },
  "funding": "credit",
  "last4": "0036"
}
```

**KYC interpretation:** Zip code mismatch. This is the more concerning AVS failure pattern for address verification — the zip code is the stronger geographic signal. Soft flag, request confirmation.

---

### Scenario 2c: AVS Both Fail (tok_avsFail)

**Token:** `tok_avsFail` (maps to card ending 0010)
**Billing address:** 77 Massachusetts Ave, Cambridge, MA 02139, US

**Charge response — `payment_method_details.card.checks`:**

```json
{
  "checks": {
    "address_line1_check": "fail",
    "address_postal_code_check": "fail",
    "cvc_check": "pass"
  },
  "funding": "credit",
  "brand": "visa",
  "country": "US",
  "last4": "0010"
}
```

**KYC interpretation:** Complete address mismatch. Medium flag. The billing address on file with the issuer does not match what the customer entered at all. Could indicate:
- Using someone else's card
- Corporate card with centralized billing
- Deliberately evasive

---

### Scenario 2d: AVS Unavailable (tok_avsUnchecked)

**Token:** `tok_avsUnchecked` (maps to card ending 0044)
**Billing address:** 123 Main St, Boston, MA 02101, US

**Charge response — `payment_method_details.card.checks`:**

```json
{
  "checks": {
    "address_line1_check": "unavailable",
    "address_postal_code_check": "unavailable",
    "cvc_check": "pass"
  },
  "funding": "credit",
  "last4": "0044"
}
```

**KYC interpretation:** The card issuer does not support AVS or did not return a result. Common for international cards. This is not a failure, but it means we cannot use AVS as a verification signal and must rely on other methods.

---

### Scenario 3: CVC Fail (tok_cvcCheckFail)

**Token:** `tok_cvcCheckFail` (maps to card ending 0101)
**Billing address:** 77 Massachusetts Ave, Cambridge, MA 02139, US

**Charge response — `payment_method_details.card.checks`:**

```json
{
  "checks": {
    "address_line1_check": "pass",
    "address_postal_code_check": "pass",
    "cvc_check": "fail"
  },
  "funding": "credit",
  "brand": "visa",
  "country": "US",
  "last4": "0101"
}
```

**KYC interpretation:** CVC mismatch means the person may not physically have the card. Address checks still pass, so the billing address is correct. This is primarily a fraud signal rather than a KYC signal, but still worth noting.

---

### Scenario 4: Debit Card (tok_visa_debit)

**Token:** `tok_visa_debit` (maps to card ending 5556)
**Billing address:** 123 Test St, San Francisco, CA 94107, US

**PaymentMethod response — `card`:**

```json
{
  "brand": "visa",
  "funding": "debit",
  "country": "US",
  "last4": "5556"
}
```

**Charge response — `payment_method_details.card`:**

```json
{
  "checks": {
    "address_line1_check": "pass",
    "address_postal_code_check": "pass",
    "cvc_check": "pass"
  },
  "funding": "debit",
  "brand": "visa",
  "country": "US",
  "last4": "5556",
  "outcome": {
    "risk_level": "normal",
    "risk_score": 39
  }
}
```

**KYC interpretation:** Debit card — normal payment method. Linked to a bank account (not anonymous). No flags. Note risk_score is slightly higher than credit (39 vs 26) but still "normal."

---

### Scenario 5: Prepaid Card (tok_mastercard_prepaid)

**Token:** `tok_mastercard_prepaid` (maps to Mastercard ending 5100)
**Billing address:** PO Box 999, Anywhere, NY 10001, US

**PaymentMethod response — `card`:**

```json
{
  "brand": "mastercard",
  "funding": "prepaid",
  "country": "US",
  "last4": "5100"
}
```

**Charge response — `payment_method_details.card`:**

```json
{
  "checks": {
    "address_line1_check": "pass",
    "address_postal_code_check": "pass",
    "cvc_check": "pass"
  },
  "funding": "prepaid",
  "brand": "mastercard",
  "country": "US",
  "last4": "5100",
  "outcome": {
    "risk_level": "normal",
    "risk_score": 29
  }
}
```

**KYC interpretation:** **HARD FLAG.** `funding: prepaid` means this is a prepaid card — possibly a gift card, prepaid Visa/Mastercard, or cash-loaded card. These can be purchased anonymously at retail stores. For DNA synthesis KYC, prepaid cards should trigger manual review or outright rejection because:
- No verifiable identity tied to the card
- No bank account linkage
- AVS may pass (the address registered when activating the prepaid card) but it proves nothing about institutional affiliation

---

## Card Country Detection (International Tokens)

Stripe exposes `card.country` — the country where the card was issued (from BIN lookup). This is available immediately on the PaymentMethod, before any charge.

| Token | Brand | Country | Last4 | Funding |
|-------|-------|---------|-------|---------|
| `tok_visa` | visa | US | 4242 | credit |
| `tok_gb` | visa | GB | 0000 | credit |
| `tok_de` | visa | DE | 0016 | credit |
| `tok_br` | visa | BR | 0002 | credit |
| `tok_jp` | visa | JP | 0003 | credit |
| `tok_in` | visa | IN | 0008 | credit |

**KYC use:** Cross-reference `card.country` against the institution's country. A researcher at MIT paying with a card issued in a sanctioned country is a flag.

---

## Issuer / Bank Name

Stripe's standard API does **not** expose the issuing bank name in test mode or on the basic PaymentMethod/Charge objects. The fields returned are:

- `card.brand` — Visa, Mastercard, Amex, etc.
- `card.country` — Issuing country (from BIN)
- `card.funding` — credit, debit, prepaid
- `card.fingerprint` — Unique per-card identifier (stable across charges)
- `card.last4` — Last 4 digits
- `card.networks.available` — Payment networks the card supports

To get the **issuing bank name**, you need one of:
1. **Stripe Radar** (paid add-on) — Exposes `issuer` in its rules engine
2. **Stripe Issuing** (if you issue cards yourself) — Not applicable here
3. **Third-party BIN lookup** (see [06-bin-lookup.md](./06-bin-lookup.md)) — Feed the first 6-8 digits to a BIN database

For KYC purposes, `card.country` + `card.funding` + AVS checks cover most needs. Bank name is a nice-to-have for correlating with institutional P-cards.

---

## Summary: AVS Check Values

| Value | Meaning | KYC Action |
|-------|---------|------------|
| `pass` | Address/zip matches issuer records | No flag |
| `fail` | Address/zip does not match | Soft flag — investigate |
| `unavailable` | Issuer doesn't support AVS | Cannot use as signal |
| `unchecked` | Check not yet performed (pre-charge) | Normal — will resolve on charge |

## Summary: Card Funding Types

| Value | Meaning | KYC Action |
|-------|---------|------------|
| `credit` | Standard credit card | No flag — tied to a credit account |
| `debit` | Bank-linked debit card | No flag — tied to a bank account |
| `prepaid` | Prepaid/gift card | **Hard flag** — possibly anonymous |

---

## Worked Examples for KYC Pipeline

### Example A: Auto-Pass (MIT Researcher)

A researcher at MIT orders oligos. They pay with a Visa credit card and enter their lab's billing address.

```
card.funding:                  credit     --> OK
card.country:                  US         --> Matches institution country
address_line1_check:           pass       --> Billing address matches issuer
address_postal_code_check:     pass       --> Zip matches issuer
cvc_check:                     pass       --> Cardholder has the physical card
```

**Pipeline decision:** Auto-approve. All signals green. The billing address can be cross-referenced against MIT's known addresses (77 Massachusetts Ave, Cambridge, MA 02139) for additional confidence.

### Example B: AVS Mismatch Flag (P-Card or Typo)

Someone claims affiliation with Stanford but their billing zip doesn't match.

```
card.funding:                  credit     --> OK
card.country:                  US         --> OK
address_line1_check:           pass       --> Street matches
address_postal_code_check:     fail       --> Zip mismatch!
cvc_check:                     pass       --> Has the card
```

**Pipeline decision:** Soft flag. Possible explanations:
- Typo in zip code
- Institutional procurement card billed to a central finance office (different zip than the lab)
- Person is not where they claim to be

Action: Request the customer confirm their billing address. If they're using a university P-card, the zip may legitimately differ. Check if the provided address geocodes to the institution.

### Example C: Prepaid Card Block

An order comes in with a prepaid Mastercard. The customer claims to be at a biotech startup.

```
card.funding:                  prepaid    --> HARD FLAG
card.country:                  US         --> OK (but irrelevant for prepaid)
address_line1_check:           pass       --> Means nothing for prepaid
address_postal_code_check:     pass       --> Means nothing for prepaid
cvc_check:                     pass       --> Has the card (trivial for gift cards)
```

**Pipeline decision:** Hard flag / block. Prepaid cards provide zero identity assurance:
- Can be purchased with cash at any retailer
- Address "verification" only checks against the address used to register the card (which can be anything)
- No link to a bank account or credit history
- Commonly used to anonymize purchases

Action: Reject the payment method. Require credit card, debit card, ACH, or wire transfer. If the customer is legitimate, they can re-order with a traceable payment method.

### Example D: International Card from Unexpected Country

A customer claims to be at the University of Toronto (Canada) but pays with a card issued in a non-allied country.

```
card.funding:                  credit     --> OK
card.country:                  [flagged]  --> Does not match claimed institution country
address_line1_check:           unavailable --> AVS not supported by issuer
address_postal_code_check:     unavailable --> AVS not supported by issuer
cvc_check:                     pass       --> Has the card
```

**Pipeline decision:** Medium flag. Country mismatch + no AVS available. Could be:
- International student with a card from their home country (common, legitimate)
- Misrepresented affiliation

Action: Request additional verification (institutional email, purchase order, PI confirmation).

---

## Limitations

1. **Test mode is deterministic.** The AVS results above are hardcoded per test token. In production, AVS results depend on the actual card issuer's response, which varies by bank and country.

2. **AVS is US/UK/Canada-centric.** Many international issuers return `unavailable` for AVS checks. This is a major gap for verifying international customers.

3. **No issuer bank name in the standard API.** Stripe doesn't expose which bank issued the card. You need Radar or a third-party BIN lookup.

4. **Prepaid detection is reliable but not granular.** `funding: prepaid` catches gift cards, but also catches legitimate prepaid cards (e.g., corporate expense cards loaded by the company). Some corporate virtual cards may also show as `prepaid`.

5. **AVS pass does not prove institutional affiliation.** A personal credit card with a home address will pass AVS but tells you nothing about where the person works. AVS confirms the billing address is real, not that it belongs to an institution.

6. **$0 auth for metadata only.** If you only need the card metadata (funding type, country, AVS) without actually charging, you can create a `$0.50` PaymentIntent (Stripe minimum) and immediately refund, or use a SetupIntent which validates the card without charging.

---

## Integration Notes

**Relevant Stripe API fields for KYC pipeline:**

```
PaymentMethod.card.funding          --> "credit" | "debit" | "prepaid"
PaymentMethod.card.country          --> ISO 3166-1 alpha-2 (e.g., "US", "GB")
PaymentMethod.card.brand            --> "visa" | "mastercard" | "amex" | ...
PaymentMethod.card.last4            --> Last 4 digits
PaymentMethod.card.fingerprint      --> Stable card identifier

Charge.payment_method_details.card.checks.address_line1_check
Charge.payment_method_details.card.checks.address_postal_code_check
Charge.payment_method_details.card.checks.cvc_check
  --> "pass" | "fail" | "unavailable" | "unchecked"

Charge.outcome.risk_level           --> "normal" | "elevated" | "highest"
Charge.outcome.risk_score           --> 0-100 (Radar score)
```

**Available before charge (on PaymentMethod creation):**
- `card.funding`, `card.country`, `card.brand`, `card.last4`, `card.fingerprint`

**Only available after charge (on Charge object):**
- `card.checks.*` (AVS/CVC results)
- `outcome.*` (Radar risk assessment)
