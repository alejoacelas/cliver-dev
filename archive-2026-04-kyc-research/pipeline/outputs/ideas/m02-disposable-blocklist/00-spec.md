# m02-disposable-blocklist

- **measure:** M02
- **name:** Disposable / free-mail blocklist
- **modes:** D, A
- **summary:** Match the email domain against curated lists of disposable mailbox providers (10minutemail, Mailinator, Guerrilla) and free-mail (gmail, yahoo, qq). Disposable = hard reject; free-mail on a claimed institutional order = soft flag.
- **attacker_stories_addressed:** free-mail-affiliation, disposable-mailbox
- **external_dependencies:** disposable_email_blocklist (oss); fakefilter; Kickbox.
- **flags_thrown:** disposable_domain; free_mail_with_institution_claim
- **manual_review_handoff:** Reviewer escalates free-mail + institutional claim to m07 affiliation check.
- **failure_modes_requiring_review:** Lists lag new providers.
- **record_left:** List name + version.
