# m07-google-site-search — bypass-aware hardening v1

## Attacker stories walked

### 1. it-persona-manufacturing

**Summary:** IT admin at a real university manufactures a directory entry and email for a fake persona.

**Bypass methods relevant to M07:**

- **Sub-path A — Loose-governance direct injection:** "Creates a mail alias, directory entry, and DL membership for the manufactured persona using the standard admin console. The resulting email address and directory record pass any affiliation check that queries the institution's public directory."
  - **CAUGHT — partially.** The site-search would find the injected directory entry if the institution's directory is indexed by Google/Bing. However, the hit quality would be limited to a single directory-listing page with no publications, no lab page, no news mentions. The `low_quality_hits_only` flag might fire, routing to human review — but only if the scoring heuristic is calibrated to distinguish a bare directory listing from a substantive faculty/lab page. **Net: depends on scoring heuristic calibration, which the implementation document does not specify in detail.**
  - Classification: **AMBIGUOUS** — the implementation does not define what constitutes a "quality" hit vs. a bare directory entry.

- **Sub-path B — Visiting-scholar pathway:** "Initiates a visiting-scholar appointment … with a real PI as sponsor."
  - **MISSED.** A visiting-scholar appointment at an R1 would typically generate a departmental or visitors-page listing. The site-search would find this genuine listing and return it as a hit. The check passes cleanly because the manufactured persona really is on the institution's website.

- **Sub-path C — Reuse of departed member's directory entry.**
  - **CAUGHT — partially.** If the departed member's page is cached/stale, the `low_quality_hits_only` flag might catch it (cached Wayback artifacts). But if the reactivated entry appears on the live directory, it looks indistinguishable from a current member. Classification: **AMBIGUOUS** — depends on whether the reactivated entry updates the live directory or remains stale.

- **Sub-path D — HR-system injection:** "Injects a record directly into the HR system."
  - **MISSED.** Full HR-matched identity likely produces a live, complete directory entry. Site-search returns a clean hit.

**Net assessment:** The site-search check provides very weak resistance against an IT-admin attacker at a real institution. Sub-paths B and D produce genuine web-listed personas that pass cleanly. Sub-paths A and C might trigger soft flags depending on hit-quality scoring calibration, but the implementation does not pin down the scoring logic tightly enough to be confident.

---

### 2. visiting-researcher

**Summary:** Lone operator obtains a real visiting-scholar appointment at a US/European R1 through the institution's own lightweight vetting process.

**Bypass methods:** None needed — the attacker genuinely holds a visiting appointment and is listed on the host department's website.

- **MISSED.** The site-search returns a clean hit because the attacker really is on the institution's website (visiting-scholars page, directory). The check confirms the attacker's affiliation.

**Net assessment:** Zero resistance. The check confirms rather than catches this attacker.

---

### 3. unrelated-dept-student

**Summary:** Currently enrolled grad student or postdoc in a non-wet-lab department orders sequences of concern.

**Bypass methods:**

- **Bypass A — Canonical @university.edu:** No action required; real enrolled student.
  - **MISSED.** The student has a real directory entry. Site-search returns a clean hit.

- **Bypass B — Host-lab alias:** Obtains a lab-specific alias during a legitimate rotation.
  - **MISSED.** Site-search against the university domain finds the student listed in the main directory. The lab alias is not needed for M07.

- **Bypass C — Federated login:** Authenticates via institutional SSO.
  - Not relevant to this idea (site-search, not SSO).

**Net assessment:** Zero resistance. The student is genuinely listed on the university website. The only potential signal — that the listed department is not a wet-lab one — is outside M07's scope as defined, and the site-search implementation does not check department relevance.

---

### 4. lab-manager-voucher

**Summary:** Insider whose legitimate day-job is placing orders on behalf of a PI.

**Bypass methods:** None needed — "directory listing all genuine."

- **MISSED.** Site-search returns a clean hit on the genuine directory entry.

**Net assessment:** Zero resistance. The attacker is a real employee with a real web listing.

---

### 5. bulk-order-noise-cover

**Summary:** Core facility technician or cross-PI admin exploits institutional ordering infrastructure.

