# Measure 06 — Shipping-Export-Country: Per-Measure Synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (count / which) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| **m06-bis-country-groups** | BIS Country Groups + Commerce Country Chart (local table from public regulation) | $0/check | Group E: auto-deny. Group D + license-required: escalate to export compliance (30-90 day BIS processing). | 1 / foreign-institution (re-export step) | Re-export through non-embargoed intermediaries is structurally invisible; EAR99 items produce no signal even for Group D | All foreign-institution methods: branch ships to non-embargoed countries by design |
| **m06-iso-country-normalize** | ISO 3166 open datasets + OFAC EO geofence table | $0/check (local) or ~$0.005-$0.015 (vendor) | Geofence hit: auto-block. Country-code ambiguity: reviewer disambiguates. Sanctioned-locality keyword: escalate. | 1 / foreign-institution (CIS variant only) | Non-CIS destinations produce zero geofence signal; Russian postal codes for occupied territories not mapped | All non-CIS foreign-institution methods; CIS variant with postal-code-only address |
| **m06-bis-entity-list** | ITA Consolidated Screening List API (free federal API, 4 BIS lists) | $0/check | Entity/DPL: auto-block. UVL: soft-block + statement workflow. Fuzzy match (0.75-0.92): reviewer compares addresses/alt-names. | 1 / foreign-institution (consignee) + any attacker routing through a listed party | >99% of customers unlisted = no signal; subsidiaries of listed entities not enumerated; non-Latin transliteration mismatches | Accomplice at real institution; residential/virtual office with unlisted attacker; forwarder name omitted from order |
| **m06-freight-forwarder-denylist** | Curated internal denylist from Entity List, OFAC SDN, Trade Integrity Project, BIS enforcement, internal incidents | $0/check (local) | Hard-block (Entity/SDN): auto-deny. Review-tier (TIP/internal): compliance evaluates citation. Address-match: judgment call on shell-company-at-known-address pattern. | 1 / foreign-institution (Methods 1 and 6 — freight forwarder/customs broker) | >99% of global forwarders unlisted; forwarder name omission defeats name-based matching; non-Russia diversion corridors underrepresented | Forwarders in non-diversion-corridor countries (Brazil, Japan, India); newly formed shell forwarders; forwarder relationship not disclosed on order |
| **m06-hs-eccn-classification** | BIS 1C353 interpretive guidance + provider's sequence-screening pipeline (human SOP) | EAR99 path: ~$0. 1C353 path: $15-$45/case | This IS the manual review: hazard analysis per BIS guidance; ambiguous cases escalate to senior compliance (possibly months for CCATS). | 1 / foreign-institution (re-export of controlled items) + supports all international shipments | Zero leverage on non-SOC orders (EAR99 = no restriction); chimera/fragment ordering evading screening pipeline; US-jurisdiction only (45-60% of global market is non-US) | Non-SOC sequences classify as EAR99 and ship unrestricted; 1C353 to AG-member Japan ships license-free |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

Two coverage gaps are present in EVERY idea's gap list, revealing structural limitations of measure 06 as currently conceived:

1. **Re-export/transshipment invisibility.** The foreign-institution attacker branch -- the only branch mapped to M06 -- deliberately ships to non-embargoed intermediary countries (Brazil, Japan, India, Indonesia, Vietnam) and re-exports from there. Every M06 idea screens only the first-hop destination. bis-country-groups sees a non-embargoed country and produces no flag. iso-country-normalize finds no sanctioned sub-region. bis-entity-list finds an unlisted consignee. freight-forwarder-denylist misses forwarders outside the Russia/China/Iran corridor. hs-eccn-classification produces EAR99 for non-SOC items. The re-export step is structurally invisible to any address-based export screen. This is a finding for policymakers: M06 has a hard ceiling against deliberate intermediary-country routing.

2. **Non-US provider coverage gap.** hs-eccn-classification is explicitly US-jurisdiction-only (EAR/ECCN framework). bis-country-groups uses US BIS Country Groups. bis-entity-list uses US CSL. Non-US providers (45-60% of the global market) operate under different export-control frameworks (EU Dual-Use Regulation, UK Export Control Order, Wassenaar national implementations). A global screening regime requires harmonized classification across jurisdictions. This is a policy gap, not an implementation deficiency.

### Complementary gaps

| Gap | Present in | Closed by | Notes |
|---|---|---|---|
| ECCN dependency (no ECCN = no chart lookup) | bis-country-groups | hs-eccn-classification | These two ideas are tightly coupled; bis-country-groups cannot function without hs-eccn-classification |
| Country normalization (mismapping risk) | bis-country-groups | iso-country-normalize | Prerequisite dependency; North/South Korea ambiguity is catastrophic if mis-resolved |
| Sub-national sanctioned territories (Crimea, DPR, LPR) | bis-country-groups (country-grain only) | iso-country-normalize (geofence) | Geofence catches sanctioned-territory keywords the country-level check cannot |
| Forwarder/intermediary name in address | bis-entity-list (does not specify intermediary parsing) | freight-forwarder-denylist (address-match on known forwarder buildings) | Partial closure: only catches known addresses, not novel forwarders |
| Non-diversion-corridor forwarders | freight-forwarder-denylist (Russia/China/Iran focus) | Not closed by any M06 idea | Structural gap: TIP and BIS enforcement concentrate on Russia corridor |

### Net coverage estimate

