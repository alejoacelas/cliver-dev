# m12-procurement-network — Bypass-aware hardening v1

- **measure:** M12 — billing-institution-association
- **name:** Institutional supplier-onboarding verification (PaymentWorks / Jaggaer / SAM.gov)
- **idea file:** `04-implementation-v1.md`
- **attacker mapping file:** `attackers/by-measure/measure-12-billing-institution-association.md`

---

## Story walk-throughs

### 1. dormant-account-takeover

**Summary:** Successor or unauthorized user takes over inherited institutional account; inherited payment routes through the institution's procurement system.

- **Bypass A — Use inherited institutional PO / P-card / billing code.**
  - **CAUGHT** — partially. The procurement-network check confirms the *provider* is a registered supplier with the *institution*. This is positive corroboration that the billing relationship is real. However, like the BIN check, this validates the attacker's use of an inherited legitimate billing path. The procurement trail is auditable (the implementation notes the registration ID and dates), so while the attacker isn't flagged in real-time, the institutional audit can later discover the unauthorized order.
  - Classification: **MISSED** for real-time detection. The check confirms the billing path is authorized at the institutional level but cannot detect that the individual user is unauthorized.

- **Bypass B — Inherited invoice / net-terms billing.**
  - **CAUGHT** — same logic. The provider is a registered supplier with the institution; invoice billing is exactly the path procurement registration validates. But the check cannot distinguish authorized from unauthorized use of that billing path.
  - Classification: **MISSED** for real-time detection; same reasoning.

- **Bypass C — Modify PO budget code via finance-system access.**
  - **CAUGHT** — the procurement registration is with the institution, not with a specific budget code. The check confirms the supplier relationship exists. It cannot detect that the budget code was improperly rerouted.
  - Classification: **MISSED** for detecting the budget-code manipulation.

- **Bypass D — Substituted personal card (failure mode).**
  - **CAUGHT** — if the customer substitutes a personal card, the procurement-network check is irrelevant to the card path but the SOP (step 4 of manual_review_handoff) says: "No registration and customer cannot connect provider with procurement office → require a card payment instead and re-route through M12 BIN/AVS checks, or deny SOC orders." The personal card itself would be caught by other M12 checks, not this one. However, if the customer *claims* institutional billing and the provider *does* have a supplier registration with that institution, the procurement check passes — but the personal card would still route through BIN/AVS.
  - Classification: **AMBIGUOUS** — depends on whether the order routes through card or invoice path after the procurement check.

**Net assessment:** The check confirms the institutional billing relationship is real but cannot distinguish authorized from unauthorized users of that relationship. Useful for audit trail, not for real-time account-takeover detection.

---

### 2. dormant-domain

**Summary:** Lone operator reanimates a defunct entity's lapsed domain; must produce billing that survives org-name-match.

- **Bypass A — Personal card, org-name-mismatch accepted.**
  - **CAUGHT** — the provider would check whether the claimed "institution" (the defunct entity) appears in their supplier-registration CRM. A defunct entity will not have a procurement relationship with the provider. `procurement_no_supplier_registration` fires. The SOP (step 3) routes the order to procurement-office callback, which fails because the entity is defunct.

- **Bypass B — LLC + EIN + fintech business account.**
  - **CAUGHT** — the newly formed LLC will not be in the provider's supplier-registration CRM. `procurement_no_supplier_registration` fires. The SOP step 3 callback would attempt to reach the LLC's "procurement office" — which is the attacker themselves, but the implementation says to look up the number independently, not from the customer. For a freshly formed LLC with no public procurement presence, the reviewer would find no legitimate procurement contact.
  - However: **AMBIGUOUS** — if the attacker's LLC successfully onboards as a new customer and requests invoice billing, step 3 says the reviewer "contacts the institution's procurement office at the publicly-listed AP/procurement phone or email." For a real LLC, this could be a real phone that the attacker answers. The implementation says to look up the number "independently from the customer-supplied contact info" but for a small company, the only publicly available number may be the one the attacker controls.

**Net assessment:** Strong signal for both bypasses — the defunct entity and the fresh LLC are unlikely to have procurement-network registration. The callback step introduces ambiguity for the LLC path.

---

### 3. account-hijack

**Summary:** Compromised PI account; inherited everything including institutional billing.

- **Inherited payment (dominant path).**
  - **MISSED** — the provider is already a registered supplier with the PI's institution. The procurement check confirms this. Same as dormant-account-takeover: the check validates the billing path but cannot detect unauthorized use.

