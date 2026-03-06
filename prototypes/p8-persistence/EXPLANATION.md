# P8: Data persistence and API

## What problem this solves

The Cliver screening platform runs background checks on customers. Multiple parts of the system need to read and write screening data: the form collects customer input, the pipeline runs checks, the decision engine aggregates results, and the UI displays everything. Without a central data layer, each component would need its own storage, leading to inconsistent data and duplicated logic.

P8 is that central data layer. It provides two things:

1. A **storage layer** that reads and writes screening data to a PostgreSQL database (a widely-used relational database). Other parts of the system call into this layer instead of talking to the database directly.

2. A **REST API** (a set of web endpoints that accept and return JSON data over HTTP) that the user-facing interface calls. This API handles creating screening sessions, submitting form fields, recording consent decisions, and viewing audit trails.

## How it works at a high level

When a customer starts a screening, the API creates a record in the database and returns a unique identifier. As the customer fills out form fields, each submission is stored alongside the session. Background checks run and store their outcomes. Consent decisions (whether the customer allows specific checks) are tracked. Every significant action is recorded as an audit event with a timestamp, creating a complete chronological trail.

The system separates two types of users:

- **Customers** log in with email and password. They can create screening sessions, submit form data, grant or deny consent, and view their own session status.
- **Providers** (the people running the screening) log in with email, password, and a time-based one-time code (a second factor for stronger security). They can list all screening sessions and view detailed audit trails.

Authentication works through server-side sessions. When a user logs in, the system creates a session record in the database and returns the session's identifier. On subsequent requests, the client sends this identifier in an HTTP header. The server looks it up in the database to verify the user is who they claim to be. Sessions have expiration times: 30 days for customers, 24 hours for providers.

## What external services it talks to

- **PostgreSQL** (local instance on port 5432): stores all data across 10 tables covering sessions, field values, checks, decisions, consent records, audit events, form schemas, provider users, customers, and authentication sessions.

No other external services. P8 deliberately avoids password hashing, TOTP (time-based one-time password) verification, and email sending—those responsibilities belong to P4 (authentication). P8 stores data and enforces access control based on stored session records.

## What its boundaries are

P8 owns:
- The database schema (table definitions and relationships)
- CRUD operations for all entities (create, read, update, delete)
- The REST API that the UI calls
- Session-based access control (checking that a valid session exists and has the right role)

P8 does not own:
- Password hashing or verification (accepts plaintext from P4, which would hash with Argon2id)
- TOTP code verification (accepts any non-empty code; P4 validates the real code)
- Email sending for confirmation codes (stores the confirmed/unconfirmed state but doesn't send emails)
- Pipeline orchestration (stores check outcomes but doesn't run checks)
- Decision aggregation (stores decisions but doesn't compute them)
- Real-time event streaming to clients (returns existing events over SSE but doesn't maintain persistent connections; P5 handles that)

The storage layer implements the `IStorageLayer` interface defined in the P0 contracts package. This means any other prototype that depends on storage can use P8's implementation directly, or substitute an in-memory version for testing.
