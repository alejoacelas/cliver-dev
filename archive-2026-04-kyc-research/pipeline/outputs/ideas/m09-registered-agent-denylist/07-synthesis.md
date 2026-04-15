# Per-idea synthesis: m09-registered-agent-denylist

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Mass-formation registered agent + virtual-office / CMRA denylist |
| **measure** | M09 — institution-real-life-sciences |
| **attacker_stories_addressed** | shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, dormant-domain, foreign-institution (last two with limited applicability) |
| **summary** | Maintain an internal denylist of high-volume mass-formation registered agents (Northwest, Bizee/Incfile, ZenBusiness, LegalZoom, etc.) and virtual-office/CMRA addresses (Regus/IWG, Davinci Virtual, Alliance Virtual, plus USPS-listed CMRA locations). Cross-reference the customer's registered address and registered-agent name from corp-registry-stack output. Combined with other shell signals, it is a shell-pattern indicator — but has the highest false-positive rate of any M09 idea because mass-formation agents are mainstream. |
| **external_dependencies** | Internal curated denylist (seeded from public sources, refreshed quarterly). Smarty (SmartyStreets) US address validation API for CMRA flag. OpenCorporates API for registered-agent counts per address. USPS CRD for authoritative CMRA data (not publicly downloadable — accessible only via USPS BCG behind a CMRA operator account). |
| **endpoint_details** | **Internal denylist:** flat file/table, maintained by compliance team. **Smarty CMRA:** `https://us-street.api.smarty.com/street-address` — REST+JSON, API key auth, returns USPS DPV-validated address with `cmra` boolean (Y/N). Pricing: [unknown — searched for: "smarty street address api pricing per lookup", "smartystreets cmra flag api cost"]; est. ~$0.005–$0.02/call at commercial tiers. **OpenCorporates:** same as corp-registry-stack (~£0.20/call at Basic). **ToS:** USPS CRD has restrictive non-CMRA access; Smarty commercial license permits KYC use. |
| **fields_returned** | **Denylist match:** matched_agent_name, agent_category (mass-formation/boutique/unknown), match_confidence. **Smarty:** delivery_line, components, metadata (cmra Y/N, dpv_match_code, record_type P/H/S/R). **OpenCorporates:** agent_name, jurisdiction, total_companies_registered, sample recent registrants. |
| **marginal_cost_per_check** | Denylist match: $0. Smarty CMRA: ~$0.005–$0.02/call [best guess]. OpenCorporates: ~£0.20/call. Combined: ~$0.05–$0.50 per customer. Setup cost: ~2 engineering days + ~1–2 days/quarter ongoing denylist maintenance. |
| **manual_review_handoff** | Reviewer receives: registered_address, registered_agent_name, flags. Four-case playbook: (1) CMRA + mass-formation denylist match → strong shell signal, combine with other M09; if 2+ shell signals total, escalate; (2) CMRA only or agent-only match → moderate signal, reviewer asks customer about address and verifies via Street View/tenant directory; (3) mass-formation agent only, address looks physical → weak signal (non-blocking alone); (4) neither match → pass. |
| **flags_thrown** | `registered_agent_mass_formation` — agent name matches denylist. `address_virtual_office` — Smarty CMRA flag or match against known virtual-office chain locations. `address_high_density_registrations` — OpenCorporates shows >N companies (e.g., >100) at same address. |
| **failure_modes_requiring_review** | Denylist staleness (new services/locations appear constantly; quarterly refresh is the floor). CMRA false negatives (small private mailbox services not registered with USPS). Mass agents serve real businesses (high FP rate on agent flag alone). USPS CRD inaccessibility (no public bulk download). Biotech co-working labs (LabCentral, BioLabs, Genspace) are not CMRA, not virtual offices, but functionally shared-address patterns — need separate enrichment. |
| **false_positive_qualitative** | (1) Mass-formation agent FPs — LegalZoom has served >4M businesses, Northwest >2M, ZenBusiness >850K; these are mainstream, not suspicious. Est. 30–50% of new US small businesses use mass-formation services. Flag fires on huge fraction of legitimate new biotech customers. (2) Biotech incubator tenants — LabCentral (125 startups), BioLabs (>500 cumulative), JLABS, QB3; real lab addresses triggering `address_high_density_registrations`. (3) Pass-through state mandatory agents — DE/WY/NM LLCs require registered agents by law; est. 60–70% of venture-backed biotechs are Delaware entities [best guess]. Flag is structurally uninformative for this population. (4) International blindness — denylist US-only; Smarty CMRA US-only; est. 30–50% of synthesis customers non-US. (5) Sole-PI consulting LLCs by real scientists — est. 3–5% of customers. |
| **coverage_gaps** | **Gap 1: Legitimate small biotechs using mass-formation agents** — est. 30–50% of new US small businesses; flag fires on mainstream incorporation channel. Structural FP. **Gap 2: Biotech incubator tenants** — est. 500–1,500 early-stage US biotechs at shared lab addresses at any time; not CMRA, not virtual office, not on denylist. **Gap 3: Pass-through state mandatory agents** — Delaware has >1.9M active entities [best guess]; registered agent required by law. Flag uninformative. **Gap 4: Non-US customers** — denylist US-centric; Smarty US-only; est. 30–50% of market uncovered. **Gap 5: Sole-PI consulting LLCs** — [unknown — searched]; est. 3–5% of customers. |
| **record_left** | Match results: agent_name, agent_match_status, address, cmra_flag, oc_count, query_timestamp. Stored in customer file. |
| **bypass_methods_known** | Mass-formation agent for LLC filing — CAUGHT via `registered_agent_mass_formation`. Virtual office (Regus/IWG/Davinci/Alliance) — CAUGHT via `address_virtual_office`. CMRA-registered mailbox service — CAUGHT via Smarty CMRA flag. |
| **bypass_methods_uncovered** | Biotech incubator/co-working lab address — not CMRA, not virtual office; real physical shared space outside denylist. Maker space address — same structural gap. Acquired entity with clean non-virtual address — inherited address not on denylist. Small unregistered CMRA — Smarty flag depends on USPS registration. Foreign institution address — US-focused denylist, no CMRA data for international addresses. |

