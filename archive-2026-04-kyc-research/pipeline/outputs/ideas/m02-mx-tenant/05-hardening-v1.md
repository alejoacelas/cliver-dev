# m02-mx-tenant — bypass-aware hardening v1

- **measure:** M02 — email-affiliation-whois
- **idea:** MX / M365 / Workspace tenant + SPF/DMARC
- **implementation reviewed:** `04-implementation-v1.md`

---

## Attacker-story walk

### dormant-domain

**Summary:** Patient operator acquires the lapsed canonical domain of a defunct research entity, stands up a mail server and website.

**Bypass A — Acquire the lapsed canonical domain:**
- **CAUGHT.** The freshly re-registered domain will likely have `mx_provider = self_hosted` or `generic_shared_hosting` rather than M365/Workspace if the attacker runs their own mail stack. `mx_self_hosted_unverified` fires. If the attacker uses Google Workspace, the `m365_no_tenant` flag would not fire (correct — no M365), but the MX classifier would return `google_workspace`, which is not itself a flag. DMARC could be configured by the attacker within weeks (domain warming). **Partial catch:** self-hosted variants are caught; Workspace-configured variants may pass if the attacker sets up SPF/DKIM/DMARC properly.
- Classification: **AMBIGUOUS** — depends on whether the attacker uses Workspace (passes) or self-hosts (caught).

**Bypass B — Dangling-DNS subdomain takeover on live parent institution:**
- **MISSED.** The parent institution's MX, SPF, DMARC, and M365 tenant are all genuine. The attacker controls a subdomain but the parent domain's DNS signals remain pristine. This check operates on the email domain; if the email is `attacker@sub.harvard.edu`, the MX for `sub.harvard.edu` may inherit the parent's MX or the attacker controls it — but the M365 tenant for `harvard.edu` still exists and is genuine. The check has no mechanism to detect subdomain-level takeovers.

**Bypass C — Typosquat / lookalike domain:**
- **CAUGHT.** `m365_tenant_brand_mismatch` fires when the freshly registered lookalike domain has no legitimate M365 tenant or has a brand name that doesn't match the claimed institution. `dmarc_missing` and `spf_missing` also likely fire on a day-old domain.

**Net assessment:** Partial value. Catches typosquats and some self-hosted variants of domain acquisition. Misses dangling-DNS subdomain takeovers entirely. Workspace-configured variants of lapsed-domain acquisition are ambiguous.

---

### cro-identity-rotation

**Summary:** Individual files 2–4 small CRO LLCs, each with a fresh custom-domain Google Workspace email.

**Fresh domain + DNS/mail-stack maturity signaling:**
- **MISSED.** Google Workspace is a legitimate mail backend. MX resolves to `ASPMX.L.GOOGLE.COM`, SPF and DMARC are configured by default in Workspace. `mx_provider = google_workspace`. M365 tenant check returns `Unknown` (correct — not M365), but no flag fires for a non-M365 domain using Workspace. No flag in the implementation catches "small commercial domain with properly configured Workspace."

**Aged-domain purchase:**
- **MISSED.** Same reasoning — Workspace MX, proper DMARC, no distinguishing signal.

**Federated login claim avoidance:**
- **N/A** — this check does not involve federated login.

**Net assessment:** No value. The CRO's self-owned domain with Workspace passes every signal this check examines. The check is structurally unable to distinguish a legitimate small biotech from a shell CRO at the MX/DMARC layer.

---

### cro-framing

**Summary:** Individual registers a real LLC framed as a small CRO, self-owned domain with Google Workspace.

**Self-owned domain workspace:**
- **MISSED.** Same as cro-identity-rotation. Workspace MX, SPF, DMARC all present and clean. No flag fires.

**Net assessment:** No value. Explicitly acknowledged in the implementation's own `false_positive_qualitative` section.

---

### shell-nonprofit

**Summary:** Shell research nonprofit with real domain, Google Workspace, 4–12 week pre-aging.

