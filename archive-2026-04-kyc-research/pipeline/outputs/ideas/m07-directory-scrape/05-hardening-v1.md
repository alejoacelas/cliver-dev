# m07-directory-scrape — bypass-aware hardening v1

**Idea under review:** `outputs/ideas/m07-directory-scrape/04-implementation-v1.md`
**Measure:** M07 — institution-affiliation-low-scrutiny (Check that customer is affiliated with their listed institution)

---

## Attacker story walk

### it-persona-manufacturing

**Summary:** IT admin manufactures a fake researcher persona inside a real institution's IT footprint, including directory entry, mail alias, and DL membership.

**Bypass methods relevant to M07:**

1. **Sub-path A — Loose-governance direct injection (directory entry + mail alias).**
   - **MISSED.** The attacker creates a directory entry directly. The scrape queries the institution's public people-search and finds the manufactured persona with name, email, and department. `match_status = exact`. The scrape confirms the attacker's presence because the attacker literally created the directory entry.
   - **Which field fails:** All fields return clean matches — the persona was injected into the source the scrape reads.

2. **Sub-path B — Visiting-scholar / affiliate-program pathway.**
   - **MISSED.** The institution's own administrative process creates the record. HR-matched. Directory listing is genuine. The scrape confirms.

3. **Sub-path C — Reuse of departed real member's directory entry.**
   - **MISSED.** The departed member's directory entry is reactivated. The scrape finds the original member's name (or the remapped persona). If the attacker maps the entry to a new alias, the scrape may find a name/email mismatch with the original — but the implementation's `name_similarity_score` for fuzzy matching may not catch this if the directory was updated cleanly.

4. **Sub-path D — HR-system injection.**
   - **MISSED.** Full HR-record backing. The scrape finds a complete, authoritative directory entry.

**Net assessment:** The directory scrape has zero leverage against this branch. The entire branch is predicated on manufacturing directory entries — the scrape reads exactly what the attacker planted. This is the defining structural weakness of any check that relies on the institution's own directory as a source of truth when the attacker controls that directory.

---

### visiting-researcher

**Summary:** Attacker obtains a real visiting-scholar appointment and genuine `.edu` credentials.

**Bypass methods relevant to M07:**

1. **Genuine visiting appointment → genuine directory listing.**
   - **MISSED.** The attacker is genuinely listed on the host department's website (visiting-scholars page) and in the directory. The scrape returns `match_status = exact`, `matched_affiliation_type = visiting`, and the correct department. The `directory_visiting_only` flag fires (informational, not a block).

**Net assessment:** The scrape confirms the attacker's genuine visiting status. The only signal is `directory_visiting_only`, which is informational. M07 as scoped is "low scrutiny" — it is not designed to block visiting researchers. The scrape works as designed; the attacker passes because they have a real affiliation.

---

### unrelated-dept-student

**Summary:** Currently enrolled graduate student or postdoc in a department that does not normally order sequences of concern.

**Bypass methods relevant to M07:**

1. **Canonical `@university.edu` (Bypass A).**
   - **MISSED.** The student has a real directory entry. The scrape confirms name, email, department. `match_status = exact`.

2. **Host-lab or research-group alias (Bypass B).**
   - **MISSED.** The lab-specific alias resolves in the directory or lab page. The scrape confirms.

3. **Federated academic login (Bypass C).**
   - Not directly relevant to the scrape (handled by m07-incommon-edugain), but the underlying directory entry exists.

**Net assessment:** The scrape confirms the student's genuine enrollment. The only potentially useful signal is `matched_department` — if the department is "Mathematics" or "Computer Science" rather than a wet-lab discipline, this could be an informational flag. But the implementation does not include a department-relevance check. M07 as scoped does not discriminate by department.

---

### lab-manager-voucher

**Summary:** Legitimate lab manager uses their real ordering role to place orders on behalf of a malicious handler.

**Bypass methods relevant to M07:**

1. **Genuine directory listing.**
   - **MISSED.** The lab manager's directory entry is completely authentic. The scrape confirms name, email, department, title ("Lab Manager" or similar). No signal — the attacker passes by being exactly who they claim to be.

