# 4F form check — m15-llm-extraction v1

| Field | Verdict | Notes |
|---|---|---|
| external_dependencies | PASS | Two specific vendor APIs + comparator + reviewer queue. |
| endpoint_details | PASS | Both URLs, auth, pricing per-token, ToS review requirement called out. |
| fields_returned | PASS | Canonical schema fields + comparator outputs. |
| marginal_cost_per_check | PASS | Per-call token math + setup_cost. |
| manual_review_handoff | PASS | Six-step playbook including hallucination check via extracted_quotes. |
| flags_thrown | PASS | Five flags including the low-confidence case. |
| failure_modes_requiring_review | PASS | Hallucination, multilingual, vague, JSON failure, outage. |
| false_positive_qualitative | PASS | Four concrete legitimate-customer cases. |
| record_left | PASS | JSON, prompt, model version, comparator, reviewer notes. |

## For 4C to verify

- Anthropic and OpenAI structured-outputs URLs.
- Pricing numbers ($3/$15 Sonnet 4.6, $2.50/$10 GPT-4o).
- Stephen Turner blog claim (90% vs 80%) — likely overstated; verify before relying.

## Verdict

`PASS` — substantively complete.
