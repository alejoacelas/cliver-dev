# m18-accreditation-stack — bypass-aware hardening v1

- **measure:** M18 (institution-legitimacy-soc)
- **idea:** Accreditation registry stack (CAP/CLIA/AAALAC/OLAW/ISO 17025/GLP/Global BioLabs)

---

## Attacker story walk

### 1. shell-nonprofit

**Summary:** Fake research nonprofit with name collision, constructed domain/website/preprints/ROR listing/fiscal sponsor.

**Bypass methods relevant to this measure:**

- **Name-collision reflected legitimacy.** Near-collision entity name so reviewers conflate the shell with a real institution's accreditations.
  - **CAUGHT (partially).** The `accreditation_name_collision` flag is designed for this — close-but-not-exact match in the registry. If the real institution has CAP/CLIA/AAALAC accreditation and the shell has none, the check surfaces the discrepancy. However, the shell may not claim accreditation at all (most small nonprofits don't have accreditations), in which case the check fires `no record found` which is also true for many legitimate entities. **AMBIGUOUS** — the check is useful only if the shell actively claims an accreditation it doesn't have; if it avoids claiming accreditation, the check provides weak signal.

- **Stand up the shell's own domain and mailbox; thin-but-checkable website.**
  - **MISSED.** These are M2/M4 bypasses; accreditation registries do not check domain or website presence.

- **ROR self-listing.**
  - **MISSED.** ROR is not an accreditation registry; this check only queries accreditation registries.

- **Fiscal sponsorship.**
  - **AMBIGUOUS.** If the fiscal sponsor is an accredited entity, the shell might claim the sponsor's accreditation. The check would find the accreditation under the sponsor's name, not the shell's, which could surface a discrepancy. But this depends on the shell's claim structure.

**Net assessment:** The check provides signal only if the shell explicitly claims an accreditation it lacks. If the shell avoids accreditation claims (which is the low-cost path), the check fires a "no record" result that is identical to what legitimate small nonprofits produce. Weak signal for this story.

---

### 2. shell-company

**Summary:** Delaware LLC built to look like a real small biotech; or acquired going concern.

**Bypass methods relevant to this measure:**

- **Build entity signals from scratch.** LLC has no accreditations.
  - **MISSED.** Most small biotechs do not have CLIA/CAP/AAALAC/ISO 17025 accreditations. The "no record" result is uninformative. The check is designed to catch *false accreditation claims*, not the absence of accreditation.

- **Acquire existing company.** The acquired entity may or may not have accreditations.
  - **CAUGHT (conditionally).** If the acquired entity had accreditations that have since lapsed (e.g., CLIA certificate expired), the `claimed_accreditation_lapsed` flag fires. This is a genuine catch for the "acquire a dormant entity" sub-variant. However, if the acquired entity never had accreditations, the check provides no signal.

**Net assessment:** Weak signal for build-from-scratch (most small biotechs lack accreditations). Conditionally useful for acquisition variant if the acquired entity's accreditations have lapsed.

---

### 3. biotech-incubator-tenant

**Summary:** LLC rents bench space at incubator; leverages incubator brand for institutional legitimacy.

**Bypass methods relevant to this measure:**

- **Incubator residency.** The incubator itself (LabCentral, BioLabs, JLABS) may have institutional accreditations or IBC coverage.
  - **AMBIGUOUS.** If the tenant claims the incubator's accreditations, the check finds them under the incubator's name, not the tenant's. The `accreditation_scope_mismatch` flag may fire if the tenant's claimed work doesn't match the incubator's accreditation scope. But many incubator tenants legitimately operate under the incubator's IBC umbrella, so this is expected behavior.

**Net assessment:** Weak. The incubator's accreditations are real; the tenant's use of them is typical. The check cannot distinguish malicious from legitimate tenants.

---

### 4. cro-framing

**Summary:** CRO facade; the entity-level signals look like a service provider with legitimate client relationships.

**Bypass methods relevant to this measure:**

- **CRO services-page cover story.** The CRO claims no accreditations or claims ISO 17025.
  - **CAUGHT (conditionally).** If the CRO claims ISO 17025 accreditation, the A2LA/ANAB/UKAS check will not find the entity. `claimed_accreditation_not_in_registry` fires. This is a genuine catch if the CRO overclaims.
  - **MISSED.** If the CRO avoids claiming accreditation (many small CROs legitimately lack ISO 17025), the check provides no signal. CRO framing is specifically designed to explain away signal absences.

**Net assessment:** Weak unless the CRO overclaims accreditation.

---

### 5. cro-identity-rotation

**Summary:** Multiple CRO shell identities rotating to avoid cumulative trace.

**Bypass methods relevant to this measure:**

- **Each rotated shell reconstructs institutional legitimacy from scratch.**
  - **MISSED.** Each new CRO shell lacks accreditation (same as cro-framing). The check fires "no record" each time, which is uninformative. The rotation pattern itself is invisible to an accreditation-registry check (that signal belongs to the m18-cross-shell-graph idea).

**Net assessment:** Zero signal. Rotation is invisible to per-entity accreditation checks.

---

### 6. community-bio-lab-network

**Summary:** Community biology lab used as the registered institution.

**Bypass methods relevant to this measure:**

- **Community lab institutional legitimacy.**
  - **MISSED.** Community bio labs (Genspace, BioCurious) do not have CLIA/CAP/AAALAC/ISO 17025 accreditation. They may or may not have IBC equivalents. The check returns "no record," which is expected for this institution type. The check cannot distinguish a legitimate community lab from a malicious one masquerading as a community lab.

**Net assessment:** Zero signal.

---

### 7. gradual-legitimacy-accumulation

**Summary:** 12–24 months building entity track record; SOC orders placed after entity looks substantive.

**Bypass methods relevant to this measure:**

- **Accumulated entity signals (preprints, conference posters, small grants).**
  - **MISSED.** The entity accumulates research signals but not accreditations. Accreditation registries are irrelevant to this branch's strategy.

**Net assessment:** Zero signal.

---

### 8. dormant-domain

**Summary:** Acquire expired domain of defunct research institution; inherit its publication trail and archive history.

**Bypass methods relevant to this measure:**

- **Dormant domain provides aged WHOIS, Wayback history, residual citations.**
  - **CAUGHT (conditionally).** If the defunct institution had accreditations (e.g., CLIA certificate, AAALAC accreditation), those will show as lapsed/withdrawn in the registries. The `claimed_accreditation_lapsed` flag fires if the attacker claims the institution's prior accreditation status. This is a genuine catch — the registry shows the institution's accreditation has expired, which is inconsistent with a "revived" entity.
  - **MISSED** if the defunct institution never had accreditations or the attacker avoids claiming them.

**Net assessment:** Conditionally useful for defunct institutions that held accreditations. Many small research entities did not.

---

### 9. foreign-institution

**Summary:** Claim affiliation with a foreign institution that providers cannot meaningfully verify.

**Bypass methods relevant to this measure:**

- **Asymmetric verification gap on foreign institutional legitimacy.**
  - **CAUGHT (partially).** Several registries have international coverage: AAALAC (52 countries), GLEIF (global), ISO 17025 (UKAS for UK, but other national accreditors not in stack). However, the stack is US/UK-centric. For institutions in countries outside the stack's coverage, the check returns "no record" — which is also true for legitimate foreign institutions not accredited by US/UK bodies. **MISSED** for most non-US/UK foreign institutions.

**Net assessment:** Weak for most foreign institutions. The US/UK-centric registry stack cannot verify foreign institutional accreditations outside its coverage.

---

### 10. inbox-compromise

**Summary:** Compromise or create lookalike of a real institutional inbox to inherit that institution's legitimacy.

**Bypass methods relevant to this measure:**

- **Borrows real institutional legitimacy via email channel.**
  - **CAUGHT.** If the attacker claims the real institution's accreditations, the check confirms them — because the institution really is accredited. The check passes because the underlying institution is legitimate. This is correct behavior — the check is about institutional legitimacy, not about whether the person controlling the inbox is who they claim to be. That identity question belongs to m14/m17 ideas.

**Net assessment:** The check provides no additional signal because the institution *is* legitimate. The bypass is at the identity layer, not the institutional-legitimacy layer.

---

### 11. credential-compromise

**Summary:** Compromise real institutional employee's credentials.

**Bypass methods relevant to this measure:**

- **Institutional legitimacy inherited natively.**
  - **CAUGHT (vacuously).** Same as inbox-compromise — the institution is real and accredited. The check passes correctly. The bypass is at the identity layer.

**Net assessment:** No signal — the institution is real.

---

### 12. it-persona-manufacturing

**Summary:** Manufacture a researcher persona at a real institution via IT onboarding exploitation.

**Bypass methods relevant to this measure:**

- **Institutional legitimacy is real because IT issued real credentials.**
  - **CAUGHT (vacuously).** Same as credential-compromise — the institution is real.

**Net assessment:** No signal — the institution is real.

---

## Findings

### Critical

None.

### Moderate

**M1: The check provides signal only when an entity explicitly claims an accreditation it lacks; the dominant attacker strategy is to avoid claiming accreditation.**

- **Source:** shell-nonprofit, shell-company (build-from-scratch), cro-framing, cro-identity-rotation, community-bio-lab-network, gradual-legitimacy-accumulation.
- **Why the implementation misses:** The check is designed as a *verification* tool (confirm a claimed accreditation exists) rather than a *requirement* tool (require accreditation as a condition of SOC ordering). Since most small entities — both legitimate and malicious — lack the accreditations in this stack, the check produces the same result for both populations. The attacker can sidestep the check entirely by not claiming accreditation.
- **Suggestion:** This is a scope limitation, not a field-set bug. The check is valuable for the subset of customers who claim accreditations (catches overclaiming and lapsed accreditations). It should be framed as a verification tool with limited preventive value against unclaimed-accreditation attackers.

**M2: Foreign institutional accreditation coverage is weak.**

- **Source:** foreign-institution.
- **Why:** The stack is US/UK-centric (CMS QCOR, CAP, A2LA, ANAB, UKAS). Equivalent accreditation bodies in other countries (e.g., DIN/DAkkS in Germany, COFRAC in France, NABL in India) are not included. The implementation acknowledges this gap in the failure modes section but does not propose extensions.
- **Suggestion:** Stage 4 could extend the stack to include the top 5–10 non-US/UK accreditation bodies by customer volume. However, each additional registry adds integration and maintenance cost, so this is a cost-benefit question.

### Minor

**m1: GLP registry is the weakest link — no consolidated public list.**

- **Source:** Implementation's own sourcing notes.
- **Detail:** FDA BIMO GLP inspection results are not a clean feed; OECD MAD has no single global list. For customers claiming GLP compliance, the check has the least reliable data source.

**m2: Global BioLabs map is curated, not comprehensive.**

- **Source:** Implementation's own sourcing notes.
- **Detail:** Absences in the Global BioLabs map are not authoritative. A real BSL-3 lab may be absent; a claimed BSL-4 lab may not appear because the map focuses on known facilities. The `bsl_claim_not_in_global_biolabs_map` flag should be treated as informational, not conclusive.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Name-collision reflected legitimacy | shell-nonprofit | AMBIGUOUS |
| Stand up domain/mailbox/website | shell-nonprofit | MISSED |
| ROR self-listing | shell-nonprofit | MISSED |
| Fiscal sponsorship | shell-nonprofit | AMBIGUOUS |
| Build entity signals from scratch | shell-company | MISSED |
| Acquire existing company (lapsed accreditations) | shell-company | CAUGHT (conditional) |
| Incubator residency | biotech-incubator-tenant | AMBIGUOUS |
| CRO services-page cover (no accreditation claimed) | cro-framing | MISSED |
| CRO services-page cover (accreditation overclaimed) | cro-framing | CAUGHT |
| Each rotated shell | cro-identity-rotation | MISSED |
| Community lab legitimacy | community-bio-lab-network | MISSED |
| Accumulated entity signals | gradual-legitimacy-accumulation | MISSED |
| Dormant domain (defunct entity had accreditations) | dormant-domain | CAUGHT (conditional) |
| Dormant domain (defunct entity lacked accreditations) | dormant-domain | MISSED |
| Foreign institution outside stack coverage | foreign-institution | MISSED |
| Inbox compromise (real institution) | inbox-compromise | CAUGHT (vacuous) |
| Credential compromise (real institution) | credential-compromise | CAUGHT (vacuous) |
| IT persona manufacturing (real institution) | it-persona-manufacturing | CAUGHT (vacuous) |

## bypass_methods_uncovered

- Stand up domain/mailbox/website (shell-nonprofit)
- ROR self-listing (shell-nonprofit)
- Build entity signals from scratch (shell-company)
- CRO services-page cover, no accreditation claimed (cro-framing)
- Each rotated shell (cro-identity-rotation)
- Community lab legitimacy (community-bio-lab-network)
- Accumulated entity signals (gradual-legitimacy-accumulation)
- Dormant domain, defunct entity lacked accreditations (dormant-domain)
- Foreign institution outside stack coverage (foreign-institution)

---

## Verdict

**PASS** — No Critical findings. The check is correctly scoped as a verification tool for claimed accreditations. Its preventive value is limited to the subset of attackers who overclaim accreditation or who target entities with lapsed accreditations. The dominant limitation (attackers simply don't claim accreditation) is structural and not addressable by tweaking the field set. The two Moderate findings (claim-avoidance strategy; foreign coverage) are scope limitations to document, not bugs to fix.