If a provider deployed all five ideas, the combined coverage against the foreign-institution attacker story would be **few** legitimate adversarial catches. The branch was specifically designed to evade export-country screening by choosing non-embargoed intermediary destinations. The five ideas together provide:
- Near-perfect coverage of direct shipments to Group E embargoed countries (auto-deny)
- License-required gating for controlled items (1C353) to Group D countries
- CIS-variant geofence detection for occupied Ukrainian territories
- Known-forwarder matching for the Russia diversion corridor

But the dominant attack vector -- non-SOC items shipped to non-embargoed intermediary countries, then re-exported -- slips through all five checks. The combined coverage is high for regulatory compliance (ensuring the provider meets EAR obligations) but low for adversarial resistance against the modeled threat.

## 3. Bypass cross-cut

### Universally uncovered bypasses

These bypass methods slip through EVERY M06 idea:

1. **Ship non-SOC items to non-embargoed countries.** The foreign-institution branch orders EAR99-classified sequences and ships to Brazil, Japan, India, Indonesia, or Vietnam. hs-eccn-classification classifies as EAR99 (correct). bis-country-groups finds no license requirement (correct). iso-country-normalize finds no geofence hit (correct). All checks pass because the shipment is, in fact, legal under the EAR.

2. **Re-export from non-embargoed intermediary.** Even for 1C353 items, the re-export from a non-embargoed intermediary to a restricted destination is invisible to the first-hop check. The `reexport_disclosed_to_e` flag in bis-country-groups depends on voluntary customer disclosure.

3. **Forwarder name omission.** The attacker lists themselves as consignee at the forwarder's address without disclosing the forwarding relationship. freight-forwarder-denylist catches this only if the address itself is known; bis-entity-list screens the named consignee (the attacker), not the building occupant.

### Bypass methods caught by at least one idea

| Bypass method | Caught by | Missed by |
|---|---|---|
| Direct shipment to embargoed Group E country | bis-country-groups (auto-deny) | All others (do not independently gate E-group) |
| Address in occupied Crimea/DPR/LPR | iso-country-normalize (geofence) | bis-country-groups (country-grain only sees Russia/Ukraine) |
| Consignee on Entity List/DPL | bis-entity-list (auto-block) | Others (screen country, not entity) |
| Known Russia-corridor freight forwarder | freight-forwarder-denylist (hard-block) | Others (do not maintain forwarder databases) |
| 1C353 item to non-AG Group D country (India, Brazil) | hs-eccn-classification + bis-country-groups (license required) | Others (do not classify items) |

### Attacker stories where every idea fails

- **foreign-institution** Methods 1, 2, 4, 5 (ship to non-embargoed, non-CIS country): the entire branch set of non-CIS foreign-institution methods evades all five M06 ideas. This is the single mapped attacker story for M06, and it structurally evades the measure.

## 4. Bundling recommendations

**Recommended mandatory bundle: iso-country-normalize + bis-country-groups + hs-eccn-classification.**

These three ideas form a tightly coupled dependency chain and must be deployed together:
- **iso-country-normalize** provides the clean country-code input and sanctioned-territory geofence. Without it, bis-country-groups risks catastrophic mismapping (North/South Korea).
- **bis-country-groups** provides the Country Chart licensing matrix. Without it, the ECCN classification has no enforcement mechanism.
- **hs-eccn-classification** provides the ECCN that drives the licensing decision. Without it, the Country Chart lookup cannot distinguish controlled from uncontrolled items.

Together, these three provide: auto-deny for embargoed destinations, license-required gating for controlled items to Group D countries, and sub-national geofence detection for occupied territories. Total setup cost: ~$20K-$60K. Marginal per-check cost: ~$0 for most orders, $15-$45/case for the ~5% requiring 1C353 hazard analysis. This is the minimum viable export-control screening stack.

**Recommended addition: bis-entity-list + freight-forwarder-denylist.**

Adding these two denylist checks provides incremental coverage:
- **bis-entity-list** catches orders routed through known restricted parties. Free API, ~$3K-$10K setup. The 90-95% false-positive rate for common names is the dominant operational cost.
- **freight-forwarder-denylist** catches known transshipment vectors, particularly in the Russia/China/Iran corridor. ~$10K-$30K setup + $5K-$20K/yr curation. Narrow but high-severity catches.

Together, the five ideas cover the full regulatory obligation and add best-effort adversarial resistance. But providers should understand that **the full five-idea bundle still leaves the dominant foreign-institution bypass uncovered**: non-SOC items to non-embargoed intermediary countries, then re-export. Closing this gap requires mechanisms outside M06's scope: end-use certificates, post-shipment monitoring, or carrier-level controls that detect re-export routing.

**Operational cost of the full bundle:** Three free data sources (BIS tables, ISO datasets, CSL API), one curated internal denylist (freight-forwarder, ~$5K-$20K/yr curation), one manual SOP (ECCN classification, ~1 FTE for a mid-size provider processing ~2,500 SOC-flagged orders/year), and export compliance staff for Group D license evaluations. The bundle introduces no per-check vendor fees but requires dedicated export-compliance expertise.

**What the bundle cannot close:** Re-export through non-embargoed intermediaries and the EAR99 structural gap (uncontrolled items ship freely). These are limitations of the EAR framework itself, not of the implementation. Policymakers should note that M06 as conceived provides strong regulatory compliance but limited adversarial resistance against sophisticated routing through legitimate intermediary countries.