- **Method 2 address change.**
  - **MISSED** — the procurement registration is unaffected by a shipping-address change. The billing still routes through the legitimate institutional procurement system.

**Net assessment:** No friction. The attacker inherits a fully valid institutional procurement relationship.

---

### 4. inbox-compromise

**Summary:** Compromised inbox; attacker uses own card; selects targets within driving distance.

- **Own real card, target within driving distance.**
  - **CAUGHT** — if the attacker claims institutional affiliation but pays with a personal card, the procurement-network check is triggered (step 2: look up institutional registration). If the provider has a supplier relationship with the institution, the check passes — but the personal-card payment routes to other M12 checks. If the provider does *not* have a supplier relationship, `procurement_no_supplier_registration` fires.
  - Classification: **AMBIGUOUS** — depends on whether the provider is already a registered supplier with the target institution and whether the order uses card or invoice billing.

- **Prepaid virtual card.**
  - Same as above: **AMBIGUOUS**.

- **Small-LLC business card.**
  - **CAUGHT** — the LLC is not the claimed institution. If the attacker claims affiliation with the institution (not the LLC), the procurement check fires on the institution, not the LLC. If the provider is a registered supplier with the institution, the check passes, but the LLC card triggers BIN/AVS checks. If the attacker claims the LLC as their institution, `procurement_no_supplier_registration` fires because the LLC is new.

**Net assessment:** The check's value depends on whether the provider already has a supplier relationship with the target institution. If yes, the check provides no additional signal because it validates the institutional relationship that the attacker is piggybacking on. If no, the check catches the order.

---

### 5. credential-compromise

**Summary:** Attacker uses compromised credentials to order under the target institution's identity.

- **Invoiced order (dominant).**
  - **MISSED** — the provider is (presumably) a registered supplier with the institution. The invoice routes through the institution's AP system, which the attacker is impersonating. The procurement check confirms the billing relationship and cannot detect the unauthorized user.

- **Credit card in the target's name.**
  - **MISSED** — procurement check is not card-specific. If the provider has a registration with the institution, it passes regardless.

**Net assessment:** No friction on the dominant path. The attacker is exploiting a legitimate institutional billing relationship.

---

### 6. shell-company

**Summary:** Newly incorporated LLC with real business address, EIN, LLC bank account.

- **No active bypass needed — satisfied by construction?**
  - **CAUGHT** — the shell LLC will not be in the provider's supplier-registration CRM (PaymentWorks, Jaggaer, SAM.gov). `procurement_no_supplier_registration` fires. The shell LLC would need to *establish* a supplier relationship with the provider, which requires the provider's accounts-receivable team to onboard the shell as a customer through the procurement portal. This is the normal customer-onboarding path and does not require procurement-network registration — procurement registration is only relevant when the customer claims *another* institution's billing path.
  - **AMBIGUOUS** — the check is scoped to "when a customer claims a US institutional affiliation and proposes invoice/PO billing." If the shell LLC presents itself as its own institution (not claiming affiliation with a university), the procurement-network check's trigger condition may not fire. The LLC would simply be a new customer requesting invoice billing, and the provider would onboard them normally.

**Net assessment:** The check catches the shell only if the shell claims affiliation with a real institution whose procurement network the provider participates in. If the shell presents as its own entity, the check's trigger condition does not engage.

---

### 7. shell-nonprofit

**Summary:** Shell 501(c)(3) with business bank account.

- **Business bank account, pay normally.**
  - **CAUGHT** — same as shell-company. The shell nonprofit will not be in the provider's supplier-registration CRM. If the nonprofit claims to be a research institution, `procurement_no_supplier_registration` fires.
  - **AMBIGUOUS** — same caveat as shell-company. If the nonprofit presents as a new small entity requesting its own account, the procurement-network trigger condition may not fire.

**Net assessment:** Same as shell-company.

---

### 8. cro-framing / cro-identity-rotation / biotech-incubator-tenant / community-bio-lab-network / gradual-legitimacy-accumulation

**Summary:** All are real LLC variants; all present as their own entities.

- **All satisfied by construction.**
  - **AMBIGUOUS** — same as shell-company. These entities present as themselves, not as another institution. The procurement-network check is scoped to "claims a US institutional affiliation and proposes invoice/PO billing." An LLC presenting as itself does not claim affiliation with a procurement-network institution. The check's trigger condition does not fire.

