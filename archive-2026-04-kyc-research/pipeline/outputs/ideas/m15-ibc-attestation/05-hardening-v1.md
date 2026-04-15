# m15-ibc-attestation — Bypass-aware hardening v1

- **idea:** IBC / sponsor-PI attestation upload
- **measure:** M15 — soc-self-declaration
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walkthrough

### 1. lab-manager-voucher — exploit-affiliation, Branch C

**Summary:** Real lab manager with real institutional email orders SOC using vague end-use language.

**Bypass methods relevant to M15:**

1. **Vague end-use self-declaration ("molecular biology research," "positive control for assay development").**
   - **CAUGHT** (partially). The IBC attestation requirement forces the customer to produce an IBC approval that covers the specific SOC. The `ibc_scope_mismatch` flag fires if the approved scope doesn't include the order's organism/sequence class. However, if the lab manager's institution has a broad IBC protocol covering the relevant organisms, the attestation is real and the scope matches — the vagueness of the *declaration* is bypassed because the IBC document itself provides the specificity.
   - **AMBIGUOUS.** If the IBC protocol is genuinely broad (covers a wide range of BSL-2 agents for "assay development"), the scope-match heuristic may pass even though the specific order is concerning. The implementation's scope-match check is described as "fuzzy."

**Net assessment:** Improved over raw self-declaration — the customer must produce a real IBC document rather than just free text. But real lab managers at real institutions often *have* real, broad IBC protocols.

---

### 2. unrelated-dept-student — exploit-affiliation, Branch A

**Summary:** Student in unrelated department orders SOC under generic research framing.

**Bypass methods relevant to M15:**

1. **Generic end-use description ("research purposes").**
   - **CAUGHT.** A student from an unrelated department is unlikely to have an IBC-approved protocol covering the SOC. Uploading nothing triggers `ibc_doc_missing` (order blocked). Uploading a fabricated document risks `ibc_doc_unverified` (chair/BSO names won't match roster) or `ibc_doc_reused` (if they borrow someone else's letter). The student must either forge a document using public IBC-RMS names (detected at the contact-the-chair step) or obtain a real IBC letter from another PI (which shifts the attack to social engineering within the institution).

**Net assessment:** Strong. The IBC requirement is a hard gate for students without institutional biosafety access.

---

### 3. cro-framing — purpose-built, Branch A

**Summary:** Real LLC styled as a CRO with self-authored biosafety plan.

**Bypass methods relevant to M15:**

1. **Self-authored biosafety plan referencing standard frameworks.**
   - **MISSED.** Many private-sector CROs and biotech companies are not required to have NIH-registered IBCs (the NIH Guidelines apply to institutions receiving NIH funding for recombinant/synthetic nucleic acid research). A private CRO doing contract work may legitimately have no IBC registration. The implementation flags `institution_no_active_ibc` but acknowledges this as a failure mode for legitimate customers. If the provider treats CROs without IBCs as requiring "alternative evidence," the attacker submits the self-authored biosafety plan as that alternative.

2. **Predatory-journal publication seeding.**
   - **MISSED.** Irrelevant to IBC attestation — publications are not checked here.

**Net assessment:** Structural gap for private-sector entities not subject to NIH IBC requirements. The attacker routes around the IBC gate entirely.

---

### 4. cro-identity-rotation — purpose-built, Branch B

**Summary:** Rotating CRO personas with per-persona service areas.

**Bypass methods relevant to M15:**

1. **Each persona's service area matches SOC orders.**
   - **MISSED.** Same as cro-framing: each CRO persona is a private entity unlikely to have an NIH-registered IBC. The hash-based cross-document reuse detection (`ibc_doc_reused`) could catch reuse of the same biosafety plan across personas, but if each persona generates a distinct document, no cross-persona signal fires.

**Net assessment:** Structural gap (private sector + rotation).

---

### 5. gradual-legitimacy-accumulation — purpose-built, Branch E

**Summary:** Attacker builds legitimate research history, places SOC orders late in lifecycle.

**Bypass methods relevant to M15:**

