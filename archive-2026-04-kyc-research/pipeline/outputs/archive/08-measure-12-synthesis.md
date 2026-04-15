# Measure 12 — billing-institution-association: Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (which) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| **m12-psp-avs** | Stripe/Adyen/Braintree AVS (built-in); Plaid Identity Match (ACH) | $0 (card AVS); $0.20–$1.00 (Plaid per ACH call) | ~5 min for AVS partial/fail triage; P-card HQ-billing FPs est. 15–30% of institutional card orders | 3 caught (dormant-account-takeover Bypass D, dormant-domain Bypass A personal card, inbox-compromise prepaid) | International cardholders (~30–50%) get no AVS signal; invoice/PO orders (~30–50% of B2B) completely invisible; P-card HQ billing address creates systematic false positives | Inherited institutional billing passes by construction; all LLC-cluster entities align billing by construction; driving-distance target selection defeats geographic heuristic |
| **m12-procurement-network** | PaymentWorks, JAGGAER, SAM.gov, internal CRM | $0–$3/check (analyst time) | ~10–15 min for procurement-office callback on unregistered institutions | Caught: dormant-domain (no supplier registration). Ambiguous: shell-company/nonprofit claiming affiliation. Missed: account-hijack, credential-compromise (validates billing path, not user) | Non-US institutions (~55–65% by count) zero coverage; commercial/biotech customers (~42–50% of revenue) zero coverage; effective scope may be only 15–25% of all customers | Authorized-billing-path abuse (unauthorized user on legitimate institutional billing); self-presenting entities (LLCs, CROs) never trigger the check |
| **m12-pcard-bin** | VBASS (Visa), Mastercard BIN API, BinDB | $0.001–$0.01/lookup (aggregator); VBASS vendor-gated | ~3 min for `pcard_consumer_on_institutional_claim` adjudication; est. 15–30% of academic orders | 4 caught via consumer-BIN flag (dormant-account-takeover Bypass D, dormant-domain Bypass A, inbox-compromise own card + prepaid) | BIN data accuracy only 32% for third-party sources (Pagos); non-US institutional cards (~30–40% of orders) get no P-card signal; VCNs from institutional platforms growing | False corroboration for all 7 LLC-cluster branches (fintech commercial BIN validates attacker); inherited institutional P-card corroborates unauthorized user |
| **m12-billing-shipping-consistency** | libpostal (free) or Smarty ($0.003–$0.009/order); internal rules engine | $0–$0.009/order | ~15 min for soft-flag triage; multi-campus universities are dominant FP class (~20% of orders at risk) | 4 caught (dormant-account-takeover Bypass D, dormant-domain Bypass A, account-hijack Method 2 address-change drop, credential-compromise cloned card partially) | Multi-campus/distributed institutions generate high FP volume; driving-distance attacker defeats geographic check; tokenized payments may lack billing address (5–15% of orders) | 7 LLC-cluster branches satisfy triple by construction; inherited institutional billing is geographically correct; geographic-proximity target selection |
| **m12-fintech-denylist** | Internal BIN denylist of fintech/neobank issuers; PSP metadata | $0–$0.07/check | ~5–10 min per flagged order; est. 10–25% of commercial customers trigger flag | 10 flagged (all 7 LLC-cluster branches, dormant-domain Bypass B, inbox-compromise Method 3, shell-company, shell-nonprofit) | Legitimate small biotechs use same banks as shells (Mercury 300K+ customers); BIN sponsor churn degrades denylist; inherited institutional billing and traditional-bank cards invisible | Reviewer cannot distinguish real small biotech from shell — "caught" means "flagged," not "blocked"; cross-entity correlation absent |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

Three customer/payment categories appear in every idea's coverage-gap list:

1. **Inherited institutional billing (PO/P-card/invoice by authorized payment path, unauthorized user).** AVS passes (billing address is genuinely institutional). Procurement-network confirms the relationship. P-card BIN corroborates. Billing-shipping consistency passes (addresses are genuinely institutional). Fintech-denylist does not fire (traditional institutional BIN). All five ideas validate the billing path, not the person using it. Dormant-account-takeover (Bypasses A–C), account-hijack, and credential-compromise (invoiced) all exploit this structural blind spot. This is a finding about the measure itself: M12 verifies billing-institution association, not billing-user authorization.