**Bypass methods:** None needed — "The attacker's work email is a real institutional mailbox on a real university domain."

- **MISSED.** Real core-facility staff have a real directory entry. Site-search confirms affiliation.
- Role-mailbox sub-variant: if the named customer is a role (e.g., `genomics-core@university.edu`), a `site:` search for the role name may return the facility page rather than a person page. **AMBIGUOUS** — the implementation does not specify how to handle role/facility names vs. individual names.

**Net assessment:** Zero resistance for the individual variant. Ambiguous for the role-mailbox variant.

---

### 6. insider-recruitment

**Summary:** External handler pays a legitimate insider $1k-$5k per order to place SOC orders.

**Bypass methods:** None needed — the insider is a real employee.

- **MISSED.** Site-search confirms the real insider's genuine directory listing. The handler is invisible.

**Net assessment:** Zero resistance. The on-record customer is genuinely listed; the actual threat actor is invisible by construction.

---

### 7. account-hijack

**Summary:** Attacker compromises a PI's institutional email and takes over their synthesis-provider account.

**Bypass methods:** None needed — inherited. "The PI has a real .edu address at a real institution."

- **MISSED.** Site-search returns the genuine PI's faculty page. The hijacker operates under that identity.

**Net assessment:** Zero resistance. The named customer is a real, web-listed PI.

---

### 8. inbox-compromise

**Summary:** Lone operator compromises a dormant or lightly monitored email account at a small US college.

**Bypass methods:**

- **Adjunct account via lapsed personal email recovery:**
  - **CAUGHT — partially.** A departed adjunct's page may still be cached or live. If the page is stale/cached, the `low_quality_hits_only` flag fires. If the page is still live (legacy faculty pages often persist for years), site-search returns a clean hit. Classification: **AMBIGUOUS**.

- **Alumni-for-life forwarder:**
  - **CAUGHT — partially.** An alumni email user is unlikely to appear on the institution's *current* website. Site-search would likely return no hits or very old hits (graduation ceremony, honors list from years ago). The `no_site_search_hits` or `low_quality_hits_only` flag would fire, routing to human review. Classification: **CAUGHT** for the case where the alumni has no current web presence at the institution.

- **Self-issued visiting/affiliate account via departmental sysadmin:**
  - **AMBIGUOUS.** The attacker's "real name on the institution's directory" (per the source) means a site-search hit would appear if the directory entry is indexed. Whether this is a bare listing or a substantive page depends on how the institution formats its directory.

**Net assessment:** Moderate resistance against the alumni-forwarder variant (no web presence triggers the flag). Weak-to-no resistance against the adjunct and self-issued variants where a directory entry exists.

---

### 9. credential-compromise

**Summary:** Attacker compromises a real PI's institutional email using infostealer logs or AitM phishing.

**Bypass methods:** Compromised `.edu` email — "The attacker logs into the target's institutional mailbox."

- **MISSED.** The compromised PI has a faculty page. Site-search returns a clean hit.

**Net assessment:** Zero resistance. Same as account-hijack — the named identity is a real, web-listed person.

---

### 10. dormant-account-takeover

**Summary:** IT admin takes over a dormant synthesis-provider account belonging to a departed researcher.

**Bypass methods:**

- **Bypass A — Redirect the original holder's mailbox:**
  - **MISSED.** The original holder's faculty page is often still live for months after departure. Site-search returns a clean hit.

- **Bypass B — Re-activate a fully deprovisioned account:**
  - **AMBIGUOUS.** If the departed researcher's web page was removed, site-search might find only cached/archived hits, triggering `low_quality_hits_only`. If the page is still live, clean hit.

- **Bypass C — Provision new mailbox for fabricated persona:**
  - **CAUGHT — partially.** The fabricated persona is "not listed on the institution website by default" per the source. The `no_site_search_hits` flag would fire. However, the IT admin (as noted in the source) can extend the manufacture into the directory layer, at which point a bare directory listing appears and the question reverts to whether the scoring heuristic flags bare listings.

**Net assessment:** Moderate resistance against Bypass C (fabricated persona without directory manipulation). Weak-to-no resistance against Bypass A and the directory-extended variant of Bypass C.

---

### 11. foreign-institution

