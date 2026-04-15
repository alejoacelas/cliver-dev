# m05-two-contact-sop — bypass-aware hardening v1

**Idea under review:** `outputs/ideas/m05-two-contact-sop/04-implementation-v1.md`
**Measure:** M05 — shipping-institution-association (Screen shipping address for association with institutional affiliation)

---

## Attacker story walk

### biotech-incubator-tenant

**Summary:** Attacker leases bench space at a biotech incubator under an LLC, so the shipping address resolves to a known biotech building.

**Bypass methods relevant to M05:**

1. **Bench-space lease at a recognized biotech incubator (3a).**
   - **CAUGHT.** The two-contact SOP requires the reviewer to phone the institution's switchboard and email a departmental contact to confirm the named customer is affiliated and authorized to receive synthesis at the listed shipping address. For a biotech incubator, the reviewer would call the incubator's main office and email a tenant-services or operations contact. The incubator would confirm the LLC is a tenant — and confirm that the named individual is the tenant's listed contact. The SOP produces a valid confirmation because the attacker really is a tenant.
   - **Net effect: The SOP confirms the attacker's presence rather than catching them.** The two-contact design is defeated by the attacker's genuine tenancy. Both channels would independently confirm affiliation.

2. **Standalone rented lab or sublet (3b).**
   - **CAUGHT (same logic).** The building operator or sublet landlord would confirm the tenant.

**Net assessment:** The two-contact SOP does NOT meaningfully reduce this attacker's access. The attacker genuinely occupies the building; the SOP confirms what the attacker constructed. The SOP's value here is deterrence (creating a paper trail of human-to-human attestation) and raising the bar from "address lookup alone" to "someone at the institution verbally confirmed the person." But the confirmation will be affirmative.

---

### community-bio-lab-network

**Summary:** Attacker forms a community-bio LLC at a maker space, biotech coworking, or virtual office.

**Bypass methods relevant to M05:**

1. **Real LLC + maker space address.**
   - **AMBIGUOUS.** The SOP requires the reviewer to find two independent contacts on the institution's public directory. A maker space is not an "institution" in the traditional sense — it has no switchboard, no biosafety officer, no departmental admin. The SOP would hit `two_contact_independence_failure` because the maker space's public-facing contacts are minimal (a general email, maybe a phone number). If the reviewer reaches the maker space operator, the operator would confirm the LLC is a member — but the second independent channel may not exist.
   - **Detail the implementation doesn't pin down:** Whether maker spaces / coworking spaces qualify as "institutions" for the SOP's contact-discovery steps.

2. **Real LLC + coworking space at biotech cluster.**
   - **AMBIGUOUS (same issue).** Coworking spaces have thin public directories.

3. **Real LLC + virtual office.**
   - **CAUGHT.** The SOP would fail to find any institutional contacts at a virtual office address. The reviewer would flag `two_contact_independence_failure`, which triggers senior review — a strong negative signal.

**Net assessment:** Mixed. Virtual-office paths are caught. Maker space / coworking paths are ambiguous — the SOP may not be able to run against non-traditional "institutions." The check adds meaningful friction for the cheapest path (virtual office) but less for the mid-cost path (coworking/maker space).

---

### shell-nonprofit

**Summary:** Attacker forms a shell entity (LLC or 501(c)(3)) registered to a virtual office at a biotech metro.

**Bypass methods relevant to M05:**

1. **Real-entity registration with virtual-office shipping.**
   - **CAUGHT.** Virtual office has no institutional directory. SOP flags `two_contact_independence_failure`. The shell entity's "website" is self-controlled, so the reviewer cannot find independent contacts.

2. **Foreign-formation sub-variant (UK CIC, Estonian OU).**
   - **CAUGHT.** Same logic — no real institutional directory at a foreign shell entity's registered address.

**Net assessment:** The two-contact SOP is effective here. Shell entities at virtual offices cannot produce two independent institutional contacts. This is a clean catch.

---

### cro-framing

