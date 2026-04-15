# Stage 6: Coverage research (BOTEC)

Pure bottom-up estimation of which categories of legitimate customers fall outside the implementation's coverage, with cited proxies. Separate from stage 4 because the source pool is different (market data, demographic stats) and conflating muddies both. Loops with 6F + 6C up to 3 iterations.

## Agent setup

- **One agent per idea.** Web search + fetch enabled.
- **Context provided:**
  - The latest stage 4 output (`04-implementation-v{N}.md`) — needs the concrete fields to know what gets checked
  - The idea's `00-spec.md`
  - The idea schema
  - On iteration 2+: prior `06-coverage-v{N-1}.md`, `06F-form-check-v{N-1}.md`, `06C-claim-check-v{N-1}.md`
- **Context NOT provided:** the attacker mapping (this stage is about legitimate customers, not attackers — keep them mentally separate), other ideas.

## Sourcing conventions

Same as stage 4: `[source](url)`, `[best guess: reasoning]`, `[unknown — searched for: ...]`.

## Prompt (iteration 1)

```
You are doing coverage research for an implementation idea. Your job: identify which categories of legitimate DNA synthesis customers this check would either fail to cover (no signal at all), trip on (false positive), or cover unreliably. Use bottom-up estimation with cited proxies.

**Idea under review:** `outputs/ideas/{{SLUG}}/04-implementation-v{{N}}.md`.

This document is concrete now. Read the `fields_returned`, `external_dependencies`, and `endpoint_details` sections carefully — those determine which customer categories the check covers and which it misses.

**Your task in three steps:**

### Step 1: Identify coverage gaps

For this specific implementation, what categories of legitimate customers would NOT get a reliable signal? "Reliable" means the check either returns no data, returns ambiguous data, or returns data that doesn't actually distinguish legitimate from malicious for that category.

Do not work from a fixed checklist. The relevant gaps are case-dependent — they depend on what the data source is, what fields it returns, and which populations are in / out of its catalog. As a starting point for your thinking (not as a required list), consider:

- Across countries or regions (US vs international, OECD vs not, English-language vs not)
- Industry vs academic vs government vs independent researchers
- New vs established entities (incorporation age, publication track record)
- Has institutional infrastructure (institutional email, ROR ID, ORCID) vs not
- Big-customer vs small-customer / single-order vs repeat
- Customer types specific to the data source (e.g., for ROR: institutions not in the registry; for OpenAlex: authors who don't publish in indexed journals)

Pick the gaps that actually matter for THIS data source. Drop dimensions that don't apply. Add dimensions that the suggestions above missed.

### Step 2: Define the categories

For each gap you identify, write a precise description of the customer category it covers. "International customers" is too vague — "academic researchers at non-OECD institutions whose institution is not in ROR" is precise.

### Step 3: Quantify with cited proxies

For each category, find a numerical proxy and cite it. Examples:

- "Fraction of synthesis-customer-equivalent institutions in ROR": find ROR's institution count, find a market estimate of how many synthesis-buying institutions exist, derive a ratio. Cite both inputs.
- "Fraction of biology PhDs who don't have an ORCID": find ORCID's life-sciences researcher count, find a total estimate, derive.
- "Fraction of synthesis customers who are commercial vs academic": find a market report or industry survey.

When direct data doesn't exist, derive from cited inputs and mark `[best guess: derivation]`. When neither direct data nor derivable inputs exist, mark `[unknown — searched for: ...]`.

**Aim for:** every category has either a citation, a derived best-guess with citations to the inputs, or an explicit `[unknown ...]`. No bare numbers.

**Also refine:**

- `false_positive_qualitative`: which categories from your analysis would generate false-positive flags (legitimate customers tripping the check) vs no-signal cases (legitimate customers the check just doesn't see)?

**Output structure** (`outputs/ideas/{{SLUG}}/06-coverage-v{{N}}.md`):

```
# Coverage research: {{IDEA_NAME}}

## Coverage gaps

### Gap 1: {{name}}
- **Category:** {{precise description}}
- **Estimated size:** {{number with citation or [best guess] or [unknown]}}
- **Behavior of the check on this category:** no-signal / false-positive / weak-signal
- **Reasoning:** ...

### Gap 2: ...

## Refined false-positive qualitative
{{updated list with cross-references to the gaps above}}

## Notes for stage 7 synthesis
{{anything the per-idea synthesis agent should know}}
```
```

## Prompt (iteration 2+, revision)

```
You previously did coverage research for {{SLUG}} in `06-coverage-v{{N-1}}.md`. Form check (`06F-form-check-v{{N-1}}.md`) and claim check (`06C-claim-check-v{{N-1}}.md`) flagged issues.

Apply the same revision logic as stage 4 iteration 2+: address each flag, populate missing citations, weaken overstated claims, expand thin search lists. Same output format.

Path: `outputs/ideas/{{SLUG}}/06-coverage-v{{N}}.md`.
```
