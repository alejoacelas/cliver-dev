# 04C claim check — m09-domain-auth-stack v1

## Claims verified

1. **RDAP is the official replacement for WHOIS, ICANN sunset on 28 Jan 2025.** Cited Wikipedia summary aligns with the search-result statement: "ICANN officially sunsetted the requirement for gTLD registries and registrars to maintain WHOIS services on January 28, 2025." PASS but UPGRADE-SUGGESTED to cite the ICANN announcement directly rather than via Wikipedia.

2. **`https://rdap.org/domain/{domain}` works as a federated query endpoint with no auth.** Confirmed by search results referencing rdap.org as the primary direct-protocol entry point. PASS.

3. **DomainTools Iris Tier 0 starter pricing $15,750/month for 250 queries + 1,000 WHOIS history records.** Cited G-Cloud PDF. The search result on DomainTools pricing matches these specific numbers ("Tier 0 Starter plan is priced at $15,750/month and includes 250 Queries/Month with 1000 Whois History API Records/Month"). PASS.

4. **DomainTools Tier 1 $52,500/month for 1,000 queries/month.** Same source confirms. PASS.

5. **WhoisJSON 1,000 free requests/month and WhoisFreaks 500 free credits on signup.** Confirmed by search results. PASS.

6. **MxToolbox API pricing `[unknown]`.** Search confirms there is no public per-call price listed; vendor sells "Delivery Center" subscriptions instead. PASS as a valid `[unknown]` admission, though one more query like "MxToolbox Delivery Center pricing" might find a tier table.

## Flags

- **UPGRADE-SUGGESTED** — replace Wikipedia citation for the WHOIS sunset date with an ICANN-hosted source.
- **THIN-SEARCH** (mild) — MxToolbox `[unknown]` could try one more query.

No BROKEN-URL or MIS-CITED.

**Verdict:** PASS / minor REVISE. Document is well-sourced for a v1.
