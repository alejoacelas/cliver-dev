# Stage 9 — Per-measure synthesis: M03 (shipping-po-box)

## 1. Side-by-side comparison of selected ideas

| Field | m03-smarty-melissa | m03-pobox-regex-sop |
|---|---|---|
| **Role in stack** | Primary detection layer | Defense-in-depth backstop |
| **How it works** | Synchronous API call to Smarty/Melissa at order submission; returns DPV match, CMRA flag (US), address-type classification (international) | Deterministic regex over raw address string; matches PO Box in 7 language families + APO/FPO/DPO codes |
| **External dependencies** | Smarty US + International API; Melissa Global Address Verification API; USPS DPV/CMRA dataset | None |
| **Marginal cost** | ~$0.001-$0.005/US; ~$0.01-$0.05/international | $0 (microseconds CPU) |
| **Setup cost** | ~1 engineer-day per vendor (contract + key provisioning) | ~0.5 engineer-day |
| **Attacker stories addressed** | inbox-compromise PO Box (CAUGHT), inbox-compromise CMRA (CAUGHT), international PO Box in OECD (CAUGHT likely) | inbox-compromise PO Box (CAUGHT) |
| **Flags thrown** | `smarty_cmra`, `smarty_po_box`, `melissa_cmra`, `melissa_po_box`, `dpv_unmatched` | `regex_po_box`, `regex_apo_fpo`, `regex_locale_mismatch` |
| **False-positive pressure** | 2-5% of customers (legitimate small biotechs using CMRA); new-construction addresses (<0.5%) | <2% of customers (rural field stations, PO-Box-only institutions) |
| **Coverage gaps** | International addresses outside ~30-40 OECD countries; cross-border freight forwarders; brand-new addresses within 6-week DPV lag | CJK/Arabic/Russian/Turkish/Polish PO Box equivalents (~20-40% of intl customers); deliberate obfuscation (zero-for-O, Unicode lookalikes) |
| **Audit trail** | Full vendor JSON response + flags + DPV cycle date | Matched regex token + field + highlighted raw address |

## 2. Coverage gap cross-cut

### Structural gaps (inherent to the measure's scope)

These gaps cannot be closed by combining the two selected ideas differently — they require policy decisions, new data sources, or adjacent measures.

1. **Cross-border freight forwarders.** Freight-forwarding hubs are real commercial addresses. Neither DPV nor regex can distinguish them from legitimate commercial deliveries. Estimated 1-5% of international orders. This is fundamentally outside M03's scope — it requires a separate address-reputation or shipping-chain measure.

2. **International coverage depth.** Melissa claims 240+ countries but provides full street-level + address-type classification for only ~30-40 countries. No per-country verification depth matrix is publicly available. For the remaining ~200 countries/territories, PO Box classification is absent or unreliable. The regex extends coverage for 7 language families but leaves CJK, Arabic, Russian, Turkish, and Polish uncovered.

3. **CMRA-as-legitimate-address tension.** ~15,000 US CMRAs serve ~1.6M registered customers. An estimated 2-5% of commercial synthesis customers use CMRA addresses (early-stage biotechs without dedicated office space). Flagging CMRAs is the measure's intent, but the false-positive friction is a structural policy trade-off, not a fixable gap.

### Complementary gaps (where the two ideas cover each other)

4. **Brand-new US addresses within 6-week DPV lag.** Smarty/Melissa may return `dpv_unmatched` for very new addresses. The regex catches PO Box strings that vendors cannot yet classify. Complementary coverage is effective for this gap.

5. **Misformatted PO Box entries that vendors don't normalize.** Regex catches non-standard PO Box formats (e.g., spacing, abbreviation variants) that vendors may fail to parse before DPV lookup. Complementary.

6. **International addresses in shallow-coverage countries.** Regex provides locale-aware detection (Postfach, Casilla, Apartado, Boite Postale, Postbus, Caixa Postal) for countries where Melissa's address-type classification is city-level only. Complementary — but limited to covered language families.

7. **Locale-mismatch signal.** The regex's `regex_locale_mismatch` flag (PO Box token language doesn't match address country) provides a suspicion signal that the vendor layer cannot generate. Unique to the regex layer; adds value that the vendor cannot replicate.

## 3. Bypass methods uncovered: attacker stories surviving the full stack

