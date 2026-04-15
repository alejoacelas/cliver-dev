# 04C Claim check — m04-usps-rdi v1

- **"USPS Web Tools retired January 25, 2026"** — confirmed by [USPS API retirement industry alert](https://developers.usps.com/industry-alert-api-retirement) snippet. PASS.
- **"USPS API v3 uses OAuth 2.0; v1/v2 retired Jan 22, 2025"** — confirmed by [USPS Web Tools page](https://www.usps.com/business/web-tools-apis/) snippet. PASS.
- **"RDI distributed as hash tables, requires CASS certification"** — confirmed by [USPS PostalPro RDI page](https://postalpro.usps.com/address-quality-solutions/residential-delivery-indicator-rdi) snippet. PASS.
- **"Smarty returns up to 55 metadata points including rdi and cmra"** — confirmed by [Smarty US Street API docs](https://www.smarty.com/docs/cloud/us-street-api). PASS.
- **"Smarty per-call ~$0.001–$0.005"** — UPGRADE-SUGGESTED, best-guess only. The Smarty pricing page exists ([smarty.com/pricing](https://www.smarty.com/pricing)) and a v2 should pull a real number from the calculator if accessible.
- **"Smarty has free tier ~250 lookups/month"** — partially confirmed by search snippet noting free tier exists; exact number is from memory. Suggested fix: weaken to "Smarty has a free entry tier."

**Verdict:** PASS-with-minor-revisions (one UPGRADE-SUGGESTED on per-call pricing, one number-from-memory; otherwise solid)
