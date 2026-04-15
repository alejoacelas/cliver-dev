# 04C claim check v1 — m19-nih-nsf-pi

## Verified

- **NIH `pi_names` parameter** with `first_name`/`last_name`/`any_name` structure — confirmed in the repoRter.nih CRAN package documentation, which mirrors the official API. PASS.
- **NIH `multi_pi_only` modifier** — confirmed in same CRAN docs. PASS.
- **NSF Award Search API and `pdPIName` field** — confirmed at resources.research.gov/common/webapi/awardapisearch-v1.htm. PASS.
- **Wellcome Grants Awarded spreadsheet license CC BY 4.0** — explicit on the Wellcome funding-portfolio page. PASS.
- **Wellcome data published in 360Giving format** — explicit on the same page. PASS.
- **Wellcome data covers grants since 2000** — explicit. PASS.
- **CORDIS Horizon 2020 + Horizon Europe ERC PI sub-datasets** — confirmed via CORDIS dataset descriptions on data.europa.eu. PASS.
- **UKRI GtR-2 persons endpoint** — confirmed at gtr.ukri.org/resources/gtrapi2.html (the PDF lists `/persons` route). PASS.
- **World RePORT hosted by NIH covers Wellcome among other funders** — confirmed via Wellcome's funding-portfolio page referencing it. PASS.

## Flags

- **UPGRADE-SUGGESTED** — `[best guess]` on Wellcome quarterly cadence is supportable but should be verified by checking the spreadsheet's `as of` timestamps over the past year. Could become a citation rather than a guess.
- **MINOR** — exact UKRI route may be `/gtr-api/persons` or similar; v2 should re-fetch the PDF to confirm.

## Verdict

PASS.