2. **Shared departmental account sub-variant.**
   - **AMBIGUOUS.** If the provider account is registered to a role mailbox (e.g., `genomics-core@university.edu`), the directory scrape would search for that role, not an individual. The scrape may return `match_status = none` for an individual name search or find a generic listing. The implementation does not specify how to handle role-mailbox customers.

**Net assessment:** Zero leverage. The lab manager is a genuine institutional employee with a clean directory listing. The handler is invisible.

---

### bulk-order-noise-cover

**Summary:** Core facility technician or departmental administrator exploits institutional ordering infrastructure.

**Bypass methods relevant to M07:**

1. **Genuine directory listing.**
   - **MISSED.** The technician/admin has a real directory entry. The scrape confirms.

2. **Role-mailbox variant.**
   - **AMBIGUOUS.** Same as lab-manager-voucher shared-account sub-variant. The `genomics-core@university.edu` mailbox may not resolve to a named individual in the directory.

**Net assessment:** Zero leverage. The attacker is a genuine employee.

---

### insider-recruitment

**Summary:** External handler pays a legitimate insider to place SOC orders.

**Bypass methods relevant to M07:**

1. **Genuine directory listing.**
   - **MISSED.** The insider (grad student, junior tech, postdoc) has a completely authentic directory entry. The scrape confirms.

**Net assessment:** Zero leverage. The insider is real; the handler is invisible.

---

### account-hijack

**Summary:** Attacker compromises a PI's institutional email and takes over the PI's provider account.

**Bypass methods relevant to M07:**

1. **Inherited directory listing.**
   - **MISSED.** The PI's directory entry is genuine and undisturbed. The scrape confirms the PI's affiliation. The attacker operates under the PI's identity; the scrape cannot distinguish the hijacker from the genuine PI.

**Net assessment:** Zero leverage. The directory confirms the real PI; the hijacker is invisible.

---

### inbox-compromise

**Summary:** Attacker compromises a dormant `.edu` inbox (adjunct, alumni, role mailbox) at a small college.

**Bypass methods relevant to M07:**

1. **Adjunct account (Method 3: password-reset via lapsed personal email).**
   - **CAUGHT (partial).** If the adjunct has departed and the directory entry has been removed, the scrape returns `directory_no_match` — caught. If the adjunct's legacy faculty page is still cached (common at small colleges), the scrape may find a stale entry — MISSED.
   - **AMBIGUOUS** on whether the directory entry persists for departed adjuncts. This varies by institution.

2. **Alumni-for-life forwarder (Method 5).**
   - **AMBIGUOUS.** Alumni are typically not listed in the people-search directory (which lists current faculty/staff/students). But some institutions list alumni in a separate directory. If the alumni directory is outside the scrape's adapter scope, the scrape returns `directory_no_match` — caught.

3. **Self-issued visiting/affiliate account (Method 6).**
   - **MISSED.** Method 6 explicitly notes: "real name on the institution's directory." The attacker, via the departmental sysadmin, has a directory entry. The scrape confirms.

**Net assessment:** Mixed. The scrape catches inbox-compromise variants where the compromised account holder is NOT in the directory (departed adjuncts, alumni). It misses variants where the attacker or the account holder IS in the directory.

---

### credential-compromise

**Summary:** Attacker compromises a real PI's `.edu` email via infostealer/breach/phishing.

**Bypass methods relevant to M07:**

1. **Compromised `.edu` email — genuine directory listing for the PI.**
   - **MISSED.** The PI has a real faculty page and directory entry. The scrape confirms. Indistinguishable from a legitimate PI.

**Net assessment:** Zero leverage. Same as account-hijack.

---

### dormant-account-takeover

**Summary:** IT admin takes over a dormant synthesis-provider account of a departed researcher.

**Bypass methods relevant to M07:**

1. **Bypass A — Redirect original holder's mailbox.**
   - **CAUGHT (partial).** If the departed researcher's directory entry has been removed, the scrape returns `directory_no_match` — caught. If the entry persists (common for months after departure at many universities), the scrape returns a match for the original holder — MISSED.

