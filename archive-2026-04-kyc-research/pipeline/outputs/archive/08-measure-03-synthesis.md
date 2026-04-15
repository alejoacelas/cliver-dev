# Measure 03 — PO box detection: Per-measure synthesis

## 1. Side-by-side comparison table

| Field | m03-usps-rdi-cmra | m03-smarty-melissa | m03-pobox-regex-sop |
|---|---|---|---|
| **Name** | USPS RDI + CMRA flag | Smarty / Melissa address verification | PO Box / APO regex + reviewer SOP |
| **Data source** | USPS v3 REST API (direct) or CASS reseller; USPS DPV dataset | Smarty US Street Address API + Melissa Global Address Verification; USPS DPV for US, country-specific postal data internationally | None (internal regex, no external dependency) |
| **Marginal cost** | $0 via USPS direct; ~$0.001-$0.005 via reseller | ~$0.0006-$0.005/US lookup (Smarty); ~$0.003/record (Melissa); ~$0.01-$0.05 for international | $0 (microseconds of CPU) |
| **Manual review burden** | Legitimate CMRA users (~2-5% of commercial customers); DPV-unmatched new-construction (<0.5%) | Same CMRA false positives as USPS-RDI; international shallow-coverage addresses return misleadingly clean results | Legitimate PO Box institutions (<2%); Dutch "Postbus" official addresses (~1-2% of NL customers) |
| **Attacker stories addressed** | 1 (inbox-compromise PO Box and CMRA variants: CAUGHT) | 1 (inbox-compromise PO Box and CMRA variants: CAUGHT; international PO Box in OECD: CAUGHT likely) | 1 (inbox-compromise standard PO Box format: CAUGHT) |
| **Headline coverage gap** | International addresses completely out of scope (~30-50% of orders); Enhanced Address API not yet GA | International depth shallow outside ~30-40 OECD countries; cross-border freight forwarders pass cleanly | CJK/Arabic/Russian PO Box equivalents not covered (~20-40% of international customers); deliberate obfuscation bypasses regex |
| **Headline uncovered bypass** | International PO Boxes; newly registered CMRAs within ~30-day DPV lag | Non-OECD international PO Boxes; freight forwarders as CMRA-equivalent | Zero-vs-O substitution; Unicode lookalikes; non-covered language variants |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

Two gaps appear across all three ideas:

1. **International PO Box equivalents in non-OECD countries.** All three ideas have degraded or zero coverage outside the US and a limited set of OECD countries. m03-usps-rdi-cmra is US-only by design. m03-smarty-melissa has full street-level + address-type classification for an estimated 30-40 countries but city-level or weaker for the remaining ~200. m03-pobox-regex-sop covers 7 language families but misses CJK, Arabic, Russian, Turkish, and Polish equivalents. A customer using a PO Box equivalent in a non-covered country passes all three checks.

2. **Cross-border freight forwarders.** Freight forwarding hubs are real commercial addresses that pass DPV/CMRA cleanly, pass regex (no "PO Box" string), and pass international vendor verification. They function as PO-box-equivalents for concealing the end recipient but are invisible to all three M03 ideas. This is estimated at 1-5% of international orders.

However, the practical impact of these shared gaps on the modeled threat set is low: only one attacker story (inbox-compromise) explicitly names a PO Box as a shipping method, and that story's PO Box variant is a US PO Box, which all three ideas catch. The measure's broader value is deterrence — attackers avoid PO Boxes because they know the check exists, forcing them toward more expensive alternatives covered by M04 and M05.

### Complementary gaps

| Gap | Ideas that leave it open | Ideas that close it |
|---|---|---|
| International PO Boxes in OECD countries | m03-usps-rdi-cmra (US-only), m03-pobox-regex-sop (language-limited) | m03-smarty-melissa (Melissa covers ~30-40 OECD countries) |
| US CMRAs (packaging stores) | m03-pobox-regex-sop (does not detect CMRA) | m03-usps-rdi-cmra (CMRA flag), m03-smarty-melissa (dpv_cmra) |
| Misformatted or vendor-unrecognized PO Box strings | m03-usps-rdi-cmra (depends on DPV parse), m03-smarty-melissa (depends on vendor parse) | m03-pobox-regex-sop (raw string match catches formats vendors miss) |
| Addresses within ~30-day DPV update lag (new PO Box/CMRA) | m03-usps-rdi-cmra, m03-smarty-melissa (both rely on DPV cycle) | m03-pobox-regex-sop (catches "PO Box" in string regardless of DPV status) |

### Net coverage estimate

If a provider implemented all three M03 ideas:

