# 04F form-check v1 — m14-fido2-stepup

| Field | Verdict | Note |
|---|---|---|
| name | PASS | |
| measure | PASS | Note: this idea is M14-adjacent but is fundamentally an *authentication* control (M16-style step-up) re-purposed as M14 evidence-of-presence. v1 acknowledges this. |
| attacker_stories_addressed | PASS | Specifically calls out non-coverage of fronted-accomplice and inbox-compromise. |
| summary | PASS | Frames the gap with M14 documentary IDV explicitly. |
| external_dependencies | PASS | |
| endpoint_details | PASS | Open-standard, no API key. Hardware key prices itemized. |
| fields_returned | PASS | Full WebAuthn assertion field list. |
| marginal_cost_per_check | PASS | $0 per assertion + hardware-key one-time band. |
| manual_review_handoff | PASS | 6-step playbook including the critical "do not allow self-service recovery" SOP. |
| flags_thrown | PASS | |
| failure_modes_requiring_review | PASS | Calls out support-desk social engineering as the structural hole. |
| false_positive_qualitative | PASS | |
| record_left | PASS | Notes longitudinal credential-ID audit value. |
| bypass_methods | DEFERRED | Stage 5. |

## For 4C to verify

- "WebAuthn AAL2 with platform authenticator + UV; AAL3 with hardware key + UV per NIST SP 800-63B-4" — verify NIST 800-63B-4 authenticators page.
- "Phishing-resistant per NIST SP 800-63-4" — verify Yubico blog and NIST source.
- Hardware key price ranges ($14 Identiv → $80 YubiKey BIO; $55 YubiKey 5C NFC) — verify Corbado blog.
- "T-Mobile deployed 200,000 YubiKeys in late 2023" — not in v1 narrative; ignore.
- "@simplewebauthn/server is open source MIT" — verify GitHub repo.
- "WebAuthn assertion includes RP origin, defeating phishing-proxy" — verify webauthn.guide / W3C spec.

## Verdict

PASS.
