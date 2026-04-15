# m12-pcard-bin — Bypass-aware hardening v1

- **measure:** M12 — billing-institution-association
- **name:** P-Card / commercial-card BIN positive signal
- **idea file:** `04-implementation-v1.md`
- **attacker mapping file:** `attackers/by-measure/measure-12-billing-institution-association.md`

---

## Story walk-throughs

### 1. dormant-account-takeover

**Summary:** Successor or unauthorized user takes over an inherited institutional account; payment instruments are inherited unless the institutional billing closes out.

**Bypass methods relevant to M12:**

- **Bypass A — Use inherited institutional PO / P-card / billing code.**
  - **CAUGHT** — partially. If the inherited card is a P-card, the BIN check returns `commercial/purchasing`, confirming institutional payment. However, the check produces a **false positive corroboration**: it confirms the billing instrument looks institutional, which is exactly what the attacker wants. The check was designed to catch *personal cards on institutional claims*, not *inherited institutional cards on unauthorized orders*. The positive signal actively works against detection here.
  - Classification: **MISSED** — the check's positive-corroboration design makes it counter-productive for this bypass. It validates the attacker rather than flagging them.

- **Bypass B — Inherited invoice / net-terms billing.**
  - **MISSED** — BIN check does not fire on invoice/PO billing paths (no card presented). The implementation explicitly covers card payments only.

- **Bypass C — Modify PO budget code via finance-system access.**
  - **MISSED** — same as Bypass B; no card presented.

- **Bypass D — Substituted personal card (failure mode).**
  - **CAUGHT** — this is the design-intent case. A personal consumer card on an institutional-claim order produces `pcard_consumer_on_institutional_claim`, routing the order to billing-address review. The `product_name` field from BIN lookup distinguishes consumer from commercial.

**Net assessment:** The check catches only Bypass D (the "failure mode" the attacker explicitly wants to avoid). Bypasses A-C, which are the dominant paths (cheaper, lower risk), either produce false corroboration or don't fire at all. The check is useful only as a backstop for the least-likely attacker path.

---

### 2. dormant-domain

**Summary:** Lone operator reanimates a defunct entity's lapsed domain; must produce a payment that survives org-name-match.

- **Bypass A — Personal card, org-name-mismatch accepted (permissive providers).**
  - **CAUGHT** — personal card produces `consumer` in the product-category field, generating `pcard_consumer_on_institutional_claim`. The flag fires.

- **Bypass B — LLC + EIN + fintech business account.**
  - **MISSED** — the LLC's fintech business card will return `commercial` or `business` in the BIN product category, producing a `pcard_positive` signal. The check cannot distinguish a real institutional P-card from a shell-LLC fintech business card at the BIN layer. The implementation document itself notes that "small businesses (non-research) using a commercial credit card look identical to a P-card on an institutional order at the BIN layer."

**Net assessment:** Catches the cheap path (Bypass A) at permissive providers. Misses the hardened path (Bypass B) entirely — the LLC business card looks indistinguishable from a legitimate institutional card.

---

### 3. account-hijack

**Summary:** Compromised PI's account; inherited payment instruments.

- **Inherited payment (dominant path).**
  - **MISSED** — same as dormant-account-takeover Bypass A. The PI's institutional payment method is already on file and passes the BIN check with a positive corroboration signal. The check validates the attacker.

- **Method 2 address-change path** (billing/shipping mismatch triggered).
  - **AMBIGUOUS** — the BIN check itself does not detect a billing/shipping mismatch; that is AVS territory. The BIN check would still return `pcard_positive` on the inherited institutional card. The "billing/shipping address mismatch" alert cited in the source file is not produced by this check.

**Net assessment:** No meaningful friction from this check. The attacker inherits a legitimate institutional payment instrument.

---

### 4. inbox-compromise

**Summary:** Compromised institutional inbox; attacker uses own real card, selects targets within driving distance.

- **Own real card, target selected within driving distance.**
  - **CAUGHT** — personal consumer card on an institutional-claim order produces `pcard_consumer_on_institutional_claim`.

- **Prepaid virtual card.**
  - **CAUGHT** — prepaid cards return `prepaid` in the BIN product category; the implementation routes these to `m10` prepaid check and does not corroborate.

- **Small-LLC business card.**
  - **MISSED** — LLC business card returns `commercial/business`, producing false corroboration (same as dormant-domain Bypass B).

**Net assessment:** Catches the two cheapest paths (personal card, prepaid). Misses the LLC-card path, which costs the attacker $100-$300 extra.

---

### 5. credential-compromise

**Summary:** Attacker operates under real institution's identity via compromised credentials.

- **Invoiced order (dominant).**
  - **MISSED** — no card presented; BIN check does not fire.

- **Credit card in the target's name (cloned/fraudulent).**
  - **AMBIGUOUS** — a cloned card would carry the original cardholder's BIN attributes and would return whatever the legitimate card's product type is (likely consumer credit unless the target had a corporate card). If consumer, the check fires `pcard_consumer_on_institutional_claim`. If the target's card is itself a corporate/P-card that was cloned, the check produces false corroboration. Depends on the target's actual card product.

**Net assessment:** The dominant path (invoice) bypasses the check entirely. The card-fraud path depends on what the original card is.

---

### 6. shell-company

**Summary:** Newly incorporated LLC with real business address, EIN, LLC bank account. Billing matches by construction.

