# Plaid Identity Match -- Sandbox Test

**Date:** 2026-04-14
**Purpose:** Verify that Plaid Identity Match can confirm a bank account holder's identity matches a customer's claimed identity. This is the M12 billing-institution check for ACH (non-card) payments, where AVS is unavailable.

---

## How It Works

Plaid Identity Match compares a customer-provided identity (name, address, email, phone) against the identity data held by their bank. The bank is the source of truth -- it knows who owns the account. Plaid returns per-field match scores from 0 to 100.

**Production flow:**
1. Customer authenticates with their bank via **Plaid Link** (embedded browser widget)
2. Plaid obtains the bank's identity data for the linked account
3. You call `/identity/match` with the customer's claimed identity
4. Plaid returns match scores -- you decide the threshold

---

## Step 1: Create Sandbox Public Token

The sandbox provides a shortcut (`/sandbox/public_token/create`) that bypasses the Plaid Link UI flow.

```bash
curl -s -X POST https://sandbox.plaid.com/sandbox/public_token/create \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "69dea9a3572b1c000db73d0f",
    "secret": "59c8357b1fcf707eb84c18514daaf5",
    "institution_id": "ins_109508",
    "initial_products": ["identity"],
    "options": {
      "override_username": "user_good",
      "override_password": "pass_good"
    }
  }'
```

**Response:**
```json
{
    "public_token": "public-sandbox-09a4e2c2-2ed8-4000-b648-7055ecc08732",
    "request_id": "bf68fdb8ba4706f"
}
```

