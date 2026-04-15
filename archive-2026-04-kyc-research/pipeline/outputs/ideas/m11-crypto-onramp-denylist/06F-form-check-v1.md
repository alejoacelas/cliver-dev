# Form check: m11-crypto-onramp-denylist / 06-coverage-v1

## Schema field coverage

- **coverage_gaps:** Populated. Four gaps identified with category, size, behavior, reasoning. PASS.
- **false_positive_qualitative (refined):** Populated. Two items. PASS.

## Per-gap assessment

| Gap | Category precise? | Size cited or marked? | Behavior classified? | Verdict |
|-----|---|---|---|---|
| 1: Unlisted crypto-card programs | Yes — specifies new/regional/rebranded programs | [best guess: 15–30% evasion]; underlying count marked [unknown — searched for] | Yes — no-signal | PASS |
| 2: Crypto cards reported as `debit` | Yes — names specific products | [unknown — searched for]; [best guess: 2–4 of ~10 programs] | Yes — no-signal | PASS |
| 3: Referrer suppression | Yes — specifies browser behavior and on-ramp policy | [best guess: <5%]; cites web.dev referrer policy reference | Yes — no-signal | PASS |
| 4: Non-card crypto paths | Yes — specifies stablecoins, wire, P2P | Scoped out by design; notes sibling coverage | Yes — no-signal | PASS |

## Flags

- **No bare numbers.** All estimates are cited, derived with [best guess], or marked [unknown — searched for]. PASS.
- **Gap 1 evasion estimate (15–30%)** is a [best guess] without strong backing. The reasoning is sound (manual curation lag) but the range is wide. MINOR flag.

## Overall verdict

PASS with 1 MINOR flag (wide range on Gap 1 evasion estimate).
