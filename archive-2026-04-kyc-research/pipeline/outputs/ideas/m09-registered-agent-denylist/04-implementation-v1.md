# m09-registered-agent-denylist — implementation v1

- **measure:** M09 — institution-real-life-sciences
- **name:** Mass-formation registered agent + virtual-office / CMRA denylist
- **modes:** A
- **summary:** Maintain an internal denylist of (a) high-volume mass-formation registered agents (Northwest Registered Agent, Bizee/Incfile, ZenBusiness, LegalZoom, Harvard Business Services, etc.), and (b) virtual-office / CMRA addresses (Regus/IWG, Davinci Virtual, Alliance Virtual Offices, plus all USPS-listed CMRA locations). Cross-reference the customer's institution registered address and registered-agent name from the corp-registry-stack output. Combined with other shell signals (recent incorporation, no PubMed history, fresh domain), it is a strong shell-pattern indicator.

## external_dependencies

- Internal denylist (curated by the provider). Seed list compiled from public sources:
  - Northwest Registered Agent — operates in 21+ states for virtual office service ([source](https://www.northwestregisteredagent.com/business-address/virtual-office)).
  - Bizee (formerly Incfile) — has formed 150,000+ businesses ([source](https://venturesmarter.com/best-registered-agent-services/massachusetts/)).
  - ZenBusiness, LegalZoom, Harbor Compliance, Harvard Business Services, IncAuthority [best guess: top 10 mass-formation services per multiple "best registered agent" review aggregators]([source](https://switchonbusiness.com/registered-agent-services/massachusetts-registered-agent-services/)).
  - Regus / IWG, Davinci Virtual, Alliance Virtual Offices, Servcorp [best guess: top 4 commercial virtual-office chains].
- USPS Customer Registration Database (CRD) for CMRA locations — but **the CRD is not publicly downloadable**; it's accessible only via the USPS Business Customer Gateway behind a CMRA operator account ([source](https://about.usps.com/postal-bulletin/2023/pb22624/html/updt_002.htm)). Third-party address-validation services (Smarty/SmartyStreets) expose a CMRA flag for any US address ([source](https://www.smarty.com/docs/cmra)).
- OpenCorporates registered-agent counts — for any address or agent, OpenCorporates can return the count of companies registered there, which is a quantitative input to the denylist scoring [source: same as corp-registry-stack file](https://api.opencorporates.com/).

## endpoint_details

- **Internal denylist:** flat file or table. Updated quarterly. Authoritative source-of-truth maintained by the provider's compliance team.
- **Smarty CMRA flag:** `https://us-street.api.smarty.com/street-address` — REST + JSON, API key auth, returns USPS DPV-validated address with `cmra` boolean (Y/N). Pricing: ~$0.005–$0.02/call at typical commercial tiers [unknown — searched for: "smarty street address api pricing per lookup", "smartystreets cmra flag api cost", "smarty us street api volume pricing"]. Smarty markets CMRA detection as a feature ([source](https://www.smarty.com/docs/cmra)).
- **OpenCorporates registered-agent count:** same auth/pricing as the corp-registry-stack idea ([source](https://api.opencorporates.com/)). Query the registered agent name and bucket by jurisdiction; counts >1,000 are diagnostic of mass-formation use.
- **ToS:** USPS CRD has restrictive access for non-CMRAs; Smarty's commercial license permits use for any address-validation purpose including KYC.

## fields_returned

- **From internal denylist match:** matched_agent_name, agent_category (mass-formation / boutique / unknown), match_confidence.
- **From Smarty:** delivery_line_1, delivery_line_2, last_line, components (zip, plus4), metadata (`cmra`: Y/N, `dpv_match_code`, `record_type` — "P" PO Box, "H" Highrise, "S" Street, "R" Rural Route, etc.) ([source](https://www.smarty.com/docs/cmra)).
- **From OpenCorporates registered-agent search:** agent_name, jurisdiction, total_companies_registered, sample of recent registrants.

## marginal_cost_per_check

- **Internal denylist match:** $0.
- **Smarty CMRA flag:** ~$0.005–$0.02/call [best guess based on standard address-validation pricing tiers; vendor publishes plans but exact per-call rate varies by volume].
- **OpenCorporates count:** see corp-registry-stack idea (~£0.20/call at Basic).
- **Combined:** ~$0.05–$0.50 per customer.
- **Setup cost:** ~2 engineering days plus ~1–2 days/quarter ongoing maintenance to refresh the seed denylist.

## manual_review_handoff

- Reviewer receives: registered_address, registered_agent_name (from corp-registry-stack), and the flag(s) thrown.
- Playbook:
  1. **Address is CMRA-flagged AND registered agent is on the mass-formation denylist:** strong shell signal. Flag both. Combine with other M09 signals; if 2+ shell signals total, escalate to high-friction review.
  2. **Address CMRA but agent not on denylist (or vice versa):** moderate signal. Reviewer asks the customer "is this address a forwarding service or a physical operation?" and verifies via incubator listing / Google Street View / public tenant directory.
  3. **Mass-formation agent only, address looks physical:** weaker signal — mass-formation agents legitimately serve thousands of real small businesses. Per the attacker mapping ("Mass agents legitimately serve thousands"), this flag is non-blocking on its own.
  4. **Neither match:** pass on this idea.

## flags_thrown

- `registered_agent_mass_formation` — agent name matches the denylist of mass-formation services.
- `address_virtual_office` — address Smarty-flagged as CMRA OR matches the denylist of known commercial virtual-office chain locations.
- `address_high_density_registrations` — OpenCorporates shows > N companies (e.g., > 100) sharing the same registered address.

## failure_modes_requiring_review

- **Denylist staleness** — new mass-formation services, new virtual-office chains, and new locations of existing chains appear constantly. Quarterly refresh is the floor; monthly is better.
- **CMRA false negatives** — small private mailbox services that haven't registered as CMRAs with USPS will not show the `cmra` flag.
- **Mass agents serve real businesses** — the attacker mapping explicitly notes "Mass agents legitimately serve thousands"; flagging on agent name alone produces high false-positive rates.
- **USPS CRD inaccessibility** — provider cannot directly cross-check against the authoritative CMRA registry without a USPS BCG account, and there is no public bulk download ([source](https://about.usps.com/postal-bulletin/2023/pb22624/html/updt_002.htm)). Reliance on Smarty's CMRA flag introduces vendor dependence.
- **Coworking biotech labs** (LabCentral, BioLabs, Genspace) — not CMRA, not mass-formation, but functionally a "shared address" pattern. Need a separate enriched list of biotech-incubator addresses, which the attacker stories explicitly cite as a bypass route.

## false_positive_qualitative

- Real small biotechs that file with Northwest / ZenBusiness / Incfile because they're cheap and convenient — exactly the legit population the denylist conflates with shells.
- Real new biotechs that use a virtual office for the first 6–12 months while seeking lab space.
- Real biotech incubator tenants whose registered address is the incubator (LabCentral, BioLabs) — these are the legit version of the biotech-incubator-tenant attacker pattern.
- Pass-through state LLCs (DE/WY/NM) where registered agent is required by law and is always a service provider.
- Single-PI consulting / advisory LLCs run by real scientists out of a registered-agent address.

## record_left

- Match results: agent_name, agent_match_status, address, cmra_flag, oc_count, query_timestamp. Stored in customer file.

## bypass_methods_known

[deferred to stage 5]

## bypass_methods_uncovered

[deferred to stage 5]

---

**Sources cited:**
- Northwest Registered Agent virtual office: https://www.northwestregisteredagent.com/business-address/virtual-office
- Switch on Business — Massachusetts registered agent reviews: https://switchonbusiness.com/registered-agent-services/massachusetts-registered-agent-services/
- Venturesmarter — Massachusetts registered agent comparison: https://venturesmarter.com/best-registered-agent-services/massachusetts/
- USPS CMRA database 2023 update: https://about.usps.com/postal-bulletin/2023/pb22624/html/updt_002.htm
- Smarty CMRA documentation: https://www.smarty.com/docs/cmra
- OpenCorporates API: https://api.opencorporates.com/
