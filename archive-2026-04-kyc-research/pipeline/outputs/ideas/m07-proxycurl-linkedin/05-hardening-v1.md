# m07-proxycurl-linkedin — bypass-aware hardening v1

## Attacker stories walked

### 1. it-persona-manufacturing

**Summary:** IT admin at a real university manufactures a directory entry and email for a fake persona.

**Bypass methods relevant to M07:**

- **Sub-path A — Loose-governance direct injection:** Creates a mail alias and directory entry. The manufactured persona would *not* have a LinkedIn profile (unless the attacker also creates one).
  - **CAUGHT.** `linkedin_no_profile` fires. The manufactured persona has no LinkedIn history. Human reviewer is alerted. However: creating a LinkedIn profile for the fake persona is trivial ($0, minutes, self-asserted, no verification). If the attacker anticipates a LinkedIn check, sub-path A becomes MISSED.
  - Classification: **CAUGHT** against a naive attacker; **MISSED** against an attacker who pre-creates a LinkedIn profile.

- **Sub-path B — Visiting-scholar pathway:** Real visiting appointment with a real PI sponsor.
  - **AMBIGUOUS.** The manufactured persona's LinkedIn profile (if created) would show the host institution as current employer, but with < 12 months tenure. `linkedin_profile_lt_12mo` might fire as a soft signal. A real visiting scholar would also have < 12 months tenure, so this signal has poor specificity.

- **Sub-path C — Reuse of departed member's directory entry.**
  - **AMBIGUOUS.** The departed member may have an existing LinkedIn profile. If the attacker co-opts that profile (via the reactivated email), the LinkedIn data shows a real person at the institution — clean pass. If the attacker creates a new profile under the departed member's name, it would be a thin profile (`linkedin_thin_profile`).

- **Sub-path D — HR-system injection.**
  - Same as sub-path A: persona has no pre-existing LinkedIn profile unless the attacker creates one.

**Net assessment:** Moderate resistance against a naive IT-admin attacker who doesn't think about LinkedIn. Zero resistance against one who creates a fake LinkedIn profile (trivial to do).

---

### 2. visiting-researcher

**Summary:** Lone operator obtains a real visiting-scholar appointment.

**Bypass methods:** None needed for M07 — the attacker has genuine credentials. For the LinkedIn check specifically:

- The attacker uses their own real name throughout and "the attacker faces $0-$1,500 in institutional fees." The attacker likely has a pre-existing LinkedIn profile (they need one for the cold-pitch correspondence with potential PI sponsors).
  - **MISSED.** The attacker's LinkedIn profile shows the host institution as current employer (they would update it as part of building their cover). `linkedin_employer_mismatch` does not fire. The profile likely has > 12 months of history from prior positions.

**Net assessment:** Zero resistance. A social-engineering-proficient attacker who can obtain a visiting appointment can certainly maintain a plausible LinkedIn profile.

---

### 3. unrelated-dept-student

**Summary:** Currently enrolled grad student in a non-wet-lab department.

**Bypass methods:**

- **Real enrolled student with real institutional email.**
  - **AMBIGUOUS.** Whether the student has a LinkedIn profile varies. If they do: `experiences[]` shows the university as current employer/student, which matches the claimed institution — clean pass. If they don't: `linkedin_no_profile` fires, but the manual review SOP would quickly find the student in university records and clear the flag. Net: the check provides weak signal because both "no profile" and "profile matches" are common among legitimate students.

**Net assessment:** Very weak resistance. The check might flag students without LinkedIn profiles, but many legitimate students also lack profiles, diluting the signal.

---

### 4. lab-manager-voucher

**Summary:** Insider with legitimate ordering role.

- **MISSED.** A lab manager or PI with years of employment likely has a LinkedIn profile showing the institution. Even if they don't, the manual review SOP clears the flag when the reviewer confirms the person is real.

**Net assessment:** Zero resistance.

---

### 5. bulk-order-noise-cover

**Summary:** Core facility technician or cross-PI admin.

- **MISSED.** Same reasoning as lab-manager-voucher. Real employee, likely has a LinkedIn profile.
- Role-mailbox sub-variant: Proxycurl Person Lookup requires `first_name` and `last_name`. A role mailbox (`genomics-core@university.edu`) has no person to look up. `linkedin_no_profile` fires but is meaningless for a role account.

**Net assessment:** Zero resistance for the individual variant. Failure mode for the role-mailbox variant (unspecified behavior).

---

### 6. insider-recruitment

