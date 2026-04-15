# m02-wayback — implementation v1

- **measure:** M02
- **name:** Wayback first-seen + content history
- **modes:** A
- **summary:** Query the Internet Archive Wayback CDX server for the customer's email domain, get the timestamp of the first capture and a sample of recent captures, fetch the recent captures' rendered text, and check whether the page has changed category over the past 12 months (parking → research lab is the diagnostic pattern for `dormant-domain` and `drop-catch` attacker stories).

## external_dependencies

- **Internet Archive Wayback CDX API** — free, public ([Wayback APIs](https://archive.org/help/wayback_api.php); [CDX server README](https://github.com/internetarchive/wayback/blob/master/wayback-cdx-server/README.md)).
- **LLM or text classifier** to detect "content category change" between two snapshots. `[best guess: a small classifier or even an LLM call costing ~$0.001 per call is sufficient.]`

## endpoint_details

- **CDX search:** `GET https://web.archive.org/cdx/search/cdx?url=<domain>&output=json&limit=1` (first capture); `&limit=-5` for the most-recent 5 captures ([CDX server README](https://github.com/internetarchive/wayback/blob/master/wayback-cdx-server/README.md)).
- **Capture fetch:** `GET https://web.archive.org/web/<timestamp>/<url>` returns the snapshot. The `id_` modifier (`/web/<timestamp>id_/<url>`) returns the original captured HTML without IA's header injection.
- **Auth:** none. Public endpoints.
- **Rate limits:** Internet Archive imposes informal soft limits — no published number, but heavy scraping triggers IP block. `[unknown — searched for: "Wayback CDX rate limit", "Internet Archive CDX throttling", "wayback-cdx-server requests per second"]`. Practical advice in IA forums is to keep requests under ~10/s and use exponential backoff. `[best guess based on common IA usage advice]`.
- **ToS:** Internet Archive ToS permits research and verification use; commercial-bulk-resale is restricted. KYC use against per-customer queries is well within ToS. ([archive.org/about/terms.php] — `[unknown — searched for: "Internet Archive terms of service commercial use", "wayback machine API terms"]`)
- **Pricing:** $0 to IA. Internal LLM cost ~$0.001/check `[best guess]`.

## fields_returned

CDX returns fields: `urlkey`, `timestamp` (YYYYMMDDhhmmss), `original`, `mimetype`, `statuscode`, `digest`, `length`. JSON output is array-of-arrays with header.

Derived:
- `first_seen_date` — earliest `timestamp`
- `last_seen_date`
- `total_captures` — count over CDX history
- `gap_max_days` — longest interval between captures (proxy for dormancy)
- `recent_captures[]` — sampled HTML+text bodies for classification
- `content_pivot_detected` — bool from before/after classifier

## marginal_cost_per_check

- **Per check:** ~$0.001 amortized (1 LLM call for content classification). CDX itself is free.
- **Setup cost:** ~1 engineer-day for the CDX wrapper + classifier prompt.

## manual_review_handoff

1. If `first_seen_date` is more recent than the customer's claimed institution founding date by >2 years → flag `domain_too_new_for_claim`.
2. If there is a `gap_max_days > 365` followed by recent captures → dormant-domain reanimation pattern. Cross-check m02-rdap-age `last_transfer_date`.
3. If most-recent capture's classified content differs from a 12-month-prior capture (parking → lab; SEO spam → research; unrelated business → biotech) → `recent_content_pivot`. High-priority elevate.
4. If domain has zero Wayback captures → `no_wayback_history`. Likely benign for very new small orgs but combine with RDAP age.

## flags_thrown

| Flag | Trigger | Action |
|---|---|---|
| `no_wayback_history` | CDX returns 0 results | Combine with RDAP age, do not auto-flag |
| `domain_too_new_for_claim` | first_seen > claimed founding | Elevate |
| `dormancy_gap` | gap_max_days > 365 followed by recent activity | Cross-check RDAP, elevate |
| `recent_content_pivot` | LLM classifier finds category change in past 12 months | High-priority elevate |

## failure_modes_requiring_review

- IA rate-limited / temporary 503 → retry with backoff.
- Site is `robots.txt`-excluded from IA → no captures despite the domain being live for years (false `no_wayback_history`).
- Single-page apps that render via JS — Wayback often only captures the loader.
- Aggressive content delivery setups that block IA's crawler.

## false_positive_qualitative

- New legitimate small biotech / new lab websites have no Wayback history.
- Sites that have legitimately rebranded (department name change, university spinoff) trigger `recent_content_pivot`.
- The check is a **soft signal** and not a sole basis for denial; the value is in catching the specific dormant-domain pattern that no other M02 idea catches.

## record_left

- CDX response (compressed JSON snapshot)
- First/last seen dates
- Sampled snapshot URLs (web.archive.org/...) for human review
- Classifier verdict + extracted text excerpts before/after

## attacker_stories_addressed

- `dormant-domain` — primary signal: the `gap_max_days > 365 + recent activity` pattern is exactly the drop-catch fingerprint described in the attacker story's "key caveat" section.
- `drop-catch` — same.
- `lookalike-domain` — caught only if the lookalike has no history; doesn't help against an established lookalike.
- NOT caught: `shell-company`, `cro-framing`, `gradual-legitimacy-accumulation` (the latter explicitly bakes in 6–12 months of clean activity precisely to defeat this check).
