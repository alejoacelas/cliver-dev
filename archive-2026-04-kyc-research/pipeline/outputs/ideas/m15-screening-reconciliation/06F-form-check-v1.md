# Form check: m15-screening-reconciliation / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap | Category precision | Size estimate | Citation quality | Behavior label | Verdict |
|---|---|---|---|---|---|---|
| 1 | Novel sequences not in vendor DBs | Precise (de novo, codon-optimized, uncharacterized) | [best guess: >95% known agents covered] + structural argument | Battelle blog cited; NIST study cited but no FN rate extracted | no-signal | PASS -- structural gap appropriately characterized |
| 2 | Short sequences <200 bp | Precise | [best guess: 20-40% of order lines] | Battelle 200bp post cited; no direct data on order-line length distribution | weak-signal | FLAG: the 20-40% estimate is load-bearing and unanchored. Consider searching for Twist/IDT product mix (oligos vs genes vs gene fragments) for a proxy. |
| 3 | Benign select-agent genes (FP) | Precise | 7-9% non-regulated matches per Battelle sensitivity study | Well-cited (PMC) | false-positive | PASS |
| 4 | Attacker-aligned declarations | Precise (cro-framing, gradual-legitimacy) | N/A -- structural limitation, not a population size | Correctly scoped as a design limitation | no-signal | PASS |
| 5 | Vendor disagreement (ambiguous) | Precise | [unknown] with search list | Search list is present; NIST study cited as potential source | weak-signal | PASS |

## Schema field: `false_positive_qualitative`

Refined list with 4 categories. Cross-references Gap 3 (benign select-agent genes) with the 7-9% figure. Includes vaccine/diagnostic and plasmid-backbone cases from the implementation. PASS.

## Schema field: `notes for stage 7 synthesis`

Present and actionable (structural novel-sequence limitation, assembly-based screening for short seqs, FP rate as operational cost, pairing argument). PASS.

## Overall form verdict

**1 FLAG:**
1. Gap 2 (short sequences) size estimate of 20-40% is important and needs a citation or explicit [unknown] upgrade.

Otherwise well-cited and structurally sound. The gap list is appropriate for a multi-vendor sequence-screening reconciliation check.