**Summary:** External handler pays an insider $1k-$5k per order.

- **MISSED.** The insider has a genuine LinkedIn profile showing employment at the institution. The handler is invisible.

**Net assessment:** Zero resistance.

---

### 7. account-hijack

**Summary:** Attacker compromises a PI's email and takes over their provider account.

- **MISSED.** The PI's LinkedIn profile shows the institution. The hijacker operates under the PI's identity.

**Net assessment:** Zero resistance.

---

### 8. inbox-compromise

**Summary:** Lone operator compromises a dormant email at a small college.

**Bypass methods:**

- **Adjunct account recovery:**
  - **CAUGHT — partially.** The departed adjunct may still have a LinkedIn profile showing the institution, but with an old `ends_at` date. `linkedin_employer_mismatch` would fire if the adjunct's LinkedIn shows them as no longer at the institution. But if the adjunct never updated LinkedIn (common), the profile still shows the institution — clean pass. Classification: **AMBIGUOUS**.

- **Alumni-for-life forwarder:**
  - **CAUGHT — partially.** An alumni user's LinkedIn would show the institution under `education[]` but not under `experiences[]` as a current employer. `linkedin_employer_mismatch` would fire. Classification: **CAUGHT** (assuming the implementation correctly checks `experiences[0].company` for current employment, not education).

- **Self-issued visiting/affiliate account:**
  - **CAUGHT.** The attacker using this method has no pre-existing LinkedIn profile at the institution. `linkedin_no_profile` or `linkedin_employer_mismatch` fires. But: creating a LinkedIn profile claiming the visiting role is trivial.

**Net assessment:** Moderate resistance against the alumni variant. Weak resistance against the adjunct and visiting variants (depends on LinkedIn profile state or attacker sophistication).

---

### 9. credential-compromise

**Summary:** Attacker compromises a real PI's email.

- **MISSED.** The PI has a LinkedIn profile showing the institution. Clean pass.

**Net assessment:** Zero resistance.

---

### 10. dormant-account-takeover

**Summary:** IT admin takes over a dormant provider account.

**Bypass methods:**

- **Bypass A — Redirect original holder's mailbox:**
  - **AMBIGUOUS.** The original holder's LinkedIn profile (if it exists) shows the institution, but possibly with a past `ends_at` date. If LinkedIn is not updated, the profile still shows current employment — clean pass.

- **Bypass C — Fabricated persona:**
  - **CAUGHT.** The fabricated persona has no LinkedIn profile. `linkedin_no_profile` fires. But: the IT admin can create a LinkedIn profile for the fabricated persona ($0, minutes).

**Net assessment:** Weak resistance. The check catches fabricated personas only when the attacker doesn't bother creating a LinkedIn profile.

---

### 11. foreign-institution

**Summary:** Lone operator exploits verification gaps at non-Anglophone institutions.

**Bypass methods:**

- **Visiting-researcher account at non-Anglophone institution:**
  - **AMBIGUOUS.** The implementation notes that "Customer is in a country where LinkedIn usage is rare (Russia, China)" is a failure mode. For Brazilian, Japanese, and Indian institutions, LinkedIn usage is moderate. For Indonesian, Vietnamese, and Russian institutions, it is low. The check produces false negatives for legitimate researchers in these regions, diluting the signal. A sophisticated attacker who anticipates a LinkedIn check would create or update a profile before applying.

**Net assessment:** Very weak resistance. LinkedIn coverage is low at exactly the institutions this attacker targets, and the attacker can trivially create a profile.

---

### 12. dormant-domain

**Summary:** Attacker acquires a defunct entity's domain and stands up a fake website.

- **AMBIGUOUS.** If the attacker also creates a LinkedIn profile listing the revived entity as employer, Proxycurl may find it and confirm affiliation. If the attacker doesn't create a LinkedIn profile, `linkedin_no_profile` fires. But LinkedIn profiles are self-asserted and unverified; creating one takes minutes.

**Net assessment:** Weak resistance. Depends entirely on whether the attacker bothers to create a LinkedIn profile.

---

### 13. shell-company

**Summary:** Shell company with real employees, professional website, and LinkedIn profiles.

**Bypass methods:**

- **"stands up ... LinkedIn profiles free (no verification)":**
  - **MISSED.** The attacker explicitly creates LinkedIn profiles as part of the shell-company setup. Proxycurl finds the profile showing the shell company as current employer. `linkedin_employer_mismatch` does not fire. `linkedin_profile_lt_12mo` might fire if the profile is new, but the gradual-legitimacy-accumulation variant specifically notes that profiles are aged.

