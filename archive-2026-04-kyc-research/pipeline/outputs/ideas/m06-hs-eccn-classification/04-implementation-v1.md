# m06-hs-eccn-classification — implementation research v1

- **measure:** M06 — shipping-export-country
- **name:** HS code / ECCN classification SOP
- **modes:** D (deterministic decision tree applied by a reviewer; the inputs are unambiguous in most cases)
- **summary:** Reviewer SOP for assigning the synthesis order both an HS code (for customs) and an ECCN (for EAR licensing). For DNA/RNA synthesis, the operative ECCNs are [1C353](https://www.bis.gov/media/documents/export-guidance-bis-interpretation-gene-related-eccn-1c353.pdf) ("genetic elements and genetically modified organisms" — controlled if and only if the sequence encodes or is a gene specific to a 1C351/1C354 listed pathogen or toxin), with EAR99 as the default for everything else. HS code is typically [2934.99](https://www.flexport.com/data/hs-code/2934-nucleic-acids-and-their-salts-whether-or-not-chemically-defined-other-heterocyclic-compounds/index.html) (nucleic acids and their salts). The classification SOP drives the licensing matrix in `m06-bis-country-groups`.

- **attacker_stories_addressed:** foreign-institution (re-export step requires correct ECCN); supports m06-bis-country-groups for any attacker shipping internationally

## external_dependencies

- [BIS gene-related ECCN 1C353 interpretive guidance](https://www.bis.gov/media/documents/export-guidance-bis-interpretation-gene-related-eccn-1c353.pdf) — BIS-published interpretation document on what constitutes a "genetic element" and which sequences fall under 1C353.
- [BIS BioExport guidance for life science researchers](https://www.bis.doc.gov/index.php/documents/product-guidance/1107-bioexport-pdf/file).
- [15 CFR § 742.2 (CB controls)](https://www.law.cornell.edu/cfr/text/15/742.2) — chemical and biological weapons proliferation control reasons.
- ECCN definitions: [1C351](https://www.bis.gov/regulations/ear/ccl) (human/animal pathogens and toxins, Australia Group human/animal list), [1C353](https://www.bis.gov/regulations/ear/ccl) (genetic elements), [1C354](https://www.bis.gov/regulations/ear/ccl) (plant pathogens). Authoritative text in Supplement No. 1 to Part 774.
- HHS/IGSC [SOC list](https://aspr.hhs.gov/S3/Documents/SynNA-Guidance-2023.pdf) — sequence-of-concern list, drives whether a sequence is "specific to" a controlled pathogen (the determinative test for 1C353).
- [Australia Group control list](https://www.dfat.gov.au/publications/minisite/theaustraliagroupnet/site/en/index.html) — multilateral basis for 1C351/1C353/1C354.
- HS schedule: [HS heading 2934](https://www.flexport.com/data/hs-code/2934-nucleic-acids-and-their-salts-whether-or-not-chemically-defined-other-heterocyclic-compounds/index.html); HS 2934.99 covers other nucleic acids.
- [December 2023 EAR amendment](https://www.federalregister.gov/) removing the license requirement for many 1C353 DNA/RNA shipments to Australia Group members (a change relevant to the SOP).

## endpoint_details

- **No API.** This is a human SOP; the inputs are the screening output (sequence-of-concern hits from the provider's sequence screening system) and the synthesis product description.
- **Decision tree (verbatim from BIS guidance translated into a checklist):**
  1. Did the sequence-screening pipeline flag the order as containing a sequence "specific to" a 1C351 or 1C354 listed agent (or a toxin/subunit under 1C351.d)? **No → EAR99 (default), HS 2934.99, no license required.**
  2. **Yes →** check whether the sequence is capable of encoding a protein that is "in itself or through its transcribed or translated products represents a significant hazard to human, animal or plant health, or could endow or enhance pathogenicity." [BIS 1C353 interpretive guidance].
     - No → likely 1C353 does NOT apply (BIS guidance contemplates short non-coding fragments as outside scope) — but reviewer documents the analysis. EAR99.
     - Yes → **1C353**. Apply Country Chart: license required for CB Column 1 and AT Column 1 destinations.
  3. Is the destination an Australia Group member (post-Dec 2023 amendment)? If yes AND the item is 1C353 (excluding 1C351.d.14/.15 derivatives), no license required.
  4. Is the item also covered by 1C351.d.14 or .15 (toxins, marine toxins added in 2023)? Special case — license still required.
- **HS classification:** default to 2934.99.90 (nucleic acids, other) for synthesized DNA/RNA. Reviewer notes any non-standard product (lyophilized vs in solution; modified vs unmodified bases) but the heading is stable.
- **Auth:** N/A.
- **Pricing:** Internal labor only. Optional vendor: trade-compliance classification services (Descartes, Crown Trade) at `[vendor-gated]` $5K–$25K/yr.

## fields_returned

The reviewer produces a classification record:

- `eccn` (1C353 | EAR99 | other)
- `eccn_subparagraph` (e.g., 1C353.a.1 if applicable)
- `eccn_rationale` (verbatim: which 1C351/1C354 entry the sequence is specific to; or "no SOC hit, default EAR99")
- `hs_code` (2934.99.x)
- `cb_column` (1 | 2 | NA)
- `at_column` (1 | NA)
- `australia_group_destination` (boolean)
- `december_2023_exemption_applies` (boolean)
- `classification_date` and `reviewer_id`

## marginal_cost_per_check

- **Per check (default EAR99 path):** Near-zero. The sequence-screening output already tells the reviewer whether to escalate; if no SOC hit, the SOP terminates in seconds.
- **Per check (1C353 path):** ~15–45 minutes of compliance reviewer time, ~$15–$45/case [best guess: simple decision tree, but documenting the rationale takes a full review cycle].
- **setup_cost:** ~$10K–$30K to write the SOP, integrate with sequence screening output, and train reviewers `[best guess]`.

## manual_review_handoff

- This *is* the manual handoff. Output is a classification record bound to the order.
- **EAR99 default:** no further action; classification logged.
- **1C353 hit:** reviewer hands off to export compliance, who then runs the licensing matrix from `m06-bis-country-groups`. If a license is required and the customer doesn't have one, the order is held pending license application or denied.
- **Ambiguous case** (e.g., a sequence that codes for a fragment of a controlled pathogen but the protein-fragment hazard analysis is non-trivial): senior compliance reviewer + written rationale + possible BIS commodity classification request (CCATS).

## flags_thrown

- `eccn_1c353_required` — sequence-screening hit + protein-coding hazard analysis confirms 1C353 → license-required path
- `eccn_classification_ambiguous` — protein-coding hazard analysis is uncertain → escalate
- `december_2023_exemption_applied` — 1C353 item to AG member; documented but no license required
- `hs_classification_unusual` — non-standard product format (modified bases, conjugates) requiring HS sub-heading review

## failure_modes_requiring_review

- Sequence-screening output is ambiguous (partial SOC hit; sequence variant not on the SOC list but homologous).
- Item is a toxin or toxin subunit explicitly added under the 2023 amendments (1C351.d.14/.15 family).
- Item is a chimera with both controlled and uncontrolled segments.
- Item is a "delivery vector" for a controlled gene (plasmid, AAV) — 1C353 includes vectors.
- Customer requests CCATS (BIS commodity classification ruling) — months-long process.
- Sequence is encoded in a non-standard format the screening pipeline didn't fully parse.

## false_positive_qualitative

- **Legitimate research customers ordering small fragments of controlled pathogens** (e.g., diagnostic primers, monoclonal antibody binding regions, vaccine antigens) where the protein-coding hazard analysis legitimately concludes "no significant hazard" but the screening hit fires anyway. These customers face delay even if the eventual classification is EAR99.
- **Therapeutic / vaccine developers** working on dual-use pathogens (the entire BARDA / CEPI / NIAID portfolio).
- **Public health labs** ordering surveillance assays.
- **Academic teaching kits** that contain harmless fragments of named pathogens for educational use.
- The post-Dec 2023 AG-member exemption substantially reduces FP load on legitimate Western collaborators, but pre-2024 records may still show this category as inflated.

## record_left

- The classification record (above)
- The sequence-screening output that triggered (or didn't trigger) escalation
- For 1C353 cases: the protein-coding hazard analysis written rationale
- Reviewer signoff
- Linkage to the order ID and the eventual licensing decision (handoff record from `m06-bis-country-groups`)

Retention: 5 years per [15 CFR § 762.6](https://www.bis.gov/regulations/ear/part-762-recordkeeping). The classification rationale is the artifact that defends the provider's decision in any subsequent BIS audit.

## bypass_methods_known

(Stage 5 fills.)

## bypass_methods_uncovered

(Stage 5 fills.)
