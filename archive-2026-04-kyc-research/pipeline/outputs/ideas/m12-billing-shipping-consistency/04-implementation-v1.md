# m12-billing-shipping-consistency — implementation v1

- **measure:** M12 (billing-institution-association)
- **name:** Billing↔shipping↔institution consistency
- **modes:** D (deterministic rule + soft scoring)
- **summary:** Internal rules engine that, on every order, normalizes the billing address (from the PSP), the shipping address (from the order), and the institution's canonical address (from m05/m18 institution-resolution outputs), and asserts they form a consistent set within a configurable tolerance — same country (mandatory), same metro region (default), same postal code or street (optional, by SOC level). Customer must explain or override divergences. Catches the dormant-account-takeover Bypass D class (substituted personal card with mismatched name/address) and the inbox-compromise driving-distance optimization (which the attacker uses to *defeat* this very check by selecting geographically close targets).
- **attacker_stories_addressed:** dormant-account-takeover (Bypass D), dormant-domain (org-name-match path), account-hijack (Method 2 address-change), inbox-compromise (target selection within driving distance), credential-compromise (cloned-card sub-path). All five branches in the m12 attacker mapping engage this consistency surface explicitly.

## external_dependencies

- **Address normalization library / API.** Three options:
  - **libpostal** (open source, MIT) — fast C library for parsing/normalizing addresses globally [source](https://github.com/openvenues/libpostal). Free; runs in-process. Limitation: weak on US secondary units (suite/apt) [source](https://www.crunchydata.com/blog/quick-and-dirty-address-matching-with-libpostal).
  - **Smarty (formerly SmartyStreets)** — commercial; ingests address records, normalizes, classifies residential vs commercial, batch up to 100/request, geocodes [source](https://www.smarty.com/products/us-address-verification). The known industry leader for US accuracy.
  - **Google Address Validation API** — commercial; global coverage [best guess: pricing comparable to Smarty for moderate volumes; not directly searched].
- **Geocoding** for the metro-distance calculation: most address normalization vendors include geocoding in the same response.
- **Internal institution canonical-address store** — populated by sibling m05/m18 ideas (institution legitimacy / institutional affiliation resolution). This idea is downstream of those.
- **PSP integration** to receive the billing address from the card auth response (Stripe `payment_method.billing_details.address`, Adyen `additionalData.billingAddress`).

## endpoint_details

**Normalization layer:**

- **libpostal:** in-process, no network call. Built and called via Python/Node bindings.
- **Smarty US Street API:** `https://us-street.api.smarty.com/street-address` — auth via `auth-id` + `auth-token` query params (or HTTP header). Up to 100 addresses per request. Returns DPV-confirmed normalized address, ZIP+4, congressional district, metro area, residential/commercial flag [source](https://www.smarty.com/products/us-address-verification).
- **Smarty pricing:** free tier 250 lookups/month; paid plans start at $20/month for 500 lookups; pay-as-you-go for higher volumes; enterprise contracts negotiated [source](https://www.smarty.com/pricing). Roughly $0.60–$1.50 per 1,000 lookups at low-to-moderate volumes [source](https://www.vendr.com/marketplace/smartystreets).
- **USPS Web Tools:** historically free but rate-limited to 60 req/hr [source](https://www.smarty.com/articles/usps-api). **Note:** USPS Web Tools API was retired on January 25, 2026 [source](https://www.smarty.com/articles/usps-api), so this leg is no longer viable as a primary path.
- **Auth model:** Smarty API key. ToS: standard commercial use permitted; verify under Smarty terms.

**Rules engine:**

- An internal service. On each order, runs the following pipeline:
  1. Normalize all three addresses (billing, shipping, institution canonical).
  2. Compute country match (must match unless explicit override).
  3. Compute postal-code or ZIP3 match (configurable per SOC tier).
  4. Compute haversine distance between geocoded points.
  5. Apply the rule:
     - Same country + same metro (≤ 50 km between any pair) → PASS.
     - Same country, distinct metro, customer is at a "distributed institution" (multi-campus university, national lab with field stations) → SOFT FLAG, reviewer assesses.
     - Different country, or > 1,000 km separation → HARD FLAG, reviewer required.
- Implementation venue: a small service (Python / Go) called by the order pipeline. Not vendor-purchased.
- **Auth:** internal service auth. **Rate limits:** internal. **ToS:** N/A.

## fields_returned

Per order, the rules engine emits a `triple_consistency_record`:

```
{
  billing_address: { raw, normalized, country, postal_code, lat, lng, residential_commercial },
  shipping_address: { raw, normalized, country, postal_code, lat, lng, residential_commercial },
  institution_canonical: { raw, normalized, country, postal_code, lat, lng },
  pairwise_distances_km: { bs: ..., bi: ..., si: ... },
  decision: pass | soft_flag | hard_flag,
  rule_version: <semver>,
  flags: [ list of which subrules fired ]
}
```

From Smarty per-address: `delivery_line_1`, `last_line`, `delivery_point_barcode`, `metadata.county_name`, `metadata.latitude`, `metadata.longitude`, `metadata.rdi` (residential/commercial), `analysis.dpv_match_code`.

## marginal_cost_per_check

- **Smarty cost:** ~$0.001–$0.003 per address × 3 addresses = ~$0.003–$0.009 per order at moderate volume tiers [source](https://www.vendr.com/marketplace/smartystreets) (the $0.60–$1.50 / 1,000 figure scaled to 3 lookups). Likely lower at enterprise volume.
- **libpostal alternative:** $0 per check (in-process).
- **Setup cost:** ~1–2 weeks engineering for the rules engine + integration with the order pipeline + initial tuning of distance thresholds against historical legitimate-order data.
- **Reviewer cost:** dominates ongoing cost. See false-positive section.

## manual_review_handoff

When `billing_shipping_inconsistent` fires:

1. Reviewer pulls the `triple_consistency_record` for the order, including normalized addresses, distances, and which subrule fired.
2. Reviewer checks the customer's institutional context:
   - Is the institution multi-campus / multi-site (university with field stations, national lab with off-site facilities, pharma with regional offices)? Distributed institutions are the dominant legitimate divergence class.
   - Is the shipping address an authorized off-site receiving location (incubator, contract research org partner, equipment vendor)?
   - Has this customer ordered with the same address triple before? Repeat history reduces concern.
3. Reviewer contacts the customer if needed: "We notice your shipping address is in [city A] but your billing and institutional address are in [city B]. Can you confirm the receiving location and your role there?"
4. Decision tree:
   - Customer provides plausible explanation + corroborating signal (institutional email confirms field station; PI on file at the secondary location): pass with note.
   - Customer cannot explain or explanation is thin: deny + log.
   - Hard-flag with no plausible distributed-institution context: deny.
5. Approved overrides feed an exception list keyed on (customer, address-triple) so subsequent orders skip the flag.

SOP target: ≤15 minutes per case for typical reviews; longer for novel distributed-institution overrides.

## flags_thrown

- `billing_shipping_country_mismatch` — countries differ across the triple. Hard flag.
- `billing_shipping_metro_mismatch` — same country, distinct metro region. Soft flag.
- `billing_institution_postal_mismatch` — billing and institutional postal codes differ but shipping matches institution. Soft flag (dormant-account-takeover Bypass D pattern: substituted personal card with mismatched billing).
- `shipping_institution_postal_mismatch` — shipping diverges from institution canonical. Soft flag (account-hijack Method 2 pattern: social-engineered drop-shipping).
- `billing_residential_on_institutional_order` — billing address is residential per Smarty `rdi`. Soft flag, especially when the order claims an institutional buyer.
- `billing_shipping_inconsistent` — top-level umbrella flag set if any subflag fires.

## failure_modes_requiring_review

- **Distributed institutions** are the dominant noise source. Universities have multi-campus structure; national labs (LBNL, ORNL) ship to user facilities sometimes far from the canonical campus address; pharma R&D can be split across regions. Distance threshold tuning is the load-bearing parameter.
- **Forwarders / carrier partner addresses.** Some customers ship to a freight forwarder (international consolidators, specialty couriers) that's geographically near them but not their canonical institution. The shipping address is a real warehouse, not the lab. Hard to distinguish from a drop without a denylist of forwarder addresses.
- **PSP returns no billing address.** Some payment methods (Apple Pay tokens, ACH) may return only partial billing address. Rules engine must handle missing fields without failing closed.
- **Address normalization disagreement.** Smarty and libpostal sometimes normalize the same address differently. Mitigation: pin to one normalizer.
- **International address coverage.** Smarty's US product is excellent; for international addresses use Smarty International (separate product, more expensive: $1.50–$3.00 / 1,000 [source](https://www.smarty.com/pricing/international-address-verification)) or Google. libpostal coverage is broad but quality is variable.
- **Bypass: driving-distance attacker.** The inbox-compromise branch's Method 1 *defeats* this check by selecting target institutions within driving distance of the attacker's actual residence — billing zip is the attacker's real card, shipping zip is the attacker's real area, institutional address is also nearby. The triple is geographically consistent and the rule passes. This is a structural limitation: the rule catches geographic divergence, not "wrong person at the right place." Document this in the synthesis stage as a known coverage gap.

## false_positive_qualitative

- **Multi-campus universities and national labs** — every order from a UC system researcher whose lab is at a secondary campus. Plausibly several percent of legitimate orders.
- **Field-station orders** — orders shipping to remote research stations (marine bio stations, observatories, field-research outposts) far from the canonical campus.
- **Visiting researchers** — a researcher on sabbatical at another institution paying with their home institution's card and shipping locally.
- **Distributed pharma / biotech** — companies with R&D and HQ in different cities.
- **International researchers using a US card / billing address** (e.g., a UK postdoc paying with a personal US card from their grad-school years).

These are the most-affected legitimate populations. Coverage stage 6 should quantify them.

## record_left

- The `triple_consistency_record` (above), stored per order in the audit log.
- Reviewer disposition + rationale per flag.
- The exception list keyed on (customer, address-triple) for repeat-order skipping, with timestamped grants.
- Aggregate dashboard: flags per day, false-positive rate after manual review (the calibration signal for tuning thresholds).

This is the auditable artifact that demonstrates the provider checked billing-vs-institution consistency on the order — the explicit measure-12 control.

## Sources

- [Smarty — Using USPS address verification to prevent fraud](https://www.smarty.com/blog/address-verification-fraud-management)
- [Smarty — USPS API article (incl. retirement notice)](https://www.smarty.com/articles/usps-api)
- [Smarty — AVS vs. address validation](https://www.smarty.com/articles/avs-vs-address-validation)
- [Smarty — US address verification product page](https://www.smarty.com/products/us-address-verification)
- [Smarty — pricing](https://www.smarty.com/pricing)
- [Smarty — international address verification pricing](https://www.smarty.com/pricing/international-address-verification)
- [Vendr — Smarty pricing analysis](https://www.vendr.com/marketplace/smartystreets)
- [openvenues/libpostal — GitHub](https://github.com/openvenues/libpostal)
- [Crunchy Data — quick and dirty address matching with libpostal](https://www.crunchydata.com/blog/quick-and-dirty-address-matching-with-libpostal)
