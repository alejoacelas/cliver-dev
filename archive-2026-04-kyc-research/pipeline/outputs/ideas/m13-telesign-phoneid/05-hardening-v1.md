# m13-telesign-phoneid — Bypass-aware hardening v1

- **measure:** M13 — phone-voip-check
- **name:** Telesign PhoneID + Score (line type, carrier, risk, recent SIM swap)
- **idea file:** `04-implementation-v1.md`
- **attacker mapping file:** `attackers/by-measure/measure-13-phone-voip-check.md`

---

## Story walk-throughs

### 1. inbox-compromise

**Summary:** Attacker compromises institutional inbox; fabricated supporting docs list VoIP callback; may use real PI's mobile on profile.

- **M9 Method 4 — attacker-controlled VoIP on fabricated letter.**
  - **CAUGHT** — if the VoIP number is submitted as (or checked alongside) the customer-profile phone, PhoneID returns `phone_type = NON-FIXED VOIP` (Google Voice, Skype, TextNow class). The SOP (step 4) flags `phone_nonfixed_voip` and routes to callback SOP.
  - However: the implementation scopes PhoneID to "every new customer" at the customer-profile phone. If the attacker enters the real PI's mobile on the profile and only uses VoIP on the fabricated letter, PhoneID never sees the VoIP number.
  - Classification: **CAUGHT** if the VoIP number is on the profile; **MISSED** if it is only on supporting documents.

- **Helpdesk SE with burner SIM / VoIP.**
  - **MISSED** — the burner/VoIP used for the helpdesk call is not submitted to PhoneID. PhoneID checks the customer-profile phone only.

- **Customer-profile phone: attacker enters real PI's mobile.**
  - **MISSED** — PI's real mobile returns `phone_type = MOBILE`, `risk_score < 400`, `sim_swap.risk_indicator ≤ 2`. All clear. PhoneID produces no signal.

- **Customer-profile phone: attacker enters own real mobile.**
  - **MISSED** — attacker's own real mobile returns `MOBILE`, low risk. No signal.

**Net assessment:** PhoneID catches VoIP numbers on the customer profile but not on supporting documents. The attacker's tradecraft (using a real mobile on the profile, VoIP only on side documents) defeats the check.

---

### 2. account-hijack

**Summary:** PI's account hijacked; SIM-swap variant.

- **SIM-swap on PI's mobile.**
  - **CAUGHT** — `sim_swap.risk_indicator ≥ 3`. Implementation step 7: freeze account, trigger rebind-cadence remediation.

- **No SIM-swap (session theft / AitM).**
  - **MISSED** — PI's mobile is unchanged. PhoneID returns clean results. The check fires at signup or on cadence; if the session was stolen mid-session, no PhoneID query is triggered.

**Net assessment:** Effective against SIM-swap. Ineffective against non-SIM-swap account takeover.

---

### 3. credential-compromise

**Summary:** Breached PII + SIM swap.

- **SIM swap.**
  - **CAUGHT** — same as account-hijack. `sim_swap.risk_indicator ≥ 3`.

- **No SIM swap; attacker enrolls VoIP for convenience.**
  - **CAUGHT** — if the attacker changes the profile phone to a VoIP number, PhoneID at re-enrollment returns `NON-FIXED VOIP`. Flag fires.
  - If the attacker enrolls a real mobile instead of VoIP: **MISSED** — real mobile passes.

**Net assessment:** Catches SIM-swap and VoIP enrollment. Misses the attacker who uses their own real mobile.

---

### 4. shell-nonprofit

**Summary:** Shell 501(c)(3); accomplice uses burner SIM.

- **Burner SIM (physical mobile).**
  - **MISSED** — PhoneID returns `phone_type = MOBILE`. Risk score depends on the carrier and number's history. A fresh prepaid SIM on a prepaid carrier (TracFone, Mint Mobile) might push the risk score up slightly, but the implementation says to only escalate at `risk_score ≥ 700`. Fresh prepaid numbers typically do not hit 700.
  - `sim_swap.risk_indicator ≤ 2` — no swap on a fresh SIM.
  - Classification: **MISSED** — physical prepaid SIM passes all PhoneID checks.