**Summary:** Attacker forms a real LLC framed as a small CRO, pairs it with a virtual office / executive suite / coworking address.

**Bypass methods relevant to M05:**

1. **Real US LLC + virtual office.**
   - **CAUGHT.** No institutional directory. `two_contact_independence_failure`.

2. **Real US LLC + non-CMRA executive suite.**
   - **AMBIGUOUS.** Executive suites (e.g., Regus private offices) have a reception desk and building management. The SOP requires two independent contacts from the institution's public directory — but a CRO's "institution" is the CRO itself, and a 1-person CRO has no public directory. If the reviewer treats the executive-suite operator as the institution, they might reach the front desk (channel 1) but lack a second independent channel. Likely flags `two_contact_independence_failure` but depends on implementation detail.

3. **Coworking-space lease (WeWork etc.).**
   - **AMBIGUOUS.** Same issue as executive suite — thin institutional presence.

4. **Foreign jurisdiction LLC + foreign virtual office (Estonian e-Residency).**
   - **CAUGHT.** Foreign virtual office with no institutional directory. Additionally, foreign-language barrier adds friction per the SOP's documented failure modes.

**Net assessment:** Strong against virtual-office paths. Ambiguous against executive suites and coworking. The SOP's value is that a 1-person CRO at any address will struggle to produce two independent institutional contacts — but the implementation doesn't explicitly define how to handle "the customer IS the institution."

---

### cro-identity-rotation

**Summary:** Attacker spins up multiple LLC personas, each with its own real address, rotating across providers.

**Bypass methods relevant to M05:**

1. **Real LLC + virtual office (cheapest).**
   - **CAUGHT.** Same as cro-framing virtual-office path.

2. **Real coworking space lease (middle-cost upgrade).**
   - **AMBIGUOUS.** Same as cro-framing coworking path.

**Net assessment:** The SOP catches the cheapest rotation path. The rotation strategy itself (multiple LLCs) is invisible to this SOP because each case is evaluated independently — no cross-entity correlation.

---

### dormant-domain

**Summary:** Attacker revives a defunct lab's domain, provides a shipping address resembling the revived lab's geographic identity.

**Bypass methods relevant to M05:**

1. **Self-register the revived lab + address sourcing (virtual office / residential / coworking).**
   - **CAUGHT (virtual office path).** `two_contact_independence_failure` — the revived lab has no real institutional presence.
   - **CAUGHT (residential path).** No institutional directory at a residential address.
   - **AMBIGUOUS (biotech coworking path).** If the coworking space has a thin directory, the SOP may not produce two contacts. But the "institution" is a self-controlled website for a defunct lab — the reviewer should notice the lack of a real institutional directory when attempting Step 1 (contact discovery on the `.edu` / official site).

**Net assessment:** Strong. The dormant-domain attacker's "institution" is a self-built website; the two-contact SOP requires contacts from a real institutional directory that the attacker cannot fabricate (phone numbers, departmental emails on a real `.edu` domain). This is one of the SOP's strongest use cases.

---

### gradual-legitimacy-accumulation

**Summary:** Attacker accumulates 12+ months of legitimate-looking history under a real LLC at a real address.

**Bypass methods relevant to M05:**

1. **Virtual office in a biotech metro.**
   - **CAUGHT.** Even after 12 months, a virtual office has no institutional directory.

2. **Incubator bench.**
   - **CAUGHT (but confirms attacker).** Same as biotech-incubator-tenant: the incubator's operations staff would confirm the tenant's affiliation. The SOP confirms the attacker's genuine tenancy.

3. **Nominee manager.**
   - **MISSED.** The nominee manager bypass operates at the entity-registration layer, not the address-association layer. The SOP doesn't check who is listed as the LLC's manager — it checks whether the named customer is affiliated at the shipping address. If the customer provides a real name and the institution (incubator, coworking) confirms that person receives shipments there, the nominee manager is invisible to this check.

