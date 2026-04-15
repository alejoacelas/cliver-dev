# m02-rdap-age — implementation v1

- **measure:** M02
- **name:** RDAP/WHOIS domain age + registrant
- **modes:** D, A
- **summary:** For the customer's email domain, query an RDAP server (via the RDAP.org bootstrap) and parse the JSON response for `events` (registration / last-changed / transfer dates), `entities` (registrant), and `status`. Flag domains <12 months old, recently transferred, or with registrant entirely redacted on a domain that claims to be a recognized institution.

## external_dependencies

- **RDAP** — open standard, free. Bootstrap at `https://rdap.org/` redirects to the authoritative registry RDAP server for each TLD ([RDAP.org](https://about.rdap.org/); [ICANN RDAP](https://www.icann.org/rdap/)). gTLD registries and registrars have been required to support RDAP since 2019, and ICANN sunsetted the WHOIS contractual obligation on 28 January 2025 ([Wikipedia: RDAP](https://en.wikipedia.org/wiki/Registration_Data_Access_Protocol)).
- **Fallback WHOIS** — for ccTLDs that have not yet deployed RDAP (e.g., several non-Anglophone ccTLDs). `[best guess: ~30% of ccTLDs still WHOIS-only as of 2025]`.

## endpoint_details

- **URL:** `GET https://rdap.org/domain/<domain>` → 302 redirect to the authoritative registry's RDAP endpoint (e.g., `https://rdap.verisign.com/com/v1/domain/<domain>` for `.com`) ([RDAP.org](https://about.rdap.org/)).
- **Auth:** none. Public.
- **Format:** JSON, RFC 9083 / 7483 schema.
- **Rate limits:** Per-registry. Verisign and other large registries are tolerant; smaller TLDs sometimes throttle. `[unknown — searched for: "RDAP rate limit Verisign", "RDAP throttling per TLD", "rdap.org rate limit"]`. `[best guess: a single KYC check per customer order is well within any rate limit.]`
- **ToS:** No commercial-use restriction; RDAP was specifically designed to replace WHOIS for programmatic access. ICANN's policy is that registrars MUST publish RDAP and serve it without discrimination ([ICANN RDAP](https://www.icann.org/rdap/)).
- **Pricing:** $0. Optional commercial wrappers (WhoisXML API ~$0.001/query) exist but are not required.

## fields_returned

From RDAP JSON (RFC 9083):
- `handle` — registry's internal ID
- `ldhName` — the domain name in ASCII
- `status[]` — e.g. `client transfer prohibited`, `redemption period`
- `events[]` — array of `{eventAction, eventDate}` where `eventAction` ∈ {`registration`, `last changed`, `expiration`, `transfer`, `last update of RDAP database`}
- `entities[]` — registrar, registrant, admin, tech contacts. For most gTLDs registrant fields are now redacted under GDPR/ICANN policy and `entities[].vcardArray` contains placeholder values; the `roles` array still tells you which contact was redacted.
- `nameservers[]` — NS hostnames

Derived:
- `domain_age_days` — today minus `registration` event date
- `last_transfer_date` — most recent `transfer` event, if any
- `registrant_redacted` — bool

## marginal_cost_per_check

- **Per check:** $0 against public RDAP. `[best guess: <$0.0001 amortized.]`
- **Setup cost:** ~1 engineer-day to integrate. The `rdap` Python library (`pip install rdap`) handles bootstrap and parsing.

## manual_review_handoff

Reviewer sees: domain, claimed institution, registration date, last transfer, registrant (or "[redacted]"), registrar.

1. If `domain_age_days < 365` and customer claims a long-established institution → high suspicion; ask for institutional letter.
2. If `last_transfer_date < 365 days ago` AND domain age >2y → possible drop-catch / dormant-domain reanimation (matches `dormant-domain` attacker story). Cross-check Wayback (m02-wayback) and PubMed for citations.
3. If registrant entirely redacted AND domain has no other corroborating institutional signal → ask customer for an institutional letter on the claimed-institution letterhead.
4. If RDAP query fails for the TLD → fall back to WHOIS via `python-whois`.

## flags_thrown

| Flag | Trigger | Action |
|---|---|---|
| `domain_age_lt_12mo` | `domain_age_days < 365` | Elevate, request affiliation evidence |
| `domain_age_lt_3mo` | `< 90 days` | Elevate immediately, hold order |
| `domain_recent_transfer` | last `transfer` event within 365d on a >2y old domain | Cross-check Wayback + PubMed |
| `registrant_redacted` | All registrant vcard fields redacted under GDPR/ICANN | Soft flag — most modern gTLDs redact by default; combine with other signals |
| `rdap_unavailable` | RDAP bootstrap fails for TLD | Fallback to WHOIS |

## failure_modes_requiring_review

- ccTLDs without RDAP (e.g., as of 2025 some ccTLDs still WHOIS-only) `[unknown — searched for: "ccTLD RDAP coverage 2025", "which ccTLDs have RDAP"]`.
- Very recent transfers visible in `events` but not in `entities` (the registrant doesn't change in the visible record) — distinguishable from drop-catch only by Wayback corroboration.
- Privacy services (Domains by Proxy, etc.) hide registrant on legitimate small orgs.

## false_positive_qualitative

- New legitimate startups (most biotech startups have <12mo domains for the first year). The `dmarc_p_none` + `domain_age_lt_12mo` combo will trip on a real Y Combinator-stage biotech with high confidence — this check is **not safe to use as a single auto-deny gate**, only as a contributor to a manual review queue.
- GDPR-redacted registrants are now the default for `.com`/`.org`/most gTLDs since 2018; `registrant_redacted` is barely informative on its own.

## record_left

- Full RDAP JSON response (or WHOIS text fallback)
- Parsed `domain_age_days`, `last_transfer_date`, `registrant_redacted`
- Bootstrap path used (which authoritative RDAP server answered)

## attacker_stories_addressed

- `dormant-domain` — primary signal: a recently transferred long-existing domain is the drop-catch fingerprint (matches the branch's "WHOIS-history check flagging recent registrant changes on old domains" caveat).
- `lookalike-domain` — caught when domain is freshly registered.
- `shell-company` / `cro-framing` — caught only in the first ~6 months; defeated by the explicit "domain age padding" tactics in the attacker file (6–12 months pre-aging or aged-auction purchase).
