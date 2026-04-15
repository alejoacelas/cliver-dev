# Measure 20 — Voucher legitimacy (SOC): Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (of 20) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| m20-voucher-idv | M14 IDV vendors (Stripe Identity $1.50, Jumio, Onfido, etc.) | $1.50–5/check | Reviewer handles REFER cases (~5–15%); zero for clean PASS | 8 caught (credential-compromise, account-hijack, inbox-compromise, dormant-account, dormant-domain, it-persona, CRO-framing, shell-nonprofit paths); attribution for shell accomplices | 20–40% senior-academic abandonment/refusal (dominant barrier); 10–20% non-OECD document failures; demographic FR bias (3x differential) | Rubber-stamping by real IDV-verified vouchers (Critical — real person, real gov ID, no order scrutiny); self-vouching not blocked; no cross-session biometric dedup |
| m20-orcid-oauth | ORCID Public API (free, OAuth) | $0 | Zero for successful OAuth; ~10 min/voucher on alternate-evidence path (20–40% of vouchers) | 9 caught (credential-compromise, inbox-compromise, dormant-domain fabricated persona, it-persona, shell-nonprofit gig-worker, CRO-rotation, shell-co accomplice, foreign-inst partial, community-bio partial) | 20–40% of vouchers lack ORCID; 20–30% have empty/private profiles; self-asserted ORCID data unverified | Rubber-stamping by legitimate vouchers with real ORCIDs (Critical); alternate-evidence SOP as bypass safety valve; fabricated ORCID profiles |
| m20-dkim-institutional-email | dkimpy (open-source) + DNS + ROR domain mapping | $0 | 6-case playbook; <5% failure rate for US R1; 15–25% globally | 4–6 caught (free-mail voucher, lookalike domain, shell domains without ROR, CRO without ROR) | 5–15% of institutions have broken/absent DKIM; non-OECD adoption ~20–30%; email forwarding breaks DKIM ~5–10% | All attackers with real institutional email (insiders, visitors, students, compromised accounts) — DKIM verifies infrastructure, not intent |
| m20-live-video-attestation | Video-conferencing + digital sign-off form (internal) | Mode A: $25–30/session; Mode B: $2–5/order | Mode A: 15-min video call + 10-min write-up; Mode B: 20% spot-check | 7–9 (fake-voucher, deepfake-voucher directly; rubber-stamping substantially via v2 per-order content attestation; insider/co-conspirator marginally via deterrent) | Determined co-conspirators provide plausible answers (~5–15% residual); deepfake detection unreliable at ~24.5% human rate; Mode B delegation (~10–20%); scheduling friction for distant time zones (~20–30%) | Knowing-complicit voucher providing coherent order-specific answers (structural — no attestation detects intent); sophisticated real-time deepfake with briefed operator |
| m20-coauthor-graph | OpenAlex + NIH RePORTER + NSF (all free) | $0 | Reviewer adjudicates old coauthorships and consortium papers; low volume | 3–5 (collusive-vouching with coauthorship, lab-manager PI with coauthorship, gradual-legit with published relationship, bulk-order with coauthorship) | Industry vouchers with no publications (~30–50%); non-US grants invisible; pre-publication collaborators; small subfields where everyone is a coauthor | All non-publication relationships; displacement to non-coauthor voucher; visiting researchers (zero coauthorship by construction) |
| m20-ror-disjointness | ROR REST API v2 (free, CC0) | $0 | Reviewer adjudicates same-institution exceptions and hierarchy complexities; 15–30% FP for university systems | 10 caught (same-institution vouching across shell-nonprofit, shell-co, dormant-domain, it-persona, insider-recruitment, visiting-researcher, unrelated-dept-student, lab-manager, CRO, community-bio) | 15–25% of institutions not in ROR; complex hierarchies generate 15–30% FP; single-institution environments (~2,000+ small colleges) | Cross-institutional recruited/complicit voucher (passes by design); two-shell separate-ROR bypass; cross-department exception exploitation |
| m20-anti-rubber-stamp | Internal voucher database (no external API) | ~$0/check; $100–300/quarterly audit | Quarterly compliance review of flagged vouchers; 3-sample spot-check | 3 partially (PI instant rubber-stamp, BSO volume, batch vouching, community mutual vouching, bulk-order high volume) | Single-shot/low-volume rubber-stamps invisible (~9K–12K NIH PIs could exhibit); no cross-provider visibility; audit sampling ~6% detection per malicious vouch | PI rubber-stamp with >60s turnaround (modal attack); all single-shot vouching attacks; cross-provider rotation |
| m20-voucher-trust-score | Internal scoring module combining sibling check outputs | <$0.001 compute; $2.50–4/voucher (reviewer dominant) | Reviewer handles 25–40% in adjudication band; contributions panel aids targeted follow-up | Catches fabricated/thin-identity vouchers via score fusion; institutional gate catches shells failing m18 | 25–40% of legitimate vouchers do not auto-pass; industry vouchers capped at ~65; non-ROR institutions hard-declined; early-career penalty | Rubber-stamping by max-score vouchers (Critical — score measures identity, not per-order behavior); self-vouching not blocked; cached scores enable post-onboarding attacks |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