1. **Real publications, grants, and conference presence retroactively justifying SOC.**
   - **AMBIGUOUS.** If the attacker is affiliated with a real institution and obtains or operates under a real IBC protocol, the attestation is genuine. The IBC approval scope may legitimately cover the SOC work if the attacker's research area was designed to include it. The scope-match check would pass.
   - If the attacker is at an institution without IBC coverage for the specific SOC, they would need to either expand the protocol (possible if they have PI standing) or forge/borrow a document.

**Net assessment:** Depends on institutional affiliation. At a well-resourced institution, the attacker likely has or can obtain real IBC coverage.

---

### 6. account-hijack — impersonate-employee, Branch C

**Summary:** SOC orders through hijacked PI account matching PI's research scope.

**Bypass methods relevant to M15:**

1. **Order content matches the real PI's scope; IBC approval on file.**
   - **CAUGHT** (partially). If the provider requires a *new* IBC upload per order (not a cached one), the attacker must produce the PI's IBC letter. If they can access the PI's files (same account compromise that gave them portal access), they may have the letter. If the provider caches prior IBC uploads, the attacker inherits the PI's prior approval.
   - **AMBIGUOUS** on whether the implementation requires per-order upload or caches prior documents.

**Net assessment:** Depends on re-upload policy and whether the hijacker has access to the PI's IBC documents.

---

### 7. visiting-researcher — fake-affiliation, Branch D

**Summary:** Visiting researcher referencing sponsor's research program.

**Bypass methods relevant to M15:**

1. **Orders framed as sponsored collaboration.**
   - **CAUGHT.** The visitor must produce the *sponsor institution's* IBC approval naming them or their project. If the sponsorship is fabricated, the IBC document won't name the visitor or the specific work. The contact-the-chair step (via IBC-RMS roster) would reveal the visitor is unknown to the IBC.

**Net assessment:** Strong gate — fabricated sponsorship is exposed by the IBC chair contact step.

---

### 8. inbox-compromise — fake-affiliation, Branch B

**Summary:** Orders through compromised inbox claiming exemption.

**Bypass methods relevant to M15:**

1. **Claim exemption / no IBC required.**
   - **CAUGHT.** The implementation blocks orders without an IBC upload (`ibc_doc_missing`). An exemption claim must be backed by evidence; the implementation notes that "customers operating under exemption (some r/sNA work is exempt from IBC review under NIH Guidelines Section III-F) — they have no document to upload" as a false-positive concern, but for SOC orders specifically, exemption from IBC review is extremely unlikely to be legitimate. The reviewer would challenge the exemption claim.

**Net assessment:** Strong improvement over raw M15 — forces a document rather than accepting a bare exemption claim.

---

### 9. shell-company — Branch D

**Summary:** Real LLC ordering under benign business cover story, claiming exemption.

**Bypass methods relevant to M15:**

1. **Claim exemption from SOC categories.**
   - **MISSED.** Same as cro-framing: a private LLC may legitimately have no NIH IBC. The provider must define what "alternative evidence" substitutes for an IBC letter for non-NIH-funded entities. If the alternative is a self-authored biosafety plan, the shell company can produce one.

**Net assessment:** Structural gap for private-sector entities.

---

### 10. insider-recruitment — impersonate-employee, Branch B

**Summary:** Recruited insider self-attests SOC orders covered by existing IBC protocol.

**Bypass methods relevant to M15:**

1. **Self-attest covered by existing IBC protocol.**
   - **MISSED.** The insider has access to the institution's real IBC approval letter. They upload a genuine document with matching chair/BSO names and matching scope. The IBC-RMS cross-check passes. Scope-match passes because the protocol genuinely covers the organisms. The insider *is* working under a real protocol — the fact that their intent is malicious is invisible to the document.

**Net assessment:** Complete bypass. The attestation is genuine.

---

### 11. it-persona-manufacturing — exploit-affiliation, Branch B

**Summary:** Multiple personas inside real institution with lift-and-modify IBC letter.

**Bypass methods relevant to M15:**

