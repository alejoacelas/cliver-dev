# m02-wayback — 04C claim check v1

- **CDX server URL `https://web.archive.org/cdx/search/cdx`.** Confirmed at [Wayback APIs](https://archive.org/help/wayback_api.php) and [CDX README](https://github.com/internetarchive/wayback/blob/master/wayback-cdx-server/README.md). `PASS`.
- **`limit=-N` returns most recent N captures.** Documented in CDX README. `PASS`.
- **`id_` modifier on snapshot URLs returns original HTML.** Standard Wayback machine convention, documented in IA's wiki. `PASS`.
- **`[unknown]` admissions for rate limit and ToS** include plausible queries. `PASS`.

No broken or mis-cited URLs.

**Verdict: PASS**
