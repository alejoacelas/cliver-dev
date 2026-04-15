# m13-twilio-lookup — Bypass-aware hardening v1

- **measure:** M13 — phone-voip-check
- **name:** Twilio Lookup v2 — Line Type Intelligence
- **idea file:** `04-implementation-v1.md`
- **attacker mapping file:** `attackers/by-measure/measure-13-phone-voip-check.md`

---

## Story walk-throughs

### 1. inbox-compromise

**Summary:** Attacker compromises institutional inbox; VoIP on supporting documents; may enter real PI's mobile or own mobile on profile.

- **M9 Method 4 — attacker-controlled VoIP on fabricated letter.**
  - **CAUGHT** if the VoIP number is submitted as the customer-profile phone: Twilio returns `type = nonFixedVoip`. SOP step 4 flags `phone_nonfixed_voip` and routes to callback SOP.
  - **MISSED** if the VoIP number is only on supporting documents and the attacker enters a real mobile on the profile. Twilio Lookup checks only the profile phone.
  - Classification: **CAUGHT** on profile; **MISSED** on supporting docs.

- **Helpdesk SE with burner SIM / VoIP.**
  - **MISSED** — not submitted to Twilio Lookup.

- **Customer-profile phone: real PI's mobile.**
  - **MISSED** — returns `type = mobile`. No flag.

- **Customer-profile phone: attacker's own real mobile.**
  - **MISSED** — returns `type = mobile`. No flag.

**Net assessment:** Catches VoIP on the profile phone. Does not reach supporting-document numbers or real mobiles.

---

### 2. account-hijack

**Summary:** PI's account hijacked; SIM-swap variant.

- **SIM-swap on PI's mobile.**
  - **MISSED** — Twilio Lookup v2 Line Type Intelligence does not include SIM-swap detection. It returns the line type (`mobile`) and carrier, but not swap history. The PI's number remains `mobile` after a SIM swap. Only the carrier name might change if the number was ported to a different carrier, and even then, Twilio's classification lag may delay the update.
  - Note: the implementation document mentions pairing with Telesign for "disagreement-resolution" but does not specify that Twilio itself detects SIM swaps.
  - Classification: **MISSED** — Twilio Lookup does not detect SIM swaps.

- **No SIM-swap (session theft).**
  - **MISSED** — PI's phone unchanged. `type = mobile`.

**Net assessment:** No signal against account-hijack. SIM-swap detection requires Telesign (m13-telesign-phoneid) or the rebind-cadence check.

---

### 3. credential-compromise

**Summary:** Breached PII + SIM swap or VoIP enrollment.

- **SIM swap.**
  - **MISSED** — same as account-hijack. Twilio does not detect SIM swaps.

- **Attacker enrolls VoIP for convenience.**
  - **CAUGHT** — if the attacker changes the profile phone to a VoIP number, Twilio returns `nonFixedVoip`. Flag fires.

- **Attacker enrolls own real mobile.**
  - **MISSED** — `type = mobile`. No signal.

**Net assessment:** Catches VoIP enrollment but not SIM swaps or real-mobile substitution.

---

### 4. shell-nonprofit

**Summary:** Shell 501(c)(3); accomplice uses burner SIM.

- **Burner SIM (physical mobile).**
  - **MISSED** — Twilio returns `type = mobile`. Carrier name might show a prepaid carrier (TracFone, Straight Talk), but the implementation SOP does not include carrier-name-based flagging for prepaid providers. The SOP's decision tree is based entirely on line type, not carrier characteristics.
  - Classification: **MISSED** — physical prepaid SIM classified as `mobile`.

**Net assessment:** No friction against burner physical SIMs.

---

### Branches with no relevant engagement

15 branches commit real personal mobile numbers. Twilio returns `mobile`. No signal. Pre-empted.

---

## Findings

### Moderate-1: Twilio Lookup does not detect SIM swaps

