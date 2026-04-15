# m02-dangling-dns — implementation v1

- **measure:** M02
- **name:** Dangling-DNS / drop-catch detector
- **modes:** A
- **summary:** For a customer's email/affiliation domain, detect (a) DNS records pointing to abandoned cloud resources (S3, Heroku, Azure endpoints, GitHub Pages) that an attacker could claim, and (b) recently drop-caught domains where ownership has changed. Cross-reference Tranco rank delta and CT-log first-seen to spot domains repurposed from prior owners. Addresses the dormant-domain and dangling-dns attacker branches.

- **external_dependencies:**
  - `dnsReaper` (Punk Security) — open-source subdomain takeover scanner with signatures for AWS Route53, Azure, BIND, Cloudflare, Digital Ocean, etc. [source](https://github.com/punk-security/dnsReaper).
  - Alternative scanners: `subjack`, `SubOver`, Nuclei takeover templates [source](https://github.com/haccer/subjack).
  - `crt.sh` Certificate Transparency log search — provides "first seen" certificate timestamps for any domain [source](https://crt.sh/).
  - Tranco list (daily) — research-oriented domain popularity ranking, daily file by 00:00 UTC, also queryable via API and Google BigQuery [source](https://tranco-list.eu/).
  - WHOIS / RDAP feed for registration date + recent transfer detection (separate idea m02-rdap-age handles registration age; this idea reuses the registrar-change signal).

- **endpoint_details:**
  - **dnsReaper:** Self-hosted, runs as a Python tool or Docker container; takes a list of domains/subdomains and emits JSON findings. No SaaS endpoint — vendor distributes via GitHub MIT-licensed [source](https://github.com/punk-security/dnsReaper). Cost: $0 license, compute only.
  - **crt.sh:** Public web search at https://crt.sh; query interface accepts `?q=<domain>&output=json` for JSON results. No auth, no documented rate limit (best practice: throttle to 1 req/sec to avoid blocks). Run by Sectigo as a public good [source](https://crt.sh/).
  - **Tranco:** Daily list download at https://tranco-list.eu/top-1m.csv.zip; metadata API at https://tranco-list.eu/api/lists/date/{YYYYMMDD}; Python package `tranco` on PyPI; BigQuery dataset `tranco.daily.daily` [source](https://tranco-list.eu/), [source](https://pypi.org/project/tranco/). Free for research; commercial use should check ToS.
  - **WHOIS/RDAP:** Free public RDAP servers (one per TLD); rate limits vary; for high volume use a paid aggregator (DomainTools, SecurityTrails, WhoisXMLAPI) — covered separately in m02-rdap-age.

- **fields_returned:**
  - dnsReaper JSON finding: domain, record type (CNAME / A / NS), pointed-to target, signature matched (e.g., "AWS S3 bucket not found"), severity, confidence [source](https://github.com/punk-security/dnsReaper).
  - crt.sh JSON: certificate ID, issuer, common name, name value (SANs), not_before, not_after, entry_timestamp [source](https://crt.sh/).
  - Tranco: rank, domain, list_id (date), historical ranks [source](https://tranco-list.eu/).
  - Combined signal: `(domain, ct_first_seen_date, current_rank, rank_30d_ago, dangling_records[])`.

- **marginal_cost_per_check:**
  - dnsReaper scan of one domain's DNS tree: ~$0 (compute only) [best guess: <$0.001 in EC2 time].
  - crt.sh query: free; ~1 req/customer.
  - Tranco lookup: free; rank query against locally cached daily file is $0.
  - Total per check: ~$0 marginal; setup_cost = build the orchestration + reviewer queue [best guess: 1–2 engineer-weeks].
  - At scale or for higher SLA: paid aggregator like SecurityTrails or DomainTools, [vendor-gated for pricing — typically four-to-five-figure annual subscriptions].

- **manual_review_handoff:**
  1. Findings land in queue with: customer domain, dangling records detected (with claim signature), CT first-seen vs domain registration date gap, Tranco rank delta over 30 days.
  2. Reviewer pulls WHOIS/RDAP history (DomainTools, SecurityTrails) to confirm registrant change.
  3. Reviewer pulls archive.org snapshots to compare prior content vs current (drop-catch indicator).
  4. If dangling record is on the customer's *primary mail* subdomain (mx., mail., authoritative), high suspicion → block + escalate to m02 affiliation reviewer.
  5. If dangling record is on a peripheral subdomain unrelated to the affiliation claim, downgrade to "advisory" and keep in audit log only.
  6. If domain was clearly drop-caught (large gap in CT logs, content discontinuity), require additional affiliation evidence before approving.

- **flags_thrown:**
  - `dangling_dns_target` — at least one DNS record points to an unclaimed cloud resource on the customer's affiliation domain → reviewer correlates with WHOIS history.
  - `drop_catch_recent` — Tranco rank disappeared then reappeared, or CT first-seen date is recent on a domain claiming long history → reviewer requires further affiliation evidence.
  - `ct_first_seen_recent` — first CT certificate <90 days old for a domain presented as established institutional → soft flag.

- **failure_modes_requiring_review:**
  - False positives on legitimate cloud migrations: a real institution that recently moved blog.uni.edu to a new S3 bucket may show transient dangling state.
  - dnsReaper signature lag: new cloud services may not yet have detection rules.
  - crt.sh occasionally lags for very fresh certificates.
  - Tranco only ranks the top 1M; small institutional domains are typically unranked (no signal either way).
  - Wildcard DNS (*.uni.edu → cloud LB) generates many false-positive findings.
  - Subdomain enumeration is incomplete; relies on CT logs to discover names.
  - Punycode / IDN domains require normalization.

- **false_positive_qualitative:**
  - Universities mid-cloud-migration with stale CNAMEs.
  - Legitimate small institutions with unranked Tranco entries that look "new" but are not.
  - Domains that recently switched DNS providers (creates new CT certs but same owner).
  - Customers using a personal `.io` or `.dev` domain that genuinely is recent and benign.
  - Heritage research institutions whose domain just expanded into a new TLD (e.g., .ai, .science) that look "drop-caught" because the rank history is short.

- **record_left:**
  - Per check: dnsReaper JSON output, crt.sh query response, Tranco rank lookup, archive.org snapshot reference, computed signal summary.
  - Reviewer disposition with timestamped notes.
  - All artifacts hashed and stored for audit (forensic value if a domain is later confirmed compromised).

## For 4C to verify
- That dnsReaper is MIT-licensed and lists the named cloud signatures.
- crt.sh JSON output endpoint format.
- Tranco daily file URL and Python package existence.
