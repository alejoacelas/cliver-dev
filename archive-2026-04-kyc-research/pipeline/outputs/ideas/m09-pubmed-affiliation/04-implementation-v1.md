# m09-pubmed-affiliation — implementation v1

- **measure:** M09 — institution-real-life-sciences
- **name:** PubMed (NCBI E-utilities) + bioRxiv affiliation history
- **modes:** A
- **summary:** Search PubMed via NCBI E-utilities and bioRxiv via its REST API for publications affiliated with the customer's institution name in the last 5 years. Counts of publications and the recency profile constitute positive evidence of real life-sciences research activity at that institution.

## external_dependencies

- NCBI E-utilities (`esearch.fcgi`, `efetch.fcgi`, `esummary.fcgi`) ([source](https://www.ncbi.nlm.nih.gov/books/NBK25497/))
- NCBI API key (free) ([source](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/))
- bioRxiv API ([source](https://api.biorxiv.org/))

## endpoint_details

- **NCBI E-utilities (PubMed):** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=...` — REST + XML/JSON, no auth required, free. **Rate limit: 3 requests/second without API key, 10 requests/second with a free API key** ([source](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/)). Higher limits available by emailing info@ncbi.nlm.nih.gov ([source](https://support.nlm.nih.gov/kbArticle/?pn=KA-05318)). Affiliation search uses the `[ad]` field tag, e.g. `term="Stanford University"[ad] AND ("2021/01/01"[dp]:"2026/04/01"[dp])`. The `[ad]` Affiliation field is documented in the PubMed help documentation ([source](https://pubmed.ncbi.nlm.nih.gov/help/#search-tag-list)).
- **bioRxiv API:** `https://api.biorxiv.org/details/biorxiv/{interval}/{cursor}/{format}` — REST + JSON, no auth, no rate limit officially published [unknown — searched for: "biorxiv api rate limit", "biorxiv api throttle requests"]. Returns 100 articles per call across a date range; date-range queries can be filtered by subject category ([source](https://api.biorxiv.org/)). **Important caveat:** the bioRxiv API exposes only the *corresponding author's* affiliation, not all author affiliations ([source](https://blog.stephenturner.us/p/exploring-the-biorxiv-api-with-r-httr2-rvest-tidytext-datawrapper)). For full author affiliations researchers historically used the Rxivist scrape ([source](https://rxivist.org/)).
- **ToS:** NCBI E-utilities permitted for any use including commercial; users must register a tool name and email; bulk usage should observe the rate limits. bioRxiv data is CC-BY-licensed.

## fields_returned

- **PubMed esearch:** count, list of PMIDs matching the affiliation+date query.
- **PubMed efetch (Medline XML):** PMID, title, abstract, authors with affiliation strings (each author's `<AffiliationInfo><Affiliation>...</Affiliation></AffiliationInfo>`), journal, publication date, MeSH terms, grant numbers, DOI, language.
- **bioRxiv `details` endpoint:** doi, title, authors, author_corresponding, author_corresponding_institution, date, version, type, license, category, jatsxml, abstract, published_doi (when journal-published), server ([source](https://api.biorxiv.org/)).

## marginal_cost_per_check

- $0 marginal (both APIs free).
- One PubMed affiliation search + abstract pull is typically 2–10 e-utility calls. At 10 req/sec with API key, easily fits within budget.
- bioRxiv search across 5 years requires paginating ~5 × 365 / 100 ≈ 18 calls per institution at worst, or building a local mirror. **For high-volume screening, mirroring bioRxiv (~few GB) is the right architecture.**
- **Setup cost:** ~3–5 engineering days for the e-utility wrapper, name normalization, bioRxiv mirror.

## manual_review_handoff

- Reviewer receives: customer's stated institution name, name variants tried (with and without "University of", "Inc", "Institute", etc.), counts of PubMed hits per year for the last 5 years, sample of recent paper titles + author lists + DOIs, bioRxiv counts.
- Playbook:
  1. **>10 PubMed papers in last 5 years matching the institution name with no apparent collisions:** strong positive, pass.
  2. **5–10 papers, but the affiliation strings show variation that could be a near-collision with a better-known institution (the shell-nonprofit attacker pattern):** flag `affiliation_collision_risk`. Reviewer manually disambiguates by reading 2–3 papers' full author affiliation strings and confirming the address matches the customer's claimed address.
  3. **0–4 papers in last 5 years:** flag `no_pubmed_affiliation_5yr`. Reviewer falls back to other M09 signals; many real labs (engineering departments, computational labs, brand-new labs, foreign non-Anglophone labs) legitimately have low PubMed counts.
  4. **bioRxiv-only hits, no PubMed:** moderate signal — bioRxiv has much weaker editorial/screening barriers than PubMed-indexed journals; recent attacker stories explicitly cite bioRxiv preprint seeding as cheap. Reviewer should not weight this strongly.

## flags_thrown

- `no_pubmed_affiliation_5yr` — < 5 PubMed papers matching the institution affiliation in the last 5 years.
- `affiliation_collision_risk` — multiple distinct addresses appear in author affiliations for the same name, suggesting a name-collision pattern.
- `pubmed_thin_biorxiv_present` — bioRxiv hits but no PubMed-indexed publications. Weak signal due to bioRxiv's low barrier.

## failure_modes_requiring_review

- **Name normalization** — affiliation strings in PubMed are unstructured free text. "Stanford University" vs "Stanford Univ." vs "Stanford School of Medicine" vs "Department of Genetics, Stanford University, CA, USA" all represent the same institution; the `[ad]` field does fuzzy matching but accuracy is imperfect.
- **Author-name homonyms / transliteration ambiguity** — search results indicate "About two-thirds of PubMed author names are vulnerable to homonym/synonym ambiguity; East Asian names are the most ambiguous" (per the foreign-institution attacker mapping). Affiliation matching helps disambiguate at the institution level but not the individual-researcher level.
- **Brand-new institutions** legitimately have no 5-year history.
- **Coverage gap on non-English literature** — PubMed indexes English-dominant biomedical journals; non-English regional research may be underrepresented.
- **NCBI rate-limit 429s** under bursty load — handled with exponential backoff.
- **bioRxiv API only returns corresponding-author affiliation**, missing co-authored work where the customer's institution is on a non-corresponding author.

## false_positive_qualitative

- Brand-new institutions (real, < 5 years old) trip `no_pubmed_affiliation_5yr`.
- Non-Anglophone institutions whose work appears in regional journals not indexed by PubMed.
- Pure-engineering / pure-bioinformatics labs whose publications appear in CS/engineering venues (NeurIPS, IEEE, ACM) not in PubMed.
- Industry CROs whose work is contracted, IP-locked, and never published.
- Small biotech startups that have not yet published.
- Common-word institution names (e.g., "Genomic Research Institute") that match many unrelated papers — `affiliation_collision_risk` is structurally noisy here.

## record_left

- The exact e-utility query strings, the count and PMID list, and the bioRxiv DOIs returned. Stored in customer file with timestamp.

## bypass_methods_known

[deferred to stage 5]

## bypass_methods_uncovered

[deferred to stage 5]

---

**Sources cited:**
- NCBI E-utilities general intro: https://www.ncbi.nlm.nih.gov/books/NBK25497/
- NCBI API key announcement (rate limits): https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/
- NCBI enhanced rate limit request: https://support.nlm.nih.gov/kbArticle/?pn=KA-05318
- PubMed search field tags help: https://pubmed.ncbi.nlm.nih.gov/help/#search-tag-list
- bioRxiv API: https://api.biorxiv.org/
- bioRxiv API affiliation limitations (Stephen Turner blog): https://blog.stephenturner.us/p/exploring-the-biorxiv-api-with-r-httr2-rvest-tidytext-datawrapper
- Rxivist (full author affiliations scrape): https://rxivist.org/
