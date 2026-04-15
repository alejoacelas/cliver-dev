# m16-no-sms-no-email-reset — Implementation v1

- **measure:** M16 (mfa-stepup)
- **name:** No-SMS, no-email-reset SOP
- **modes:** D (defensive policy)
- **summary:** A configuration + written policy: (1) SMS / voice OOB authenticators are disabled as second factors at the IdP, (2) "lost authenticator" or password-reset workflows cannot be completed via email-only — they require either a hardware-token re-enrollment witnessed by a human reviewer or a fresh m14 IDV step. Closes the email-channel MFA recovery bypass that drives account-hijack, credential-compromise, and dormant-account-takeover.

## external_dependencies

- **IdP configuration access** (Okta, Auth0, Azure AD, or equivalent). On Okta the SMS authenticator can be set to Inactive at the Factor Types tab ([Okta SMS Authentication MFA docs](https://help.okta.com/en-us/content/topics/security/mfa/sms.htm)); password recovery rules are configured under the account-management policy ([Okta password recovery and account unlock rule docs](https://help.okta.com/oie/en-us/content/topics/identity-engine/policies/oamp-configure-account-recovery.htm)).
- **Hardware-token enrollment program** (cross-references m16-webauthn-yubikey).
- **m14 IDV vendor** as the fallback recovery channel.
- **Help-desk SOP and training** — the most expensive failure mode is a support agent socially engineered into resetting via email.

## endpoint_details

This is a configuration + policy idea, not an API integration. The "endpoint" is the IdP admin console.

- **Okta:** Disable SMS authenticator at Security → Authenticators. Disable email as a recovery factor in the Account Management Policy. Recovery questions and email recovery are explicitly listed as configurable options to remove ([Okta password reset and account recovery docs](https://help.okta.com/oie/en-us/content/topics/identity-engine/password-reset-account-recovery.htm)).
- **Auth0:** Tenant Settings → Multifactor Auth, disable the SMS factor. Disable email-only password reset by routing reset to a Universal Login flow that requires WebAuthn re-authentication first.
- **Auth model / pricing:** Whichever IdP the provider already uses. Marginal cost of the configuration is $0; the cost is in the policy's downstream consequences (more support tickets, more IDV calls).
- **Standards anchor:** NIST SP 800-63B-4 explicitly classifies SMS / PSTN OTP as a **restricted authenticator** with usage notice and migration requirements ([NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html); summary: [TypingDNA blog on SP 800-63B Rev 4](https://blog.typingdna.com/nist-sp-800-63b-rev-4-sms-otp-is-now-a-restricted-authenticator-but-we-have-the-fix/)). CISA's Mobile Communications Best Practices Guidance (Dec 2024) bluntly recommends "Do not use SMS as a second factor" ([CISA Mobile Communications Best Practices PDF](https://www.cisa.gov/sites/default/files/2024-12/joint-guidance-mobile-communications-best-practices_v2.pdf)). CISA's Phishing-Resistant MFA fact sheet additionally notes "once enrolled in phishing-resistant authenticator-based MFA, disable SMS for each account, as enrollment in authenticator-based MFA does not automatically unenroll the account's SMS" ([CISA Implementing Phishing-Resistant MFA fact sheet PDF](https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf)).

## fields_returned

The IdP audit log emits events the SOP keys on:

- `user.mfa.factor.deactivate` (SMS)
- `user.mfa.factor.activate` (WebAuthn / TOTP)
- `user.account.unlock` / `user.account.recover_password`
- `policy.evaluate_sign_on` with the rule that matched
- `system.email.send` for any email touching reset (so the SOP can confirm none used the email-only path)

[best guess: these are the standard Okta system-log event types per the Okta System Log API; specific event names verified informally by spec convention. Searched for: "Okta system log event user.mfa.factor.deactivate", "Okta password recovery system log events".]

## marginal_cost_per_check

- **Configuration cost:** $0 (already paying for the IdP).
- **Per-recovery-event human cost:** every "I lost my authenticator" ticket now goes to (a) a help-desk agent who validates the customer over a video call OR (b) a re-IDV inquiry. [best guess: $5–$15 per ticket counting human time, plus $1.50–$3 if IDV is invoked.]
- **Setup cost:** writing the SOP, training help-desk, communicating the change to customers, building the in-product enrollment-replacement flow. [best guess: 2–6 engineer-weeks plus 1 PM-week plus 1 support-lead-week.]

## manual_review_handoff

SOP for "I cannot log in" tickets under this policy:

1. **Triage by classification.** What's lost: password, second factor, or both?
2. **Password only:** Customer initiates self-service reset. The reset email contains a magic link, BUT clicking the link prompts a successful **second factor** (hardware token or app). Email alone never authorizes a password change. If the customer also lacks the second factor, escalate to step 3.
3. **Second factor only or both lost:** Help-desk agent schedules a video call. On the call, agent (a) verifies face against the stored onboarding selfie OR triggers a fresh m14 IDV inquiry, (b) verifies a knowledge factor not present in the email account (institutional ID number, prior order ID), (c) walks the customer through enrolling a new hardware token live on screen.
4. **Reviewer logs the recovery event.** Ticket ID, agent, IDV inquiry ID (if used), new factor metadata, time on call.
5. **Notification.** A confirmation email is sent to BOTH the primary email and to the customer's institutional security contact (this defeats the silent-takeover variant — the legitimate user gets an out-of-band heads-up even if the attacker controls the inbox).
6. **Cooling-off.** SOC orders are blocked for 24 hours after any factor reset event (cross-references m16-order-time-stepup).

## flags_thrown

- `policy_sms_used` — an SMS factor was activated despite policy. **Action:** auto-deactivate, log, alert security.
- `reset_email_only_used` — a password reset was completed without a second factor challenge. **Action:** auto-revert, lock account, escalate.
- `recovery_video_call_required` — customer requested factor reset; routed to help-desk video call queue. **Action:** schedule, run SOP step 3.
- `recovery_completed_with_idv` — IDV-mediated recovery happened. **Action:** auditable record kept.
- `recovery_notification_bounced` — institutional security contact notification undeliverable. **Action:** hold the recovery, escalate.

## failure_modes_requiring_review

- Customer has lost both factors AND has changed institutions (no current institutional security contact to notify) — manual reviewer adjudicates with new affiliation evidence.
- IDV vendor outage during a recovery call — fall back to a deeper knowledge-based interview by the help-desk agent (with explicit reviewer sign-off, since this widens the attack surface).
- Customer in a region where video calls are unreliable — async equivalent: pre-recorded selfie + ID with reviewer comparison.
- Help-desk agent is socially engineered into bypassing the SOP — caught by audit-log review (the recovery should have a `recovery_completed_with_idv` event; tickets without it are flagged in a weekly audit).
- Legitimate user whose institutional security contact has lapsed (departed IT staff, dead distribution list) — the bounce flag is the catch.

## false_positive_qualitative

- **Travelers** without their hardware token. Friction-cost only; the SOP does not deny them, it routes them to the video-call queue.
- **Customers at small institutions** without a clear security contact. The institution-notification step degrades to "we cannot notify, customer must wait 48 hours."
- **Faculty who change phones / lose tokens** at the start of a semester. Predictable spike; staff the help-desk accordingly.
- **Customers with disability accommodations** that make video calls or hardware tokens hard. Requires reviewer-approved alternative path.

## record_left

- **IdP audit log** entries for every factor change, recovery completion, and policy evaluation. Retained per the IdP's retention policy (Okta retains system log events for 90 days online, with an export pipeline for longer retention; [unknown — searched for: "Okta system log retention 2025", "Auth0 log retention default"]).
- **Help-desk ticket** with the video-call recording (if recorded), the reviewer's name, the IDV inquiry ID, and the new factor metadata.
- **Out-of-band notification record** to the institutional security contact — load-bearing audit artifact, since it's the only signal the legitimate user gets in a silent-takeover scenario.

## attacker stories addressed (cross-ref)

- **account-hijack (Method 1: MFA reset via email recovery):** directly closed — email alone cannot complete the reset.
- **credential-compromise (account-takeover-via-password-reset path):** closed — same mechanism.
- **dormant-account-takeover (Bypass A: email-channel MFA recovery):** closed — same mechanism.
- **account-hijack (Method 6: SIM-jacking / SS7):** closed — SMS isn't a factor.
- **account-hijack (Method 7: social-engineer provider support):** mitigated by the video-call SOP and the institutional notification; not eliminated (a sufficiently skilled attacker who also controls the institutional security contact alias survives).
