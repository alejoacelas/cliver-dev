# m19-pubmed-scopus — Implementation v1

- **measure:** M19
- **name:** PubMed (NCBI E-utilities) + Scopus Author API cross-source author lookup
- **modes:** A
- **summary:** Use NCBI E-utilities (ESearch / EFetch on PubMed) and the Elsevier Scopus Author Search API as a second-source corroboration to OpenAlex (m19-openalex-author). Submit `Author[Author]` and `Affiliation[Affiliation]` queries; verify the customer's name + claimed institution returns at least one indexed work, and that the author's most recent affiliation matches the claim.

## external_dependencies

- **NCBI E-utilities** (US NIH/NLM) for PubMed. Free, public, no commercial restrictions. [source](https://www.ncbi.nlm.nih.gov/books/NBK25497/)
- **Elsevier Scopus Search API + Author Search API.** Free *only* for academic / non-commercial use; commercial KYC use requires a paid commercial license from Elsevier. [source](https://dev.elsevier.com/)
- For DNA-synthesis providers (commercial entities), Scopus is **vendor-gated commercial license**; PubMed is freely usable.

## endpoint_details

### NCBI E-utilities (PubMed)

- **Base URL:** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`
- **Search authors by name + affiliation:** `GET esearch.fcgi?db=pubmed&term=Doe+Jane[Author]+AND+%22Stanford+University%22[Affiliation]&retmode=json&api_key=...`
- **Fetch records:** `GET efetch.fcgi?db=pubmed&id=<PMID>&retmode=xml&api_key=...`
- **Auth model:** anonymous (3 RPS) or free API key (10 RPS, registered via NCBI account → settings → API key management). Higher rates by emailing info@ncbi.nlm.nih.gov with justification. [source](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/)
- **Rate limits:** 3 RPS without key, 10 RPS with key, applied across all E-utility endpoints under the same key/IP. [source](https://www.ncbi.nlm.nih.gov/books/NBK25497/)
- **Pricing:** Free.
- **ToS:** NLM data use is permissive; bulk-download requires use of the FTP rather than E-utilities; commercial use is allowed.

### Scopus (Elsevier)

- **Base URL:** `https://api.elsevier.com/content/`
- **Author Search:** `GET search/author?query=AUTHLAST(Doe)+AND+AUTHFIRST(Jane)+AND+AFFIL(Stanford)`
- **Author Retrieval:** `GET author/author_id/{scopus_author_id}?view=ENHANCED`
- **Auth model:** API key + institutional token (the institutional token enables remote / commercial access). [source](https://dev.elsevier.com/)
- **Rate limits:** [vendor-gated — Elsevier publishes per-API weekly quotas (e.g., Author Search has historically been ~5,000 requests/week with rate limit ~6 RPS) on the dev portal; specific 2026 numbers behind login. [unknown — searched for: "Scopus Author Search API rate limit weekly quota 5000"]](https://dev.elsevier.com/)
- **Pricing for commercial KYC use:** [vendor-gated — Elsevier requires direct sales contact for commercial API licenses; pricing not published. Free tier is academic-only, "non-commercial use" only.](https://dev.elsevier.com/)
- **ToS constraints:** Commercial use of Scopus data requires a paid agreement; the academic free tier explicitly prohibits commercial use, including KYC for a commercial customer-screening pipeline.

## fields_returned

### PubMed (per ESummary / EFetch on PubMed XML) [source](https://www.ncbi.nlm.nih.gov/books/NBK25499/)

- `PMID`, `Title`, `Journal`, `PubDate`, `EPubDate`
- `AuthorList`: each author has `LastName`, `ForeName`, `Initials`, `AffiliationInfo[]` (free-text affiliation per author per paper)
- `MeshHeadingList[]` — usable for topic-vs-order alignment
- `GrantList[]` — grant numbers + funding agencies
- `ArticleIdList`: PMID, DOI, PMC ID

### Scopus Author Search (per Elsevier Author Retrieval ENHANCED view)

- `dc:identifier` (Scopus Author ID)
- `preferred-name`, `name-variants`
- `affiliation-current` (institution name + Scopus Affiliation ID)
- `affiliation-history[]`
- `subject-areas[]` (ASJC codes)
- `coredata.document-count`, `coredata.cited-by-count`, `h-index`
- `orcid` (if linked)

[vendor-described, exact field-by-field schema is in the Scopus API spec at dev.elsevier.com behind the developer-portal login]

## marginal_cost_per_check

- **PubMed:** $0. 1 ESearch + optionally 1 EFetch per customer.
- **Scopus:** [vendor-gated — commercial license is the load-bearing cost; per-customer marginal cost is approximately $0 once licensed, but the license itself is significant. [best guess: low five figures USD/year for a commercial Scopus API agreement, by analogy to other Elsevier commercial product agreements; could be much higher for a large provider]
- **setup_cost:** PubMed integration ~1 engineer-day. Scopus integration ~1 engineer-week + license procurement ([best guess: 2–6 months sales cycle with Elsevier]).

## manual_review_handoff

Reviewer packet:
1. Customer claim (name, institution, research area).
2. PubMed search results: PMIDs, titles, years, AuthorList affiliations matching the claim.
3. Scopus author candidate (if licensed): Scopus Author ID, h-index, document count, current affiliation, ORCID linkage.
4. Cross-source agreement: does the OpenAlex / ORCID / PubMed / Scopus picture line up?

**Reviewer playbook:**
1. **All sources agree** on a real author with matching institution → strong positive, proceed.
2. **PubMed has matching publications, OpenAlex/ORCID don't** → likely a researcher under-indexed by OpenAlex; verify on PubMed manually and proceed.
3. **No sources have a match** → does not by itself deny; route to institutional verification (m18) and direct customer follow-up.
4. **Sources disagree** (e.g., PubMed shows author at Institution X, customer claims Y) → contact customer for clarification; possible recent move.

## flags_thrown

- `no_pubmed_author` — zero PMIDs returned for `Author[Author] AND Institution[Affiliation]`.
- `no_scopus_author` — zero Scopus Author hits.
- `pubmed_affiliation_stale` — newest PMID with the claimed institution is older than 3 years.
- `pubmed_topic_mismatch` — PubMed MeSH headings do not overlap the order's life-sciences area.

## failure_modes_requiring_review

- PubMed `Affiliation[Affiliation]` is free-text and only attached to *recent* (post-2014ish) records consistently; older records often only have a single affiliation for the first author. Affiliation queries can have low recall.
- Author name disambiguation in PubMed is weak (no native author IDs until very recently).
- E-utilities 429s on burst — retry with backoff.
- Scopus institutional token expiry / VPN-bound IP issues (token tied to subscriber IP ranges).
- Scopus license absence → entire Scopus path inoperable; fall back to PubMed-only.
- Non-life-sciences researchers (chemistry, physics, engineering) under-represented in PubMed (which is biomedical).

## false_positive_qualitative

- **Researchers outside biomedicine.** PubMed indexes biomedical literature. Bench biologists and clinicians are well-covered; bioengineers, computational biologists publishing in CS venues, and chemists are under-represented.
- **Industry scientists** rarely publish in PubMed-indexed venues.
- **Early-career researchers** with no first-author papers yet.
- **Researchers using transliterated or hyphenated names** that don't match the PubMed AuthorList format.
- **Researchers whose institution name has changed** or whose affiliations on past papers list the lab name instead of the parent institution.
- **Commercial DNA-synthesis provider lacking Scopus license:** the Scopus signal is structurally unavailable. Implementation must degrade gracefully to PubMed-only.

[best guess: PubMed-only check has high false-positive rate on non-biomedical and industry populations — comparable to or higher than OpenAlex, since PubMed scope is narrower]

## record_left

- ESearch query string + JSON response (PMID list).
- For each matched PMID: the EFetch XML record (especially the AuthorList with AffiliationInfo).
- Scopus Author ID + Author Retrieval JSON (if used).
- Reviewer notes + decision.
- Stable URLs: `https://pubmed.ncbi.nlm.nih.gov/<PMID>/` for each cited paper.

## attacker_stories_addressed (refined)

- `ghost-author` — partial: catches the persona only if no PMIDs exist under the name+institution combination. Same blind spot as OpenAlex but narrower (PubMed indexes fewer venues than OpenAlex).
- `it-persona-manufacturing` — partial: an attacker who manufactures a persona without seeding a PubMed-indexed publication will fail; one who lists themselves as a coauthor on a real lab paper will pass.

[best guess: PubMed adds confidence as a second source alongside OpenAlex but does not detect bypasses that OpenAlex misses; Scopus, if licensed, similarly corroborates but is hard to justify on its own given the commercial license cost]
