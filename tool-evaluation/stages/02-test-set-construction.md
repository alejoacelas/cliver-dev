# Stage 2 — Adversarial test set construction

**Scope:** One sub-agent per endpoint group (grouped by shared API). Up to 8 agents in parallel.  
**Goal:** For each endpoint, build 20-50 test cases designed to find the edges of coverage.  
**Depends on:** Stage 1 (need the endpoint-to-KYC-step mapping to know what to test).

## Per-agent inputs

- The endpoint's entry from `00-endpoint-manifest.yaml`.
- The relevant `07-synthesis.md` files for ideas this endpoint serves (these document known coverage gaps).
- The relevant `06-coverage.md` files (BOTEC coverage dimensions from the previous pipeline).
  Path pattern: `archive-2026-04-kyc-research/pipeline/outputs/ideas/{idea-slug}/06-coverage.md`
- The customer dataset: `tool-evaluation/customers.csv` for sampling real cases.
- The KYC step definitions from `run.md` (which flags this endpoint feeds into).
- The endpoint relevance mapping from `01-endpoint-relevance.md` (which fields matter for which flags).

## Construction approach

### 1. Sample from customers.csv (5-10 cases)

Pick real cases that span the dataset:
- Different countries (US, EU, Asia, Africa, South America)
- Different institution types (university, pharma, biotech startup, government lab)
- Different customer types (the 4 types in the CSV: Controlled Agent Academia, General Life Science, Sanctioned Institution, Controlled Agent Industry)

### 2. Generate adversarial cases via Exa search (15-40 cases)

Actively search for entities that are likely to be hard for this endpoint. General categories:

- **Geographic diversity:** Institutions in Africa, Southeast Asia, Central Asia, South America, Middle East. These are the regions where most APIs have weakest coverage.
- **Community bio labs / makerspaces:** Genspace, BioCurious, Open Science Network, Bosslab, La Paillasse, etc. Often not in institutional registries.
- **iGEM teams:** Student teams at varied institutions. Tests whether the *institution* is findable even if the team is the actual customer.
- **Coworking / incubator tenants:** WeWork, LabCentral, BioLabs, Jlabs. Address resolves to the coworking space, not the tenant.
- **Virtual offices / mail forwarding:** Regus, Spaces, UPS Store addresses.
- **Very new institutions (< 2 years old):** Recently founded biotech startups, newly chartered universities.
- **Name changes / mergers:** Institutions that changed names (e.g., HHMI Janelia, formerly Janelia Farm; Novartis, which absorbed Sandoz).
- **Multi-campus institutions:** University of California system, Chinese Academy of Sciences, Max Planck Institutes. HQ address vs. satellite campus.
- **Independent researchers:** No institutional affiliation. Citizen scientists, retired academics, consultants.
- **Freight forwarders / reshippers:** (For M03/M06 endpoints) Known freight forwarding addresses.
- **PO boxes / APO/FPO:** (For M03 endpoints) USPS PO boxes, military APO addresses.
- **Residential-to-commercial conversions:** Home labs, garage biotech.

### 3. Endpoint-specific edge cases

Each agent should also search for cases specific to its endpoint:

- **ROR:** Organizations not in the registry (small companies, community labs, government agencies in non-OECD countries).
- **GLEIF:** Entities without LEI (non-financial companies, nonprofits, academic institutions).
- **RDAP:** Privacy-proxied domains (Cloudflare, WhoisGuard), recently registered domains, country-code TLDs with restricted RDAP.
- **Smarty:** International addresses (Smarty is US-only), addresses with unit/suite numbers, rural routes, Puerto Rico/territories.
- **Companies House:** Non-UK entities, dissolved companies, recently incorporated LLPs.
- **OSM Overpass:** Institutions with no campus polygon in OSM, institutions in countries with sparse OSM coverage.
- **Screening List:** Common names that match sanctions list entries (false positive testing), transliterated names, aliases.
- **binlist.net:** Fintech-issued BINs (Chime, Cash App), virtual card BINs, non-US BINs.
- **Exa search:** Entities with minimal web presence, recently founded, non-English-language institutions.

### 4. Document each case

Every case needs enough detail to actually run the API call:

```yaml
- id: 1
  name: "Indian Institute of Technology Kanpur"
  type: academic                    # academic | biotech | pharma | community_lab | government | independent | freight_forwarder | other
  country: IN
  source: customers.csv             # customers.csv | adversarial_search | known_edge_case
  edge_case: false
  edge_reason: null                 # only if edge_case: true
  query_params:                     # endpoint-specific fields needed to make the call
    institution_name: "Indian Institute of Technology Kanpur"
    address: "Kanpur, Uttar Pradesh 208016, India"
    email_domain: "iitk.ac.in"
  expected_difficulty: easy         # easy | medium | hard
  notes: "Large established institution, should be well-covered"
```

The `query_params` field varies by endpoint — it contains whatever the agent will need in stage 3 to actually construct the API call.

## Budget constraints

- Each agent should spend **≤$50** on Exa/Tavily searches for case discovery.
- Aim for **30-50 cases** for complex endpoints (ROR, GLEIF, Smarty, Exa search).
- **20 cases** is sufficient for simpler endpoints (PO box regex, ISO country, binlist, InCommon).
- Don't waste Exa credits on cases you can construct from known lists (e.g., InCommon federation members are a downloadable XML).

## Output

One file per endpoint: `tool-evaluation/test-sets/{endpoint-id}.yaml`

```yaml
endpoint: ror
measures: [M02, M05, M07]
constructed_at: "2026-04-14"
total_cases: 35
cases_from_dataset: 8
cases_from_search: 22
cases_from_known_edges: 5

cases:
  - id: 1
    name: "Indian Institute of Technology Kanpur"
    type: academic
    country: IN
    source: customers.csv
    edge_case: false
    query_params:
      institution_name: "Indian Institute of Technology Kanpur"
      address: "Kanpur, Uttar Pradesh 208016, India"
      email_domain: "iitk.ac.in"
    expected_difficulty: easy
    notes: "Large established institution"

  - id: 2
    name: "Genspace"
    type: community_lab
    country: US
    source: adversarial_search
    edge_case: true
    edge_reason: "Community bio lab — likely not in institutional registries"
    query_params:
      institution_name: "Genspace"
      address: "33 Flatbush Ave, Brooklyn, NY 11217"
    expected_difficulty: hard
    notes: "From investigations/01-ror-api.md — confirmed absent from ROR"

  # ... 20-50 cases total
```
