# m20-dkim-institutional-email — Bypass-aware hardening v1

**Idea under review:** `m20-dkim-institutional-email/04-implementation-v1.md`
**Measure:** M20 — Voucher-legitimacy (SOC)

---

## Attacker story walk

### lab-manager-voucher

**Summary:** Insider exploits PI/BSO rubber-stamping; in some sub-variants attacker is the voucher.

**Bypass methods relevant to M20:**

- **(b) PI rubber-stamps:** The PI sends the vouching email from their real institutional email. DKIM passes.
  - **Classification: MISSED.** The PI's institutional email is legitimate. DKIM verifies the infrastructure, not the intent.

- **(a) Attacker is the registered voucher:** Attacker sends from their own real institutional email.
  - **Classification: MISSED.** The attacker's institutional email is genuine and DKIM-signed.

- **(b') BSO-as-voucher:** BSO sends from real institutional email.
  - **Classification: MISSED.** Same.

- **(d) Recruit PI/BSO as co-conspirator:** Co-conspirator uses real institutional email.
  - **Classification: MISSED.** Same.

**Net assessment:** Structurally invisible. The check verifies the mail infrastructure, not the voucher's due diligence. All insiders have legitimate institutional email.

---

### visiting-researcher

**Summary:** Faculty sponsor vouches from institutional email.

- **All options (1–4):** The sponsor, lab manager, second lab member, or second faculty sponsor all send from legitimate institutional emails with valid DKIM.
  - **Classification: MISSED.** All vouchers have real institutional email.

**Net assessment:** Not binding. The visiting-researcher branch is specifically designed around real institutional access.

---

### unrelated-dept-student

**Summary:** Vouchers send from real institutional email.

- **All paths:** The PI, rotation host, or authorized lab member sends from their real `.edu` email.
  - **Classification: MISSED.**

**Net assessment:** Not binding.

---

### shell-nonprofit

**Summary:** Self-vouching from within the shell; escalation paths.

- **Self-vouching from accomplice on the shell's domain:** The shell registers a domain and configures DKIM. The accomplice sends from `voucher@shell-domain.org` with valid DKIM.
  - **Classification: CAUGHT (partially).** The `voucher_domain_unrelated` flag fires if the shell's domain is not in ROR or the claimed institution's canonical domain. But the implementation says "mark `voucher_email_dkim_verified`, accept" only when the domain matches the ROR institution. If the shell is *itself* the claimed institution, and it has not yet achieved ROR listing, the flag fires.
  - **But:** If the shell has managed to get a ROR listing (per the shell-nonprofit source: "submit a curation request to ROR after seeding several preprints"), the domain matches and the check passes.
  - **Classification: CAUGHT (if no ROR) / MISSED (if ROR obtained).**

- **AitM phishing of an existing institutional voucher's session:** The phished voucher's original email has valid DKIM from the real institution.
  - **Classification: MISSED.** The phished email is infrastructure-legitimate. The DKIM check cannot detect session hijacking.

- **Credential compromise of colliding institution's staff:** The compromised account sends from a real institutional email.
  - **Classification: MISSED.** Compromised-but-real institutional account produces valid DKIM.

- **Gig-platform voucher recruitment:** The recruited voucher sends from... what email? If they have an institutional email, DKIM passes. If they use a free-mail address:
  - **Classification: CAUGHT.** `voucher_domain_not_institutional` fires. The gig-platform voucher is forced to use an institutional email, which constrains the recruitment pool to people with institutional access.

- **Recruited external voucher with independent institutional affiliation:** Sends from real institutional email.
  - **Classification: MISSED.** The external voucher is at a real institution.

**Net assessment:** Catches the free-mail and ROR-absent-shell patterns. Misses all compromised/institutional-email patterns.

---

### shell-company

- **Second shell entity as voucher:** If the second shell has a newly-purchased domain with DKIM configured:
  - **Classification: CAUGHT (partially).** `voucher_domain_unrelated` fires if the domain is not ROR-listed. But the implementation note says the check "catches the shell only if the shell does not bother to set up DKIM" — and more precisely, it catches the shell only if the domain fails the ROR-canonical-domain match. A fresh domain without ROR would be flagged; one with ROR passes.

- **Recruited external voucher:** Real institutional email.
  - **Classification: MISSED.**

- **Social engineering of provider staff:** Orthogonal to DKIM.
  - **Classification: MISSED.**

**Net assessment:** Catches the lazy-shell (no ROR, no known-institution domain). Misses sophisticated shells and external vouchers.

---

### insider-recruitment

- Recruited insider sends from real institutional email.
  - **Classification: MISSED.**

---

### account-hijack

- Hijacker uses the voucher's institutional email session.
  - **Classification: MISSED.** The infrastructure produces valid DKIM.

---

### credential-compromise

- Compromised credentials → real institutional email.
  - **Classification: MISSED.**

---

### inbox-compromise

- Inbox compromise allows the attacker to send/forge emails from the compromised institutional account. If the attacker sends *through* the institution's MTA, DKIM passes.
  - **Classification: MISSED.** The implementation explicitly notes: "compromised or manufactured-but-real institutional accounts produce valid DKIM signatures."

---

### dormant-account-takeover

- Stale registered vouchers may have legitimate institutional email. If the voucher's institution is still active, DKIM passes.
  - **Classification: MISSED.**

---

### biotech-incubator-tenant

- Co-tenant has their own company email. If the company's domain has DKIM and matches their claimed affiliation:
  - **Classification: MISSED.** The co-tenant's email is legitimate.

---

### community-bio-lab-network

- Community-lab members may use the community lab's domain email.
  - **Classification: CAUGHT (partially).** If the community lab's domain is not ROR-listed or is a free-mail domain, the check flags it. But established community labs (e.g., those with domains and DKIM) would pass.

---

### cro-framing

- CRO has its own domain with DKIM configured. Fake "client institution" voucher sends from the client's domain (which the attacker controls).
  - **Classification: CAUGHT (partially).** The fake client's domain must pass the ROR check. If it doesn't have ROR listing → flagged.

### cro-identity-rotation

- Each rotated CRO identity needs a new domain. DKIM setup is trivial.
  - **Classification: CAUGHT (partially).** Same — flagged if no ROR. But domain + DKIM setup is trivial; the ROR check is the binding element.

---

### gradual-legitimacy-accumulation

- Cultivated voucher has real institutional email.
  - **Classification: MISSED.**

---

### dormant-domain

- **The attacker controls the revived dormant domain and sets up DKIM.** The implementation explicitly calls this out: "a revived dormant institutional domain with newly-set-up DKIM passes the check trivially."
  - **Classification: MISSED.** The check binds to current DKIM, not institutional historical legitimacy.

---

### foreign-institution

- Foreign institution colleague sends from their institutional email.
  - **Classification: CAUGHT (partially).** The check verifies DKIM, and the implementation notes "in international and small-institution populations, DKIM/DMARC adoption is materially lower and false-positive rates could reach 10–25%." A foreign institution without DKIM would fail, but that's a false positive on the *legitimate* foreign voucher, not a catch of the attacker. If the foreign institution has proper DKIM, the attacker's voucher passes.
  - **Net: AMBIGUOUS.** DKIM adoption is a property of the voucher's institution, not the attacker's behavior.

---

### it-persona-manufacturing

- Second manufactured persona sends from real institutional email (created by IT admin).
  - **Classification: MISSED.** IT admin creates the mailbox; DKIM is valid.

---

### bulk-order-noise-cover

- Voucher sends from real institutional email.
  - **Classification: MISSED.**

---

## Findings

### Critical

None.

### Moderate

**M1. The check is a floor, not a discriminator, for institutional-access attackers.**
- Stories: `lab-manager-voucher`, `visiting-researcher`, `unrelated-dept-student`, `insider-recruitment`, `it-persona-manufacturing`, `bulk-order-noise-cover`, `gradual-legitimacy-accumulation`.
- Why missed: Any attacker with access to a real institutional mailbox produces valid DKIM. The check eliminates free-mail and lookalike-domain vouchers but cannot distinguish a rubber-stamping PI from a diligent PI, or a compromised account from a legitimate one.
- Suggestion: None within DKIM. This is structural — DKIM verifies infrastructure, not intent or due diligence. The check is correctly framed as a "floor."

**M2. Dormant-domain revival trivially passes DKIM.**
- Story: `dormant-domain`.
- Why missed: Setting up DKIM on a newly-acquired domain is a 15-minute operation. The check verifies *current* DKIM configuration, not domain history.
- Suggestion: Cross-link with m02-rdap-age or m02-wayback for domain-age/history checks. A domain whose WHOIS registration is recent but whose historical publication trail is old should flag.

**M3. Shell entities can configure DKIM on fresh domains.**
- Stories: `shell-nonprofit`, `shell-company`, `cro-framing`, `cro-identity-rotation`.
- Why missed: DKIM setup is trivial. The binding element is the ROR-canonical-domain check (`voucher_domain_unrelated`), not DKIM itself.
- Suggestion: The implementation already couples DKIM with ROR domain matching. The value is in the *combination* — DKIM alone would not block shells. Make this coupling explicit as a requirement, not optional.

**M4. Compromised institutional accounts produce valid DKIM.**
- Stories: `credential-compromise`, `inbox-compromise`, `account-hijack`.
- Why missed: Structural. DKIM authenticates the mail server, not the user sitting at the keyboard.
- Suggestion: None within DKIM. These are authentication-layer attacks (M14/M16 territory).

### Minor

**m1. ARC fallback opens a subtle attack surface.**
- Detail: The implementation supports ARC as a fallback when DKIM breaks on forwarding. An attacker who can inject a fraudulent ARC seal (by controlling an intermediate MTA) could forge the authentication chain.
- Suggestion: Validate ARC only from known, trusted intermediate MTAs (e.g., Google, Microsoft). Reject ARC from unknown intermediaries.

**m2. Foreign-institution DKIM adoption gap.**
- Story: `foreign-institution`.
- Detail: The check false-positives on legitimate foreign vouchers at institutions with poor DKIM adoption. This degrades the check's utility for international cases.
- Suggestion: Acknowledge; consider exempting or relaxing for regions with known low DKIM adoption (with compensating controls).

---

## bypass_methods_known

| Bypass | Story | Classification |
|---|---|---|
| Real institutional email (insider) | lab-manager-voucher (all variants), insider-recruitment, bulk-order-noise-cover | MISSED |
| Real institutional email (visitor/student) | visiting-researcher, unrelated-dept-student | MISSED |
| Real institutional email (cultivated) | gradual-legitimacy-accumulation | MISSED |
| DKIM on newly-purchased shell domain | shell-nonprofit, shell-company | CAUGHT (if no ROR) / MISSED (if ROR obtained) |
| Free-mail voucher | shell-nonprofit (gig-platform variant) | CAUGHT |
| Lookalike domain | lookalike-voucher-domain (per spec) | CAUGHT |
| Dormant-domain revival with DKIM | dormant-domain | MISSED |
| Compromised institutional account | credential-compromise, inbox-compromise, account-hijack | MISSED |
| Dormant-account stale voucher | dormant-account-takeover | MISSED |
| IT-manufactured persona email | it-persona-manufacturing | MISSED |
| CRO domain with DKIM | cro-framing, cro-identity-rotation | CAUGHT (if no ROR) |
| Community-lab domain | community-bio-lab-network | CAUGHT (partially — if no ROR) |
| Foreign institution with DKIM | foreign-institution | MISSED (if DKIM present) / AMBIGUOUS (if DKIM absent) |

## bypass_methods_uncovered

- All real-institutional-email patterns (insiders, visitors, students, cultivated vouchers)
- Dormant-domain DKIM revival
- Compromised/hijacked institutional accounts
- Shell domains with ROR listing
- IT-manufactured persona email accounts
- ARC chain injection from untrusted intermediaries

---

## Verdict: **PASS**

No Critical findings. The check is correctly framed as a floor that eliminates the laziest attacker patterns (free-mail, lookalike domain, no-DKIM shell domain). Its coupling with the ROR-domain-match check is the real discriminator for shells. The structural limitation — DKIM verifies infrastructure, not intent — is acknowledged and not addressable within this check. Pipeline continues to stage 6.
