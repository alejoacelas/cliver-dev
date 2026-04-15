# Form check: m16-no-sms-no-email-reset / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap | Category precision | Size estimate | Citation quality | Behavior label | Verdict |
|---|---|---|---|---|---|---|
| 1 | Lost-device recovery | Precise | [best guess: 5-10%/year] anchored by Gartner helpdesk stat | Gartner/Nametag cited for 50% lockout tickets | false-positive | PASS |
| 2 | Unreachable security contacts | Precise (small institutions, startups) | [best guess: 10-20%] anchored by market share data | Fortune BI cited for biotech market share; derivation reasonable | weak-signal | PASS |
| 3 | Poor-connectivity regions | Precise | [best guess: 2-5%] | Thin -- market-share proxy is indirect | false-positive | PASS -- small gap, conservative estimate |
| 4 | Help-desk social engineering | Precise (SOP bypass) | [best guess: 2-5% per attempt] | Industry red-team benchmarks referenced but not specifically cited | no-signal (retrospective audit) | FLAG: the social-engineering success rate claim should cite a specific source or be marked [unknown]. |
| 5 | Disability accommodations | Precise | [best guess: 1-2%] with CDC stat for context | CDC cited for general disability rate; synthesis-specific derivation is thin | weak-signal | PASS |

## Schema field: `false_positive_qualitative`

Refined list with 4 categories, cross-referenced. Gap 4 (social engineering) correctly excluded from false-positive list (it's an attacker gap, not a customer gap). PASS.

## Schema field: `notes for stage 7 synthesis`

Present and actionable (security-vs-friction trade-off, help-desk cost model, pairing with m16-dormancy-reidv and m16-auth0-okta). PASS.

## Overall form verdict

**1 FLAG:**
1. Gap 4 (social engineering) success rate estimate needs a specific citation or explicit [unknown] admission.

Otherwise well-structured. The gap list correctly focuses on operational friction (the dominant concern for a policy/SOP idea) rather than technical data-source limitations.
