# m06-hs-eccn-classification — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | HS code / ECCN classification SOP |
| **measure** | M06 — shipping-export-country |
| **attacker_stories_addressed** | foreign-institution (re-export step requires correct ECCN); supports m06-bis-country-groups for any attacker shipping internationally |
| **summary** | Reviewer SOP for assigning both an HS code (for customs) and an ECCN (for EAR licensing) to each synthesis order. The operative ECCN is 1C353 ("genetic elements and genetically modified organisms" — controlled iff the sequence encodes or is a gene specific to a 1C351/1C354 listed pathogen or toxin), with EAR99 as the default. The classification drives the licensing matrix in m06-bis-country-groups. HS code is typically 2934.99 (nucleic acids). Decision tree starts with the sequence-screening pipeline output: no SOC hit = EAR99, SOC hit = protein-coding hazard analysis per BIS 1C353 interpretive guidance. |
| **external_dependencies** | BIS 1C353 interpretive guidance (PDF); BIS BioExport guidance; 15 CFR § 742.2 (CB controls); ECCNs 1C351/1C353/1C354 in Supplement No. 1 to Part 774; HHS/IGSC SOC list; Australia Group control list; HS schedule heading 2934; December 2023 EAR amendment (removes 1C353 license requirement for AG members, with exceptions for 1C351.d.14/.15). Upstream dependency: provider's sequence-screening pipeline output. |
| **endpoint_details** | No API — human SOP. **Decision tree:** (1) SOC screening hit? No = EAR99, HS 2934.99. (2) Yes = protein-coding hazard analysis per BIS guidance: does the sequence encode a protein posing significant hazard to human/animal/plant health? No = likely EAR99. Yes = 1C353. (3) AG-member destination (post-Dec 2023)? If yes and not 1C351.d.14/.15 derivatives, no license required. (4) Non-AG destination + 1C353 = license required for CB Col 1 + AT Col 1 destinations. **HS:** default 2934.99.90. **Auth:** N/A. **Pricing:** internal labor; vendor alternative (Descartes, Crown Trade) at `[vendor-gated]` $5K–$25K/yr. |
| **fields_returned** | Classification record: `eccn` (1C353 / EAR99 / other), `eccn_subparagraph`, `eccn_rationale` (which 1C351/1C354 entry the sequence is specific to, or "no SOC hit"), `hs_code` (2934.99.x), `cb_column` (1/2/NA), `at_column` (1/NA), `australia_group_destination` (boolean), `december_2023_exemption_applies` (boolean), `classification_date`, `reviewer_id`. |
| **marginal_cost_per_check** | **EAR99 path:** near-zero (SOP terminates in seconds on no SOC hit). **1C353 path:** ~15–45 min reviewer time, ~$15–$45/case [best guess]. **Setup cost:** ~$10K–$30K to write SOP, integrate with screening output, train reviewers [best guess]. |
| **manual_review_handoff** | This IS the manual review step. **EAR99 default:** logged, no further action. **1C353:** reviewer hands off to export compliance, who runs licensing matrix from m06-bis-country-groups; if license required and customer lacks one, order held or denied. **Ambiguous case:** senior compliance reviewer + written rationale + possible CCATS request to BIS (months-long). |
| **flags_thrown** | `eccn_1c353_required` (SOC hit + hazard analysis confirms 1C353 = license-required path); `eccn_classification_ambiguous` (hazard analysis uncertain = escalate); `december_2023_exemption_applied` (1C353 to AG member, documented, no license required); `hs_classification_unusual` (non-standard product format). |
| **failure_modes_requiring_review** | Ambiguous SOC hit (partial match, homologous sequence); toxin/subunit items under 2023 amendments (1C351.d.14/.15); chimeric sequences with controlled + uncontrolled segments; delivery vectors (plasmids, AAV) carrying controlled genes; CCATS process (months-long); non-standard format sequences the screening pipeline didn't fully parse. |
| **false_positive_qualitative** | (1) Legitimate researchers ordering fragments of controlled pathogens (diagnostic primers, vaccine antigens, antibody fragments) — dominant FP burden; ~5% of orders trigger SOC screening, most resolve to EAR99 after review [source: PMC/EBRC]. (2) Therapeutic/vaccine developers (BARDA/CEPI/NIAID portfolio) — high-value, high-volume, recurring classification friction. (3) Public health surveillance labs ordering assays for controlled pathogens. (4) Academic teaching kits with harmless pathogen fragments. Dec 2023 AG exemption reduces licensing burden for Western collaborators but not classification workload. |
| **coverage_gaps** | (1) Novel/chimeric sequences not on SOC list: screening pipeline doesn't flag, SOP defaults to EAR99 [unknown size; SOC list is backward-looking]. (2) Delivery vectors with controlled payloads: complex classification, ambiguous cases common [unknown size]. (3) Modified-base products (LNA, PNA, morpholinos) complicating HS classification and hazard analysis [unknown size]. (4) Non-US providers operating under different export-control regimes — SOP is US-specific; non-US providers are 45–60% of global market. (5) 1C353 classification rate: likely <1% of total orders [best guess from 5% SOC screening hit rate]. |
| **record_left** | Classification record, sequence-screening output, protein-coding hazard analysis rationale (for 1C353 cases), reviewer signoff, linkage to order ID and licensing decision from m06-bis-country-groups. Retention: 5 years per 15 CFR § 762.6. Classification rationale is the audit-defense artifact. |
| **bypass_methods_known** | Non-SOC sequences = EAR99 default, zero leverage (MISSED, structural); 1C353 to AG member (Japan) = exemption applies, no license required (CAUGHT but legal); 1C353 to non-AG member (India, Brazil) = license required (CAUGHT); chimera/fragment evading screening = depends on upstream pipeline (AMBIGUOUS). |
| **bypass_methods_uncovered** | Non-SOC sequences classify as EAR99 and require no license — structural EAR limitation. Chimera/fragment ordering that evades upstream sequence screening — SOP has no independent sequence analysis. December 2023 AG exemption removes license requirement for Japan — legal, not a gap. |