**Net assessment:** The SOP catches virtual-office paths but confirms incubator tenants. The 12-month accumulation strategy is specifically designed to survive checks like this one; the SOP adds a paper trail but does not block.

---

### inbox-compromise

**Summary:** Attacker compromises a small-college `.edu` inbox and orders synthesis under that persona.

**Bypass methods relevant to M05:**

1. **CMRA or virtual office in institution's metro.**
   - **CAUGHT.** The SOP requires the reviewer to call the institution's (the college's) switchboard to confirm the named customer is affiliated. If the customer is using a compromised adjunct account, the switchboard may or may not confirm "Dr. [departed adjunct] is still with us." For a departed adjunct, the answer should be "no" — CAUGHT. For an active account compromise, the institution would confirm affiliation — but the shipping address is a CMRA, not the institution, so the reviewer would ask whether that CMRA address is an authorized shipping location, and the institution would say "no."
   - **Key nuance:** The SOP's strength here is that it calls the real institution independently (not the customer's provided contacts), and the institution's real staff would not recognize a CMRA as an authorized receiving location.

2. **Registry address-change workflow.**
   - **AMBIGUOUS.** This targets the provider's own address-change process, not the institution. Whether the two-contact SOP is re-triggered on an address change depends on whether the provider's workflow fires the borderline-flag SOP for registry updates. The implementation document doesn't specify whether the SOP re-fires on address changes.

**Net assessment:** Strong against the CMRA path. The SOP's independent-contact design means the institution's real staff are asked about an address they don't recognize. Ambiguous on whether the SOP is triggered by in-system address changes.

---

### foreign-institution

**Summary:** Attacker claims affiliation with a foreign academic institution and ships to that country.

**Bypass methods relevant to M05:**

1. **In-country freight forwarder + fabricated "satellite office" framing.**
   - **CAUGHT.** The SOP requires the reviewer to call the foreign institution's switchboard and email a departmental contact. The institution would not confirm that the freight forwarder's address is an authorized receiving location. However, the implementation acknowledges a failure mode: "Foreign institution: language barrier on phone; reviewer needs a local-language speaker."
   - **Partial CAUGHT / partial AMBIGUOUS** depending on whether the reviewer can execute the phone call in the local language.

2. **Real institution address + local accomplice receiver.**
   - **MISSED.** If the attacker provides the institution's real address (not a forwarder), and has a local accomplice who will physically receive at that address, the institution's staff would confirm the named customer is affiliated (assuming the fake-affiliation claim is backed by a real visiting-researcher account). The two-contact SOP confirms the affiliation, and the local accomplice intercepts after delivery.

3. **Residential address framed as researcher's home office.**
   - **CAUGHT.** The institution would not confirm a residential address as an authorized receiving location for lab consumables.

4. **Virtual office in institution's metro.**
   - **CAUGHT.** The institution would not recognize a virtual office as an authorized shipping location.

**Net assessment:** The SOP catches forwarder, residential, and virtual-office paths. It misses the accomplice-at-real-address path because the institution genuinely confirms affiliation and the address is the institution's own. The foreign-language barrier is a documented failure mode that weakens all paths.

---

### credential-compromise

**Summary:** Attacker compromises a real PI's account and redirects shipment to a drop address.

**Bypass methods relevant to M05:**

1. **Carrier account takeover for package redirect.**
   - **MISSED.** The carrier redirect happens after the provider releases the shipment. The two-contact SOP runs at order time and would confirm the PI's affiliation at the institutional address (which is correct). The carrier redirect occurs post-shipment, entirely outside the SOP's scope.

2. **USPS change of address redirect.**
   - **MISSED.** Same — post-shipment postal redirect is outside the SOP's scope.

**Net assessment:** The SOP has no leverage against post-shipment carrier redirect. The SOP confirms the real PI at the real institution; the diversion happens downstream. This is a structural gap — no pre-shipment address-association check can catch post-shipment diversion.

---

### account-hijack

**Summary:** Attacker hijacks an existing PI provider account and either intercepts at the PI's institutional address or requests an address change.

