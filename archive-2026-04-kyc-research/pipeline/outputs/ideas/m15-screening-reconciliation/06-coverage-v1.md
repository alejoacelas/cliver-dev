# Coverage research: Sequence-screening / declaration reconciliation

## Coverage gaps

### Gap 1: Novel sequences of concern not in any vendor database
- **Category:** Orders containing sequences that are functionally equivalent to known SOCs but are not in the reference databases of Aclid, Battelle UltraSEQ, or SecureDNA. This includes de novo designed pathogens, codon-optimized variants that evade homology-based detection, and functional analogs from uncharacterized organisms.
- **Estimated size:** [unknown -- searched for: "fraction of potential biological threats not in screening databases", "novel pathogen sequence coverage gap screening tools", "SecureDNA database coverage percentage known threats"]. The NIST inter-tool analysis evaluated 999 sequence fragments across 6 tools but did not publish a false-negative rate for truly novel threats ([PMC inter-tool analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC12154891/)). Battelle has acknowledged that "the effectiveness of k-mer lookup depends directly on the k-mers included in the reference database" ([Battelle blog](https://inside.battelle.org/blog-details/how-does-dna-sequence-screening-need-to-evolve)). [best guess: the set of known SOCs in vendor databases likely covers >95% of currently regulated select agents and toxins, but the tail of novel engineered threats is unbounded and grows as synthetic biology capabilities advance.]
- **Behavior of the check on this category:** no-signal (all vendors return no flag; the reconciler sees agreement between vendors and the declaration; the order passes).
- **Reasoning:** This is the fundamental structural limitation of any database-dependent screening approach. The reconciliation check only detects disagreements; if all vendors agree "no SOC" because the sequence is novel, there is nothing to reconcile.

### Gap 2: Short sequences below vendor minimum screening length
- **Category:** Orders consisting of short oligonucleotides or gene fragments below the minimum effective screening window (e.g., <200 bp for some Battelle parameter sets).
- **Estimated size:** A substantial fraction of synthesis orders are for short fragments. [best guess: 20-40% of order lines may be below 200 bp, based on the prevalence of oligo, primer, and short gene-fragment orders in synthesis catalogs. IDT, a major provider, primarily sells oligos and short gene fragments.] Battelle's own documentation discusses the 200 bp minimum ([Battelle: why screen 200 bp at a time](https://inside.battelle.org/blog-details/why-screen-sequences-200-bp-at-a-time)). SecureDNA screens shorter fragments but sensitivity decreases with length.
- **Behavior of the check on this category:** weak-signal (screening may run but sensitivity is reduced; vendors may not flag a fragment that is part of a larger SOC when ordered in pieces).
- **Reasoning:** The "order splitting" attack -- ordering a SOC as multiple short overlapping fragments -- is a known evasion method. The reconciliation check sees no vendor flag on each individual fragment. Some vendors attempt assembly-based screening, but this is not universal.

### Gap 3: Benign genes from select-agent organisms (false-positive overload)
- **Category:** Researchers ordering non-virulence genes from organisms that happen to be on the select-agent list (e.g., a metabolic gene from *B. anthracis* or a housekeeping gene from *F. tularensis*). These trigger vendor flags even though the specific gene has no pathogenic function.
- **Estimated size:** The Battelle sensitivity study found 7-9% of screened sequences are non-regulated SOC matches ([PMC sensitivity study](https://pmc.ncbi.nlm.nih.gov/articles/PMC11447129/)). For providers with high academic customer bases ordering genes from diverse organisms, this could mean 5-10% of all flagged orders are benign.
- **Behavior of the check on this category:** false-positive (vendor flags SOC; customer declared "protein expression" for a non-virulence gene; reconciler sees `soc_screening_disagreement`; order escalates to scientific review unnecessarily).
- **Reasoning:** This is a well-known problem in sequence screening. The false-positive rate erodes reviewer trust and creates queue fatigue, reducing the effectiveness of the check for real threats.

### Gap 4: Attacker-aligned orders where declaration matches screening
- **Category:** Sophisticated attackers who declare their SOC use accurately and provide a plausible justification (e.g., "vaccine development" for a pathogen gene). The reconciler finds no disagreement because the declaration and screening output are consistent by construction.
- **Estimated size:** [best guess: this is the fundamental limitation of the reconciliation approach. The check is designed to catch misdeclaration, not to evaluate the legitimacy of a truthful declaration. The fraction of malicious orders where the attacker correctly declares the SOC is unknown but is the scenario addressed by the `cro-framing` and `gradual-legitimacy-accumulation` attacker branches.]
- **Behavior of the check on this category:** no-signal (reconciler sees agreement; no flag fires).
- **Reasoning:** The implementation explicitly acknowledges this: "It does NOT catch `cro-framing` / `gradual-legitimacy-accumulation` because in those branches the declared use is consistent with the screening output by construction."

### Gap 5: Vendor disagreement where no vendor is definitively correct
- **Category:** Orders where one vendor flags an SOC and another does not, and scientific review cannot conclusively determine whether the sequence is a genuine SOC. This is especially common for sequences near the homology threshold.
- **Estimated size:** The NIST inter-tool analysis of 999 sequences across 6 tools would contain data on inter-tool agreement rates, but specific disagreement percentages are not publicly summarized in the abstract ([PMC inter-tool analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC12154891/)). [unknown -- searched for: "sequence screening tool inter-vendor agreement rate", "Aclid SecureDNA Battelle disagreement frequency" -- no public data on pairwise agreement rates.]
- **Behavior of the check on this category:** weak-signal (the `vendor_disagreement` flag fires, but the reviewer has no ground truth to adjudicate).
- **Reasoning:** Multi-vendor reconciliation is valuable precisely because vendors have different databases and algorithms. But when they disagree, the reviewer needs deep expertise to adjudicate. The check surfaces the uncertainty but doesn't resolve it.

## Refined false-positive qualitative

1. **Benign genes from select-agent organisms** (Gap 3): 7-9% of screened sequences trigger non-regulated SOC matches. Highest-volume false-positive source. Creates reviewer fatigue.
2. **Vendor disagreement near homology thresholds** (Gap 5): technical disagreements that require expert adjudication. Volume unknown.
3. **Vaccine/diagnostic developers ordering regulated pathogen sequences** (mentioned in implementation): legitimate use that triggers vendor flags and declaration-screening "disagreement" when the customer's declaration category doesn't precisely match the vendor's threat classification.
4. **Researchers using plasmid backbones with SOC-adjacent regions** (mentioned in implementation): backbone homology to controlled vectors triggers flags.

## Notes for stage 7 synthesis

- The novel-sequence gap (Gap 1) is structural and shared across all sequence-screening-based ideas. It cannot be closed by reconciliation alone -- it requires advances in the underlying screening technology (e.g., function-based screening rather than homology-based).
- The short-sequence gap (Gap 2) is partially addressable by requiring providers to attempt in-silico assembly of concurrent orders from the same customer before screening.
- The false-positive rate from benign select-agent genes (Gap 3) is the main operational cost of this check. If 7-9% of sequences trigger non-regulated matches, and only a small fraction of those are actual misdeclarations, the signal-to-noise ratio for reviewers is poor. This argues for investing in the vendor's specificity tuning (e.g., Battelle's uniqueness-to-select-agent parameter).
- The attacker-aligned-declaration gap (Gap 4) is the reason this check must be paired with m15-ibc-attestation and m15-llm-extraction (which provide independent signals on the customer's legitimacy, not just declaration-screening consistency).
