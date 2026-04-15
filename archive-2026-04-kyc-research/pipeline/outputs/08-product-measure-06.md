# Stage 8 — Product Prioritization: M06 (shipping-export-country)

## Measure summary

**Practice:** Shipping address  
**Process:** Screen shipping address for countries subject to broad export restrictions.  
**Purpose:** Verify customer legitimacy  
**Flag triggers:** Shipping address in country subject to comprehensive sanctions or export restrictions  
**Follow-up:** Deny

---

## Selected stack

### 1. ISO 3166 normalization + sanctioned-territory geofence (m06-iso-country-normalize)

This is the foundation layer and must ship first. Every other idea in the stack depends on clean, canonical country codes — without normalization, a bare "Korea" could pass North Korea as South Korea, a catastrophic miss. Beyond plumbing, the geofence adds independent adversarial value against the CIS variant of the foreign-institution attacker story (addresses in occupied Crimea, DPR, LPR). Marginal cost is zero (local lookup from open ISO datasets), setup is modest ($5K–$15K), and the interface is clean: raw address text in, canonical ISO codes + geofence verdict out. The geofence's auto-block on sanctioned sub-regions operates independently of ECCN classification, meaning it produces signal even for EAR99 orders that slip past every other check. False-positive volume is near-zero because DNA synthesis orders to occupied Ukrainian territories are extremely rare. The main ongoing cost is geofence table curation as the conflict evolves, but the data volume is small and the stakes justify it.

### 2. BIS Country Group D/E + EAR licensing matrix (m06-bis-country-groups)

This is the regulatory backbone of the measure. It maps destinations to BIS Country Groups and cross-references against the Commerce Country Chart to determine whether a license is required for a given ECCN. Group E hits (Cuba, Iran, North Korea, Syria, and de-facto Russia/Belarus) produce automatic denials — the single highest-confidence signal in the entire M06 stack. For Group D destinations with controlled items, it triggers license-required escalation. The check is deterministic, zero marginal cost (local table lookup), and directly implements a legal obligation that any US-jurisdiction provider must satisfy regardless of screening philosophy. Its coverage ceiling is well-understood: re-export through non-embargoed intermediaries is invisible, and EAR99 orders produce no signal for Group D destinations. These are structural EAR limitations, not implementation gaps. The check composes cleanly: it consumes normalized country codes from m06-iso-country-normalize and ECCN classifications from m06-hs-eccn-classification.

### 3. BIS Entity List + DPL + UVL + MEU consignee screen (m06-bis-entity-list)

This check screens consignees against four BIS restricted-party lists via the free ITA Consolidated Screening List API. It catches the narrow but high-severity case where an attacker or intermediary is already a known restricted party. The API is free, federally maintained with hourly updates, and supports fuzzy-name matching. Integration cost is low ($3K–$10K), and the check is a regulatory obligation — US exporters must screen against the Entity List regardless. The 90–95% false-positive rate benchmark from financial-sector sanctions screening sounds alarming but is manageable at synthesis-order volumes (thousands, not millions). The check produces no signal for >99% of customers (denylist by nature), but its incremental value over the country-level checks is clear: it catches entity-specific restrictions that country-level screening misses entirely (e.g., a listed Chinese university ordering to a non-embargoed address). It composes independently — no upstream dependency on ECCN classification.

### 4. HS code / ECCN classification SOP (m06-hs-eccn-classification)

This is the gatekeeper for the Country Chart lookup in m06-bis-country-groups. Without an ECCN, the licensing matrix cannot run. The SOP is a human review step, not an automated check, but it is indispensable: it determines whether an order is EAR99 (no license for non-embargoed destinations) or 1C353 (license required for Group D destinations). The cost structure is favorable: ~95% of orders terminate at EAR99 in seconds (no SOC hit), and only the ~5% with SOC hits require 15–45 minutes of reviewer time. The December 2023 AG-member exemption further reduces the licensing burden. The SOP's coverage gaps (novel sequences, chimeric constructs, screening pipeline false negatives) are real but structural to the EAR framework — no SOP design can overcome them. Including this in the stack is not optional if m06-bis-country-groups is included; they are a coupled pair.

---

## Dropped ideas

**m06-freight-forwarder-denylist** — High curation cost ($10K–$30K setup, $5K–$20K/yr ongoing) for a reactive denylist that catches only previously identified bad actors; >99% of global freight forwarders are unlisted; the foreign-institution branch targets countries (Brazil, Japan, India) outside the Russia/China/Iran diversion corridor where available data concentrates; the Entity List subset of this check is already covered by m06-bis-entity-list; incremental value over the selected stack does not justify the curation burden at this stage.

---

## Composition note

The four selected ideas form a layered stack with clear data-flow dependencies. **m06-iso-country-normalize** runs first, producing canonical ISO country codes and geofence verdicts. Its output feeds into **m06-bis-country-groups**, which also consumes the ECCN from **m06-hs-eccn-classification**. **m06-bis-entity-list** runs independently in parallel — it queries the CSL API using consignee name and address, with no dependency on country normalization or ECCN classification.

The stack has two independent auto-deny paths: (1) geofence hit on a sanctioned sub-region (normalization layer), and (2) Group E country or Entity List/DPL match (country-groups + entity-list layers). The license-required escalation path requires all three of normalization, ECCN classification, and Country Chart lookup to be operational.

The dominant structural gap across the entire stack is re-export invisibility: all four checks operate on the declared first-hop shipping address and produce no signal when an attacker routes through a non-embargoed intermediary country. This is an inherent limitation of address-based screening and is not addressable within M06. Complementary measures (end-use verification, institutional due diligence in M07) are the appropriate mitigation layer.

The freight-forwarder denylist was dropped rather than deferred. If operational experience reveals that a meaningful fraction of flagged orders involve known diversion-corridor forwarders, it can be reconsidered — but the Entity List screen already covers the highest-confidence subset (SDN/Entity List logistics entities), and the remaining incremental coverage from TIP and enforcement narratives does not justify the curation overhead for an initial deployment.
