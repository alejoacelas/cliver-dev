# Measure 12 — Billing-Institution Association: Per-Measure Synthesis

## 1. Side-by-side comparison of selected ideas

| Field | PSP AVS + Plaid Identity Match (`m12-psp-avs`) | Billing-shipping-institution consistency (`m12-billing-shipping-consistency`) | Fintech-neobank BIN denylist (`m12-fintech-denylist`) |
|---|---|---|---|
| **What it does** | Reads AVS response codes from card authorization to verify billing address matches issuer records. Plaid Identity Match extends to ACH via name/address scoring. | Normalizes billing, shipping, and institution canonical addresses; flags geographic divergence via haversine distance and postal-code comparison. | Checks card BIN against curated denylist of neobank/fintech issuers (Mercury, Brex, Relay, etc.); soft-flags orders from fintech-banked entities claiming institutional affiliation. |
| **Trigger** | Every card-paid order (AVS). ACH orders with Plaid Link completion. | Every order with a billing address. | Every card-paid order. |
| **Marginal cost** | $0 (AVS bundled). $0.20-$1.00/call for Plaid (ACH only). | $0 (libpostal) or $0.003-$0.009/order (Smarty). | $0-$0.07/check. $500-$2,000/yr denylist maintenance. |
| **Setup effort** | Read AVS fields from PSP (days). Plaid Link integration (~1-2 weeks). | Rules engine + pipeline integration + threshold tuning (~1-2 weeks). | BIN denylist curation (~1 engineer-day). Stripe Radar rules or BIN lookup integration. |
| **Key flags** | `avs_zip_mismatch`, `avs_address_mismatch`, `avs_unavailable_us`, `plaid_name_mismatch` | `billing_shipping_metro_mismatch`, `billing_institution_postal_mismatch`, `shipping_institution_postal_mismatch`, `billing_residential_on_institutional_order` | `fintech_neobank_billing`, `fintech_neobank_billing_prepaid`, `fintech_billing_name_mismatch` |
| **Attacker stories caught** | dormant-account-takeover Bypass D, dormant-domain Bypass A, inbox-compromise prepaid card | dormant-account-takeover Bypass D, account-hijack Method 2, dormant-domain Bypass A (partial), credential-compromise cloned card (partial) | All 7 LLC branches (shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation), dormant-domain Bypass B, inbox-compromise Method 3 |
| **Primary FP source** | P-card HQ billing addresses (15-30% of institutional card orders). International AVS unavailable. | Multi-campus universities/national labs (~20% of orders at risk). Visiting researchers (2-5%). | Legitimate small biotechs using Mercury/Brex (10-25% of commercial customers). |
| **Audit artifact** | `{psp, charge_id, avs_line1, avs_zip, avs_verdict, plaid_match_scores, checked_at}` | `triple_consistency_record` per order with normalized addresses, distances, decision, rule version. | BIN lookup result, denylist match details, reviewer adjudication memo, denylist version. |

## 2. Coverage gap cross-cut

### Structural gaps (inherent to any billing-address-based M12 control)

| Gap | Nature | Affected ideas | Why structural |
|---|---|---|---|
| **Inherited institutional billing** | Attacker uses the institution's own PO, P-card, invoice, or billing code. All three addresses are genuinely institutional. | All three ideas miss this. | The billing instrument is legitimate; no payment-layer check can distinguish authorized from unauthorized use of a valid institutional payment method. Detection requires institutional-side controls (HR separation triggers, budget-code audits), not provider-side M12 checks. |
| **Invoice/PO/wire orders** | No card payment occurs; no billing address is captured. | AVS (completely blind), billing-shipping (partially blind — may have billing address from account profile but not from payment), fintech denylist (completely blind). | These payment methods bypass the card-authorization pipeline entirely. Estimated 30-50% of B2B synthesis order volume [best guess, unsourced]. Must rely on m09/m18 institution-legitimacy controls. |
| **Purpose-built orgs with aligned addresses** | LLC-based entities construct billing-institution consistency by design. | AVS passes by construction. Billing-shipping passes by construction. | The entity is "real" at the address layer. Only the fintech denylist adds friction here, and even it cannot reliably distinguish shells from legitimate small biotechs. |
| **Driving-distance target selection** | Attacker selects institutions within commuting distance so billing ZIP aligns with institutional ZIP. | AVS (geographic heuristic defeated), billing-shipping (geographic consistency engineered). Fintech denylist irrelevant (traditional bank card). | Address-consistency checks detect geographic divergence, not identity divergence. Addressed by identity-verification controls (M14, M20), not M12. |

### Complementary gaps (addressable by combining the three ideas or by cross-measure controls)

