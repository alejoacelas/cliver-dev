# Cybersecurity requirements for Cliver

Requirements derived from OSTP Framework for Nucleic Acid Synthesis Screening, Section V.6 (items 5--6, footnotes 16--22). This document scopes each referenced standard to the specific OSTP obligation it serves, so requirements don't bleed across concerns.

---

## 0. How to read this document

### Cliver is a vendor, not a Provider

OSTP obligates **Providers** (entities that synthesize and distribute synthetic nucleic acids) and **Manufacturers** (entities that produce benchtop synthesis equipment). Cliver is neither---it is a SaaS screening portal that Providers use to fulfill their screening obligations.

The obligation chain is:

1. OSTP obligates the Provider to protect customer identities and examine supply chain security.
2. The Provider uses Cliver as its screening tool.
3. The Provider must ensure Cliver is adequate for the Provider's compliance needs.
4. Cliver should meet these standards because Providers will need their tools to comply, and Cliver won't be viable as a product if it doesn't.

This document describes what Cliver must implement so that **a Provider using Cliver can meet its OSTP obligations**. When we say "must-have," we mean "without this, a Provider using Cliver cannot meet its OSTP obligations"---not that OSTP directly mandates it of Cliver.

### OSTP uses "should," not "shall"

Every cybersecurity directive in OSTP Section V.6 uses "should" (recommended), not "shall" (required). The framework's practical force comes from federal funding agencies enforcing it through grant terms: if a Provider wants federally funded customers, it must adhere to the framework. But OSTP's cybersecurity measures are recommendations within that framework, not independent legal mandates.

The referenced standards (SP 800-63B, SP 800-161r1) use their own SHALL/SHOULD language internally. This document preserves that distinction. Priority assignments ("must-have," "should-have") reflect **product viability and Provider expectations**, informed by the normative weight of the source standard's language, not by OSTP mandate alone.

### Cliver's role in Provider compliance

OSTP Section III states that Providers "should also ensure the framework is followed when a third-party vendor or other intermediary is involved." Cliver is that third-party vendor. This means:

- Providers will need to verify that Cliver follows the screening framework.
- Cliver should be prepared to demonstrate framework adherence through documentation, security questionnaires, or compliance reports.
- Cliver's own compliance documentation should support a Provider's attestation obligations (OSTP item 1: Providers must "attest to implementing this screening framework").

---

## 1. OSTP obligation mapping

OSTP Section V.6 creates four distinct cybersecurity obligations. Only two apply to Cliver.

### Obligation A: Secure SOC databases (lines 448--458, fn 16--20)

> "Providers and Manufacturers that develop or maintain a SOC database with information on sequences from unregulated agents or that aggregate information that could pose biosecurity risks should implement appropriate cybersecurity safeguards..."

**Standards cited:** EO 14028 (fn 16), ISO/IEC 27032 & IEC 62443 (fn 17), NIST CSF 2.0 (fn 18--19), CISA KEV / BOD 22-01 (fn 20)

**Applies to Cliver? No.** Cliver does not develop or maintain a Sequences of Concern database. It calls SecureDNA for sequence screening. These standards bind whoever operates the SOC database (e.g., SecureDNA or IGSC member databases), not the screening portal software.

### Obligation B: Protect customer identities and proprietary information (lines 459--462, fn 21)

> "Providers and Manufacturers should also take appropriate measures to protect their customers' identities and proprietary information."

**Standard cited:** NIST SP 800-63 (fn 21) -- "digital ID management of all entities involved in synthetic nucleic acid procurement should comply with NIST SP 800-63"

**Applies to Cliver? Yes.** Cliver authenticates customers (magic link) and providers (email/password or magic link), handles customer PII (name, email, institution), and manages sessions. SP 800-63 governs exactly this.

### Obligation C: Examine supply chain security (line 462)

> "it is recommended that Providers and Manufacturers closely examine the security of their supply chains, following NIST SP 800-161"

**Standard cited:** NIST SP 800-161r1

**Applies to Cliver? Yes, in two directions.** Cliver depends on 10+ third-party services (its own supply chain). And Cliver itself is in each Provider's supply chain, so Providers will assess Cliver using SP 800-161r1 principles.

### Obligation D: Secure by Design for benchtop equipment (lines 466--470, fn 22)

> "Manufacturers should design their benchtop nucleic acid synthesis equipment with security and safety in mind."