---

## Section 2: Narrative

### What this check is and how it works

This idea is a reviewer standard operating procedure — not a data-source lookup — for assigning export-control classifications to synthesis orders. Every order receives both an HS code (for customs: typically 2934.99, nucleic acids) and an ECCN (for EAR licensing). The decision tree begins with the provider's sequence-screening pipeline: if no sequence of concern is flagged, the order defaults to EAR99, which requires no export license except to comprehensively embargoed countries. If a SOC hit fires, the reviewer performs a protein-coding hazard analysis per BIS's 1C353 interpretive guidance — determining whether the sequence encodes a protein that "in itself or through its transcribed or translated products represents a significant hazard." Sequences confirmed as 1C353 then enter the licensing matrix from m06-bis-country-groups, where the destination country's group membership determines whether a license is required. A December 2023 EAR amendment removed the license requirement for most 1C353 items shipped to Australia Group member countries, significantly reducing the licensing burden for Western collaborators.

### What it catches

The SOP catches orders containing genetic elements specific to controlled pathogens (1C351/1C354 agents) when shipped to non-AG-member destinations. For a 1C353-classified order bound for India, Brazil, Indonesia, or Vietnam, the SOP fires a license-required flag and escalates to export compliance — the attacker would need a BIS license, which is a high bar. The SOP also correctly handles the AG-member exemption: Japan is an AG member, so 1C353 items ship there license-free post-December 2023. For the foreign-institution attacker story, the SOP catches the specific scenario where the attacker orders controlled sequences and ships to a non-AG, non-embargoed destination.

### What it misses

The SOP has zero leverage on orders that do not trigger a SOC screening hit — which is the vast majority. An attacker ordering non-SOC sequences (cloning vectors, expression constructs for non-listed agents, enabling components) receives an EAR99 classification and ships to any non-embargoed destination without restriction. This is structural: the EAR does not control EAR99 items, and the SOP correctly implements the regulation. The SOP is also bounded by the upstream sequence-screening pipeline: if the pipeline has a false negative (fails to flag a chimeric, codon-shuffled, or fragmented version of a controlled sequence), the SOP defaults to EAR99. Novel or engineered sequences not on the current SOC list represent an unknown but growing gap as synthetic biology advances. Additionally, the SOP applies only to US-jurisdiction exports; non-US providers (45–60% of the global market) operate under different classification frameworks.

