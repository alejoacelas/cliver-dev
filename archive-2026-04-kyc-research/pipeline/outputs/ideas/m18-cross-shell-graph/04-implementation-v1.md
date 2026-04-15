# m18-cross-shell-graph — implementation v1

- **measure:** M18 (institution-legitimacy-soc)
- **name:** Cross-shell rotation graph
- **modes:** A
- **summary:** Maintain an internal graph database that stores, for every prior screened institution, a small set of "fingerprint" nodes (registered agent, officer/director, WHOIS registrant, certificate-transparency cert serial/issuer, GLEIF parent, NIH PI, hosting fingerprint). When a new customer arrives, project their fingerprints onto the graph and flag any new entity that shares ≥2 fingerprints with a prior entity, especially with one that has been previously denied or escalated. Targets cro-identity-rotation, shell-company rotation, and CRO-framing attacks where the same operator stands up serial shells.

## external_dependencies

- **Internal graph store** — Neo4j, Postgres+pg_graph, or Memgraph. Vendor-neutral.
- **Companies House officers + PSC API** ([developer.company-information.service.gov.uk officers/PSC reference](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/persons-with-significant-control)). UK officer / PSC fingerprints.
- **OpenCorporates** for US SOS officer/agent fingerprints (same staleness caveat as the m18-companies-house-charity idea).
- **GLEIF Level 2 RR-CDF Concatenated File** for parent/ultimate-parent edges ([GLEIF Level 2 page](https://www.gleif.org/en/lei-data/access-and-use-lei-data/level-2-data-who-owns-whom); [GLEIF Golden Copy / Concatenated download](https://www.gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file)) and [GLEIF API](https://www.gleif.org/en/lei-data/gleif-api).
- **Censys Search API** for hosting / TLS / cert fingerprint pivots ([Censys pricing](https://censys.com/resources/pricing/)).
- **crt.sh / SSLMate CT search** for certificate transparency lookup ([crt.sh](https://crt.sh/); [SSLMate CT search API](https://sslmate.com/ct_search_api/)).
- **WHOIS / RDAP** for domain registrant fingerprints (RDAP is the IETF-standard replacement for WHOIS; integration covered in m02 ideas).
- **NIH RePORTER** for NIH PI fingerprints (covered in m18-nih-reporter as a sibling idea; this idea consumes those fingerprints).
- Internal screening history database — provides the prior-customer entity nodes.

## endpoint_details

### Companies House officers + PSC
- **Officers endpoint:** `GET /company/{company_number}/officers` ([Officers API reference](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/officers/list)).
- **PSC endpoint:** `GET /company/{company_number}/persons-with-significant-control` ([PSC API reference](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/persons-with-significant-control/list)).
- **Bulk PSC snapshot:** [download.companieshouse.gov.uk/en_pscdata.html](https://download.companieshouse.gov.uk/en_pscdata.html), JSON format.
- **Auth:** API key (free).
- **Rate limit:** 600 requests / 5 min (shared with the rest of the CH API).
- **Pricing:** free.

### OpenCorporates
- See the m18-companies-house-charity idea for endpoint, auth, pricing. Officer endpoint returns officers per company; agent fields exposed per US SOS sources.

### GLEIF
- **API:** [https://api.gleif.org/api/v1/](https://api.gleif.org/api/v1/) per the [GLEIF API page](https://www.gleif.org/en/lei-data/gleif-api). Supports search by entity name, BIC, parent/child relationship lookup.
- **Bulk:** Level 2 RR-CDF Golden Copy / Concatenated File downloadable per [GLEIF download page](https://www.gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file). XML format, RR-CDF v2.1 schema.
- **Auth:** anonymous.
- **Pricing:** free.

### Censys Search
- **URL:** [https://search.censys.io/](https://search.censys.io/); API at `https://search.censys.io/api/v2/`.
- **Coverage:** "400 million+ hosts, 7 billion+ certificates, updated continuously" per industry summary.
- **Auth:** API key.
- **Pricing:** Censys has a free tier for limited queries; paid commercial tiers for higher volume per [Censys pricing page](https://censys.com/resources/pricing/). `[vendor-gated — public free tier exists; commercial pricing requires sales contact for quotas matching production screening volume.]`

### crt.sh
- **URL:** [https://crt.sh/?q=<domain>&output=json](https://crt.sh/?q=example.com&output=json) for JSON.
- **Auth:** none ("No API key is required — Certificate Transparency logs are public records mandated by RFC 6962").
- **PostgreSQL access:** `psql -h crt.sh -p 5432 -U guest certwatch` for direct queries.
- **Pricing:** free.
- **Operator:** maintained by Sectigo.
- **Rate limits:** soft / not formally published; the host occasionally drops connections under heavy use. `[best guess: low-tens of queries per minute is safe; bulk usage should fall back to SSLMate CT search ($1,000/month per [SSLMate pricing](https://sslmate.com/ct_search_api/)) or to a self-hosted CT log mirror.]`

### SSLMate CT Search
- **Pricing:** $1,000/month for full feed; provisioned indexes from $100/month per domain per [SSLMate](https://sslmate.com/ct_search_api/).
- **Auth:** API key.
- **Use case:** stable replacement for crt.sh under production loads.

## fields_returned

The graph construction normalizes a small set of fingerprint types:

- **Registered agent / formation agent** (string from CH PSC, OpenCorporates SOS data, or third-party KYB)
- **Officer / director name + DoB month-year** (CH officers endpoint includes month/year of birth; full DoB is redacted in public data)
- **PSC / beneficial owner name + nationality**
- **Address line + postcode** (registered office)
- **GLEIF parent LEI + ultimate parent LEI**
- **Domain registrant** (RDAP / WHOIS — see m02-rdap-age idea)
- **CT cert serial + issuer** (crt.sh JSON: `id`, `serial_number`, `issuer_name`, `name_value` SAN list, `not_before`, `not_after`)
- **Hosting fingerprint** (Censys: IP, ASN, JARM, port-services tuple)
- **NIH PI ORCID / first-author identifier** (NIH RePORTER, fed by sibling idea)
- **Edge type:** `shares_X` for each fingerprint type, `prior_screened_status` for the entity node ('clean' / 'flagged' / 'denied').

## marginal_cost_per_check

- **CH, GLEIF, crt.sh, NIH RePORTER:** $0.
- **OpenCorporates:** as per m18-companies-house-charity (`[best guess: $0.05–$0.50 per company]`).
- **Censys:** depends on tier; `[best guess: $0.01–$0.10 per host pivot at moderate paid-tier volume; $0 if low-volume free tier suffices]`.
- **SSLMate CT search** (if used in lieu of crt.sh): $1,000/month flat → effectively $0 marginal at any reasonable customer volume per [SSLMate pricing](https://sslmate.com/ct_search_api/).
- **Composite per check:** `[best guess: $0.10–$1 per customer when all sources are queried, dominated by OpenCorporates and Censys.]`
- **Setup cost:** dominated by graph engineering — schema, ingestion pipelines, fingerprint normalization, fuzzy matching for officer-name variants, and historical backfill of all prior screened customers. `[best guess: $80K–$300K initial; $30K-$100K/year ongoing.]`
- **Storage cost:** small at this fingerprint granularity even for hundreds of thousands of customers; `[best guess: <$500/month for the graph store at this scale.]`

## manual_review_handoff

When `cross_shell_shared_*` fires:

1. Reviewer is shown a "linked-entity panel": the new customer node, the prior entity it shares fingerprints with, and the specific fingerprint edges with their values side-by-side.
2. Reviewer evaluates each shared fingerprint:
   - **Mass-formation agent address** (e.g., a Delaware registered-agent service that formed thousands of LLCs): low signal, expected for legitimate Delaware companies. Discount unless paired with a stronger fingerprint.
   - **Shared officer name** (with DoB month-year match if available): medium-to-high signal.
   - **Shared CT cert serial:** very high signal — same actual cert deployed across two entities.
   - **Shared hosting fingerprint** (same JARM, same IP block): medium signal.
   - **Shared NIH PI:** medium signal — could be a legitimate PI on multiple grants.
   - **Shared GLEIF parent:** high signal if in a concern jurisdiction.
3. Reviewer reads the prior entity's screening verdict and notes.
4. **Two or more independent (non-mass-formation) fingerprint matches:** escalate to biosecurity officer; deny or hold.
5. **One strong fingerprint match (CT cert, GLEIF parent in concern jurisdiction):** escalate.
6. **All matches are mass-formation noise:** clear with documented note.
7. Add the new customer to the graph regardless of decision so future cross-shell pivots can find it.

## flags_thrown

- `cross_shell_shared_agent` — registered agent / formation agent matches a prior entity. Discounted for known mass-formation agents.
- `cross_shell_shared_officer` — officer / director name match (with DoB component if available).
- `cross_shell_shared_hosting` — Censys / hosting fingerprint match.
- `cross_shell_shared_pi` — NIH PI / ORCID match across nominally distinct institutions.
- `cross_shell_shared_cert` — CT certificate serial number / SAN list overlap.
- `cross_shell_shared_gleif_parent` — GLEIF Level 2 parent or ultimate parent match.
- `cross_shell_shared_address` — registered office address line + postcode match (with mass-formation discount).

## failure_modes_requiring_review

- **Mass-formation registered agents.** A small number of US registered-agent services file thousands of LLCs each year; agent matches there are noise.
- **Shared-PI false positives.** Real PIs collaborate across institutions; legitimate joint appointments produce shared-PI edges.
- **Common-name collisions.** "John Smith" director matches are noise without a DoB component.
- **CH PSC redaction.** UK PSC data redacts full DoB and partial address; reduces match precision.
- **OpenCorporates staleness.** US SOS officer data may be months out of date.
- **Hosting noise.** Two unrelated entities sharing a major cloud provider IP block (AWS, Cloudflare) is meaningless; the graph must filter out cloud-tenant noise.
- **Initial cold-start.** The graph is only useful in proportion to the historical customer base it covers. New providers gain little value until they have a year or two of data.
- **Fuzzy-matching tuning.** False-positive vs false-negative tradeoff is non-trivial and needs ongoing tuning.

## false_positive_qualitative

- Two real biotech startups in the same Boston/RTP/Bay Area incubator that legitimately share a hosting provider, registered agent, and even a common technical co-founder.
- Spinouts from a parent institution that legitimately share the GLEIF parent and several officers.
- Members of a consortium that all use the same CRO (which legitimately appears as their "registered agent" in some flows).
- Researchers with very common names across institutions.
- Two companies acquired by a common holding company that legitimately share parent LEI and officers.

## record_left

- Per check: graph query result, list of matched edges with their fingerprint values, prior entity status snapshot.
- Reviewer's adjudication memo: which edges they discounted and why.
- Mass-formation-discount list (the actual filter the system applied) versioned over time.
- Append-only history of graph state at the time of each decision (so audits can re-run prior decisions against the historical graph rather than the current one).
- Sufficient artifact set for an audit to reconstruct the cross-shell signal at the moment of decision.

## Sourcing notes

- Companies House PSC and officer endpoints are directly documented. PSC bulk JSON snapshot is also documented.
- GLEIF Level 2 RR-CDF parent/child semantics are directly documented at [GLEIF Level 2 page](https://www.gleif.org/en/lei-data/access-and-use-lei-data/level-2-data-who-owns-whom).
- Censys / crt.sh are well-known infrastructure-pivot tools; Censys pricing detail beyond the free tier is vendor-gated.
- SSLMate's pricing is publicly listed at [sslmate.com/ct_search_api/](https://sslmate.com/ct_search_api/).
- The "two or more independent fingerprints" decision rule is a design choice, not a citation.
