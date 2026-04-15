# m02-disposable-blocklist — bypass-aware hardening v1

## Attacker stories walked

### 1. dormant-domain

**Summary:** Patient lone operator acquires a lapsed domain of a defunct research entity.

**Bypass A — Acquire the lapsed canonical domain:**
- **MISSED.** The attacker uses the defunct institution's real canonical domain (e.g., `researcher@former-institute.edu`). This is not a disposable or free-mail domain. Not in any blocklist.

**Bypass B — Dangling-DNS subdomain takeover:**
- **MISSED.** The attacker uses a subdomain of a live university (e.g., `user@lab.harvard.edu`). Not disposable, not free-mail.

**Bypass C — Typosquat / lookalike:**
- **MISSED.** The attacker registers a custom domain (`lab-genomics.org`). Not a disposable or free-mail provider. Custom domains are structurally outside this check's scope.

**Net assessment:** Zero leverage. No dormant-domain variant uses disposable or free-mail domains.

---

### 2. cro-identity-rotation

**Summary:** Individual files 2-4 CRO LLCs with custom email domains.

**Fresh domain + DNS/mail-stack maturity signaling:**
- **MISSED.** Attacker uses Google Workspace on a self-owned `.com`. The email is `principal@cro-name.com` — a custom domain, not Gmail/Yahoo/disposable. Google Workspace domains are not on free-mail lists.

**Aged-domain purchase:**
- **MISSED.** Same — custom domain, not in any blocklist.

**Net assessment:** Zero leverage.

---

### 3. cro-framing

**Summary:** Individual registers a real LLC with a self-owned domain.

**Self-owned domain workspace:**
- **MISSED.** `owner@cro-name.com` via Google Workspace. Not disposable, not free-mail.

**Net assessment:** Zero leverage.

---

### 4. shell-nonprofit

**Summary:** Shell research nonprofit with real domain.

**Stand up the shell's own domain and mailbox:**
- **MISSED.** Custom domain on Google Workspace or M365. Not in any blocklist.

**Net assessment:** Zero leverage.

---

### 5. biotech-incubator-tenant

**Summary:** LLC with incubator bench space and self-controlled domain.

**2a — Self-controlled domain + Google Workspace:**
- **MISSED.** Custom domain. Not in any blocklist.

**Net assessment:** Zero leverage.

---

### 6. gradual-legitimacy-accumulation

**Summary:** Patient individual operates a real-but-hollow biotech for 6-12 months.

**Self-owned domain:**
- **MISSED.** Custom domain. Not in blocklist.

**Net assessment:** Zero leverage.

---

### 7. community-bio-lab-network

**Summary:** Community biology labs with `.org` domains.

**Self-owned community lab domain:**
- **MISSED.** `firstname@labdomain.org`. Not disposable, not free-mail.

**Net assessment:** Zero leverage.

---

### 8. inbox-compromise

**Summary:** Attacker compromises a dormant email account at a small US college.

**Methods 1-6:**
- **MISSED (all 6).** The attacker uses a real `.edu` institutional email (e.g., `adjunct@smallcollege.edu`). Not disposable, not free-mail.

**Net assessment:** Zero leverage.

---

### 9. credential-compromise

**Summary:** Attacker compromises a real PI's `.edu` email.

**Compromised `.edu` email:**
- **MISSED.** Genuine `.edu` domain. Not in any blocklist.

**Net assessment:** Zero leverage.

---

### 10. account-hijack

**Summary:** Attacker takes over PI's existing provider account using compromised email.

**Inherited `.edu` email:**
- **MISSED.** Genuine institutional domain.

**Net assessment:** Zero leverage.

---

### 11. dormant-account-takeover

**Summary:** IT admin takes over departed researcher's dormant account.

**Bypasses A-E:**
- **MISSED (all 5).** All use genuine institutional email domains.

**Net assessment:** Zero leverage.

---

### 12. foreign-institution

**Summary:** Attacker exploits verification gaps at non-Anglophone institutions.

**Methods 1-6:**
- **MISSED (all 6).** All produce a genuine institutional email (`.edu`, `.ac.jp`, `.edu.br`, etc.). Not disposable, not free-mail.

**Net assessment:** Zero leverage.

---

### 13. it-persona-manufacturing

