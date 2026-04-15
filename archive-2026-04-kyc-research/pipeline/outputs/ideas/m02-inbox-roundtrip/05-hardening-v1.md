# m02-inbox-roundtrip — bypass-aware hardening v1

## Attacker stories walked

### 1. dormant-domain

**Summary:** Patient lone operator acquires a lapsed canonical domain of a defunct research entity and presents as a successor researcher.

**Bypass A — Acquire the lapsed canonical domain:**
- **CAUGHT.** The attacker must stand up a mail server on the acquired domain and receive the verification email. The inbox round-trip *does* succeed (the attacker controls the inbox), so in that narrow sense the check "passes." However, the implementation documents that the audit record (token issuance + click timestamps) proves the inbox was reachable at signup time. The check itself does not block this attacker — it confirms inbox control, which the attacker has.
- **Reclassified: MISSED.** The round-trip verification confirms the attacker controls the inbox, which they do by construction. The check passes for the attacker. The implementation's own `record_left` section explicitly acknowledges this: "necessary but insufficient."

**Bypass B — Dangling-DNS subdomain takeover:**
- **MISSED.** If the attacker has taken over a subdomain and set up mail for it, the round-trip email arrives and the attacker clicks through. Same analysis: the check confirms inbox control, which the attacker has.

**Bypass C — Typosquat / lookalike:**
- **MISSED.** The attacker registered the typosquat domain and controls its inbox. Round-trip passes.

**Net assessment:** Zero blocking power. Round-trip verification confirms inbox control, which every dormant-domain variant has by design. The audit value (proving the inbox was live at signup) exists but does not prevent the attack.

---

### 2. cro-identity-rotation

**Summary:** Individual files 2-4 CRO LLCs with custom email domains.

**Fresh domain + DNS/mail-stack maturity signaling:**
- **MISSED.** Attacker owns the domain and inbox. Round-trip passes trivially. The implementation's click-metadata checks (datacenter IP, bot UA, sub-2s latency) would not fire — the attacker is a real human clicking from a normal browser.

**Aged-domain purchase:**
- **MISSED.** Same — attacker controls inbox.

**Net assessment:** Zero leverage.

---

### 3. cro-framing

**Summary:** Individual registers a real LLC with self-owned domain.

**Self-owned domain workspace:**
- **MISSED.** Attacker controls inbox. Round-trip passes. Click metadata is clean (real human, real browser, plausible location).

**Net assessment:** Zero leverage.

---

### 4. shell-nonprofit

**Summary:** Shell research nonprofit with real domain.

**Stand up the shell's own domain and mailbox:**
- **MISSED.** Attacker controls inbox. Round-trip passes.

**Net assessment:** Zero leverage.

---

### 5. biotech-incubator-tenant

**Summary:** LLC with incubator bench space, self-controlled domain.

**2a — Self-controlled domain + Google Workspace:**
- **MISSED.** Attacker controls inbox. Round-trip passes.

**Net assessment:** Zero leverage.

---

### 6. gradual-legitimacy-accumulation

**Summary:** Patient individual with 6-12 months of domain aging.

**All methods:**
- **MISSED.** Attacker controls inbox throughout. Round-trip passes cleanly with 6-12 months of mail-server history.

**Net assessment:** Zero leverage.

---

### 7. community-bio-lab-network

**Summary:** Community biology labs with `.org` domains.

**Self-owned community lab domain:**
- **MISSED.** Attacker controls inbox. Round-trip passes.

**Net assessment:** Zero leverage.

---

### 8. inbox-compromise

**Summary:** Attacker compromises a dormant email account at a small US college.

**Method 1 — Breach-dump credential reuse:**
- **MISSED.** Attacker has login access to the real `.edu` inbox. Verification email arrives at the institutional mailbox; attacker logs in (via residential proxy) and clicks the link. Click metadata may show a residential IP near the institution — consistent with expected behavior. The implementation's `roundtrip_clicked_suspicious` flag checks for datacenter IP and headless UA, but a residential proxy with a real browser bypasses both.

**Method 2 — AitM phishing:**
- **MISSED.** If the attacker has a live session token, they can intercept the verification email in real-time and click through. Click metadata shows the attacker's IP (proxied), not the institution's — but the implementation's suspicion heuristic looks for datacenter IPs, not geographic mismatch specifically (geographic mismatch is mentioned only in the reviewer playbook, not as an automated flag).

**Method 3 — Lapsed personal email password reset:**
- **MISSED.** Attacker gains full account access. Round-trip passes as in Method 1.

**Method 4 — Helpdesk social engineering:**
- **MISSED.** Full account access. Round-trip passes.

