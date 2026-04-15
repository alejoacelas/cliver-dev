# m02-ror-domain-match — bypass-aware hardening v1

- **measure:** M02 — email-affiliation-whois
- **idea:** ROR institutional domain match
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker-story walk

### dormant-domain

**Summary:** Patient operator acquires lapsed canonical domain of a defunct research entity.

**Bypass A — Acquire the lapsed canonical domain:**
- **AMBIGUOUS.** If the defunct institution still has an ROR record with the domain in `links[]` or `domains[]`, the attacker's reanimated domain matches and `ror_domain_match` fires as a positive signal — the check actively *helps* the attacker by providing a clean pass. If the ROR record is marked `status=inactive`, the `ror_inactive` flag fires. The implementation does not specify what happens when the domain matches but the institution is inactive. Additionally, if ROR curators removed the domain from the record after the institution died, the attacker gets `ror_domain_mismatch`, which is a catch.
- Key question: does ROR retain domains for defunct (inactive) institutions? The implementation does not pin this down.

**Bypass B — Dangling-DNS subdomain takeover:**
- **CAUGHT** (partially). The attacker uses `attacker@sub.harvard.edu`. The email apex is `harvard.edu`, which matches ROR. `ror_domain_match` fires — this is a false negative. The check validates the parent institution but cannot detect that the subdomain is compromised. Classification: **MISSED** — the check actively passes the attacker.

**Bypass C — Typosquat / lookalike:**
- **CAUGHT.** `harvad.edu` does not appear in Harvard's ROR record. `ror_domain_mismatch` fires.

**Net assessment:** Catches typosquats. Actively harmful for dangling-DNS subdomain takeovers (provides a clean pass). Ambiguous on lapsed-domain reanimation depending on ROR record maintenance.

---

### cro-identity-rotation

**Summary:** 2–4 small CRO LLCs with custom domains.

**Fresh domain + Workspace:**
- **CAUGHT.** CRO LLCs are not in ROR (ROR covers research organizations, not commercial CROs). `ror_no_record` is returned. Per the SOP, this is recorded but not auto-flagged. Classification: **AMBIGUOUS** — the check detects the absence but the SOP explicitly says "do not flag." The signal is recorded but does not trigger action on its own.

**Aged-domain purchase:**
- **AMBIGUOUS.** Same as above. The CRO is not in ROR regardless of domain age.

**Federated login claim avoidance:**
- **N/A.**

**Net assessment:** The check correctly identifies that the CRO is not a recognized research institution, but the SOP deliberately does not flag this to avoid false positives on small legitimate biotechs. Value depends entirely on how `ror_no_record` is weighted in the downstream multi-signal decision.

---

### cro-framing

**Summary:** Single LLC framed as CRO, self-owned domain.

**Self-owned domain workspace:**
- **AMBIGUOUS.** Same as cro-identity-rotation. `ror_no_record`. Not flagged per SOP.

**Net assessment:** Same as cro-identity-rotation. Signal is present but suppressed.

---

### shell-nonprofit

**Summary:** Shell research nonprofit with name collision, real domain.

**Stand up the shell's own domain and mailbox:**
- **CAUGHT.** The shell's domain is not the legitimate institution's domain. If the attacker claims affiliation with the name-collision institution, `ror_domain_mismatch` fires. The ROR record for the real institution will have the real institution's domain, not the shell's newly registered domain.

**ROR self-listing (persistence variant):**
- **AMBIGUOUS.** The attacker submits a curation request to ROR. The implementation notes that "ROR inclusion requires acknowledgment by multiple people in research-output affiliations; single-person organizations are explicitly out of scope." The implementation also notes this is "NOT robust against a multi-author preprint coordination effort." If the attacker succeeds in getting a ROR listing with their domain, the check would pass them. Classification: **AMBIGUOUS** — depends on ROR's curation robustness against coordinated manipulation.

**Net assessment:** Catches the initial shell (domain mismatch) unless the attacker successfully games ROR curation.

---

### biotech-incubator-tenant

**Summary:** LLC at incubator with biotech-themed domain.

**Self-controlled domain + Workspace:**
- **AMBIGUOUS.** `ror_no_record` — the LLC is not in ROR. Not flagged per SOP.

**Net assessment:** Same structural issue as CRO branches. Signal present but suppressed.

---

### gradual-legitimacy-accumulation

**Summary:** 6–12 months operating a real-but-hollow biotech.