2. **Bypass C — Provision new mailbox for fabricated persona.**
   - **CAUGHT (if fabricated persona is NOT in directory) / MISSED (if IT admin also adds a directory entry).** The implementation's "Negative-signal value against: dormant-account-takeover Bypass C" note acknowledges this case. Whether the IT admin creates a directory entry for the fabricated persona determines the outcome.

**Net assessment:** Partially effective. The scrape catches cases where the departed researcher or fabricated persona is NOT in the directory. Ineffective when the IT admin controls the directory.

---

### foreign-institution

**Summary:** Attacker claims affiliation with a non-Anglophone foreign academic institution.

**Bypass methods relevant to M07:**

1. **Visiting-researcher account via local-language sysadmin request (Method 2).**
   - **MISSED.** The attacker gets a real entry on the institution's roster. The scrape — if it can parse the non-Anglophone institutional website — finds the attacker listed. If the scrape cannot parse the foreign-language site (no adapter), it returns `scrape_error` or falls back to Google site-search (m07-google-site-search).

2. **Alumni / legacy credentials (Method 3).**
   - **AMBIGUOUS.** Depends on whether the institution's directory retains alumni/former-staff entries.

3. **Semi-legitimate short visiting appointment (Method 6).**
   - **MISSED.** Same as visiting-researcher: genuine appointment → genuine directory entry in local language.

**Net assessment:** The scrape has weak leverage against foreign-institution. The branch exploits the fact that the scrape likely cannot parse non-Anglophone institutional websites (adapter coverage is concentrated on US R1/R2 universities). When it can parse, the attacker has a genuine directory entry.

---

### dormant-domain

**Summary:** Attacker acquires a defunct lab's domain and stands up a "lab website" listing themselves.

**Bypass methods relevant to M07:**

1. **Self-controlled "lab" website with attacker as listed personnel.**
   - **MISSED.** The attacker controls the "institution's" website. The scrape queries the website and finds the attacker listed as "successor researcher." `match_status = exact`. The scrape cannot distinguish a self-controlled website from a real institutional website. This is the defining structural vulnerability.

**Net assessment:** Zero leverage. The attacker controls the institution, so the institution's "directory" confirms the attacker.

---

### shell-company

**Summary:** Shell company with a self-built professional website listing the attacker as principal.

**Bypass methods relevant to M07:**

1. **Self-controlled company website.**
   - **MISSED.** The company's own website is the "institution." The scrape, if it has an adapter for the company's domain (unlikely), would find the attacker. If no adapter, the scrape falls back to Google site-search, which would find the attacker on the company's website. The scrape confirms.

**Net assessment:** Zero leverage. Same as dormant-domain — the attacker controls the "institution."

---

### shell-nonprofit

**Summary:** Shell research nonprofit with self-owned domain, possibly listed on ROR.

**Bypass methods relevant to M07:**

1. **Self-controlled shell website + ROR listing + preprint affiliations.**
   - **MISSED.** Same pattern. The attacker's website lists the attacker. Preprint affiliations (bioRxiv) and ROR listing provide additional web-findable signals that the scrape (or Google site-search fallback) would discover.

**Net assessment:** Zero leverage. Self-controlled "institution."

---

### cro-framing

**Summary:** Real LLC framed as a small CRO with a self-built one-page services website.

**Bypass methods relevant to M07:**

1. **Self-built CRO website listing attacker as principal.**
   - **MISSED.** The scrape (or Google site-search fallback) finds the attacker on the CRO's website. `match_status = exact` if the adapter works; manual-fallback confirms.

**Net assessment:** Zero leverage.

---

### cro-identity-rotation

**Summary:** Multiple LLC personas, each with its own self-controlled CRO website.

**Bypass methods relevant to M07:**

1. **Per-entity self-controlled website.**
   - **MISSED (per entity).** Each entity's website lists the attacker. Cross-entity correlation is outside the scrape's scope.

**Net assessment:** Zero leverage per entity. The rotation is invisible.

---

### biotech-incubator-tenant

**Summary:** LLC leases bench space at a biotech incubator and is listed on the incubator's tenant directory.

**Bypass methods relevant to M07:**