- **No active bypass needed — satisfied by construction.**
  - **MISSED** — the LLC's fintech business card returns `commercial` or `business` in the BIN product category. The check produces `pcard_positive`, actively corroborating the shell company's legitimacy. The implementation document explicitly acknowledges this in `false_positive_qualitative` ("small businesses using a commercial credit card look identical").

**Net assessment:** The check is counter-productive — it helps the attacker look legitimate.

---

### 7. shell-nonprofit

**Summary:** Shell 501(c)(3) with business bank account; pays by ACH or card.

- **Open a business bank account and pay normally.**
  - **MISSED** — fintech business card returns `commercial/business`. Same as shell-company. The implementation notes the "fintech BIN sponsor appearing instead of entity name" friction, but the BIN product-category check would still return `commercial`, not `consumer`.

**Net assessment:** Same as shell-company — check produces false corroboration.

---

### 8. cro-framing / cro-identity-rotation / biotech-incubator-tenant / community-bio-lab-network / gradual-legitimacy-accumulation

**Summary:** All are real LLC variants with real business bank accounts.

- **All satisfied by construction.**
  - **MISSED** — every branch has a real LLC business bank account whose card returns `commercial/business`. The BIN check produces `pcard_positive` for all of them.

**Net assessment:** Check is counter-productive across the entire LLC cluster.

---

## Findings

### Moderate-1: BIN check produces false corroboration for LLC-based attackers

- **Severity:** Moderate
- **Source:** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation, dormant-domain Bypass B, inbox-compromise LLC-card path.
- **Why missed:** The BIN product-category field distinguishes consumer from commercial but cannot distinguish a legitimate institutional P-card from a shell-LLC fintech business card. The `pcard_positive` signal actively validates the attacker's cover.
- **Suggestion:** The implementation should explicitly warn that `pcard_positive` must never be used as a standalone pass signal and must always be combined with other M12 checks (procurement-network registration, institution-name matching). The `pcard_positive` classification could be split into `pcard_positive_known_institutional_issuer` (US Bank PaymentNet, JPM, Citi on a recognized institutional BIN range) vs `pcard_positive_generic_commercial` (any other commercial BIN) to add a layer of granularity.

### Moderate-2: BIN check does not fire on invoice/PO/ACH billing paths

- **Severity:** Moderate
- **Source:** dormant-account-takeover Bypasses A-C, credential-compromise (invoiced order), all institutional-billing paths.
- **Why missed:** The check is card-only by design. Invoice, PO, and ACH payments never present a card BIN. The implementation document implicitly scopes to card payments but does not state this as a coverage limitation.
- **Suggestion:** The implementation should explicitly document that BIN-check coverage is limited to card-paid orders and that invoice/PO billing paths require other M12 controls (procurement-network check, callback). This is not a gap in the check itself — it is a scope limitation that should be made explicit.

### Minor-1: BIN check corroborates inherited institutional cards on account-takeover paths

- **Severity:** Minor
- **Source:** dormant-account-takeover Bypass A, account-hijack.
- **Why missed:** Inherited institutional payment instruments produce `pcard_positive`, actively validating the unauthorized user. This is structural — the BIN check is designed for positive corroboration, and inherited cards are legitimately institutional.
- **Suggestion:** This is a structural limitation. The BIN check cannot distinguish authorized from unauthorized use of a legitimate institutional card. Account-takeover detection requires different controls (M16 MFA, M13 phone re-verification).

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| dormant-account-takeover Bypass A (inherited P-card) | MISSED — false corroboration |
| dormant-account-takeover Bypass B (inherited invoice) | MISSED — no card presented |
| dormant-account-takeover Bypass C (modified PO code) | MISSED — no card presented |
| dormant-account-takeover Bypass D (substituted personal card) | CAUGHT — consumer BIN flagged |
| dormant-domain Bypass A (personal card) | CAUGHT — consumer BIN flagged |
| dormant-domain Bypass B (LLC fintech card) | MISSED — commercial BIN corroborates |
| account-hijack inherited payment | MISSED — false corroboration |
| inbox-compromise own real card | CAUGHT — consumer BIN flagged |
| inbox-compromise prepaid card | CAUGHT — prepaid BIN flagged |
| inbox-compromise LLC business card | MISSED — commercial BIN corroborates |
| credential-compromise invoiced order | MISSED — no card presented |
| credential-compromise cloned card | AMBIGUOUS — depends on original card product |
| shell-company LLC bank card | MISSED — commercial BIN corroborates |
| shell-nonprofit fintech card | MISSED — commercial BIN corroborates |
| cro-framing LLC card | MISSED — commercial BIN corroborates |
| cro-identity-rotation LLC cards | MISSED — commercial BIN corroborates |
| biotech-incubator-tenant LLC card | MISSED — commercial BIN corroborates |
| community-bio-lab-network LLC card | MISSED — commercial BIN corroborates |
| gradual-legitimacy-accumulation LLC card | MISSED — commercial BIN corroborates |

## bypass_methods_uncovered

- Inherited institutional P-card/PO/invoice (account takeover paths)
- LLC/shell fintech business card producing false positive corroboration
- Invoice/PO billing paths (no BIN to check)
- Cloned institutional card (ambiguous)

---

## Verdict: **PASS**

No Critical findings. The two Moderate findings reflect the structural scope of a BIN-only check: it is a corroborative signal for one specific scenario (personal card on an institutional claim) and is inherently blind to card-less billing and to attackers who obtain commercial-grade payment instruments. These limitations are documented in the implementation and are addressed by complementary M12 ideas (procurement-network, AVS). Pipeline continues to stage 6.