**Standard cited:** CISA Secure by Design (fn 22)

**Applies to Cliver? No.** Directed at hardware Manufacturers, not Provider software.

### Other references

- **CIRCIA** (lines 431--433): Referenced as a reporting mechanism for cyber incidents. CIRCIA may impose independent reporting obligations on Providers depending on their sector classification under CISA's implementing regulations, but this is outside the scope of OSTP Section V.6.
- **Record retention** (item 5, lines 434--446): 3-year retention of screening records. This is a data handling obligation, not a cybersecurity standard. Covered in section 4 below.

### SP 800-63A (identity proofing): not applicable

OSTP fn 21 cites "NIST SP 800-63" broadly, which includes SP 800-63A (identity proofing). SP 800-63A defines Identity Assurance Levels (IALs) for verifying that a digital identity corresponds to a real person---even IAL1 requires collecting a government identifier and validating attributes against authoritative sources.

OSTP's customer screening (items 2--3: assessing "the legitimacy of the customer and the stated end use") is a **biosecurity risk assessment**, not identity proofing in the SP 800-63A sense. Providers complying with OSTP don't require government IDs from customers. The screening pipeline's KYC checks (ORCID verification, institutional affiliation, publication history, screening lists) serve a different purpose than SP 800-63A identity proofing, even though both involve verifying something about the customer.

Accordingly, SP 800-63A requirements are not included in this document. If this interpretation is challenged, the DIRM tailoring process (SP 800-63-4 Sec. 3.4.2) allows documenting a risk-based decision to not require formal identity proofing.

### Standards relevance summary

| Standard | OSTP obligation | Applies to Cliver? | Scope if applicable |
|----------|----------------|---------------------|---------------------|
| NIST SP 800-63B | B (customer identity) | **Yes** | Authentication, sessions, credentials |
| NIST SP 800-161r1 | C (supply chain) | **Yes** | Third-party API risk; Cliver as vendor |
| SP 800-63A | B (identity proofing) | No | See analysis above |
| EO 14028 | A (SOC databases) | No | -- |
| NIST CSF 2.0 | A (SOC databases) | No | -- |
| CISA KEV / BOD 22-01 | A (SOC databases) | No | -- |
| ISO/IEC 27032 | A (SOC databases) | No | -- |
| ISA/IEC 62443 | A (SOC databases) + D (equipment) | No | -- |
| CISA Secure by Design | D (equipment) | No | -- |
| SP 800-218 (SSDF) | Part of EO 14028 | No | -- |
| CIRCIA | Informational reference | No | -- |

---

## 2. NIST SP 800-63 requirements

Source: SP 800-63-4 (Digital Identity Guidelines) and SP 800-63B-4 (Authentication and Lifecycle Management). References are to SP 800-63B-4 sections unless otherwise noted.

### 2.1 Authentication assurance levels

Cliver has two user types with different risk profiles:

- **Customers** submit orders and fill out screening forms. They don't access screening results. Target: **AAL1**.
- **Providers** view screening outcomes, evidence, and make compliance decisions on sensitive biosecurity data. Target: **AAL2**.

**AAL1 requirements** (Sec. 2.1):
- Single-factor or multi-factor authentication.
- Verifiers SHOULD make multi-factor options available and encourage their use.
- Permitted authenticator types: password, look-up secret, out-of-band device, single-factor OTP, multi-factor OTP, single-factor cryptographic, multi-factor cryptographic.

**AAL2 requirements** (Sec. 2.2):
- Proof of possession and control of two distinct authentication factors through secure authentication protocols.
- Requires either a multi-factor authenticator OR two single-factor authenticators. When using two single-factor authenticators, the combination SHALL include one physical authenticator ("something you have") plus either a password or biometric.
- At least one authenticator SHALL be replay-resistant (Sec. 2.2.2).
- Verifiers SHALL offer at least one phishing-resistant option; SHOULD encourage its use (Sec. 2.2.2).
- All communication SHALL occur via authenticated protected channels (HTTPS/TLS).

### 2.2 Critical finding: email magic links are prohibited

**Sec. 3.1.3.1: "Email SHALL NOT be used for out-of-band authentication."**

Rationale given in the standard: email is vulnerable to access using only a password, interception in transit, and DNS rerouting attacks.