**Bypass methods relevant to M05:**

1. **Physical interception at the PI's approved institutional address.**
   - **MISSED.** The SOP confirms the PI's affiliation and the institutional address. Physical interception at the mailroom is outside the SOP's scope.

2. **Social-engineered address change to an attacker-controlled drop.**
   - **AMBIGUOUS.** Whether the two-contact SOP re-fires on an address change depends on implementation. If the provider's controlled-change workflow triggers the SOP for the new address, the SOP would call the institution about the new "satellite facility" address, and the institution would likely not confirm it — CAUGHT. If the address change bypasses the SOP trigger, MISSED.

**Net assessment:** The SOP has no leverage against physical interception (structural). The address-change path depends on whether the SOP re-fires — an implementation detail not pinned down.

---

### it-persona-manufacturing

**Summary:** Attacker manufactures a fake researcher persona inside a real institution's IT footprint.

**Bypass methods relevant to M05:**

1. **Sub-path A — Add to existing org record (cheapest).**
   - **AMBIGUOUS.** The SOP calls the institution's switchboard and asks about the manufactured persona. If the IT admin injected the persona into the directory, the switchboard might route the call to the department and the department might confirm the name (since the directory listing exists). However, a phone call to research compliance or a biosafety officer might return "we don't have that person in our HR system" — CAUGHT if the SOP targets compliance/EHS rather than the front desk/directory.
   - **The key ambiguity:** The SOP says to contact "research compliance, EHS, biosafety officer, departmental administrator." A directory-injected persona that bypasses HR would fail the compliance/EHS check but pass the department-level check. Outcome depends on which contact the reviewer reaches first.

2. **Sub-path C — Sibling org record at the same institution.**
   - **AMBIGUOUS (same analysis).** The manufactured persona has a directory entry, but may not appear in HR.

3. **Shipping sub-paths — carrier rerouting.**
   - **MISSED.** Post-shipment carrier rerouting is outside the SOP's scope (same as credential-compromise).

**Net assessment:** Partially effective. The SOP's strength is that it reaches real institutional staff who may not have HR records matching the manufactured persona. But if the IT admin manufactured a sufficiently deep identity (Sub-path B, visiting-scholar appointment), the SOP confirms the persona because the institution's own administrative process created the record. The SOP's effectiveness here is inversely proportional to the depth of the manufactured identity.

---

### visiting-researcher

**Summary:** Attacker poses as a short-term visiting researcher and attaches to a host university's org record.

**Bypass methods relevant to M05:**

1. **Ship to host lab's institutional address (Option 3).**
   - **CAUGHT (but confirms attacker).** The SOP calls the institution and asks about the visiting researcher. The institution would confirm: "Yes, Dr. [attacker] is a visiting scholar in [department], and [lab address] is the authorized receiving location." Both channels confirm. The SOP confirms the attacker's genuine visiting status.

2. **Off-campus residential/commercial fallback (Option 4).**
   - **CAUGHT.** The institution would not confirm an off-campus virtual office as an authorized receiving location.

**Net assessment:** The SOP catches the off-campus fallback but confirms the institutional-address path. The visiting-researcher branch is designed to produce genuine affiliation, so the SOP's independent verification simply confirms what the attacker constructed. Paper-trail value is high (the institution's staff verbally attested), but the check does not block.

---

### dormant-account-takeover

**Summary:** Attacker takes over a dormant provider account with approved institution-linked shipping addresses.

**Bypass methods relevant to M05:**

1. **Ship to alternate registered address (Bypass B).**
   - **AMBIGUOUS.** Whether the SOP fires depends on whether the alternate address was already approved when the account was active. If the SOP only fires on borderline flags, an already-approved address might not trigger it. If triggered, the SOP would call the institution about a satellite lab address — the institution might confirm the lab exists but not recognize the attacker (since the original PI departed). Outcome depends on whether the institution's switchboard associates the departed PI's lab with the current address.

