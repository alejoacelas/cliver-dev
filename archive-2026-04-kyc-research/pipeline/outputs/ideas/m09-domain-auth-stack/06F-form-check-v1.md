# 06F Form check: m09-domain-auth-stack — coverage v1

## Field-by-field verdicts

### coverage_gaps
**PASS** — Five gaps identified with precise categories, estimated sizes (citing DMARC adoption statistics, RDAP deployment data, and GDPR privacy impacts), behavior classifications, and reasoning. The gaps are well-matched to the data source (DNS + RDAP) and cover the relevant dimensions: mail-auth adoption rates, subdomain fallback for academics, ccTLD RDAP gaps, new domain age, and privacy redaction.

### false_positive_qualitative (refined)
**PASS** — Cross-references the gaps. Key insight that `domain_no_mail_auth` has an ~80% base rate among small domains is well-supported by the DMARC adoption statistics.

### Notes for stage 7 synthesis
**PASS** — Actionable guidance on the check's corroborating (not standalone) nature and the weak cost-benefit of DomainTools enrichment post-GDPR.

## Flags

### CITATION-MISSING: Gap 3 ccTLD RDAP percentage
The estimate "30–50% of ccTLDs do not have a functioning RDAP server" is a `[best guess]` with no derivation. The RDAP Deployment Dashboard is cited but no specific number was extracted from it. The `[unknown]` tag on the searched queries is correct, but the best guess lacks even a rough derivation method.

## For 4C to verify

1. The DMARC adoption figure of 18.2% from dmarcchecker.app — verify the methodology (top 10M domains by what ranking?) and currency.
2. The Cloudflare Registrar WHOIS redaction default — verify this applies to all registrants, not just EU.
3. The RDAP Deployment Dashboard at deployment.rdap.org — verify it is currently maintained and provides ccTLD-level data.

## Verdict: PASS

One minor CITATION-MISSING flag on the ccTLD RDAP percentage. The coverage research is substantive and the key finding (this check is a corroborating signal with high FP base rate on `domain_no_mail_auth`) is well-supported. No revision needed.
