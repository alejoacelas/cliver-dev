# m03-pobox-regex-sop — 04C claim check v1

This document makes few empirical claims since it's pure regex, but the locale tokens warrant verification:

- **`Postfach` = German PO box.** Universally documented (Deutsche Post). `PASS`.
- **`Casilla` (ES/LATAM), `Apartado` (ES/PT)** — both are correct PO-box-equivalent words in Spanish-language postal systems (`Casilla` more common in Chile/Argentina, `Apartado` in Spain/Mexico/Colombia). `PASS`.
- **`Boîte Postale` / `BP`** — La Poste's PO box term. `PASS`.
- **`Caixa Postal`** — Brazilian PT PO box. `PASS`.
- **`Postbus`** — Dutch PostNL PO box. `PASS`.
- **APO/FPO/DPO region codes AE / AP / AA** — Defined by the US DoD / USPS for Armed Forces Europe, Pacific, and Americas respectively. `PASS`.

No claims that cite a URL; all are well-known postal terminology not requiring a citation. **No CITATION-MISSING flags** because the document is intentionally derivation-based, not source-based.

**Verdict: PASS**
