# Coverage research: USPS RDI + CMRA flag

## Coverage gaps

### Gap 1: International addresses (completely out of scope)
- **Category:** Any customer with a non-US shipping address. USPS APIs only validate US addresses (including territories, APO/FPO/DPO). International addresses are structurally unsupported.
- **Estimated size:** [unknown — searched for: "DNA synthesis gene synthesis shipping international orders percentage non-US customers"]. The DNA synthesis market is global, with major providers operating worldwide. [best guess: 30-50% of synthesis orders from multinational providers (GenScript, Eurofins, GENEWIZ) ship to non-US addresses. For US-only providers (e.g., Twist Bioscience), this may be lower (~10-20%).] The 04-implementation explicitly states: "International addresses → not in scope; route to m03-smarty-melissa."
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The check simply does not run for non-US addresses. This is not a flaw — it is a scope limitation. But it means the check covers only the US slice of the customer base. International PO box / CMRA detection falls entirely to m03-smarty-melissa (Melissa Global) and m03-pobox-regex-sop.

### Gap 2: Non-US synthesis providers who cannot obtain USPS API access
- **Category:** DNA synthesis companies headquartered outside the US that ship to US customers. USPS v3 API access requires a USPS account with a CRID/MID, which is gated on having a US business presence ([USPS developer portal](https://developers.usps.com/apis)).
- **Estimated size:** Major non-US synthesis providers include GenScript (HQ China/NJ), Eurofins (HQ Luxembourg), and several smaller EU/Asian providers. [best guess: 30-40% of synthesis providers by count are non-US-headquartered, though many have US subsidiaries that could obtain CRID/MID.] Providers without US subsidiaries must use a licensed CASS reseller (Smarty/Melissa) instead.
- **Behavior of the check on this category:** no-signal (provider cannot implement)
- **Reasoning:** This is an implementation barrier, not a per-customer gap. But it means the USPS direct-API pathway is unavailable to a fraction of synthesis providers, who must fall back to m03-smarty-melissa. The 04-implementation acknowledges this: "Foreign synthesis providers cannot use this directly and must rely on resellers."

### Gap 3: Enhanced Address API not yet GA — CMRA flag via legacy path uncertain
- **Category:** All US addresses, during the period between the legacy Web Tools retirement (January 2026) and the Enhanced Address API general availability (TBD).
- **Estimated size:** This affects 100% of US addresses if the provider uses USPS directly rather than a reseller. The Enhanced Address API is "planned for a future release" with no announced date ([USPS Web Tools Tech Docs](https://www.usps.com/business/web-tools-apis/documentation-updates.htm)). Legacy Web Tools v1/v2 retired on 25 January 2026 ([RevAddress](https://revaddress.com/blog/usps-web-tools-shutdown-2026/)). The v3 Address API exists but does not yet expose a standalone CMRA field; the CMRA indicator was available via DPV footnotes in the legacy path.
- **Behavior of the check on this category:** weak-signal (CMRA detection uncertain)
- **Reasoning:** During this gap period, providers querying USPS v3 directly may not have a clean CMRA flag. The v3 API does return DPV confirmation codes from which CMRA can sometimes be inferred, but the explicit `cmra` field is an Enhanced Address API feature. Practically, most providers will route through Smarty/Melissa, which bundle CMRA detection regardless of USPS API version. This is a transitional gap.

### Gap 4: Legitimate small biotech and solo researchers at CMRA addresses
- **Category:** Same population as m03-smarty-melissa Gap 2 — legitimate early-stage companies and independent researchers using a UPS Store or similar CMRA as their business address.
- **Estimated size:** ~15,000 CMRAs in the US, ~1.6 million registered customers ([USPS OIG](https://www.uspsoig.gov/reports/audit-reports/management-commercial-mail-receiving-agencies)). [best guess: 2-5% of legitimate commercial synthesis customers use CMRA addresses.]
- **Behavior of the check on this category:** false-positive (by design)
- **Reasoning:** `address_is_cmra` fires correctly. Same intentional FP as m03-smarty-melissa. The measure treats CMRAs as suspicious; some legitimate customers will be flagged. SOP handles via manual review.

### Gap 5: Newly registered CMRAs not yet in USPS DPV data
- **Category:** CMRA locations that have been recently registered with USPS but not yet included in the monthly DPV data release.
- **Estimated size:** USPS updates DPV data monthly ([USPS PostalPro: DPV](https://postalpro.usps.com/address-quality/dpv)). [best guess: at any time, a small number (<100) of newly registered CMRAs may not yet be in the DPV CMRA table. This is a negligible population for synthesis screening purposes.]
- **Behavior of the check on this category:** no-signal (CMRA flag absent)
- **Reasoning:** A newly opened UPS Store or virtual mailbox service registered with USPS in the past 30 days may not trigger `cmra == Y`. The address would still pass DPV (it exists physically), but the CMRA indicator would be missing. This is a timing gap, not a structural one.

## Refined false-positive qualitative

1. **Legitimate CMRA users (Gap 4):** `address_is_cmra` fires by design. Same population and handling as m03-smarty-melissa. Estimated 2-5% of commercial customers.
2. **Institutions sharing a building with a CMRA (from 04-implementation):** Extremely rare. A university department in a strip mall next to a UPS Store would not trigger CMRA (CMRA is flagged per suite/unit, not per building).
3. **DPV-unmatched new-construction addresses:** Same as m03-smarty-melissa Gap 3. <0.5% of orders.

## Notes for stage 7 synthesis

- This idea is functionally a subset of m03-smarty-melissa for most practical purposes. Any provider using Smarty or Melissa already gets CMRA + RDI. The USPS direct path adds value only if the provider wants to avoid vendor dependency (and save ~$0.001-0.005/check).
- The main unique risk is the Enhanced Address API gap (Gap 3): during the transition period, providers relying on USPS v3 directly may have degraded CMRA detection. The recommendation is to use a CASS reseller (Smarty/Melissa) as the primary path and treat USPS direct as a secondary/fallback.
- International coverage is zero. This is by design — pair with m03-smarty-melissa for international addresses.
