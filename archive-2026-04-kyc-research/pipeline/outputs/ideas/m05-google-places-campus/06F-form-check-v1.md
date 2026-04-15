# Form check: m05-google-places-campus — 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Estimated size cited? | Behavior labeled? | Issues |
|-----|--------------------|-----------------------|-------------------|--------|
| Gap 1: Missing OSM polygons | Yes | Partially — cites Nature Communications study on OSM building completeness; university-specific figure is [best guess from 04-implementation]; 50–60% polygon availability is [best guess] | no-signal | The 50–60% figure for synthesis-relevant institutions is an important estimate with weak grounding. Flag: **key estimate lacks direct citation**. |
| Gap 2: Multi-campus institutions | Yes | [unknown] properly admitted; 10–20% satellite-site order share is [best guess] | false-positive | Acceptable. |
| Gap 3: Industry customers | Yes | Yes — cites GM Insights and Market.us for industry revenue share (46–52%); order-count fraction is [best guess] | no-signal | Well-grounded. This is the most impactful gap. |
| Gap 4: Off-campus assets | Yes | Partially — references OBFS (~200 field stations) as [best guess from general knowledge] | false-positive | The OBFS reference is uncited. Flag: **uncited factual claim** (should be verifiable). |
| Gap 5: Geocoding errors | Yes | [unknown] properly admitted; 90–95% accuracy is [best guess] | false-positive / false-negative | Acceptable. |

## Schema field: `false_positive_qualitative`

Populated with four categories plus the industry-omission note. Adequate.

## Overall

- **PASS with minor flags.** Two flags:
  1. Gap 1's 50–60% polygon availability estimate is central to the idea's value proposition and lacks a direct citation.
  2. Gap 4's OBFS field station count is stated as general knowledge without a URL.
- The analysis correctly identifies Gap 3 (industry customers) as structural, which is a critical insight for synthesis.