1. **Lift-and-modify a real IBC letter from elsewhere in the institution.**
   - **CAUGHT** (partially). `ibc_doc_reused` fires if the hash matches another customer's upload. But "lift-and-modify" means the attacker changes the PI name or protocol ID, producing a different hash. The chair/BSO names still match the IBC-RMS roster (same institution). Scope may match. The only catch is if the modified protocol ID doesn't exist in the IBC's records — but the provider cannot query IBC protocol IDs (not in the RMS roster).
   - **AMBIGUOUS.** The modified letter passes all automated checks. Only the contact-the-chair step would catch it — if the reviewer contacts the IBC chair and asks "does protocol X cover PI Y?"

**Net assessment:** Weak. Automated checks pass; only the manual chair-contact step might catch a modified letter, and that step is resource-intensive and may not be triggered for every order.

---

### 12. bulk-order-noise-cover — exploit-affiliation, Branch E

**Summary:** SOC orders hidden in bulk facility ordering.

**Bypass methods relevant to M15:**

1. **SOC orders under shared boilerplate declaration.**
   - **CAUGHT** (partially). The facility account must produce an IBC letter. If the facility has a genuine broad IBC protocol, it covers the SOC orders. The `ibc_scope_mismatch` flag might fire if the SOC falls outside the protocol's approved organisms, but a broad facility protocol may cover it.

**Net assessment:** Depends on the breadth of the facility's IBC protocol.

---

### 13. biotech-incubator-tenant — purpose-built, Branch D

**Summary:** Incubator tenant with self-consistent research scope.

**Bypass methods relevant to M15:**

1. **Stated research scope identical to incubator and provider.**
   - **MISSED.** Similar to cro-framing: an incubator tenant startup may not have an NIH-registered IBC. If they use an externally-administered IBC (WCG, Advarra), the institution name mismatch triggers `ibc_doc_unverified` (false positive for legitimate customers). If they have no IBC at all, they fall into the "alternative evidence" path.

**Net assessment:** Mixed — external IBCs create FPs for legitimate tenants; no-IBC tenants route around.

---

### 14. dormant-account-takeover — exploit-affiliation, Branch D

**Summary:** Reactivated dormant account inherits original lab's declared scope.

**Bypass methods relevant to M15:**

1. **SOC orders matching previously-recorded lab research area.**
   - **CAUGHT.** The dormant account's prior IBC letter may be expired (`ibc_doc_expired` flag) or the named PI may have left. If the provider requires a current IBC upload, the new user must produce a fresh document. The original PI's name won't match the new orderer (if the provider checks named-PI-on-document vs. account holder).
   - **AMBIGUOUS** on whether the implementation checks PI name on the IBC document against the current account holder.

**Net assessment:** Good potential — expired documents and PI-name mismatches are detectable, but only if the implementation cross-checks PI name.

---

## Findings

### Critical

None.

### Moderate

**M1 — Private-sector entities without NIH IBC registration bypass the gate entirely.**

- **Stories affected:** cro-framing, cro-identity-rotation, shell-company, biotech-incubator-tenant (4 stories).
- **Why missed:** The NIH IBC-RMS roster only covers US institutions receiving NIH funding for recombinant/synthetic nucleic acid research. Private-sector entities (CROs, biotechs, LLCs) often have no IBC or use externally-administered IBCs not discoverable in the roster. The implementation flags `institution_no_active_ibc` but must offer an "alternative evidence" path for these customers, which the attacker can satisfy with a self-authored biosafety plan.
- **Suggestion for re-research:** Stage 4 should define the alternative-evidence path explicitly: what constitutes acceptable evidence for non-NIH-funded entities? Options include requiring the customer to name their externally-administered IBC (and verifying with the external IBC provider), or requiring a state/local biosafety permit where applicable.

**M2 — Foreign institutions have no equivalent registry.**

- **Stories affected:** foreign-institution (from real-ID branches), visiting-researcher (partial).
- **Why missed:** The implementation acknowledges this: "International customers have no equivalent registry." No automated cross-check is possible for foreign IBC documents.
- **Note:** Structural to the US-centric registry approach. May require a different evidence standard for foreign customers.

**M3 — Insider with access to real IBC documents produces a genuine attestation.**

- **Stories affected:** insider-recruitment, lab-manager-voucher (when the lab has a real broad protocol).
- **Why missed:** The attestation is genuine — the IBC really did approve the protocol, and the insider is named on or covered by it. The malicious intent is invisible to document verification.
- **Note:** Structural to document-based verification. Not addressable within this idea.

