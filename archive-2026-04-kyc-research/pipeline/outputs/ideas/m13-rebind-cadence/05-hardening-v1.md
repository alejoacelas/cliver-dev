# m13-rebind-cadence — Bypass-aware hardening v1

- **measure:** M13 — phone-voip-check (extended: re-verification cadence + SIM-swap monitoring)
- **name:** Phone re-verification cadence + SIM-swap monitoring
- **idea file:** `04-implementation-v1.md`
- **attacker mapping file:** `attackers/by-measure/measure-13-phone-voip-check.md`

---

## Story walk-throughs

### 1. inbox-compromise

**Summary:** Attacker compromises institutional inbox; uses VoIP on supporting documents; may enter real PI's mobile on customer profile.

- **Attacker-controlled VoIP on fabricated letter (M9 Method 4).**
  - **MISSED** — the re-verification cadence checks the phone *on the customer profile*, not phone numbers on supporting documents. If the attacker enters the real PI's mobile as the profile phone, the cadence re-verification sends an SMS to the PI's real mobile. The PI would receive an unexpected verification code. This might alert the PI, but the SIM-swap check on the PI's mobile would return `risk_indicator ≤ 2` (no recent swap), so the system would treat the phone as valid.
  - The VoIP number on the fabricated letter is never checked by this system.
  - Classification: **MISSED** — the check is scoped to the customer-profile phone, not supporting-document contact numbers.

- **Helpdesk SE with burner SIM / VoIP.**
  - **MISSED** — same scope issue. The burner/VoIP used for the helpdesk call is not the customer-profile phone.

- **Customer-profile phone: attacker enters real PI's mobile.**
  - **AMBIGUOUS** — the cadence re-verification sends an SMS code to the PI's real mobile. The attacker does not receive it. Two scenarios:
    - If the attacker has SIM-swapped the PI's number: the attacker receives the code, but `sim_swap.risk_indicator ≥ 3` triggers a freeze. **CAUGHT**.
    - If the attacker has *not* SIM-swapped (just controls the inbox): the attacker cannot receive the SMS code. `rebind_failed` fires. But the *real PI* receives an unexpected code and may ignore it. The order is held pending verification. **CAUGHT** indirectly — the attacker cannot complete the re-verification.
  - If the attacker enters their *own* mobile instead: the line-type check (Twilio/Telesign) would evaluate it, but the re-bind cadence would accept it if it's a real mobile with no recent swap. **MISSED** — the cadence check validates the attacker's own real mobile.

**Net assessment:** The re-bind cadence catches the SIM-swap variant and creates friction when the attacker uses the PI's real number (attacker can't receive the code). But it misses the VoIP-on-documents scenario entirely and accepts the attacker's own real mobile.

---

### 2. account-hijack

**Summary:** PI's account hijacked; SIM-swap variant redirects PI's mobile.

- **SIM-swap to receive MFA codes.**
  - **CAUGHT** — this is the design-intent case. The cadence re-verification triggers (as a high-risk event: MFA change, account recovery). The SIM-swap lookup returns `risk_indicator ≥ 3`. The account is frozen. The SOP (step 3) routes to callback SOP for manual confirmation.

- **SIM-swap NOT performed (attacker uses MFA bypass like AitM token replay).**
  - **MISSED** — if the attacker bypasses MFA without SIM-swapping (e.g., session token theft, AitM kit), the PI's mobile is unchanged. No SIM swap is detected. The cadence re-verification would send a code to the PI's real mobile, which the attacker does not receive — but the attacker doesn't need to complete re-verification because they're already authenticated via the stolen session.
  - Classification: **AMBIGUOUS** — depends on whether the provider requires re-verification at order time (high-risk event trigger) in addition to session authentication. If the re-verification is mandatory on every high-risk event, the attacker who cannot receive the SMS code is blocked. If it only triggers on cadence expiry or MFA changes, the attacker may place orders within the current session without triggering re-verification.

**Net assessment:** Highly effective against SIM-swap. Effectiveness against non-SIM-swap account takeover depends on whether re-verification is triggered at order time.

---

### 3. credential-compromise

**Summary:** Breached PII + SIM swap to take over account.

- **Breached PII + SIM swap.**
  - **CAUGHT** — same as account-hijack SIM-swap. The SIM-swap lookup detects the swap. Account frozen.

