# m13-callback-sop — Bypass-aware hardening v1

- **measure:** M13 — phone-voip-check (extended: out-of-band callback)
- **name:** Independent-switchboard callback SOP
- **idea file:** `04-implementation-v1.md`
- **attacker mapping file:** `attackers/by-measure/measure-13-phone-voip-check.md`

---

## Story walk-throughs

### 1. inbox-compromise

**Summary:** Attacker compromises institutional inbox; fabricated supporting documents list attacker-controlled VoIP callback number; the attacker also controls the compromised email and can plausibly enter the real PI's mobile as the customer profile phone.

- **M9 Method 4 — attacker-controlled VoIP number on fabricated letter.**
  - **CAUGHT** — this is the design-intent case. The reviewer independently looks up the institution's switchboard (step 2 of the SOP: "Open a fresh browser tab. In a search engine, type `<institution name> switchboard`"). The reviewer does **not** call the number on the fabricated letter. Instead, the reviewer calls the switchboard and asks to be transferred to the named individual. Outcomes:
    - If the fabricated identity does not exist at the institution: `callback_no_such_person` → block.
    - If the fabricated identity is a real but compromised person: the switchboard transfers to that person's real extension. If the attacker is not physically present at the institution, the call goes to voicemail or a colleague answers and cannot confirm the order. `callback_voicemail_only` or `callback_denied` → hold/block.
    - If the attacker is impersonating a real person whose phone the attacker does *not* control: the real person picks up and denies the order. `callback_denied` → block.
  - Classification: **CAUGHT** — the independent lookup defeats the attacker-controlled VoIP number entirely.

- **Helpdesk SE method — burner SIM / VoIP for the SE call.**
  - **CAUGHT** — the SOP's independent lookup is independent of *any* customer-supplied number, including numbers used in helpdesk calls. The reviewer calls the institution's switchboard, not any number the attacker provided.

- **Customer-profile phone field: attacker enters real PI's mobile.**
  - **CAUGHT** — the SOP does not call the customer-profile phone number. It calls the switchboard. Even if the attacker enters the PI's real mobile, the reviewer is asking the switchboard to transfer to the named individual. The PI (if reachable) would deny the order; if not reachable, the order is held.

**Net assessment:** The callback SOP is highly effective against this branch. The independent lookup is the key mechanism — it defeats all attacker-controlled numbers by design.

---

### 2. account-hijack

**Summary:** PI's existing account hijacked; customer phone on file is the real PI's mobile. SIM-swap variant redirects the PI's number to an attacker SIM.

