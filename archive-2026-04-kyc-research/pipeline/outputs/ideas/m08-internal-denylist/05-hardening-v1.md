# m08-internal-denylist — bypass-aware hardening v1

## Attacker stories walked

**None.** Measure 08 (institution-denied-parties) has zero relevant attacker stories in `attackers/by-measure/measure-08-institution-denied-parties.md`. All 19 wg branches model attackers whose institutions trivially clear denied-parties screening by construction. No branch models a previously-denied customer attempting re-entry under a new identity at a synthesis provider, which is the internal-denylist's primary threat model.

Note: the `00-spec.md` lists `previously-declined`, `beneficial-owner-laundering`, and `cro-identity-rotation` as addressed stories, but none of these appear in the wg attacker mapping for measure 08. The `cro-identity-rotation` branch is mapped to other measures (purpose-built-organization profile), not to M08. The internal denylist's value against these patterns is real but untestable against the current wg branch set.

## Findings

No findings. There are no attacker stories to walk against this implementation.

## bypass_methods_known

(none — no attacker stories engage this measure)

## bypass_methods_uncovered

(none — no attacker stories engage this measure)

## Verdict

**PASS** — no attacker stories to walk, therefore no Critical findings. Pipeline continues to stage 6.
