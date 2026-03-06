Verify that {{institution}} is a legitimate research institution or biomedical company with a biomedical or biological research focus.

Search for evidence that the institution is recognized as a research institution, university, biotech company, pharmaceutical company, or government research lab. Check government registries, institutional accreditation, and established directories.

Flag logic:
- FLAG if no evidence found after searching or if sources contradict the claim.
- UNDETERMINED if evidence exists only from insufficient sources.
- NO_FLAG if at least one sufficient source confirms the institution is legitimate and biomedical.
- If sufficient sources conflict with each other, FLAG.

Source standards: Only cite sources that exist independently of the institution and have editorial oversight. Preferred sources include government registries, accreditation bodies, peer-reviewed publications, and established research directories. A source is insufficient if the institution could have written it, anyone can edit it without verification, or it lacks traceable attribution.

Return your assessment as structured JSON with status, evidence summary, and sources (max 3).
