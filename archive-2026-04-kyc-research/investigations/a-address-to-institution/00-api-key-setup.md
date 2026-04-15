# API Key Setup for KYC Tool Testing

## Progress

- [ ] Companies House
- [ ] GeoNames
- [ ] Smarty
- [ ] Stripe (test mode)
- [ ] Plaid (sandbox)
- [ ] BinDB (optional)

Once obtained, add all keys to `~/.config/credentials/.env` and source them into your project `.env`.

---

## 1. Companies House API

**What:** Query the UK company registry (officers, filing history, registered addresses).

**Signup:** https://developer.company-information.service.gov.uk/

**Steps:**
1. Register an account (email verification required).
2. Go to "Manage Applications" > "Add new application".
3. Create a REST API key (not streaming).
4. Copy the API key from the application details page.

**Free tier:** Unlimited (600 requests per 5 minutes rate limit).
**Signup time:** Instant.
**Env var:** `COMPANIES_HOUSE_API_KEY`

**Auth method:** HTTP Basic Auth with the API key as username and empty password.

---

## 2. GeoNames

**What:** Geographic database — reverse geocoding, postal code lookups, place hierarchy.

**Signup:** https://www.geonames.org/login

**Steps:**
1. Create a free account at the signup page.
2. Confirm your email.
3. Go to your account page: https://www.geonames.org/manageaccount
4. **Enable free web services** (checkbox near the bottom — easy to miss).

**Free tier:** 20,000 credits/day (~20,000 simple lookups; some endpoints cost more than 1 credit).
**Signup time:** Instant.
**Env var:** `GEONAMES_USERNAME`

**Auth method:** Pass `username=<your-username>` as a query parameter. No API key — the username *is* the key.

---

## 3. Smarty (SmartyStreets)

**What:** US + international address verification with USPS DPV data and residential/commercial classification.

**Signup:** https://www.smarty.com/

**Steps:**
1. Click "Try it Free" / "Create Account".
2. Register (no credit card required for free tier).
3. Go to API Keys in the dashboard.
4. Create a new secret key pair — you'll get an **Auth ID** and an **Auth Token**.

**Free tier:** 250 lookups/month (US street address API).
**Signup time:** Instant.
**Env vars:**
- `SMARTY_AUTH_ID`
- `SMARTY_AUTH_TOKEN`

---

## 4. Stripe (Test Mode)

**What:** Payment processing — we need test-mode keys to inspect AVS (Address Verification System) response format.

**Signup:** https://dashboard.stripe.com/register

**Steps:**
1. Create an account (email + password).
2. You land in **test mode** by default (toggle in top-right says "Test mode").
3. Go to Developers > API keys.
4. Copy the **test** publishable key (`pk_test_...`) and secret key (`sk_test_...`).

**Free tier:** Test mode is completely free, no credit card needed, no volume limits.
**Signup time:** Instant.
**Env vars:**
- `STRIPE_TEST_PK`
- `STRIPE_TEST_SK`

**Note:** Test-mode AVS returns deterministic test values based on the address you submit, not real issuer responses. See [Stripe AVS testing docs](https://docs.stripe.com/testing#avs-and-cvc) for the test address patterns.

---

## 5. Plaid (Sandbox)

**What:** Bank account verification — we need sandbox keys for Identity Match testing.

**Signup:** https://dashboard.plaid.com/signup

**Steps:**
1. Create a developer account.
2. Complete the short onboarding form (company name, use case — can use placeholder values).
3. Go to Team Settings > Keys in the dashboard.
4. Copy the **client_id** and **sandbox secret**.

**Free tier:** Sandbox is free with unlimited calls. Development environment (real banks) requires approval.
**Signup time:** Instant for sandbox. Production access takes days/weeks (not needed for testing).
**Env vars:**
- `PLAID_CLIENT_ID`
- `PLAID_SECRET` (sandbox secret)
- `PLAID_ENV=sandbox`

---

## 6. BinDB (Optional)

**What:** Commercial BIN (Bank Identification Number) database — better coverage and data quality than the free binlist.net.

**Signup:** https://www.bindb.com/

**Steps:**
1. Register for an account.
2. Choose the free plan.
3. API key is available in your account dashboard after registration.

**Free tier:** Limited lookups (check current limits on their pricing page — free tier exists but limits vary).
**Signup time:** Instant.
**Env var:** `BINDB_API_KEY`

**Note:** For initial prototyping, the free https://lookup.binlist.net API (no key needed) may be sufficient. BinDB is for when you need better coverage or additional fields.