`ins_109508` = **First Platypus Bank** (Plaid's sandbox institution).

---

## Step 2: Exchange Public Token for Access Token

```bash
curl -s -X POST https://sandbox.plaid.com/item/public_token/exchange \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "69dea9a3572b1c000db73d0f",
    "secret": "59c8357b1fcf707eb84c18514daaf5",
    "public_token": "public-sandbox-09a4e2c2-2ed8-4000-b648-7055ecc08732"
  }'
```

**Response:**
```json
{
    "access_token": "access-sandbox-d32a3f07-94f6-4641-b876-f25ad8d6f77c",
    "item_id": "4LWMKPn999sVvKZWMAzps4njmeLx5ntgNdbV6",
    "request_id": "b4c8e143478e691"
}
```

The `access_token` is what you use for all subsequent API calls on this linked account.

---

## Step 3: Get Identity Data (What the Bank Knows)

```bash
curl -s -X POST https://sandbox.plaid.com/identity/get \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "69dea9a3572b1c000db73d0f",
    "secret": "59c8357b1fcf707eb84c18514daaf5",
    "access_token": "access-sandbox-d32a3f07-94f6-4641-b876-f25ad8d6f77c"
  }'
```

**Response (trimmed to one account -- all accounts share the same owner):**
```json
{
    "account_id": "apqoMl6zzzIXGgWNyDMAC3bobrM8A5IZPgr6V",
    "mask": "0000",
    "name": "Plaid Checking",
    "type": "depository",
    "subtype": "checking",
    "owners": [
        {
            "names": ["Alberta Bobbeth Charleson"],
            "addresses": [
                {
                    "data": {
                        "street": "2992 Cameron Road",
                        "city": "Malakoff",
                        "region": "NY",
                        "postal_code": "14236",
                        "country": "US"
                    },
                    "primary": true
                },
                {
                    "data": {
                        "street": "2493 Leisure Lane",
                        "city": "San Matias",
                        "region": "CA",
                        "postal_code": "93405-2255",
                        "country": "US"
                    },
                    "primary": false
                }
            ],
            "emails": [
                {"data": "accountholder0@example.com", "primary": true, "type": "primary"},
                {"data": "accountholder1@example.com", "primary": false, "type": "secondary"}
            ],
            "phone_numbers": [
                {"data": "1112223333", "type": "home"},
                {"data": "1112224444", "type": "work"},
                {"data": "1112225555", "type": "mobile"}
            ]
        }
    ]
}
```

**The bank's source of truth for this account:**

| Field | Value |
|-------|-------|
| Name | Alberta Bobbeth Charleson |
| Primary address | 2992 Cameron Road, Malakoff, NY 14236 |
| Secondary address | 2493 Leisure Lane, San Matias, CA 93405-2255 |
| Primary email | accountholder0@example.com |
| Phone numbers | 1112223333, 1112224444, 1112225555 |

---

## Step 4: Identity Match -- Example A (Match)

Customer claims to be **Alberta Bobbeth Charleson** at the address on file. We pass the bank's own data back to verify.

```bash
curl -s -X POST https://sandbox.plaid.com/identity/match \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "69dea9a3572b1c000db73d0f",
    "secret": "59c8357b1fcf707eb84c18514daaf5",
    "access_token": "access-sandbox-d32a3f07-94f6-4641-b876-f25ad8d6f77c",
    "user": {
      "legal_name": "Alberta Bobbeth Charleson",
      "phone_number": "1112223333",
      "email_address": "accountholder0@example.com",
      "address": {
        "street": "2992 Cameron Road",
        "city": "Malakoff",
        "region": "NY",
        "postal_code": "14236",
        "country": "US"
      }
    }
  }'
```

**Response (trimmed to Plaid Checking account):**
```json
{
    "account_id": "apqoMl6zzzIXGgWNyDMAC3bobrM8A5IZPgr6V",
    "mask": "0000",
    "name": "Plaid Checking",
    "legal_name": {
        "score": 100,
        "is_first_name_or_last_name_match": true,
        "is_nickname_match": false,
        "is_business_name_detected": false
    },
    "address": {
        "score": 100,
        "is_postal_code_match": true
    },
    "email_address": {
        "score": 100
    },
    "phone_number": {
        "score": 100
    }
}
```

**Result: All scores = 100. Perfect match across all fields.**

| Field | Score | Details |
|-------|-------|---------|
| Legal name | **100** | First/last name match: true, Nickname match: false, Business name: false |
| Address | **100** | Postal code match: true |
| Email | **100** | -- |
| Phone | **100** | -- |

**Interpretation for M12:** ACH payment is consistent with the claimed identity. Auto-pass.

---

## Step 5: Identity Match -- Example B (Mismatch)

Customer claims to be **John Smith** at a completely different address, but the bank account belongs to Alberta Bobbeth Charleson.

```bash
curl -s -X POST https://sandbox.plaid.com/identity/match \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "69dea9a3572b1c000db73d0f",
    "secret": "59c8357b1fcf707eb84c18514daaf5",
    "access_token": "access-sandbox-d32a3f07-94f6-4641-b876-f25ad8d6f77c",
    "user": {
      "legal_name": "John Smith",
      "phone_number": "+14155551234",
      "email_address": "john.smith@gmail.com",
      "address": {
        "street": "123 Main Street",
        "city": "Anytown",
        "region": "CA",
        "postal_code": "90210",
        "country": "US"
      }
    }
  }'
```

**Response (trimmed to Plaid Checking account):**
```json
{
    "account_id": "apqoMl6zzzIXGgWNyDMAC3bobrM8A5IZPgr6V",
    "mask": "0000",
    "name": "Plaid Checking",
    "legal_name": {
        "score": 0,
        "is_first_name_or_last_name_match": false,
        "is_nickname_match": false,
        "is_business_name_detected": false
    },
    "address": {
        "score": 0,
        "is_postal_code_match": false
    },
    "email_address": {
        "score": 0
    },
    "phone_number": {
        "score": 0
    }
}
```

**Result: All scores = 0. Total mismatch across all fields.**

| Field | Score | Details |
|-------|-------|---------|
| Legal name | **0** | First/last name match: false, Nickname match: false, Business name: false |
| Address | **0** | Postal code match: false |
| Email | **0** | -- |
| Phone | **0** | -- |

**Interpretation for M12:** The person paying via ACH is not the customer who placed the order. Flag for review: possible third-party payment, possible fraud.

---

## Side-by-Side Comparison

| Field | Example A (Match) | Example B (Mismatch) |
|-------|-------------------|----------------------|
| Claimed name | Alberta Bobbeth Charleson | John Smith |
| Bank's name | Alberta Bobbeth Charleson | Alberta Bobbeth Charleson |
| **Name score** | **100** | **0** |
| Claimed address | 2992 Cameron Road, Malakoff, NY 14236 | 123 Main Street, Anytown, CA 90210 |
| Bank's address | 2992 Cameron Road, Malakoff, NY 14236 | 2992 Cameron Road, Malakoff, NY 14236 |
| **Address score** | **100** | **0** |
| **Email score** | **100** | **0** |
| **Phone score** | **100** | **0** |
| **Verdict** | Auto-pass | Flag for review |

---

## Response Structure Details

Each account in the response includes these match fields:

```
legal_name:
  score: 0-100          # fuzzy match score
  is_first_name_or_last_name_match: bool  # at least partial name match
  is_nickname_match: bool                  # e.g. "Bob" matching "Robert"
  is_business_name_detected: bool          # input looks like a business name

address:
  score: 0-100          # fuzzy match score
  is_postal_code_match: bool  # zip code matches even if street doesn't

email_address:
  score: 0-100          # exact or fuzzy match

phone_number:
  score: 0-100          # exact or fuzzy match
```

Note: The sandbox returns binary scores (0 or 100). In production, scores are continuous (e.g., a typo in the name might yield 85, a different street but same zip might yield 40).

---

## Decision Logic for M12

Proposed thresholds (tunable):

```
if name_score >= 70 AND address_score >= 50:
    # ACH payer matches claimed identity -> auto-pass
    pass

elif name_score < 50:
    # Name doesn't match at all -> flag
    # Possible third-party payment or fraud
    flag_for_review(reason="bank_account_holder_name_mismatch")

elif address_score < 30 AND is_postal_code_match == false:
    # Different address and zip -> flag
    flag_for_review(reason="bank_account_holder_address_mismatch")

else:
    # Partial match -> manual review
    queue_for_manual_review()
```

The `is_first_name_or_last_name_match` boolean is especially useful: if it's `true` but the full score is low, it might be a married name or middle name variation (less suspicious). If it's `false`, the names share nothing in common (more suspicious).

---

## Production Considerations

### Pricing

Identity Match is vendor-gated and usage-based:
- **Estimated cost:** ~$0.20-$1.00 per `/identity/match` call
- Plaid pricing requires a sales conversation; exact rates depend on volume commitment
- The `identity` product (step 3) is billed separately from `identity_match` (step 4), but Identity Match implicitly uses identity data
- In the sandbox response, `billed_products` shows both `["identity", "identity_match"]`

### Plaid Link Requirement (UX Friction)

In production, the customer must complete **Plaid Link** -- an embedded widget where they:
1. Select their bank
2. Log in with their bank credentials (or use OAuth for supported banks)
3. Consent to sharing identity data

This is the main friction point. The customer must actively cooperate. Plaid Link cannot run silently -- it's a user-facing authentication flow.

**For the M12 use case:** You would embed Plaid Link in the checkout flow for ACH payments. The customer connects their bank account (which you need anyway for ACH debit), and you get identity verification as a byproduct.

### Limitations

| Limitation | Impact |
|------------|--------|
| **US bank accounts only** | International customers paying via wire/ACH alternatives are not covered |
| **Customer must complete Plaid Link** | Requires active cooperation; cannot verify silently |
| **Not all banks support identity data** | Some smaller banks don't return identity info via Plaid |
| **Sandbox returns binary scores** | 0 or 100 only; production scores are continuous and more nuanced |
| **Business accounts** | `is_business_name_detected` flag helps, but matching business names to individual orderers is harder |
| **Joint accounts** | Bank may return multiple owners; a partial name match on a joint account is not necessarily suspicious |

### Integration Complexity

The full production integration requires:
1. **Plaid Link frontend** (JavaScript SDK, ~50 lines of code)
2. **Token exchange backend** (one API call)
3. **Identity Match backend** (one API call)
4. **Webhook handling** (optional but recommended for async identity data availability)

Total: moderate effort. The frontend Plaid Link widget is the most involved piece.

---

## Summary

Plaid Identity Match works cleanly for the M12 billing-institution check on ACH payments. The API is straightforward: you get per-field match scores (name, address, email, phone) comparing the customer's claimed identity against what their bank has on file. Perfect matches return 100, total mismatches return 0, and production gives continuous scores for fuzzy/partial matches.

The main trade-off is the **Plaid Link UX requirement** -- the customer must authenticate with their bank. For ACH payments where you already need bank account access, this is natural. For cases where you just want to silently verify an identity, this won't work.