## Section 2: Narrative

### What this check is and how it works

This check cross-references a customer's registered address and registered-agent name against two denylists: one of mass-formation registered agents (Northwest Registered Agent, Bizee/Incfile, ZenBusiness, LegalZoom, and similar high-volume incorporation services) and one of virtual-office/CMRA addresses (Regus/IWG, Davinci Virtual, Alliance Virtual, plus USPS-listed commercial mail receiving agencies). The registered-agent name and address come from the corp-registry-stack output (Companies House, EDGAR, or OpenCorporates). The system also queries Smarty's US address validation API, which returns a CMRA boolean flag for any US address, and optionally checks OpenCorporates for the count of companies registered at the same address. Three flags are produced: `registered_agent_mass_formation`, `address_virtual_office`, and `address_high_density_registrations`.

### What it catches

The check catches the cheapest shell-company formation path: a mass-formation agent ($150–$300/year) combined with a major-chain virtual office ($50–$600/month). For the **shell-company**, **shell-nonprofit**, **cro-framing**, and **cro-identity-rotation** stories, both the agent flag and the virtual-office flag fire when the attacker uses mainstream formation services and chain virtual offices. For the **dormant-domain** story where the attacker re-files a new entity, the same flags fire if the attacker uses mass-formation services. The check imposes an effective cost floor: to avoid both flags, the attacker must upgrade to a co-working lab bench ($2,000–$5,000/month at LabCentral or BioLabs) or acquire an existing entity with its own clean address ($50,000+).

### What it misses

The check's most significant gap is biotech incubator and co-working lab addresses. LabCentral, BioLabs, JLABS, QB3, Genspace, and similar facilities are real physical locations — not CMRAs, not virtual offices, and not on the denylist. Four attacker stories exploit this gap (**shell-company** lab-bench tier, **biotech-incubator-tenant**, **gradual-legitimacy-accumulation** incubator variant, **community-bio-lab-network** maker spaces). The implementation acknowledges this gap explicitly. Acquired entities with clean non-virtual addresses bypass all flags. The check is entirely US-centric: the denylist covers US registered-agent services, Smarty's CMRA flag works only for US addresses, and international virtual-office equivalents are not covered — leaving an estimated 30–50% of the market with no signal. The **foreign-institution** story is completely outside scope.

