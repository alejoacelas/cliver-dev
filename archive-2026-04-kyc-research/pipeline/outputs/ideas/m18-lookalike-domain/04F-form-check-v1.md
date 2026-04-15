# 04F form check v1 — m18-lookalike-domain

| Field | Verdict | Note |
|---|---|---|
| external_dependencies | PASS | Four dependencies named with citations. |
| endpoint_details | PASS | URLs, auth, rate limits cited. Minor: ToS for crt.sh declared as `[unknown]` with reasonable search list. |
| fields_returned | PASS | Concrete field lists for all four sources, cited. |
| marginal_cost_per_check | PASS | Components broken out; setup cost noted. |
| manual_review_handoff | PASS | Three-case playbook with explicit steps and a callback hygiene rule. |
| flags_thrown | PASS | Four named flags, each with action. |
| failure_modes_requiring_review | PASS | Five failure modes; one ROR coverage stat is `[best guess]` rather than cited — borderline OK. |
| false_positive_qualitative | PASS | Five concrete categories. |
| record_left | PASS | Concrete JSON contents. |
| coverage_gaps | N/A — stage 6 |
| bypass_methods_known/uncovered | N/A — stage 5 |

## For 4C to verify

- Claim that ROR data dump is on Zenodo at the cited DOI.
- Claim that ROR REST API rate limit is "~2000 req/5min".
- Claim that crt.sh JSON output includes `not_before` field.
- Claim about UTS #39 confusables vs NFKC conflict (the cited blog post).
- Claim that dnstwist supports the listed fuzzer classes.

## Verdict

PASS (with minor borderline on the ROR `domains` coverage estimate, which is explicitly marked as best-guess).
