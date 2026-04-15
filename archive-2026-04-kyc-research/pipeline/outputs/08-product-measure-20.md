# Measure 20 — Product Prioritization

## Selected stack

### 1. ORCID OAuth proof-of-control (m20-orcid-oauth)

ORCID OAuth is the foundation layer for voucher identity in the academic context. It proves the voucher controls a real researcher identity, provides structured employment and publication data for downstream checks, and bridges directly into ROR via disambiguated-organization identifiers. The cost is near-zero ($0 marginal on the Public API, ~1-2 engineer-weeks setup), the OAuth flow is already familiar to researchers through publisher integrations, and the record snapshot (employments, works, timestamps) is a strong, replayable audit artifact. Critically, it eliminates fabricated voucher personas, IT-manufactured identities, dormant-domain fabrications, and gig-platform recruits without scholarly backgrounds. The alternate-evidence SOP for vouchers lacking ORCID (routed through DKIM + corroborating signals) provides necessary coverage for industry and non-OECD populations. ORCID OAuth should be the first check every voucher encounters.

### 2. DKIM-verified institutional email (m20-dkim-institutional-email)

DKIM verification is the cheapest possible floor for institutional binding: $0 marginal cost, open-source implementation, no external vendor dependency. It eliminates free-mail vouchers and lookalike-domain impersonation, and when coupled with ROR domain matching, forces attackers to either obtain real institutional email access or invest in ROR-listed shell infrastructure. The check produces an independently re-verifiable audit artifact (raw email, DNS public key, verification result). The false-positive rate is manageable for US R1 institutions (<5%) and acceptable globally (15-25%) with the ARC fallback and reviewer playbook. DKIM is correctly framed as a complement to ORCID OAuth: ORCID proves researcher identity, DKIM proves institutional infrastructure control.

### 3. ROR disjointness rule (m20-ror-disjointness)

ROR disjointness is the structural independence enforcer. At $0 marginal cost and ~3-5 engineering days of setup, it blocks the most natural form of collusion -- same-institution vouching -- across all attacker stories that rely on internal accomplices (PI vouching for lab member, BSO vouching for institutional customer, shell self-vouching, IT-manufactured personas). Forcing the attacker to recruit a cross-institutional voucher is meaningful friction: the shell-nonprofit analysis prices external voucher recruitment at $1k-$10k per event. The ROR hierarchy walker (parent/child/sibling detection) handles university systems and hospital networks. The Q3 2026 client_id registration is imminent and should be actioned immediately; the bulk-dump alternative eliminates API throttling entirely.

### 4. Live video attestation with per-order content attestation (m20-live-video-attestation)

This is the only idea in the set that addresses the structural gap identified in every other check: rubber-stamping by real, credential-verified vouchers. The Mode A/Mode B design is operationally realistic -- Mode A (full video call with ID check, SOC-naming challenge, accountability statement) at onboarding and annually; Mode B (per-order digital sign-off with typed SOC names, intended use, randomized challenge) for subsequent orders. The rubber-stamping detection (sub-30s timing analysis, auto-escalation) catches the most egregious cases. The accountability statement ("this recording may be reviewed in legal proceedings") shifts the cost calculus for negligent and risk-averse vouchers. At ~$75-80/year for a typical voucher with 10 SOC orders, the cost is proportionate to the risk level of SOC orders. This check is the layer that converts the identity stack (ORCID + DKIM + IDV) from "who is the voucher" into "did the voucher actually review this order."

### 5. Anti-rubber-stamp voucher SOP (m20-anti-rubber-stamp)

The anti-rubber-stamp SOP provides longitudinal behavioral monitoring that no single-order check can replicate. It catches volume-driven rubber-stamping (rate thresholds), batch-vouching events (concentration index), mutual-vouching rings (graph cycle detection), and instant-approval patterns (turnaround timing). At ~$0 marginal cost per check and ~$10k setup, it is inexpensive insurance against abuse patterns that emerge only over time. Its primary limitation -- blindness to single-shot and moderate-speed rubber-stamping -- is partially addressed by the live-video-attestation check's per-order content requirements. The two checks are complementary: live video attestation catches per-order negligence, anti-rubber-stamp catches cross-order behavioral patterns.

### 6. Coauthor-graph independence check (m20-coauthor-graph)

The coauthor graph adds a data-driven independence signal that ROR disjointness cannot provide: it catches cross-institutional collusion where the voucher and customer are recent collaborators. At $0 API cost and ~1 engineer-week setup, it forces attackers to find vouchers outside their publication network, raising social cost and attribution risk. The check is strongest for academic populations with indexed publications and US federal grants; it is weakest for industry, non-US, and non-publishing populations. It should be treated as a supplementary signal (flag for review, not hard-block) given the structural false-positive risk in small subfields where all qualified vouchers are coauthors.

## Dropped ideas

- **Voucher IAL2 IDV (m20-voucher-idv):** Dropped due to dominant friction: 20-40% abandonment/refusal among senior academic vouchers, 3x demographic false-reject differentials (NIST FRVT), and the fact that live video attestation already includes government ID verification at Mode A calls, making standalone IDV redundant within this stack.

- **Composite voucher trust score (m20-voucher-trust-score):** Dropped because it is a scoring wrapper over the selected checks, not an independent signal; 25-40% of legitimate vouchers structurally cannot auto-pass, creating unsustainable review volume; and the hard institutional gate duplicates the ROR disjointness check while adding a rigid non-ROR hard-decline that disproportionately affects non-OECD populations.

## Composition note

The selected stack forms three complementary layers. The **identity and affiliation layer** (ORCID OAuth + DKIM institutional email) proves the voucher is a real researcher at a real institution. The **independence layer** (ROR disjointness + coauthor graph) proves the voucher is structurally and professionally independent from the customer. The **per-order scrutiny layer** (live video attestation + anti-rubber-stamp SOP) proves the voucher engaged with the specific order and is not rubber-stamping.

Every other idea in the set shares the same Critical finding: rubber-stamping by real, credential-verified vouchers is systematically missed. Only the live video attestation and anti-rubber-stamp SOP address this gap, which is why both are included despite their higher operational cost. The identity/affiliation checks (ORCID, DKIM) are necessary preconditions -- they ensure the person being held accountable in the video attestation is who they claim to be -- but they are not sufficient without the per-order scrutiny layer.

The voucher IDV check is dropped rather than included alongside live video attestation because Mode A video calls already incorporate government ID verification, and adding a separate standalone IDV flow would compound friction without adding marginal signal. If live video attestation is implemented as specified, the IDV requirement is subsumed.

The composite trust score is dropped because it introduces model-governance overhead (weight calibration, drift monitoring, bias review) without adding information beyond what the individual checks already provide. The selected stack uses each check as a discrete pass/fail or flag-for-review signal rather than collapsing them into a single number -- this preserves explainability and avoids the false comfort of a composite score that masks structural gaps.

Key residual risk: knowing-complicit vouchers who are briefed on order details and deliberately assist the attacker will pass all six checks. No attestation mechanism can distinguish a co-conspirator who provides coherent, order-specific answers from a legitimate voucher. The accountability framing (recorded video, digital signature, timing logs) shifts this from a prevention problem to a deterrence and attribution problem -- the co-conspirator is now personally on record, photographically identified, and traceable.
