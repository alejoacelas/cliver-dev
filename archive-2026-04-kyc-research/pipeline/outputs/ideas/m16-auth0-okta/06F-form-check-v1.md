# Form check: m16-auth0-okta / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap | Category precision | Size estimate | Citation quality | Behavior label | Verdict |
|---|---|---|---|---|---|---|
| 1 | Unenrolled passkey customers | Precise | [best guess: 30-60%] anchored by FIDO Alliance 2025 stats | FIDO Alliance and Authsignal cited; derivation to synthesis context is reasonable | false-positive | PASS |
| 2 | Shared-device lab environments | Precise | [best guess: 5-15%] -- no citation | Thin | false-positive | FLAG: minor -- no data on shared-device prevalence in labs. |
| 3 | Institutional policy conflicts | Precise (government/defense) | [best guess: 3-8%] -- no citation | Thin | false-positive | PASS -- small segment, estimate is conservative |
| 4 | International travel | Precise | [best guess: 3-5%] -- no citation | Thin | false-positive | PASS -- seasonal, bounded friction |
| 5 | Legacy browsers | Precise | ~5% global (Can I Use cited) → [best guess: 2-5%] | Well-anchored | false-positive | PASS |

## Schema field: `false_positive_qualitative`

Refined list with 5 categories, cross-referenced to gaps. Correctly identifies rollout adoption as the dominant issue. PASS.

## Schema field: `notes for stage 7 synthesis`

Present and actionable (adoption vs technology distinction, syncable vs hardware tradeoff, federated-IdP limitation, policy-dependence). PASS.

## Overall form verdict

**1 FLAG:**
1. Gap 2 (shared-device) size estimate lacks any citation or proxy.

Overall well-structured. The gap list correctly focuses on adoption and enrollment barriers rather than technical limitations of WebAuthn itself.
