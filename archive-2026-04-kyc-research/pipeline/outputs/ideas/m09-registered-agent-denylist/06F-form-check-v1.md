# 06F Form check: m09-registered-agent-denylist — coverage v1

## Field-by-field verdicts

### coverage_gaps
**PASS** — Five gaps identified with precise categories. The central finding — that mass-formation services are the default for most small businesses, making the flag structurally noisy — is well-supported with customer counts from the major services. The biotech incubator gap (Gap 2) with specific tenant counts is particularly useful.

### false_positive_qualitative (refined)
**PASS** — Correctly identifies the need for a biotech-incubator whitelist and pass-through-state down-weighting. The concrete improvement suggestions go beyond description to actionable design feedback.

### Notes for stage 7 synthesis
**PASS** — Raises the legitimate question of whether this idea carries its weight in the M09 suite. This is the kind of frank assessment stage 7 needs.

## Flags

### CITATION-MISSING: Gap 3 Delaware entity count
The claim ">1.9 million active business entities" in Delaware is a `[best guess]` attributed to the "Delaware Division of Corporations annual report" without a URL.

### CITATION-MISSING: Gap 3 venture-backed biotech Delaware incorporation rate
The claim "60–70% of venture-backed biotechs are Delaware C-corps or LLCs" is a `[best guess]` with no derivation or source.

## For 4C to verify

1. LegalZoom >4 million businesses served — verify this is current and from a primary source.
2. LabCentral 125 startups capacity — verify from LabCentral's own site.
3. BioLabs >500 companies — verify this figure and whether it's cumulative or concurrent.

## Verdict: PASS

Two minor CITATION-MISSING flags on Delaware statistics. The coverage analysis is substantive and the core finding (extremely high FP rate) is well-supported by the mass-formation service customer counts. No revision needed.