| Gap | Owned by | Filled by | Residual |
|---|---|---|---|
| **AVS does not compare billing to shipping or institution** | AVS | Billing-shipping-consistency fills this directly — it was selected specifically for this reason. | Resolved within stack. |
| **AVS does not detect neobank BINs** | AVS | Fintech denylist fills this directly. | Resolved within stack, subject to signal-to-noise limitation on small biotechs. |
| **Billing-shipping check blind to payment-method type** | Billing-shipping | AVS provides payment-method-level signal; fintech denylist provides issuer-type signal. | Resolved within stack. |
| **No cross-entity correlation** | Fintech denylist | Not addressed by any selected idea. The cro-identity-rotation pattern (same beneficial owner behind multiple fintech-flagged entities) is invisible to per-order checks. | Open. Requires cross-order linkage capability outside M12 scope. |
| **International AVS unavailable** | AVS | Billing-shipping provides partial geographic signal on international orders (address normalization quality is lower but not zero). | Partially mitigated. International address normalization quality is variable (5-7% of orders have unreliable normalization [best guess]). |
| **P-card centralized billing false positives** | AVS | Billing-shipping can confirm that shipping matches institution even when billing diverges (P-card HQ vs lab), reducing reviewer burden. | Partially mitigated. Reviewer still sees the flag but has triple-consistency context to resolve quickly. |

## 3. Bypass methods uncovered: attacker stories surviving the full stack

For each attacker story in the M12 mapping, the table below shows whether it survives all three selected checks.

| Attacker story | Profile | Survives full stack? | How |
|---|---|---|---|
| **dormant-account-takeover Bypass A** (inherited P-card) | exploit-affiliation | YES | Legitimate institutional billing. AVS passes (correct address). Triple-consistency passes (all institutional). No fintech BIN. Time-limited by P-card deactivation on HR separation. |
| **dormant-account-takeover Bypass B** (inherited invoice) | exploit-affiliation | YES | Invoice order — no card, no AVS, no BIN check. Triple-consistency may lack billing address from payment. |
| **dormant-account-takeover Bypass C** (modified budget code) | exploit-affiliation | YES | Legitimate institutional billing rerouted to a different budget code. Invisible to all three checks. Requires institutional finance-system audit to detect. |
| **dormant-account-takeover Bypass D** (personal card) | exploit-affiliation | NO | CAUGHT by AVS (billing mismatch) + billing-shipping (residential billing on institutional order + postal mismatch). |
| **dormant-domain Bypass A** (personal card, permissive provider) | fake-affiliation | NO | CAUGHT by AVS (mismatch at manual review) + billing-shipping (address divergence from claimed institution). |
| **dormant-domain Bypass B** (LLC + fintech bank) | fake-affiliation | PARTIALLY | Fintech denylist fires (Mercury/Relay BIN). AVS passes (billing matches LLC). Triple-consistency passes (addresses aligned). Reviewer must distinguish from legitimate small biotech — friction, not reliable block. |
| **account-hijack** (inherited payment, Method 2 drop address) | impersonate-employee | MIXED | Inherited payment survives AVS and fintech denylist. If attacker uses Method 2 (shipping address change to drop), billing-shipping catches it via `shipping_institution_postal_mismatch`. If attacker ships to institution address, all three checks pass. |
| **inbox-compromise Method 1** (own card, driving distance) | impersonate-employee | YES | Geographic proximity defeats AVS geographic heuristic and triple-consistency distance check. Traditional bank card invisible to fintech denylist. |
| **inbox-compromise Method 2** (prepaid card) | impersonate-employee | NO | CAUGHT by AVS (`avs_unavailable` on US issuer) + possible billing-shipping mismatch. |
| **inbox-compromise Method 3** (small-LLC card) | impersonate-employee | PARTIALLY | Fintech denylist fires. AVS passes (LLC billing aligned). Triple-consistency passes. Flagged but not reliably blocked. |
| **credential-compromise** (invoiced) | impersonate-employee | YES | Invoice billing under target's genuine affiliation. No card, no AVS, no BIN, no billing-address divergence. |
| **credential-compromise** (cloned card) | impersonate-employee | PARTIALLY | AVS passes if clone carries original billing address. Billing-shipping may catch if shipping diverges. Fintech denylist irrelevant (traditional bank). |
| **shell-company** | purpose-built-org | PARTIALLY | Fintech denylist fires (Mercury/Brex BIN). AVS and triple-consistency pass by construction. Flagged but reviewer cannot reliably distinguish from legitimate small biotech. |
| **shell-nonprofit** | purpose-built-org | PARTIALLY | Same as shell-company. Fintech denylist fires. |
| **cro-framing** | purpose-built-org | PARTIALLY | Same. Fintech denylist fires. |
| **cro-identity-rotation** | purpose-built-org | PARTIALLY | Same per-order. Cross-entity correlation (multiple LLCs, same beneficial owner) not detected — no selected idea addresses this. |
| **biotech-incubator-tenant** | purpose-built-org | PARTIALLY | Same. Fintech denylist fires. |
| **community-bio-lab-network** | purpose-built-org | PARTIALLY | Same. Fintech denylist fires. |
| **gradual-legitimacy-accumulation** | purpose-built-org | PARTIALLY | Same. Fintech denylist fires. Additionally, this branch may eventually open a traditional bank account, at which point even the fintech denylist stops firing. |