**Net assessment:** Zero resistance. The attacker's playbook explicitly includes creating LinkedIn profiles. LinkedIn is self-asserted, so the profile confirms the false affiliation.

---

### 14. shell-nonprofit

**Summary:** Shell nonprofit with self-owned domain.

- Same analysis as shell-company. The attacker can trivially create LinkedIn profiles. **MISSED.**

**Net assessment:** Zero resistance.

---

### 15. cro-framing

**Summary:** CRO LLC with self-built website.

- The attacker creates LinkedIn profiles as part of the framing. **MISSED.**

**Net assessment:** Zero resistance.

---

### 16. cro-identity-rotation

**Summary:** Multiple CRO LLCs.

- Each entity has its own LinkedIn profiles. **MISSED** per entity.

**Net assessment:** Zero resistance per entity.

---

### 17. biotech-incubator-tenant

**Summary:** LLC at a biotech incubator.

- **"LinkedIn bios for the 1-2 person team"** — explicitly part of the setup. **MISSED.**

**Net assessment:** Zero resistance.

---

### 18. gradual-legitimacy-accumulation

**Summary:** Patient individual builds a hollow biotech over 6-12 months.

- **"LinkedIn profiles for attacker and accomplice listing the LLC as employer. Free. LinkedIn is self-asserted and unverified."** Explicitly part of the playbook. **MISSED.**

**Net assessment:** Zero resistance. The attacker story explicitly identifies LinkedIn as a self-asserted, unverified signal.

---

### 19. community-bio-lab-network

**Summary:** Community biology labs as LLCs/nonprofits.

- The attacker can create LinkedIn profiles for the community lab. **MISSED.**

**Net assessment:** Zero resistance if the attacker creates a profile. Weak catch if they don't.

---

## Findings

### Finding 1 — Critical: LinkedIn profiles are self-asserted and unverified, making them trivially gameable by purpose-built-organization attackers

**Source:** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network (7 stories). Also: it-persona-manufacturing, dormant-domain (2 additional stories where pre-creating a LinkedIn profile is trivial).

**Why missed:** LinkedIn profiles are self-reported by the user. There is no verification of employment claims. Creating a profile that lists a specific employer takes minutes and costs $0. Multiple attacker stories (shell-company, gradual-legitimacy-accumulation, biotech-incubator-tenant) explicitly name "LinkedIn profiles" as part of their standard setup playbook. The Proxycurl check treats a matching LinkedIn employer as corroboration, but the signal is circular: the attacker asserts their affiliation on LinkedIn, and the check confirms the assertion.

**Suggestion for stage 4 re-research:** The implementation document should explicitly acknowledge that LinkedIn is a self-asserted signal and that a LinkedIn employer match does not constitute independent corroboration. Consider downgrading LinkedIn match from "corroboration" to "soft positive, not sufficient alone." The check's primary value is as a *negative* signal: `linkedin_no_profile` or `linkedin_employer_mismatch` is informative when it fires, but a match is not strongly informative because it is trivially manufactured. This reframing does not require API changes, only a change in how the signal is weighted in the screening decision tree.

### Finding 2 — Critical: Genuine insiders and real credential holders at real institutions pass with zero resistance

**Source:** visiting-researcher, lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise (6 stories).

**Why missed:** These attackers have genuine employment records and (in most cases) genuine LinkedIn profiles showing the real institution. The LinkedIn check confirms their real affiliation, which is precisely the problem — their affiliation is real but their intent is malicious. This is structural to M07's low-scrutiny scope.

**Suggestion for stage 4 re-research:** Not addressable by tweaking the LinkedIn check. Structural to M07.

### Finding 3 — Moderate: LinkedIn coverage gaps at non-Western institutions undermine the check

**Source:** foreign-institution.

**Why missed:** LinkedIn usage is low in Russia, China, parts of Southeast Asia, and Central Asia. The implementation acknowledges this as a failure mode but does not define an alternative workflow for these regions. The false-positive rate for `linkedin_no_profile` is high at exactly the institutions where the attacker has differential advantage.

**Suggestion for stage 4 re-research:** Define explicit regional fallback: for institutions in countries with < 50% LinkedIn penetration (approximate list: China, Russia, most of Central/Southeast Asia), skip the LinkedIn check and rely on federation-based or site-search-based checks instead. The implementation should not throw `linkedin_no_profile` as a flag for institutions in these regions.

### Finding 4 — Moderate: Legal risk from LinkedIn ToS may be blocking

