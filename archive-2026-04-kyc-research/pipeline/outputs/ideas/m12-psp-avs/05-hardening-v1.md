# m12-psp-avs — Bypass-aware hardening v1

- **measure:** M12 — billing-institution-association
- **name:** PSP AVS (Stripe / Adyen / Braintree) + Plaid Identity Match
- **idea file:** `04-implementation-v1.md`
- **attacker mapping file:** `attackers/by-measure/measure-12-billing-institution-association.md`

---

## Story walk-throughs

### 1. dormant-account-takeover

**Summary:** Successor takes over inherited institutional account; payment instruments inherited or substituted.

- **Bypass A — Use inherited institutional PO / P-card / billing code.**
  - **MISSED** — PO/P-card billing address is the institution's address, which is correct. AVS returns `pass` because the card's billing address matches the issuer record. The check validates the inherited payment.

- **Bypass B — Inherited invoice / net-terms billing.**
  - **MISSED** — invoice billing does not trigger a card AVS check. Plaid Identity Match would only fire if ACH is used and the customer goes through Plaid Link. Invoice billing typically routes through institutional AP, not Plaid.

- **Bypass C — Modify PO budget code.**
  - **MISSED** — same as Bypass A. The card billing address is unchanged; AVS passes.

- **Bypass D — Substituted personal card.**
  - **CAUGHT** — the personal card's billing address (the attacker's home) mismatches the institutional address on file. AVS returns `fail` or `partial` on zip/street. `avs_zip_mismatch` or `avs_full_mismatch` fires. This is the design-intent case.

**Net assessment:** Catches Bypass D (the substituted personal card); misses all inherited-payment paths.

---

### 2. dormant-domain

**Summary:** Operator reanimates defunct entity's domain; must produce billing that survives org-name-match.

- **Bypass A — Personal card, org-name-mismatch accepted.**
  - **CAUGHT** — partially. AVS checks billing *address*, not cardholder *name* vs institution name. If the attacker enters their own billing address and it matches their card's issuer record, AVS returns `pass`. The address mismatch between the billing address and the claimed institution's address is the useful signal — but only if the implementation compares billing zip to institutional zip (the manual review SOP step 3 does this: "reviewer compares billing ZIP to claimed institution's known city/ZIP"). So: **CAUGHT** at the manual review step, not at the AVS-code level.

- **Bypass B — LLC + EIN + fintech business account.**
  - **MISSED** — the LLC's billing address is the LLC's registered address. AVS returns `pass` because the billing address matches the issuer record. The LLC's billing address may or may not be geographically near the claimed institution. If the LLC is in Delaware and the claimed institution is in California, the reviewer would catch the mismatch at the manual-review step — but if the LLC is in the same metro as the defunct entity (by design), the zip comparison passes.
  - For Plaid Identity Match (ACH path): the LLC's bank-account holder name matches the LLC name, which matches the customer record. Plaid returns a high match score. **MISSED**.

**Net assessment:** Bypass A caught at manual review (not automated). Bypass B may be caught if the LLC address is geographically distant from the claimed institution, but a geographically co-located LLC defeats the check.

---

### 3. account-hijack

**Summary:** Compromised PI account; inherited payment.

- **Inherited payment (dominant).**
  - **MISSED** — PI's institutional payment is on file; billing address matches. AVS passes.

- **Method 2 address change (billing/shipping mismatch).**
  - **CAUGHT** — if the attacker changes the shipping address but not the billing address, the billing/shipping divergence is a signal. However, AVS itself only checks billing address vs issuer record, not billing vs shipping. The "billing/shipping address mismatch" alert cited in the attacker source file is not an AVS output — it would need a separate address-consistency check. The implementation does not explicitly include a billing-vs-shipping comparison; it only compares billing address to issuer record (AVS) and billing address to institution geography (manual review).
  - Classification: **AMBIGUOUS** — the implementation document does not specify a billing-vs-shipping consistency check, only AVS (billing vs issuer) and manual review (billing zip vs institution zip).

**Net assessment:** Minimal friction. AVS passes on inherited billing. The billing/shipping mismatch signal is not automated by this implementation.

---

### 4. inbox-compromise

