# Stage 8 — Product Prioritization: M03 (shipping-po-box)

## Recommended stack

### Layer 1: m03-smarty-melissa (Smarty / Melissa address verification)

Smarty/Melissa is the primary detection layer. It delivers high-confidence US PO Box and CMRA detection via USPS DPV data through a commercially supported, well-documented API with clear SLAs — exactly the properties that matter for pluggability and interface clarity. It is the only idea that extends coverage internationally (Melissa covers 240+ countries, with full street-level classification in ~30-40 OECD countries), giving it the broadest coverage of the three candidates. The marginal cost (~$0.001-$0.005/US, ~$0.01-$0.05/international) is negligible relative to synthesis order value. Most providers already use an address-verification vendor in their shipping workflow, so integration is incremental rather than greenfield. It subsumes the domestic detection capability of m03-usps-rdi-cmra while adding international reach and avoiding the USPS API's ToS ambiguity and Enhanced Address API availability gap.

### Layer 2: m03-pobox-regex-sop (PO Box / APO regex + reviewer SOP)

The regex check is a zero-cost, zero-dependency defense-in-depth backstop that runs in-process at order submission. Its incremental value is narrow but real: it catches PO Boxes entered in non-standard formats that vendors may not normalize, covers the ~6-week DPV update lag for brand-new PO Boxes, and provides a locale-aware safety net for international addresses in countries where Melissa's address-type classification is shallow. It composes cleanly with m03-smarty-melissa — the regex runs first as a fast pre-filter (microseconds, no network call), and vendor verification runs second for addresses that pass. The false-positive rate is low (<2%), the SOP is simple (reject and ask for street address), and the implementation cost is half an engineer-day. Including it satisfies the defense-in-depth principle at effectively zero marginal cost or operational burden.

## Dropped ideas

- **m03-usps-rdi-cmra (USPS RDI + CMRA flag):** Functionally a subset of m03-smarty-melissa — both use the same underlying USPS DPV dataset for domestic addresses. The direct USPS path adds no detection capability that Smarty/Melissa lacks, introduces ToS ambiguity for KYC use, requires US business presence (CRID/MID) that 30-40% of providers lack, and depends on the not-yet-GA Enhanced Address API for explicit CMRA field access. The synthesis files themselves note that "for most providers, m03-smarty-melissa is the practical implementation path."

## Composition note

The two selected ideas compose as a two-stage pipeline at order submission: (1) the regex check runs synchronously in-process, rejecting obvious PO Box / APO / military-mail strings at zero cost before any network call is made; (2) surviving addresses are submitted to Smarty or Melissa for DPV-based PO Box and CMRA classification plus international address-type verification. The flags from both layers feed into the same reviewer SOP: PO Box matches (from either layer) trigger an immediate reject-and-request-street-address response; CMRA matches (from the vendor layer only, since regex cannot detect CMRAs) trigger reviewer follow-up asking for institutional context. The regex layer's `regex_locale_mismatch` flag (PO Box token language doesn't match address country) provides an additional suspicion signal not available from the vendor layer alone. Both layers write to the order audit trail independently, preserving full reproducibility.