**Source:** Cross-cutting.

**Why missed:** The implementation flags "Material legal risk" and notes the *hiQ Labs v. LinkedIn* litigation. If LinkedIn's ToS is enforced or Proxycurl's access is interrupted, the entire check becomes unavailable. This is not a bypass per se, but a service-availability risk that affects all stories.

**Suggestion:** This should be elevated as an open issue for the stage 7 synthesis. If legal counsel advises against using Proxycurl for KYC, the idea is effectively dead.

### Finding 5 — Minor: Role-mailbox handling unspecified

**Source:** bulk-order-noise-cover (role-mailbox sub-variant).

**Why missed:** Proxycurl Person Lookup requires person names. Role accounts have no person to look up.

**Suggestion:** Same as m07-google-site-search: define fallback for role/facility accounts.

---

## bypass_methods_known

| Story | Bypass method | Classification |
|---|---|---|
| it-persona-manufacturing | Sub-path A (no LinkedIn profile created) | CAUGHT |
| it-persona-manufacturing | Sub-path A (LinkedIn profile pre-created) | MISSED |
| it-persona-manufacturing | Sub-path B (visiting-scholar) | AMBIGUOUS |
| it-persona-manufacturing | Sub-path C (departed member's profile) | AMBIGUOUS |
| it-persona-manufacturing | Sub-path D (HR injection, no LinkedIn) | CAUGHT |
| it-persona-manufacturing | Sub-path D (HR injection, LinkedIn pre-created) | MISSED |
| visiting-researcher | Genuine appointment + plausible LinkedIn | MISSED |
| unrelated-dept-student | Real student, LinkedIn varies | AMBIGUOUS |
| lab-manager-voucher | Genuine employee, likely has LinkedIn | MISSED |
| bulk-order-noise-cover | Genuine employee | MISSED |
| bulk-order-noise-cover | Role-mailbox variant | AMBIGUOUS (failure mode) |
| insider-recruitment | Genuine insider with LinkedIn | MISSED |
| account-hijack | Inherited PI identity + PI's LinkedIn | MISSED |
| inbox-compromise | Adjunct (LinkedIn may be stale) | AMBIGUOUS |
| inbox-compromise | Alumni forwarder (no current employer) | CAUGHT |
| inbox-compromise | Self-issued visiting account (no LinkedIn) | CAUGHT |
| credential-compromise | Compromised PI + PI's LinkedIn | MISSED |
| dormant-account-takeover | Bypass A (original holder's LinkedIn) | AMBIGUOUS |
| dormant-account-takeover | Bypass C (fabricated persona, no LinkedIn) | CAUGHT |
| dormant-account-takeover | Bypass C (fabricated persona, LinkedIn created) | MISSED |
| foreign-institution | All variants (low LinkedIn coverage) | AMBIGUOUS |
| dormant-domain | No LinkedIn created | CAUGHT |
| dormant-domain | LinkedIn created for fake persona | MISSED |
| shell-company | LinkedIn profiles part of playbook | MISSED |
| shell-nonprofit | LinkedIn profile trivially created | MISSED |
| cro-framing | LinkedIn profile trivially created | MISSED |
| cro-identity-rotation | Per-entity LinkedIn profiles | MISSED |
| biotech-incubator-tenant | LinkedIn bios part of setup | MISSED |
| gradual-legitimacy-accumulation | LinkedIn profiles explicitly in playbook | MISSED |
| community-bio-lab-network | LinkedIn profile trivially created | MISSED |

## bypass_methods_uncovered

- **Structural — LinkedIn is self-asserted:** all purpose-built-organization stories (shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, dormant-domain) can pre-create matching LinkedIn profiles at $0 cost
- **Structural — genuine insiders:** visiting-researcher, lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise
- **Implementation-specific — non-Western LinkedIn coverage:** foreign-institution

## Verdict

**STRUCTURAL** — two Critical findings. Finding 1 (LinkedIn is self-asserted/unverified, trivially gameable by purpose-built-organization attackers) is structural to LinkedIn as a data source — no implementation tweak can make a self-asserted platform into an independent verifier. Finding 2 (genuine insiders pass cleanly) is structural to M07's low-scrutiny scope. The implementation document should acknowledge that the LinkedIn check's value is primarily as a *negative* signal (absence of a LinkedIn presence is weakly informative) rather than a *positive* corroboration (presence of a matching LinkedIn profile is not independently informative). These structural findings are routed to human review. Pipeline continues to stage 6.