**Self-owned domain + Workspace:**
- **AMBIGUOUS.** `ror_no_record`. Even after 12 months of operation, the entity is unlikely to appear in ROR (it's a commercial biotech, not a research institution in the ROR sense). Same suppressed signal.

**Net assessment:** Persistent `ror_no_record` across 12+ months is potentially a stronger signal than for a new startup, but the implementation doesn't distinguish by customer tenure.

---

### community-bio-lab-network

**Summary:** Community bio labs with `.org` domains.

**Self-owned `.org` domain:**
- **AMBIGUOUS.** Community bio labs are generally not in ROR. `ror_no_record`. Not flagged. Some larger community labs (e.g., Genspace) might have ROR records — unclear.

**Net assessment:** Same as other non-ROR-listed entities.

---

### inbox-compromise

**Summary:** Compromises dormant institutional `.edu` inbox.

**All 6 methods:**
- **MISSED.** The attacker uses a real institutional email on a real institutional domain. ROR has the institution listed with that domain. `ror_domain_match` fires — clean pass. The check actively confirms the attacker's false affiliation.

**Net assessment:** No value. The check provides a positive signal that helps rather than hinders the attacker.

---

### credential-compromise

**Summary:** Compromises real PI's institutional email.

**Compromised `.edu` email:**
- **MISSED.** Same as inbox-compromise. `ror_domain_match` — clean pass.

**Net assessment:** No value.

---

### account-hijack

**Summary:** Takes over PI's pre-existing provider account.

**Inherited `.edu` mailbox:**
- **MISSED.** `ror_domain_match` — clean pass.

**Net assessment:** No value.

---

### dormant-account-takeover

**Summary:** IT admin takes over dormant synthesis-provider account.

**Bypass A — Redirect mailbox:**
- **MISSED.** Original institutional domain matches ROR.

**Bypass B — Re-activate deprovisioned account:**
- **MISSED.** Same institutional domain.

**Bypass C — Provision new institutional mailbox:**
- **MISSED.** New mailbox on same institutional domain. ROR match.

**Bypasses D, E:**
- **N/A** (network egress and federated login are not relevant to this check).

**Net assessment:** No value.

---

### foreign-institution

**Summary:** Exploits verification gaps at non-Anglophone institutions.

**All 6 methods:**
- **MISSED.** If the target institution is in ROR (many non-Anglophone institutions are, though coverage is uneven), `ror_domain_match` provides a clean pass. If the institution is NOT in ROR, `ror_no_record` fires but is not flagged per SOP — which means the check also fails to provide a negative signal for institutions that genuinely have poor coverage.

**Net assessment:** No value. Either provides a false-positive pass or degrades gracefully (no signal).

---

### it-persona-manufacturing

**Summary:** IT admin manufactures persona on real institutional domain.

**All sub-paths (A–D):**
- **MISSED.** Manufactured persona uses real institutional domain. `ror_domain_match` — clean pass.

**Net assessment:** No value.

---

### visiting-researcher

**Summary:** Real visiting-scholar appointment with genuine `.edu` credentials.

**No bypass needed:**
- **MISSED.** Real `.edu` on real institutional domain. `ror_domain_match` — clean pass.

**Net assessment:** No value.

---

### shell-company

**Summary:** Delaware LLC with real domain.

**Self-owned `@shellco.com` Workspace:**
- **AMBIGUOUS.** Shell company is not in ROR. `ror_no_record`. Not flagged per SOP.

**Net assessment:** Signal present but suppressed. Same as other commercial-domain branches.

---

### unrelated-dept-student

**Summary:** Enrolled student with real `.edu` email.

**All bypasses:**
- **MISSED.** Real `.edu` on real institutional domain. `ror_domain_match` — clean pass.

**Net assessment:** No value.

---

### insider-recruitment

**Summary:** Legitimate insider paid to place orders.

**No bypass needed:**
- **MISSED.** Real institutional email. `ror_domain_match` — clean pass.

**Net assessment:** No value.

---

### lab-manager-voucher

**Summary:** Insider with legitimate ordering role.

**No bypass needed:**
- **MISSED.** `ror_domain_match` — clean pass.

**Net assessment:** No value.

---

### bulk-order-noise-cover

**Summary:** Core facility technician using institutional infrastructure.

**No bypass needed:**
- **MISSED.** `ror_domain_match` — clean pass.

**Net assessment:** No value.

---

## Findings

### Moderate

**M1. `ror_no_record` is suppressed in the SOP, limiting value against purpose-built-organization branches (6 stories).**
- Stories: cro-identity-rotation, cro-framing, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, shell-company.
- Why missed: The check correctly identifies that these entities are not recognized research institutions, but `ror_no_record` is explicitly not flagged to avoid false positives on legitimate small biotechs. The implementation acknowledges this is a deliberate trade-off.
- Suggestion: In a multi-signal stack, `ror_no_record` combined with other weak signals (e.g., `domain_age_lt_12mo` from m02-rdap-age) could trigger a review. The SOP could specify that `ror_no_record` is a contributing factor rather than purely suppressed.

**M2. Genuine-institutional-email branches receive a clean positive pass (11 stories).**
- Stories: inbox-compromise, credential-compromise, account-hijack, dormant-account-takeover, foreign-institution, it-persona-manufacturing, visiting-researcher, unrelated-dept-student, insider-recruitment, lab-manager-voucher, bulk-order-noise-cover.
- Why missed: Structural. The check validates that the email domain belongs to a recognized institution, which is exactly what these attackers provide. The check cannot distinguish authorized from unauthorized users of an institutional domain.
- Suggestion: Not addressable by this idea.

### Minor

**m1. Dormant-domain reanimation may receive a false-positive clean pass via ROR (1 story).**
- Story: dormant-domain Bypass A.
- Why missed: If the defunct institution's ROR record still lists the domain and the record is `status=active` (or not yet updated to `inactive`), the attacker gets `ror_domain_match`. The `ror_inactive` flag exists but the implementation does not clarify ROR's timeliness in updating institution status.
- Suggestion: Cross-check `ror_inactive` explicitly. If `status=inactive` and `ror_domain_match`, treat as suspicious rather than positive.

**m2. Dangling-DNS subdomain takeover receives a clean pass (1 story).**
- Story: dormant-domain Bypass B.
- Why missed: The email apex (`harvard.edu`) matches the ROR record. The check validates at the apex level and cannot detect subdomain compromise.
- Suggestion: Addressed by m02-dangling-dns.

**m3. ROR self-curation is potentially gameable by coordinated multi-author preprint efforts (1 story).**
- Story: shell-nonprofit (ROR self-listing variant).
- Why missed: The implementation acknowledges this gap explicitly. ROR's curation requires multiple independent affiliation assertions, which a coordinated group could manufacture via preprints.
- Suggestion: Monitor for ROR records with very recent `established` dates or very few associated research outputs. This is a ROR platform-level concern, not fixable in the provider's check.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| dormant-domain Bypass C (typosquat) | CAUGHT |
| shell-nonprofit: shell domain vs. real institution | CAUGHT |
| dormant-domain Bypass A (lapsed domain with active ROR record) | AMBIGUOUS |
| dormant-domain Bypass B (dangling-DNS subdomain) | MISSED (false-positive pass) |
| cro-identity-rotation: fresh/aged domain | AMBIGUOUS (ror_no_record suppressed) |
| cro-framing: self-owned domain | AMBIGUOUS (ror_no_record suppressed) |
| shell-nonprofit: ROR self-listing | AMBIGUOUS |
| biotech-incubator-tenant: self-owned domain | AMBIGUOUS (ror_no_record suppressed) |
| gradual-legitimacy-accumulation: self-owned domain | AMBIGUOUS (ror_no_record suppressed) |
| community-bio-lab-network: self-owned .org | AMBIGUOUS (ror_no_record suppressed) |
| shell-company: self-owned domain | AMBIGUOUS (ror_no_record suppressed) |
| inbox-compromise: all 6 methods | MISSED (false-positive pass) |
| credential-compromise: compromised .edu | MISSED (false-positive pass) |
| account-hijack: inherited .edu | MISSED (false-positive pass) |
| dormant-account-takeover: Bypasses A–C | MISSED (false-positive pass) |
| foreign-institution: all 6 methods | MISSED |
| it-persona-manufacturing: Sub-paths A–D | MISSED (false-positive pass) |
| visiting-researcher: no bypass needed | MISSED (false-positive pass) |
| unrelated-dept-student: Bypasses A–C | MISSED (false-positive pass) |
| insider-recruitment: no bypass needed | MISSED (false-positive pass) |
| lab-manager-voucher: no bypass needed | MISSED (false-positive pass) |
| bulk-order-noise-cover: no bypass needed | MISSED (false-positive pass) |

## bypass_methods_uncovered

- All genuine-institutional-email variants (11 stories) — receive false-positive clean passes
- Purpose-built-organization variants with `ror_no_record` suppressed (6 stories)
- Dangling-DNS subdomain takeover (false-positive pass)
- ROR self-curation gaming (shell-nonprofit persistence variant)
- Dormant-domain reanimation where ROR record is stale

---

## Verdict: **PASS**

No Critical findings. The check's designed-for value is narrow: it provides a strong positive signal for legitimate academic institutions and catches typosquats and name-collision shells. The structural limitations (genuine-institutional-email attackers get clean passes; purpose-built-organization attackers get suppressed signals) are acknowledged in the implementation and are inherent to the ROR-as-allowlist approach. The check is one component in a multi-signal stack. Pipeline continues to stage 6.