A note clarifies that confirmation codes sent to validate email addresses or issued as recovery codes are NOT authentication processes and are exempt. However, a magic link used as the **primary authentication mechanism** IS an authentication process.

**Impact on Cliver:** The current email-based magic link does not qualify as an out-of-band authenticator under SP 800-63B-4. It cannot achieve even AAL1 as an OOB authenticator.

**Options:**
1. Switch customer authentication to a compliant authenticator type (password, TOTP, SMS/voice OOB, or cryptographic authenticator).
2. Document this as a compensating control with a risk analysis under the Digital Identity Risk Management (DIRM) tailoring process (SP 800-63-4 Sec. 3.4.2), accepting and documenting the residual risk.

### 2.3 Password requirements (providers)

**Subscriber-facing (Sec. 3.1.1.1):**
- Passwords SHALL be chosen by subscriber or assigned randomly.
- If disallowed by blocklist, subscriber SHALL choose a different one.
- Other composition requirements (e.g., "must contain uppercase") SHALL NOT be imposed.

**Verifier requirements (Sec. 3.1.1.2):**
- Minimum length: 15 characters for single-factor passwords; 8 characters for passwords used only as part of MFA.
- SHOULD permit max length of at least 64 characters.
- SHOULD accept all printing ASCII characters, space, and Unicode (each code point = one character).
- SHALL NOT require periodic password changes. SHALL force a change if evidence of compromise.
- SHALL NOT permit password hints or knowledge-based authentication (security questions).
- SHALL verify the entire submitted password (no truncation).
- SHALL compare prospective passwords against a blocklist (breach corpuses, dictionary words, context-specific words like service name/username).
- SHALL offer guidance to help subscriber choose a strong password.
- SHALL allow password managers and autofill. SHOULD permit paste in password fields.
- SHOULD offer option to display password during entry.
- SHALL use approved encryption and authenticated protected channel when requesting passwords.

**Note on the 8-character minimum:** The 8-character minimum applies only when the password is never used without a second factor. If any authentication flow uses the password alone (e.g., reauthentication after inactivity timeout), the 15-character minimum applies. See section 2.7 for how session-bound reauthentication interacts with this.

### 2.4 Credential storage

**Sec. 3.1.1.2:**
- Passwords SHALL be salted and hashed using an approved password hashing scheme.
- Salt SHALL be at least 32 bits; chosen to minimize collisions.
- Cost factor SHOULD be as high as practical; SHOULD increase over time.
- Both salt and hash SHALL be stored; a reference to the hashing scheme and cost factor SHOULD be stored for migration.
- Verifiers SHOULD additionally perform a keyed hash or encryption using a secret key known only to the verifier (a "pepper"). If implemented: key SHALL be generated by approved random bit generator, stored separately from hashed passwords, SHOULD be stored in hardware-protected area (HSM/TEE/TPM).

**Note:** The keyed hash (pepper) is a SHOULD, not a SHALL. The hardware-protected storage recommendation applies only if a pepper is implemented. If Cliver implements a pepper but stores it as an environment variable rather than in an HSM, this is a known deviation from the SHOULD-level recommendation that should be documented.

### 2.5 Out-of-band authenticator requirements (if used for non-email channels)

**Sec. 3.1.3 / 3.1.3.2:**
- OOB authenticator is "something you have"---a physical device over an independent secondary channel.
- Authentication SHALL be considered invalid unless completed within 10 minutes.
- Authentication secrets SHALL be accepted only once (replay resistance).
- Secret SHALL be at least six decimal digits (or equivalent entropy) using an approved random bit generator.
- If secret is less than 64 bits, verifier SHALL implement rate limiting.

### 2.6 Session management

**Sec. 5.1 -- Session bindings:**
- Session secrets SHALL be: generated using approved random bit generator (at least 64 bits), established during/after authentication, erased on logout, transferred via authenticated protected channel, subject to AAL-specific timeouts, unavailable to intermediaries.
- Session secrets used as bearer tokens SHOULD NOT be persistent across restart/reboot.
- Sessions SHALL NOT fall back to insecure transport (HTTPS to HTTP).
- POST/PUT content SHALL contain a session identifier verified by the RP (CSRF protection).
- Sessions SHOULD provide a readily accessible logout mechanism.
- Session secrets SHOULD NOT be placed in insecure locations (e.g., HTML5 Local Storage) due to XSS risk.

