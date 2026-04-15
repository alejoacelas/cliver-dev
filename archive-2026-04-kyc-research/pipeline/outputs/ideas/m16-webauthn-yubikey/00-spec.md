# m16-webauthn-yubikey

- **measure:** M16
- **name:** WebAuthn / YubiKey hardware token enforcement
- **modes:** D
- **summary:** Require WebAuthn (FIDO2) hardware tokens for SOC-tier customers. Phishing-resistant; eliminates SMS bypass.
- **attacker_stories_addressed:** phishing, sms-bypass, account-takeover
- **external_dependencies:** WebAuthn library; YubiKey hardware.
- **flags_thrown:** no_webauthn_enrolled
- **manual_review_handoff:** Reviewer issues replacement tokens.
- **failure_modes_requiring_review:** Token cost / loss.
- **record_left:** Authenticator metadata.