### Summary of surviving bypass methods

**Fully surviving the stack (no flag fires):**
1. Inherited institutional billing (dormant-account-takeover A/B/C) — time-limited but invisible to M12 controls.
2. Invoice/PO billing (credential-compromise invoiced, dormant-account-takeover B) — no card payment, no M12 signal.
3. Driving-distance target selection with traditional bank card (inbox-compromise Method 1) — geographic consistency engineered.
4. Account-hijack with inherited payment and shipping to institution address — everything is genuinely institutional.

**Partially surviving (flagged but not reliably blocked):**
5. All 7 LLC-based branches — fintech denylist fires but reviewer cannot distinguish from legitimate small biotechs.
6. Dormant-domain Bypass B (LLC + fintech bank) — same signal-to-noise problem.
7. Gradual-legitimacy-accumulation — may eventually migrate to traditional banking, escaping even the fintech denylist.

## 4. Structural gaps — open issues

### Open issue 1: Invoice/PO orders are invisible to the entire M12 stack
- **Severity:** High (estimated 30-50% of B2B order volume [best guess, unsourced]).
- **Nature:** Structural. Invoice/PO billing produces no card authorization, no billing address from payment, no BIN. All three selected ideas rely on the card-authorization pipeline.
- **Disposition:** Must be addressed by m09/m18 institution-legitimacy controls. The M12 stack cannot cover this payment type. The 30-50% volume estimate is unsourced and should be validated against provider data.

### Open issue 2: Inherited institutional payment methods are undetectable
- **Severity:** Medium. Time-limited (P-cards deactivate on HR separation; grant billing closes within months), but during the window, all M12 controls pass.
- **Nature:** Structural. The billing instrument is genuinely institutional. Provider-side payment checks cannot distinguish authorized from unauthorized use.
- **Disposition:** Detection depends on institutional-side controls (HR separation triggers closing provider accounts, institutional audit of budget codes). Providers could implement periodic re-verification of account holder employment status (M14/M20 territory, not M12).

### Open issue 3: Fintech denylist signal-to-noise on small biotechs
- **Severity:** Medium. The fintech denylist is the only M12 control that fires on LLC-based attackers, but the reviewer cannot reliably distinguish shells from legitimate small biotechs.
- **Nature:** Structural at the M12 layer. Resolution requires m09/m18 institution-legitimacy signals (is this entity a recognized life-sciences organization?) composed with the M12 fintech flag.
- **Disposition:** The fintech flag should be treated as a composite signal that gains value only when combined with m09/m18 outputs. Standalone, it adds friction but not reliable detection. The m09/m18 cross-reference path must be explicitly wired into the reviewer SOP.

### Open issue 4: No cross-entity correlation for identity-rotation patterns
- **Severity:** Low-medium. Affects primarily the cro-identity-rotation branch (same individual opening multiple LLC bank accounts).
- **Nature:** Architectural. Per-order checks cannot detect cross-entity patterns. Requires a linkage layer that correlates beneficial owners, contact information, or device fingerprints across customer accounts.
- **Disposition:** Out of scope for M12 per-order checks. Should be flagged as a platform-level detection capability gap.

### Open issue 5: Driving-distance attacker defeats geographic-consistency controls
- **Severity:** Low-medium. Affects inbox-compromise Method 1 specifically.
- **Nature:** Structural. Address-consistency checks detect geographic divergence, not identity divergence.
- **Disposition:** Addressed by identity-verification controls (M14, M20), not by M12 billing-address controls. Accepted as an M12 limitation.

### Open issue 6: Key estimates are unsourced
Several load-bearing estimates across the three ideas lack citations:
- Invoice/PO share of B2B synthesis orders (30-50%) — determines the fraction of orders invisible to the entire stack.
- P-card centralized billing mismatch rate (15-30%) — drives AVS false-positive volume.
- Multi-campus university order share at risk of address divergence (~20%) — drives billing-shipping FP volume.
- Small-biotech fintech banking rate (10-25% of commercial customers) — drives fintech denylist FP volume.
- All are marked [best guess] in the per-idea syntheses. Validation against provider order data is required before tuning thresholds or projecting reviewer workload.
