# m09-irs-990 — bypass-aware hardening v1

- **measure:** M09 — institution-real-life-sciences
- **name:** IRS Form 990 / Candid / ProPublica Nonprofit Explorer cross-check
- **idea file:** `04-implementation-v1.md`

---

## Attacker story walk-through

### 1. shell-company

**Summary:** Purpose-built Delaware LLC (for-profit), builds entity signals from scratch or acquires an existing company.

**Bypass methods relevant to this measure:**

- **Build entity signals from scratch (Bypass 1):** The entity is a for-profit LLC, not a 501(c)(3). It has no Form 990.
  - **Classification: MISSED.** The check fires `no_990` but the playbook says "confirm whether the customer is even claiming 501(c)(3) status; if not, this check is N/A." The check is structurally inapplicable to for-profit entities.

- **Acquire an existing company (Bypass 2):** Same — acquired entity is a for-profit.
  - **Classification: MISSED.** N/A for for-profit entities.

**Net assessment:** Check is inapplicable. The shell-company branch uses for-profit LLCs exclusively.

---

### 2. shell-nonprofit

**Summary:** Research nonprofit shell with name near-collision, filed as 501(c)(3) or LLC. This is the primary target story for this check.

**Bypass methods relevant to this measure:**

- **Name-collision reflected legitimacy:** The attacker registers an entity name near-colliding with a real institution. If the attacker files a 501(c)(3), they would eventually need to file a Form 990. However:
  - A brand-new 501(c)(3) has no filing history in the IRS dataset for the first 12–18 months (filing lag).
  - If the nonprofit's gross receipts are < $50k, it files only a 990-N e-postcard with no financial or program data.
  - **Classification: MISSED.** During the first 1–2 years, `no_990` fires but is non-blocking (new nonprofit). After the first filing, if < $50k, `990_revenue_implausible` fires but the playbook escalates to other signals — it doesn't block. If the attacker manages to file a 990 with a plausible life-sciences mission statement (self-written), `990_program_not_life_sciences` would not fire.

- **If the attacker files as an LLC instead of 501(c)(3):** The check is N/A entirely.
  - **Classification: MISSED.**

- **Real-entity registration with virtual-office shipping:** Whether filed as LLC or 501(c)(3), the 990 check either doesn't apply (LLC) or shows minimal data (new/tiny 501(c)(3)).
  - **Classification: MISSED.**

- **NTEE code manipulation:** The attacker's 501(c)(3) application (Form 1023 or 1023-EZ) allows the applicant to describe their mission. The IRS assigns the NTEE code based on this description. A carefully written application describing "genomic research" or "public health education" would receive a life-sciences NTEE code.
  - **Classification: MISSED.** NTEE code is derived from the applicant's self-description. The check's `990_program_not_life_sciences` flag would not fire.

**Net assessment:** The check provides friction only for nonprofits that have been operating long enough to file a 990, have gross receipts > $50k (to get a full 990 vs. 990-N), and whose mission statement or NTEE code doesn't mention life sciences. The shell-nonprofit branch is designed to operate under $50k or to describe its mission in life-sciences terms, bypassing all three conditions.

---

### 3. cro-framing

**Summary:** For-profit LLC presented as a CRO.

**Bypass methods relevant to this measure:**

- All methods: The entity is a for-profit LLC. No 990 filing.
  - **Classification: MISSED.** Check is N/A.

**Net assessment:** Inapplicable.

---

### 4. cro-identity-rotation

**Summary:** 2–4 for-profit CRO LLCs.

**Bypass methods relevant to this measure:**

- All methods: For-profit LLCs. No 990 filing.
  - **Classification: MISSED.** Check is N/A.

**Net assessment:** Inapplicable.

---

### 5. biotech-incubator-tenant

**Summary:** For-profit LLC leases bench space.

**Bypass methods relevant to this measure:**

- All methods: For-profit LLC. No 990 filing.
  - **Classification: MISSED.** Check is N/A.

**Net assessment:** Inapplicable.

---

### 6. gradual-legitimacy-accumulation

**Summary:** For-profit small biotech operated for 6–12 months.

**Bypass methods relevant to this measure:**

- All methods: For-profit entity. No 990 filing.
  - **Classification: MISSED.** Check is N/A.

**Net assessment:** Inapplicable.

---

### 7. community-bio-lab-network

**Summary:** Community biology labs registered as LLCs or nonprofits.

**Bypass methods relevant to this measure:**

- **If filed as LLC:** Check is N/A.
  - **Classification: MISSED.**

- **If filed as 501(c)(3):** The community bio lab would file 990-N (< $50k revenue). `990_revenue_implausible` fires, but the implementation notes this is a "structural false positive" for community/DIY-bio nonprofits.
  - **Classification: AMBIGUOUS.** The flag fires, but the playbook escalates to other signals rather than blocking. Real community labs also trip this flag, so it's noisy.

**Net assessment:** Minimal friction. The check cannot distinguish attacker community-bio labs from legitimate ones using 990 data.

---

### 8. dormant-domain

**Summary:** Acquires lapsed domain of a defunct research entity.

**Bypass methods relevant to this measure:**

