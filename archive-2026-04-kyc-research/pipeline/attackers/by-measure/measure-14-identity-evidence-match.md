# Measure 14 — Identity evidence match (NIST 800-63 IAL1/IAL2 / GPG 45)

Measure: For SOC orders, the named orderer must present identity evidence (IAL2 or equivalent) that matches the account holder. Refusal → deny; mismatch → manual follow-up / report.

This measure has the largest engagement surface in the corpus: nearly every branch crosses an IAL1/IAL2 gate. Stories below are ordered most-directly-engaging first — those with active bypass methods aimed at the IDV pipeline, followed by those that pre-empt the measure structurally (real ID, fronted accomplice, inherited verification).

---

## 1. account-hijack — impersonate-employee, Branch C

- **Profile:** impersonate-employee
- **Target:** Hijack the real PI's synthesis-provider account and order SOC under their identity.
- **Bypass excerpts (verbatim):**
  - IAL2 Method 1: deepfake injection against the IDV vendor's liveness flow.
  - IAL2 Method 2: face morphing on a forged or altered government document so that both the attacker and the victim PI can pass the same template.
  - IAL2 Method 3: IDV-session handoff exploit — initiate the session on the victim's account and complete liveness from a different device under attacker control.
- **Why relevant:** Order-triggered IAL2 re-proofing is exactly the gate M14 imposes on SOC orders. All three methods are direct attacks on the identity-evidence-match check, with the goal of producing a passing match against the account holder's identity.
- **Persistent supply chain:** Yes — the deepfake/morph rig is reusable across victims and providers.

## 2. credential-compromise — Branch A

