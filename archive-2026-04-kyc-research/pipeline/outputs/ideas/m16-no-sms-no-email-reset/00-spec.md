# m16-no-sms-no-email-reset

- **measure:** M16
- **name:** No-SMS, no-email-reset SOP
- **modes:** D
- **summary:** Policy: SMS disallowed as second factor; password reset never via email-only. Resets require IDV re-bind.
- **attacker_stories_addressed:** sim-swap, email-takeover, sms-bypass
- **external_dependencies:** Internal policy + IdP config.
- **flags_thrown:** policy_sms_used; reset_email_only_used
- **manual_review_handoff:** Reviewer audits exceptions.
- **failure_modes_requiring_review:** User friction.
- **record_left:** Policy audit.
