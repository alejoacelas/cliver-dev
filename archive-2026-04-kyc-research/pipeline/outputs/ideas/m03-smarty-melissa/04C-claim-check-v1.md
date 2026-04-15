# m03-smarty-melissa — 04C claim check v1

- **Smarty US Street Address API URL.** Confirmed in [Smarty US Street API docs](https://www.smarty.com/docs/cloud/us-street-api). `PASS`.
- **`analysis.dpv_cmra` Y/N field on Smarty.** Documented in the US Street API field reference (matches summary in WebSearch). `PASS`.
- **Smarty pricing starting at ~$0.60 / 1,000.** Cited to [Smarty pricing](https://www.smarty.com/pricing). The exact entry-tier number is what the vendor advertises but tiers change frequently — `STALE` risk noted. `PASS` with caveat.
- **Melissa GAV pricing tiers (G2 user-reported).** Cited as `[best guess from G2]`, which is the appropriate framing — G2 numbers are user-submitted, not Melissa-published. `PASS` (the doc honestly labels this).
- **Melissa CMRA Y/N indicator.** Sourced as `[vendor-described, not technically documented]`. `PASS` — the framing is correct; Melissa's docs do mention CMRA detection but the specific field name is not in the public Python SDK README.
- **`AS01`/`AV25` Melissa result codes.** These are real Melissa result-code conventions (documented in their Result Codes reference). `PASS`.

No broken URLs.

**Verdict: PASS**