2. **Purpose-built organizations with aligned billing.** Shell companies, shell nonprofits, CRO-framing entities, and all LLC-cluster branches open real fintech business bank accounts whose billing addresses match their registered "institutional" addresses. AVS passes by construction. Billing-shipping consistency passes by construction. P-card BIN may corroborate (fintech commercial card). Procurement-network does not fire (self-presenting entity, no institutional claim). Only the fintech-denylist flags these entities — and even then, the reviewer cannot distinguish real small biotechs from shells. This gap affects 7 of the 13 attacker stories mapped to M12.

3. **Non-US customers.** AVS is effective only for US/CA/UK/Visa-EU issuers. Procurement-network is US-centric (PaymentWorks/JAGGAER/SAM.gov). P-card BIN is primarily a US/Canada/UK phenomenon. Fintech-denylist is US-focused. Only billing-shipping consistency works internationally, but with degraded address-normalization quality. An estimated 30–50% of synthesis customers are non-US and receive weak or no M12 signal from any idea.

### Complementary gaps

| Gap | Ideas where it is a gap | Ideas that close it |
|---|---|---|
| Invoice/PO orders (no card) | psp-avs, pcard-bin, fintech-denylist (card-only) | procurement-network (verifies supplier relationship on invoice orders), billing-shipping-consistency (compares addresses regardless of payment method) |
| Personal card on institutional order | procurement-network (validates path, not instrument) | psp-avs (AVS mismatch), pcard-bin (consumer BIN flag), billing-shipping-consistency (geographic divergence) |
| Fintech/neobank card on institutional claim | psp-avs (AVS may pass if billing matches), pcard-bin (commercial BIN may corroborate) | fintech-denylist (flags specific neobank BINs) |
| P-card HQ billing address (systematic FP) | psp-avs (AVS partial/fail), billing-shipping-consistency (metro mismatch) | procurement-network (active supplier registration overrides AVS concern) |

### Net coverage estimate

If a provider implemented all five ideas, the customer categories still in a coverage gap would be: (a) non-US institutional customers with invoice/PO billing (no card signal, no US procurement-network coverage); (b) inherited-billing-path abuse where an unauthorized user rides a legitimate institutional payment relationship; (c) purpose-built LLC entities that pass every check by construction (the fintech-denylist flags them but cannot reliably block them). Rough qualitative band: **many** (perhaps 30–40% of orders) would still fall in a coverage gap or produce ambiguous signals. The measure is strongest for US institutional customers paying by card; it degrades rapidly for non-US, non-card, and self-presenting-entity scenarios.

## 3. Bypass cross-cut

### Universally uncovered bypasses

Two bypass patterns slip through every idea's check:

1. **Inherited institutional billing by unauthorized user.** When an attacker uses a legitimate institutional PO, P-card, or invoice, all five ideas validate the billing path as genuinely institutional. No idea in the M12 suite distinguishes authorized from unauthorized users of a legitimate billing instrument. This affects dormant-account-takeover (Bypasses A–C), account-hijack (inherited payment), and credential-compromise (invoiced orders). The measure cannot address this — it requires identity-layer controls (M14, M16, M20).

2. **Geographic-proximity target selection (inbox-compromise Method 1).** The attacker selects a target institution within driving distance, ensuring the personal card's billing ZIP aligns with the institution's geographic region. AVS passes or returns a close match. Billing-shipping consistency passes (same metro). P-card BIN flags consumer card, but the geographic heuristic in manual review is defeated. This is a structural limitation of address-consistency-based verification.

### Bypass methods caught by at least one idea

