# Coverage research: NIH / NSF / Wellcome / ERC PI lookup

## Coverage gaps

### Gap 1: Researchers who are not PIs (postdocs, students, technicians, staff scientists)
- **Category:** The majority of life-sciences researchers who have never served as PI or co-PI on a funded grant from any of the five covered agencies. This includes postdocs, graduate students, lab technicians, staff scientists, lab managers, and core facility personnel.
- **Estimated size:** Among life-sciences PhD holders who remain in academic careers, only ~50% become PIs; ~19% remain postdocs and ~30% hold other academic roles ([source](https://elifesciences.org/articles/78706)). Only ~26% of academic postdocs in the life sciences land faculty jobs ([source](https://elifesciences.org/articles/78706)). The non-PI population is the majority of synthesis order-placers. [best guess: 60–75% of individual researchers who place synthesis orders are not PIs on any grant in these databases]
- **Behavior of the check on this category:** no-signal (no_pi_record fires)
- **Reasoning:** This check is explicitly positive-evidence-shaped. PI status is a strong positive signal, but absence of PI status is expected for most legitimate researchers and carries minimal negative weight.

### Gap 2: Industry / commercial researchers
- **Category:** R&D scientists at biotech, pharmaceutical, and other commercial companies. These researchers are almost never PIs on publicly funded grants (their work is privately funded).
- **Estimated size:** ~50% of DNA synthesis market revenue comes from commercial customers ([source](https://www.grandviewresearch.com/industry-analysis/us-dna-synthesis-market-report)). [best guess: >90% of industry R&D staff have no PI record in any of the five public-funder databases. Some have past academic PI records from before transitioning to industry, but their current role is unfunded by these agencies.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The databases cover public funding only. HHMI, Chan Zuckerberg Initiative, Gates Foundation, and all corporate R&D funding are outside scope.

### Gap 3: Researchers funded by agencies outside the five covered (Asia, Africa, Latin America, Middle East)
- **Category:** Researchers whose grants come from national funding agencies not covered by this check: NSFC (China), JSPS (Japan), DST (India), NRF (South Korea, South Africa), CONACYT (Mexico), FAPESP (Brazil), ARC (Australia), and dozens of others.
- **Estimated size:** The five covered agencies (NIH, NSF, Wellcome, ERC, UKRI) collectively represent the US, UK, and EU funding landscape. Major research nations like China, Japan, South Korea, India, Australia, Canada (CIHR, NSERC), and all of Africa/Latin America/MENA are not covered. [best guess: 40–60% of the world's active life-sciences researchers are funded primarily by agencies outside the five covered, including the large and growing Chinese and Indian research workforces]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** A Japanese PI funded by JSPS, or a Brazilian PI funded by FAPESP, will return no_pi_record despite having an active, funded research program.

### Gap 4: Researchers funded by private philanthropy
- **Category:** Researchers whose primary funding comes from private foundations (HHMI, Simons Foundation, Chan Zuckerberg Initiative, Gates Foundation, Kavli Foundation, Allen Institute) that do not publish grant data in 360Giving or equivalent open formats.
- **Estimated size:** HHMI alone funds ~300 investigators; CZI funds hundreds of bioscience projects. [best guess: 2–5% of US/EU-based PIs have primary funding from private philanthropy rather than NIH/NSF/ERC/UKRI/Wellcome. Wellcome is included in this check, but most other private funders are not.]
- **Behavior of the check on this category:** no-signal (unless the researcher also holds an NIH/NSF/etc. grant)
- **Reasoning:** Private philanthropy is growing as a funding source in life sciences. These researchers are fully legitimate but invisible to the public-funder databases.

### Gap 5: New investigators in their first grant cycle
- **Category:** Researchers who have just been awarded their first grant but whose award has not yet been indexed (NIH RePORTER updates weekly; NSF updates with variable lag; Wellcome/CORDIS are quarterly bulk files).
- **Estimated size:** [best guess: at any given time, 1–3% of newly funded PIs have awards not yet reflected in the databases due to indexing lag. For Wellcome and CORDIS bulk files, lag can be 3–6 months.]
- **Behavior of the check on this category:** false-positive (trips no_pi_record despite having real funding)
- **Reasoning:** Indexing lag is a known issue. NIH RePORTER is near-real-time; the bulk-file sources are slower.

### Gap 6: Common-name disambiguation failures
- **Category:** Researchers with very common names (e.g., "Wei Zhang", "Maria Garcia", "John Smith") where the PI search returns multiple candidates and no ORCID or institutional disambiguator resolves the match.
- **Estimated size:** [best guess: 5–10% of lookups will have name ambiguity requiring manual disambiguation. Among those, perhaps 1–2% will be unresolvable without additional information, leading to a false no-match or false match.]
- **Behavior of the check on this category:** weak-signal (ambiguous match, not actionable without corroboration)
- **Reasoning:** None of the five funder APIs use ORCID as a primary key (though NIH RePORTER has begun linking). Name-only search is inherently ambiguous for common names.

## Refined false-positive qualitative

This check is overwhelmingly positive-evidence-shaped. Updated list:

1. **Non-PI researchers** (Gap 1) — the largest miss population (~60–75% of order-placers). Expected null result.
2. **Industry researchers** (Gap 2) — >90% invisible. No public grant PI record.
3. **Non-US/UK/EU researchers** (Gap 3) — ~40–60% of global researchers funded by uncovered agencies.
4. **Privately funded researchers** (Gap 4) — 2–5% in US/EU, fully legitimate.
5. **New investigators** (Gap 5) — transient lag, 1–3%.
6. **Name collisions** (Gap 6) — 5–10% of lookups ambiguous; 1–2% unresolvable.

The only true false-positive (wrong-person match accepted as legitimate) occurs in Gap 6 when a common name matches a different person's PI record. This is an accuracy issue mitigable by requiring institution agreement.

## Notes for stage 7 synthesis

- This check is the strongest individual-level positive signal available: a confirmed PI on NIH/NSF/ERC/Wellcome/UKRI grants is very high-confidence evidence of a legitimate researcher.
- But the check is null for the majority of legitimate customers. It should never be used as a denial gate; only as a confidence booster in a multi-signal model.
- Coverage could be extended by adding CIHR (Canada), ARC (Australia), DFG (Germany), NSFC (China) — but each requires its own API integration and many don't offer name-searchable APIs.
- The claim-vs-reality check (customer claims PI status + null result = substantive flag) is the most valuable negative use of this data.
- Pair with m19-openalex-author and m19-pubmed-scopus for researchers who publish but aren't PIs; pair with m19-orcid-employments for employment verification.
