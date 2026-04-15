# Coverage research: NSF + UKRI + ERC/CORDIS funded-institution signal

## Coverage gaps

### Gap 1: Institutions in countries outside the US, UK, and EU
- **Category:** Research institutions in Asia-Pacific (except those participating in Horizon Europe as associated countries), Latin America, Africa, the Middle East, and other regions not covered by NSF (US), UKRI (UK), or CORDIS (EU + associated countries). These institutions may have funding from national agencies (e.g., JSPS in Japan, NRF in South Korea, NSFC in China, CNPq in Brazil, DST in India) that are not in this stack.
- **Estimated size:** NSF funds ~1,900 institutions annually ([source](https://www.nsf.gov/about/about-nsf-by-the-numbers)). UKRI supported 10,920 organisations in 2024–25 ([source](https://www.ukri.org/publications/annual-report-and-accounts-2024-to-2025/ukri-annual-report-and-accounts-2024-to-2025/)). Horizon Europe CORDIS lists ~4,641 distinct participating organizations across 162 countries ([source](https://data.europa.eu/data/datasets/cordis-eu-research-projects-under-horizon-europe-2021-2027)). The union of these three funders covers primarily the US, UK, and EU research ecosystems. Asia-Pacific holds ~38% of the gene synthesis market ([source](https://www.imarcgroup.com/gene-synthesis-market)). [best guess: 30–40% of global synthesis-buying research institutions are in countries where none of these three funders provides coverage. Major national funders (JSPS, NRF, NSFC) are absent from the stack.]
- **Behavior of the check on this category:** no-signal (`no_funder_record_5yr` fires but is expected and uninformative)
- **Reasoning:** The check combines three major Western funders but leaves out the entire Asian, African, and Latin American national funding landscape.

### Gap 2: Industrial and for-profit entities
- **Category:** Commercial biotech companies, pharmaceutical companies, CROs, and agricultural biotech firms that do not receive NSF, UKRI, or EU grants. Large pharma funds its own R&D; many biotechs rely on VC; CROs are fee-for-service.
- **Estimated size:** ~46% of the gene synthesis market is commercial/industry ([source](https://www.novaoneadvisor.com/report/us-gene-synthesis-market)). Some UK SMEs receive UKRI funding (UKRI supported 9,121 SMEs in 2024–25 per [source](https://www.ukri.org/publications/annual-report-and-accounts-2024-to-2025/)), and some US small businesses receive NSF SBIR/STTR. But the majority of commercial synthesis customers have no public funder record. [best guess: 70–80% of commercial synthesis customers have no record in any of these three funders.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** Same structural gap as in m18-nih-reporter. Public-funder checks inherently miss privately funded entities.

### Gap 3: Teaching-only institutions
- **Category:** Colleges and universities that focus on teaching rather than research. These institutions may have legitimate life-sciences programs that order DNA synthesis for teaching labs but have no NSF/UKRI/CORDIS research grants.
- **Estimated size:** In the US, there are ~4,000 degree-granting institutions; NSF funds ~1,900 annually. [best guess: ~2,000 US institutions have no active NSF award. In the UK, there are ~160+ universities; UKRI funds 504 research/academic institutions ([source](https://www.ukri.org/publications/annual-report-and-accounts-2024-to-2025/)). Teaching-focused colleges and further education institutions are largely excluded.]
- **Behavior of the check on this category:** no-signal (`no_funder_record_5yr` fires; the reviewer should categorize these as "not a research-grant-eligible category" but the flag still adds noise)
- **Reasoning:** Teaching institutions are legitimate synthesis customers for educational purposes (undergraduate teaching labs) but have no footprint in research-funder databases.

### Gap 4: CORDIS data staleness and bulk-dump lag
- **Category:** Institutions that recently joined Horizon Europe projects but whose participation has not yet appeared in the CORDIS bulk download.
- **Estimated size:** CORDIS update frequency is not formally published. [unknown — searched for: "CORDIS open data update frequency", "EU open data portal CORDIS refresh schedule"] — community sources suggest monthly to quarterly updates. [best guess: at any given time, projects finalized in the last 1–3 months may not yet be reflected in the dump. This affects a small fraction of lookups.]
- **Behavior of the check on this category:** false-negative (institution has EU funding but the local index hasn't been updated yet)
- **Reasoning:** The implementation notes "CORDIS dump staleness" as a failure mode. The lag is small but real.

### Gap 5: Name normalization across three different funder naming conventions
- **Category:** Institutions whose names are recorded differently across NSF, UKRI, and CORDIS. NSF uses US-centric names (`awardeeName`); UKRI uses UK names; CORDIS uses legal names in the original language (often non-English). A French university may appear as "Université de Paris" in CORDIS and be searched as "University of Paris" by the customer.
- **Estimated size:** [best guess: 10–20% of lookups for institutions that *are* in one of these databases may fail on name matching for at least one of the three sources. CORDIS `participants` field is a delimited string, not normalized ([per the implementation]), making it the worst for name matching.]
- **Behavior of the check on this category:** false-negative (institution has funding but the lookup misses it due to name mismatch)
- **Reasoning:** The implementation notes CORDIS substring matching and translated-name issues. Cross-funder name normalization is structurally harder than single-funder normalization because each funder uses different naming conventions.

### Gap 6: Institutions funded only by funders not in the stack
- **Category:** Institutions funded by national agencies outside the US/UK/EU (JSPS, NRF, NSFC, CNPq, NHMRC, etc.) or by other US agencies (DoD, DOE, USDA) or private foundations (HHMI, Gates, Wellcome) that are not represented in NSF, UKRI, or CORDIS.
- **Estimated size:** In the US, DoD, DOE, and USDA collectively fund thousands of research institutions. HHMI supports ~300 investigators. Wellcome Trust (UK) funds many institutions also covered by UKRI, but some Wellcome-only institutions exist. [best guess: 5–10% of US synthesis customers and a larger fraction of international customers are funded exclusively by agencies not in this stack.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The combined NIH + NSF + UKRI + CORDIS stack covers the four largest Western public research funders, but the long tail of other funders is not included.

## Refined false-positive qualitative

1. **Institutions in non-US/UK/EU countries** (Gap 1) — `no_funder_record_5yr` fires for legitimate institutions in Asia, Latin America, Africa. Not a false positive per the implementation's design (the flag is soft), but uninformative.
2. **Commercial entities** (Gap 2) — same as above.
3. **Teaching colleges** (Gap 3) — `no_funder_record_5yr` fires for legitimate teaching institutions.
4. **Name normalization misses** (Gap 5) — false negatives, not false positives. Institution has funding but lookup fails.
5. **CORDIS substring false positives** — "Institute of Technology" substring matching across multiple institutions. True false positive. The implementation mitigates with exact + alias lookup.
6. **Funder-jurisdiction mismatch** — a French institution with only CORDIS funding checked against NSF shows `no_funder_record_5yr` for NSF. The implementation's `funder_jurisdiction_mismatch` flag addresses this.

## Notes for stage 7 synthesis

- This idea is explicitly designed as a complement to m18-nih-reporter: it extends the funded-institution signal from NIH-only to NSF + UKRI + CORDIS. Together, the two ideas cover the four largest Western public research funders. But they share the same structural limitation: positive-evidence checks that miss privately funded, commercially funded, and non-Western institutions.
- The combined NIH + NSF + UKRI + CORDIS stack covers a union of roughly ~2,500 (NIH) + ~1,900 (NSF) + ~10,920 (UKRI) + ~4,641 (CORDIS) organizations = perhaps ~15,000–18,000 distinct institutions after deduplication. This is a substantial fraction of the world's research institutions but far from complete.
- The largest remaining gap after combining all four funders is Asia-Pacific and the Global South. Adding JSPS (Japan), NSFC (China), and NRF (South Korea) would substantially close this, but no single API aggregates non-Western funder data.
- Name normalization is the operational bottleneck across all four sources. A shared normalization layer (backed by ROR aliases) would reduce false negatives.