**Sec. 5.1.1 -- Cookies:**
- SHALL be tagged accessible only on HTTPS sessions (Secure flag).
- SHALL be scoped to minimum practical hostnames and paths.
- SHOULD be HttpOnly.
- SHOULD expire at or soon after session validity period.
- SHOULD have `__Host-` prefix and `Path=/`.
- SHOULD set `SameSite=Lax` or `SameSite=Strict`.
- SHALL NOT contain cleartext personal information.

**Sec. 5.1.2 -- Access tokens:**
- RP SHALL NOT interpret presence of an access token as indicator of subscriber presence absent other signals.

### 2.7 Reauthentication

**AAL1 (customers) -- Sec. 2.1.3:**
- Overall session timeout SHALL be established; SHOULD be no more than 30 days.
- Inactivity timeout MAY be applied but is not required.

**AAL2 (providers) -- Sec. 2.2.3:**
- Overall timeout SHALL be established; SHOULD be no more than 24 hours.
- Inactivity timeout SHOULD be no more than 1 hour.
- When inactivity timeout occurs but overall timeout has not, verifier MAY allow reauthentication using only a password or biometric **plus the session secret**. The session secret serves as the second factor in this flow, which is why it remains multi-factor authentication. This means the 8-character password minimum is preserved during inactivity reauthentication, since the password is not being used as a single factor.

### 2.8 Rate limiting

**Sec. 3.2.2:**
- Verifier SHALL limit consecutive failed authentication attempts on a single account to no more than 100.
- After exceeding, authenticator SHALL be disabled and require rebinding per Sec. 4.1.
- Additional techniques MAY include: bot detection challenges, progressive delays (30s up to 1 hour), risk-based signals (IP, geolocation, timing, browser metadata).
- On successful authentication, retry count SHOULD be reset.

### 2.9 Account recovery

**Without identity proofing (customers) -- Sec. 4.2.2.1:**
- SHALL require a saved recovery code, issued recovery code, or recovery contact.
- (This requirement is keyed to the absence of identity proofing, not to AAL1 per se. Since Cliver does not perform SP 800-63A identity proofing for customers, this section applies.)

**AAL2 (providers) -- Sec. 4.2.2.2:**
- SHALL require either: (a) two recovery codes from different methods, (b) one recovery code plus authentication with a single-factor authenticator bound to the account, or (c) repeated identity proofing.

**Issued recovery codes (Sec. 4.2.1.2):**
- At least six decimal digits from approved random bit generator.
- Valid for at most 24 hours when sent to email, 10 minutes when sent via text/voice.
- Subject to throttling per Sec. 3.2.2.

**Saved recovery codes:**
- SHALL include at least 64 bits of entropy from an approved random bit generator.

**Notifications (Sec. 4.2.3 / 4.6):**
- Account recovery SHALL always cause a notification to the subscriber.
- CSPs SHALL support at least two notification addresses per account.
- Notifications SHALL provide clear instructions including contact information for repudiation.

### 2.10 Privacy

**Sec. 2.4.3:**
- Verifier SHALL employ appropriately tailored privacy controls.
- If processing attributes beyond identity services, fraud mitigation, or legal compliance: SHALL implement clear notice and consent measures. Consent SHALL NOT be a condition of identity service.

**Sec. 2.4.2:**
- SHALL comply with records retention policies.
- If retaining records without mandatory requirement, SHALL conduct risk assessment and inform subscriber.

**Sec. 5.3:**
- Collection/processing of session characteristics (IP, geolocation, behavioral data) SHALL be included in privacy risk assessment.

**SP 800-63-4 Sec. 3.4.1:**
- Organizations SHALL assess unintended privacy consequences of selected assurance levels.

### 2.11 Redress

**Sec. 2.4.4 / SP 800-63-4 Sec. 5.6:**
- Verifier **SHALL** provide mechanisms for redress of subscriber complaints---easy to find, trackable, documented.
- **SHALL** have human support personnel available.
- CSP **SHALL** assess mechanisms for efficacy.

---

## 3. NIST SP 800-161r1 requirements

Source: NIST SP 800-161 Rev. 1, Cybersecurity Supply Chain Risk Management Practices for Systems and Organizations.

**Note on scope:** SP 800-161r1 is a comprehensive federal C-SCRM framework with hundreds of controls across three organizational levels. OSTP says to "closely examine the security of their supply chains, following NIST SP 800-161"---it does not say to implement all controls. The controls below are **selected** based on Cliver's risk profile and architecture, not the full SP 800-161 control set.