**Summary:** Lone operator exploits verification gaps at mid-tier non-Anglophone research institutions.

**Bypass methods:**

- **Visiting-researcher account via local-language sysadmin request:**
  - **MISSED.** The attacker gets listed on the institution's roster. Even if the site-search can find the page, the attacker really is listed.
  - **Additional failure mode:** The implementation acknowledges that "institution domain not crawled or sparsely indexed (small foreign universities)" is a failure mode. For non-Anglophone institutions, the site-search may return no results even for legitimate staff, producing false negatives that undermine the check's utility. The attacker may get a false `no_site_search_hits` flag — but so would legitimate customers at the same institution, diluting the signal.

- **Alumni / legacy credentials:**
  - **AMBIGUOUS.** Depends on whether stale alumni pages are indexed.

- **Semi-legitimate short visiting appointment:**
  - **MISSED.** Same as visiting-researcher: the attacker is genuinely listed.

**Net assessment:** Very weak resistance. The check either misses (attacker is genuinely listed) or produces too many false negatives at non-Anglophone institutions to be a useful signal.

---

### 12. dormant-domain

**Summary:** Patient lone operator acquires the canonical domain of a defunct research entity and stands up a "we're back" website.

**Bypass methods:**

- **Acquire the lapsed canonical domain + stand up a "lab" website:**
  - **MISSED.** The `site:<revived-domain>` search returns the attacker's own landing page listing them as "successor researcher." The check confirms affiliation because the attacker controls the institution's website.

**Net assessment:** Zero resistance. The site-search query is `site:<domain>` — and the attacker controls the domain and the website content. This is a fundamental limitation: site-search cannot distinguish a self-controlled "institution" from a legitimate third-party institution.

---

### 13. shell-company

**Summary:** Shell company with real employees; company's own domain email satisfies affiliation.

**Bypass methods:**

- **Self-controlled professional website listing the attacker as principal:**
  - **MISSED.** `site:<shell-company-domain>` returns the attacker's own website. The check confirms affiliation.

**Net assessment:** Zero resistance. Same structural limitation as dormant-domain: the attacker controls the website being searched.

---

### 14. shell-nonprofit

**Summary:** Shell research nonprofit with a self-owned domain and optional ROR self-listing.

**Bypass methods:**

- **Self-controlled domain + shell website:**
  - **MISSED.** `site:<shell-domain>` returns the attacker's own content.

- **ROR self-listing + preprints:**
  - Not directly relevant to site-search, but the preprints may also appear in site-search results if hosted on the domain.

**Net assessment:** Zero resistance. Same structural limitation.

---

### 15. cro-framing

**Summary:** Individual registers a real US LLC framed as a small CRO with a self-built one-page services website.

**Bypass methods:**

- **Self-owned domain + one-page CRO website:**
  - **MISSED.** Site-search confirms the attacker is "shown on the institution's website" because the attacker is the institution.

**Net assessment:** Zero resistance. Same structural limitation.

---

### 16. cro-identity-rotation

**Summary:** Individual files 2-4 small CRO LLCs in different biotech metros, each with its own website.

**Bypass methods:**

- **Per-entity self-controlled CRO website:**
  - **MISSED.** Each entity passes site-search independently. Cross-entity correlation is outside M07's scope.

**Net assessment:** Zero resistance per entity. The rotation pattern is invisible to this check.

---

### 17. biotech-incubator-tenant

**Summary:** LLC leases bench space at a biotech incubator; listed on incubator's public tenant directory.

**Bypass methods:**

- **Own LLC one-page website + incubator tenant directory listing:**
  - **MISSED.** Two site-search signals: `site:<llc-domain>` returns the attacker's own website; `site:<incubator-domain>` may return the tenant directory listing. Both confirm affiliation.

**Net assessment:** Zero resistance. The attacker has both a self-controlled website and a genuine third-party listing.

---

### 18. gradual-legitimacy-accumulation

**Summary:** Patient individual spends 6-12 months building a real-but-hollow small biotech.

**Bypass methods:**