- **Most** US customers shipping to PO Boxes or CMRAs would be caught with high confidence (DPV + CMRA flag + regex triple-coverage).
- **Many** international customers in OECD countries shipping to PO Boxes would be caught (Melissa address-type classification + regex in 7 language families).
- **Few** international customers in non-OECD countries using local PO Box equivalents in non-covered languages would be caught. This is the residual gap.
- Against the modeled threat set: the single mapped story (inbox-compromise PO Box variant) is fully addressed by all three ideas. The measure's deterrent effect (forcing attackers away from PO Boxes toward alternatives covered by M04/M05) is likely its greatest contribution.

## 3. Bypass cross-cut

### Universally uncovered bypasses

The attacker-by-measure mapping for M03 is exceptionally narrow: only `inbox-compromise` maps to this measure, and only its PO Box and CMRA shipping sub-methods. The following bypass patterns exist but are not modeled because other attacker stories avoid PO Boxes entirely:

1. **Freight forwarders / cross-border forwarding hubs** — pass all three ideas because they are real commercial addresses.
2. **Non-OECD-language PO Box equivalents** — pass all three ideas because DPV does not cover them, Melissa has shallow data, and regex does not include those languages.

These are not currently modeled as attacker stories engaging M03 because the attacker branch corpus notes that "most branches that build a fake institution use commercial addresses precisely because PO Boxes are trivially flagged."

### Bypass methods caught by at least one idea

| Bypass | Catching idea(s) |
|---|---|
| US PO Box (standard format) | All three ideas (triple coverage) |
| US CMRA / packaging store | m03-usps-rdi-cmra, m03-smarty-melissa |
| International PO Box in OECD (standard format) | m03-smarty-melissa, m03-pobox-regex-sop |
| Misformatted PO Box string | m03-pobox-regex-sop |
| Recently registered PO Box within DPV lag | m03-pobox-regex-sop |

### Attacker stories where every idea fails

**None of the mapped stories fail across all ideas.** The single mapped story (inbox-compromise PO Box variant) is caught by all three ideas for US addresses and by at least two ideas for OECD international addresses.

The 18 unmapped stories do not engage M03 — they use commercial addresses, institutional addresses, virtual offices, incubator space, or residential addresses. These are outside M03's scope by design and are handled by M04 (residential detection) and M05 (institutional address verification).

## 4. Bundling recommendations

### Recommended bundle: m03-smarty-melissa + m03-pobox-regex-sop

This two-idea bundle provides the strongest coverage at minimal cost:

- **m03-smarty-melissa** is the primary detection layer. It provides high-confidence US CMRA + PO Box detection via DPV, plus international coverage for ~30-40 OECD countries via Melissa. Most providers already use Smarty or Melissa for shipping address validation, making this an incremental addition to existing infrastructure.

- **m03-pobox-regex-sop** is the defense-in-depth backstop. It catches misformatted addresses that Smarty/Melissa miss, covers the ~30-day DPV update lag for newly registered PO Boxes, and adds military APO/FPO/DPO detection. Cost is $0 with half an engineer-day of setup.

This bundle closes all complementary gaps except non-OECD international PO Boxes and freight forwarders.

### m03-usps-rdi-cmra: unnecessary for most providers

m03-usps-rdi-cmra uses the same underlying USPS DPV data as Smarty and Melissa. For providers already using either reseller, this idea provides no incremental detection capability. It is relevant only for providers who want direct USPS API access to avoid reseller dependency — but USPS API enrollment requires US business presence, rate limits are undocumented, and the Enhanced Address API is not yet GA. Unless a provider has a specific reason to query USPS directly, m03-smarty-melissa subsumes this idea entirely.

### What no bundle can fix

1. **Non-OECD international PO Box equivalents in non-covered languages.** Extending the regex to CJK, Arabic, Russian, Turkish, and Polish would partially close this gap at low cost. Full closure requires Melissa to improve coverage depth in those countries — a vendor dependency outside the provider's control.

2. **Cross-border freight forwarders.** These are real commercial addresses that no M03 idea can distinguish from legitimate business addresses. Detection requires m06 (freight-forwarder denylist) or M05 (institutional address verification).

3. **The broader attacker landscape.** M03 is the narrowest measure in the pipeline: only one of 19 attacker stories explicitly maps to it. Its value is primarily deterrent — forcing attackers away from the cheapest anonymous delivery option toward alternatives that engage other measures. The bundled cost (m03-smarty-melissa at ~$0.003/check + m03-pobox-regex-sop at $0) is well justified by this deterrent value even without a large attacker-story engagement footprint.
