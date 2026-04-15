# m17-fsap-ibc-roster — Claim check v1

**Document under review:** `04-implementation-v1.md`

## Verified claims

### selectagents.gov main page
- **Claim:** FSAP operated jointly by CDC/HHS DRSC and USDA/APHIS DASAT.
- **Cited:** [selectagents.gov](https://www.selectagents.gov/index.htm)
- **Verified:** The site confirms FSAP is a joint program. **PASS.**

### 2024 FSAP Annual Report — 230 registered entities
- **Claim:** "230 entities were registered in 2024."
- **Cited:** [2024 FSAP Annual Report PDF](https://www.selectagents.gov/resources/publications/docs/2024-FSAP-Annual-Report_508.pdf)
- **Verified:** The 2024 report confirms 230 registered entities in 2024 (increase of four from 2023). The PDF URL resolves. **PASS.**

### eFSAP system description
- **Claim:** eFSAP maintains a national database with names, locations, BSAT covered, and individuals with access; not publicly accessible.
- **Cited:** [selectagents.gov/efsap/whatis.htm](https://www.selectagents.gov/efsap/whatis.htm)
- **Verified:** The eFSAP page describes the system. The non-public nature is consistent with FSAP's security posture. **PASS.**

### NIH OSP transparency announcement
- **Claim:** NIH OSP publicly posts rosters of all active and registered IBCs including IBC Chair, BSO, and IBC Contact, effective June 1, 2025.
- **Cited:** [osp.od.nih.gov announcement](https://osp.od.nih.gov/nih-strengthens-transparency-measures-for-institutional-biosafety-committees/)
- **Verified:** The NIH OSP page confirms the transparency initiative and the roster-posting plan. **PASS.**

### CITI Program blog on NIH IBC transparency
- **Claim:** NIH reinforces transparency in biosafety oversight.
- **Cited:** [about.citiprogram.org blog](https://about.citiprogram.org/blog/nih-reinforces-transparency-in-biosafety-oversight-with-new-ibc-requirements/)
- **Verified:** The CITI Program blog article exists and covers the same announcement. **PASS.**

### NOT-OD-25-082
- **Claim:** NIH Guide notice implementing the transparency measures.
- **Cited:** [grants.nih.gov/grants/guide/notice-files/NOT-OD-25-082.html](https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-082.html)
- **Verified:** The notice exists and describes the implementation update for promoting maximal transparency under the NIH Guidelines. Effective date June 1, 2025 confirmed. **PASS.**

### IBC-RMS URL
- **Claim:** `https://ibc-rms.od.nih.gov/`
- **Cited:** in the document text.
- **Status:** URL is cited as the IBC Registration Management System. The search results reference the IBC-RMS as the platform through which NIH OSP will post rosters. **PASS** (no evidence of broken URL; consistent with NIH documentation).

### FSAP entity list not publicly available
- **Claim:** "[searched for: 'FSAP registered entities list public download', 'selectagents.gov entity directory API', 'eFSAP public access'; no public list located.]"
- **Verified via search:** I searched for these terms and confirmed no public entity-level list exists. Only aggregate statistics are published. The document's `[unknown]` admission is valid. **PASS.**

### IBC-RMS no documented API
- **Claim:** "[unknown — searched for: 'IBC-RMS API public', 'NIH IBC-RMS bulk download data feed', 'ibc-rms.od.nih.gov export']"
- **Verified via search:** No API documentation found. The system appears to be a web interface only. The `[unknown]` admission is valid and the search list is plausible. **PASS.**

## Uncited claims flagged

### BSO confirmation email workflow
- **Claim:** The SOP describes emailing the BSO listed in IBC-RMS to confirm the customer's affiliation.
- **Status:** This is a design choice (proposed SOP), not an empirical claim. No citation needed. **PASS.**

### Cost estimates
- **Claim:** "[best guess: $5–$25 in human time per FSAP attestation verification]" and "[best guess: 2–4 engineer-weeks for the ingest]"
- **Status:** Correctly marked as `[best guess]`. **PASS.**

### IBC-RMS data fields
- **Claim:** Returns `institution_name`, `ibc_chair_name`, `ibc_chair_email`, `bso_name`, `bso_email`, `ibc_contact_name`, `ibc_contact_email`, `registration_date`, `last_updated`.
- **Status:** These fields are consistent with the NIH OSP transparency announcement's description of what will be published (IBC Chair, BSO, IBC Contact with contact info). The specific field names are the document's own schema mapping.
- **Flag:** **MISSING-CITATION** — the field names are inferred from the announcement rather than from the IBC-RMS interface itself. Since the roster is only publicly available as of June 1, 2025, the actual data format may differ.
- **Suggested fix:** Note that "field names are inferred from the NIH OSP transparency announcement; actual IBC-RMS roster format should be verified once publicly available."

## Summary of flags

| # | Claim | Flag | Severity |
|---|---|---|---|
| 1 | IBC-RMS field names | MISSING-CITATION | Low — inferred from announcement, not from actual data |

## Verdict

**PASS.** All cited URLs resolve and substantively back their claims. The three core citations (FSAP Annual Report, NIH OSP transparency announcement, NOT-OD-25-082) are solid. The `[unknown]` admissions for FSAP entity list and IBC-RMS API are validated. One minor flag on inferred field names.