- **Crunchbase, AngelList, LinkedIn, bioRxiv preprints:**
  - **MISSED (partially).** The `site:<llc-domain>` search returns the attacker's own content. The third-party listings (Crunchbase, bioRxiv) are on other domains and would not appear in a `site:<institution-domain>` query — but they would appear in broader name searches if the SOP step 2 or step 3 (manual reviewer searching Google Scholar, ORCID) is executed.

**Net assessment:** Zero resistance from the automated site-search. The manual review SOP might find the third-party listings but would interpret them as *corroboration* rather than red flags, because they are self-asserted.

---

### 19. community-bio-lab-network

**Summary:** Individual registers community biology labs as LLCs/nonprofits with real domains and DIYbio.org listings.

**Bypass methods:**

- **Self-controlled lab website + DIYbio.org / DIYbiosphere listing:**
  - **MISSED.** `site:<community-lab-domain>` returns the attacker's own content. The DIYbio.org listing is on a different domain and wouldn't appear in the `site:` query, but would appear in broader searches.

**Net assessment:** Zero resistance from the automated check. The structural limitation applies: the attacker controls the searched domain.

---

## Findings

### Finding 1 — Critical: Self-controlled domains defeat site-search by construction

**Source:** dormant-domain, shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network (8 stories).

**Why missed:** The `site:<institution-domain>` query searches the domain the *customer* claims as their institution. When the attacker controls that domain, they control the search results. The check cannot distinguish a self-controlled entity website from a legitimate third-party institutional website. This is a structural limitation of any site-restricted web search approach.

**Suggestion for stage 4 re-research:** This gap is structural and cannot be closed by tweaking the site-search implementation. The mitigation lives in *other* measures — specifically M09 (institution legitimacy checks like ROR, accreditation, publication history), M18 (institution legitimacy SOC), and the domain-age/history checks in M02. The site-search implementation document should explicitly acknowledge this structural limitation and note that site-search is only meaningful when the institution domain is independently verified as belonging to a third-party organization.

### Finding 2 — Critical: Genuine insiders and real appointees pass cleanly across all stories

**Source:** visiting-researcher, unrelated-dept-student, lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise (7 stories).

**Why missed:** These attackers hold real institutional positions (or hijack the identity of someone who does). They have genuine directory entries, faculty pages, and publication records on the institution's website. The site-search check is designed to confirm that a customer appears on their institution's website — and these attackers genuinely do. This is not a bug in the implementation; it is a *structural limitation* of M07 as scoped. Low-scrutiny affiliation confirmation cannot catch insiders or real-credential-holders who misuse their access.

**Suggestion for stage 4 re-research:** Not addressable by tweaking this idea. The gap is in M07's measure definition, not in the site-search implementation. Other measures (M15 self-declaration, M19 individual legitimacy SOC, M20 voucher legitimacy) are the intended countermeasures for insider threats.

### Finding 3 — Moderate: IT-admin directory injection produces ambiguous signal

**Source:** it-persona-manufacturing (sub-paths A, C, D), dormant-account-takeover (Bypass C extended).

**Why missed:** The implementation flags `low_quality_hits_only` for bare directory entries but does not define what constitutes "quality" vs. "bare." An IT admin who injects a directory entry creates exactly the artifact the check looks for. The scoring heuristic would need to distinguish a directory-only listing (no publications, no lab page, no news) from a substantive faculty presence — but this distinction is not specified in the implementation.

**Suggestion for stage 4 re-research:** Define the hit-quality scoring heuristic explicitly: a PASS requires at least one hit that is *not* a bare directory/contact listing — e.g., a lab page, a publication, a news article, or a departmental research page naming the person. A directory-only hit should route to the visiting-scholar SOP (m07-visiting-scholar-sop) for corroboration.

### Finding 4 — Moderate: Non-Anglophone institution coverage gap amplifies false negatives

**Source:** foreign-institution.

**Why missed:** The implementation acknowledges that "institution domain not crawled or sparsely indexed (small foreign universities)" is a failure mode. At non-Anglophone institutions, the site-search may return no results for *both* legitimate and illegitimate customers, producing a signal that cannot distinguish the two. The attacker who obtains a real visiting appointment at such an institution gets caught by the same false-negative flag as legitimate local staff — but the high false-positive rate for the institution means reviewers are likely to clear the flag routinely.

