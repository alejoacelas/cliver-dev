# Cliver: extended screening platform design

## 1. Current state

Cliver is an AI-powered KYC screening tool for synthetic DNA providers. A provider's compliance team submits customer information through a 5-field form (name, email, institution, sequence order details, notes), and the platform runs a multi-stage AI pipeline that produces a structured compliance report.

### What it does today

- **Verification pipeline** — AI (Google Gemini via OpenRouter) checks 4 compliance criteria: institutional affiliation, institution legitimacy, email domain validation, and sanctions/export control screening.
- **Research pipeline** — Searches for the customer's publications, lab work, and ORCID profile.
- **Tool integrations** — Tavily web search, US Consolidated Screening List, Europe PubMed Central, ORCID.
- **Structured output** — Evidence table, determinations table, background work table, and a FLAG / PASS / REVIEW decision.
- **Real-time streaming** — SSE events for progress (status, tool calls, text deltas, completion).
- **Report display** — ResponseCard component with collapsible sections for evidence, determinations, and audit data.

### Tech stack

React 18 + Vite + Tailwind + shadcn/ui (frontend), Node.js + Express + Drizzle ORM + PostgreSQL/Neon (backend), OpenRouter API (AI), Docker/Fly.io (deployment). ~2,500 lines of source.

### Key limitations

- No authentication (browser UUID only).
- Frontend polls DB every 1s instead of consuming the SSE stream directly.
- Response caching is demo-oriented.
- Significant unused shadcn/ui component bloat.
- Single-shot form submission—no progressive processing.

---

## 2. Extended platform overview

The extended platform transforms Cliver from an internal compliance tool into a **customer-facing screening portal** with progressive, real-time processing. The core idea: screening begins as the customer fills out the form, not after they submit it.

### 2.1 Customer-facing dynamic form

The intake form becomes customer-facing. Customers access a portal, create an account with email + password, and fill out a dynamic form.

**Form behavior:**
- **Schema-driven** — Form fields are defined in JSON/YAML config files, deployable without code changes. Each field specifies its type, validation rules, and visibility conditions.
- **Conditional fields** — Fields appear/hide based on previous answers. For example, selecting "academic institution" might reveal a department field, while "commercial entity" reveals a company registration number field.
- **Progressive triggers** — As the customer completes fields, the backend begins relevant checks immediately. Entering an email triggers a domain validation check; entering an institution name triggers an affiliation lookup. Some checks require multiple fields before firing.

**Authentication:** Email + password (AAL1 per NIST SP 800-63B-4). The customer registers with their email and a password, then verifies their email via a confirmation code. Email-based magic links are prohibited as a primary authentication mechanism by SP 800-63B-4 Sec. 3.1.3.1. Password requirements follow SP 800-63B-4 Sec. 3.1.1.2: minimum 15 characters (single-factor), no composition rules, blocklist check against breached passwords. See `cybersec/cybersec-requirements.md` for full details.

### 2.2 Progressive parallel pipeline

The current sequential pipeline is replaced with a parallel architecture that runs checks as data becomes available.

**How it works:**
1. Each check declares its **field dependencies** (e.g., "sanctions check" requires `name` + `institution`).
2. As form fields are completed, the backend evaluates which checks can now run.
3. Independent checks execute in parallel. Results are aggregated into the final screening report.
4. Some checks are **pre-approved** (database lookups, web searches) and run without customer consent.
5. Other checks require **customer consent** before execution (e.g., contacting a third party to verify institutional standing).

**Customer experience:** The customer sees action items surfaced by the pipeline—e.g., "Please upload an institutional letter" or "We'd like to contact your lab PI to verify your affiliation. Do you consent?" The customer does *not* see the detailed screening outcomes.

**Provider experience:** The provider's compliance team sees full real-time results on their dashboard: checks running, evidence gathered, determinations made, and a final decision.

**Dev view:** A debug interface shows pipeline state, individual check results, and timing as they're computed.

### 2.3 AI-driven follow-up actions

The AI can propose actions that go beyond passive data gathering. These actions have a tiered consent model:

**Pre-approved (no consent needed):**
- Searching databases (EPMC, ORCID, screening lists, web)
- Institutional lookups
- Sequence screening

**Customer consent required:**
- Sending a verification email to an institutional contact
- Requesting the customer upload additional documents
- Contacting a third party on the customer's behalf

Actions are executed via a **transactional email API** (SendGrid or AWS SES). Every proposed action, consent decision, and execution result is logged in an audit trail.

### 2.4 Sequence screening (SecureDNA)

Integrate SecureDNA for biosecurity sequence screening. SecureDNA uses a cryptographic protocol—sequence data never leaves the client infrastructure, and the hazard database is never exposed.

**Integration approach:** API-based. SecureDNA provides a client library that screens sequences locally against an encrypted hazard database. Results indicate whether a sequence matches a regulated or concerning pathogen.

**Future option:** Add IBBIS Common Mechanism compliance layer if customers or regulations require it.

### 2.5 Salesforce integration

Push screening results to Salesforce as a one-way integration.

**Behavior:** When a screening is complete, the app creates or updates a record in Salesforce with the screening outcome (decision, risk level, flags, evidence summary). The provider's compliance team can then manage the customer relationship within Salesforce as usual.

