# P7: Salesforce and email delivery integrations

## What problem this solves

When Cliver completes a background screening, two things need to happen outside the platform itself. First, the screening result needs to reach the provider's customer relationship management system (Salesforce) so their team can act on it without switching tools. Second, several types of email need to go out during the screening lifecycle: confirmation codes to verify a customer's email address, verification request emails to third parties (like an employer being asked to confirm someone's affiliation), and notification emails to inform customers when their screening is done.

P7 handles both of these. It is the piece that connects Cliver's internal screening pipeline to the outside world via Salesforce's REST API and email delivery services.

## How it works at a high level

### Salesforce integration

The Salesforce adapter authenticates using OAuth 2.0 (a standard protocol for granting limited API access without sharing passwords). It exchanges a refresh token for an access token, then uses that access token to make API calls to the provider's Salesforce instance.

When a screening completes, `pushResult` takes the decision (pass, flag, or review) and metadata (which customer, how many checks ran, how much evidence was gathered) and creates a new record in Salesforce. Before creating the record, it looks up the customer's email in Salesforce's contact database. If it finds a match, it links the screening record to that existing contact so the provider can see the screening result right on the contact's page.

If the access token expires (they typically last an hour), the adapter can refresh the session by re-authenticating with the stored refresh token.

### Email delivery

The email system has two layers. The bottom layer is a transport — the code that actually talks to an email delivery service's API. There are two transports:

- **SendGrid transport** sends a JSON request to SendGrid's v3 mail API, authenticating with an API key.
- **SES transport** sends a form-encoded request to Amazon's Simple Email Service API, authenticating with AWS access credentials.

Both transports implement the same interface (`IEmailTransport`), so the rest of the system doesn't care which one is in use.

The top layer is the email service, which composes specific types of email (confirmation codes with the right subject line and body, verification requests with confirm/deny links, plain notifications) and hands them to whichever transport is configured.

Before any email is sent, the address is validated against a basic format check. If the format is wrong, the system rejects it immediately rather than wasting an API call.

## What external services it talks to

- **Salesforce REST API** (v59.0) — for creating screening records, querying contacts, and OAuth token exchange. The OAuth endpoint is `login.salesforce.com`; data API calls go to the provider's instance URL (e.g., `myorg.salesforce.com`).
- **SendGrid v3 API** (`api.sendgrid.com/v3/mail/send`) — for sending email via SendGrid.
- **AWS SES API** (`email.<region>.amazonaws.com`) — for sending email via Amazon SES.

In the prototype, all three services are tested against local stub HTTP servers that verify the correct request format without making real API calls.

## Boundaries

P7 does **not**:

- Store credentials. It receives them as parameters and uses them for the duration of a call.
- Manage email templates beyond the three built-in types (confirmation code, verification request, notification). Adding new email types means adding new methods to the email service.
- Handle Salesforce schema setup. It assumes the `Screening__c` custom object and its fields already exist in the provider's Salesforce org.
- Implement full AWS Signature V4 signing. The SES transport uses a simplified authentication approach suitable for prototyping.
- Retry failed calls. The caller is responsible for retry logic (e.g., re-authenticating after a session expiry, then retrying the push).
- Queue emails. Each `send` call is a direct, synchronous API call. Production use would want a queue in front of this.