**Suggestion for stage 4 re-research:** Explicitly note that for non-Anglophone institutions with poor search-index coverage, the site-search check should be deprioritized and replaced by federation-based checks (m07-incommon-edugain) or manual institutional-contact verification (m07-visiting-scholar-sop).

### Finding 5 — Minor: Role-mailbox handling unspecified

**Source:** bulk-order-noise-cover (shared-account sub-variant).

**Why missed:** When the customer name is a role (e.g., "Genomics Core Facility") rather than a person, the site-search behavior is unspecified. The implementation assumes a person name in the query template.

**Suggestion:** Define fallback query templates for role/facility accounts.

---

## bypass_methods_known

| Story | Bypass method | Classification |
|---|---|---|
| it-persona-manufacturing | Sub-path A (directory injection) | AMBIGUOUS — depends on hit-quality scoring |
| it-persona-manufacturing | Sub-path B (visiting-scholar pathway) | MISSED |
| it-persona-manufacturing | Sub-path C (departed member's entry) | AMBIGUOUS |
| it-persona-manufacturing | Sub-path D (HR-system injection) | MISSED |
| visiting-researcher | Genuine visiting appointment | MISSED |
| unrelated-dept-student | Canonical .edu (real student) | MISSED |
| unrelated-dept-student | Host-lab alias | MISSED |
| lab-manager-voucher | Genuine employment | MISSED |
| bulk-order-noise-cover | Genuine employment | MISSED |
| bulk-order-noise-cover | Role-mailbox variant | AMBIGUOUS |
| insider-recruitment | Genuine insider | MISSED |
| account-hijack | Inherited PI identity | MISSED |
| inbox-compromise | Adjunct account recovery | AMBIGUOUS |
| inbox-compromise | Alumni-for-life forwarder | CAUGHT |
| inbox-compromise | Self-issued visiting account | AMBIGUOUS |
| credential-compromise | Compromised PI email | MISSED |
| dormant-account-takeover | Bypass A (redirect original mailbox) | MISSED |
| dormant-account-takeover | Bypass B (re-activate deprovisioned) | AMBIGUOUS |
| dormant-account-takeover | Bypass C (fabricated persona, no directory) | CAUGHT |
| dormant-account-takeover | Bypass C (fabricated persona, with directory) | AMBIGUOUS |
| foreign-institution | Visiting-researcher account | MISSED |
| foreign-institution | Alumni/legacy credentials | AMBIGUOUS |
| foreign-institution | Short visiting appointment | MISSED |
| dormant-domain | Acquire lapsed domain + fake website | MISSED |
| shell-company | Self-controlled website | MISSED |
| shell-nonprofit | Self-controlled website | MISSED |
| cro-framing | Self-built CRO website | MISSED |
| cro-identity-rotation | Per-entity self-controlled website | MISSED |
| biotech-incubator-tenant | Own website + incubator listing | MISSED |
| gradual-legitimacy-accumulation | Self-controlled website + self-asserted listings | MISSED |
| community-bio-lab-network | Self-controlled website + DIYbio listing | MISSED |

## bypass_methods_uncovered

- **Structural — self-controlled domains:** dormant-domain, shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network
- **Structural — genuine insiders / real appointees:** visiting-researcher, unrelated-dept-student, lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise
- **Implementation-specific — IT-admin directory injection:** it-persona-manufacturing sub-paths A, C, D (ambiguous; could be caught with tighter scoring heuristic)
- **Implementation-specific — non-Anglophone coverage:** foreign-institution (high false-negative rate dilutes signal)

## Verdict

**STRUCTURAL** — two Critical findings exist (Findings 1 and 2) but both represent structural limitations of the site-search approach, not implementation defects fixable in re-research. Finding 1 (self-controlled domains) is structural to any `site:<domain>` query against attacker-controlled domains. Finding 2 (genuine insiders) is structural to M07's low-scrutiny scope. These findings are routed to human review at the end of the run. The Moderate findings (3 and 4) suggest concrete improvements to the scoring heuristic and non-Anglophone fallback logic that stage 4 v2 could address, but they do not rise to Critical. Pipeline continues to stage 6.
