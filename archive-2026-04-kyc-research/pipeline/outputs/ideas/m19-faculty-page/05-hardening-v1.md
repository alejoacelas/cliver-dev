# m19-faculty-page — bypass-aware hardening v1

- **measure:** M19 — individual-legitimacy-soc
- **name:** Faculty / lab page + institutional directory
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walk

### visiting-researcher

**Summary:** Obtains a real visiting-scholar appointment at a university; genuine .edu credentials; thin footprint.

**Bypass methods relevant to this measure:**

1. **"Piggyback on host-lab publication trail / institution signal dominance"** — the visitor may or may not appear on a lab page.
   - **Classification: AMBIGUOUS.** Whether a visiting scholar gets listed on a lab or department page varies by institution. Some labs routinely list visitors on their "People" pages; many do not. If listed, `faculty_page_present` fires with a role keyword like "Visiting Scholar" — which is a legitimate research role, so no `faculty_page_role_mismatch`. If not listed, `no_faculty_page` fires.
   - **Detail needed:** How does the reviewer treat "Visiting Scholar" as a role? The implementation lists role keywords including `Visiting Scholar`, suggesting it would be treated as a positive match.

2. **"Self-asserted ORCID with host-university affiliation"** — N/A for this check.

3. **"LLM-assisted draft methods paper" / "Real minor footprint (preprint)"** — N/A for this check (publication data is separate).

**Net assessment:** The check provides genuine signal here. If the visiting researcher is NOT on a lab page, `no_faculty_page` fires — useful as a soft negative. If they ARE on a lab page, the check correctly validates them as having institutional presence. The issue is that a visiting-scholar appointment that produces a lab-page listing is a real institutional signal, so the check correctly passes it — the bypass is at the appointment-granting level, not the web-presence level.

---

### unrelated-dept-student

**Summary:** Real grad student in a non-wet-lab department; real .edu, thin footprint.

**Bypass methods relevant to this measure:**

1. **"Reflected legitimacy from home institution"** — the student appears in the university directory and potentially on a department page.
   - **Classification: CAUGHT (partial).** The student would likely appear in the m07 directory (real student). Whether they appear on a faculty/lab page depends on their department — a CS or economics student probably has no lab page in a biology department. `no_faculty_page` might fire if the search is restricted to life-sciences-relevant pages. But if the search just looks for the name on any institutional page, the student's department page would match.
   - **Risk:** The `faculty_page_role_mismatch` flag should fire if the student's listed department/role is non-life-sciences (e.g., "PhD Student, Department of Computer Science"). But the implementation's role-keyword extraction would need to be sensitive to *department context*, not just role title. A "PhD Student" in CS is different from a "PhD Student" in Molecular Biology.

2. **"Grad-student footprint floor"** — population-normal thin footprint.
   - **Classification: AMBIGUOUS.** The student may have a department page listing. Whether the check can distinguish a CS student from a biology student depends on the role/department extraction logic, which the implementation describes as "regex match against customer name + alias variants" with "role keywords nearby." It does not specify department-context extraction.

**Net assessment:** The check provides partial signal. A student in an unrelated department would likely appear on the university site but potentially in a non-life-sciences context. The `faculty_page_role_mismatch` flag could catch this if department context is extracted — but the implementation's extraction logic is not specified at that level of granularity.

---

### lab-manager-voucher

**Summary:** Insider with a legitimate lab-ordering role; real credentials.

**Bypass methods relevant to this measure:**

1. **Real credentials and genuine institutional web presence.** — Lab managers/techs often appear on lab "People" pages.
   - **Classification: MISSED (structural).** If the lab manager appears on the PI's lab page (common), `faculty_page_present` fires with a role like "Lab Manager" or "Research Technician" — a legitimate research-adjacent role. The check correctly validates them. The bypass is that the insider is acting maliciously despite being legitimate; the check cannot detect intent.

**Net assessment:** Zero signal. The insider's web presence is genuine.

---

### it-persona-manufacturing

**Summary:** IT admin manufactures a researcher persona with real institutional credentials.

**Bypass methods relevant to this measure:**

