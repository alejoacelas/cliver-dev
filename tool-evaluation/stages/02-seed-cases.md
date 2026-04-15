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
- Idea syntheses from the archive: `archive-2026-04-kyc-research/pipeline/outputs/ideas/{idea-slug}/07-synthesis.md` (known coverage gaps from desk research).
- Coverage research from the archive: `archive-2026-04-kyc-research/pipeline/outputs/ideas/{idea-slug}/06-coverage.md` (BOTEC coverage dimensions).

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

## Per-endpoint rationale

For each **individual endpoint** in the group, write a short rationale covering:

1. **Known non-coverage** (1-2 sentences): What this endpoint clearly does not cover. Be specific. These are things we can state with confidence from the endpoint's documentation and scope — no need to burn test budget verifying them. They still matter for later stages (field assessment, cost synthesis) because they define the endpoint's role in the overall stack.

2. **Boundary hypotheses** (1-3 sentences): Where coverage is genuinely uncertain — the cases the stage 3 agent should focus its testing budget on. These are the empirical questions that need answers.

The distinction matters: if you know Companies House is UK-only, don't spend test cases proving it misses a Kenyan university. But if you're unsure whether OpenCorporates covers recently incorporated Kenyan companies, that's a boundary worth probing.

**Example — Institution registry group:**

> **ROR:**
> *Known non-coverage:* Community bio labs, makerspaces, and very small biotech startups (< 10 employees) are not in ROR's scope — it covers formal research organizations. Commercial entities without a research mission are generally absent.
> *Boundary hypotheses:* How well does ROR cover recently founded non-OECD universities? What about government lab sub-units (e.g., does ROR have NML or only PHAC)? Do name changes or mergers cause stale records?
>
> **GLEIF:**
> *Known non-coverage:* Academic institutions rarely have LEIs. GLEIF is biased toward financial and commercial entities. Non-profit research institutes are generally absent.
> *Boundary hypotheses:* Do large CROs (WuXi, Eurofins) have LEIs? How many mid-size biotech companies are covered? Are registered addresses useful or do they just reflect corporate registration agents (the Pfizer/Delaware problem)?
>
> **Companies House:**
> *Known non-coverage:* UK-only. All non-UK entities will return nothing.
> *Boundary hypotheses:* How well does it cover small biotech startups incorporated in the last 2 years? Does the dissolved status flag work reliably? Are registered addresses useful for KYC or do they reflect agent offices?
>
> **OpenCorporates:**
> *Known non-coverage:* Academic institutions are generally not in corporate registries.
> *Boundary hypotheses:* Coverage varies by jurisdiction — how well does it cover non-OECD countries (Kenya, Uganda, Kazakhstan)? Does it pick up community labs that are incorporated as nonprofits or LLCs?

## Output

One file per endpoint group: `tool-evaluation/02-seed-cases/{group-name}.yaml`

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

per_endpoint_rationale:
  ror:
    known_non_coverage: |
      Community bio labs, makerspaces, and very small biotech startups are not in ROR's scope.
      Commercial entities without a research mission are generally absent.
    boundary_hypotheses: |
      How well does ROR cover recently founded non-OECD universities? What about government
      lab sub-units (e.g., NML vs PHAC)? Do name changes or mergers cause stale records?
  gleif:
    known_non_coverage: |
      Academic institutions rarely have LEIs. Non-profit research institutes are generally absent.
    boundary_hypotheses: |
      Do large CROs have LEIs? Are registered addresses useful or do they reflect corporate
      registration agents (the Pfizer/Delaware problem)?
  companies-house:
    known_non_coverage: |
      UK-only. All non-UK entities will return nothing.
    boundary_hypotheses: |
      Small biotech startups incorporated in the last 2 years? Dissolved status reliability?
  opencorporates:
    known_non_coverage: |
      Academic institutions are generally not in corporate registries.
    boundary_hypotheses: |
      Coverage by jurisdiction — how well in non-OECD countries? Does it pick up community
      labs incorporated as nonprofits or LLCs?

information_sources:
  - source: "iGEM team list"
    url: "https://igem.org/teams"
    what_to_look_for: "Institutions outside US/EU, especially Africa and Southeast Asia"
  - source: "ROR data dump"
    url: "https://ror.readme.io/docs/data-dump"
    what_to_look_for: "Filter by country=KE or country=UG to find African institutions; check if small biotech companies are present"
  - source: "customers.csv"
    what_to_look_for: "Filter for Type='Controlled Agent Industry' or institutions with non-.edu email domains"
```

## Important: what this stage does NOT do

- Does **not** make any API calls. That's stage 3.
- Does **not** try to be comprehensive. 5-10 seed cases is enough — stage 3 will iterate.