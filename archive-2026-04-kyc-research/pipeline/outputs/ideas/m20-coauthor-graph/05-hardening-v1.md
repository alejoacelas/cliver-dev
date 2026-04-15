# m20-coauthor-graph — Bypass-aware hardening v1

**Idea under review:** `m20-coauthor-graph/04-implementation-v1.md`
**Measure:** M20 — Voucher-legitimacy (SOC)

---

## Attacker story walk

### lab-manager-voucher

**Summary:** PI vouches for own lab manager / insider.

**Bypass methods relevant to M20:**

- **(b) PI rubber-stamps:** The PI is the voucher. PI and lab manager typically share coauthored papers.
  - **Classification: CAUGHT.** `voucher_customer_coauthors_recent` fires if PI and lab manager share a paper within 3 years. The voucher is rejected as non-independent.
  - **But:** The implementation says "Customer must obtain a different voucher." If the lab manager can find *any* voucher outside their coauthor graph (e.g., a department chair who has not published with them), the check is cleared.
  - **Net: CAUGHT for the direct PI-voucher path, but displacement to an alternative voucher is cheap.**

- **(a) Attacker is the registered voucher:** Self-vouching.
  - **Classification: AMBIGUOUS.** The coauthor graph checks whether voucher and customer are the *same person* only implicitly (same OpenAlex Author ID). The implementation does not explicitly specify a same-person check. If the attacker registers under two different institutional emails but the same OpenAlex Author ID, the check would flag them. If no OpenAlex resolution succeeds for either, the check produces no signal.

