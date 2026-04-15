# m03-usps-rdi-cmra — bypass-aware hardening v1

- **measure:** M03 — shipping-po-box
- **idea:** USPS RDI + CMRA flag
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker-story walk

### inbox-compromise

**Summary:** Attacker compromises a dormant institutional `.edu` inbox and needs a delivery destination. The M03-mapped bypass is: USPS PO Box / hold-for-pickup ($5–$25/month, Novice).

**USPS PO Box / hold-for-pickup:**
- **CAUGHT.** USPS DPV footnotes include PO Box codes (H0/H1). `address_is_po_box` fires. The address is denied.

**CMRA / packaging-store variant (UPS Store / PMB):**
- **CAUGHT.** If the attacker pivots from a PO Box to a CMRA, USPS CMRA flag (`cmra == Y` or DPV footnote R7) fires. `address_is_cmra` triggers reviewer follow-up and likely denial.

**International address:**
- **MISSED.** USPS APIs only cover US addresses. The implementation explicitly routes international addresses to m03-smarty-melissa. Not a gap in the check per se — it is correctly scoped to US-only — but worth noting.

**Recently opened PO Box / CMRA (within DPV update lag):**
- **AMBIGUOUS.** If the attacker opens a PO Box or registers a new CMRA very recently (within the ~monthly DPV update cycle), the USPS data may not yet include it. The implementation notes this as a failure mode and suggests re-checking after the next DPV update.

**Net assessment:** Strong value for US addresses. Catches both PO Boxes and CMRAs with high confidence using USPS's authoritative dataset. The check is the ground-truth source for US address classification.

---

### Cross-check: other M03-mapped stories

Same as the other M03 ideas: only inbox-compromise explicitly nominates a PO Box. The broader deterrent effect — forcing attackers away from PO Boxes and CMRAs toward more expensive/traceable alternatives — is the check's primary value.

---

## Findings

### Minor

**m1. Enhanced Address API not yet GA — CMRA flag availability depends on endpoint version.**
- Why: The implementation notes the Enhanced Address API (which bundles CMRA explicitly) is "not yet GA as of April 2026." Until release, providers querying USPS directly need to rely on legacy DPV footnote codes (R7 for CMRA) or chain separate lookups. The footnote-based approach works but is less clean.
- Suggestion: The implementation already notes this and routes to resellers (m03-smarty-melissa) as fallback. No action needed beyond monitoring the Enhanced Address API release timeline.

**m2. USPS API ToS ambiguity for KYC use.**
- Why: The implementation notes that "Customer-screening / KYC use is not explicitly enumerated" in USPS ToS. Most providers use CASS resellers to avoid this ambiguity.
- Suggestion: The implementation already recommends resellers as the practical path. For providers with USPS direct access, confirming ToS compliance with USPS would be prudent but is outside this pipeline's scope.

**m3. DPV update lag (~monthly cycle) creates a brief window for newly registered PO Boxes/CMRAs.**
- Story: inbox-compromise (theoretical timing exploit).
- Why missed: A PO Box opened within the current DPV cycle may not yet appear in USPS data. The attacker would need to time the PO Box rental and order placement within a ~30-day window.
- Suggestion: The implementation already suggests re-checking after the next DPV update. m03-pobox-regex-sop provides defense-in-depth by catching the string-level indicator ("PO Box 123") even when DPV has not yet classified the address.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| inbox-compromise: USPS PO Box | CAUGHT |
| inbox-compromise: CMRA / packaging store | CAUGHT |
| inbox-compromise: International address | MISSED (out of scope, routed to m03-smarty-melissa) |
| inbox-compromise: Newly registered PO Box within DPV lag | AMBIGUOUS |

## bypass_methods_uncovered

- International addresses (by design — scoped to US only)
- Newly registered PO Boxes/CMRAs within the ~30-day DPV update window

---

## Verdict: **PASS**

No Critical findings. The check catches the mapped attacker story's primary bypass (USPS PO Box) and the adjacent CMRA variant with high confidence using the authoritative USPS dataset. The Minor findings are edge cases (API transition timing, ToS ambiguity, DPV update lag) that are already addressed by the implementation's fallback to m03-smarty-melissa and defense-in-depth with m03-pobox-regex-sop. Pipeline continues to stage 6.