- **Profile:** impersonate-employee (credential theft)
- **Target:** Account takeover (ATO) of an existing customer, or new-account fraud under stolen PII.
- **Bypass excerpts (verbatim):**
  - IAL1 path: "fraudulent govt ID + selfie", "breached PII + SIM swap" (database+SMS variant).
  - IAL2 path: "ATO inherits prior pass" (no fresh proofing if the provider doesn't re-trigger), "fraudulent ID + injection attack", "face morphing", "presentation attack", "social-engineer support" to push manual override.
- **Why relevant:** Same gate as account-hijack, but emphasizes inheritance of prior IAL2 status when the provider does not re-proof at order time. M14's "match account holder" framing depends on whether the prior IAL2 record is treated as binding without re-verification.
- **Persistent supply chain:** Yes — injection rig + document forgery toolkit reusable.

## 3. dormant-account-takeover — exploit-affiliation, Branch D (IT admin)

- **Profile:** exploit-affiliation
- **Target:** IT admin reactivates a dormant institutional account whose IAL2 binding belongs to a former lab member.
- **Bypass excerpts (verbatim):**
  - "M6 IAL2 is the pivot measure: not binding under onboarding-only IAL2; fully catching under order-triggered IAL2 with biometric re-proofing."
  - Bypass A: deepfake injection of the original account holder.
  - Bypass B: face morphing on a forged ID under the original holder's name.
  - Bypass C: route to manual review fallback and social-engineer the reviewer.
  - Bypass D: abandon SOC orders entirely if order-triggered re-proofing is enforced.
- **Why relevant:** This branch *names* M14-style order-triggered identity-evidence-match as the pivot defense for the entire branch. If the gate is enforced, the attacker either spoofs the original holder (A/B), routes around (C), or gives up (D).
- **Persistent supply chain:** Yes — the dormant-account inventory and forgery rig persist across reactivations.

## 4. dormant-domain — fake-affiliation, Branch A

- **Profile:** fake-affiliation
- **Target:** Re-register a lapsed academic-looking domain and present as that institution.
- **Bypass excerpts (verbatim):**
  - IAL2 Bypass B: "injection attack against weak vendor SDK ($5–30K rig)".
  - All other M6/M14 methods use the attacker's own real face on real documents.
- **Why relevant:** The attacker's real ID will not match the dormant institution's prior account holder; injection-against-weak-SDK is the only path that defeats biometric matching. Where M14 is enforced strictly the branch falls back to ordering only what passes with the attacker's real identity.
- **Persistent supply chain:** Yes.

## 5. cro-identity-rotation — purpose-built, Branch B

- **Profile:** purpose-built-organization
- **Target:** Spin up many short-lived CRO personas across providers, each with its own accomplice identity.
- **Bypass excerpts (verbatim):**
  - "IDV-vendor-aware provider selection: picks at most one provider per IDV vendor to avoid same-vendor cross-tenant biometric matching."
  - Per-provider accomplice rotation: a fresh real human submits IAL2 for each new persona.
- **Why relevant:** M14 inside one provider passes natively (real accomplice ID matches real account holder). The bypass is structural — defeats *cross-provider* dedup, not single-provider M14. Included because the branch design is shaped entirely by what M14-style biometric binding can and cannot see.
- **Persistent supply chain:** Yes — accomplice pool + vendor-routing playbook.

## 6. shell-nonprofit — purpose-built, Branch E

- **Profile:** purpose-built-organization
- **Target:** Shell 501(c)(3) with an accomplice committed to four roles (founder, second contact, voucher, biosafety officer).
- **Bypass excerpts (verbatim):**
  - Accomplice "completes IAL2 enrollment" with their real face and real ID as second registered contact.
- **Why relevant:** M14 passes natively because the accomplice's real identity *is* the account-holder identity on file. The "bypass" is the accomplice commitment itself; the measure does not detect a real human acting as a fronted principal.
- **Persistent supply chain:** Yes — the accomplice is a long-term commitment.

## 7. biotech-incubator-tenant — purpose-built, Branch D

- **Profile:** purpose-built-organization
- **Target:** Lease an incubator slot under either the attacker's real ID (1a) or an accomplice's (1b).
- **Bypass excerpts (verbatim):**
  - Method 1a: attacker uses own real ID (passes IAL1/IAL2 native).
  - Method 1b: accomplice acts as the named principal, completes IAL1/IAL2 in their own real identity.
- **Why relevant:** Same fronted-accomplice pattern as shell-nonprofit. M14 cannot distinguish a willing accomplice from a real principal.
- **Persistent supply chain:** Yes (accomplice).

## 8. bulk-order-noise-cover — exploit-affiliation, Branch E

- **Profile:** exploit-affiliation
- **Target:** Hide SOC orders inside high-volume legitimate ordering at a shared facility.
- **Bypass excerpts (verbatim):**
  - Shared-account sub-variant: the IAL2 on file belongs to a *predecessor* facility manager who has since left; current orderer is not the account holder.
- **Why relevant:** This is the textbook M14 mismatch case — named orderer does not match the IAL2 record. Whether M14 catches it depends on whether the provider re-checks at order time vs. trusting the institutional account.
- **Persistent supply chain:** Yes — shared institutional accounts persist.

## 9. it-persona-manufacturing — exploit-affiliation, Branch B

- **Profile:** exploit-affiliation
- **Target:** Stand up multiple personas inside a real institution's email domain.
- **Bypass excerpts (verbatim):**
  - M8 same-domain two-persona self-vouching (each persona is a separate identity).
  - Real attacker completes IAL1/IAL2 in their own face for one persona; second persona requires either an accomplice or a biometric collision risk.
- **Why relevant:** M14 inside one persona passes; risk is the cross-persona biometric clustering bound. Direct relevance to "match account holder" if multiple personas resolve to the same face.
- **Persistent supply chain:** No.

## 10. inbox-compromise — fake-affiliation, Branch B

- **Profile:** fake-affiliation
- **Target:** Use a compromised institutional inbox to request orders without ever creating a new account.
- **Bypass excerpts (verbatim):**
  - Branch sidesteps IAL2 entirely by acting through email rather than account-holder portals; no fresh identity is presented.
- **Why relevant:** M14 only engages if the provider requires per-order IAL2 from a named human; inbox-compromise actively avoids that surface. If forced through IAL2, the branch dies.
- **Persistent supply chain:** No.

---

## Branches that pre-empt M14 by using real identity throughout

These branches commit the attacker's (or a real fronted human's) genuine government ID and pass IAL1/IAL2 natively. They are "relevant" only in the sense that M14 has nothing to detect — there is no mismatch.

- **shell-company** (Branch D) — real employees use real IDs.
- **foreign-institution** (Branch C) — real passport throughout.
- **gradual-legitimacy-accumulation** (Branch E) — own real ID throughout.
- **insider-recruitment** (Branch B) — insider's own real identity.
- **lab-manager-voucher** (Branch C) — real ID, real PII.
- **unrelated-dept-student** (Branch A) — real student ID.
- **visiting-researcher** (Branch D) — real ID.
- **community-bio-lab-network** — real IDs throughout.
- **cro-framing** (Branch A) — Measure 1/6 explicitly: "Bypass methods: None needed. Real face, real ID, real liveness selfie."

For all of the above, M14 imposes a deterrence/audit-trail premium but does not block the order. The named orderer *does* match the account holder; the attack is everywhere except the identity layer.

**Net assessment for M14:** Active IDV-pipeline bypasses concentrate in the identity-theft branches (account-hijack, credential-compromise, dormant-account-takeover, dormant-domain). Fronted-accomplice branches (shell-nonprofit, biotech-incubator-tenant, cro-identity-rotation, cro-framing) defeat M14 by definition because the evidence really does match the registered identity. Order-triggered re-proofing is the highest-leverage tightening for the first cluster; nothing inside M14's scope addresses the second.
