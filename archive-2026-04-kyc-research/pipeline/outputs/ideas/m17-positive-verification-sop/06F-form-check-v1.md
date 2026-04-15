# 06F Form check: m17-positive-verification-sop

**Verdict: PASS**

All 6 gaps have precise category definitions, estimated sizes with citations or explicit [best guess]/[unknown] markers, behavior classification, and reasoning. Gap 1 has one [unknown] for shell-entity frequency — appropriately marked with search terms. Gap 6 has one [unknown] for average academic lab size. False-positive qualitative section cross-references gaps. Notes for stage 7 present and substantive.

**Notable finding flagged for stage 7:**
- Gap 3 provides cited data contradicting the implementation doc's DMARC enforcement estimate (>70% claimed vs ~20-30% actual for universities). This is a material correction that should be carried forward into the stage 7 synthesis and potentially back into a v3 revision of the implementation doc.

**Minor observations (not blocking):**
- Gap 1 (purpose-built organizations) is categorized as a false-negative for attackers rather than a coverage gap for legitimate customers. Like the analogous gap in m05, this is defensible as context for stage 7 but stretches the stage 6 prompt's focus on legitimate-customer categories.
- Gap 6 (same-person contact) is a nuanced observation that adds value but may be hard to quantify precisely. The [unknown] marker for lab-size data is appropriate.