### What it costs

For the default EAR99 path (~95% of orders), cost is near-zero — the SOP terminates in seconds. For the 1C353 path, each case requires approximately 15–45 minutes of compliance reviewer time ($15–$45 per case). Setup cost is estimated at $10K–$30K to write the SOP, integrate with the sequence-screening output, and train reviewers. The dominant operational cost is the false-positive review burden: approximately 5% of orders trigger SOC screening flags, and while most resolve to EAR99, each requires the full hazard analysis before the reviewer can clear it. This disproportionately impacts vaccine developers, diagnostic primer manufacturers, and public health surveillance labs — the provider's highest-value legitimate customers.

### Operational realism

This idea is inherently a manual review step, not an automated gate. The classification record becomes the input to m06-bis-country-groups; without it, the Country Chart lookup cannot run. For ambiguous cases (chimeric constructs, novel toxin subunits, delivery vectors with controlled payloads), the SOP escalates to senior compliance staff and may trigger a CCATS request to BIS — a months-long process during which the order is held. The classification record, hazard analysis rationale, and reviewer signoff are retained for 5 years per 15 CFR § 762.6 and serve as the audit-defense artifact in any subsequent BIS inquiry. The December 2023 AG-member exemption reduced licensing friction but introduced a new documentation requirement: the `december_2023_exemption_applied` flag must be logged to demonstrate the exemption was correctly applied.

### Open questions

Three coverage gap sizes remain unknown: novel/chimeric sequences not on the SOC list (backward-looking list in a forward-looking field), delivery vector classification complexity, and modified-base product share. The 5% SOC screening hit rate (the best available proxy for the SOP's review workload) comes from a 2022 EBRC policy paper and may not reflect current screening-tool sensitivity or current ordering patterns. The December 2023 EAR amendment is referenced in the implementation without a specific Federal Register citation — the 4C claim check flagged this as a soft revise. The HS classification anchor (Flexport reference for 2934.99) is a secondary source; a USITC HTS link would be more authoritative.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** The SOP correctly implements BIS regulations; its limited adversarial leverage is structural (EAR99 items are uncontrolled) rather than an implementation gap.
- **`[unknown]` fields affecting policy implications:**
  - 1C353 classification rate: <1% of total orders [best guess]; no public data on the actual rate.
  - Novel/chimeric sequences not on the SOC list: unknown size; the SOC list is inherently backward-looking.
  - Delivery vector (plasmid, AAV) classification fraction: no quantitative data on the proportion of synthesis orders that are vectors.
  - Modified-base product share: no systematic data found.
- **`[vendor-gated]` fields:**
  - Trade-compliance classification services (Descartes, Crown Trade): $5K–$25K/yr, sales contact required.
- **06F flags not fully resolved:**
  - 5% SOC screening hit rate from 2022 EBRC paper — may not reflect current sensitivity; should note vintage.
  - December 2023 EAR amendment lacks a specific Federal Register citation (only root URL provided).
  - Flexport HS code reference is a secondary source; USITC HTS link would be more authoritative.
- **Stage 5 Moderate findings:**
  - EAR99 default: zero leverage on non-SOC orders is structural and not addressable by this SOP. The gap is mitigated by other M06 ideas that operate independently of item classification.
  - Upstream sequence-screening dependency: the SOP's reliability is bounded by the screening pipeline's sensitivity. Periodic calibration of the screening pipeline against the 1C351/1C354 agent list is a prerequisite.
- **Cross-measure dependency:** This SOP is the gatekeeper for m06-bis-country-groups. Its coverage gaps (especially novel sequences and screening pipeline false negatives) propagate directly to the Country Chart lookup.
- **Scope limitation for policymakers:** The ECCN framework covers only US-jurisdiction exports. Non-US providers (45–60% of the global market) operate under different classification systems (EU Dual-Use Regulation, UK Export Control Order, Wassenaar implementations). A global screening regime would need harmonized classification.
