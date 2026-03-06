# P4: Auth + sessions

## What problem this solves

Cliver is a screening platform where two kinds of users need to log in: **customers** (who submit screening forms) and **providers** (who review sensitive screening results and make compliance decisions). Because providers handle regulated data, they need stronger authentication than customers.

This prototype implements the login, registration, and session system for both user types. It follows a U.S. government security standard called NIST SP 800-63B-4, which specifies exactly how passwords, sessions, and multi-factor authentication must work for systems that deal with sensitive identity data.

## How it works at a high level

### Customer registration and login

A customer creates an account by providing an email address and a password. The system checks two things about the password before accepting it:

1. **Length:** At least 15 characters. The standard prohibits requiring uppercase letters, numbers, or symbols--only length matters.
2. **Breach check:** The password is checked against a database of billions of passwords that have appeared in known data breaches. This uses a privacy-preserving technique: only the first 5 characters of a one-way fingerprint of the password are sent to the breach database, so the actual password is never exposed.

After registration, the system sends a 6-digit confirmation code to the customer's email. The account cannot be used until this code is entered. The code expires after 24 hours.

Once confirmed, the customer can log in with their email and password. A successful login creates a **session**--a record on the server that proves the user is authenticated. The session lasts up to 30 days.

If someone guesses wrong passwords 100 times in a row, the account is locked. A successful login resets this counter.

### Provider login

Providers need two things to log in: their password **and** a time-based one-time code from an authenticator app (like Google Authenticator or Authy). This is called TOTP--Time-based One-Time Password. It changes every 30 seconds.

Before a provider can log in, they must first enroll in TOTP by scanning a QR code with their authenticator app. The system generates a secret key, encodes it into a QR code, and stores the key on the provider's account.

Provider sessions are shorter-lived: 24 hours maximum overall, and they expire after 1 hour of inactivity. This reflects the sensitivity of the data providers access.

### Sessions and cookies

When a user logs in, the server creates a session record and gives the browser a **session cookie**--a small piece of data the browser sends back with every request. The cookie contains only a random identifier (256 bits of randomness), not any user data. The server looks up the actual session details using this identifier.

The cookie is configured with multiple security protections:
- It cannot be read by JavaScript on the page (preventing certain attacks where malicious scripts steal login credentials).
- It is only sent over encrypted connections.
- It is only sent to the same site that created it (preventing cross-site request forgery).
- Its name starts with `__Host-`, which browsers enforce additional restrictions on.

For requests that change data (creating, updating, or deleting things), the system also requires a separate anti-forgery token in a request header. This prevents attacks where a malicious website tricks a user's browser into making unwanted requests to Cliver.

### Email verification (third-party)

Separate from account confirmation, there is a service for verifying someone's identity through a third party. For example, if a customer claims to be affiliated with a university, the system can email a contact at that university with a link to confirm or deny the claim. This is identity verification, not authentication--an important distinction under the security standard.

## What external services it talks to

- **Have I Been Pwned** (api.pwnedpasswords.com): A free, public API for checking whether a password has appeared in known data breaches. Uses k-anonymity so the full password is never transmitted.
- **SendGrid** (api.sendgrid.com): An email delivery service for sending confirmation codes and verification emails. In the current prototype, a console logger stands in for SendGrid during testing--it captures emails in memory instead of sending them. The real SendGrid transport is implemented and ready to swap in with an API key.

## What its boundaries are

This prototype handles **authentication** (proving who you are) and **session management** (remembering that you proved it). It does not handle:

- **Authorization** (what you're allowed to do once authenticated)--that's a separate concern.
- **User management** (admin operations like creating provider accounts, resetting passwords)--users and passwords are stored in memory for this prototype.
- **Persistent storage**--all data lives in memory and disappears when the process stops. The storage interfaces are designed so a real database can be plugged in later (planned for P8).
- **WebAuthn/passkeys**--the security standard recommends offering a phishing-resistant second factor. TOTP was chosen as the initial implementation; passkeys can be added later.
- **Account recovery**--if a user forgets their password, there is currently no reset flow.

The prototype is self-contained: it has its own dependencies, its own test suite (63 tests), and imports shared type definitions from the P0 contracts package to ensure consistency with the rest of the Cliver platform.
