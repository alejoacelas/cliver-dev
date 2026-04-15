# m03-smarty-melissa — bypass-aware hardening v1

- **measure:** M03 — shipping-po-box
- **idea:** Smarty / Melissa address verification
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker-story walk

### inbox-compromise

**Summary:** Attacker compromises a dormant institutional `.edu` inbox and needs a delivery destination. The M03-mapped bypass is: USPS PO Box / hold-for-pickup ($5–$25/month, Novice).

**USPS PO Box / hold-for-pickup:**
- **CAUGHT.** Both Smarty and Melissa identify PO Boxes via DPV. Smarty's DPV footnotes include PO box codes; Melissa's `AddressType` includes PO box designation. `smarty_po_box` or `melissa_po_box` fires. The address is denied with a request for a street address.

**CMRA / packaging-store variant (UPS Store, Mail Boxes Etc.):**
- **CAUGHT.** If the attacker pivots from a PO Box to a CMRA (which appears in the M03 by-measure notes as an adjacent bypass class), Smarty's `dpv_cmra == Y` and Melissa's CMRA indicator fire. `smarty_cmra` or `melissa_cmra` flags trigger reviewer follow-up.

**International PO Box equivalent (if attacker routes delivery internationally):**
- **AMBIGUOUS.** Melissa GAV covers 240+ countries but data depth varies. The implementation notes "some African and Central Asian countries return only city-level matches." For OECD countries, coverage is likely adequate. For non-OECD, `dpv_unmatched` fires but is not a PO-box-specific signal.

**Net assessment:** Strong value for US addresses. Catches both PO Boxes and CMRAs, which are the two primary mailbox-type bypasses. International coverage varies.

---

### Cross-check: other M03-mapped stories

As with m03-pobox-regex-sop, the by-measure file notes only inbox-compromise as the M03-relevant attacker story. Other branches avoid PO Boxes precisely because they are trivially flagged. The check's deterrent value is significant — it forces attackers toward more expensive alternatives (virtual offices, incubator leases, residential addresses) that are either more traceable or caught by other measures (M04, M05).

---

## Findings

### Minor

**m1. International PO Box detection is unreliable outside OECD (theoretical).**
- Story: inbox-compromise (theoretical international variant, not explicitly mapped).
- Why missed: Melissa's international data depth varies. Non-OECD countries may return only city-level matches without address-type classification.
- Suggestion: For international addresses, combine with m03-pobox-regex-sop (which catches locale-specific PO Box strings like `Postfach`, `Casilla`, `Boîte Postale`) as a defense-in-depth layer. The regex catches what the vendor misses in underserved locales.

**m2. Brand-new addresses (within USPS DPV update cycle) may not yet be classified.**
- Why missed: USPS DPV data updates on a ~6-week cycle. A very new PO Box or CMRA opened within the last 6 weeks may not yet appear in vendor data.
- Suggestion: Combine with m03-pobox-regex-sop to catch the string-level indicator even when DPV has not yet classified the address.

**m3. Vendor pricing figures are best-guess from G2, not confirmed.**
- Why: Both Smarty and Melissa pricing figures are noted as `[best guess]` or G2 user-reported. Actual pricing may differ.
- Suggestion: Stage 4 re-research or vendor contact to confirm pricing. Low priority for hardening.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| inbox-compromise: USPS PO Box | CAUGHT |
| inbox-compromise: CMRA / packaging store | CAUGHT |
| inbox-compromise: International PO Box (OECD) | CAUGHT (likely) |
| inbox-compromise: International PO Box (non-OECD) | AMBIGUOUS |

## bypass_methods_uncovered

- International PO Box equivalents in countries with sparse Melissa coverage
- Brand-new PO Boxes / CMRAs within the 6-week USPS DPV update lag

---

## Verdict: **PASS**

No Critical findings. The check catches both PO Boxes and CMRAs for US addresses with high confidence, which covers the only explicitly mapped attacker story's bypass method. The Minor findings are edge cases (international coverage, DPV update lag) that are addressed by the companion m03-pobox-regex-sop idea and do not warrant re-research. Pipeline continues to stage 6.
