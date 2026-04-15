# Measure 13 — Phone VoIP check

Measure: Detect whether the customer-provided phone number is VoIP (vs. mobile/landline). VoIP numbers correlate with fabricated/concealed identity.

Across the 19 attacker branches, almost no story relies on a VoIP number for the customer phone field — most branches commit a real attacker-controlled mobile number (because the rest of the branch uses real identity), so the VoIP check has no purchase. The branches below are the ones that meaningfully engage M13, either by (a) explicitly using a VoIP number in a verification-relevant field, or (b) substituting/seizing a phone in a way the VoIP detector might or might not catch.

---

## 1. inbox-compromise — fake-affiliation, Branch B

- **Profile:** fake-affiliation
- **Target:** Compromise an institutional inbox at a real research org and place orders that look like they come from a legitimate PI/lab, using fabricated supporting documents whose contact-back numbers route to attacker-controlled VoIP.
- **Bypass excerpts (verbatim):**
  - M9 Method 4: "Place an attacker-controlled VoIP number as the contact on a fabricated letter. Expertise: Novice. Cost: $1–$20. Lead-up time: Minutes. Attacker trace: VoIP number on file; vendors retain call logs and registration metadata subject to subpoena."
  - Helpdesk SE method: "$5–$20 for a burner SIM or VoIP minute"
- **Why relevant:** This is the only branch in the corpus that explicitly names VoIP as the contact-number method. If providers extend the VoIP check beyond the customer profile field to *any* call-back number on supporting docs (IBC letters, sponsor letters), this method is exactly what M13 would catch. Within the customer-profile phone field itself the relevance is weaker — the attacker controls the compromised inbox and can plausibly enter the real PI's mobile.
- **Persistent supply chain:** No.

## 2. account-hijack — impersonate-employee, Branch C

- **Profile:** impersonate-employee
- **Target:** Hijack a real PI's existing synthesis-provider account (credential theft + MFA defeat) and order under their persona.
- **Bypass excerpts (verbatim):**
  - SIM-jacking variant: swap victim phone to attacker SIM (used to defeat SMS MFA). The customer phone field inherits whatever the legitimate PI registered.
- **Why relevant:** The customer phone on file is the real PI's real mobile — passes any VoIP check natively. M13 only engages if a SIM-swap attacker subsequently *changes* the phone on file to a burner/VoIP for ongoing use; the bypass is to leave the original number in place. Effectively M13 is pre-empted, not bypassed.
- **Persistent supply chain:** No.

## 3. credential-compromise — Branch A

- **Profile:** impersonate-employee (credential theft variant)
- **Target:** Take over an existing account, or open a new one under stolen PII.
- **Bypass excerpts (verbatim):**
  - "breached PII + SIM swap" (IAL1 SMS-based variant)
- **Why relevant:** SIM-swap on a real victim mobile preserves a non-VoIP number — M13 is pre-empted. If the attacker instead enrolls a fresh VoIP for MFA convenience, M13 catches it; the documented method avoids that.
- **Persistent supply chain:** No.

## 4. shell-nonprofit — Branch E

- **Profile:** purpose-built-organization
- **Target:** Stand up a shell 501(c)(3) with an accomplice as second registered contact.
- **Bypass excerpts (verbatim):**
  - Burner-phone reference for MFA enrollment of accomplice contact (cited in M7 section).
- **Why relevant:** Burner SIMs used here are physical mobile SIMs, not VoIP — M13 would not flag. Included only because the burner-phone vocabulary appears; the actual method evades VoIP detection by definition.
- **Persistent supply chain:** No.

---

## Branches with no relevant engagement

The remaining 15 branches (biotech-incubator-tenant, bulk-order-noise-cover, community-bio-lab-network, cro-framing, cro-identity-rotation, dormant-account-takeover, dormant-domain, foreign-institution, gradual-legitimacy-accumulation, insider-recruitment, it-persona-manufacturing, lab-manager-voucher, shell-company, unrelated-dept-student, visiting-researcher) all commit the attacker's real personal or LLC-controlled mobile number. M13 would have nothing to flag, and none of these branches contain a documented bypass method that touches the phone field. They are not a "VoIP bypass" — they pre-empt the measure by simply not using VoIP.

**Net assessment for M13:** Only inbox-compromise contains a directly-applicable VoIP bypass method (and even there it concerns supporting-document call-back numbers, not the customer profile field). M13 as scoped (customer profile phone) addresses a tiny fraction of corpus tradecraft.
