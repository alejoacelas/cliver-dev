# m03-pobox-regex-sop — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | PO Box / APO regex + reviewer SOP |
| **measure** | M03 — shipping-po-box |
| **attacker_stories_addressed** | `inbox-compromise` (CAUGHT: standard PO Box format). Obfuscation variants (zero-vs-O substitution, Unicode lookalikes) are AMBIGUOUS. The broader attacker population avoids PO Boxes precisely because this class of check exists — the check's deterrent effect forces attackers toward more expensive alternatives (virtual offices, incubator leases, freight forwarders). |
| **summary** | Pure deterministic regex over the raw shipping-address string, matching PO Box variants in 7 language families (English, German, Spanish, Portuguese, French, Dutch) plus US military APO/FPO/DPO codes. Catches misformatted entries that bypass the primary address-validation vendors (USPS RDI, Smarty, Melissa). Runs in-process at order submission with zero marginal cost. A defense-in-depth backstop, not a standalone gate. |
| **external_dependencies** | None. Internal regex library, own code. No vendor, no network calls. |
| **endpoint_details** | N/A — runs in-process at order-submission time. No auth, no rate limit, no ToS, $0. |
| **fields_returned** | Internal struct: `regex_hit` (bool), `match_token` (matched substring), `language_variant` (en_us / de / es / fr / pt / nl / apo_military / dpo), `field_matched` (which form field: street1, street2, city, recipient). |
| **marginal_cost_per_check** | $0. Microseconds of CPU. Setup: ~0.5 engineer-day to assemble and unit-test locale variants. Ongoing maintenance trivial. |
| **manual_review_handoff** | SOP: (1) Any regex hit → fail address, present customer with "we cannot ship to PO boxes / military addresses; please supply a street address." (2) If customer escalates with legitimate need (deployed researcher, foreign correspondent, hold-for-pickup), reviewer asks for institutional affiliation and supervisor contact per M03 measure-level follow-up wording. (3) If match token locale doesn't fit the address country → suspicious, elevate. |
| **flags_thrown** | `regex_po_box` (any English/EU PO box variant — fail address, ask for street); `regex_apo_fpo` (APO/FPO/DPO + region code — fail, military mail follow-up); `regex_locale_mismatch` (locale of matched token doesn't fit country — elevate). |
| **failure_modes_requiring_review** | Street addresses legitimately containing "Box" as part of building name (rare — regex requires PO prefix). Locale variants not covered (Eastern European, CJK). Character substitution obfuscation (zero-for-O, Unicode lookalikes). Form injection via Cyrillic or fullwidth characters. |
| **false_positive_qualitative** | (1) Legitimate researchers at institutions with PO Box as official mailing address (<2% of customers — field stations, rural institutions, forwarding services); SOP handles via escalation. (2) Dutch institutions using `Postbus` as official mailing address alongside a visiting address (~1-2% of Netherlands-based customers); SOP must accept visiting address. (3) "Box" in street names: negligible — regex requires PO prefix. |
| **coverage_gaps** | (1) Non-covered language variants: CJK (Chinese 信箱, Japanese 私書箱, Korean 사서함), Arabic (ص.ب), Russian (а/я), Turkish (P.K.), Polish (skrytka pocztowa), and others; [best guess: 20-40% of synthesis customers outside covered-language countries; CJK addresses ~10-20% of international orders]. (2) Deliberate obfuscation: zero-vs-O, Unicode lookalikes, creative phrasing ("Post Office Lock Box"); [best guess: <1% of legitimate customers; relevant for attacker model]. (3) Legitimate PO Box institutions: ~8.5% of USPS delivery points are PO boxes; [best guess: <2% of synthesis customers have PO Box as only viable address]. |
| **record_left** | Matched regex token, field it matched in, raw address string with match highlighted. Stored alongside order record. |
| **bypass_methods_known** | inbox-compromise standard PO Box entry (CAUGHT). |
| **bypass_methods_uncovered** | Zero-vs-O and similar character substitution (AMBIGUOUS). Unicode lookalike characters — fullwidth, Cyrillic (AMBIGUOUS). Eastern European / CJK PO Box equivalents (no signal). Note: most attacker stories avoid PO Boxes entirely, using commercial addresses instead — the check's deterrent value exceeds its direct detection value. |

---

## Section 2: Narrative

### What this check is and how it works

This check applies a set of deterministic regular expressions to the customer's shipping address at order-submission time, scanning for PO Box indicators in seven language families and US military mail codes. The patterns match English variants (PO Box, P.O. Box, POB, Post Office Box), German (Postfach), Spanish (Casilla, Apartado), French (Boite Postale, BP), Portuguese (Caixa Postal), Dutch (Postbus), and APO/FPO/DPO military codes with their region identifiers (AE, AP, AA). When a pattern matches, the address is rejected and the customer is prompted to provide a street address. The check runs entirely in-process with no external dependencies, no network calls, and no marginal cost. It is a defense-in-depth backstop behind the primary address-validation services (USPS RDI, Smarty, Melissa), catching addresses that those vendors miss due to misformatting or international-locale gaps.

### What it catches

The check catches the one explicitly mapped attacker story — `inbox-compromise`, where the attacker compromises an institutional email and attempts to ship to a USPS PO Box as a delivery destination that does not require physical presence on campus. Any standard-format PO Box entry is caught immediately. Beyond direct detection, the check exerts a deterrent effect: the broader attacker population avoids PO Boxes because they know this class of check exists, forcing them toward more expensive and traceable alternatives like virtual offices, coworking spaces, and incubator leases. The stage 5 hardening report confirms that "most branches that build a fake institution use commercial addresses precisely because PO Boxes are trivially flagged."

### What it misses

The check has three categories of gaps. First, non-covered language variants: PO Box equivalents in Chinese, Japanese, Korean, Arabic, Russian, Turkish, Polish, and other languages are not matched. This affects an estimated 20-40% of international synthesis customers outside the covered-language countries, though the primary address-validation vendors (Smarty, Melissa) may catch some via their own address-type classification. Second, deliberate obfuscation: an attacker who substitutes zero for the letter O ("P 0 Box"), uses Unicode lookalike characters (Cyrillic or fullwidth Latin), or employs creative phrasing can bypass the regex. The implementation acknowledges these gaps and suggests Levenshtein-based fuzzy matching and NFKC Unicode normalisation as low-cost fixes, but neither is implemented. Third, the check has no leverage on the vast majority of attacker stories, which use street addresses (virtual offices, incubators, residential addresses framed as labs) — but this is by design, as those addresses are the domain of the companion ideas m03-smarty-melissa and m03-usps-rdi-cmra.

### What it costs

Effectively zero. The check has no marginal cost (microseconds of CPU, no network calls, no vendor dependency). Setup cost is approximately half an engineer-day to assemble and unit-test the locale variants. Ongoing maintenance is trivial — new patterns can be added as needed. This is the lowest-cost idea in the entire pipeline.

### Operational realism

When a match fires, the customer sees an immediate rejection message asking for a street address. No human reviewer is involved unless the customer escalates. The escalation SOP is straightforward: the reviewer asks for institutional affiliation and supervisor contact, and if the customer has a legitimate need (deployed researcher, hold-for-pickup), the reviewer can approve with documentation. False-positive volume is low — estimated under 2% of customers have a PO Box as their only viable receiving address (primarily rural field stations). The audit trail is minimal: the matched regex token, the field it appeared in, and the raw address string with the match highlighted, stored alongside the order record.

### Open questions

The main unresolved question is whether to extend the regex to CJK and Arabic PO Box equivalents. This would close the largest coverage gap but requires careful testing across multiple writing systems. The Levenshtein-based fuzzy matching and NFKC Unicode normalisation suggested by the implementation are low-cost enhancements that would close the obfuscation gaps for minor engineering effort. Neither has been implemented or benchmarked. The international customer base percentage is [unknown] — no synthesis-industry-specific data on the fraction of orders from non-covered-language countries was found.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 returned PASS with three Minor findings.
- **Stage 5 Minor finding m1:** Zero-vs-O character substitution bypasses the regex. Fix: add `[o0]` character class in English patterns or implement Levenshtein fallback. Minimal engineering cost.
- **Stage 5 Minor finding m2:** Unicode lookalike characters (Cyrillic, fullwidth) bypass the regex. Fix: apply NFKC normalisation (`unicodedata.normalize('NFKC', s)`) before matching. Very low engineering cost.
- **Stage 5 Minor finding m3:** Eastern European and CJK PO Box equivalents not covered. Lower priority — most synthesis customers in those regions use Latin-script forms, and primary vendors (Smarty, USPS) cover US addresses.
- **[unknown — searched for: "DNA synthesis gene synthesis international orders percentage non-US customers"]:** International customer fraction and CJK order percentage are unsupported. Affects sizing of coverage gap 1.
- **No [vendor-gated] fields** — this idea has no external dependencies.
- **06-coverage note:** Risk/reward strongly favours deployment even with language gaps, given the $0 cost and low FP rate. The check's deterrent value (forcing attackers away from PO Boxes toward more expensive, traceable alternatives) may exceed its direct detection value.
