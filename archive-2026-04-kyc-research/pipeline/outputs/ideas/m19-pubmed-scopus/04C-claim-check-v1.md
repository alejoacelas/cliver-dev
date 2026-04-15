# 04C claim check — m19-pubmed-scopus v1

## Claims verified

### PASS — NCBI rate limits

3 RPS anonymous / 10 RPS with API key. Cited URL https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/ is the canonical NCBI announcement and confirms.

### PASS — Scopus commercial-use restriction

Cited dev.elsevier.com pages confirm: free API access is limited to non-commercial / academic use; commercial use requires a paid license via direct sales contact. The document accurately characterizes this.

### PASS — PubMed Affiliation field

PubMed's `[Affiliation]` search tag is documented in NBK25499 (the E-utilities Parameters page); the document's claim that affiliation strings are free-text and inconsistently attached to authors of older records is consistent with NLM's own documentation about how NLM ingests author affiliation data.

### PASS — E-utilities base URL

`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/` is correct.

## Verdict

PASS
