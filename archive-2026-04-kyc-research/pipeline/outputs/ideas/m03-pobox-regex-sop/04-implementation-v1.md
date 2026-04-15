# m03-pobox-regex-sop — implementation v1

- **measure:** M03
- **name:** PO Box / APO regex + reviewer SOP
- **modes:** D
- **summary:** Pure deterministic regex over the raw shipping-address string and structured fields, matching `PO Box`, `P.O. Box`, `POB`, `Postfach` (DE), `Casilla` (ES/LATAM), `Apartado` (ES/PT), `Boîte Postale`/`BP` (FR), `Caixa Postal` (PT-BR), `Postbus` (NL), плюс APO/FPO/DPO military codes. Catches misformatted entries that bypass DPV (e.g., user types "PO Box 123" into a street-line field where USPS API parses but other vendors don't, or international locales unsupported by USPS).

## external_dependencies

- Internal regex library (own code). No vendor.
- No network calls.

## endpoint_details

- **Endpoint:** N/A — runs in-process at order-submission time.
- **Auth:** N/A.
- **Rate limit:** none — local regex.
- **Pricing:** $0 marginal; engineering only.

## fields_returned

Internal struct:
- `regex_hit` — bool
- `match_token` — the matched substring
- `language_variant` — `en_us`, `de`, `es`, `fr`, `pt`, `nl`, `apo_military`, `dpo`
- `field_matched` — which submitted field (street1, street2, city, recipient)

Reference patterns (case-insensitive, with word boundaries):

```
(?i)\b(p\.?\s*o\.?\s*box|post\s*office\s*box|p\.?o\.?\s*b(ox)?)\b   # English
(?i)\bpostfach\b                                                     # German
(?i)\b(casilla(\s+postal)?|apartado(\s+postal)?)\b                   # Spanish/Portuguese
(?i)\b(bo[iî]te\s+postale|\bbp\s*[\-\s]?\d)                          # French BP
(?i)\bcaixa\s+postal\b                                               # Portuguese-BR
(?i)\bpostbus\b                                                       # Dutch
(?i)\b(apo|fpo|dpo)\s+(ae|ap|aa)\b                                   # US military mail
```

## marginal_cost_per_check

- **Per check:** $0. Microseconds of CPU.
- **Setup cost:** ~0.5 engineer-day to assemble + unit-test the locale variants. Ongoing maintenance trivial.

## manual_review_handoff

1. Any regex hit → fail address, present customer with "we cannot ship to PO boxes / military addresses; please supply a street address."
2. If customer escalates with a legitimate need (deployed researcher, foreign correspondent, hold-for-pickup), reviewer asks for institutional affiliation and supervisor contact, per the M03 measure-level "Direct follow-up re: institutional affiliation" follow-up wording.
3. If `match_token` is in a non-English locale not in the country of the rest of the address (e.g., `Postfach` in a US-claimed address) → suspicious; elevate.

## flags_thrown

| Flag | Trigger | Action |
|---|---|---|
| `regex_po_box` | Any English/EU PO box variant matches | Fail address, ask for street |
| `regex_apo_fpo` | APO/FPO/DPO + region code | Fail; military mail follow-up |
| `regex_locale_mismatch` | Locale of matched token doesn't fit country | Elevate |

## failure_modes_requiring_review

- A street address that legitimately contains "Box" as part of a building name (rare).
- Locale variants the regex doesn't cover (Eastern European, CJK characters).
- Customer obfuscation: "P 0 Box", "P-O-Box", zero-vs-O substitution. The regex above tolerates spaces and dots but not zero-substitution; reviewers should be aware. `[best guess: a small evasion-tolerant version using levenshtein over the keyword could be added at low cost.]`
- Form-injection via Unicode lookalikes (Cyrillic Р, fullwidth Ｐ).

## false_positive_qualitative

- Genuine street names like "Box Hill Road" — mitigated by requiring `box` to be preceded by `PO`/`P.O.` (the patterns above already do this) but `PO Box` could appear in a poetic street name `[best guess: extremely rare]`.
- Dutch addresses where `Postbus` is a legitimate institutional mailing address used alongside a visiting address — the regex will flag, the SOP must accept the visiting address as the operative one.
- Non-English language hits inside translated UI fields.

## record_left

- The matched regex token, the field it matched in, and the raw address string with the match highlighted. Stored alongside the order record.

## attacker_stories_addressed

- `inbox-compromise` (the only m03-mapped attacker story that explicitly nominates a USPS PO Box) — caught by `regex_po_box`.
- This idea is a defense-in-depth backstop to USPS RDI / Smarty CMRA detection, catching addresses that misformat in ways those vendors miss.
