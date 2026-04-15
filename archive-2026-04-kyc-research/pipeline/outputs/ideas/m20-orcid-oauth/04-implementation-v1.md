# m20-orcid-oauth — implementation v1

- **measure:** M20 (voucher-legitimacy-soc)
- **name:** ORCID OAuth proof-of-control
- **modes:** D (deterministic — pass/fail on token receipt + downstream record check)
- **summary:** During voucher onboarding, the registered voucher is sent through an ORCID 3-legged OAuth flow. The provider receives a signed access token that proves the voucher controls the ORCID iD they claim. The provider then pulls the voucher's `/person`, `/employments`, and `/works` records and uses them as the substrate for downstream legitimacy checks (employment claim vs. customer institution; works publication evidence; recency).

## external_dependencies

- **ORCID Public API or Member API** — ORCID is a non-profit; OAuth is the binding authentication primitive. [source: [ORCID OAuth scope FAQ](https://info.orcid.org/ufaqs/what-is-an-oauth-scope-and-which-scopes-does-orcid-support/)]
- **ORCID membership** — `/authenticate` and reading public-visibility data are available on the **Public API** (free, no membership). The `/read-limited` scope (data the user marked "trusted parties only") requires the **Member API** which is paid. [source: [ORCID OAuth scopes FAQ](https://info.orcid.org/ufaqs/what-is-an-oauth-scope-and-which-scopes-does-orcid-support/)]
- **Reviewer headcount** — only when the voucher legitimately has no ORCID; otherwise the check is fully automated.

## endpoint_details

- **OAuth authorization URL:** `https://orcid.org/oauth/authorize?client_id=<APP-ID>&response_type=code&scope=/authenticate&redirect_uri=<URI>` (add `/read-limited` for member-API integrations). [source: [ORCID Custom Integration Guide](https://orcidus.lyrasis.org/2026/01/07/custom-integration-guide/)]
- **Token endpoint:** `https://orcid.org/oauth/token` (POST, exchanges `code` for access token). [source: [ORCID-Source orcid-api-web README](https://github.com/ORCID/ORCID-Source/blob/main/orcid-api-web/README.md)]
- **Record-read endpoint:** `https://pub.orcid.org/v3.0/{orcid-id}/record` (Public API) or `https://api.orcid.org/v3.0/{orcid-id}/record` (Member API). Sub-endpoints: `/employments`, `/works`, `/person`. [source: [ORCID Source README](https://github.com/ORCID/ORCID-Source/blob/main/orcid-api-web/README.md)]
- **Auth model:** OAuth 2.0 three-legged Authorization Code grant. Client must register an integration with ORCID to obtain a client_id and secret. [source: [ORCID Integration FAQ](https://info.orcid.org/documentation/integration-and-api-faq/)]
- **Rate limits:** ORCID Public API documents per-IP rate limits in the 24/sec / 60-burst range; the Member API is similar but applied per token. [unknown — searched for: "ORCID Public API rate limit per second 2025", "ORCID api.orcid.org rate limit headers"; ORCID's published rate-limit page wasn't surfaced cleanly in this round but the figures above appear in the public README and integration tutorials]
- **Pricing:**
  - Public API: **$0** (free, no membership). [source: [ORCID Membership benefits](https://info.orcid.org/membership/)]
  - Member API: institutional membership starts at roughly **$1,250–$5,500/year** for direct US membership and lower via consortia (e.g. Canada CRKN ≈ $3,500 CAD/year, UK Jisc tiered). [source: [ORCID-CA pricing context](https://www.crkn-rcdr.ca/en/how-join-orcid-ca), [UK ORCID Consortium pricing FAQ](https://ukorcidsupport.jisc.ac.uk/wp-content/uploads/sites/23/2024/09/UK-ORCID-Consortium-Pricing-2025-Member-FAQ-Updated190924.pdf)] [vendor-gated — exact US tier requires sales contact]
- **ToS:** ORCID's API ToS permits authentication and reading public records for legitimate use. The provider may store the ORCID iD and the access token but may not redistribute the record content beyond the authenticated relationship.

## fields_returned

From the OAuth token exchange (verbatim shape per ORCID docs):

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "refresh_token": "...",
  "expires_in": 631138518,
  "scope": "/authenticate",
  "name": "Sofia Garcia",
  "orcid": "0000-0001-2345-6789"
}
```

[source: [ORCID OAuth scopes FAQ](https://info.orcid.org/ufaqs/what-is-an-oauth-scope-and-which-scopes-does-orcid-support/)]

From a follow-up `GET /v3.0/{orcid}/record`:

- `person.name` (given, family, credit-name)
- `person.other-names`
- `person.emails` (only if user-visible)
- `activities-summary.employments` — list of `{organization.name, organization.disambiguated-org.disambiguation-source, organization.disambiguated-org.disambiguated-organization-identifier (often a ROR ID), department, role, start-date, end-date}`
- `activities-summary.educations` — same shape
- `activities-summary.works` — list of `{title, type, publication-date, journal-title, external-ids.doi, source}`
- `activities-summary.fundings`, `peer-reviews`, `invited-positions`, `distinctions`

The `disambiguated-organization-identifier` field is the bridge into ROR / Ringgold / GRID and is what makes the downstream M18 institution-legitimacy check possible.

## marginal_cost_per_check

- **Public API path:** **$0 marginal**. Token exchange + 1–3 record reads per voucher.
- **Compute:** negligible (<$0.001 per voucher).
- **Reviewer time:** 0 minutes if voucher has ORCID and OAuth completes; ~10 minutes if voucher refuses or has no ORCID and an alternate-evidence path is needed.
- **Setup cost:** ORCID integration registration (free). Engineering: ~1–2 weeks to build the OAuth flow, record parser, and downstream linkage. [best guess: standard OAuth + JSON ETL]
- **Member API path:** ORCID membership $1,250–$5,500/year amortized; per-check still ~$0.

## manual_review_handoff

Standard SOP:

1. After voucher form submit, if voucher claims an ORCID iD, redirect them to ORCID OAuth with `/authenticate` (or `/read-limited`).
2. Receive token; assert that the returned `orcid` matches the form-claimed ORCID iD.
3. Pull `/record`. Reject if: no `employments` records OR most-recent employment end-date is closed > 12 months ago (voucher form requires current employment).
4. Compare `employments[0].organization.disambiguated-organization-identifier` with the customer's ROR. Hand off to **m20-ror-disjointness** rule.
5. If voucher has no ORCID OR refuses OAuth: route to manual reviewer for alternate-evidence path (institutional email DKIM, faculty page lookup, peer-vouched second voucher).
6. Reviewer adjudicates: accept if voucher provides an institutional email + 1 of {published paper with affiliation matching claim, faculty page, NSF/NIH grant record}.

## flags_thrown

- `orcid_oauth_no_token` — voucher abandoned the flow.
- `orcid_id_mismatch` — token returns a different ORCID than the form claimed.
- `orcid_record_empty_employments` — ORCID exists but lists no employments.
- `orcid_record_stale_employments` — most recent employment ended >12 months ago.
- `orcid_record_employment_no_ror` — employment record lacks a disambiguated-org identifier (cannot bridge to M18).
- `orcid_record_no_works` — researcher claim with zero published works (weakens but does not fail).
- `voucher_no_orcid_claim` — voucher self-declared no ORCID; alternate-evidence SOP triggered.

## failure_modes_requiring_review

- ORCID token endpoint 5xx / network failure → retry; if persistent, fall back to alternate-evidence SOP.
- Voucher legitimately has no ORCID (common in clinical, industry, foreign-language fields).
- Voucher's ORCID record is set fully private (`/authenticate` returns iD only, no record-read possible without `/read-limited` and member API).
- Voucher employment record lists an organization that ORCID could not disambiguate (no ROR), so M18 hand-off fails.
- Token revoked between issuance and record-read.

## false_positive_qualitative

- **Industry researchers** — much lower ORCID adoption than academia. The Toulouse study found 41.8% adoption with strong discipline disparities. [source: [Toulouse adoption study](https://onlinelibrary.wiley.com/doi/full/10.1002/leap.1451)]
- **Clinicians and clinical investigators** — ORCID adoption lags publishing-heavy fields.
- **Senior PIs from pre-ORCID era** who never registered. ORCID was launched 2012; researchers who finished publishing earlier may not have an iD.
- **Researchers in regions with low ORCID adoption** (parts of LATAM, Sub-Saharan Africa, several Asian countries). [source: [ORCID coverage in institutions — Frontiers](https://www.frontiersin.org/journals/research-metrics-and-analytics/articles/10.3389/frma.2022.1010504/full)]
- **Vouchers who keep their ORCID record private** — `/authenticate` succeeds but downstream legitimacy checks fail.
- **Recently-moved researchers** whose `employments` record is stale because they have not pushed an update. ORCID employment records are user-maintained, not authoritative.

## record_left

- The OAuth access token (encrypted at rest) plus its claims: `orcid`, `scope`, `expires_in`, issuance timestamp.
- A snapshot of the relevant subsections of `/record` at the time of the check (employments + most recent works), stored as JSON in the order audit log.
- The signed JWT-style ORCID id_token if requested via OpenID Connect (ORCID supports OIDC as an extension to OAuth). [source: [ORCID Custom Integration Guide](https://orcidus.lyrasis.org/2026/01/07/custom-integration-guide/)]
- A hash of the snapshot for tamper evidence.
- Auditable artifact: the JSON snapshot is replayable years later for investigators.

## Sources

- [ORCID OAuth scopes FAQ](https://info.orcid.org/ufaqs/what-is-an-oauth-scope-and-which-scopes-does-orcid-support/)
- [ORCID Custom Integration Guide](https://orcidus.lyrasis.org/2026/01/07/custom-integration-guide/)
- [ORCID-Source orcid-api-web README](https://github.com/ORCID/ORCID-Source/blob/main/orcid-api-web/README.md)
- [ORCID Integration & API FAQ](https://info.orcid.org/documentation/integration-and-api-faq/)
- [ORCID Membership benefits](https://info.orcid.org/membership/)
- [ORCID-CA pricing](https://www.crkn-rcdr.ca/en/how-join-orcid-ca)
- [UK ORCID Consortium pricing FAQ 2025](https://ukorcidsupport.jisc.ac.uk/wp-content/uploads/sites/23/2024/09/UK-ORCID-Consortium-Pricing-2025-Member-FAQ-Updated190924.pdf)
- [Toulouse ORCID adoption study](https://onlinelibrary.wiley.com/doi/full/10.1002/leap.1451)
- [ORCID coverage in institutions — Frontiers](https://www.frontiersin.org/journals/research-metrics-and-analytics/articles/10.3389/frma.2022.1010504/full)
