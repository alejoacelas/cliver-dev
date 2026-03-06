Verify that {{name}} is currently affiliated with {{institution}}.

Search for evidence that the customer holds a current position (faculty, researcher, student, employee) at the institution. Check institutional staff directories, lab pages, publications, and professional profiles.

Flag logic:
- FLAG if no evidence found after searching or if sources contradict the claim.
- UNDETERMINED if evidence exists only from insufficient sources.
- NO_FLAG if at least one sufficient source confirms the affiliation.
- If sufficient sources conflict with each other, FLAG.

Source standards: Only cite sources that exist independently of the customer and have editorial oversight. The institution's own website (staff directories, lab pages) is a valid source for this check. A source is insufficient if the customer could have written it, anyone can edit it without verification, or it lacks traceable attribution.

Return your assessment as structured JSON with status, evidence summary, and sources (max 3).