**Summary:** IT admin manufactures a persona on a real institutional domain.

**Sub-paths A-D:**
- **MISSED (all 4).** Manufactured email is on a genuine institutional domain.

**Net assessment:** Zero leverage.

---

### 14. visiting-researcher

**Summary:** Attacker obtains a real visiting-scholar `.edu` email.

**No bypass needed:**
- **MISSED.** Genuine `.edu` email.

**Net assessment:** Zero leverage.

---

### 15. shell-company

**Summary:** Delaware shell company with self-owned domain.

**Self-owned domain:**
- **MISSED.** Custom domain (`@shellco.com`). Not in any blocklist.

**Net assessment:** Zero leverage.

---

### 16. unrelated-dept-student

**Summary:** Enrolled student uses genuine `.edu` email.

**Bypasses A-D:**
- **MISSED (all 4).** Genuine `.edu` domain.

**Net assessment:** Zero leverage.

---

### 17. insider-recruitment

**Summary:** Legitimate insider uses own real `.edu` email.

**No bypass needed:**
- **MISSED.** Genuine institutional email.

**Net assessment:** Zero leverage.

---

### 18. lab-manager-voucher

**Summary:** Insider with legitimate ordering role.

**No bypass needed:**
- **MISSED.** Genuine institutional email.

**Net assessment:** Zero leverage.

---

### 19. bulk-order-noise-cover

**Summary:** Core facility technician uses institutional email.

**No bypass needed:**
- **MISSED.** Genuine institutional email.

**Net assessment:** Zero leverage.

---

## Findings

### Critical

None.

### Moderate

None. The universal MISSED result across all 19 stories is *expected and by design*: every wg attacker branch uses either a self-owned custom domain or a genuine institutional email. None use disposable or free-mail addresses. This check addresses a different threat vector entirely — opportunistic or low-effort attackers who try to sign up with throwaway or personal free-mail addresses rather than investing in domain infrastructure. The wg attacker branches model sophisticated adversaries who have already moved past the disposable/free-mail tier.

### Minor

**m1. No attacker branch tests the free-mail + institutional claim scenario.**
- The `free_mail_with_institution_claim` flag is designed for a customer who uses `@gmail.com` but claims an institutional affiliation. No wg branch models this specific scenario (all sophisticated branches obtain proper domain email). This means the flag's effectiveness against real-world low-effort adversaries is untested by the wg corpus, not that it's unnecessary.

## bypass_methods_known

| Story | Bypass | Classification |
|---|---|---|
| dormant-domain | Bypasses A, B, C | MISSED |
| cro-identity-rotation | Fresh domain, aged domain | MISSED |
| cro-framing | Self-owned domain | MISSED |
| shell-nonprofit | Shell domain + mailbox | MISSED |
| biotech-incubator-tenant | Self-controlled domain, age padding | MISSED |
| gradual-legitimacy-accumulation | All methods | MISSED |
| community-bio-lab-network | Self-owned `.org` domain | MISSED |
| inbox-compromise | Methods 1-6 | MISSED |
| credential-compromise | Compromised `.edu` | MISSED |
| account-hijack | Inherited `.edu` | MISSED |
| dormant-account-takeover | Bypasses A-E | MISSED |
| foreign-institution | Methods 1-6 | MISSED |
| it-persona-manufacturing | Sub-paths A-D | MISSED |
| visiting-researcher | No bypass needed | MISSED |
| shell-company | Self-owned domain | MISSED |
| unrelated-dept-student | Bypasses A-D | MISSED |
| insider-recruitment | No bypass needed | MISSED |
| lab-manager-voucher | No bypass needed | MISSED |
| bulk-order-noise-cover | No bypass needed | MISSED |

## bypass_methods_uncovered

All bypass methods from all 19 stories are uncovered — but this is structural and expected. The disposable/free-mail blocklist targets a lower tier of adversary not modeled in the wg attacker corpus. It functions as a cheap first-line filter, not as a defense against the sophisticated branches.

## Verdict

**PASS** — No Critical findings. The universal MISSED result reflects scope rather than failure: the wg attacker branches model adversaries who have moved past the disposable/free-mail tier. This check is a low-cost, high-certainty gate against low-effort signups and is complementary to the other M02 ideas. Pipeline continues to stage 6.