**Stand up the shell's own domain and mailbox (Workspace/M365):**
- **MISSED.** Pre-aged domain with Workspace or M365 passes all checks. If M365: `m365_tenant_present = true`, `m365_tenant_type = Managed`, brand = bare domain. The implementation notes that a bare-domain brand with no human-readable institution name is a "freshly-provisioned shell-tenant pattern" that triggers elevation. **AMBIGUOUS** — depends on whether the attacker sets a human-readable `FederationBrandName`. For Workspace: entirely missed.

**ROR self-listing:**
- **N/A** — this check does not query ROR.

**Net assessment:** Marginal value against M365 variant (bare-brand heuristic). No value against Workspace variant.

---

### biotech-incubator-tenant

**Summary:** LLC leases bench space at incubator, registers biotech-themed domain with Workspace.

**Self-controlled domain + Google Workspace:**
- **MISSED.** Workspace MX, proper SPF/DMARC. No flag fires.

**Domain age padding:**
- **MISSED.** This check does not examine domain age.

**Net assessment:** No value. Same structural weakness as all self-owned-domain branches.

---

### gradual-legitimacy-accumulation

**Summary:** Patient individual operates a real-but-hollow biotech for 6–12 months, domain aged organically.

**Self-owned domain + Workspace:**
- **MISSED.** Identical to above. Mature domain, Workspace MX, full DMARC. No signal.

**Aged domain auction purchase:**
- **MISSED.** This check does not examine domain age or WHOIS history.

**Net assessment:** No value. The attacker's patience makes every DNS signal look institutional-grade.

---

### community-bio-lab-network

**Summary:** Registers community bio labs as LLCs/nonprofits with `.org` domains and Workspace.

**Self-owned community lab domain:**
- **MISSED.** `.org` with Workspace MX, proper SPF/DMARC. No flag fires.

**Net assessment:** No value.

---

### inbox-compromise

**Summary:** Compromises a dormant institutional `.edu` inbox at a small college.

**All six bypass methods (breach-dump credential reuse, AitM phishing, lapsed personal email, helpdesk social engineering, alumni forwarder, departmental sysadmin):**
- **MISSED.** All methods result in the attacker controlling a real `.edu` mailbox on a real institutional domain. The institution's MX, SPF, DMARC, and M365/Workspace tenant are all genuine and untouched. This check has no mechanism to detect who is behind the inbox.

**Net assessment:** No value. Acknowledged in the implementation's `attacker_stories_addressed`.

---

### credential-compromise

**Summary:** Compromises a real PI's institutional email using infostealer logs or breach dumps.

**Compromised `.edu` email:**
- **MISSED.** Genuine institutional domain with genuine MX/SPF/DMARC/tenant. No signal.

**Net assessment:** No value.

---

### account-hijack

**Summary:** Compromises PI's institutional email, takes over pre-existing synthesis provider account.

**Inherited `.edu` mailbox:**
- **MISSED.** All DNS signals are the institution's real infrastructure. No signal.

**Net assessment:** No value.

---

### dormant-account-takeover

**Summary:** IT admin takes over dormant synthesis-provider account of departed researcher.

**Bypass A — Redirect mailbox (forwarding rule):**
- **MISSED.** Original institutional MX/SPF/DMARC/tenant unchanged.

**Bypass B — Re-activate deprovisioned account:**
- **MISSED.** Same institutional infrastructure.

**Bypass C — Provision new institutional mailbox:**
- **MISSED.** New mailbox on same institutional domain. All DNS signals identical.

**Bypass D — Route through institutional network:**
- **N/A** — this check examines DNS records, not login IPs.

**Bypass E — Federated login via IdP impersonation:**
- **N/A** — this check does not involve federated login.

**Net assessment:** No value. The attacker operates within genuine institutional infrastructure.

---

### foreign-institution

**Summary:** Exploits verification gaps at non-Anglophone research institutions to obtain real institutional email.

