# m14-login-gov-id-me — Bypass-aware hardening v1

- **measure:** M14 — identity-evidence-match
- **idea:** Federated IAL2 via Login.gov / ID.me / GOV.UK One Login

---

## Attacker story walk

### Group A: Identity-theft branches with active IDV-pipeline bypasses

**Stories 1–4: account-hijack (C), credential-compromise (A), dormant-account-takeover (D), dormant-domain (A)**

**Bypass methods and classification:**

- **Deepfake injection against IDV liveness flow** (stories 1, 2, 3, 4)
  - **AMBIGUOUS** — The synthesis provider does not control the IDP's liveness pipeline; it only sees the boolean outcome. Whether Login.gov or ID.me is vulnerable to deepfake injection depends entirely on those IDPs' internal defenses. The implementation doc acknowledges this: "federated IDV pushes the bypass surface to the IDP." The provider cannot independently assess or harden the IDP's liveness detection.

- **Face morphing on forged document** (stories 1, 2, 3)
  - **AMBIGUOUS** — Same as above. The IDP handles document verification; the provider sees only verified claims.

- **IDV-session handoff exploit** (story 1)
  - **AMBIGUOUS** — Depends on IDP session-management; opaque to the synthesis provider.

- **ATO inherits prior IAL2 pass** (story 2)
  - **CAUGHT (partially)** — Federated IDPs use their own MFA. If the attacker has the victim's synthesis-provider password but not their Login.gov/ID.me credential, the federated step-up blocks them. **MISSED** if the attacker also compromises the victim's Login.gov/ID.me account (ATO at the IDP layer).

- **Social-engineer support** (stories 2, 3)
  - **MISSED** — Two attack surfaces: (a) social-engineer the IDP's support to reset the victim's account — opaque to the provider, (b) social-engineer the synthesis provider's support to bypass the federated requirement — provider-side SOP issue.

- **Social-engineer ID.me trusted-referee video chat** (story 2, IAL2 path variation)
  - **AMBIGUOUS** — ID.me uses a video-chat trusted-referee fallback for users who fail automated IDV. If the attacker presents a convincing fraudulent identity during the video call, the referee may approve. The provider cannot observe or harden this path.

- **Injection against weak vendor SDK** (story 4)
  - **AMBIGUOUS** — IDP-side; opaque.

**Net assessment for stories 1-4:** The federated model shifts all IDV-pipeline bypass risk to the IDP. The synthesis provider gains the benefit of government-backed assurance infrastructure but loses the ability to independently verify, harden, or audit the IDV pipeline. The key question is whether the provider trusts the IDP's pipeline more than its own — reasonable for Login.gov (government-operated), less clear for ID.me (commercial, FTC consent action).

---

### Story 5: cro-identity-rotation (Branch B)

- **Fresh real accomplice per persona**
  - **MISSED** — Accomplice creates a real Login.gov/ID.me account with real identity. Federated assertion passes natively.

### Story 6: shell-nonprofit (Branch E)

- **Accomplice with real identity**
  - **MISSED** — Same.

### Story 7: biotech-incubator-tenant (Branch D)

- **Real ID throughout**
  - **MISSED** — Same.

### Story 8: bulk-order-noise-cover (Branch E)

- **Shared-account predecessor**
  - **CAUGHT** — Federated assertion uniquely identifies the human (by `sub` claim). If the current orderer's federated identity differs from the account holder's, the `federated_claim_mismatch` flag fires.

### Story 9: it-persona-manufacturing (Branch B)

- **Same person, multiple personas**
  - **CAUGHT (partially)** — Each persona requires its own federated login. If one person uses the same Login.gov/ID.me account for both personas, the provider can detect that the `sub` claim is shared across two account records. **MISSED** if the attacker creates two separate IDP accounts (ID.me allows this more easily than Login.gov, which binds to SSN).

### Story 10: inbox-compromise (Branch B)

- **Email-only ordering**
  - **CAUGHT** — If federated IAL2 is required for all SOC orders, email-only ordering without completing the OIDC flow is blocked.

### Stories 11-19: Real-identity branches

- **Real ID throughout**
  - **MISSED** — Federated assertion passes natively. Deterrence/audit only.

---

## Findings

### Moderate