### 3.1 Supplier inventory

**SR-13:**
- Maintain an inventory of tier-one suppliers documenting: unique identifier, description of products/services, systems using them, and assigned criticality level.
- Review and update at enterprise-defined frequency.

Cliver's tier-one suppliers:

| Supplier | Service | Data exchanged | Criticality |
|----------|---------|---------------|-------------|
| OpenRouter | LLM inference | Prompts with partial customer data | High |
| Tavily | Web search | Search queries | Medium |
| ORCID | Researcher identity | Researcher names/IDs | Medium |
| Europe PMC | Publication data | Author names, PMIDs | Low |
| US Screening List | Export control check | Entity names | High |
| SecureDNA | Sequence screening | Nucleic acid sequences | Critical |
| SendGrid/SES | Email delivery | Recipient emails, templated content | Medium |
| Salesforce | CRM | Screening results, customer data | High |
| Neon | Managed PostgreSQL | All persistent data | Critical |
| Fly.io | Hosting | All application traffic | Critical |

### 3.2 Risk assessment

**RA-3(1) / Sec. 2.2:**
- Conduct supply chain risk assessments analyzing criticality, threats, vulnerabilities, likelihood, and impact for each supplier.
- Results feed into an enterprise risk register.

**RA-9:**
- Perform criticality analysis to determine which services are mission-critical vs. degradable.

**SR-6:**
- Assess each supplier against consistent baseline factors: security posture, integrity, resilience, quality, trustworthiness, authenticity.
- Reassess periodically.

**Table 2 (Sec. 3.2) -- Evaluation factors per supplier:**
- Features and functionality
- Access to data and system privileges
- Security/authenticity/integrity of product/service
- Ability to deliver as expected
- Foreign control or influence
- Market alternatives
- Supply chain relationships and locations
- Risk factors: geopolitical, legal, financial stability, cyber incidents

**Sec. 3.4.2 -- Confidence-building mechanisms:**
- Use third-party assessments and formal certifications (ISO 27001, SOC 2) to evaluate critical suppliers. Most relevant for: Neon, Fly.io, Salesforce, SendGrid/SES, OpenRouter.

### 3.3 Data minimization

**AC-4 / CM-8:**
- Ensure only required information---and no more---is communicated to each supplier.

**AC-6(6):**
- Use least privilege to define what information is accessible to each service, for what duration, at what frequency, using what access methods.

**PT-1:**
- Contracts with providers must state what PII will be shared, which personnel may access it, controls protecting it, retention period, and what happens at contract end.

**PM-25:**
- Ensure PII is minimized in data sent to suppliers during testing and development, not just production.

Cliver-specific data minimization targets:
- **OpenRouter:** Strip customer email/full name from prompts unless needed for the specific check.
- **Tavily:** Queries should not include raw customer PII.
- **US Screening List:** Only send entity name being screened.
- **SecureDNA:** Only send sequence data (protocol already minimizes exposure).
- **SendGrid/SES:** Only recipient email and templated content; no screening results in emails.
- **Salesforce:** Only defined screening result fields; not raw form data.

### 3.4 Continuity and fallback planning

**CP-1 / CP-2:**
- Integrate supply chain risk into contingency planning covering: unplanned service failure, planned replacement/upgrades, and service disruption.
- Define failover and timely recovery for critical components.

**CP-2(7):**
- Ensure external service providers have appropriate failover. Define contingency requirements in SLAs.

**CP-2(8):**
- Identify which services are critical vs. degradable.

**PL-8(2) / SR-3(1):**
- Diversify supply base for critical services. Identify single points of failure.
- Contracts should allow replacement with similar services.

**SA-4(2.b):**
- Establish a plan for alternative sources of supply during continuity events.

**SC-5(2):**
- Include requirements for excess capacity, bandwidth, and redundancy in agreements with critical suppliers.

### 3.5 Incident response for supply chain compromises

**IR-1:**
- Policy must address supply chain-related incidents. Establish bidirectional communication with all supply chain partners through agreements.

**IR-4(10):**
- After processing an incident, coordinate with suppliers for root cause analysis and corrective actions.

**IR-5:**
- Agreements must include requirements to track and document incidents.

**IR-6(3):**
- Protect communications of incident information between Cliver and suppliers.

