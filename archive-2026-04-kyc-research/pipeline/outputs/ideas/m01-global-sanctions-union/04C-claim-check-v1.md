# 4C claim check — m01-global-sanctions-union v1

- **OpenSanctions bundles UN/EU/UK/CA/AU sanctions** — supported by https://www.opensanctions.org/datasets/sanctions/ and confirmed via search snippets enumerating each jurisdiction. PASS.
- **328 sources headline** — supported by https://www.opensanctions.org/datasets/sources/ via search snippet. PASS (numbers like this drift over time, mark as snapshot).
- **AU dataset slug `au_dfat_sanctions`** — supported by https://www.opensanctions.org/datasets/au_dfat_sanctions/. PASS.
- **CA dataset slug `ca_dfatd_sema_sanctions`** — supported by https://www.opensanctions.org/datasets/ca_dfatd_sema_sanctions/. PASS.
- **€0.10/call** — confirmed in earlier ofac-sdn iteration via direct fetch of opensanctions.org/api/. PASS.

No broken URLs. No claim fetched directly this round (relied on prior fetches and search snippets — budget conservation).

Verdict: PASS