1. **Self-controlled LLC website + incubator tenant directory listing.**
   - **MISSED.** Two signals confirm: (a) the attacker's own LLC website, and (b) the incubator's real third-party tenant directory. The scrape finds the attacker in a legitimate third-party directory — the strongest form of confirmation.

**Net assessment:** Zero leverage. The incubator's real directory confirms the attacker's genuine tenancy.

---

### gradual-legitimacy-accumulation

**Summary:** 12+ months of legitimate-looking history, with Crunchbase, AngelList, LinkedIn, bioRxiv listings.

**Bypass methods relevant to M07:**

1. **Multiple third-party web listings (Crunchbase, AngelList, LinkedIn, bioRxiv).**
   - **MISSED.** The scrape (or Google site-search fallback) finds multiple web-listed results for the attacker associated with the LLC. The 12-month history makes the listings appear well-established.

**Net assessment:** Zero leverage. The accumulation strategy produces exactly the web signals the scrape looks for.

---

### community-bio-lab-network

**Summary:** Community-bio LLC with self-listed presence on DIYbio.org and DIYbiosphere.

**Bypass methods relevant to M07:**

1. **Self-controlled lab website + DIYbio.org listing + DIYbiosphere listing.**
   - **MISSED.** The scrape finds the attacker on the lab's website, on DIYbio.org, and on DIYbiosphere. These are self-submitted, unvetted third-party listings, but the scrape cannot distinguish self-submitted from vetted listings.

**Net assessment:** Zero leverage.

---

## Findings

### Critical

