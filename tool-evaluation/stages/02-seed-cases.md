# Stage 2 — Seed cases & information sources

**Scope:** One sub-agent per endpoint group (from the grouping in `01-endpoint-map.md`). Up to 9 agents in parallel.  
**Goal:** For each endpoint group, provide 5-10 starting test cases and document where to find more. This stage is lightweight — the heavy adversarial testing happens in stage 3.  
**Depends on:** Stage 0 (credential check) and stage 1 (endpoint map, static).

## What this stage does

1. **Select 5-10 seed cases** per endpoint group from `customers.csv` and general knowledge. These should span easy, medium, and hard cases — not all easy wins.
2. **Document information sources** where the stage 3 agent can find additional adversarial cases. Be specific: URLs, databases, directories, search strategies.
3. **Pre-commit reasoning** about what's likely to be hard for this endpoint group. The stage 3 agent should treat this as an input hypothesis to test and build upon — not gospel.

## Per-agent inputs

- The endpoint group's entries from `01-endpoint-map.md` (which endpoints, which KYC steps, which fields matter).
- The endpoint manifest from `00-endpoint-manifest.yaml` (status, rate limits, cost constraints).
- The customer dataset: `tool-evaluation/customers.csv` (535 records with real names, institutions, emails, countries).
- The relevant `07-synthesis.md` and `06-coverage.md` files from the archive (known coverage gaps from desk research).

## Seed case selection

Pick 5-10 cases that give the stage 3 agent a useful starting point:

- **2-3 easy cases:** Well-known institutions that should be well-covered (MIT, Pfizer, University of Oxford). These establish the baseline — "what does a good response look like?"
- **2-3 medium cases:** International institutions, smaller companies, less common types. These start probing the edges.
- **2-4 hard/adversarial cases:** Cases the agent suspects will fail — community labs, non-OECD institutions, very new entities, etc. These are the hypothesis the stage 3 agent will test first.

For each case, document:
```yaml
- id: 1
  name: "Massachusetts Institute of Technology"
  type: academic
  country: US
  source: general_knowledge
  difficulty: easy
  query_params:
    institution_name: "Massachusetts Institute of Technology"
    address: "77 Massachusetts Ave, Cambridge, MA 02139"
    email_domain: "mit.edu"
  hypothesis: "Should be fully covered — large US university, in ROR, has LEI, well-known domain"
```

The `query_params` should contain whatever the stage 3 agent needs to actually make the API calls. Different endpoint groups need different params.

## Information sources

For each endpoint group, list **where the stage 3 agent should look** to find more test cases after running the seeds. Be specific:

**Good sources for adversarial institution cases:**
- iGEM team list: https://igem.org/teams — student teams at varied institutions worldwide
- BioCurious/Genspace/community lab directories
- ROR data dump: https://ror.readme.io/docs/data-dump — can search for orgs in specific countries/types
- NIH RePORTER: search by state/country to find institutions with federal funding
- OpenCorporates: search for recently incorporated biotech companies
- African Academy of Sciences member list
- ASEAN biosafety network directories
- The `customers.csv` dataset itself — filter by country, institution type, or customer type

**Good sources for adversarial address cases:**
- Known coworking/incubator addresses: LabCentral (Cambridge), BioLabs (various), Jlabs (various)
- USPS PO Box lookup tool
- Regus/WeWork/Spaces locations directory
- Known freight forwarder addresses (from archive idea m06-freight-forwarder-denylist)

**Good sources for adversarial email/domain cases:**
- Newly registered domains (RDAP query for recent registrations)
- Free email provider list: https://github.com/disposable-email-domains/disposable-email-domains
- Typosquat generators (dnstwist tool output for known institution domains)

**Good sources for adversarial payment cases:**
- Stripe test card numbers: https://docs.stripe.com/testing
- BIN lists for prepaid/virtual cards
- Known fintech BIN ranges (Mercury, Brex, Relay)

## Pre-committed reasoning

For each endpoint group, write 1-2 paragraphs of reasoning about what's likely to be hard. This is the agent's hypothesis going into stage 3. Examples:

**Institution registry group (ROR, GLEIF, Companies House, OpenCorporates):**
> ROR should cover most major universities worldwide but will likely miss: community bio labs (not in any registry), very new biotech startups (not yet in OpenCorporates), government labs in non-OECD countries, and entities that changed names recently. GLEIF is biased toward financial entities — most academic institutions won't have LEIs. Companies House is UK-only; OpenCorporates extends this but coverage varies wildly by country (strong in US/UK/EU, weak in Africa/Central Asia). The biggest gap is probably the intersection of "non-academic" + "non-OECD" + "recently founded."

**Address classification group (Smarty, Google Places, GeoNames, OSM):**
> Smarty is US-only, so any international address will fall through to Google Places. Google Places Nearby Search works well for finding institutions near an address, but the key question is: does it find the RIGHT institution, and does it work outside the US/EU? Also, searching by address alone won't surface the institution — need geocode → nearby search. Coworking spaces should be detectable (Google Places returns `primaryType: coworking_space`), but the harder case is a legitimate startup operating out of a coworking space — flag or pass? GeoNames adds campus-center coordinates but its type taxonomy is coarse.

## Output

One file per endpoint group: `tool-evaluation/seed-cases/{group-name}.yaml`

```yaml
group: institution-registry
endpoints: [ror, gleif, companies-house, opencorporates]
kyc_steps: [a]

seed_cases:
  - id: 1
    name: "Massachusetts Institute of Technology"
    # ... full case spec
  - id: 2
    # ...

information_sources:
  - source: "iGEM team list"
    url: "https://igem.org/teams"
    what_to_look_for: "Institutions outside US/EU, especially Africa and Southeast Asia"
  - source: "ROR data dump"
    url: "https://ror.readme.io/docs/data-dump"
    what_to_look_for: "Filter by country=KE or country=UG to find African institutions; check if small biotech companies are present"
  - source: "customers.csv"
    what_to_look_for: "Filter for Type='Controlled Agent Industry' or institutions with non-.edu email domains"

pre_committed_reasoning: |
  ROR should cover most major universities worldwide but will likely miss: community bio labs,
  very new biotech startups, government labs in non-OECD countries. GLEIF is biased toward
  financial entities. Companies House is UK-only; OpenCorporates extends globally but coverage
  varies. Biggest gap: non-academic + non-OECD + recently founded.
```

## Important: what this stage does NOT do

- Does **not** make any API calls. That's stage 3.
- Does **not** try to be comprehensive. 5-10 seed cases is enough — stage 3 will iterate.
- Does **not** use Exa search. Agents use their own web search (Claude's built-in tools) for finding information sources. Exa is reserved for the LLM+Exa standalone endpoint testing in stage 3.