- **Breached PII without SIM swap (attacker enrolls fresh VoIP for convenience).**
  - **CAUGHT** — if the attacker changes the phone on file to a VoIP number, the line-type check at re-enrollment time (via Twilio/Telesign) would flag it. Additionally, the phone-change itself is a high-risk event that triggers re-verification on the *old* number, which the attacker cannot complete (the old number is the victim's real mobile).
  - Classification: **CAUGHT** — multiple layers catch this.

**Net assessment:** Effective against both SIM-swap and phone-change paths.

---

### 4. shell-nonprofit

**Summary:** Shell 501(c)(3); accomplice uses burner SIM for MFA.

- **Burner SIM (physical mobile, not VoIP).**
  - **MISSED** — the burner SIM is a real physical mobile. Line-type check returns `mobile`. SIM-swap check returns `risk_indicator ≤ 2` (no recent swap on a new SIM — the SIM was never swapped, it's a fresh prepaid). The cadence re-verification sends a code to the burner, and the accomplice enters it.
  - The implementation's SOP handles this: "SMS verified + risk_indicator ≤ 2 → update phone_last_verified_at; release." The burner SIM passes all checks.
  - Classification: **MISSED** — the check cannot distinguish a legitimate mobile from a fresh prepaid burner SIM.

**Net assessment:** No friction. Burner physical SIMs are invisible to this check. The mapping file notes this: "Burner SIMs used here are physical mobile SIMs, not VoIP — M13 would not flag."

---

### Additional context from mapping file

The mapping file's net assessment: "Only inbox-compromise contains a directly-applicable VoIP bypass method... M13 as scoped (customer profile phone) addresses a tiny fraction of corpus tradecraft." The remaining 15 branches use real mobile numbers and pre-empt M13 entirely.

---

## Findings

### Moderate-1: Re-verification cadence does not cover phone numbers on supporting documents

- **Severity:** Moderate
- **Source:** inbox-compromise (VoIP on fabricated letter).
- **Why missed:** The cadence system checks and re-verifies the customer-profile phone. Attacker-controlled VoIP numbers placed on supporting documents (IBC letters, sponsor letters) are never submitted to the re-verification system.
- **Suggestion:** This is a scope limitation of M13 as defined (customer profile phone). Extending M13 to cover supporting-document callback numbers would require a different implementation — essentially the m13-callback-sop. The two ideas are complementary: rebind-cadence covers the profile phone; callback-SOP covers supporting-document contact verification.

### Moderate-2: Non-SIM-swap account takeover may not trigger re-verification

- **Severity:** Moderate
- **Source:** account-hijack (AitM/session-theft variant).
- **Why missed:** The implementation specifies re-verification triggers as: cadence expiry, MFA reset, billing-address change, first SOC order. An attacker who steals a session token and places an order within the same session may not trigger any of these events, especially if the cadence has not expired and the order is not SOC.
- **Suggestion:** Add "any new order after a login from a new device/IP" to the high-risk event trigger list. This requires integration with the provider's authentication system to detect novel session origins.

### Minor-1: Fresh prepaid burner SIMs are invisible to SIM-swap detection

- **Severity:** Minor
- **Source:** shell-nonprofit (burner SIM).
- **Why missed:** The SIM-swap signal detects *swaps on existing numbers*, not *fresh prepaid numbers that were never swapped*. A fresh burner SIM has no swap history and returns a clean `risk_indicator`. This is a known limitation of SIM-swap detection; it only catches the specific attack pattern of redirecting an existing number.
- **Suggestion:** This is structural. Complementary controls: line-type check flags VoIP (but not physical burner SIMs); carrier-name enrichment from Telesign/Twilio could flag prepaid carriers (e.g., TracFone, Straight Talk) as a soft signal, but many legitimate customers use prepaid. Not addressable within the SIM-swap detection paradigm.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| inbox-compromise VoIP on fabricated letter | MISSED — not scoped to supporting docs |
| inbox-compromise helpdesk SE burner/VoIP | MISSED — not scoped to helpdesk calls |
| inbox-compromise real PI's mobile on profile (no swap) | AMBIGUOUS — attacker can't receive code but PI gets unexpected SMS |
| inbox-compromise attacker's own mobile on profile | MISSED — real mobile passes all checks |
| account-hijack SIM-swap | CAUGHT — sim_swap.risk_indicator ≥ 3 |
| account-hijack non-SIM-swap session theft | AMBIGUOUS — depends on trigger list |
| credential-compromise SIM swap | CAUGHT — sim_swap.risk_indicator ≥ 3 |
| credential-compromise VoIP enrollment | CAUGHT — phone change triggers re-verify on old number |
| shell-nonprofit burner SIM | MISSED — physical SIM invisible to swap detection |

## bypass_methods_uncovered

- VoIP numbers on supporting documents (scoped out of M13 profile-phone check)
- Non-SIM-swap account takeover via session theft (trigger gap)
- Fresh prepaid burner SIMs with no swap history (structural)
- Attacker's own real mobile substituted on profile (structurally invisible)

---

## Verdict: **PASS**

No Critical findings. The check is highly effective at its design-intent target (SIM-swap detection on the customer-profile phone). The Moderate findings reflect scope limitations (supporting-document phones, session-theft triggers) that are addressed by complementary ideas (callback SOP, authentication controls). The Minor finding about burner SIMs is structural and acknowledged in the attacker mapping. Pipeline continues to stage 6.