| Bypass | Caught by | Not caught by |
|---|---|---|
| Substituted personal card (dormant-account-takeover Bypass D) | psp-avs, pcard-bin, billing-shipping-consistency | procurement-network (not triggered), fintech-denylist (traditional bank card) |
| Personal card at permissive provider (dormant-domain Bypass A) | psp-avs (manual review), pcard-bin, billing-shipping-consistency | procurement-network, fintech-denylist |
| LLC fintech bank account (dormant-domain Bypass B, all LLC-cluster) | fintech-denylist (flagged, not blocked) | psp-avs (passes), pcard-bin (false corroboration), billing-shipping-consistency (passes), procurement-network (not triggered) |
| Address-change to drop (account-hijack Method 2) | billing-shipping-consistency (shipping diverges from institution) | psp-avs (billing still institutional), pcard-bin (inherited P-card), procurement-network (validates path), fintech-denylist (not triggered) |
| Shell-nonprofit fintech BIN-sponsor name mismatch | fintech-denylist, psp-avs (ambiguous Plaid name match) | pcard-bin (may corroborate), billing-shipping-consistency (passes), procurement-network (may not trigger) |

### Attacker stories where every idea fails

- **account-hijack (inherited payment path):** The attacker inherits the PI's fully verified account with institutional PO/P-card on file. All five ideas validate the billing as genuinely institutional. No M12 idea detects the unauthorized user.
- **credential-compromise (invoiced order):** The attacker orders on institutional invoice, billing the institution's AP system. Procurement-network confirms the supplier relationship. All other ideas see legitimate institutional billing. No M12 idea flags this.
- **dormant-account-takeover (Bypasses A–C):** Inherited PO, invoice, or budget-code rerouting — all produce genuine institutional billing signals.

## 4. Bundling recommendations

### Recommended core bundle: psp-avs + billing-shipping-consistency + fintech-denylist

These three ideas cover complementary dimensions of billing-institution association:

- **psp-avs** provides the cheapest mass-deployable check ($0 for card AVS) and catches the substituted-personal-card pattern on every card order.
- **billing-shipping-consistency** adds the geographic-coherence dimension, catching address-change drops (account-hijack Method 2) and cross-country divergences. It also works on non-card orders where AVS is absent.
- **fintech-denylist** is the only idea that provides any signal against the LLC-cluster branches (7 attacker stories). It flags neobank BINs on institutional-claim orders, creating friction for shell-company operations even though it cannot reliably block them.

**Combined cost:** $0–$0.07/check (AVS + fintech BIN) + $0–$0.009/order (address normalization). Reviewer burden: dominated by billing-shipping-consistency false positives on multi-campus institutions (threshold tuning is load-bearing).

### Recommended add-on: procurement-network (for providers with US institutional customer base)

Include for providers where US institutional invoice/PO billing represents a significant share of orders (>20%). The procurement-network check provides the strongest available positive signal (active supplier registration requires procurement-office approval, which an attacker cannot forge). It also resolves the P-card HQ-billing false-positive problem from AVS: if the institution has an active supplier registration, the P-card AVS mismatch can be overridden.

**Limitation:** Effective scope is narrow — perhaps 15–25% of all customers. Setup cost is substantial (supplier registration across hundreds of institutions). Not justified for providers with primarily non-US or commercial customer bases.

### Not recommended for core bundle: pcard-bin

The P-card BIN check overlaps heavily with psp-avs (both detect consumer vs. institutional cards) and has a critical flaw: it produces false corroboration for all LLC-based attackers. Fintech business cards return `commercial` BIN classifications, actively validating the attacker's cover. Additionally, the load-bearing data source (VBASS) is vendor-gated with uncertain access, and third-party BIN data accuracy is only 32% (Pagos). The marginal value over psp-avs + fintech-denylist is small and comes with a counter-productive false-corroboration risk.

### Residual uncovered risk

Even the full bundle leaves three high-priority patterns uncovered:

1. **Inherited institutional billing by unauthorized user** — no M12 idea addresses user authorization. Requires M14 (identity verification), M16 (MFA/step-up), and M20 (voucher legitimacy) to mitigate.
2. **LLC-cluster entities with aligned billing** — the fintech-denylist flags them but cannot distinguish real small biotechs from shells. Requires M09 (institution legitimacy) and M18 (accreditation) for differentiation.
3. **Non-US customers** — weak or no signal from any M12 idea. Requires complementary measures operating on non-payment dimensions (M07 affiliation, M09 institution reality, M14 identity).

These residual risks confirm that M12 is a contributing signal in a multi-measure screening stack, not a standalone gate. Its value is highest when combined with institution-legitimacy (M09/M18) and identity-verification (M14) controls.