**Summary:** Compromised inbox; attacker uses own real card.

- **Own real card, target within driving distance.**
  - **CAUGHT** — partially. The attacker's personal card billing address matches the issuer record (AVS `pass` on the card). But the manual review step compares billing zip to institutional zip. If the attacker selected a target within driving distance, the billing zip may be "plausibly within commuting distance" — the SOP says to allow with a note in that case. So the attacker's target-selection strategy (driving distance) is specifically designed to defeat this check.
  - Classification: **MISSED** — the attacker's explicit tradecraft (geographic proximity selection) defeats the manual-review zip comparison.

- **Prepaid virtual card.**
  - **CAUGHT** — prepaid cards often have no billing address on file with the issuer, producing AVS `unavailable`. Some prepaid cards allow setting a billing address, but it may not match any institution. `avs_unavailable_us` or `avs_zip_mismatch` fires.

- **Small-LLC business card.**
  - **MISSED** — LLC billing address matches issuer record (AVS `pass`). If the LLC is geographically co-located with the target institution, the zip comparison also passes.

**Net assessment:** The inbox-compromise branch's explicit driving-distance target selection defeats the geographic-proximity heuristic in the manual review SOP. Prepaid cards are caught.

---

### 5. credential-compromise

**Summary:** Attacker uses compromised credentials; invoiced or card payment.

- **Invoiced order (dominant).**
  - **MISSED** — no card AVS check on invoice billing.

- **Credit card in the target's name (cloned).**
  - **MISSED** — a cloned card carries the original cardholder's billing address. AVS returns `pass` because the billing address matches the issuer record.

- **Fraudulent new-card application.**
  - **AMBIGUOUS** — if the attacker opens a new card in the target's name at the target's address, AVS passes. If the address differs, AVS catches it. Depends on the quality of the identity fraud.

**Net assessment:** The dominant path (invoice) and the cloned-card path both bypass AVS.

---

### 6. shell-company

**Summary:** LLC with real address, EIN, bank account.

- **Satisfied by construction.**
  - **MISSED** — LLC's billing address matches issuer record. AVS `pass`. Plaid Identity Match on ACH returns high match (LLC name matches bank-account name). No signal from this check.

**Net assessment:** Check produces no signal against a shell company with properly aligned billing.

---

### 7. shell-nonprofit

**Summary:** Shell 501(c)(3) with business bank account.

- **Business bank account.**
  - **MISSED** — same as shell-company. Billing address and name match by construction. The implementation notes the "fintech BIN sponsor name mismatch" in Plaid Identity Match, but this is about the BIN sponsor name, not the account-holder name. If the nonprofit's business bank account holder name matches the nonprofit's name, Plaid returns a high match.
  - **AMBIGUOUS** — the "fintech BIN sponsor appearing instead of entity name in payment metadata" friction noted in the shell-nonprofit source file could produce a Plaid `name_mismatch` if the bank-on-file name shows the fintech sponsor (e.g., "Mercury Financial" or a BIN sponsor) rather than the nonprofit's name. This depends on how Plaid resolves the bank-account holder name for fintech-backed accounts.

**Net assessment:** Likely missed; the fintech BIN-sponsor name issue is the only possible signal and it is speculative.

---

### 8. cro-framing / cro-identity-rotation / biotech-incubator-tenant / community-bio-lab-network / gradual-legitimacy-accumulation

**Summary:** All LLC variants with properly aligned billing.

- **All satisfied by construction.**
  - **MISSED** — billing address matches issuer record across all branches. AVS `pass`. Plaid high match.

**Net assessment:** No signal from this check against any of the LLC cluster.

---

## Findings

### Moderate-1: Inbox-compromise driving-distance target selection defeats the geographic-proximity heuristic

- **Severity:** Moderate
- **Source:** inbox-compromise, own real card path.
- **Why missed:** The attacker source file explicitly documents target selection "within driving distance" to defeat billing-address geographic-consistency checks. The implementation's manual review SOP says to allow orders where the billing zip is "plausibly within commuting distance of the institution." The attacker's tradecraft is specifically designed to clear this threshold.
- **Suggestion:** The SOP could tighten by comparing not just zip proximity but cardholder *name* vs claimed customer name and institution. AVS does not return the cardholder name, but the PSP charge object may include the cardholder name entered at checkout — comparing that to the claimed institutional affiliation would add a layer. However, this requires a name-matching check not currently specified in the implementation.

