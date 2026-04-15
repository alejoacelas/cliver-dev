# m02-inbox-roundtrip — implementation v1

- **measure:** M02
- **name:** Inbox round-trip verification
- **modes:** D
- **summary:** During signup, send a signed token to the customer's claimed email address; require the user to click through within a short window to confirm control of the inbox. Standard "double opt-in" pattern with a JWT or HMAC-signed token URL. Confirms the user controls the inbox at the moment of signup, and creates a timestamped artifact for the audit log.

- **external_dependencies:**
  - Internal mailer / transactional email provider (Amazon SES, Postmark, SendGrid, Mailgun, Resend) — provider-of-choice; this idea does not name a specific vendor because it's pluggable.
  - Internal token-signing library (JWT with RS256/ES256, or stateless HMAC tokens) [source](https://curity.io/resources/learn/jwt-best-practices/).
  - Internal customer DB to store verification state (verified_at timestamp, token used, IP/UA of click).

- **endpoint_details:**
  - **Mailer:** any of SES / Postmark / SendGrid / Mailgun / Resend. SES is cheapest at scale (~$0.10 per 1000 emails [best guess: based on AWS public pricing — verify with AWS SES pricing page]). Postmark/Mailgun in the ~$0.001–$0.01 per email range at low/mid volume [best guess]. ToS: all major mailers permit transactional email; bulk-marketing rules don't apply to signup confirmations.
  - **Token endpoint (internal):** `GET https://provider.example/verify-email?token=<signed-jwt>` — server validates signature, exp, nbf, iss, jti uniqueness, marks email verified [source](https://curity.io/resources/learn/jwt-best-practices/).
  - **Token TTL:** 24–72h is conventional [best guess: industry norm for transactional email verification].
  - **Signing algorithm:** RS256 or ES256 (asymmetric, recommended over HS256 for verification tokens) [source](https://curity.io/resources/learn/jwt-best-practices/).

- **fields_returned:**
  - On click: server stores `{customer_id, email, verified_at, token_jti, source_ip, user_agent, click_latency_ms}`.
  - Token payload (JWT): `{sub: customer_id, email, iat, exp, nbf, jti, iss}` [source](https://curity.io/resources/learn/jwt-best-practices/).

- **marginal_cost_per_check:**
  - Mailer cost per email: ~$0.0001–$0.001 (SES at scale to Postmark at low volume) [best guess: AWS/Postmark pricing pages].
  - Token signing/verification: $0 compute.
  - Total: <$0.001 per check.
  - setup_cost: ~3–5 engineer-days to build the flow if not already present.

- **manual_review_handoff:**
  1. If user does not click within TTL → flag `roundtrip_expired`; signup blocked from progressing past M02 gate. Reviewer or automated retry sends a fresh token (max 2 retries).
  2. If user clicks but the click metadata is suspicious (click from datacenter IP, non-browser user agent suggesting automated fetch, or click latency <2s suggesting bot) → flag for manual review.
  3. If multiple distinct click sources in a short window (forwarding rule pattern) → flag, escalate to m02 reviewer.
  4. Reviewer compares click metadata to claimed customer location; if mismatch (e.g., claim is US researcher, click from Tor exit), treat as potential inbox-forwarding compromise scenario (per inbox-compromise / dormant-account-takeover attacker branches).

- **flags_thrown:**
  - `roundtrip_failed` — user did not click; mailer also reported no bounce → block signup.
  - `roundtrip_expired` — user did not click within TTL → reissue once, then block.
  - `roundtrip_bounced` — mailer reported hard bounce → block signup; mailbox does not exist or rejects mail.
  - `roundtrip_clicked_suspicious` — click metadata anomalous (datacenter IP, headless UA, sub-2s latency, forwarding pattern) → reviewer.

- **failure_modes_requiring_review:**
  - Inbox forwarding hides true recipient: a forwarding rule on the institutional mailbox silently relays the verification mail to the attacker; the click signal is uninformative about who actually received it.
  - User behind a corporate proxy/secure-link rewriter (Mimecast, Proofpoint URL Defense) auto-clicks links to scan for malware → false positive on bot heuristic. Mitigation: detect known scanner UAs and require a second human click.
  - Mail provider greylisting / spam-filter delays push delivery past TTL.
  - Token leakage if user forwards the verification email.
  - JWT replay if jti uniqueness check is missed.
  - JWT signing key compromise → all in-flight tokens trustworthy → key rotation strategy needed.

- **false_positive_qualitative:**
  - Users behind aggressive corporate URL scanners that auto-click before the human reads the mail (Proofpoint, Mimecast, Microsoft Defender Safe Links) — common at large research institutions and a frequent confounder for "click telemetry" signals.
  - Users on slow/intermittent connections who time out.
  - Users whose mail provider quarantines transactional mail in a junk folder they don't check.
  - Researchers working from datacenters / HPC environments where browser clicks come from non-residential IPs.

- **record_left:**
  - Per signup attempt: token issuance log {customer_id, email, jti, iat, exp, mailer_message_id}.
  - Per click: verification record {jti, click_timestamp, click_ip, click_ua, click_latency, http_referer}.
  - Per failure: {jti, failure_reason, bounce_code if applicable}.
  - Audit value: timestamps prove the inbox was reachable and active at signup time. Note structural caveat: this is *necessary but insufficient* per the inbox-compromise / dormant-account-takeover / credential-compromise attacker branches — all of which authentically pass round-trip verification because the attacker controls the real inbox.

## For 4C to verify
- JWT best-practices citation supports the asymmetric-algorithm + exp/nbf/jti/iss validation claims.
- The structural-caveat statement aligns with the inbox-compromise attacker branches (these branches do say roundtrip passes).