None. The directory scrape is a "low-scrutiny" check by measure design (M07's stated purpose). Its structural vulnerability — that it reads the institution's own directory, which the attacker may control or be genuinely listed in — is inherent to the measure's scope. The check's value is as a soft signal (negative-match cases create a flag for follow-up), not as a hard gate.

### Moderate

1. **Self-controlled "institutions" are indistinguishable from real institutions (dormant-domain, shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, community-bio-lab-network).**
   - Stories: 6 purpose-built-organization branches.
   - Why missed: The scrape queries whatever website is associated with the claimed institution. When the attacker controls the institution's domain, they control the directory. The scrape confirms what the attacker planted.
   - Suggestion: Not addressable by the scrape alone. Requires a complementary check that validates the institution itself (M09 — is the institution real and relevant to life sciences) before trusting its directory. The scrape should note when the "institution" is a self-owned domain (cross-reference with m02-rdap-age, m02-dangling-dns for domain age/history).

2. **Genuine-but-malicious affiliation defeats the check by design (visiting-researcher, unrelated-dept-student, lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise).**
   - Stories: 7 exploit-affiliation / impersonate-employee branches.
   - Why missed: These attackers ARE genuinely affiliated with a real institution. The directory correctly lists them. The scrape confirms a true fact. Low-scrutiny M07 cannot discriminate intent.
   - Suggestion: Structural. Higher-scrutiny measures (M18/M19/M20) are needed to evaluate legitimacy of the affiliation's purpose. This is by design — M07 is the low bar.

3. **Non-Anglophone institutional websites lack adapter coverage (foreign-institution Methods 2, 3, 6).**
   - The implementation acknowledges this: adapter coverage is concentrated on US R1/R2. Foreign institutions require per-institution adapters in local languages, which the current setup does not provide.
   - Suggestion: Stage 4 could note that foreign-institution coverage falls back to m07-google-site-search (which handles language more flexibly) rather than the HTML scrape, and that the scrape's value is US/Anglophone-focused.

### Minor

4. **Role-mailbox customers (lab-manager-voucher shared-account variant, bulk-order-noise-cover) are not handled.**
   - The scrape searches for individual names but does not specify how to handle role-mailbox customers (e.g., `genomics-core@university.edu`).
   - Suggestion: Add guidance for role-mailbox cases: if the customer's email is a role account, require an individual name and search for that individual.

5. **Department-relevance signal is not exploited.**
   - The scrape returns `matched_department` but the implementation does not flag cases where the department is irrelevant to life sciences (unrelated-dept-student bypass).
   - Suggestion: This is a design choice — M07 as scoped is "low scrutiny" and does not evaluate department relevance. If desired, a `department_relevance_flag` could be added as an informational signal for downstream measures.

6. **Stale directory entries for departed members (inbox-compromise Method 3, dormant-account-takeover Bypass A).**
   - The scrape cannot determine whether a directory entry is current or stale unless the directory exposes a date. `directory_recent_entry` fires for new entries but there is no `directory_stale_entry` concept.
   - Suggestion: For institutions where the scrape runs periodically, cache prior results and flag entries that disappear between runs (indicating the person departed). This adds a temporal dimension.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| it-persona-manufacturing Sub-path A (directory injection) | MISSED |
| it-persona-manufacturing Sub-path B (visiting-scholar appointment) | MISSED |
| it-persona-manufacturing Sub-path C (departed member's entry) | MISSED |
| it-persona-manufacturing Sub-path D (HR-system injection) | MISSED |
| visiting-researcher (genuine directory listing) | MISSED |
| unrelated-dept-student Bypass A (canonical .edu) | MISSED |
| unrelated-dept-student Bypass B (host-lab alias) | MISSED |
| lab-manager-voucher (genuine listing) | MISSED |
| lab-manager-voucher (shared departmental account) | AMBIGUOUS |
| bulk-order-noise-cover (genuine listing) | MISSED |
| bulk-order-noise-cover (role-mailbox) | AMBIGUOUS |
| insider-recruitment (genuine listing) | MISSED |
| account-hijack (inherited listing) | MISSED |
| inbox-compromise Method 3 (departed adjunct — entry removed) | CAUGHT |
| inbox-compromise Method 3 (departed adjunct — entry persists) | MISSED |
| inbox-compromise Method 5 (alumni forwarder) | AMBIGUOUS |
| inbox-compromise Method 6 (self-issued visiting account) | MISSED |
| credential-compromise (genuine PI listing) | MISSED |
| dormant-account-takeover Bypass A (departed researcher — entry removed) | CAUGHT |
| dormant-account-takeover Bypass A (departed researcher — entry persists) | MISSED |
| dormant-account-takeover Bypass C (fabricated persona, no directory entry) | CAUGHT |
| dormant-account-takeover Bypass C (fabricated persona, IT admin adds entry) | MISSED |
| foreign-institution Method 2 (visiting-researcher account) | MISSED |
| foreign-institution Method 3 (alumni/legacy credentials) | AMBIGUOUS |
| foreign-institution Method 6 (short visiting appointment) | MISSED |
| dormant-domain (self-controlled website) | MISSED |
| shell-company (self-controlled website) | MISSED |
| shell-nonprofit (self-controlled website + ROR) | MISSED |
| cro-framing (self-controlled website) | MISSED |
| cro-identity-rotation (per-entity self-controlled website) | MISSED |
| biotech-incubator-tenant (LLC website + incubator directory) | MISSED |
| gradual-legitimacy-accumulation (multiple web listings) | MISSED |
| community-bio-lab-network (self-listed on DIYbio.org) | MISSED |

## bypass_methods_uncovered

- All exploit-affiliation branches (genuine insiders): directory confirms real affiliation — structural, low-scrutiny check cannot discriminate intent
- All purpose-built-organization branches (self-controlled "institutions"): attacker controls the directory the scrape reads — structural
- IT-persona-manufacturing: attacker manufactures the directory entry the scrape reads — structural
- Foreign-institution: non-Anglophone directories lack adapter coverage — partially structural, partially addressable
- Inbox-compromise Method 6 / dormant-account-takeover Bypass C: IT admin adds directory entry — structural when attacker controls IT

---

**Verdict: PASS**

No Critical findings. The directory scrape is a low-scrutiny check by design (M07 measure scope). Its structural vulnerability — reading the same directory the attacker may control or be genuinely listed in — is inherent to the measure and is not addressable by modifying the scrape's implementation. The check's value is as a negative signal: when the scrape fails to find the customer, that is meaningful (catches departed-member compromises, fabricated personas without directory access). When the scrape succeeds, it is necessary but not sufficient — higher-scrutiny measures (M09, M18, M19, M20) are needed to evaluate the quality and legitimacy of the affiliation. The high MISSED count reflects measure scope, not implementation failure.
