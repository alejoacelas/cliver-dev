# Stage 2 Feasibility Check — Measure 12 (v2)

## Per-idea verdicts

1. Stripe Radar AVS — PASS (carried).
2. Adyen AVS — PASS (carried).
3. Braintree AVS + Account Updater — PASS (carried).
4. ROR registered-address — PASS (carried).
5. GLEIF LEI (revised, corporate-scope, corroborator only) — PASS. The revision addresses the v1 critique by scoping use to corporate customers and dropping the absent-LEI flag.
6. Companies House — PASS (carried).
7. SAM.gov — PASS (carried).
8. Google Places geocoding — PASS (carried).
9. Procurement-system originator (PaymentWorks/Jaggaer/Coupa) — PASS (carried).
10. ACH NACHA originator — PASS (carried).
11. P-Card BIN range + Level II/III — PASS (carried).
12. Plaid Identity — PASS (carried).
13. Cardholder vs institutional directory (revised) — PASS. Concrete: in-house scrape of public faculty directories with ORCID fallback, plus a defined fallback for gated directories.
14. Billing-vs-shipping + RDI — PASS (carried).
15. Mercury/Brex/Relay sponsor-bank denylist — PASS (carried).
16. SOP name-match Jaro-Winkler — PASS (carried).
17. PO budget-code stability check — PASS. Concrete (in-house PO history diff + AP callback playbook); directly closes the v1 gap on dormant-account-takeover Bypass C.
18. Cross-customer originator clustering — PASS. Concrete (defined cluster rule over the outputs of #10/#12/#15); closes the v1 gap on cro-identity-rotation's structured-shell-formation pattern.

## Gaps

- None remaining from v1's list.
- No new gaps surfaced. All 8 mapped attacker stories are now addressed by ≥1 idea, with the most-directly-engaging stories (dormant-account-takeover, dormant-domain, account-hijack, inbox-compromise, credential-compromise) addressed by multiple complementary ideas.

## Verdicts summary

- PASS: 18
- REVISE: 0
- DROP: 0

STOP: yes