- **Rubber-stamping by real, legitimate vouchers:** This is the Critical finding shared across voucher-idv, orcid-oauth, and voucher-trust-score. A real PI with verified identity, verified ORCID, institutional email, and high trust score who rubber-stamps approvals without reading order details passes every identity/affiliation check. The only idea that substantially addresses this is **live-video-attestation** (v2 per-order content attestation forces engagement with SOC details), supplemented by **anti-rubber-stamp** (catches high-speed/high-volume patterns). Even these leave the modal case — a PI who reads for 90 seconds and approves — structurally uncovered.

- **Knowing-complicit voucher (recruited co-conspirator):** Every idea fails against a voucher who is a real person, at a real different institution, with a real scholarly record, who deliberately provides coherent order-specific answers. IDV passes (real ID). ORCID passes (real profile). DKIM passes (real email). ROR-disjointness passes (different institution). Coauthor-graph may pass (deliberately selected non-coauthor). Live-video-attestation's accountability framing deters risk-averse individuals but does not block willing conspirators. This is a structural limit of voucher-based verification.

- **Authentication-layer attacks on voucher accounts:** Credential-compromise and account-hijack of the voucher's own session are caught by IDV (requires live biometric) and ORCID OAuth (requires separate ORCID auth). But post-onboarding account takeover is not addressed if re-authentication cadence is unspecified (flagged for both voucher-idv and orcid-oauth). Dormant-account-takeover of the voucher's account is caught only if re-IDV is required.

### Complementary gaps

- **Fabricated voucher identities:** Three ideas converge to eliminate this threat. **Voucher-idv** requires live biometric presence (no fake person can produce matching gov ID + face). **ORCID-oauth** requires a real ORCID account with populated records. **DKIM** requires a real institutional mailbox. Together they ensure the voucher is a real person, with a real scholarly identity, at a real institution. The **voucher-trust-score** fuses these into a composite decision.

- **Same-institution vouching / self-vouching:** **ROR-disjointness** blocks same-institution vouchers. **Voucher-idv** could block self-vouching via government-ID deconfliction (recommended but not implemented in current spec). **Coauthor-graph** catches within-lab vouching when coauthorship exists. Together they force the attacker to find an external, non-coauthor voucher — meaningful friction.

- **Community-lab mutual vouching:** **ROR-disjointness** catches within-lab vouching. **Anti-rubber-stamp** catches ring-vouching cycles (length <=4). **Coauthor-graph** catches mutual-vouching pairs with publication ties. The combination substantially addresses this story, though rings >4 nodes and non-publishing mutual vouchers evade.

### Net coverage estimate

If a provider implemented all eight ideas: **some** legitimate vouchers would still fall in coverage gaps. The combined stack effectively verifies voucher identity for OECD academic vouchers with common passports (~85–90% first-attempt pass on IDV). The structural problem is not coverage of legitimate vouchers but detection of illegitimate behavior by verified vouchers: the entire M20 stack can confirm who the voucher is but cannot confirm that the voucher exercises genuine order-level scrutiny. Live-video-attestation is the only idea that attempts per-order engagement verification, and even it cannot detect a willing co-conspirator.

## 3. Bypass cross-cut

### Universally uncovered bypasses

- **Knowing-complicit voucher at a different institution with no coauthorship:** Real person, real identity, real ORCID, real institutional email, independent institution, no publication ties, provides coherent order-specific answers because briefed. Every idea passes.

- **PI rubber-stamp with moderate-speed turnaround (>60s, low volume):** The modal voucher-abuse scenario. IDV passes (real PI). ORCID passes. DKIM passes. Disjointness is not applicable (different institution or cross-department exception). Anti-rubber-stamp threshold not triggered. Trust score is maximal. Live-video-attestation's Mode B is the only partial catch (per-order content requirement and timing analysis), but >60-second submissions pass the timing check.