1. **"Loose-governance direct injection"** — IT admin creates a directory entry and potentially a department page listing.
   - **Classification: CAUGHT (moderate).** The manufactured persona would appear in the directory (via m07 cross-check) but may NOT appear on a lab/faculty page (which is typically maintained by the lab, not by IT). `faculty_page_directory_mismatch` would fire — directory presence but no lab page.
   - **However:** If the IT admin also creates a faculty-page entry (editing the lab's CMS), this check would be defeated. The question is whether IT admins have CMS access to lab pages — at many institutions, lab pages are maintained by individual labs, not central IT.

2. **"Visiting-scholar / affiliate-program pathway"** — if the IT admin uses an official visiting-scholar process, the persona might eventually get a lab-page listing.
   - **Classification: AMBIGUOUS.** Depends on whether the sponsoring PI updates their lab page. The `faculty_page_recent_only` flag (Wayback shows no snapshot before 90 days) would fire if the page was just created.

**Net assessment:** The check provides moderate signal here, primarily via `faculty_page_directory_mismatch` (in directory but not on any lab page) and `faculty_page_recent_only` (page freshly created). This is one of the better-positioned stories for this check.

---

### dormant-account-takeover

**Summary:** Take over a dormant real researcher's provider account.

**Bypass methods relevant to this measure:**

1. **Original researcher's web presence** — the dormant researcher may still have a faculty page, or it may have been removed.
   - **Classification: AMBIGUOUS.** If the researcher left the institution, their page may be gone → `no_faculty_page` fires (useful signal that the customer account is stale). If the page still exists (common for retired emeritus or recently departed), the check validates.

**Net assessment:** Partial signal. The check could detect stale accounts if the researcher's page has been removed. But page removal lags departure by months or years at many institutions.

---

### account-hijack

**Summary:** Hijack a real PI's active session.

**Bypass methods relevant to this measure:**

1. **Real PI with active faculty page.**
   - **Classification: MISSED.** The PI's faculty page exists and validates. The hijack is invisible.

**Net assessment:** Zero signal.

---

### foreign-institution

**Summary:** Claim affiliation with a foreign institution.

**Bypass methods relevant to this measure:**

1. **Foreign institution web presence** — the customer claims to be at a foreign institution; the check searches that institution's domain.
   - **Classification: AMBIGUOUS.** Foreign institutional websites may or may not list researchers in a Google-indexable format. Non-English pages reduce PSE effectiveness. Sites that use JS-heavy rendering or non-standard URL structures make search unreliable.
   - The `no_faculty_page` flag would fire if the search returns nothing — but this is expected for many foreign institutions.

**Net assessment:** Weak signal. The check's effectiveness is heavily dependent on the foreign institution's web infrastructure.

---

### dormant-domain

**Summary:** Revive a defunct institution's domain; present as a researcher there.

**Bypass methods relevant to this measure:**

1. **"Thin-but-checkable website"** — the attacker stands up a website on the revived domain including a "lab page" naming themselves.
   - **Classification: CAUGHT (moderate).** The PSE search restricted to the institution's domain would find the attacker's self-created lab page. HOWEVER: the `faculty_page_recent_only` flag (Wayback shows no snapshot before 90 days) would fire, detecting that the page is freshly created. The attacker could defeat this by pre-aging the page via Wayback Machine "Save Page Now" — but the implementation checks for *prior* snapshots, not self-initiated saves.
   - **Residual risk:** Wayback does not distinguish between organic crawls and user-initiated saves. An attacker who saves their page to Wayback early in the domain-aging process would create a snapshot that looks organic.

2. **"Acquire the lapsed canonical domain"** — the original institution's lab pages are archived in Wayback. The attacker could recreate similar pages.
   - **Classification: CAUGHT (partial).** New pages on the revived domain would trip `faculty_page_recent_only`. Old pages visible only in Wayback (not live) would not be found by PSE — the check searches the live site. If the attacker recreates pages matching Wayback archives, the pages would appear live but `faculty_page_recent_only` would depend on when the attacker stood up the site.

**Net assessment:** Moderate signal via the `faculty_page_recent_only` flag, but defeats are available through page pre-aging.

---

### insider-recruitment

**Summary:** Recruit a real insider.

1. **Real insider with genuine web presence.**
   - **Classification: MISSED (structural).** The insider has a legitimate faculty/lab page.

**Net assessment:** Zero signal.

---

### bulk-order-noise-cover

**Summary:** Established individual hides SOC orders in high volume.

1. **Real researcher with genuine web presence.**
   - **Classification: MISSED (structural).**

**Net assessment:** Zero signal.

---

## Findings

### Critical

*None.*

### Moderate

**M1. Wayback Machine pre-aging can defeat the `faculty_page_recent_only` flag.**
- **Source:** dormant-domain, bypass "Thin-but-checkable website."
- **Why missed:** Wayback does not distinguish organic crawls from user-initiated "Save Page Now" requests. An attacker who saves their fabricated lab page to Wayback during the domain-aging phase creates a snapshot that looks like an organic prior capture.
- **Suggestion:** Cross-reference the Wayback snapshot timestamp against the domain's WHOIS creation date and crt.sh first-cert date. A Wayback snapshot of a "lab page" at a domain whose WHOIS creation postdates the snapshot timestamp is physically impossible (save for domain re-registration cases, which is exactly the dormant-domain scenario). This cross-check would require integrating m18-lookalike-domain's WHOIS/crt.sh signals.

**M2. Department/role context extraction is underspecified.**
- **Source:** unrelated-dept-student.
- **Why missed:** The implementation extracts role keywords ("PhD student," "Postdoc," etc.) but does not specify how department context is extracted or used. A "PhD Student" in a non-life-sciences department should trigger `faculty_page_role_mismatch` but the implementation's regex approach may not capture department association.
- **Suggestion:** Extend the role-extraction logic to pair role keywords with department/field context from the surrounding page text. Flag if the detected department has no life-sciences relevance.

### Minor

**m1. Google PSE Custom Search JSON API end-of-life by Jan 2027.**
- **Source:** Implementation's `endpoint_details`.
- **Why minor:** Already documented. The implementation notes the need to migrate. Not a bypass issue but an operational risk.

**m2. JS-rendered institutional pages reduce PSE effectiveness.**
- **Source:** Implementation's `failure_modes_requiring_review`.
- **Why minor:** Already documented. Some institutional sites use client-side rendering that PSE may not fully index.

**m3. Common-name collisions on the same institutional domain.**
- **Source:** Implementation's `failure_modes_requiring_review`.
- **Why minor:** Already documented. Multiple "John Smith"s at one university could produce false positives.

---

## bypass_methods_known

| Bypass method | Source story | Classification |
|---|---|---|
| Visiting-scholar lab page listing | visiting-researcher | AMBIGUOUS |
| Reflected legitimacy / department page | unrelated-dept-student | CAUGHT (partial) |
| Real lab-manager web presence | lab-manager-voucher | MISSED (structural) |
| IT-injected directory entry | it-persona-manufacturing | CAUGHT (moderate) |
| Dormant researcher's stale page | dormant-account-takeover | AMBIGUOUS |
| Active PI's live page | account-hijack | MISSED |
| Foreign institution web presence | foreign-institution | AMBIGUOUS |
| Self-created lab page on revived domain | dormant-domain | CAUGHT (moderate, defeatable via pre-aging) |
| Real insider's web presence | insider-recruitment | MISSED (structural) |
| Established researcher's web presence | bulk-order-noise-cover | MISSED (structural) |

## bypass_methods_uncovered

| Bypass method | Source story | Why uncovered |
|---|---|---|
| Pre-aged lab page via Wayback | dormant-domain | Wayback cannot distinguish organic vs. user-initiated saves |
| Non-life-sciences student on department page | unrelated-dept-student | Department context extraction underspecified |
| Real insider / established researcher | lab-manager-voucher, insider-recruitment, bulk-order-noise-cover, account-hijack | Check validates genuine web presence |

---

## Verdict: **PASS**

No Critical findings. The moderate findings (Wayback pre-aging defeat, underspecified department extraction) are refinement-level issues. The check provides genuine signal for the it-persona-manufacturing and dormant-domain stories via the `faculty_page_directory_mismatch` and `faculty_page_recent_only` flags. Its structural inability to detect malicious insiders or account hijackers is expected — those are authentication/intent problems, not legitimacy-verification problems.
