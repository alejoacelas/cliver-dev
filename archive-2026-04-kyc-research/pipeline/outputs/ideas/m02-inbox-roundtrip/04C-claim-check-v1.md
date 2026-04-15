# 4C claim check — m02-inbox-roundtrip v1

- **JWT validation should check exp/nbf/iss/jti** — supported by https://curity.io/resources/learn/jwt-best-practices/ per search snippet. PASS.
- **Asymmetric (RS256/ES256) preferred over HS256 for verification tokens** — supported by curity.io best practices snippet. PASS.
- **SES ~$0.10/1000 emails** — `[best guess]` marker; not a hard claim. PASS (would be stronger with a fetch of https://aws.amazon.com/ses/pricing/ in a future iteration).
- **Postmark/Mailgun pricing range** — `[best guess]`; appropriate hedge. PASS.

No fetched URLs this round. No broken links.

Verdict: PASS
