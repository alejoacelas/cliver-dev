# m06-bis-country-groups — implementation research v1

- **measure:** M06 — shipping-export-country
- **name:** BIS Country Group D/E + EAR licensing matrix
- **modes:** D (deterministic table lookup)
- **summary:** Map the destination country (and any consignee on the order) to BIS Country Groups via [Supplement No. 1 to Part 740](https://www.bis.gov/regulations/ear/interactive-country-groups). Cross with the order's ECCN against the [Commerce Country Chart in Supplement No. 1 to Part 738](https://www.bis.gov/regulations/ear/interactive-commerce-country-chart). Hard-block any destination in Country Group E:1 / E:2 (currently Cuba, Iran, North Korea, Syria, plus Russia/Belarus de-facto under sectoral measures); raise license-required flag for Country Group D:1/D:2/D:3/D:4/D:5 (national-security, NP, CB, MT, US-arms-embargoed concerns) when the order's ECCN is controlled for the relevant Reason for Control.

- **attacker_stories_addressed:** foreign-institution (re-export step)

## external_dependencies

- [BIS Country Groups (15 CFR Part 740 Supplement No. 1)](https://www.bis.gov/regulations/ear/interactive-country-groups) — interactive HTML and PDF.
- [BIS Commerce Country Chart (15 CFR Part 738 Supplement No. 1)](https://www.bis.gov/regulations/ear/interactive-commerce-country-chart) — interactive HTML and PDF.
- [BIS BioExport guidance for life science researchers](https://www.bis.doc.gov/index.php/documents/product-guidance/1107-bioexport-pdf/file) — applies the Country Chart to biological items.
- An internal mapping: synthesis-product → ECCN. (Dependency on `m06-hs-eccn-classification`.)
- Country normalization (dependency on `m06-iso-country-normalize`) — needed because the BIS chart uses non-ISO country names (e.g., "Korea, North," "Burma," "Hong Kong" listed separately from "China").
- BIS publishes updates as Federal Register notices. No machine-readable update feed; the table is human-curated and re-published.

## endpoint_details

- **URL (Country Groups):** https://www.bis.gov/regulations/ear/interactive-country-groups (HTML); also published as a PDF at the regulations page.
- **URL (Country Chart):** https://www.bis.gov/regulations/ear/interactive-commerce-country-chart (HTML).
- **Auth:** None — public regulation.
- **Format:** HTML / PDF only. **There is no JSON or REST API for the Country Groups or Country Chart** [searched for: "BIS country chart API JSON", "trade.gov country groups API", "EAR Country Chart machine-readable feed" — found none; the closest machine-readable BIS data is the Consolidated Screening List API which is the entity list, not the country chart].
- **Implementation pattern:** providers extract the table once, store it as an internal lookup (~200 country rows × ~15 Reason-for-Control columns), and refresh on each Federal Register update. Update cadence is irregular but several times per year; e.g., the [May 2024 update](https://www.nixonpeabody.com/insights/alerts/2024/05/10/bis-updates-commerce-country-chart-and-makes-conforming-changes-to-the-ear) reorganized country group structure.
- **Rate limits:** N/A (local table lookup after ingestion).
- **Pricing:** Free. Optional: pay a trade-compliance vendor (Descartes, Amber Road / E2open, OCR Global Trade) for a maintained table — pricing typically $5K–$50K/yr `[vendor-gated; specific pricing requires sales contact]`.
- **ToS:** Public regulation; no use restriction.

## fields_returned

For a given destination country, the lookup returns:

- `country_name_bis` — BIS canonical name
- `country_groups` — list of group memberships (e.g., `["B", "D:1", "D:5"]` for China)
- `is_e1` / `is_e2` — embargoed
- `is_d1` ... `is_d5` — concern groups
- For each Reason for Control column on the Country Chart (NS1, NS2, MT1, MT2, NP1, NP2, CB1, CB2, CB3, AT1, RS1, RS2, FC1, EI, SS): boolean "license required for this RfC to this destination"
- For combined ECCN+country lookup: `license_required` boolean and the controlling RfC string

[best guess: this is the field shape any provider would use after ingesting the table. The BIS publication itself is just a table — there are no "fields" in an API sense. Searched for: "BIS country chart schema", "EAR country groups data dictionary"]

## marginal_cost_per_check

- $0.00. Local table lookup after ingestion.
- **setup_cost:** ~$5K–$15K one-time to ingest and validate the table, plus ~$2K/yr to monitor Federal Register updates and refresh `[best guess: standard small-data ingest project; could be done in a few engineer-days]`.
- Vendor alternative if buying a maintained table: `[vendor-gated]` $5K–$50K/yr.

## manual_review_handoff

- **Group E:1 / E:2 hit:** auto-deny. Reviewer documents the hit and reports per [BIS reporting requirements](https://www.bis.gov/regulations/ear/part-764-enforcement-and-protective-measures); no manual override available without specific OFAC license.
- **Group D + license-required hit:** reviewer escalates to export compliance. Compliance evaluates whether a license exception applies (e.g., GBS, RPL, TMP) or whether to file a license application. Decision time: typically 30–90 days for a BIS license [best guess based on BIS published average processing times].
- **Borderline / dual-listed (e.g., China is in B and D:1 and D:5):** reviewer cross-references the order's ECCN with the Country Chart by RfC.
- **Foreign-institution re-export risk:** if the destination is allowed but the customer's stated re-export plan touches a Group E destination, the order is treated as a Group E destination for screening purposes (the "knowledge" standard under 15 CFR 736.2(b)(5)).

## flags_thrown

- `country_group_e` — destination is E:1/E:2 → auto-deny
- `country_group_d_license_required` — destination is D-group AND ECCN is controlled for the relevant RfC → escalate to export compliance
- `country_group_unmapped` — country normalization failed; reviewer must manually map (escalation)
- `reexport_disclosed_to_e` — customer disclosed re-export to a Group E destination → treat as Group E
- `military_end_use_concern` — destination is in [Supplement No. 2 to Part 744 (MEU list countries)](https://www.bis.gov/regulations/ear/part-744/supplement-no-2-part-744-list-items-subject-military-end) and item is on the MEU list → escalate

## failure_modes_requiring_review

- Country name doesn't normalize (e.g., "Republic of Korea" vs "Korea, North" vs "Korea, South" — North is E:1, South is A:1; getting this wrong is a hard-block error).
- ECCN is unknown / disputed → cannot complete the chart lookup.
- Destination is a US territory or APO/FPO — special rules.
- Destination is a vessel / aircraft (not a country).
- Destination is in a sub-region under sectoral sanctions (Crimea, Donetsk, Luhansk) — the chart is at country grain; sub-region is handled by `m06-iso-country-normalize`.
- BIS publishes a Federal Register update between table ingestion and the order — stale table.
- License exception applicability is item-specific — automation cannot determine.

## false_positive_qualitative

Legitimate-customer cases this would incorrectly hold up:

- **Real life-science institutions in Group D countries** (Chinese universities, Indian state research institutes, Vietnamese national labs). The table will flag everything; reviewer must determine if a license exception or NLR pathway applies. Many are legitimate.
- **Real EU customers** when an EU member state is in a transitional listing or when the chart hasn't been updated for the latest EU enlargement.
- **Customers in countries with overlapping group memberships** (China is B + D:1 + D:5 + D:3 + D:4) — the flag fires multiple times even when the underlying ECCN doesn't trigger any of them.
- **Re-export scenarios where customer is a US-domiciled distributor** — the destination on the shipment is US, but the chart-based check doesn't see the downstream re-export.
- **Crimea / Donetsk / Luhansk-listed addresses** that are flagged as Russia or Ukraine by other systems — overflagging on Russia/Ukraine when the legitimate destination is unaffected sub-regions.

## record_left

For each order screened:
- `country_name_input` (raw)
- `country_name_normalized` (ISO + BIS canonical)
- `bis_country_groups` (list)
- `eccn` (from m06-hs-eccn-classification)
- `chart_lookup_result` (license required y/n + RfC)
- `chart_table_version` (Federal Register publication date of the ingested table)
- Disposition + reviewer signoff if escalated.

Retention: 5 years per [15 CFR § 762.6](https://www.bis.gov/regulations/ear/part-762-recordkeeping). This is a hard regulatory retention requirement, not a best practice.

## bypass_methods_known

(Stage 5 fills.)

## bypass_methods_uncovered

(Stage 5 fills.)