### Bypass methods caught by at least one idea

| Bypass | Catching idea(s) |
|---|---|
| Fabricated voucher persona (no real person) | voucher-idv (biometric fails), orcid-oauth (no credible ORCID), dkim (free-mail/lookalike) |
| AitM phishing of voucher session | voucher-idv (cannot replay biometrics) |
| Inbox compromise of voucher | voucher-idv (email cannot substitute for biometric), orcid-oauth (browser redirect) |
| Self-vouching (orderer = voucher) | ror-disjointness (same institution), live-video-attestation (gov-ID deconfliction) |
| Same-institution PI vouching for lab member | ror-disjointness (same-ROR flag), coauthor-graph (if coauthorship exists) |
| Shell-entity self-vouching (accomplice at same shell) | ror-disjointness (same-ROR or ROR-unresolved) |
| PI instant rubber-stamp (<60s) | anti-rubber-stamp (voucher_turnaround_fast flag) |
| Community-bio mutual vouching ring (<=4 nodes) | anti-rubber-stamp (voucher_ring_detected) |
| BSO high-volume batch vouching | anti-rubber-stamp (voucher_rate_exceeded), live-video-attestation (Mode B timing) |
| Gig-platform non-researcher voucher | orcid-oauth (empty/no ORCID), voucher-trust-score (low composite score) |
| Dormant-domain fabricated voucher | voucher-idv (no matching person), orcid-oauth (no ORCID), dkim (dormant domain with no ROR) |

### Attacker stories where every idea fails

- **Knowing-complicit voucher at independent institution** (deliberately selected for no coauthorship, briefed on order details, provides coherent attestation)
- **Gradual-legitimacy rubber-stamping** (cultivated voucher relationship over years, voucher habituated to approving)

## 4. Bundling recommendations

**Identity layer (required): voucher-idv + orcid-oauth + dkim-institutional-email.** These three eliminate fabricated voucher identities by requiring biometric proof, scholarly identity, and institutional email authentication. Together they ensure the voucher is a real person, with a real researcher profile, at a recognized institution. Cost: $1.50–5 per voucher for IDV + $0 for ORCID + $0 for DKIM. This layer is the prerequisite for all other checks.

**Independence layer (required): ror-disjointness + coauthor-graph.** ROR disjointness blocks same-institution vouching (the simplest collusion path). The coauthor graph extends independence checking to publication-mediated relationships. Together they force the attacker to find a cross-institutional, non-coauthor voucher — meaningful friction that prices out casual collusion. Cost: $0 for both (all data sources free). Note: coauthor-graph is blind to non-publishing populations and non-US grants; ror-disjointness has 15–30% FP for university-system pairs.

**Per-order scrutiny layer (strongly recommended): live-video-attestation + anti-rubber-stamp.** Live-video-attestation is the only idea that forces per-order engagement with SOC details (Mode A video call at onboarding/annually, Mode B digital sign-off per order). Anti-rubber-stamp catches high-speed and high-volume patterns. Together they convert vouching from a one-time identity check to an ongoing per-order accountability mechanism. Cost: $25–30 per Mode A session + $2–5 per Mode B sign-off + $100–300 per quarterly audit. This is the most expensive layer but addresses the Critical rubber-stamping gap that the identity and independence layers leave open.

**Fusion layer (recommended): voucher-trust-score.** The composite score fuses all upstream signals into an automated decision framework with explainable adjudication. Its value is operational efficiency (auto-approve the easy cases, route the hard ones), not incremental bypass detection. The institutional gate (hard-decline if voucher's institution fails m18) provides a structural backstop. Cost: <$0.001 compute; setup $30–60K. Note: 25–40% of legitimate vouchers may not auto-pass, requiring reviewer capacity.

**Residual uncovered threats:** The knowing-complicit voucher at an independent institution is structurally unaddressable by any voucher-legitimacy check — it requires either behavioral/order-pattern analytics or broader institutional-level controls. The modal PI rubber-stamp (moderate speed, low volume) is only partially addressed by live-video-attestation's per-order content requirement and remains the single largest residual risk in M20. Deepfake attacks on Mode A video calls require vendor-level detection augmentation (recommended upgrade from optional to required for SOC orders). Cross-provider voucher rotation requires IGSC-level coordination (no mechanism exists). The compounding non-OECD gap (vouchers simultaneously failing IDV document support, ORCID adoption, DKIM enforcement, and ROR coverage) affects ~10–20% of the global voucher pool and has no clean technical fix.