**All six methods (stale subdomain compromise, visiting-researcher account, alumni residue, AitM phishing, co-opt collaboration, short visiting appointment):**
- **MISSED.** All result in a real institutional email on a real institutional domain. MX/SPF/DMARC/tenant all genuine. Some non-Anglophone institutions self-host and may lack DMARC, but that triggers a false positive rather than a true positive — the attacker's email would be caught alongside all legitimate users of that institution.

**Net assessment:** No value against the attacker specifically. May incidentally flag some non-Anglophone institutions with weak DMARC, but this is a false-positive pathway, not a bypass-detection pathway.

---

### it-persona-manufacturing

**Summary:** IT admin manufactures a role-plausible persona on real institutional domain.

**All sub-paths (A–D):**
- **MISSED.** Manufactured persona's email is on the real institutional domain. All DNS signals are the institution's genuine infrastructure.

**Net assessment:** No value.

---

### visiting-researcher

**Summary:** Obtains real visiting-scholar appointment and genuine `.edu` credentials.

**No bypass needed:**
- **MISSED.** Real `.edu` on real institutional domain. All signals genuine.

**Net assessment:** No value.

---

### shell-company

**Summary:** Delaware LLC with real domain, self-owned Google Workspace email.

**Self-owned `@shellco.com` Workspace:**
- **MISSED.** Workspace MX, proper SPF/DMARC. No flag fires.

**Aged domain purchase:**
- **MISSED.** This check does not examine domain age.

**Net assessment:** No value. Acknowledged in the implementation.

---

### unrelated-dept-student

**Summary:** Enrolled student with real `.edu` email at a university.

**Bypass A — Canonical `@university.edu`:**
- **MISSED.** Real institutional email, real domain, real MX/SPF/DMARC/tenant.

**Bypass B — Host-lab alias:**
- **MISSED.** Same institutional domain.

**Bypass C — Federated academic login:**
- **N/A** — this check does not involve federated login.

**Bypass D — Transliteration collision:**
- **N/A** — this check does not involve name matching.

**Net assessment:** No value.

---

### insider-recruitment

**Summary:** External handler pays legitimate insider to place orders using insider's real institutional email.

**No bypass needed:**
- **MISSED.** All signals genuine by construction.

**Net assessment:** No value.

---

### lab-manager-voucher

**Summary:** Insider with legitimate ordering role uses real institutional email.

**No bypass needed:**
- **MISSED.** All signals genuine.

**Net assessment:** No value.

---

### bulk-order-noise-cover

**Summary:** Core facility technician uses real institutional email and ordering infrastructure.

**No bypass needed:**
- **MISSED.** All signals genuine.

**Net assessment:** No value.

---

## Findings

### Moderate

**M1. Self-owned commercial domain with Google Workspace passes all checks (10 stories).**
- Stories: cro-identity-rotation, cro-framing, shell-nonprofit, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, shell-company, and partially dormant-domain.
- Why missed: The MX classifier correctly identifies `google_workspace` but this is not treated as a flag. Google Workspace is used by both legitimate small biotechs and shell entities. SPF/DMARC are configured automatically by Workspace. The implementation has no signal that distinguishes the two populations.
- Suggestion: This is a structural limitation of the MX/DMARC layer. The check's value is as one input in a multi-signal stack, not as a standalone discriminator. Pairing with domain-age (m02-rdap-age), ROR cross-reference (m02-ror-domain-match), or Wayback content (m02-wayback) would close this gap for the purpose-built-organization branches.

**M2. Genuine institutional email bypasses are structurally invisible (10 stories).**
- Stories: inbox-compromise, credential-compromise, account-hijack, dormant-account-takeover, foreign-institution, it-persona-manufacturing, visiting-researcher, unrelated-dept-student, insider-recruitment, lab-manager-voucher, bulk-order-noise-cover.
- Why missed: All these attackers operate from within genuine institutional infrastructure. DNS-level signals are structurally identical to legitimate users. No DNS check can distinguish an authorized from an unauthorized user of an institutional mailbox.
- Suggestion: Not addressable by this idea. This is a structural gap in all DNS-based M02 checks. Measures 14 (identity evidence), 16 (MFA), and 19 (individual legitimacy) are the appropriate countermeasures.

