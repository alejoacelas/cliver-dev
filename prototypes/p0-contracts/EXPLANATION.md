# P0: Shared contracts

## What problem this solves

Cliver is a screening platform for synthetic DNA providers. When a customer orders synthetic DNA, the provider needs to verify the customer's identity, institutional affiliation, and compliance with sanctions and export control regulations. This involves running multiple checks in parallel---web searches, sanctions database lookups, publication searches, and more---and combining the results into a PASS, FLAG, or REVIEW decision.

The platform has several moving parts: a customer-facing form, a screening pipeline, an AI layer that orchestrates checks, a consent system for sensitive actions, authentication for both customers and providers, and integrations with external services like Salesforce and email providers.

All of these parts need to agree on the shape of the data they exchange. If the pipeline produces a screening result, the frontend needs to know exactly what fields that result contains. If the AI proposes a follow-up action, the consent system needs to know what that proposal looks like.

This package---P0, or `@cliver/contracts`---is the single place where all those data shapes are defined. It contains no logic and no behavior. It is purely a vocabulary: "here is what a screening decision looks like, here is what a form field looks like, here is what an SSE event looks like." Every other part of the system imports from this package to ensure they all speak the same language.

## How it works

The package uses two complementary technologies:

- **TypeScript** (a programming language that adds type checking to JavaScript) defines the *compile-time* shapes. When a developer writes code that produces or consumes a Decision, TypeScript checks at compile time that the code uses the correct fields and values.

- **Zod** (a runtime data validation library for TypeScript) defines the *runtime* shapes. When data crosses a system boundary---arriving from a network request, an AI model's response, or a database query---Zod checks at runtime that the data actually matches the expected shape, rejecting anything malformed.

Every data shape is defined once as a Zod schema. TypeScript types are automatically derived from those schemas, so the compile-time and runtime definitions can never drift apart.

### What the package defines

**Form types.** The customer intake form is schema-driven: its fields, validation rules, and conditional visibility are all defined in data rather than code. The contracts define what a form field looks like (its ID, label, input type, validation rules) and what a complete form schema contains.

**Pipeline types.** The screening pipeline runs checks in parallel as form fields are completed. A CheckDeclaration says "this check requires these form fields and may or may not need customer consent." A CheckOutcome says "this check produced a pass, flag, undetermined, or error result, with this evidence." PipelineState tracks the full state of a screening session. PipelineEvent is a timestamped record of something that happened during screening.

**Decision types.** After all checks complete, their results are aggregated into a Decision: PASS (all clear), FLAG (hard flag like a sanctions match), or REVIEW (soft flags needing human review). The decision includes a count of flagged criteria, a summary, and the specific reasons.

**Data types.** These capture the structured outputs of the AI analysis, migrated from the existing codebase:
- Evidence: what sources say about each of the four verification criteria.
- Determination: the FLAG / NO FLAG / UNDETERMINED judgment for each criterion.
- BackgroundWork: relevant laboratory work by the customer or their institution.
- CompleteData: the full screening result combining decision, checks, background work, and audit trail.
- ToolResult: normalized output from any tool (web search, sanctions check, etc.).

The four verification criteria---Customer Institutional Affiliation, Institution Type and Biomedical Focus, Email Domain Verification, and Sanctions and Export Control Screening---are defined as a fixed enumeration. This means any code that references a criterion gets compile-time checking that it uses one of the four valid values.

**SSE types.** The platform uses Server-Sent Events (a web standard for real-time server-to-client streaming) to push updates to the frontend. The SSEEvent type is a discriminated union---each event has a `type` field that determines what other fields are present. The original six event types (status, tool_call, tool_result, delta, complete, error) are preserved with properly typed fields, and three new types are added for the extended platform: consent_request, action_proposed, and field_event. A ViewFilter controls which events each client sees: customers see only consent requests and final status; providers see full evidence and audit trails; debug shows everything.

**Auth types.** Authentication follows NIST SP 800-63B-4 (a US government standard for digital identity). Customers authenticate at AAL1 (password only); providers authenticate at AAL2 (password plus a second factor like TOTP). The contracts define what a JWT token payload contains, what a server-side session record looks like, and what the password policy requires (minimum 15 characters, no composition rules, breached-password blocklist check).

**Integration types.** Salesforce credentials and record shapes for pushing screening results. Email message and transport shapes for transactional emails via SendGrid (a cloud email service) or AWS SES (Amazon's email service).

**Interfaces.** Seven interfaces define the capabilities that downstream packages must implement: executing checks, calling AI models, managing consent, logging audit events, storing tokens, emitting events, and persisting screening data. These are TypeScript interfaces only---they describe what methods must exist and what types they accept and return, but contain no implementation.

**JSON Schema utility.** A `toOpenRouterSchema` function converts any Zod schema to the format that OpenRouter (an AI model API gateway) expects for structured outputs. This lets downstream code define schemas once in Zod and generate the OpenRouter format on demand.

## What its boundaries are

This package defines data shapes. It does not:

- Implement any check logic (that belongs in the pipeline prototype).
- Render any UI (that belongs in the form and dashboard prototypes).
- Connect to any database or external service (those are implementation concerns).
- Contain any business logic for computing decisions (that belongs in the aggregator).
- Define prompts or AI model configuration (those belong in the AI orchestration layer).

If you need to add a new field to a screening result, a new event type, or a new interface---you change this package, and the type checker tells you everywhere else that needs updating.
