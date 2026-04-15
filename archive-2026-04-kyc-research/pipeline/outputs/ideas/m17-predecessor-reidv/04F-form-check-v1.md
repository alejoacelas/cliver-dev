# 04F form check — m17-predecessor-reidv v1

| Field | Verdict | Notes |
|---|---|---|
| name / measure / summary | PASS | |
| external_dependencies | PASS | NIST 800-63A + named IDV vendors + workflow. |
| endpoint_details | PASS | Concrete Stripe Identity pricing; Persona/Onfido/ID.me appropriately marked vendor-gated; auth/ToS covered. |
| fields_returned | PASS | Field list with `[best guess]` covering common-denominator across major vendors. |
| marginal_cost_per_check | PASS | Stripe cited; range for others; setup cost given. Friction-cost guess is hand-wavy but qualitatively correct. |
| manual_review_handoff | PASS | Six-step playbook with concrete handoff variants. |
| flags_thrown | PASS | Five distinct flags. |
| failure_modes_requiring_review | PASS | Six concrete modes. |
| false_positive_qualitative | PASS | |
| record_left | PASS | |

## Borderline

- Persona pricing `[unknown]` has 3 plausible queries, PASS.
- The friction drop-rate `[best guess: 5–20%]` is unsupported by a citation; flag for v2 if this becomes load-bearing for synthesis.

## For 4C to verify

- Stripe Identity $1.50/verification — verify against [stripe.com/identity](https://stripe.com/identity).
- Persona starting plan $250/month — verify against the cited Index.dev page.
- ID.me being IAL2/AAL2 conformant — verify the Best AI Agents page actually says this.
- NIST 800-63A binding language — verify the cited NIST page.

**Verdict:** PASS