### Moderate-2: AVS produces no signal against properly constructed shell entities

- **Severity:** Moderate
- **Source:** shell-company, shell-nonprofit, cro-framing, all LLC-cluster branches.
- **Why missed:** By construction, these entities align their billing address with their registered address and their bank-account name with their entity name. AVS and Plaid Identity Match both return `pass`/high-match.
- **Suggestion:** Structural. AVS is an address-verification mechanism, not an entity-legitimacy mechanism. Entity-level checks are the domain of M9/M18.

### Moderate-3: No billing-vs-shipping consistency check in the implementation

- **Severity:** Moderate
- **Source:** account-hijack Method 2.
- **Why missed:** The attacker source file explicitly cites "billing/shipping address mismatch" as a constraint. The implementation checks billing-vs-issuer (AVS) and billing-vs-institution (manual review), but does not include an automated billing-vs-shipping consistency comparison. The m12-billing-shipping-consistency idea (a separate idea in the pipeline) presumably covers this, but it is not referenced in this implementation.
- **Suggestion:** The implementation should cross-reference m12-billing-shipping-consistency for the billing-vs-shipping comparison, or explicitly note that this is delegated to that separate idea.

### Minor-1: International AVS coverage gap

- **Severity:** Minor
- **Source:** The implementation notes AVS is effective only for US/CA/UK/Visa-EU. International orders produce `avs_unavailable`, which the SOP treats as expected. This means non-US institutional orders get no AVS signal.
- **Suggestion:** Already documented in the implementation. No change needed.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| dormant-account-takeover Bypass A (inherited P-card) | MISSED — AVS passes on legitimate billing |
| dormant-account-takeover Bypass B (invoice) | MISSED — no card AVS |
| dormant-account-takeover Bypass C (modified PO) | MISSED — AVS passes |
| dormant-account-takeover Bypass D (personal card) | CAUGHT — AVS mismatch |
| dormant-domain Bypass A (personal card) | CAUGHT — at manual review (zip comparison) |
| dormant-domain Bypass B (LLC account) | MISSED — AVS passes if co-located |
| account-hijack inherited payment | MISSED — AVS passes |
| account-hijack Method 2 address change | AMBIGUOUS — billing-vs-shipping not implemented |
| inbox-compromise own card (driving distance) | MISSED — geographic proximity defeats zip comparison |
| inbox-compromise prepaid card | CAUGHT — AVS unavailable/mismatch |
| inbox-compromise LLC card | MISSED — AVS passes if co-located |
| credential-compromise invoiced order | MISSED — no card AVS |
| credential-compromise cloned card | MISSED — AVS passes on cloned address |
| shell-company LLC | MISSED — AVS passes by construction |
| shell-nonprofit fintech account | AMBIGUOUS — possible Plaid BIN-sponsor name mismatch |
| cro-framing LLC | MISSED — AVS passes |
| cro-identity-rotation LLC | MISSED — AVS passes |
| biotech-incubator-tenant LLC | MISSED — AVS passes |
| community-bio-lab-network LLC | MISSED — AVS passes |
| gradual-legitimacy-accumulation LLC | MISSED — AVS passes |

## bypass_methods_uncovered

- Inherited institutional payment instruments (account takeover paths)
- Properly constructed shell entities with aligned billing (all LLC cluster)
- Invoice/PO billing (no AVS)
- Driving-distance target selection defeating geographic-proximity heuristic
- Cloned cards carrying original billing address
- Billing-vs-shipping consistency (not implemented in this check)

---

## Verdict: **PASS**

No Critical findings. The three Moderate findings reflect structural scope limitations of AVS: it verifies billing-address-vs-issuer consistency, not entity legitimacy, not user authorization, and not billing-vs-shipping consistency. The inbox-compromise driving-distance bypass is notable but narrow (requires the attacker to invest in target selection and geographic proximity). All findings are addressed by complementary M12 ideas or other measure controls. Pipeline continues to stage 6.