**M1: Opaque IDP pipeline prevents provider-side bypass assessment.**
- **Source:** All identity-theft stories (1-4).
- **Why missed:** The provider sees only boolean verified/unverified. It cannot evaluate whether the IDP's liveness, document, or morph detection is adequate for the SOC-order threat model. This is a design choice (trust the IDP), not a bug, but it means the provider cannot independently satisfy itself that deepfake/morph/injection attacks are caught.
- **Suggestion:** Stage 4 could add a "due diligence on IDP bypass resistance" requirement — e.g., require the IDP to publish iBeta PAD compliance results, or accept only IDPs that are Kantara-listed at IAL2.

**M2: Login.gov structural unavailability for private-sector DNA synthesis providers.**
- **Source:** Implementation doc: "Login.gov is currently scoped to federal/state/local government use cases."
- **Why this matters:** Login.gov is the strongest IDP option (government-operated, bound to SSN) but is effectively unavailable to the target deployment. This leaves ID.me (commercial, FTC issues) as the only US option and GOV.UK One Login for UK only.
- **Suggestion:** This is already flagged in the implementation doc. No additional stage 4 tightening possible; the gap is structural.

**M3: ID.me trusted-referee social-engineering path.**
- **Source:** Story 2 (credential-compromise).
- **Why missed:** ID.me's video-chat fallback is a human-judgment gate that can be socially engineered. The provider has no visibility into whether a given user passed automated vs. trusted-referee IDV.
- **Suggestion:** Stage 4 could specify that the provider requests from ID.me an attribute indicating the verification method (automated vs. trusted-referee) and applies higher scrutiny to trusted-referee verifications.

**M4: Fronted-accomplice branches structurally unaddressed.**
- **Source:** Stories 5, 6, 7, 11-19.
- **Suggestion:** Structural; same as all other M14 ideas.

**M5: International researcher coverage gap is severe.**
- **Source:** False-positive section of implementation doc.
- **Why this matters:** Neither Login.gov nor ID.me verifies non-US researchers, who are the majority of academic biology customers. This is a coverage gap, not a bypass, but it means the check is inapplicable to most of the customer base.
- **Suggestion:** Stage 6 coverage research should quantify the fraction of DNA synthesis customers who could use this path.

### Minor

**m1: ACR downgrade handling specified but IDP compliance not guaranteed.**
- **Source:** Implementation doc specifies `federated_acr_downgrade` flag.
- **Suggestion:** Minor operational concern; the flag is present.

---

## bypass_methods_known

| Bypass method | Classification | Source stories |
|---|---|---|
| Deepfake injection at IDP | AMBIGUOUS (opaque) | 1, 2, 3, 4 |
| Face morphing at IDP | AMBIGUOUS (opaque) | 1, 2, 3 |
| IDV-session handoff at IDP | AMBIGUOUS (opaque) | 1 |
| ATO of synthesis-provider account (IDP blocks) | CAUGHT | 2 |
| ATO of IDP account itself | MISSED | 2 |
| Social-engineer IDP support | MISSED (opaque) | 2, 3 |
| Social-engineer synthesis-provider support | MISSED | 2, 3 |
| ID.me trusted-referee social engineering | AMBIGUOUS | 2 |
| Injection against IDP SDK | AMBIGUOUS (opaque) | 4 |
| Fresh real accomplice | MISSED | 5, 6, 7 |
| Shared-account predecessor mismatch | CAUGHT | 8 |
| Same-person multi-persona (same IDP sub) | CAUGHT | 9 |
| Same-person multi-persona (separate IDP accounts) | MISSED | 9 |
| Email-only ordering | CAUGHT | 10 |
| Real ID throughout | MISSED | 11-19 |

## bypass_methods_uncovered

- All IDP-layer bypasses (deepfake, morph, injection, session handoff) — opaque to the provider
- ATO at the IDP layer
- ID.me trusted-referee social engineering
- Social-engineer synthesis-provider support to bypass federated requirement
- Fresh real accomplice (structural)
- Real ID throughout (structural)

---

## Verdict: **PASS**

No Critical findings. The high number of AMBIGUOUS classifications reflects the federated model's design: the provider delegates IDV-pipeline security to the IDP. This is a conscious trade-off documented in the implementation. The structural unavailability of Login.gov for private-sector providers and the severe international coverage gap are real constraints but are coverage issues (stage 6), not bypass gaps. Pipeline continues to stage 6.