- **(b') BSO-as-voucher:** BSO may or may not have publications with the lab manager.
  - **Classification: MISSED (likely).** BSOs are typically administrative, not coauthoring with bench staff. No coauthorship edge → independence check passes.

- **(d) Recruit PI/BSO as co-conspirator:** The co-conspirator voucher may or may not have published with the attacker.
  - **Classification: CAUGHT (if coauthored) / MISSED (if not).** A deliberately recruited voucher from outside the coauthor network evades the check.

**Net assessment:** Catches the direct PI-as-voucher path (the most natural choice) but the attacker can displace to an alternative voucher without coauthorship ties. Moderate binding — raises the cost of voucher selection but does not prevent it.

---

### visiting-researcher

**Summary:** Faculty sponsor vouches for visiting researcher.

- **Option 1 — Faculty sponsor as voucher:** The sponsor likely has no coauthorship with the visitor (newly arrived).
  - **Classification: MISSED.** No coauthored works → independence passes. The whole point of the visiting-researcher pattern is that the attacker is *new* to the lab.

- **Option 2 — Lab manager/admin as voucher:** Unlikely to have coauthored with the visitor.
  - **Classification: MISSED.**

- **Option 3 — Second lab member:** Same.
  - **Classification: MISSED.**

- **Option 4 — Second faculty sponsor:** Same (new relationship).
  - **Classification: MISSED.**

**Net assessment:** Not binding. The visiting researcher is by definition someone with no coauthorship history with the voucher.

---

### unrelated-dept-student

**Summary:** Three path families for vouching.

- **Bypass A — Pre-delegated ordering authority / inherited voucher:** The host-lab PI vouches for the rotation student. If the student has no publications, no coauthorship edge exists.
  - **Classification: MISSED.** Rotation students are precisely the population with zero coauthorship with the host PI.

- **Bypass B — Per-order rubber-stamping by inattentive voucher:** Same — no coauthorship edge.
  - **Classification: MISSED.**

- **Bypass G — Straw purchaser:** The straw purchaser (authorized lab member) is vouched for by their own PI. The coauthor check would flag PI-student coauthorship if it exists. But the *attacker* is not in the loop — the straw purchaser is the customer, not the attacker.
  - **Classification: MISSED (for the attacker).** The coauthor check doesn't engage with the hidden attacker.

- **Bypass E — Recruit PI as co-conspirator:**
  - **Classification: MISSED.** A recruited PI can find an alternative voucher outside their coauthor network.

- **Bypass F — Credential compromise:**
  - **Classification: MISSED.** Authentication attack; coauthor graph irrelevant.

**Net assessment:** Not binding. The student has no coauthorship history with the host lab.

---

### shell-nonprofit

**Summary:** Self-vouching from accomplice within the shell; escalation paths.

- **Self-vouching from accomplice:** The shell has no publication record → OpenAlex cannot resolve either party → no coauthor graph.
  - **Classification: MISSED.** The implementation notes "International / non-publishing voucher: the check produces no signal."

- **AitM phishing / credential compromise:** Authentication attacks.
  - **Classification: MISSED.**

- **Gig-platform voucher / recruited external voucher:** The external voucher has no coauthorship with the shell persona.
  - **Classification: MISSED.** Independence passes trivially.

**Net assessment:** Not binding. Shells have no publication footprint.

---

### shell-company

- All three bypass methods (second shell entity, recruited external voucher, social engineering) produce voucher-customer pairs with no coauthorship history.
  - **Classification: MISSED.** Same reasoning as shell-nonprofit.

**Net assessment:** Not binding.

---

### insider-recruitment

**Summary:** Recruited insider is a real voucher.

- The insider may or may not have coauthored with the customer. If the customer is a PI and the insider is a non-publishing staff member, no coauthorship edge.
  - **Classification: MISSED (likely).** The recruited insider is chosen precisely because their relationship with the attacker is not publicly visible.

**Net assessment:** Depends on whether the insider has published with the customer. Deliberately selected insiders will have no publication trail.

---

### account-hijack

- **Classification: MISSED.** The hijacker approves their own order using the voucher's account. The coauthor check would evaluate the voucher's coauthorship with the customer (the legitimate PI whose account is hijacked). If the voucher was already independent of the PI, the check passes.

**Net assessment:** Authentication attack.

---

### credential-compromise

- **Classification: MISSED.** Same as account-hijack.

---

### inbox-compromise

- **Classification: MISSED.** Email-based vouching workflow subverted; the coauthor graph check applies only to in-system vouching.

---

### dormant-account-takeover

- **Classification: MISSED.** The voucher relationship is inherited from the original account holder. The coauthor check evaluates the original customer-voucher pair, which was legitimate.

---

### biotech-incubator-tenant

**Summary:** Co-tenant as voucher.

- Co-tenants in an incubator are typically independent companies with no coauthorship.
  - **Classification: MISSED.** Independence passes. That's exactly the vulnerability — the social closeness is not captured by publication-based independence.

**Net assessment:** Not binding. Social proximity without publication ties is invisible.

---

### community-bio-lab-network

**Summary:** Community-lab peers as vouchers.

- Community-lab members may not have coauthored formal publications.
  - **Classification: MISSED.** The implementation notes: "community-lab peers may not coauthor; the check would clear them as 'independent' even though they are socially close."

**Net assessment:** Not binding.

---

### cro-framing

- Fake client institution as voucher → no coauthorship with CRO persona.
  - **Classification: MISSED.**

### cro-identity-rotation

- Each rotated identity has no publication history.
  - **Classification: MISSED.**

### gradual-legitimacy-accumulation

- Cultivated voucher relationship may or may not produce coauthorship.
  - **Classification: CAUGHT (if coauthored) / MISSED (if not).** The implementation notes: "only catches the cultivated voucher relationship if it has produced a paper or grant."

### dormant-domain

- Fabricated voucher persona on the revived domain has no publication record.
  - **Classification: MISSED.**

### foreign-institution

- Foreign colleague voucher — may or may not have coauthorship.
  - **Classification: CAUGHT (if coauthored) / MISSED (if not).**

### it-persona-manufacturing

- Manufactured voucher persona has no publication record.
  - **Classification: MISSED.**

### bulk-order-noise-cover

- The established individual's voucher may be a legitimate collaborator with coauthorship.
  - **Classification: CAUGHT (if the voucher has recent coauthorship with the customer).** This is the one case where the check provides a genuine independence signal — it forces the bulk orderer to use a voucher they haven't recently published with.

---

## Findings

### Critical

None.

### Moderate

**M1. The check is structurally blind to attacker patterns built to avoid public collaboration.**
- Stories: `shell-nonprofit`, `shell-company`, `community-bio-lab-network`, `biotech-incubator-tenant`, `cro-framing`, `dormant-domain`, `it-persona-manufacturing`.
- Why missed: These patterns either produce no publication footprint at all (shells, CROs, dormant domains, manufactured personas) or produce social closeness without coauthorship (community labs, incubator tenants). The check uses publication-based independence as a proxy for actual independence — the proxy breaks when the relationship is non-publication-mediated.
- Suggestion: This is structural. No fix within the publication-based coauthor graph. The implementation already acknowledges this.

**M2. Visiting researchers and rotation students are by definition "independent" of their host lab.**
- Stories: `visiting-researcher`, `unrelated-dept-student`.
- Why missed: These attackers are *new* to the voucher's network — zero coauthorship by construction. The independence check paradoxically passes the attacker who has the *weakest* genuine relationship with the voucher.
- Suggestion: Consider a *minimum relationship duration* requirement alongside independence: the voucher must have known the customer for ≥ N months AND not be a current close collaborator. But this conflicts with the independence requirement and creates a paradox (require both closeness and distance).

**M3. Displacement to alternative voucher after PI-path is blocked.**
- Story: `lab-manager-voucher`.
- Why missed: The check blocks the PI as voucher (coauthorship detected) but the attacker can find a department chair, BSO, or other senior figure without coauthorship ties. The check raises the bar for voucher selection but does not eliminate the voucher supply.
- Suggestion: Acknowledge this as a friction-adding mechanism, not a blocking mechanism. The raised bar is valuable — it forces the attacker to recruit a less natural voucher, which may create social friction or additional attribution.

**M4. Non-publishing populations invisible to the graph.**
- Stories: `insider-recruitment`, `lab-manager-voucher` (BSO path).
- Why missed: BSOs, lab managers, technicians, and administrative staff typically do not publish. The graph has no edges for them. The check provides no signal.
- Suggestion: For non-publishing populations, fall back to institutional-role-based independence (e.g., voucher must be from a different department or administrative unit). But this is a different check (m20-ror-disjointness territory).

### Minor

**m1. NIH/NSF grant overlap is US-only.**
- Stories: `foreign-institution`.
- Detail: Non-US grants (ERC, Wellcome, JSPS, NSFC) are not covered. The grant-overlap signal is absent for international cases.
- Suggestion: Acknowledged; no practical fix beyond OpenAlex coauthorship for international pairs.

**m2. Large-consortium papers as weak edges.**
- Detail: The implementation specifies that >20-author papers are treated as weak edges and don't auto-fail. This is reasonable but the threshold (20) is arbitrary.
- Suggestion: Consider field-specific thresholds; high-energy physics consortia have hundreds of authors, while biology papers rarely exceed 20.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| PI vouches for lab manager (coauthorship exists) | lab-manager-voucher (b) | CAUGHT |
| Displacement to alternative non-coauthor voucher | lab-manager-voucher (post-block) | MISSED |
| Self-vouch (same person) | lab-manager-voucher (a) | AMBIGUOUS |
| BSO as voucher (no coauthorship) | lab-manager-voucher (b') | MISSED |
| Recruited co-conspirator (no pub ties) | lab-manager-voucher (d), insider-recruitment | MISSED |
| New visiting researcher (no coauthorship by construction) | visiting-researcher (all options) | MISSED |
| Rotation student (no coauthorship) | unrelated-dept-student (all paths) | MISSED |
| Shell with no publication record | shell-nonprofit, shell-company, dormant-domain | MISSED |
| Social closeness without coauthorship | community-bio-lab-network, biotech-incubator-tenant | MISSED |
| CRO fabricated voucher | cro-framing, cro-identity-rotation | MISSED |
| Manufactured persona voucher | it-persona-manufacturing | MISSED |
| Authentication attacks | account-hijack, credential-compromise, inbox-compromise, dormant-account-takeover | MISSED |
| Cultivated voucher with coauthorship | gradual-legitimacy-accumulation | CAUGHT (if coauthored) |
| Bulk-order voucher with coauthorship | bulk-order-noise-cover | CAUGHT (if coauthored) |
| Foreign colleague (no grant overlap) | foreign-institution | MISSED (grant path) / depends (coauthor path) |

## bypass_methods_uncovered

- All non-publication-mediated relationships (shells, community labs, incubators, CROs, manufactured personas)
- New arrivals (visiting researchers, rotation students)
- Displacement to alternative voucher after PI blocked
- Non-publishing populations (BSOs, lab managers, technicians)
- Authentication-layer attacks
- Cross-provider rotation

---

## Verdict: **PASS**

No Critical findings. The check has a clear, narrow value proposition — it blocks the most natural voucher choice (the PI who has published with the customer) and forces displacement. This is valuable as a friction-adding measure even though the attacker can find alternative vouchers. The structural limitations (blind to non-publication relationships) are already acknowledged. Pipeline continues to stage 6.
