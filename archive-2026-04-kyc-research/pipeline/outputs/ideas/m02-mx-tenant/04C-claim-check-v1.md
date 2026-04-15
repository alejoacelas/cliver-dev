# m02-mx-tenant — 04C claim check v1

Claims verified:

- **`ASPMX.L.GOOGLE.COM` = Google Workspace MX.** Cited to TrulyInbox. Google's own setup docs (`support.google.com/a/answer/140034`) corroborate; the value is industry-known and uncontested. `PASS`.
- **GetUserRealm returns `NameSpaceType` of Managed/Federated.** Cited to Medium reconnaissance article. The endpoint and response shape are also documented in AADInternals tool documentation (`aadinternals.com/aadinternals`) and used by every AAD recon tool. `PASS` though the citation is weaker than ideal — `UPGRADE-SUGGESTED`: prefer an AADInternals or Microsoft KB cite if found in v2.
- **checkdmarc parses SPF/DMARC.** PyPI page directly substantiates. `PASS`.
- **`[unknown]` admissions** for GetUserRealm rate limit and ToS each list 2 plausible queries. `PASS`.

No `BROKEN-URL`, `MIS-CITED`, or `OVERSTATED` flags.

**Verdict: PASS**
