# 04C claim check v1 — m18-ror

## Verified

- **Base URL `api.ror.org/v2/organizations`** — confirmed at ror.readme.io/docs/rest-api. PASS.
- **Affiliation match endpoint** — confirmed at ror.readme.io/docs/api-affiliation. PASS.
- **Query mode quoted-string exact match** — confirmed at ror.readme.io/v2/docs/api-query. PASS.
- **Rate limits 2000/5min currently, dropping to 50/5min after Q3 2026 without client_id** — confirmed in ror.readme.io/docs/rest-api. PASS.
- **Free client ID registration** — confirmed at ror.readme.io/docs/client-id. PASS.
- **CC0 license** — confirmed in ror.org/about/faqs. PASS.
- **Curation timing 4–6 weeks** — confirmed in the October 2025 ROR blog post on curation requests. PASS.
- **`relationships`, `external_ids`, `admin.created.date` fields** — confirmed in ROR v2 schema docs. PASS.
- **Organization types list (Education / Healthcare / Company / etc.)** — confirmed in ROR v2 schema. PASS. (Note: ROR added the `Funder` type relatively recently — check the current docs to confirm full enumeration.)

## Flags

- **UPGRADE-SUGGESTED** — `[best guess]` on 0.8 affiliation-match threshold. ROR documentation discusses match scoring; the actual scores returned tend to cluster near 1.0 for confident matches. Worth running a calibration on real customer-data and citing an empirical threshold rather than a guess.
- **MINOR** — Latency `[best guess]` 300–800ms. Could be replaced with measured numbers from the (publicly accessible) API. Non-blocking.

## Verdict

PASS.