2. **Address change to attacker-controlled destination (Bypass D).**
   - **CAUGHT (if SOP fires).** The institution would not recognize the attacker-controlled address. But again — depends on whether the SOP triggers on address changes.

**Net assessment:** Effective if triggered. The core question is whether the SOP is in the critical path for address changes and dormant-account reactivations.

---

## Findings

### Critical

None.

### Moderate

1. **Post-shipment carrier redirect is structurally unaddressable (credential-compromise, account-hijack, it-persona-manufacturing).**
   - Stories: credential-compromise Method 1 (carrier account takeover), account-hijack Method 1 (physical interception), it-persona-manufacturing shipping sub-paths.
   - Why missed: The SOP runs at order time and validates the shipping address against the institution. Post-shipment diversion (UPS My Choice, FedEx Delivery Manager, physical mailroom interception) occurs after the provider releases the package. No pre-shipment address-association SOP can catch this.
   - Suggestion: This is structural. Mitigation requires carrier-level controls (e.g., locking package redirect via carrier account management, requiring signature from named addressee). Outside this idea's scope — belongs to a separate measure.

2. **Genuine visiting-researcher / incubator-tenant affiliations are confirmed rather than caught (biotech-incubator-tenant, visiting-researcher, gradual-legitimacy-accumulation Method 2).**
   - Stories: biotech-incubator-tenant 3a/3b, visiting-researcher Option 3, gradual-legitimacy-accumulation Method 2.
   - Why missed: The attacker holds a genuine affiliation. The SOP confirms what is true — the institution will vouch for the attacker because the attacker really is affiliated. The SOP cannot discriminate genuine-but-malicious affiliation from genuine-and-legitimate affiliation.
   - Suggestion: Not addressable by this SOP. Requires higher-scrutiny measures (M18/M19/M20) that evaluate the legitimacy of the affiliation, not just its existence.

3. **SOP trigger on address changes is unspecified (inbox-compromise Method 2, account-hijack Method 2, dormant-account-takeover Bypass D).**
   - Stories: inbox-compromise (registry address-change workflow), account-hijack (social-engineered address change), dormant-account-takeover (address change to attacker-controlled destination).
   - Why missed: The implementation says the SOP fires when "Address-association check raised a borderline flag." It does not specify whether in-system address changes re-trigger the borderline flag. If address changes bypass the trigger, the attacker can modify the approved shipping address without the SOP running.
   - Suggestion: Stage 4 should explicitly state that the SOP re-fires on any address change to the shipping address on a provider account, not only on initial registration.

