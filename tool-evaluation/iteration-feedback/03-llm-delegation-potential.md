# Pipeline Feedback — LLM Delegation of "Human Review" Tasks

**Date:** 2026-04-15  
**Scope:** The BOTEC synthesis (stage 6), field assessments (stage 4), and resolution paths currently prescribe ~68 hrs/month of "human review" at 1,000 orders/month. This document identifies specific cases where that review follows rule-based or web-lookup patterns that an LLM agent with tool access could handle — reducing the effective human cost without changing what gets checked.

---

## The core observation

The pipeline's resolution paths for "quick_review" and "investigation" tiers describe procedures, not judgment. Most of them are:

1. **Look up X in source Y** (web search, state incorporation records, LinkedIn)
2. **Check if condition Z holds** (does the institution have multiple campuses? is the company a known incubator tenant?)
3. **Pass or escalate based on the answer**

These are exactly the tasks an LLM agent with web search + structured API access already does well. The pipeline implicitly treats "human" as the only alternative to "deterministic API," but there's a middle tier — **LLM-assisted review** — that the BOTEC doesn't account for.

The cost impact is significant. If LLM-assisted review can absorb even half the "quick_review" and "investigation" hours, the human cost drops from ~$2.72/order to ~$1.50/order and the FTE requirement drops from 0.4 to ~0.2.

---

## Case-by-case analysis

### Case 1: Multi-campus city mismatch (PG-03) — step (a)

**Current classification:** quick_review, 2-3 min  
**Current resolution path:** "Reviewer checks: (1) Does the institution have multiple campuses? (2) Is the shipping city near the ROR city? (3) Quick web search for institution + shipping city."  
**Monthly hours at base fraction:** 0.8 hrs  

**Why this is LLM-delegable:** Every step in this resolution path is a structured web lookup. An LLM can:
- Query "[Institution name] campuses" or "[Institution name] [shipping city]"
- Check whether the shipping city appears on the institution's website
- Compute geographic proximity between ROR city and shipping city (geocoding APIs exist)

**What makes it non-judgmental:** The pass/fail rule is simple — if the institution has a presence in the shipping city, pass. If not, escalate. There's no subjective weighting.

**Concrete example from stage 3:** Griffith University ships to Gold Coast but ROR shows Brisbane. A web search for "Griffith University Gold Coast" immediately returns the Gold Coast campus page. An LLM resolves this in <10 seconds.

**Suggested reclassification:** `llm_review` (0.5 min, ~$0.01 LLM cost)

---

### Case 2: Mid-size OECD biotech verification (PG-05) — step (a)

**Current classification:** quick_review, 1-2 min  
**Current resolution path:** "Not in ROR. Google Places=premise. Quick web search to verify company exists."  
**Monthly hours at base fraction:** 4.7 hrs  

**Why this is LLM-delegable:** "Verify company exists" is a web search + reading comprehension task. The LLM checks:
- Does the company have a website?
- Is there a LinkedIn company page with employees?
- Is there any press coverage, investor mention, or incorporation record?

**What makes it non-judgmental:** The decision rule is binary — evidence of a real, operating company at the claimed address = pass. No evidence = escalate. The reviewer isn't exercising nuanced judgment about whether the company is "legitimate enough."

**Concrete example from stage 3:** Agilent at 5301 Stevens Creek Blvd. A web search immediately confirms this is Agilent's address. An LLM resolves this trivially.

**Suggested reclassification:** `llm_review` (0.5 min, ~$0.01 LLM cost)

---

### Case 3: Free email from non-OECD country (step c) — 10% of orders

