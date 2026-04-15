# m18-lookalike-domain — implementation v1

- **measure:** M18 — institution-legitimacy-soc
- **name:** Lookalike / homoglyph institutional-domain detector
- **modes:** A
- **summary:** At onboarding, take the customer's claimed institution name and email domain. Compare against the ROR canonical domain corpus using (a) UTS #39 confusables skeleton function, (b) Levenshtein ≤2, (c) `dnstwist` permutation set, and (d) certificate transparency first-seen age via crt.sh. Any near-match against a real institutional domain — combined with a recently issued first cert — produces a homoglyph/typosquat flag.

## external_dependencies

- **dnstwist** — open-source domain permutation engine ([source](https://github.com/elceef/dnstwist)). Self-hosted Python; no API.
- **ROR data dump** — full corpus of ~120k research organizations with `domains` field per record, CC0 ([source](https://ror.readme.io/docs/data-dump), [source](https://ror.org/about/faqs/)). Refreshed monthly; downloaded from Zenodo.
- **crt.sh** — Certificate Transparency search interface operated by Sectigo ([source](https://crt.sh/)). Used to obtain first-seen cert date.
- **Unicode confusables.txt (UTS #39)** — confusable character map ([source](https://unicode.org/reports/tr39/)). Used via a library such as `confusable_homoglyphs` ([source](https://pypi.org/project/confusable-homoglyphs/)) to compute the skeleton.
- **Human reviewer** — for callback to verified institutional contact when a flag fires.

## endpoint_details

- **dnstwist**: self-hosted CLI / Python module. No auth, no rate limit. `dnstwist --format json example.edu` returns the permutation set ([source](https://github.com/elceef/dnstwist)).
- **ROR data dump**: HTTPS download from Zenodo, no auth, free, CC0 license ([source](https://doi.org/10.5281/zenodo.6347574)). Approx monthly refresh; ~100MB JSON. The live ROR REST API (`https://api.ror.org/v2/organizations`) is also free and unauthenticated, ~2000 req/5min soft limit per the docs ([source](https://ror.readme.io/docs/rest-api)).
- **crt.sh**: HTTPS GET `https://crt.sh/?q=<domain>&output=json` returns JSON list of certs with `not_before` timestamps. No auth. No published rate limit; community guidance is roughly 1 request / 5s and queries on large domains may time out ([source](https://groups.google.com/g/crtsh/c/eLYR6hXej0o)). [unknown — searched for: "crt.sh terms of service commercial use", "sectigo crt.sh ToS"] — no formal ToS published; the service is community-operated.
- **Confusables library**: pip-installable, no network calls, no cost.

Auth model: none for any of the four. Suitable for backend batch lookups against an in-memory index of ROR domains.

## fields_returned

**dnstwist** per permutation ([source](https://github.com/elceef/dnstwist/blob/master/docs/dnstwist.1)):
- `fuzzer` (algorithm class: addition / bitsquatting / homoglyph / hyphenation / insertion / omission / repetition / replacement / subdomain / transposition / vowel-swap)
- `domain` (the candidate permutation)
- `dns_a`, `dns_aaaa`, `dns_mx`, `dns_ns` (resolved records, if `--registered`)
- `whois_created`, `whois_registrar`
- `ssdeep_score` (fuzzy hash similarity to original site HTML)
- `phash` (perceptual hash of screenshot, if `--phash`)
- `geoip_country`

**ROR record** (relevant subset, [source](https://ror.readme.io/docs/all-ror-fields-and-sub-fields)):
- `id` (ROR ID URL)
- `name`, `aliases`, `acronyms`, `labels`
- `domains` (array of canonical institutional domains)
- `country`, `addresses`
- `established` (year)
- `types` (Education / Facility / Company / Nonprofit / Government / etc.)
- `external_ids` (GRID, ISNI, FundRef, Wikidata)

**crt.sh per cert** (JSON output, [source](https://dev.to/0012303/crtsh-has-a-free-api-find-every-ssl-certificate-for-any-domain-with-python-2nlk)):
- `issuer_ca_id`, `issuer_name`
- `name_value` (SANs)
- `min_cert_id`, `min_entry_timestamp`
- `not_before`, `not_after`
- `serial_number`

## marginal_cost_per_check

- dnstwist: $0 (self-hosted, CPU only). Generating permutations for one domain: <1s on a single core [best guess: based on the tool's design as a fast in-memory permutation generator].
- ROR lookup: $0 (in-memory index of CC0 dump).
- crt.sh: $0 monetary, ~1–3s latency per query [best guess: the service is free, single GET; latency dominated by Postgres query on the public instance].
- Confusables skeleton: $0, microseconds.
- **Total marginal cost:** effectively $0; ~3s wall time per check.
- **setup_cost:** ~1 engineer-day to build the in-memory ROR domain index + skeleton precomputation; ROR dump refresh job; dnstwist wrapper; crt.sh client with rate-limit politeness.

## manual_review_handoff

When a flag fires, the reviewer:

1. Open the flag record showing: claimed institution + claimed domain; matched ROR record (real institution); matched permutation type (homoglyph/typo/etc.); crt.sh first-seen date for the customer's domain; WHOIS creation date.
2. Determine which case applies:
   - **Case A: homoglyph/typo of a different real institution.** Strong negative. Reject the order and add domain to internal denylist.
   - **Case B: legitimate spinout / subsidiary.** E.g., `harvard-broad.org` against `broadinstitute.org`. Verify by calling the real institution's known main number (NOT a number from the suspect domain) to confirm the relationship.
   - **Case C: aged domain with same string as a defunct institution.** Cross-check Wayback Machine; if the WHOIS creation predates the customer claim, escalate to fraud team.
3. Document the disposition in the case file (matched ROR ID, permutation type, decision, reviewer name, callback number used).

## flags_thrown

- `domain_homoglyph_match` — UTS #39 skeleton of customer domain equals skeleton of a ROR-listed domain but the raw strings differ. Action: callback verification per Case A/B above.
- `domain_levenshtein_le_2` — edit distance ≤2 to a ROR-listed domain. Action: same.
- `domain_dnstwist_match` — customer domain appears in the dnstwist permutation set generated from any ROR-listed domain. Action: same.
- `domain_recently_issued_cert` — crt.sh shows first cert <90 days ago AND any of the above three flags fired. Action: hard hold pending callback.

## failure_modes_requiring_review

- crt.sh query timeouts on common SAN strings — fall back to a secondary CT log source (e.g., Google CT API, censys.io) or mark `crt_unknown`.
- ROR record without `domains` field populated (~30% of records, [best guess: based on coverage stats from ROR community discussions; needs verification]). Cannot match by domain — fall back to name fuzzy match.
- Multi-character ambiguous Unicode where the skeleton disagrees with NFKC ([source](https://paultendo.github.io/posts/unicode-confusables-nfkc-conflict/)) — flag both interpretations.
- ROR dump staleness (up to 1 month) means brand-new institutions may not be matched.
- Internationalized (IDN/punycode) domains where the customer claim is ASCII but the registered domain is xn-- — needs both forms checked.

## false_positive_qualitative

- Legitimate spinouts and joint institutes whose names/domains adjoin a parent institution: Broad Institute vs. Harvard/MIT; Crick Institute vs. UCL/KCL/Imperial.
- Translated/transliterated foreign institutional domains where the romanization is close to a US institution by accident.
- Newly created domains for legitimate young institutions (e.g., new biotech startups using founder-affiliated naming).
- Universities with many regional campuses using slightly varying domain conventions (e.g., `med.example.edu` vs. `example.edu`).
- Hyphenation variants chosen by real institutions for SEO (`example-research.org` vs. `exampleresearch.org`).

## record_left

A "lookalike report" JSON record per check, persisted in the case management system, containing:
- Input: claimed institution name + email domain + WHOIS creation date.
- Matched ROR records (ID, name, canonical domain, score).
- Permutation matches (algorithm + matched real domain).
- Confusables skeleton (input + skeleton string).
- crt.sh first-seen date and full cert list snapshot.
- Final flag set + reviewer disposition + callback notes.

This is the auditable artifact for M18 and is sufficient evidence for both an internal SOC review and an external regulator inquiry.