**Net assessment:** No friction from PhoneID against burner physical SIMs.

---

### Branches with no relevant engagement (from mapping file)

The remaining 15 branches commit real personal mobile numbers. PhoneID returns `MOBILE`, low risk, no swap. M13 has nothing to flag. These are not bypasses — they pre-empt the measure entirely.

---

## Findings

### Moderate-1: PhoneID scoped to customer-profile phone; supporting-document VoIP numbers unchecked

- **Severity:** Moderate
- **Source:** inbox-compromise (VoIP on fabricated letter, not on profile).
- **Why missed:** The implementation runs PhoneID on "every new customer" at the profile phone. VoIP numbers placed on IBC letters, sponsor letters, or other supporting documents are never submitted to PhoneID.
- **Suggestion:** Extend the implementation to also run PhoneID on any callback numbers extracted from supporting documents during the document-review step. This requires a document-parsing step that identifies phone numbers in uploaded documents and submits them to PhoneID. Alternatively, delegate this to the callback SOP, which already uses independent lookup rather than customer-supplied numbers.

### Moderate-2: Risk-score opacity limits reviewer ability to act on borderline cases

- **Severity:** Moderate
- **Source:** General (noted in failure_modes_requiring_review).
- **Why missed:** The Telesign risk score is a black box. The implementation says to never auto-deny on score alone but does not provide guidance on what score ranges correspond to what attacker profiles. A fresh prepaid number might score 300-500 (below the 700 threshold) even though it has risk-relevant characteristics.
- **Suggestion:** The implementation should lower the "flag for review" threshold (e.g., from 700 to 500 for SOC orders) and add carrier-name-based soft flags for known prepaid carriers. This would increase false positives but would catch the shell-nonprofit burner-SIM scenario more often. Trade-off should be documented.

### Minor-1: PhoneID and Twilio Lookup disagreement is listed as a signal but no resolution protocol

- **Severity:** Minor
- **Source:** Implementation step 6 ("PhoneID and Twilio Lookup disagree on line type → flag `phone_provider_disagreement`").
- **Why missed:** The implementation flags the disagreement but routes to callback SOP. The resolution protocol is adequate (callback is the right escalation). No gap, just noting this for completeness.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| inbox-compromise VoIP on profile | CAUGHT — `NON-FIXED VOIP` flagged |
| inbox-compromise VoIP on supporting docs only | MISSED — not scoped to supporting docs |
| inbox-compromise real PI mobile on profile | MISSED — MOBILE, low risk |
| inbox-compromise attacker's own mobile on profile | MISSED — MOBILE, low risk |
| account-hijack SIM-swap | CAUGHT — sim_swap risk_indicator ≥ 3 |
| account-hijack non-SIM-swap | MISSED — no signal |
| credential-compromise SIM swap | CAUGHT — sim_swap risk_indicator ≥ 3 |
| credential-compromise VoIP enrollment | CAUGHT — NON-FIXED VOIP flagged |
| credential-compromise own real mobile | MISSED — MOBILE, low risk |
| shell-nonprofit burner SIM | MISSED — MOBILE, low risk |

## bypass_methods_uncovered

- VoIP numbers on supporting documents (scoped out)
- Attacker's own real mobile on profile (structurally invisible)
- Non-SIM-swap account takeover (no phone-layer signal)
- Fresh prepaid burner SIMs (below risk-score threshold)

---

## Verdict: **PASS**

No Critical findings. The two Moderate findings are: (1) scope limitation to customer-profile phone (supporting-document VoIP unchecked), addressed by callback SOP; (2) risk-score opacity for prepaid/borderline numbers, with a concrete threshold-tuning suggestion. PhoneID is effective at its design intent (line-type classification + SIM-swap detection on the profile phone). Pipeline continues to stage 6.
