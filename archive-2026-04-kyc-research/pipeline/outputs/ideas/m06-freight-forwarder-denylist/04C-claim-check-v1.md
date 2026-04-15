# 4C claim check — m06-freight-forwarder-denylist v1

## Trade Integrity Project

- **URL:** https://www.tradeintegrityproject.com/
- **Verification:** TIP is a real research project run by KSE Institute and the Yermak-McFaul Expert Group on Russian Sanctions. Wikipedia (Yermak-McFaul Expert Group on Russian Sanctions) and the KSE Institute press release (search-result hit "KSE Institute & Yermak-McFaul Sanctions Group: 174 Foreign Components Found in Russian Military Drones") confirm the affiliation. Visual Compliance and BIS guidance both reference TIP. **PASS.**
- **Note:** The exact root URL `tradeintegrityproject.com` is the canonical landing page commonly cited; the TIP search interface lookup behavior described in v1 (party-name search bar, no bulk download) matches Visual Compliance's published characterization.

## BIS July 2024 diversion-risks guidance

- **URL:** https://www.bis.gov/press-release/bis-issues-guidance-addressing-export-diversion-risks
- **PASS.** Real BIS press release URL; the guidance covers exactly the diversion-risk countries list, the recommendation to screen against TIP, and the address-vs-name screening expectation cited.

## Tri-Seal Compliance Note March 2024

- **URL:** https://www.bis.doc.gov/index.php/documents/enforcement/3240-tri-seal-compliance-note/file
- **PASS.** Real BIS-hosted PDF of the joint DOJ/Treasury/Commerce note.

## "Don't Let This Happen To You" 2024 update

- **URL:** https://www.bis.doc.gov/index.php/documents/enforcement/1005-don-t-let-this-happen-to-you-1/file
- **PASS.** Canonical BIS-hosted PDF; March 2024 update confirmed in BIS press release.

## CHPL

- **Claim:** BIS publishes a Common High Priority List.
- **PASS.** The CHPL is a real, well-known BIS publication co-published with EU/UK/JP partners; updated periodically. The exact URL given in v1 (`/sites/default/files/files/CHPL_2023-07.pdf`) follows BIS's URL convention but should be replaced with the latest version path before publication. **WEAK URL** — flag for refresh; the document exists, but URL versioning may be stale.
- **Suggested fix:** Replace with the BIS landing page that hosts the current CHPL revision rather than a date-stamped PDF.

## OFAC October 2024 Compliance Communiqué scenario

- **URL referenced in search:** https://ofac.treasury.gov/media/933556/download?inline=
- **PASS.** Real OFAC-hosted document; the freight-forwarder swap scenario is summarized in the search-result excerpt and was widely covered (Venable, sanctions.io).

## Verdict

REVISE-LITE. All substantive claims hold; only the CHPL URL should be re-pointed at a stable BIS landing page in v2 if convenient. Not blocking.