**IR-8:**
- Develop an incident response plan that includes information-sharing responsibilities with critical suppliers.

**Sec. 3.4.1:**
- Implement incident management capable of identifying root causes including those originating from the supply chain.

### 3.6 Breach notification to Providers

If Cliver is breached, Providers need to know promptly so they can fulfill their own OSTP reporting obligations (OSTP Section V.6 paragraph 3: contact FBI Field Office) and any independent CIRCIA obligations. Cliver must:

- Notify affected Providers promptly upon discovering a breach that may have exposed their data.
- Provide sufficient detail for the Provider to assess impact and meet its own reporting obligations.
- Document the notification process in agreements with Providers.

### 3.7 Contractual requirements

**Sec. 3.1.2:**
- Contracts must include: (a) security requirements as a qualifying condition, (b) flow-down requirements to subcontractors, (c) periodic revalidation of adherence, (d) protocols for reporting vulnerabilities/incidents/disruptions, (e) terms for responding to supply chain risks.
- Contracts should include termination provisions for unacceptable changes in supply chain risk.

**SA-9(3):**
- For each service: define data integrity/confidentiality/availability requirements, consequences of non-compliance, role delineation, and negotiated termination agreements including data removal.

**SA-9(5) / PE-23:**
- Assess risks associated with geographic location of provider's processing/storage. Define acceptable locations. Relevant for Neon (database regions), Fly.io (deployment regions).

**SR-8:**
- Require suppliers to notify Cliver of security incidents, vulnerabilities, ownership changes, and other material events.

**SC-8:**
- Transmission confidentiality and integrity requirements must be in agreements. All API communications should use appropriate encryption.

---

## 4. OSTP record retention

OSTP Section V, item 5 (lines 434--446) requires Providers to retain for at least three years:

- Screening records, including flagged orders
- Customer screening interactions, including when orders were deemed acceptable
- Documentation of further action taken in response to flagged orders
- Rationale for decisions about the legitimacy of customers whose orders were flagged

Records must be sufficient to reconstruct the screening decision if audited. This is a direct OSTP obligation on Providers, and Cliver must support it as the system of record.

**Data architecture implications:**
- The database tables storing orders, screenings, checks, evidence, and consent must retain records for at least 3 years from screening completion.
- Deletion or archival policies must not purge records before the 3-year mark.
- Retained data includes PII (customer name, email, institution)---this intersects with SP 800-63B's privacy requirements (Sec. 2.4.2): inform subscribers of the retention policy and its basis (OSTP compliance).

**Audit trail implications:**
- OSTP requires retaining the "rationale for decisions" and "documentation of further action"---this means the screening record must capture not just outcomes but the reasoning and actions that led to them. The specifics of what constitutes a complete audit trail for screening decisions will be defined in the application design, not in this document.

---

## 5. Multi-tenancy and Provider data isolation

Cliver is a SaaS platform serving multiple Providers. Each Provider's screening data---customer identities, screening results, evidence, and disposition decisions---is sensitive and Provider-specific. This is directly relevant to Obligation B (protecting customer identities) and to SP 800-161r1 (Cliver is in each Provider's supply chain).

