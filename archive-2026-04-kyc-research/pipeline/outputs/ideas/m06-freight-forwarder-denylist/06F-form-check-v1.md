# Form check: m06-freight-forwarder-denylist / 06-coverage-v1.md

## Schema field: `coverage_gaps`

- [PASS] Six gaps identified, each with category, estimated size, behavior classification, and reasoning.
- [FLAG] Gap 1 global freight forwarder count (100,000–200,000) is a `[best guess]` derived loosely from US figures. Consider searching for FIATA membership statistics or global freight forwarding market reports for a firmer anchor.
- [FLAG] Gap 2 is `[unknown]` — the search list is reasonable. The best guess about DNA synthesis shipping patterns (mostly direct courier) is plausible but unsourced.
- [FLAG] Gap 3 is `[unknown]` — search list overlaps with m06-bis-entity-list Gap 5. Acceptable given the structural similarity.
- [FLAG] Gap 5 is `[unknown]` — the observation that TIP is Russia-focused is well-stated. The search for non-Russia diversion forwarder data found nothing; this is an honest gap.

## Schema field: `false_positive_qualitative`

- [PASS] Four categories cross-referenced with gaps. Good integration.
- [PASS] Allowlist recommendation for major forwarders is consistent with stage 4.

## Sourcing conventions

- [PASS] NCBFAA membership figure cited. TIP/BIS references consistent with stage 4.
- [FLAG] The "700 foreign suppliers" figure from BIS red-flag letters could use the primary BIS source rather than a secondary trade-press citation.

## Structure

- [PASS] All required sections present.
- [PASS] Each gap has required sub-fields.

## Summary

5 flags, 0 blockers. Main issues: global forwarder count is loosely estimated; two `[unknown]` gaps with reasonable search lists; one secondary-source citation that could be strengthened.