### 2.6 Provider authentication

Provider users authenticate at AAL2 (per NIST SP 800-63B-4): password + a second factor. The second factor must be replay-resistant, and at least one phishing-resistant option (e.g., passkeys/WebAuthn) must be offered. This replaces the current browser UUID system and ensures screening data is tied to real user accounts with appropriate security for access to sensitive biosecurity screening outcomes.

Session requirements: maximum 24-hour overall timeout, 1-hour inactivity timeout, secure cookies (`HttpOnly`, `Secure`, `SameSite`), CSRF protection. See `cybersec/cybersec-requirements.md` Sec. 2.6--2.7 for full session management requirements.

---

## 3. Architecture

```
                        Customer portal                    Provider dashboard
                             |                                    |
                     [Dynamic form]                    [Results + audit view]
                             |                                    |
                      per-field events                    real-time updates
                             |                                    |
                    +--------v--------+                           |
                    |   Form engine   |------ field completed --->|
                    | (schema-driven) |                           |
                    +--------+--------+                           |
                             |                                    |
                    triggers eligible checks                      |
                             |                                    |
              +--------------+--------------+                     |
              |              |              |                     |
         [Check A]     [Check B]     [Check C]    ...            |
         (parallel)    (parallel)    (needs consent)             |
              |              |              |                     |
              |              |         [consent UI] --> customer  |
              |              |              |                     |
              +--------------+--------------+                     |
                             |                                    |
                    +--------v--------+                           |
                    |   Aggregator    |--- results -------------->|
                    | (decision logic)|                           |
                    +--------+--------+                           |
                             |                                    |
                    +--------v--------+              +------------v-----------+
                    |    SecureDNA    |              |     Salesforce push    |
                    | (seq screening)|              | (one-way, on complete) |
                    +-----------------+              +------------------------+
```

### Key components

| Component | Role |
|-----------|------|
| **Form engine** | Reads JSON/YAML schema, renders conditional fields, emits per-field events to backend |
| **Check scheduler** | Evaluates field dependencies, launches checks when prerequisites are met |
| **Check executors** | Individual check implementations (web search, screening list, EPMC, ORCID, SecureDNA, etc.) |
| **Consent manager** | Tracks which actions need consent, surfaces them to the customer, records decisions |
| **Aggregator** | Combines check results into a final screening report with decision logic |
| **Audit log** | Records every action: proposed, consented, executed, with timestamps and actors |
| **Salesforce adapter** | Maps screening results to Salesforce objects and pushes on completion |
| **Email service** | Sends verification emails and customer notifications via SendGrid/SES |

---

## 4. Open questions

### Form details

- **Field types** — Beyond text inputs, which field types are needed? File uploads (institutional letters, order docs)? Dropdowns with predefined options (institution type, organism lists)? Multi-select (intended applications)? Date pickers?
- **Partial state persistence** — Should the form auto-save as the customer fills it in, or only persist on explicit submission? Auto-save supports the progressive pipeline model but adds complexity.
- **Validation** — Client-side only, or also server-side business rules? For example: "if order includes select agents, require additional biosafety documentation."

### Pipeline and AI

- **Additional APIs** — Beyond the current integrations (Tavily, screening list, EPMC, ORCID), which additional data sources? Institutional databases (GRID/ROR)? Patent databases? Company registries (OpenCorporates)? Non-US export control lists (EU, UK, Australia)?
- **AI model selection** — Stay with Gemini via OpenRouter? Add Claude models? Use different models for different tasks (e.g., Claude for summarization, Gemini for tool calling)? Make it configurable per pipeline step?
- **Summarization depth** — Structured extraction only (tables, flags) as today? Add narrative summaries with analysis? Both structured data plus an executive summary? Configurable per use case?

### Follow-up actions

- **Action types** — Beyond email verification, what else? Requesting additional documents from the customer? Flagging for manual review by a specific team member? Scheduling a follow-up check after a time period?
- **Audit trail** — How rigorous? Essential for regulatory compliance (every action logged with timestamps, approvers, outcomes)? Or basic logging sufficient for now?

### Salesforce

- **Data mapping** — How should results map to Salesforce? A single "screening report" text field? Structured fields (decision, risk level, flags, evidence summary)? Custom Salesforce objects for screening data?
- **Authentication** — OAuth flow (user grants access) or API key configured by admin?

### Sequence screening

- **Integration point** — Automatic as part of the pipeline when sequences are submitted? Separate manual step? Both depending on order type?
- **Sequence input** — Text field? File upload (FASTA, GenBank)? Pulled from order management system via API? Multiple methods?
- **Flag handling** — Block the order and require manual review? Flag but continue with warning? Configurable per severity? Feed result into overall KYC decision?

### Infrastructure

- **Multi-tenancy** — Single-tenant (one provider per deployment)? Multi-tenant SaaS? Start single-tenant, design for future multi-tenancy?
- **Deployment** — Stay with Fly.io + Docker? Move to a different platform?
- **Frontend architecture** — Keep Vite SPA with more routes? Move to Next.js? Stay with current stack but add proper navigation layout?
- **Testing** — Unit tests for pipeline logic? Integration tests for API endpoints? E2E tests for key flows? Minimal manual testing for now?
