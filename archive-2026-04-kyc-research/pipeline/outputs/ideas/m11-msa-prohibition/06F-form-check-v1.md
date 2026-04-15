# Form check: m11-msa-prohibition / 06-coverage-v1

## Schema field coverage

- **coverage_gaps:** Populated. Five gaps identified with category, size, behavior, reasoning. PASS.
- **false_positive_qualitative (refined):** Populated. Three items. PASS.

## Per-gap assessment

| Gap | Category precise? | Size cited or marked? | Behavior classified? | Verdict |
|-----|---|---|---|---|
| 1: Obfuscated/non-English crypto refs | Yes — specifies obfuscation methods | [best guess] with adversarial reasoning | Yes — no-signal | PASS |
| 2: Unscanned communication channels | Yes — names phone, unindexed email, external chat | [best guess: 20–40%]; marked [unknown — searched for] | Yes — no-signal | PASS |
| 3: MSA provides no technical prevention | Yes — scoped to all customers | 100%; cites clickwrap enforceability sources | Yes — no-signal | PASS |
| 4: Ethereum regex hex FP | Yes — specifies SHA-1, PO hex IDs | [unknown — searched for]; [best guess: 1–5 per 10k orders] | Yes — false-positive | PASS |
| 5: Crypto-researcher keyword FP | Yes — specifies CS/bio dual labs | [best guess: <0.5%]; marked [unknown — searched for] | Yes — false-positive | PASS |

## Flags

- **No bare numbers.** All estimates cited, derived, or marked. PASS.
- **Gap 2 estimate (20–40% unscanned surface)** is a broad [best guess] with thin reasoning. The search-list is plausibly thin ("B2B customer communication channel breakdown text vs phone vs email"). MINOR flag.
- **Gap 3** is arguably not a "coverage gap" in the traditional sense — it is an architectural observation about the MSA clause. Including it is defensible for completeness but it could be argued it belongs in the synthesis notes rather than the gap list. MINOR flag.

## Overall verdict

PASS with 2 MINOR flags.