Only one attacker branch engages M03: **inbox-compromise**. The remaining branches avoid PO Boxes entirely, using commercial addresses (virtual offices, coworking, incubators, makerspaces, freight forwarders, residential addresses framed as labs) that are covered by measures M04/M05.

### inbox-compromise sub-methods vs. the selected stack

| Bypass method | Layer 1 (regex) | Layer 2 (Smarty/Melissa) | Survives stack? |
|---|---|---|---|
| Standard US PO Box | CAUGHT | CAUGHT (DPV) | No |
| CMRA / packaging store (UPS Store etc.) | Not detected | CAUGHT (`dpv_cmra`) | No |
| PO Box with zero-for-O obfuscation | AMBIGUOUS | CAUGHT (DPV normalizes) | No — vendor catches it |
| PO Box with Unicode lookalikes (Cyrillic/fullwidth) | AMBIGUOUS | CAUGHT likely (vendor normalization) | No — vendor likely catches it |
| International PO Box in OECD country | CAUGHT (if covered language) | CAUGHT likely | No |
| International PO Box in non-OECD country (shallow Melissa coverage) | CAUGHT only if covered language family | NOT CAUGHT (no address-type data) | **YES — partial survival** |
| CJK PO Box equivalent (信箱, 私書箱, 사서함) | NOT CAUGHT | AMBIGUOUS (depends on country) | **YES — likely survives** |
| Hold-for-pickup at USPS (no PO Box in address) | Not detected | Not detected | **YES — not an address-based check** |

### Summary of surviving bypass methods

1. **International PO Box in non-OECD, non-covered-language countries.** Neither layer has signal. Risk is bounded by the attacker needing to operate in such a country and finding a synthesis provider that ships there.

2. **CJK PO Box equivalents.** Neither layer reliably detects these. Risk is bounded by CJK countries generally having better Melissa coverage than other non-OECD regions, but confirmation requires vendor data.

3. **Hold-for-pickup / general delivery.** The inbox-compromise attacker mapping explicitly names "hold-for-pickup" as a sub-method. This does not place a PO Box in the shipping address — the customer gives a street address (the post office itself) and picks up the package. Neither layer catches this because no PO Box string or CMRA flag is present. This is a structural gap in M03's design.

## 4. Structural gaps flagged as open issues

### Requiring vendor confirmation (pre-deployment)

- **O1: Per-country verification depth matrix.** Neither Smarty nor Melissa publishes which countries have full street-level + PO Box/CMRA classification vs. city-level only. The "30-40 countries" figure is a best guess. Must confirm with vendor sales before relying on international coverage claims.
- **O2: Melissa international CMRA field behavior.** Described in vendor materials but not technically documented in public SDK. Requires vendor confirmation to know whether it is populated for non-US addresses.
- **O3: Smarty ToS for KYC use.** Not confirmed. Must verify that using Smarty for customer screening (rather than shipping-rate optimization) is within terms.
- **O4: Melissa ToS for KYC use.** Vendor-gated; specific clauses require sales contact.
- **O5: Smarty and Melissa rate limits.** Undocumented for both vendors. Must confirm before scaling.

### Requiring engineering decision (pre- or post-deployment)

- **O6: CJK/Arabic/Russian regex extension.** Largest regex coverage gap. Requires careful testing across writing systems. Lower priority given vendor coverage may partially overlap, but should be sized once O1 is resolved.
- **O7: Unicode normalization (NFKC) before regex.** Low-cost fix for Unicode lookalike bypass. Not yet implemented.
- **O8: Zero-for-O character class in English patterns.** Low-cost fix for character substitution bypass. Not yet implemented. Note: vendor layer likely catches this anyway via its own normalization, so this is defense-in-depth.

### Requiring policy decision

- **O9: Hold-for-pickup / general delivery.** Structural gap — no address-based check can catch a customer who gives a post office's street address and picks up the package. Possible mitigations live outside M03 (e.g., carrier-level hold-for-pickup detection, requiring signature from named institutional recipient).
- **O10: CMRA false-positive friction.** 2-5% of legitimate customers flagged by design. This is an inherent tension in the measure. The SOP (ask for institutional context) is the current mitigation; the policy question is whether the friction is acceptable.
- **O11: Pricing uncertainty.** All per-lookup costs are best guesses from vendor pages and G2 reports. Contracted rates may differ. Not a blocker at expected volumes but should be confirmed during vendor contract negotiation.
