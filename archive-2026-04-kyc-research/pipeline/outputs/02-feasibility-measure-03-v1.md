# Stage 2 Feasibility — Measure 03 (shipping-po-box) — v1

Reviewing `01-ideation-measure-03-v1.md`. Two gates: concreteness, relevance. Mapping file has one story (`inbox-compromise`) with bypass = "USPS PO Box / hold-for-pickup."

---

## 1. USPS Address Information API — ZIP+4 / standardization
- **Concreteness:** PASS. Names USPS Web Tools `Verify` API and the newer `apis.usps.com` family. Researcher in stage 4 can immediately look these up.
- **Relevance:** PASS. Directly catches the named bypass (USPS PO Box).
- **Verdict: PASS.**

## 2. Smarty US Street Address API (`record_type=P`)
- **Concreteness:** PASS. Specific vendor, specific endpoint guess, specific field semantics.
- **Relevance:** PASS. Catches the bypass.
- **Verdict: PASS.**

## 3. Lob US Verifications API (`address_type=po_box`)
- **Concreteness:** PASS. Specific vendor + endpoint guess + field name.
- **Relevance:** PASS.
- **Verdict: PASS.**

## 4. Melissa Personator / Global Address (`AS09`)
- **Concreteness:** PASS. Specific vendor, specific result code.
- **Relevance:** PASS.
- **Verdict: PASS.**

## 5. Google Address Validation API (`post_box` componentType)
- **Concreteness:** PASS. Names the API, the field, and the USPS-derived data block.
- **Relevance:** PASS.
- **Verdict: PASS.**

## 6. Regex SOP pre-filter
- **Concreteness:** PASS. Names the exact regex patterns and is itself a self-contained SOP — not a category.
- **Relevance:** PASS. Catches the bypass and is the cheapest line of defense.
- **Verdict: PASS.**

## 7. USPS PO-Box-only ZIP cross-check
- **Concreteness:** PASS. Names USPS City State Product as the data file source.
- **Relevance:** PASS.
- **Verdict: PASS.**

## 8. CMRA flag (USPS Form 1583)
- **Concreteness:** PASS. Names USPS Form 1583, names how each vendor exposes the bit.
- **Relevance:** PASS. The bypass excerpt explicitly says "PO Box / hold-for-pickup," and CMRA is the hold-for-pickup analog.
- **Verdict: PASS.**

## 9. APO/FPO/DPO military mail detection
- **Concreteness:** PASS. Names PSC/Unit patterns, AA/AE/AP state codes, ZIP ranges.
- **Relevance:** Borderline. The mapping file has zero attacker stories naming military mail. The ideation agent admits this is a gap-filler. However, the measure description explicitly says "screen for PO Box," and military mail is a USPS-recognized box-equivalent that an attacker could trivially substitute for a USPS PO Box once those are flagged. I'll allow it as an attacker pattern the mapping file plausibly missed.
- **Verdict: PASS** (with the note that stage 5 should challenge whether any real attacker would actually try this).

## 10. International poste restante / Postfach detection
- **Concreteness:** PASS. Names specific terms and specific international validators (Loqate, Smarty International, Melissa Global).
- **Relevance:** PASS. The inbox-compromise persona is not necessarily US-based, and PO-box equivalents abroad are the same identity-concealment mechanism.
- **Verdict: PASS.**

---

## Gaps

- The mapping file lists only `inbox-compromise` for this measure, and the ideation set covers it well across vendor diversity (USPS-direct, Smarty, Lob, Melissa, Google), regex, ZIP-only, CMRA-adjacent, military, and international. No further uncovered attacker classes that aren't already routed to measures 04 / 05 by the stage 0 mapping note.

## Counts

- PASS: 10
- REVISE: 0
- DROP: 0

STOP: yes