**Requirements:**
- One Provider SHALL NOT be able to access another Provider's screening data, customer records, or configuration.
- Administrative access to cross-Provider data must be controlled, logged, and justified.
- If a Provider leaves Cliver, their data must be handled according to the contractual terms (export, deletion, or continued retention per OSTP's 3-year requirement).

**Architectural options** (to be decided during implementation):
- **Row-level tenancy:** Single database with a `provider_id` column on all tenant-scoped tables, enforced at the query layer (e.g., Drizzle middleware or PostgreSQL Row-Level Security policies).
- **Schema-level tenancy:** Separate PostgreSQL schemas per Provider, with connection routing.
- **Database-level tenancy:** Separate Neon databases per Provider. Strongest isolation but highest operational overhead.

Providers evaluating Cliver will ask about tenant isolation. The chosen approach and its guarantees should be documented.

---

## 6. General good practices (voluntary)

The following standards are referenced by OSTP but scoped to SOC databases or equipment manufacturers, not to Provider screening software. Nonetheless, some practices are worth adopting voluntarily. These are **not OSTP-required for Cliver**.

**From NIST CSF 2.0:** Asset inventory (ID.AM), logging and monitoring (DE.CM), and incident response planning (RS.MA) are good operational hygiene for any web application. Cliver should maintain an inventory of data stores and external services, log authentication and screening events, and have a basic incident response procedure.

**From CISA Secure by Design:** MFA support, elimination of default credentials, vulnerability class reduction (SQLi, XSS, SSRF), automated dependency scanning, and a vulnerability disclosure policy are standard secure development practices. Cliver should adopt these as part of normal engineering quality, not because OSTP requires them.

**From EO 14028 / SSDF:** SBOM generation and secure development practices (code review, dependency scanning, build integrity) are valuable for any software project.

These practices appear in the implementation plan where they overlap with SP 800-63 or SP 800-161 requirements, or where they're clearly necessary for basic security. They are not given separate requirement IDs.

---

## Requirement index

| ID | Standard | Summary | Priority | Normative basis |
|----|----------|---------|----------|-----------------|
| REQ-63-1 | SP 800-63B Sec. 2.1--2.2 | Select AAL1 for customers, AAL2 for providers | Must-have | SHALL (standard) |
| REQ-63-2 | SP 800-63B Sec. 3.1.3.1 | Resolve email magic link prohibition | Must-have | SHALL NOT (standard) |
| REQ-63-3 | SP 800-63B Sec. 3.1.1.2 | Password verifier requirements (length, blocklist, no composition rules) | Must-have | SHALL (standard) |
| REQ-63-4 | SP 800-63B Sec. 3.1.1.2 | Credential storage (salted hash, cost factor; pepper is SHOULD) | Must-have | SHALL for hash/salt; SHOULD for pepper |
| REQ-63-5 | SP 800-63B Sec. 2.2.1--2.2.2 | Provider MFA (two factors, replay-resistant, phishing-resistant option) | Must-have | SHALL (standard) |
| REQ-63-6 | SP 800-63B Sec. 5.1 | Session management (random tokens, secure cookies, CSRF, logout) | Must-have | SHALL (standard) |
| REQ-63-7 | SP 800-63B Sec. 2.1.3, 2.2.3 | Session timeouts (30d/AAL1, 24h+1h idle/AAL2) | Must-have | SHALL for timeout; SHOULD for durations |
| REQ-63-8 | SP 800-63B Sec. 3.2.2 | Rate limiting (max 100 failures, progressive delays) | Must-have | SHALL (standard) |
| REQ-63-9 | SP 800-63B Sec. 4.2 | Account recovery (customers: one code; providers: two codes or code+authenticator) | Must-have | SHALL (standard) |
| REQ-63-10 | SP 800-63B Sec. 4.6 | Account notifications (two addresses, instructions for repudiation) | Must-have | SHALL (standard) |
| REQ-63-11 | SP 800-63B Sec. 2.4.2--2.4.3 | Privacy controls and retention transparency | Must-have | SHALL (standard) |
| REQ-63-12 | SP 800-63B Sec. 2.4.4 | Redress mechanism for subscriber complaints | Should-have | SHALL (standard) |
| REQ-161-1 | SP 800-161 SR-13 | Supplier inventory with criticality levels | Must-have | Guidance (selected control) |
| REQ-161-2 | SP 800-161 RA-3(1), SR-6 | Risk assessment for each supplier | Should-have | Guidance (selected control) |
| REQ-161-3 | SP 800-161 AC-4, PT-1 | Data minimization in API calls | Must-have | Guidance (selected control) |
| REQ-161-4 | SP 800-161 CP-1, CP-2, PL-8(2) | Continuity/fallback planning | Should-have | Guidance (selected control) |
| REQ-161-5 | SP 800-161 IR-1, IR-4(10), IR-8 | Incident response for supply chain compromises | Should-have | Guidance (selected control) |
| REQ-161-6 | SP 800-161 Sec. 3.1.2, SA-9(3), SR-8 | Contractual security requirements with suppliers | Should-have | Guidance (selected control) |
| REQ-161-7 | SP 800-161 (implied) | Breach notification to Providers | Must-have | Product necessity |
| REQ-MT-1 | Obligation B + SP 800-161 | Multi-tenancy and Provider data isolation | Must-have | Product necessity |
| REQ-RET-1 | OSTP item 5 | 3-year screening record retention | Must-have | OSTP (should) |
| REQ-RET-2 | OSTP item 5 | Audit trail for screening decisions and rationale | Must-have | OSTP (should) |
