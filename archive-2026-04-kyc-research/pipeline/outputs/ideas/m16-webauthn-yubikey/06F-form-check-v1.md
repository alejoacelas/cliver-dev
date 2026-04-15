# Form check: m16-webauthn-yubikey / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap name | Category precise? | Estimated size sourced? | Behavior labeled? | Reasoning present? | Verdict |
|---|---|---|---|---|---|---|
| 1 | Distribution / import restrictions | Yes | Cited Biometric Update (175 countries), GM Insights; [best guess] 3–8% | Yes (no-signal) | Yes | PASS |
| 2 | Disability accessibility | Yes | Cited Passkey Central, WHO; [best guess] <1% | Yes (no-signal) | Yes | PASS |
| 3 | Onboarding token-arrival gap | Yes | [best guess] 10–20% of first-time orders | Yes (false-positive) | Yes | PASS |
| 4 | Federated SSO upstream gap | Yes | [best guess] + [unknown] for upstream compliance rate | Yes (weak-signal) | Yes | PASS |
| 5 | Cost barrier small labs | Yes | [unknown] + [best guess] 5–10% | Yes (no-signal) | Yes | PASS |
| 6 | Field researchers / remote | Yes | [unknown] + [best guess] 1–3% | Yes (false-positive) | Yes | PASS |

## Schema field: `false_positive_qualitative`

Refined list present? **Yes.** Six items, cross-references gaps and stage 4. Adequate.

## Overall structure

- Six gaps, all following required format. **PASS.**
- Citations present where available. **PASS.**
- "Notes for stage 7 synthesis" section present with substantive recommendations. **PASS.**

## Flags

- **Flag 1 (minor):** Gap 4 cites [unknown] for InCommon/eduGAIN phishing-resistant MFA adoption, then immediately estimates ">50% of federated academic IdPs do not enforce phishing-resistant MFA." The >50% figure is unsupported — the search returned no results and the best guess could be made more transparent by noting the basis (e.g., general higher-ed MFA statistics).
- **Flag 2 (minor):** Gap 1 mentions China's encryption-import restrictions as significant but does not cite the specific regulation. A reference to China's Cryptography Law or export-control regime would strengthen.

## Verdict: **PASS with minor flags.**