- **Inherited phone (PI's real mobile on file).**
  - **CAUGHT** — the SOP calls the institution's switchboard and asks for the PI. If the PI is at the institution and reachable, the PI picks up and either confirms (if the attacker placed an order the PI is unaware of → `callback_denied`) or does not pick up (`callback_voicemail_only`). The attacker cannot intercept a call routed through the institution's PBX even if they SIM-swapped the PI's mobile.
  - There is one edge case: if the institution's PBX forwards to the PI's mobile (common for remote/hybrid faculty), the SIM-swap attacker could answer. The implementation's failure_modes_requiring_review mentions "BEC tactic: attacker is sitting on the institution's mail server and can intercept the call routing if the institution uses VoIP-based switchboard with email-based call forwarding."
  - Classification: **CAUGHT** with a narrow edge case. If the PBX forwards to the SIM-swapped mobile, the attacker could answer. The SOP's mitigation is to "ask a question only the legitimate customer would be able to answer (a detail from the order)" — but the attacker placed the order and knows all the details.

- **SIM-swap variant where attacker subsequently changes phone on file.**
  - **CAUGHT** — the SOP does not call the phone on file. It calls the switchboard.

**Net assessment:** Highly effective. The PBX-to-mobile forwarding edge case is narrow and partially mitigated by the verification questions, though the mitigation is weaker than the implementation acknowledges (the attacker knows the order details).

---

### 3. credential-compromise

**Summary:** Attacker operates under stolen credentials with SIM-swap or breached PII.

- **Breached PII + SIM swap.**
  - **CAUGHT** — same as account-hijack. The SOP calls the switchboard, not the customer's mobile. If the real person at the institution denies the order or is unreachable, the check blocks.

**Net assessment:** Effective. Same mechanism as account-hijack.

---

### 4. shell-nonprofit

**Summary:** Shell 501(c)(3) with accomplice as second registered contact; burner SIM for MFA.

- **Burner SIM (physical mobile, not VoIP).**
  - **CAUGHT** — the SOP would attempt to reach the institution's switchboard. For a shell nonprofit, the "switchboard" is whatever phone the attacker set up. The reviewer's independent lookup (step 2: search engine → institution's official domain → "Contact Us" page) would find:
    - If the shell nonprofit has a thin website with a single phone number: the reviewer calls that number, and the attacker answers. **AMBIGUOUS** — the attacker can confirm the order. However, the SOP's step 2c says "If the institution is small or the search is ambiguous, look up the canonical record in ROR → click through to the institution's homepage." If the shell nonprofit is not in ROR, the reviewer should notice the absence and flag it.
    - If the shell nonprofit is in ROR (unlikely for a freshly created shell): the attacker's number would be the only listed contact.
  - Classification: **AMBIGUOUS** — the SOP's effectiveness depends on whether the reviewer recognizes that a small entity with no ROR record and a single-phone "switchboard" is suspicious. The SOP does not explicitly instruct the reviewer to treat the absence of a recognizable independent switchboard as a flag.

**Net assessment:** Partially effective. The SOP's strength (independent lookup) is weakened when there is no independent switchboard to call — the "institution" and the attacker are the same entity.

---

### Additional stories from the implementation's attacker_stories_addressed

The implementation lists shell-company, cro-*, and community-bio-lab as addressed by this SOP ("no legitimate switchboard at all, or the switchboard exists but cannot vouch for the named individual"). Walking these:

- **shell-company / cro-framing / cro-identity-rotation / biotech-incubator-tenant / community-bio-lab-network:**
  - **AMBIGUOUS** — all purpose-built organizations. The reviewer calls the "institution's switchboard." For these entities, the phone listed on their website is an attacker-controlled number. The attacker (or an associate) answers and confirms the order. The SOP's independent-lookup mechanism works against *impersonation* of a real institution, but not against *purpose-built entities* that are their own "institution."
  - The SOP's effectiveness here depends entirely on whether the reviewer recognizes that the entity is not a legitimate institution — which is the job of M9/M18 entity-legitimacy checks, not M13.

**Net assessment for purpose-built entities:** The callback SOP is structurally ineffective against entities that control their own switchboard. This is expected — the SOP is designed for impersonation scenarios, not for fabricated-institution scenarios.

---

## Findings

### Moderate-1: PBX-to-mobile forwarding defeats the switchboard independence for SIM-swap attackers

- **Severity:** Moderate
- **Source:** account-hijack (SIM-swap variant).
- **Why missed:** Many universities forward desk-phone calls to faculty mobile numbers. If the attacker has SIM-swapped the PI's mobile, a call routed through the PBX still reaches the attacker. The implementation's suggested mitigation ("ask a question only the legitimate customer would be able to answer — a detail from the order") is weak because the attacker placed the order and knows all details.
- **Suggestion:** Tighten the verification question to something the attacker would *not* know: a detail from the customer's *previous* order history, or from their institutional profile (e.g., "Can you confirm the name of the PI listed as your lab head on your most recent grant?"). This requires the reviewer to have access to the customer's prior records and to the institutional directory. Alternatively, require the switchboard to transfer to a *different* person at the institution (the department admin or a lab colleague) rather than the customer themselves.

### Moderate-2: Callback SOP is structurally ineffective against purpose-built entities

- **Severity:** Moderate
- **Source:** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation.
- **Why missed:** The independent-lookup mechanism works by calling a switchboard the attacker does not control. Purpose-built entities control their own switchboard. The reviewer calls the entity's listed phone, and the attacker (or associate) answers and confirms.
- **Suggestion:** This is structural and expected. The SOP is designed for impersonation scenarios. For purpose-built entities, the relevant checks are M9/M18 entity legitimacy, not M13 phone verification. The implementation should explicitly note in the SOP that the callback is not applicable to entities where no independent institutional switchboard exists.

### Minor-1: SOP does not explicitly instruct reviewer to flag absence of ROR record or recognizable switchboard

- **Severity:** Minor
- **Source:** shell-nonprofit (thin website, single phone).
- **Why missed:** Step 2c mentions ROR lookup but does not instruct the reviewer to treat the absence of a ROR record as a flag. A shell nonprofit with no ROR entry, no institutional directory, and a single phone number should trigger heightened scrutiny.
- **Suggestion:** Add to step 2: "If the institution is not found in ROR and has no independently verifiable switchboard (multi-extension PBX, departmental directory), flag the entity for M18 entity-legitimacy review before proceeding with the callback."

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| inbox-compromise VoIP on fabricated letter | CAUGHT — independent switchboard lookup |
| inbox-compromise helpdesk SE with burner/VoIP | CAUGHT — independent switchboard lookup |
| inbox-compromise real PI's mobile on profile | CAUGHT — SOP calls switchboard, not profile number |
| account-hijack inherited phone (no swap) | CAUGHT — switchboard routes to real PI |
| account-hijack SIM-swap with PBX forwarding | AMBIGUOUS — PBX may forward to swapped mobile |
| credential-compromise SIM swap | CAUGHT — switchboard routes to real person |
| shell-nonprofit burner SIM | AMBIGUOUS — attacker controls the "switchboard" |
| shell-company/cro/LLC-cluster self-presentation | AMBIGUOUS — attacker controls the "switchboard" |

## bypass_methods_uncovered

- PBX-to-mobile forwarding for SIM-swap attackers (narrow)
- Purpose-built entities controlling their own switchboard (structural, expected)

---

## Verdict: **PASS**

No Critical findings. The callback SOP is highly effective against its design-intent scenarios (impersonation of real institutional personnel). The two Moderate findings are: (1) a narrow edge case where PBX forwarding defeats switchboard independence, with a concrete tightening suggestion; (2) a structural scope limitation against purpose-built entities, which is expected and handled by other measures. Pipeline continues to stage 6.