- **Severity:** Moderate
- **Source:** account-hijack (SIM-swap), credential-compromise (SIM-swap).
- **Why missed:** Twilio Lookup v2 Line Type Intelligence returns line type and carrier but not SIM-swap history. The implementation's summary and SOP do not claim SIM-swap detection, but the `attacker_stories_addressed` field lists "credential-compromise (SIM-swap variant)" — which Twilio Lookup alone cannot address. The SIM-swap detection is provided by Telesign PhoneID (m13-telesign-phoneid) and the rebind-cadence check (m13-rebind-cadence).
- **Suggestion:** Clarify in `attacker_stories_addressed` that Twilio Lookup catches the *VoIP enrollment* aspect of credential-compromise, not the SIM-swap aspect. The SIM-swap claim should reference the pairing with Telesign rather than implying Twilio handles it.

### Moderate-2: Profile-phone scope; supporting-document VoIP unchecked

- **Severity:** Moderate
- **Source:** inbox-compromise (VoIP on fabricated letter).
- **Why missed:** Same as Telesign PhoneID — Twilio Lookup is run on the customer-profile phone, not on numbers extracted from supporting documents.
- **Suggestion:** Same as Telesign PhoneID: extend to supporting-document numbers, or delegate to callback SOP.

### Minor-1: No carrier-name flagging for prepaid providers

- **Severity:** Minor
- **Source:** shell-nonprofit (burner SIM on prepaid carrier).
- **Why missed:** The SOP's decision tree routes only on line type (`mobile`, `fixedVoip`, `nonFixedVoip`, etc.). Twilio Lookup returns `carrier_name`, which could distinguish prepaid carriers (TracFone, Straight Talk, Mint Mobile) from postpaid carriers (Verizon, AT&T, T-Mobile). The SOP does not use this signal.
- **Suggestion:** Add an optional soft-flag for carrier names associated with prepaid/MVNO providers, especially on SOC orders. This would increase false positives (many legitimate customers use prepaid) but would add a layer of signal against burner SIMs. The carrier-name list would need maintenance.

### Minor-2: Legitimate institutional VoIP (fixedVoip) handling is correct

- **Severity:** Minor (positive note)
- **Source:** General.
- **Assessment:** The implementation correctly treats `fixedVoip` as a soft positive (corporate PBX, common at universities) and only flags `nonFixedVoip`. This avoids false positives on legitimate institutional phone systems.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| inbox-compromise VoIP on profile | CAUGHT — `nonFixedVoip` flagged |
| inbox-compromise VoIP on supporting docs only | MISSED — not scoped to supporting docs |
| inbox-compromise real PI mobile on profile | MISSED — `mobile`, no flag |
| inbox-compromise attacker's own mobile on profile | MISSED — `mobile`, no flag |
| account-hijack SIM-swap | MISSED — Twilio does not detect SIM swaps |
| account-hijack non-SIM-swap | MISSED — no signal |
| credential-compromise SIM swap | MISSED — Twilio does not detect SIM swaps |
| credential-compromise VoIP enrollment | CAUGHT — `nonFixedVoip` flagged |
| credential-compromise own real mobile | MISSED — `mobile`, no flag |
| shell-nonprofit burner SIM | MISSED — `mobile`, no flag |

## bypass_methods_uncovered

- SIM swaps (not detectable by Twilio Lookup; requires Telesign or CAMARA)
- VoIP numbers on supporting documents (scoped out)
- Attacker's own real mobile on profile (structurally invisible)
- Fresh prepaid burner SIMs on prepaid carriers (classified as `mobile`)

---

## Verdict: **PASS**

No Critical findings. Twilio Lookup is correctly positioned as the cheapest, simplest first-line VoIP detection check. The two Moderate findings are: (1) no SIM-swap detection (delegated to Telesign/rebind-cadence); (2) profile-phone scope limitation (delegated to callback SOP). Both are addressed by complementary M13 ideas. The Minor findings suggest refinements (carrier-name flagging, attacker_stories_addressed clarification) that would improve documentation accuracy. Pipeline continues to stage 6.
