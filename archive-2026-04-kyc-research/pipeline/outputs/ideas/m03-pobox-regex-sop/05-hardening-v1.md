# m03-pobox-regex-sop — bypass-aware hardening v1

- **measure:** M03 — shipping-po-box
- **idea:** PO Box / APO regex + reviewer SOP
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker-story walk

### inbox-compromise

**Summary:** Attacker compromises a dormant institutional `.edu` inbox and needs a delivery destination that does not require physical presence on campus.

**USPS PO Box / hold-for-pickup ($5–$25/month, Novice):**
- **CAUGHT.** The `regex_po_box` pattern matches `PO Box`, `P.O. Box`, `P O Box`, and related variants. If the attacker enters a PO Box address in the shipping field, the regex fires and the address is rejected with a request for a street address.

**Obfuscation variants (P 0 Box, P-O-Box, zero-vs-O substitution):**
- **AMBIGUOUS.** The implementation notes that the regex "tolerates spaces and dots but not zero-substitution." An attacker using `P 0 Box` (zero instead of letter O) would bypass the regex. The implementation acknowledges this gap and suggests a Levenshtein-based fallback "at low cost" but does not implement it.

**Unicode lookalike variants (Cyrillic Р, fullwidth Ｐ):**
- **AMBIGUOUS.** The implementation notes this as a failure mode ("form-injection via Unicode lookalikes") but the regex does not normalize Unicode. An attacker using `Ｐ.Ｏ. Ｂｏｘ` (fullwidth characters) would bypass.

**Net assessment:** Catches the straightforward PO Box entry. Ambiguous on deliberate obfuscation. The attacker story describes a Novice-level attacker unlikely to use Unicode tricks, so the practical catch rate is high for this specific story. But the obfuscation gaps exist for more skilled attackers.

---

### Cross-check: other M03-mapped stories

The by-measure file notes that M03 is "narrowly engaged across the branch set" — only inbox-compromise explicitly nominates a PO Box as a delivery method. The notes section explains: "Most branches that build a fake institution use commercial addresses (virtual offices, coworking, incubators, makerspaces, freight forwarders, residential homes framed as labs) precisely because PO Boxes are trivially flagged."

This means the check achieves its intended deterrent effect: attackers avoid PO Boxes because they know this check exists. The check's value is partly in forcing attackers toward more expensive and traceable alternatives (virtual offices, incubator leases).

---

## Findings

### Minor

**m1. Zero-vs-O substitution bypasses the regex (1 story).**
- Story: inbox-compromise (obfuscation variant).
- Why missed: The regex patterns use literal `o` / `O` and do not account for digit `0` substitution. `P 0 Box` or `P.0. Box` would not match.
- Suggestion: Add `[o0]` character class in place of `o` in the English patterns. Minimal engineering cost. Alternatively, implement the Levenshtein fallback noted in the implementation.

**m2. Unicode lookalike characters bypass the regex (theoretical).**
- Story: inbox-compromise (theoretical escalation).
- Why missed: No Unicode normalization (NFKC) before regex matching. Fullwidth Latin, Cyrillic lookalikes, and other confusable characters bypass.
- Suggestion: Apply NFKC normalization to the address string before regex. Python `unicodedata.normalize('NFKC', s)` collapses fullwidth to ASCII. Very low engineering cost.

**m3. Eastern European and CJK PO Box equivalents are not covered.**
- Why missed: The regex covers EN, DE, ES, FR, PT, NL but not PL (`skrytka pocztowa`), CZ (`poste restante`), JP, CN, KR, etc. The implementation notes this as a known gap.
- Suggestion: Add patterns for major missing locales. Low priority — most DNA synthesis customers in these regions would use Latin-script forms, and USPS/Smarty would catch US addresses.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| inbox-compromise: USPS PO Box (standard format) | CAUGHT |
| inbox-compromise: PO Box with zero-vs-O substitution | AMBIGUOUS |
| inbox-compromise: PO Box with Unicode lookalikes | AMBIGUOUS |

## bypass_methods_uncovered

- Zero-vs-O and similar character substitution in PO Box strings
- Unicode lookalike characters (fullwidth, Cyrillic)
- Eastern European / CJK PO Box equivalents

---

## Verdict: **PASS**

No Critical findings. The check catches the one explicitly mapped attacker story's primary bypass method (straightforward PO Box entry). The obfuscation gaps are Minor — the mapped attacker is Novice-level and unlikely to employ them, and the broader attacker population avoids PO Boxes precisely because this class of check exists. The three Minor findings are low-cost fixes for stage 4 re-research if desired, but do not warrant a full re-research loop. Pipeline continues to stage 6.