**Current classification:** quick_review, 2-5 min  
**Current resolution path:** "Reviewer checks: (1) Does the customer's institution exist in ROR? (2) PubMed article count? (3) OpenAlex for the person (if unique name)? (4) Does the institution have functional email (MX check)?"  
**Monthly hours at base fraction:** 5.8 hrs (subset of step c's 9.8 quick_review hours)

**Why this is LLM-delegable:** Every check listed here is either an API call (ROR, PubMed, OpenAlex, MX lookup) or a structured interpretation of an API result. The resolution path is essentially: "run these 4 checks and report the results." An LLM agent could execute this entire sequence autonomously.

**What makes it non-judgmental:** The rule is: if the institution exists in ROR + has PubMed presence + institution domain has no MX (explaining the free email), pass. The "judgment" here is just "do the signals align?" — which is pattern matching, not discretion.

**Concrete example from stage 3:** 163.com + China Agricultural University. ROR confirms institution, PubMed shows thousands of articles, MX check on cau.edu.cn would confirm email infrastructure exists (so researcher _chose_ 163.com, which is the regional norm). Fully automatable.

**Suggested reclassification:** `llm_review` (1 min, ~$0.02 LLM cost)

---

### Case 4: Free email from OECD country (step c) — 5% of orders

**Current classification:** quick_review, 1-3 min  
**Current resolution path:** "Reviewer checks: (1) Does the institution have email infrastructure? (2) OpenAlex for the person? (3) PubMed for the institution?"  
**Monthly hours at base fraction:** 1.7 hrs

**Why this is LLM-delegable:** Same reasoning as Case 3. API calls + pattern matching.

**Suggested reclassification:** `llm_review` (0.5 min, ~$0.01 LLM cost)

---

### Case 5: Small biotech at incubator (PG-06) — step (a), investigation tier

**Current classification:** investigation, 5-15 min  
**Current resolution path:** "Zero results in ROR/GLEIF/Companies House. Exa or Google Places may identify the address as coworking/incubator. Reviewer: (1) Web search for the company name, (2) Check if address is a known incubator, (3) Look for company website, incorporation records, LinkedIn."  
**Monthly hours at base fraction:** 5.0 hrs  

**Why this is LLM-delegable:** An LLM with Exa/web search access can:
- Search for the company name and find (or not find) a website
- Recognize that the address belongs to a known incubator (LabCentral, BioLabs, JLABS, etc. — this is a finite, maintainable list)
- Check state incorporation records (Secretary of State websites are searchable)
- Check LinkedIn for the company and employees

**What makes it non-judgmental:** The decision tree is:
1. Is the address a known incubator? → If yes, check if the company is plausibly a tenant (has a website, some web presence). Pass if yes.
2. If not a known incubator, escalate to human.

The "judgment" here is actually just web lookup + list matching.

**Suggested reclassification:** `llm_review` for known-incubator cases (~60% of PG-06), `investigation` for unknown addresses (~40% of PG-06). Blended: 3-5 min average.

---

### Case 6: Small biotech at own commercial address (PG-07) — step (a), investigation tier

**Current classification:** investigation, 10-15 min  
**Current resolution path:** "Zero in registries. Generic commercial. Must check incorporation, LinkedIn."  
**Monthly hours at base fraction:** 6.3 hrs

**Why this is partially LLM-delegable:** The web search + incorporation check is doable by an LLM. But the "is this company real enough?" question has a softer boundary than the incubator case. Two sub-cases:

- **Company has a website + LinkedIn + incorporation record:** LLM can confirm existence and pass. (~50% of PG-07)
- **Company has minimal web presence, ambiguous incorporation, or recent founding:** Genuinely requires judgment about risk tolerance. Human stays. (~50% of PG-07)

**Suggested reclassification:** Split PG-07 into `llm_review` (5 min, ~$0.03 LLM cost) for clear-evidence cases and `investigation` (10-15 min human) for ambiguous ones.

---

### Case 7: International residential address classification (step d) — 15% of orders

**Current classification:** quick_review, 2-5 min  
**Current resolution path:** "Google Places name+address; if institutional type returned, pass. Otherwise Exa check."  
**Monthly hours at base fraction:** 7.5 hrs (estimated subset of step d's 14.5 hrs)

**Why this is LLM-delegable:** This is literally "run a Google Places query, read the type field, and decide." If the type is `university`, `research_institute`, `hospital`, or `manufacturer`, pass. If `premise` or `point_of_interest`, run Exa and read the result. The entire procedure is API-call-then-read, no human discretion involved.

**Concrete example:** An international university address where Smarty doesn't work. Google Places name+address returns `university`. An LLM (or even deterministic code) passes this instantly.

**Suggested reclassification:** `llm_review` (0.5 min, ~$0.01 LLM cost) for cases where Google Places returns an institutional type. `llm_review` (1.5 min, ~$0.02 LLM cost) for cases requiring Exa fallback.

---

### Case 8: BIS Group D export control review (step e) — 8% of orders

**Current classification:** quick_review, 2-5 min  
**Current resolution path:** "BIS=license_required. Check institution + order contents."  
**Monthly hours at base fraction:** 4.1 hrs

**Why this is partially LLM-delegable:** "Check institution" is a registry lookup (covered by step a). "Check order contents" requires reading what was ordered against export control categories (EAR/CCL classifications). This is a structured matching task — compare the ordered item against a controlled-items list. An LLM can do this if given the relevant EAR categories and the order description.

**What gives pause:** Export control compliance has legal consequences. Even if an LLM can do the matching correctly, a provider might want a human in the loop for liability reasons. But the _cognitive task_ is not judgment-intensive — it's classification against a known list.

**Suggested reclassification:** `llm_review` with mandatory human audit of flagged cases (LLM does the initial classification, human reviews only cases the LLM flags as potentially controlled). Net effect: LLM handles the ~70% of Group D cases where the order contents are clearly not controlled (standard oligos, gene fragments), human reviews only the ~30% with ambiguous items.

---

### Case 9: Government lab sub-unit verification (PG-09) — step (a)

**Current classification:** quick_review, 2-5 min  
**Current resolution path:** "Check ROR for both the lab name and parent agency. If the sub-unit has its own ROR record, auto-pass. If not, check the parent agency and verify the sub-unit via web search."  
**Monthly hours at base fraction:** 1.8 hrs

**Why this is LLM-delegable:** ROR lookup is an API call. "Verify the sub-unit via web search" is a web search. The decision rule is: does the parent agency exist in ROR + does the sub-unit appear on the parent's website? Binary.

**Concrete example:** Canada NML — not in ROR, but PHAC (parent) is. A web search for "National Microbiology Laboratory PHAC Winnipeg" confirms it exists. An LLM resolves this in seconds.

**Suggested reclassification:** `llm_review` (0.5 min, ~$0.01 LLM cost)

---

### Case 10: Dual affiliation / domain-institution mismatch (step c)

**Current classification:** quick_review, 2-3 min  
**Current resolution path:** "Reviewer checks: (1) Is there a known relationship between the email institution and the claimed institution? (2) OpenAlex/ORCID for dual affiliation? (3) Is the claimed institution a spin-off or subsidiary?"  
**Monthly hours at base fraction:** 1.2 hrs

**Why this is LLM-delegable:** Every check is an API call (OpenAlex, ORCID) or a web search. The pass/fail rule is: if the person appears in publication databases at both institutions, or if the claimed institution is a known spin-off of the email institution, pass.

**Concrete example:** Kirill Nemirov with pasteur.fr email claiming TheraVectys. OpenAlex shows publications at both institutions. An LLM reads the OpenAlex result and confirms dual affiliation. Trivial.

**Suggested reclassification:** `llm_review` (1 min, ~$0.02 LLM cost)

---

## Cases that genuinely require human review

For completeness, here are the cases where I think human review is correctly prescribed:

1. **PG-08 Community bio lab (customer_follow_up, 15-30 min):** Requires contacting the customer about biosafety setup and IBC registration. An LLM cannot send emails on behalf of the provider and wait for responses. The _initial_ web search portion (is this a known community lab?) could be LLM-delegated, but the follow-up interaction is inherently human.

2. **PG-11 Common-name + free email (investigation, 5-15 min):** When OpenAlex returns 9,000 results for "Wei Zhang" and the email is 163.com, there's no automated way to link the person to the institution. Asking the customer for evidence is the only path. The LLM can _prepare_ the case (run the searches, summarize what was found/not found), but the decision to accept customer-provided evidence involves judgment.

3. **PG-07 ambiguous cases (investigation, 10-15 min):** When a company has a barely functional website, no LinkedIn, and incorporation records show it was founded 3 months ago in Delaware, the "is this company real?" question requires genuine risk assessment.

4. **Export control edge cases:** When the order contains items that _might_ be controlled (e.g., gene fragments encoding sequences near the CCL threshold), the classification requires domain expertise and has legal consequences.

---

## Summary: impact on the BOTEC

### Current cost breakdown (from stage 6)

| Tier | Monthly Hours | % of Total |
|------|-------------|-----------|
| Quick review | ~42 hrs | 51% |
| Investigation | ~32 hrs | 39% |
| Customer follow-up | ~8 hrs | 10% |
| **Total** | **~82 hrs** (68 after overlap) | 100% |

### Proposed reclassification

| Tier | Monthly Hours (current) | LLM-delegable portion | Remaining human hours |
|------|------------------------|----------------------|----------------------|
| Quick review | ~42 hrs | ~35 hrs (83%) | ~7 hrs |
| Investigation | ~32 hrs | ~14 hrs (44%) | ~18 hrs |
| Customer follow-up | ~8 hrs | ~2 hrs (initial web search only) | ~6 hrs |
| **Total** | **~82 hrs** | **~51 hrs** | **~31 hrs** |

After overlap adjustment (~15%): **~26 hrs/month human** + **~43 hrs/month LLM-equivalent work** (at ~$0.01-0.03 per case in LLM inference cost ≈ $15-30/month total).

**Revised blended cost per order:**
```
API cost:           $0.036
LLM review cost:    ~$0.02
Human cost:         26 hrs x $40 / 1,000 = $1.04
Total:              ~$1.10/order  (down from $2.76)
```

This is a ~60% reduction in per-order cost, driven entirely by replacing structured web-lookup tasks with LLM agents.

---

## Suggested changes to stage 6 instructions

The BOTEC synthesis stage (stage 6) currently models two tiers: **auto** (API-only, 0 min) and **human review** (quick/investigation/follow-up). It should model three tiers:

### Proposed tier structure

1. **Auto (API-only):** Deterministic rules. No agent involvement. Same as today.
2. **LLM-assisted review:** An LLM agent with web search + API access runs a prescribed procedure and makes a pass/escalate decision. Cost: ~$0.01-0.03/case in inference, ~0.5-2 min wall-clock time. No human sees the case unless the LLM escalates.
3. **Human review:** Cases the LLM cannot resolve or where liability/compliance requires a human decision. Includes customer follow-up (requires sending emails) and ambiguous risk assessments.

### Specific instruction changes for `stages/06-botec-synthesis.md`

**In Step 3 (per-KYC-step cost tables):** Add an `llm_review` time tier alongside `auto`, `quick_review`, `investigation`, and `customer_follow_up`. For each profile group, assess whether the resolution path is:
- Fully procedural (API calls + web lookups + binary pass/fail rule) → `llm_review`
- Partially procedural (structured lookup but with a subjective threshold) → `llm_review` with human audit of flagged cases
- Judgment-intensive or requires external communication → `human_review`

**In Step 4 (cross-step rollup):** Add LLM inference cost as a separate line item alongside API cost and human cost. Use $0.02/case as a conservative estimate (covers a few Exa calls + LLM reasoning).

**In Step 5 (cost drivers):** Add a section on "automation frontier" — which profile groups are candidates for LLM delegation today, and what would need to change (better tools, policy decisions, validated accuracy) to move more into the LLM tier.

**In the fraction tree:** For each profile group, tag whether the review is `llm_delegable`, `partially_llm_delegable`, or `human_required`, with a one-line justification.
