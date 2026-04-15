# Coverage research: GLEIF LEI lookup + Level-2 relationships

## Coverage gaps

### Gap 1: Research institutions and universities — vast majority lack LEIs
- **Category:** Universities, research institutes, government labs, and small biotechs that do not participate in the financial system in ways that require an LEI. The LEI system was built for financial-sector entity identification (driven by MiFID II, EMIR, Dodd-Frank reporting).
- **Estimated size:** GLEIF has ~2.93 million active LEIs globally as of end-2025 ([source](https://www.gleif.org/en/newsroom/blog/the-lei-in-numbers-global-transparency-and-digitalization-push-drives-lei-adoption-in-2025)). There are ~4,000+ degree-granting universities in the US alone and ~30,000+ worldwide. [unknown — searched for: "GLEIF LEI universities research institutions", "how many universities have LEI", "LEI academic sector coverage"] — no published data on LEI adoption in the academic sector. [best guess: fewer than 5% of universities and research institutions worldwide have LEIs. University-affiliated hospital systems and endowment management entities are more likely to have LEIs than the universities themselves. The `no_lei` flag will fire for the vast majority of academic synthesis customers.]
- **Behavior of the check on this category:** no-signal (`no_lei` fires but is informationally meaningless because most legitimate academic institutions also have no LEI)
- **Reasoning:** The implementation correctly notes that `no_lei` is "not a stand-alone flag" and routes to alternative checks. But this means GLEIF provides zero discriminating signal for the entire academic customer segment, which is ~54% of the gene synthesis market ([source](https://www.novaoneadvisor.com/report/us-gene-synthesis-market)).

### Gap 2: Small and medium commercial entities without LEIs
- **Category:** Small biotechs, CROs, independent labs, and startups that are not required by any regulation to obtain an LEI. These entities are commercial but below the threshold where financial regulations mandate LEI registration.
- **Estimated size:** There are an estimated 300M+ businesses worldwide; GLEIF covers 2.93M ([source](https://www.gleif.org/en/newsroom/blog/the-lei-in-numbers-global-transparency-and-digitalization-push-drives-lei-adoption-in-2025)), or ~1%. Even in highly regulated jurisdictions like the EU, LEI mandates apply mainly to entities involved in financial transactions (derivatives, securities). [best guess: 90–95% of small-to-mid commercial entities that might order gene synthesis do not have LEIs.]
- **Behavior of the check on this category:** no-signal (same as Gap 1 — `no_lei` fires but is uninformative)
- **Reasoning:** The shell-company attacker's small Delaware LLC also lacks an LEI, making the `no_lei` flag unable to distinguish between a legitimate small biotech and a shell.

### Gap 3: Jurisdictions with low LEI adoption
- **Category:** Entities in countries outside the EU, US, UK, India, and Japan — particularly Africa, Latin America, and Southeast Asia — where LEI adoption is minimal due to absence of regulatory mandates.
- **Estimated size:** India has become the second-largest LEI jurisdiction driven by RBI mandates ([source](https://www.gleif.org/en/newsroom/blog/the-lei-in-numbers-global-transparency-and-digitalization-push-drives-lei-adoption-in-2025)). EU/UK adoption is driven by MiFID II/EMIR. US adoption is moderate. But Africa, Latin America, and much of Southeast Asia have negligible LEI populations. [unknown — searched for: "LEI adoption Africa Latin America", "GLEIF LEI developing countries"] — no published per-region LEI counts for these regions. [best guess: LEI coverage in sub-Saharan Africa and Latin America is <0.1% of businesses.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** An institution in Kenya, Brazil, or Vietnam is extremely unlikely to have an LEI. The check provides no signal for these jurisdictions.

### Gap 4: Level-2 relationship reporting exceptions used legitimately or strategically
- **Category:** Entities that have an LEI but file a reporting exception for Level-2 parent relationships: `NON_CONSOLIDATING`, `NO_KNOWN_PERSON`, `NON_PUBLIC`, `BINDING_LEGAL_OBSTACLES`.
- **Estimated size:** [unknown — searched for: "GLEIF Level 2 reporting exceptions percentage", "how many LEI records have reporting exceptions"] — GLEIF publishes exception categories but not aggregate counts publicly. [best guess: a significant minority (perhaps 20–40%) of LEI records do not report Level-2 relationships, either because they genuinely have no parent (e.g., top-level entities) or because they file an exception. The `NON_CONSOLIDATING` exception is available to any entity that is not part of a consolidated accounting group, which includes most standalone small entities.]
- **Behavior of the check on this category:** weak-signal (the `lei_reporting_exception_suspicious` flag fires for `NON_PUBLIC` / `BINDING_LEGAL_OBSTACLES`, but `NON_CONSOLIDATING` — the easiest exception for an attacker to file — does not trigger a flag)
- **Reasoning:** A sophisticated shell-company operator who obtains an LEI can file `NON_CONSOLIDATING` to avoid disclosing the parent, and this exception is legitimate for standalone entities. The check cannot distinguish a legitimate standalone entity from a shell hiding its parent.

### Gap 5: Name-matching ambiguity
- **Category:** Institutions whose customer-provided name does not closely match the `legalName` in GLEIF. This includes institutions with translated names (German `Universität` vs English `University`), common abbreviations (MIT, UCL, ETH), and merged/renamed entities.
- **Estimated size:** [best guess: for the ~5% of academic institutions and ~5–10% of commercial entities that do have LEIs, name-matching failures could affect 10–20% of lookups. The implementation uses fuzzy matching, but fuzzy matching has an inherent precision-recall tradeoff.]
- **Behavior of the check on this category:** false-positive (`lei_name_fuzzy_match_low_confidence` fires for a real entity) or false-negative (no match returned when one exists)
- **Reasoning:** The implementation correctly identifies this as a failure mode and plans a fuzzy-matching pipeline, but the coverage gap remains real.

## Refined false-positive qualitative

1. **Legitimate entities in concern jurisdictions** (original list item) — multinational pharma with a Cayman holding entity. True false positive on `lei_parent_in_concern_jurisdiction`.
2. **Lapsed LEIs due to administrative neglect** (original) — small companies that forget to renew. True false positive on `lei_lapsed`.
3. **NON_PUBLIC reporting exceptions for legitimate government/defense entities** (original) — triggers `lei_reporting_exception_suspicious` but is expected for defense-adjacent entities.
4. **No-LEI research institutions** (Gap 1) — `no_lei` fires for 95%+ of academic institutions. Not a false positive per se (the flag is informational), but it means the flag carries essentially zero information for the academic segment.
5. **Name-matching false positives** (Gap 5) — fuzzy match returns wrong entity or low-confidence flag for a legitimate entity.

## Notes for stage 7 synthesis

- GLEIF is fundamentally a **financial-sector** data source being repurposed for a **research-sector** screening use case. The coverage gap is structural: LEIs were designed for entities that trade financial instruments, not for entities that buy gene sequences. The check provides strong signal for the small minority of synthesis customers that are in the financial ecosystem (pharma companies with LEIs, large CROs), and near-zero signal for the academic majority.
- The check's most valuable contribution is Level-2 parent-chain analysis for entities that *do* have LEIs. For the ~1–5% of synthesis customers with LEIs, the parent-chain check can expose concern-jurisdiction holding structures. This is a high-value, low-coverage signal.
- The `no_lei` flag should be explicitly documented as "informational only; not usable as a negative signal" to prevent downstream misuse.
- GLEIF pairs well with Companies House / OpenCorporates (which cover legal existence) and ROR (which covers research institutions). GLEIF fills a niche that neither of those addresses: ownership-chain transparency for commercial entities in the financial system.
