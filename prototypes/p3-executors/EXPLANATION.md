# P3: Check executors and AI layer

## What problem this solves

Cliver is a screening platform for synthetic DNA providers. Before a provider ships custom DNA sequences to a customer, it needs to verify the customer's identity, institutional affiliation, and that they are not on any sanctions or export control lists. This verification involves gathering evidence from multiple external sources and having an AI model synthesize the findings.

P3 is the layer that talks to the outside world. It wraps every external API the platform needs and provides an AI completion layer that can call those APIs, extract structured data from natural language, and propose follow-up actions when results are ambiguous.

## How it works at a high level

The prototype has three major pieces:

### 1. Check executors

Each executor is responsible for one type of external lookup. When the pipeline needs to verify something about a customer, it hands the relevant data to an executor and gets back a structured outcome: pass, flag, undetermined, or error.

**Web search** sends queries to Tavily (a search API designed for AI applications) and returns normalized results with titles, URLs, and text snippets. This is used for general verification like confirming someone works at a specific institution.

**Screening list** queries the US Consolidated Screening List maintained by the International Trade Administration. It checks whether a person or organization appears on any US sanctions, denied-party, or entity lists. Multiple name variations are searched in parallel to increase match accuracy.

**Publication search** queries Europe PubMed Central, a free database of biomedical research papers. It finds publications by a researcher's name, institutional affiliation, research topic, or ORCID identifier. This helps verify that a customer is a legitimate researcher.

**ORCID lookup** queries the ORCID registry (Open Researcher and Contributor ID), a system where researchers register unique identifiers linked to their publication history, affiliations, and employment. It returns profile information including name, current employer, education history, and publication count.

**SecureDNA** is a placeholder. SecureDNA is a system that screens DNA sequences against databases of known dangerous biological agents. The executor validates that the input looks like a real DNA sequence (only the letters A, T, C, G, U, N) and is long enough to be meaningful, but returns "undetermined" because the actual SecureDNA API connection is not yet configured.

### 2. AI completion layer

This wraps OpenRouter, a service that provides access to AI language models from multiple providers (Anthropic, Google, and others) through a single API.

The layer offers three capabilities:

**Tool-calling completion** sends a prompt to an AI model along with descriptions of available tools. The model can decide to call tools (like searching the web or checking a sanctions list), receive the results, and continue reasoning. This loop can repeat up to 20 times before the model produces a final text answer. This is how the platform automates the verification process: the AI decides which checks to run and in what order.

**Structured extraction** takes a block of natural language text (like the AI's verification report) and extracts specific data into a predefined shape. For example, it can pull out an evidence table with four rows (one per verification criterion), each containing citation IDs and a summary. The extracted data is validated against a schema (using Zod, a TypeScript validation library) so the rest of the system can trust the shape.

**Text generation** produces plain text responses, used for things like generating one-sentence summaries of screening results.

### 3. AI action proposer

When check results come back flagged or undetermined, the proposer asks an AI model to suggest specific follow-up actions. For example, if a sanctions screening returns a potential match, it might suggest a more targeted web search to disambiguate. Each proposed action is classified as either pre-approved (safe to run automatically because it only queries public data) or consent-required (needs the customer's permission, like DNA sequence screening).

## What external services it talks to

- **Tavily** (api.tavily.com): Web search. Requires an API key.
- **US Consolidated Screening List** (api.trade.gov): Sanctions and export control screening. Requires a free subscription key.
- **Europe PubMed Central** (ebi.ac.uk): Biomedical publication search. No key required.
- **ORCID** (pub.orcid.org): Researcher profile registry. No key required.
- **OpenRouter** (openrouter.ai): AI model access. Requires an API key. Currently configured to use Google Gemini 2.5 Flash for extraction tasks and Anthropic Claude Sonnet for the main tool-calling loop.
- **SecureDNA**: Not yet connected.

## What its boundaries are

P3 handles external communication only. It does not:

- Decide the overall screening outcome (that is the decision aggregator's job, in P2)
- Schedule which checks to run or in what order (that is the pipeline orchestrator's job)
- Manage customer consent flows (that is the consent manager's job)
- Store any data persistently (it has an optional file-based cache for development, but no database)
- Serve any HTTP endpoints or render any UI

All data shapes flowing in and out of P3 are defined in P0 (the contracts package). P3 imports those types and never redefines them, so any upstream consumer can trust the shapes without coupling to P3's internals.

The file-based cache (stored in the `.cache/` directory) is opt-in via the `CACHE_ENABLED` environment variable. It hashes each API call's inputs and stores the response as a JSON file so that repeated test runs do not make redundant API calls. It is strictly a development convenience and should not be enabled in production.
