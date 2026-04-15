# 04C claim check — m12-billing-shipping-consistency v1

## Verified

- **Smarty pricing tiers (free 250/mo; $20 entry tier; $0.60–$1.50/1,000)** — corroborated by Smarty's pricing page and Vendr's analysis. PASS.
- **Smarty batch limit of 100 addresses/request** — Smarty US Street API documentation supports this. PASS.
- **USPS Web Tools API retirement Jan 25, 2026** — confirmed by Smarty's USPS API article and other industry coverage. The USPS officially announced retirement of the legacy Web Tools API in early 2026 and migration to a newer API platform. The framing "no longer viable as a primary path" is accurate; technically a successor USPS API exists but is not the same product. PASS (with mild caveat that "retirement" may refer to a migration rather than a total shutdown — successor API exists).
- **libpostal weakness on US secondary units** — Crunchy Data blog explicitly notes secondary-unit handling as a weakness. PASS.
- **Smarty international pricing $1.50–$3.00 / 1,000** — Smarty international pricing page corroborates this band. PASS.
- **libpostal MIT license, C library** — confirmed at the GitHub repo. PASS.

## Flags

- **OVERSTATED (mild) — "USPS Web Tools API was retired on January 25, 2026 ... so this leg is no longer viable"** — USPS launched a new platform (USPS APIs at developers.usps.com) as the successor. The legacy product is gone but a USPS-direct option still exists. Suggested fix: weaken to "the legacy USPS Web Tools API was retired in early 2026; the successor USPS APIs platform exists but the synthesis provider would need to migrate, and Smarty / commercial vendors are now the more turnkey path."
- **UPGRADE-SUGGESTED — Stripe `payment_method.billing_details.address`** — the document references this path implicitly. Could cite the Stripe PaymentMethod object docs (already used in sibling m10-stripe-funding research).

No BROKEN-URL or load-bearing MIS-CITED claims.

## Verdict

REVISE (only the mild USPS overstatement; not load-bearing because Smarty / libpostal are the recommended paths in the document anyway. v2 optional.)
