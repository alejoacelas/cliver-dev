# 04C claim check — m09-irs-990 v1

## Claims verified

1. **IRS S3 bucket `s3://irs-form-990`, public HTTPS, no auth, index.json file with EIN/filer/date/path.** Search results confirm: "All of the data is publicly accessible via the S3 bucket's HTTPS endpoint at https://s3.amazonaws.com/irs-form-990, with no authentication required... index listing all of the available filings is available at s3://irs-form-990/index.json, which includes basic information about each filing including the name of the filer, the Employer Identification Number (EIN) of the filer, the date of the filing, and the path to download the filing." PASS.

2. **Filings from 2011 to present, refreshed monthly.** Search results confirm "filings from 2011 to the present currently available, and the IRS adding new 990 filing data each month." PASS.

3. **ProPublica Nonprofit Explorer API v2 free, simple Data Terms of Use.** Search results confirm: "API is available for free as long as users follow simple Data Terms of Use." PASS.

4. **990-EZ threshold "< $200k revenue and < $500k assets" / 990-N threshold "< $50k revenue".** Search results confirm: "Every tax-exempt organization recognized by the IRS must file Form 990 annually, unless they make less than $200,000 in revenue and have less than $500,000 in assets (in which case they file Form 990-EZ), or make less than $50,000 (filing Form 990N instead)." PASS.

5. **ProPublica returns 40–120 form-specific line items per filing.** Search results confirm: "An additional 40-120 rows of data are returned depending on which form type." PASS.

6. **Candid API has a free 30-day trial; production pricing is sales-gated.** Search results confirm. PASS as `[vendor-gated]`.

7. **GuideStar Pro $1,199/year personal GUI subscription.** Search results confirm "Candid Premium normally costs $1,199/year." PASS.

## Flags

None of the major BROKEN-URL / MIS-CITED / OVERSTATED categories. The `[best guess]` cost extrapolation for Candid API ($5–$50/customer) is reasonable but unverified — could be flagged as UPGRADE-SUGGESTED if Candid sales materials surface a benchmark.

**Verdict:** PASS.