### What it costs

The denylist match itself is free. Smarty's CMRA flag costs an estimated $0.005–$0.02/call (pricing not publicly documented at per-call level). OpenCorporates adds ~$0.25/call. Combined cost is approximately $0.05–$0.50 per customer. Setup is about 2 engineering days, plus 1–2 days per quarter for denylist maintenance. The ongoing curation labor is the notable cost: new mass-formation services, new virtual-office locations, and new biotech incubators appear constantly. The coverage analysis questions whether this maintenance overhead is justified given the high false-positive rate.

### Operational realism

The reviewer receives the agent match, address flags, and OpenCorporates density count. The strongest signal is the combination of CMRA-flagged address plus mass-formation agent match — this is the classic shell pattern. However, the `registered_agent_mass_formation` flag alone has extremely poor signal-to-noise: LegalZoom has served over 4 million businesses, Northwest over 2 million, ZenBusiness over 850,000. An estimated 30–50% of newly formed US small businesses use a mass-formation service. The flag fires on a huge fraction of legitimate new biotech customers and provides near-zero standalone discriminative power. It is only useful when combined with other M09 shell-pattern signals (recent incorporation, fresh domain, no PubMed history). The playbook correctly makes it non-blocking on its own.

### Open questions

The coverage analysis raised a frank question about whether this idea carries its weight in the M09 suite or is dominated by the corp-registry-stack + PubMed combination. The mass-formation agent flag's extremely high false-positive rate means it adds review friction without proportionate signal. The concrete improvement suggested by the coverage analysis — maintaining a biotech-incubator whitelist (LabCentral, BioLabs, JLABS, QB3, Genspace) to suppress false positives on shared lab addresses — was not implemented. The 04C claim check noted that the seed list of "top mass-formation services" includes entries (Harbor Compliance, Harvard Business Services, IncAuthority) based on a `[best guess]` from review aggregators with only one citation; these should be either trimmed to cited entries or expanded with more sources.

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** All four findings were Moderate or Minor.
- **`[unknown]` fields:**
  - Smarty API per-call pricing — searched for 3 queries, no per-call rate found. Vendor publishes plan tiers but exact per-call cost varies by volume. Est. $0.005–$0.02/call.
  - Sole-PI consulting LLC prevalence — searched for 2 queries, no data. Est. 3–5%.
- **`[best guess]` fields with weak derivation:**
  - Mass-formation agent usage rate among new US small businesses (30–50%) — derived from major-service customer counts, not a direct survey.
  - Delaware active entity count (>1.9M) — attributed to Division of Corporations annual report without URL.
  - Venture-backed biotech Delaware incorporation rate (60–70%) — no source or derivation.
  - Non-US customer share of synthesis market (30–50%) — no citation.
- **04C claim check unresolved flags:**
  - UPGRADE-SUGGESTED: OpenCorporates registered-agent count claim should cite a specific endpoint.
  - MISSING-CITATION: Seed list entries for Harbor Compliance, Harvard Business Services, IncAuthority based on [best guess] from review aggregators.
- **Hardening suggestions not implemented:**
  - Finding 1 (Moderate): Maintain a supplementary biotech-incubator/co-working-lab whitelist (LabCentral, BioLabs, JLABS, QB3, Genspace) and/or new `address_shared_lab_space` flag. Four attacker stories exploit this gap.
  - Finding 3 (Minor): Supplement Smarty CMRA with `address_high_density_registrations` from OpenCorporates to catch unregistered mailbox services.
- **Strategic question for human review:** The coverage analysis notes this check has the highest false-positive rate of any M09 idea and questions whether the ongoing denylist maintenance (~1–2 days/quarter) is justified given the marginal signal it provides beyond corp-registry-stack + PubMed. The mass-formation agent flag has near-zero standalone discriminative power. Its value depends entirely on the combination with other shell-pattern signals. This cost-benefit tradeoff deserves explicit human judgment.