**Method 5 — Alumni-for-life forwarder:**
- **AMBIGUOUS.** If the alumni forwarder silently forwards to the attacker's real email, the attacker clicks from their own IP/browser. The implementation flags "multiple distinct click sources in a short window (forwarding rule pattern)" — but a forwarder typically produces a single click, not multiple. The `roundtrip_clicked_suspicious` flag for forwarding patterns is described but the detection mechanism is vague. If the forwarding creates a visible forwarding header or the click comes from a geographically distant IP, the manual reviewer *might* catch it — but this depends on reviewer diligence and is not automated.

**Method 6 — Self-issued visiting/affiliate account:**
- **MISSED.** Attacker has a legitimate institutional account. Round-trip passes natively.

**Net assessment:** Very weak. All six methods produce inbox control sufficient to click the verification link. The click-metadata heuristics (datacenter IP, bot UA) are designed for automated bots, not for human attackers using residential proxies or VPNs. The implementation explicitly acknowledges in `record_left` that inbox-compromise branches "authentically pass round-trip verification because the attacker controls the real inbox."

---

### 9. credential-compromise

**Summary:** Attacker compromises a real PI's `.edu` email.

**Compromised `.edu` email:**
- **MISSED.** Attacker logs into the PI's mailbox and clicks the verification link. Click metadata may differ from the PI's normal patterns, but this is a reviewer-level check, not an automated flag. The implementation does not compare click metadata against prior login patterns.

**Net assessment:** Zero blocking power. Implementation explicitly acknowledges this category passes.

---

### 10. account-hijack

**Summary:** Attacker takes over PI's existing provider account.

**Inherited `.edu` email:**
- **MISSED.** The PI's email was already verified at onboarding. If the provider re-verifies at order time, the attacker can click through using the compromised inbox. No signal fires.

**Net assessment:** Zero leverage.

---

### 11. dormant-account-takeover

**Summary:** IT admin takes over departed researcher's dormant account.

**Bypass A — Redirect mailbox (forwarding rule):**
- **AMBIGUOUS.** The forwarding rule sends the verification email to the attacker. The attacker clicks from their own location. The implementation mentions flagging "forwarding rule pattern" but does not specify how forwarding is detected from the provider's side — the provider sees a click from an IP, not the mail routing path. If the click IP is an institutional IP (attacker uses campus VPN per Bypass D), no anomaly is detected.

**Bypass B — Reactivate deprovisioned account:**
- **MISSED.** Attacker has direct login access to the restored mailbox. Round-trip passes.

**Bypass C — Provision new institutional mailbox:**
- **MISSED.** New mailbox under a real `.edu` subdomain. Round-trip passes natively.

**Bypass D — Route through institutional VPN:**
- **MISSED.** Click comes from institutional IP range. All metadata looks normal.

**Bypass E — Federated login IdP impersonation:**
- Not directly relevant to email round-trip (this is about federated auth, not email verification).

**Net assessment:** Zero to negligible leverage. The IT admin controls the mail infrastructure itself.

---

### 12. foreign-institution

**Summary:** Attacker obtains real institutional email at non-Anglophone institution.

**Methods 1-6:**
- **MISSED (all 6).** Each method produces a real institutional inbox the attacker controls. Round-trip verification passes. Click metadata from a foreign IP is consistent with a non-Anglophone institution.

**Net assessment:** Zero leverage.

---

### 13. it-persona-manufacturing

**Summary:** IT admin manufactures a persona on real institutional domain.

**Sub-paths A-D:**
- **MISSED (all 4).** The manufactured mailbox receives verification email. IT admin clicks from institutional network. All metadata clean.

**Net assessment:** Zero leverage.

---

### 14. visiting-researcher

**Summary:** Attacker obtains real visiting-scholar `.edu` email.

**No bypass needed:**
- **MISSED.** Genuine `.edu` inbox. Round-trip passes natively.

**Net assessment:** Zero leverage.

---

### 15. shell-company

**Summary:** Delaware shell company with self-owned domain.

**Self-owned domain:**
- **MISSED.** Attacker controls inbox. Round-trip passes.

**Net assessment:** Zero leverage.

---

### 16. unrelated-dept-student

**Summary:** Enrolled student uses genuine `.edu` email.

**Bypasses A-D:**
- **MISSED (all 4).** Genuine institutional inbox. Round-trip passes natively.

**Net assessment:** Zero leverage.

---

### 17. insider-recruitment

**Summary:** Legitimate insider uses own real `.edu` email.

**No bypass needed:**
- **MISSED.** Genuine inbox. Round-trip passes.

**Net assessment:** Zero leverage.

---

### 18. lab-manager-voucher

**Summary:** Insider with legitimate ordering role.

**No bypass needed:**
- **MISSED.** Genuine inbox. Round-trip passes.

**Net assessment:** Zero leverage.

---

### 19. bulk-order-noise-cover

**Summary:** Core facility technician uses institutional email.

**No bypass needed:**
- **MISSED.** Genuine inbox. Round-trip passes.

**Net assessment:** Zero leverage.

---

## Findings

### Critical

