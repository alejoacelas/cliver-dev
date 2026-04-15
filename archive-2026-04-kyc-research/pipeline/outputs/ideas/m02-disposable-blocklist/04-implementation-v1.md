# m02-disposable-blocklist — implementation v1

- **measure:** M02
- **name:** Disposable / free-mail blocklist
- **modes:** D, A
- **summary:** Match the email domain against curated lists of disposable mailbox providers (Mailinator, 10minutemail, Guerrilla Mail) and free-mail (gmail, yahoo, outlook, qq). Disposable = hard reject; free-mail on a claimed institutional order = soft flag routed to m07 affiliation check.

- **external_dependencies:**
  - `disposable-email-domains/disposable-email-domains` GitHub repo — community-maintained list since 2014, validation process for additions [source](https://github.com/disposable-email-domains/disposable-email-domains).
  - `ivolo/disposable-email-domains` — older but widely-used variant [source](https://github.com/ivolo/disposable-email-domains).
  - `eramitgupta/disposable-email` — auto-updated daily, 110k+ domains [source](https://github.com/eramitgupta/disposable-email).
  - Kickbox open disposable API as a hosted alternative [source](https://open.kickbox.com/).
  - Free-mail domain list: small static set (gmail.com, yahoo.com, outlook.com, hotmail.com, icloud.com, aol.com, qq.com, 163.com, gmx.de, mail.ru, proton.me, etc.) — typically maintained internally; ~50 domains covers ≥99% of free-mail volume.

- **endpoint_details:**
  - **Static GitHub lists:** Cloned/fetched as plaintext file (one domain per line). MIT license [source](https://github.com/disposable-email-domains/disposable-email-domains). Update cadence: depends on list (daily for eramitgupta, periodic PR-driven for others). Cost: $0.
  - **Kickbox open API:** `GET https://open.kickbox.com/v1/disposable/{domain_or_email}` returns `{"disposable": true|false}`. No auth, free [source](https://open.kickbox.com/). Best practice: cache responses locally; check the maintained list first to avoid hitting the API for every check. ToS: free public service; for higher-volume / SLA needs Kickbox sells a paid email-verification API.
  - **Kickbox paid email verification API:** [vendor-gated — paid tiers exist; specific pricing requires sales/signup]. Free tier offers ~200 checks/month per search snippet.

- **fields_returned:**
  - Static list: domain → boolean (in-list / not-in-list). No metadata.
  - Kickbox open API: `{"disposable": bool}` per domain [source](https://open.kickbox.com/).
  - Kickbox paid verification: result, reason, role, free, disposable, accept_all, did_you_mean, sendex score [vendor-described, see kickbox.com email-verification page].

- **marginal_cost_per_check:**
  - Static list lookup: $0 (in-memory hashset).
  - Kickbox open API: $0.
  - Kickbox paid: [vendor-gated]. Industry rule: ~$0.005–$0.01/check at moderate volume [best guess].
  - setup_cost: trivial (~1 day to ingest list, set up daily refresh cron, add to signup pipeline).

- **manual_review_handoff:**
  1. Disposable domain → automated hard reject at signup (no human queue); user sees "please use a permanent email address" message. Log the attempt.
  2. Free-mail + claimed institutional affiliation → flag to reviewer queue; reviewer checks whether m07 affiliation evidence (faculty page, ROR, ORCID) supports the claim.
  3. Free-mail + no institutional claim (DIY/hobbyist customer category) → not a flag on its own; downstream m04/m05 shipping checks govern.
  4. Reviewer for free-mail + institutional claim: ask user to provide an institutional email round-trip OR provide alternative affiliation evidence within N days; otherwise refuse SOC orders.

- **flags_thrown:**
  - `disposable_domain` — domain in any disposable list → automated hard reject pre-queue.
  - `free_mail_with_institution_claim` — domain in free-mail list AND customer self-declared an institutional affiliation → escalate to m07 affiliation check.
  - `recently_added_disposable` — domain added to the disposable list in the last 7 days (catches a customer who registered just before the list was updated) → soft flag for retroactive re-screen.

- **failure_modes_requiring_review:**
  - Lists lag new disposable providers (typical lag 1–14 days).
  - False positives on tiny/new email providers that look disposable but are real (e.g., a regional ISP).
  - Customers using a legitimate self-hosted domain that happens to match an old disposable name (very rare).
  - Kickbox API rate limit / outage → fall back to static list.
  - Free-mail list is judgment-call: some institutions in low-/mid-income countries use Gmail Workspace under a custom domain, but individual researchers may also use plain `@gmail.com`.

- **false_positive_qualitative:**
  - DIY / community-bio / independent researchers legitimately using `@gmail.com` for an institutional-looking order → free-mail flag fires correctly but the correct disposition is not "block".
  - Researchers in countries where Gmail/Outlook is the institutional norm.
  - Newly-listed disposable domains that incidentally match a legitimate small-business domain.
  - Researchers who use a privacy-focused mailbox provider (Proton, Tutanota) that some lists treat as disposable.

- **record_left:**
  - Per check: domain queried, list version (commit hash or date), result, source (static list / Kickbox), timestamp.
  - For rejected signups: rejection log including domain, IP, claimed name (for fraud-pattern analysis).

## For 4C to verify
- That the disposable-email-domains org repo is active and MIT-licensed.
- Kickbox open endpoint URL and JSON response format.
- The 110k+ domain claim on eramitgupta/disposable-email.