**M4 — Lift-and-modify attack passes automated checks.**

- **Stories affected:** it-persona-manufacturing.
- **Why missed:** Modifying the PI name or protocol ID on a real IBC letter produces a new hash and retains valid chair/BSO names. Only the contact-the-chair manual step catches this, and it may not be triggered for every order.
- **Suggestion:** Stage 4 should consider requiring the IBC registration number + protocol ID as structured fields (not just OCR-extracted) and attempting to verify them against the IBC chair via automated email, not just manual escalation.

### Minor

**N1 — Per-order vs. cached IBC upload policy unspecified.**

- **Stories affected:** account-hijack, dormant-account-takeover.
- **Why ambiguous:** The implementation does not specify whether a previously-uploaded IBC letter is accepted for subsequent orders or whether a fresh upload is required each time. Cached documents favor ATO attackers.
- **Suggestion:** Specify a maximum IBC document age (e.g., re-upload annually or per new SOC type).

**N2 — PI-name-on-document vs. account-holder cross-check not specified.**

- **Stories affected:** dormant-account-takeover, account-hijack.
- **Why ambiguous:** The IBC letter names PI(s). The implementation does not explicitly check whether the order's account holder appears as a named PI on the uploaded document.
- **Suggestion:** Add an automated check: account-holder name must appear as named PI or authorized user on the IBC document.

**N3 — Scope-match described as "fuzzy" without definition.**

- **Stories affected:** lab-manager-voucher, bulk-order-noise-cover.
- **Why ambiguous:** The implementation says scope-match is "fuzzy" but does not define the matching logic. Broad protocols (listing "recombinant DNA" generically) would match almost any SOC.
- **Suggestion:** Define scope-match granularity (e.g., organism-family level, BSL level, specific agent list).

---

## bypass_methods_known

| # | Bypass method | Classification | Stories |
|---|---|---|---|
| 1 | No NIH IBC — private sector routes to alternative evidence | MISSED | cro-framing, cro-identity-rotation, shell-company, biotech-incubator-tenant |
| 2 | Real insider uploads genuine IBC letter | MISSED | insider-recruitment |
| 3 | Broad real IBC protocol covers SOC scope | AMBIGUOUS | lab-manager-voucher, gradual-legitimacy-accumulation, bulk-order-noise-cover |
| 4 | Lift-and-modify IBC letter (new hash, valid names) | AMBIGUOUS | it-persona-manufacturing |
| 5 | Foreign institution — no registry | MISSED | foreign-institution, visiting-researcher (partial) |
| 6 | No IBC upload → order blocked | CAUGHT | unrelated-dept-student, inbox-compromise (exemption claim) |
| 7 | Forged document with public names — caught by chair contact | CAUGHT | unrelated-dept-student (forgery path) |
| 8 | IBC chair contact verifies fabricated sponsorship | CAUGHT | visiting-researcher |
| 9 | Expired document flagged | CAUGHT | dormant-account-takeover |
| 10 | Account-hijack inherits cached IBC | AMBIGUOUS | account-hijack |
| 11 | Matching declaration via inherited scope | AMBIGUOUS | dormant-account-takeover |

## bypass_methods_uncovered

| # | Bypass method | Severity | Notes |
|---|---|---|---|
| 1 | Private-sector no-IBC routing | Moderate | 4 stories; requires defining alternative-evidence path |
| 2 | Genuine insider attestation | Moderate | Structural — real document, malicious intent |
| 3 | Foreign institution no registry | Moderate | Structural — no equivalent registry |
| 4 | Lift-and-modify passes automated checks | Moderate | Manual chair contact is the only catch |
| 5 | Broad IBC scope matches any SOC | Minor | Scope-match definition gap |

---

## Verdict: **PASS**

No Critical findings. The idea addresses a meaningful subset of M15 evasion stories (blocks unrelated-dept-student, inbox-compromise exemption claims, visiting-researcher fabrication, dormant-account-takeover). Moderate gaps around private-sector entities, insiders, and foreign institutions are acknowledged but either structural or addressable through alternative-evidence-path definition. Pipeline continues to stage 6.