4. **Accomplice-at-real-address path for foreign-institution (foreign-institution Method 2).**
   - Stories: foreign-institution Method 2 (local accomplice receiver at the institution's real address).
   - Why missed: The institution confirms affiliation (assuming the fake-affiliation is backed by a visiting-researcher account), and the address is the institution's own. The accomplice receives the package at the institution and forwards it. The SOP cannot detect the post-delivery handoff.
   - Suggestion: Not addressable by this SOP. Requires named-recipient pickup controls at the institutional receiving dock.

### Minor

5. **Maker space / coworking / executive suite classification ambiguity (community-bio-lab-network, cro-framing Methods 2-3, cro-identity-rotation Method 2).**
   - The SOP doesn't define how to handle non-traditional "institutions" (maker spaces, coworking spaces, executive suites) that have some public contacts but not the two-channel institutional directory the SOP assumes.
   - Suggestion: Stage 4 should add guidance for non-traditional institutions: define minimum criteria for what qualifies as a "public directory" for contact-discovery purposes. If the claimed institution has fewer than N independently-discoverable contacts, the SOP should default to `two_contact_independence_failure`.

6. **Foreign-language barrier weakens all foreign-institution paths.**
   - The implementation acknowledges this failure mode but doesn't specify when to use a translation service vs. when to flag the case as unable-to-run.
   - Suggestion: Add a decision rule: if the institution's primary language is not English and no English-speaking compliance/international-office contact is discoverable, flag as `two_contact_independence_failure` rather than attempting a partial SOP.

7. **IT-persona manufacturing outcome depends on which institutional contact the reviewer reaches (it-persona-manufacturing Sub-paths A, C).**
   - A directory-injected persona might be confirmed by a department admin but not by research compliance. The SOP doesn't specify priority ordering of contacts.
   - Suggestion: Specify that channel 1 (phone) should target research compliance / biosafety / EHS (HR-adjacent contacts) rather than the department, to maximize the chance of catching directory-only personas that lack HR records.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| biotech-incubator-tenant 3a (bench-space lease) | CAUGHT (but confirms attacker) |
| biotech-incubator-tenant 3b (standalone rented lab) | CAUGHT (but confirms attacker) |
| community-bio-lab-network (maker space) | AMBIGUOUS |
| community-bio-lab-network (coworking) | AMBIGUOUS |
| community-bio-lab-network (virtual office) | CAUGHT |
| shell-nonprofit (virtual-office registration) | CAUGHT |
| shell-nonprofit (foreign-formation) | CAUGHT |
| cro-framing (virtual office) | CAUGHT |
| cro-framing (executive suite) | AMBIGUOUS |
| cro-framing (coworking) | AMBIGUOUS |
| cro-framing (foreign virtual office) | CAUGHT |
| cro-identity-rotation (virtual office) | CAUGHT |
| cro-identity-rotation (coworking) | AMBIGUOUS |
| dormant-domain (virtual office) | CAUGHT |
| dormant-domain (residential) | CAUGHT |
| dormant-domain (biotech coworking) | AMBIGUOUS |
| gradual-legitimacy-accumulation (virtual office) | CAUGHT |
| gradual-legitimacy-accumulation (incubator bench) | CAUGHT (but confirms attacker) |
| gradual-legitimacy-accumulation (nominee manager) | MISSED |
| inbox-compromise (CMRA in institution metro) | CAUGHT |
| inbox-compromise (registry address-change) | AMBIGUOUS |
| foreign-institution (freight forwarder) | CAUGHT (partial — language barrier) |
| foreign-institution (accomplice at real address) | MISSED |
| foreign-institution (residential) | CAUGHT |
| foreign-institution (virtual office) | CAUGHT |
| credential-compromise (carrier redirect) | MISSED |
| credential-compromise (USPS COA) | MISSED |
| account-hijack (physical interception) | MISSED |
| account-hijack (address change) | AMBIGUOUS |
| it-persona-manufacturing (sub-path A, add to org) | AMBIGUOUS |
| it-persona-manufacturing (sub-path C, sibling org) | AMBIGUOUS |
| it-persona-manufacturing (carrier reroute) | MISSED |
| visiting-researcher (institutional address) | CAUGHT (but confirms attacker) |
| visiting-researcher (off-campus fallback) | CAUGHT |
| dormant-account-takeover (alternate address) | AMBIGUOUS |
| dormant-account-takeover (address change) | CAUGHT (if SOP fires) |

## bypass_methods_uncovered

- credential-compromise: carrier redirect ($0, 30 min) — structural, post-shipment
- credential-compromise: USPS COA — structural, post-shipment
- account-hijack: physical interception at institutional address — structural
- it-persona-manufacturing: carrier reroute — structural, post-shipment
- foreign-institution: accomplice at real institutional address — structural, post-delivery handoff
- gradual-legitimacy-accumulation: nominee manager — SOP doesn't check LLC manager identity

---

**Verdict: PASS**

No Critical findings. The SOP is effective against its primary target (shell entities, virtual offices, self-controlled "institutions" with no real directory) and produces strong paper trails for genuine-affiliation cases. The structural gaps (post-shipment diversion, genuine-but-malicious affiliation) are correctly outside this SOP's scope and are addressed by other measures (carrier controls, M18/M19/M20 legitimacy checks). The Moderate findings are either structural or addressable as minor specification tightening without re-research.