- **Acquire lapsed canonical domain + reflected legitimacy:** If the defunct entity was a 501(c)(3), its historical 990 filings exist in the IRS dataset. The attacker could present these as evidence of the entity's legitimacy.
  - **Classification: CAUGHT (partially).** The check would find historical 990 filings. However, a defunct nonprofit that has stopped filing would show a gap in recent filings. If the most recent 990 is > 2 years old, the reviewer should notice the gap. The implementation mentions checking for "most recent Form 990 in last 2 years" in the playbook.
  - **If the attacker reactivates the nonprofit and files a new 990:** The filing lag means a new 990 won't appear for 12–18 months. During this period, the stale-filing gap is visible.
  - **If the defunct entity was for-profit:** Check is N/A.
  - **Net: CAUGHT for the 501(c)(3) variant during the filing-gap period. MISSED for the for-profit variant.**

- **Self-register the revived lab:** If the attacker files a *new* 501(c)(3) with a similar name, `no_990` fires for the first 1–2 years.
  - **Classification: CAUGHT (partially).** `no_990` fires but is non-blocking.

**Net assessment:** Moderate friction for the 501(c)(3) variant of dormant-domain. The filing-gap signal is genuine but depends on reviewer attention to filing recency.

---

### 9. foreign-institution

**Summary:** Exploits verification gaps at non-Anglophone institutions.

**Bypass methods relevant to this measure:**

- All methods: Foreign institutions are not US 501(c)(3)s. No IRS 990 data.
  - **Classification: MISSED.** Check is N/A.

**Net assessment:** Inapplicable.

---

## Findings

### Finding 1 — Moderate: Check is structurally inapplicable to for-profit entities (7 of 9 stories)

- **Source:** shell-company, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, (partially) community-bio-lab-network, foreign-institution
- **Why missed:** The IRS Form 990 is filed only by tax-exempt organizations. Seven of the nine attacker stories use for-profit LLCs as their primary vehicle. The check returns `no_990` with a "not applicable" resolution for all of these. Only shell-nonprofit and dormant-domain (501(c)(3) variant) are in scope.
- **Suggestion:** This is a structural limitation of the data source, not an implementation deficiency. The check is correctly positioned for the narrow case of nonprofit-claiming customers. No implementation change would help — the data simply doesn't exist for for-profit entities.

### Finding 2 — Moderate: 990-N e-postcard provides no useful signal for small nonprofits

- **Source:** shell-nonprofit, community-bio-lab-network
- **Why missed:** Nonprofits with < $50k gross receipts file 990-N, which contains only EIN, name, address, and confirmation of small size. The attacker can keep the shell nonprofit under $50k (or truthfully report under $50k because it has minimal real revenue). No program description, no financials, no NTEE code beyond what was assigned at 501(c)(3) approval.
- **Suggestion:** For 990-N filers, the check should explicitly note that it provides no useful life-sciences-relevance signal and defer entirely to companion checks. This is essentially what the playbook does but could be more explicit.

### Finding 3 — Minor: NTEE code and mission statement are attacker-controlled

- **Source:** shell-nonprofit
- **Why missed:** The 501(c)(3) applicant writes their own mission statement on Form 1023/1023-EZ. The IRS assigns NTEE codes based on this self-description. An attacker describing their mission as "genomic research for public health" receives a life-sciences NTEE code. The `990_program_not_life_sciences` flag would not fire.
- **Suggestion:** The check should treat NTEE code and mission text as *necessary* but not *sufficient* for a life-sciences pass — i.e., a non-life-sciences NTEE adds suspicion, but a life-sciences NTEE does not add confidence. This asymmetric treatment is implicit in the playbook but could be made explicit.

### Finding 4 — Minor: Filing-gap signal for dormant-domain depends on reviewer attention

- **Source:** dormant-domain
- **Why missed:** The playbook's step 1 checks for "Form 990 in last 2 years," which would catch a defunct nonprofit's filing gap. But the gap detection depends on the reviewer noticing the most-recent-filing date, not on an automated flag. Stage 4 could add a `990_filing_stale` flag for last filing > 2 years ago.
- **Suggestion:** Add `990_filing_stale` flag: fire when the most recent 990 is > 24 months old.

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| For-profit LLC (no 990 filed) | shell-company, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation | MISSED (N/A) |
| New 501(c)(3) — no filing history yet | shell-nonprofit | MISSED (filing lag) |
| 990-N e-postcard (< $50k revenue) | shell-nonprofit, community-bio-lab-network | MISSED (no useful fields) |
| Self-written life-sciences mission statement | shell-nonprofit | MISSED (attacker-controlled) |
| Community-bio lab as LLC | community-bio-lab-network | MISSED (N/A) |
| Defunct 501(c)(3) with filing gap | dormant-domain | CAUGHT (partially — stale filing visible to reviewer) |
| Defunct for-profit entity | dormant-domain | MISSED (N/A) |
| Foreign institution | foreign-institution | MISSED (N/A) |

## bypass_methods_uncovered

| Bypass | Story | Why uncovered |
|---|---|---|
| For-profit entity structure | shell-company, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation | 990 data does not exist for for-profit entities |
| 990-N filers with no program data | shell-nonprofit, community-bio-lab-network | < $50k threshold means no useful fields |
| Attacker-written mission/NTEE | shell-nonprofit | Self-described, no verification |
| Foreign institutions | foreign-institution | Outside US IRS jurisdiction |

---

## Verdict: **PASS**

No Critical findings. The check is structurally narrow — applicable only to US 501(c)(3) organizations — and this is acknowledged in the implementation. Its value is concentrated on detecting implausible nonprofits (wrong NTEE, suspiciously low revenue, stale filings) among the subset of customers claiming 501(c)(3) status. The moderate findings (for-profit inapplicability and 990-N weakness) are structural to the data source, not implementation deficiencies. Pipeline continues to stage 6.