### Minor

**m1. Dangling-DNS subdomain takeover not detected (1 story).**
- Story: dormant-domain Bypass B.
- Why missed: The check operates on the email domain's MX records. If `sub.harvard.edu` inherits `harvard.edu`'s MX, all signals are genuine. The implementation has no subdomain-vs-parent-domain consistency check.
- Suggestion: A separate dangling-DNS detection idea (m02-dangling-dns) exists in the pipeline and is the appropriate place to address this.

**m2. Workspace-configured variant of lapsed-domain acquisition is ambiguous (1 story).**
- Story: dormant-domain Bypass A (Workspace variant).
- Why missed: If the attacker sets up Workspace on the lapsed domain, MX/SPF/DMARC all look clean. Only the `self_hosted` variant triggers flags. The implementation does not pin down whether a Workspace-on-formerly-dead-domain scenario would be caught.
- Suggestion: Domain-age checks (m02-rdap-age) close this gap.

**m3. M365 bare-brand heuristic is easily defeated (1 story).**
- Story: shell-nonprofit (M365 variant).
- Why missed: The implementation suggests that a `FederationBrandName` matching only the bare domain (no human-readable institution name) is a shell-tenant signal. But the attacker can set `FederationBrandName` to any string (e.g., "Institute for Genomic Research") via the M365 admin portal. The heuristic is defeatable with zero additional cost.
- Suggestion: Downweight this heuristic or remove it from flag logic; it provides a false sense of detection.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| dormant-domain Bypass A (self-hosted variant) | CAUGHT |
| dormant-domain Bypass C (typosquat) | CAUGHT |
| dormant-domain Bypass A (Workspace variant) | AMBIGUOUS |
| dormant-domain Bypass B (dangling-DNS subdomain) | MISSED |
| cro-identity-rotation: fresh domain + Workspace | MISSED |
| cro-identity-rotation: aged-domain purchase | MISSED |
| cro-framing: self-owned domain Workspace | MISSED |
| shell-nonprofit: own domain + mailbox (Workspace) | MISSED |
| shell-nonprofit: own domain + mailbox (M365) | AMBIGUOUS |
| biotech-incubator-tenant: self-controlled domain + Workspace | MISSED |
| biotech-incubator-tenant: domain age padding | MISSED |
| gradual-legitimacy-accumulation: self-owned domain + Workspace | MISSED |
| gradual-legitimacy-accumulation: aged domain auction | MISSED |
| community-bio-lab-network: self-owned .org domain | MISSED |
| inbox-compromise: all 6 methods | MISSED |
| credential-compromise: compromised .edu email | MISSED |
| account-hijack: inherited .edu mailbox | MISSED |
| dormant-account-takeover: Bypasses A–E | MISSED |
| foreign-institution: all 6 methods | MISSED |
| it-persona-manufacturing: Sub-paths A–D | MISSED |
| visiting-researcher: no bypass needed | MISSED |
| shell-company: self-owned Workspace | MISSED |
| shell-company: aged domain | MISSED |
| unrelated-dept-student: Bypasses A–D | MISSED |
| insider-recruitment: no bypass needed | MISSED |
| lab-manager-voucher: no bypass needed | MISSED |
| bulk-order-noise-cover: no bypass needed | MISSED |

## bypass_methods_uncovered

- All self-owned commercial domain + Workspace/M365 variants (10 stories)
- All genuine-institutional-email variants (11 stories)
- Dangling-DNS subdomain takeover
- M365 bare-brand heuristic defeatable by setting custom FederationBrandName

---

## Verdict: **PASS**

No Critical findings. The two Moderate findings are structural to the DNS layer and acknowledged in the implementation itself. The check's value is narrow but real: it catches typosquats and some self-hosted variants, and provides one signal in a multi-idea stack. The missed categories are appropriately addressed by companion ideas (m02-rdap-age, m02-ror-domain-match, m02-wayback) and by non-M02 measures. Pipeline continues to stage 6.
