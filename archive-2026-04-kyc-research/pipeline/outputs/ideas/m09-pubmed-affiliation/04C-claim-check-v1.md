# 04C claim check — m09-pubmed-affiliation v1

## Claims verified

1. **NCBI E-utilities rate limit "3 rps without key, 10 rps with key".** Confirmed by search results: "NCBI E-Utilities API service limits the number of requests per second (rps) to 3, but you can increase the rate to 10 rps if you obtain and use an API Key" and "your API key will increase the limit to 10 requests/second." PASS.

2. **Higher rate limits available via info@ncbi.nlm.nih.gov.** Confirmed by NCBI knowledge-base article cited. PASS.

3. **bioRxiv API returns 100 articles per call across date range, accepts subject category querystring.** Confirmed by search results: "you'll get back JSON for 100 articles that fall in that range. These date range endpoints also accept a querystring parameter for subject category." PASS.

4. **bioRxiv API only exposes corresponding-author affiliation.** Confirmed by Stephen Turner blog summary: "the information it exposes about authors and their affiliations is not as complete as the information available from the website itself, and only the corresponding author's institutional affiliation is included." PASS.

5. **Rxivist as a more complete source.** Confirmed: "Some researchers have used the more complete Rxivist database, which includes affiliations for all authors." PASS.

6. **PubMed `[ad]` affiliation field tag.** Search results did not directly verify the exact `[ad]` tag in returned snippets. UPGRADE-SUGGESTED — fetch https://pubmed.ncbi.nlm.nih.gov/help/#search-tag-list to confirm the exact tag (it is the documented PubMed convention but the citation should be verified directly).

## Flags

- **UPGRADE-SUGGESTED** — verify `[ad]` tag explicitly against the PubMed help page.
- The author-homonym statistic ("about two-thirds of PubMed author names are ambiguous") is sourced from the attacker mapping context, not from the document's own search; it should be cited to its original source if quoted in the final document, not asserted as the document's own claim.

No BROKEN-URL or MIS-CITED.

**Verdict:** PASS.