None. The universal MISSED result is *structural and expected*. Inbox round-trip verification is a necessary-but-insufficient baseline check: it confirms the customer controls the claimed email address at signup time. Every wg attacker branch either (a) owns the domain and therefore the inbox, or (b) has compromised a real institutional inbox. In both cases, round-trip verification passes by the attacker's design. The implementation explicitly acknowledges this structural limitation in its `record_left` section. The check's value is as a baseline gate (preventing claims of inbox control that don't exist) and as an audit artifact (proving the inbox was live at a specific time). It is not — and is not intended to be — a defense against sophisticated attackers who have invested in inbox control.

### Moderate

**M1. Click-metadata heuristics are too narrow to catch human-operated compromised inboxes.**
- The `roundtrip_clicked_suspicious` flag checks for datacenter IP, headless UA, and sub-2s latency. These heuristics target automated bots, not human attackers using residential proxies or VPNs. The inbox-compromise branch explicitly models residential-proxy use. The geographic-mismatch check is in the reviewer playbook but not automated.
- Suggestion: Add automated geographic comparison between claimed institution location and click IP geolocation. This would not catch VPN/proxy use but would catch careless attackers. However, false-positive risk is high (researchers travel, use VPNs legitimately).

**M2. Forwarding-rule detection is underspecified.**
- The implementation flags "multiple distinct click sources in a short window" as a forwarding pattern, but forwarding typically produces a single click from the forwarding destination, not multiple clicks. The detection mechanism for mail forwarding (as distinct from a direct click by a compromised-account user) is not defined.
- Suggestion: Specify what forwarding-detection signals actually look like from the provider's vantage point. Consider checking `Received` headers in the email delivery chain (if the provider's mailer logs them), though this requires inbound mail analysis, not outbound verification.

### Minor

**m1. URL-scanner false positives are acknowledged but mitigation is vague.**
- The implementation mentions Proofpoint/Mimecast/Safe Links auto-clicking verification links as a known false-positive source and says "detect known scanner UAs and require a second human click." The specific scanner UA strings are not listed, and the "second click" mechanism is not specified.

## bypass_methods_known

| Story | Bypass | Classification |
|---|---|---|
| dormant-domain | Bypass A — acquire lapsed domain | MISSED |
| dormant-domain | Bypass B — dangling-DNS subdomain takeover | MISSED |
| dormant-domain | Bypass C — typosquat | MISSED |
| cro-identity-rotation | Fresh domain, aged domain | MISSED |
| cro-framing | Self-owned domain | MISSED |
| shell-nonprofit | Shell domain + mailbox | MISSED |
| biotech-incubator-tenant | Self-controlled domain, age padding | MISSED |
| gradual-legitimacy-accumulation | All methods | MISSED |
| community-bio-lab-network | Self-owned `.org` domain | MISSED |
| inbox-compromise | Method 1 — breach-dump credential reuse | MISSED |
| inbox-compromise | Method 2 — AitM phishing | MISSED |
| inbox-compromise | Method 3 — lapsed personal email reset | MISSED |
| inbox-compromise | Method 4 — helpdesk SE | MISSED |
| inbox-compromise | Method 5 — alumni-for-life forwarder | AMBIGUOUS |
| inbox-compromise | Method 6 — self-issued visiting account | MISSED |
| credential-compromise | Compromised `.edu` email | MISSED |
| account-hijack | Inherited `.edu` email | MISSED |
| dormant-account-takeover | Bypass A — redirect mailbox | AMBIGUOUS |
| dormant-account-takeover | Bypass B — reactivate account | MISSED |
| dormant-account-takeover | Bypass C — provision new mailbox | MISSED |
| dormant-account-takeover | Bypass D — institutional VPN routing | MISSED |
| foreign-institution | Methods 1-6 | MISSED |
| it-persona-manufacturing | Sub-paths A-D | MISSED |
| visiting-researcher | No bypass needed | MISSED |
| shell-company | Self-owned domain | MISSED |
| unrelated-dept-student | Bypasses A-D | MISSED |
| insider-recruitment | No bypass needed | MISSED |
| lab-manager-voucher | No bypass needed | MISSED |
| bulk-order-noise-cover | No bypass needed | MISSED |

## bypass_methods_uncovered

All bypass methods from all 19 stories are uncovered. This is structural: inbox round-trip confirms inbox control, and every wg attacker branch has inbox control by construction or by investment. The check's value is as a baseline necessary condition and audit artifact, not as a defense against these specific attacker profiles.

## Verdict

**PASS** — No Critical findings. The universal MISSED result is structural and explicitly acknowledged by the implementation. Inbox round-trip verification is a necessary baseline gate (prevents claims without actual inbox control) and audit artifact, not a defense against sophisticated attackers. The two Moderate findings are refinements to the click-metadata analysis that would marginally improve detection of the inbox-compromise and dormant-account-takeover branches but would not change the structural picture. Pipeline continues to stage 6.