**Net assessment:** The check does not engage for entities that present as themselves rather than claiming another institution's billing path.

---

## Findings

### Moderate-1: Check cannot distinguish authorized from unauthorized use of legitimate institutional billing

- **Severity:** Moderate
- **Source:** dormant-account-takeover (all bypasses), account-hijack, credential-compromise.
- **Why missed:** The procurement-network check validates the *provider-institution billing relationship*, not the *individual user's authorization* within that institution. When an attacker uses a compromised account at a real institution, the billing relationship is genuinely authorized at the institutional level.
- **Suggestion:** This is structural. The procurement-network check is a billing-path validation, not a user-authorization check. User-level authorization requires controls at the account-access layer (M16 MFA, M13 phone re-verification, m13-callback-sop).

### Moderate-2: Trigger condition scoped to "claims institutional affiliation" — does not engage for self-presenting entities

- **Severity:** Moderate
- **Source:** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation.
- **Why missed:** The implementation scopes the check to orders where the customer "claims a US (or US-funded) institutional affiliation and proposes invoice/PO billing." Shell LLCs and purpose-built organizations that present as their own entity do not claim affiliation with a procurement-network institution, so the check's trigger condition does not fire.
- **Suggestion:** This is a designed scope boundary, not a gap. The procurement-network check is explicitly about validating that billing routes to a recognized institution. Entities that present as themselves are handled by other M12 checks (BIN, AVS) and by M9/M18 entity-legitimacy checks.

### Minor-1: Callback step in SOP has ambiguity for small entities with attacker-controlled contact info

- **Severity:** Minor
- **Source:** dormant-domain Bypass B (LLC path).
- **Why missed:** Step 3 of the SOP says to contact the institution's procurement office at a "publicly-listed AP/procurement phone or email (looked up independently from the customer-supplied contact info)." For a small LLC, the only publicly available phone may be the one the attacker controls.
- **Suggestion:** The SOP should specify that for entities without a recognizable independent procurement office (no university AP department, no published SAM.gov contact), the callback step is inherently unreliable and the order should escalate to "require a card payment" (step 4) rather than attempting a callback.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| dormant-account-takeover Bypass A (inherited PO/P-card) | MISSED — validates billing path, not user |
| dormant-account-takeover Bypass B (inherited invoice) | MISSED — validates billing path, not user |
| dormant-account-takeover Bypass C (modified PO code) | MISSED — validates billing path, not budget code |
| dormant-account-takeover Bypass D (personal card) | AMBIGUOUS — depends on routing |
| dormant-domain Bypass A (personal card) | CAUGHT — no supplier registration |
| dormant-domain Bypass B (LLC fintech account) | AMBIGUOUS — caught if claiming another institution; fails callback for small entities |
| account-hijack inherited payment | MISSED — validates billing path, not user |
| account-hijack Method 2 address change | MISSED — procurement unaffected |
| inbox-compromise personal card | AMBIGUOUS — depends on existing supplier relationship |
| credential-compromise invoiced order | MISSED — validates billing path, not user |
| credential-compromise card in target's name | MISSED — procurement check irrelevant to card |
| shell-company LLC bank account | AMBIGUOUS — trigger condition may not fire for self-presenting entity |
| shell-nonprofit business bank account | AMBIGUOUS — same |
| cro-framing LLC card | AMBIGUOUS — trigger condition does not fire |
| cro-identity-rotation LLC cards | AMBIGUOUS — trigger condition does not fire |
| biotech-incubator-tenant LLC card | AMBIGUOUS — trigger condition does not fire |
| community-bio-lab-network LLC card | AMBIGUOUS — trigger condition does not fire |
| gradual-legitimacy-accumulation LLC card | AMBIGUOUS — trigger condition does not fire |

## bypass_methods_uncovered

- Authorized-billing-path abuse by unauthorized users (account takeover paths)
- Self-presenting entities that do not claim affiliation with a procurement-network institution
- Callback ambiguity for small entities with attacker-controlled contact info

---

## Verdict: **PASS**

No Critical findings. The two Moderate findings are structural scope limitations: (1) the check validates billing paths, not individual user authorization; (2) the check only fires when a customer claims an institutional affiliation, so self-presenting entities are out of scope. Both are by design and addressed by complementary controls. The Minor finding about callback ambiguity for small entities is a refinement to the SOP. Pipeline continues to stage 6.
