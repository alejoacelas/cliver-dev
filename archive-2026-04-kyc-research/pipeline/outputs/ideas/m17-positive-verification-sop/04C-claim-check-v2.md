# 04C Claim check — m17-positive-verification-sop v2

Claims carried forward from v1 (previously verified): NIH IBC-RMS public roster timing, annual KYC cadence as industry standard, per-check cost benchmarks. All PASS.

New claims in v2:

- **"AUSTRAC guidance states customer information should be verified using reliable and independent documents or electronic data"** — confirmed by [AUSTRAC customer identification guidance](https://www.austrac.gov.au/business/core-guidance/customer-identification-and-verification/customer-identification-know-your-customer-kyc): standard KYC principle of independent verification. PASS.

- **"Companies House officers endpoint returns list of current and resigned officers"** — confirmed by [Companies House API reference](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference/officers): the `/company/{company_number}/officers` endpoint exists and returns officer details. PASS.

- **"NIH IBC-RMS publicly posts IBC chair, BSO contact, and IBC contact email"** — confirmed by [NIH OSP IBC FAQs April 2024](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/): public roster posting requirement effective June 2025. PASS.

- **"The callback-to-independently-obtained-number principle is standard AML/KYC practice"** — correctly marked `[best guess]` with note that it is not codified in a single regulation but is considered best practice across frameworks. Consistent with AUSTRAC and general AML guidance. PASS.

- **"DMARC adoption >70% among US R1 universities"** — correctly marked `[best guess]`. Not directly verified. [unknown — searched for: "DMARC adoption rate higher education 2025", "university DMARC enforcement percentage"]. The claim is plausible given federal mandates (BOD 18-01) and Google/Yahoo 2024 requirements but not empirically confirmed. PASS (as `[best guess]`).

- **"$75-$150 per entity per year (45-90 min at $100/hr)"** — correctly marked `[best guess]`. Arithmetic is consistent. PASS.

**Verdict:** PASS (all new claims either well-sourced or correctly marked as `[best guess]`/`[unknown]`)
