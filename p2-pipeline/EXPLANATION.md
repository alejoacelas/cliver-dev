# P2: Pipeline orchestrator

## What problem this solves

Cliver is a KYC (Know Your Customer) screening platform. When a customer fills out a form to purchase regulated biological materials, the platform must verify their identity and institutional affiliation against several criteria: email domain validity, institutional affiliation, institution type, and sanctions/export control lists.

The challenge is that these verification checks have different prerequisites. Some need only an email address; others need a name and institution; some require explicit customer consent before they can run. As the customer fills out the form field by field, the system needs to figure out which checks can run now, launch them without waiting for each other, pause when consent is needed, and combine all the results into a single pass/flag/review decision.

P2 is the orchestrator that coordinates all of this. It is the "brain" that watches form fields arrive, decides what to do next, and drives the pipeline from start to finish.

## How it works at a high level

The orchestrator is built from five cooperating components:

**Dependency resolver** — When a field is completed, this component examines every check's prerequisites (which fields it needs, whether it needs consent) and returns the list of checks that are now eligible to run. It prevents double-runs by tracking which checks are already in progress or finished.

**Consent manager** — Some checks (like sanctions screening) require the customer's permission before running. When a check's field prerequisites are met but it needs consent, the consent manager records a "pending" request and the pipeline pauses that check. When the customer grants or denies consent, the consent manager updates its records. It also supports expiration: if consent is neither granted nor denied within a configurable time window, the request expires.

**Check execution** — When checks become eligible, they all launch simultaneously rather than one at a time. This means if email domain validation and institution type verification both become ready at the same moment, they run in parallel. Each check is handled by an "executor" — a pluggable component that knows how to perform one specific type of verification. In this prototype, executors return canned (pre-determined) results because the goal is to test the orchestration logic, not actual API calls.

**Audit logger** — Every significant event is recorded in order: field completed, check started, consent requested, consent received, check completed, decision made. Each entry carries the screening session ID and a timestamp. This log can be queried by screening ID or event type, which is essential for regulatory compliance in a KYC system.

**Decision aggregator** — Once all checks have finished (whether they passed, failed, or were skipped due to denied consent), this component combines the outcomes into a final decision:
- **PASS** — All checks passed. The customer is cleared.
- **FLAG** — A sanctions match was found. This requires immediate action and takes priority over everything else.
- **REVIEW** — Something else was flagged, errored, or couldn't be determined. A human needs to look at it.

The overall lifecycle looks like this:

1. The pipeline starts in a "pending" state.
2. As form fields arrive, the dependency resolver identifies newly eligible checks.
3. Checks that don't need consent launch immediately in parallel.
4. Checks that need consent emit a consent request and wait.
5. When consent arrives, those checks launch. If consent is denied, the check is recorded as "undetermined" (skipped).
6. When all checks are accounted for, the decision aggregator produces a final verdict and the pipeline moves to "completed."

## What its boundaries are

This prototype tests **coordination logic only**. It does not:

- Call real AI models or web APIs. All check executors and AI providers are stubs that return predetermined results.
- Persist data to a database. Everything is held in memory.
- Send real events over a network. Events are captured in-memory arrays for test assertions.
- Handle HTTP requests or serve a web interface.

The pipeline orchestrator imports its type definitions (the "shapes" of data like check declarations, outcomes, and pipeline state) from P0, the shared contracts package. This ensures that when other prototypes (the form renderer, the check executors, the event streaming layer) are built, they will all speak the same language.

The 57 automated tests cover: dependency resolution edge cases, consent lifecycle (propose/grant/deny/expire), audit log recording and querying, decision aggregation rules, and end-to-end orchestration flows including parallel execution, error handling, late field arrivals, and the full consent-gated pipeline.
