# Measure 20 — Voucher-legitimacy (SOC): Per-measure synthesis

## 1. Side-by-side comparison of selected ideas

| Field | ORCID OAuth | DKIM institutional email | ROR disjointness | Live video attestation | Anti-rubber-stamp SOP | Coauthor graph |
|---|---|---|---|---|---|---|
| **Slug** | m20-orcid-oauth | m20-dkim-institutional-email | m20-ror-disjointness | m20-live-video-attestation | m20-anti-rubber-stamp | m20-coauthor-graph |
| **Layer** | Identity/affiliation | Identity/affiliation | Independence | Per-order scrutiny | Per-order scrutiny | Independence |
| **What it proves** | Voucher controls a real researcher identity (ORCID iD) with employment/works history | Voucher sent attestation from an institutional mail server (DKIM-signed, ROR-matched domain) | Voucher's institution is structurally independent from customer's institution (different ROR, no parent/child/sibling) | Voucher personally reviewed this specific order, stated SOC names and intended use on record | Voucher is not rubber-stamping at scale (volume, speed, concentration, ring patterns over time) | Voucher has no recent coauthorship or shared US federal grants with customer |
| **Marginal cost** | $0 (Public API) | $0 (open-source + DNS) | $0 (ROR is free/CC0) | ~$25–30/Mode A call; ~$2–5/Mode B sign-off | ~$0 per check; $100–300/quarterly audit per flagged voucher | $0 (all APIs free) |
| **Setup cost** | ~1–2 engineer-weeks | ~$5k–$10k | ~3–5 engineering days | ~$30–55k | ~$10k | ~1 engineer-week |
| **False-positive profile** | 20–40% of vouchers lack ORCID (routed to alternate-evidence); concentrated in industry and non-OECD | <5% US R1; 15–25% globally (DKIM misconfiguration, forwarding, non-OECD) | <5% US R1 cross-institution pairs; 15–30% university systems/hospital networks | 30–50% of non-direct-PI vouchers struggle with SOC-naming challenge; timezone friction 20–30% | 30–60% of rate-exceeded flags are legitimate large labs/BSOs | <5% for "current coauthor" trigger; small subfields structurally impossible |
| **Critical bypass** | Rubber-stamping by real vouchers with real ORCIDs | Any attacker with real institutional email | Cross-institutional recruited/complicit voucher | Knowing-complicit voucher providing coherent answers | Modal PI rubber-stamp (>60s, low volume) | All non-publication-mediated relationships |
| **Audit artifact** | OAuth token + ORCID record snapshot (JSON, replayable) | Raw email + DKIM verification trace + DNS key (independently re-verifiable) | Both ROR JSON records + relationship walk + reviewer adjudication | Video recording (SHA-256 hash), rubric scores, Mode B typed content + timing + digital signature | Quarterly audit packet, graph snapshot, reviewer findings | OpenAlex/NIH/NSF graph edges with DOIs and grant numbers (publicly re-fetchable) |

## 2. Coverage gap cross-cut

### Structural gaps (inherent to the check's design — no implementation fix)

| Gap | Affected checks | Population affected | Consequence |
|---|---|---|---|
| **Rubber-stamping by real, credential-verified vouchers** | ORCID OAuth, DKIM, ROR disjointness, coauthor graph | All attacker stories using legitimate-but-inattentive vouchers | Identity/affiliation/independence checks prove *who* the voucher is but not *whether they reviewed the order*. Only live video attestation + anti-rubber-stamp SOP address this. |
| **Knowing-complicit voucher** | All six checks | insider-recruitment, lab-manager-voucher (d), shell-nonprofit (recruited external), shell-company (recruited external) | A co-conspirator who is briefed on order details passes every check — identity, independence, content attestation, behavioral monitoring. The stack converts this from prevention to deterrence/attribution (recorded video, digital signature, timing logs). **Residual risk accepted.** |
| **Non-publication-mediated relationships** | Coauthor graph | Shells, CROs, community labs, incubators, manufactured personas, BSOs, lab managers, technicians | Coauthor graph is blind to any relationship not indexed in OpenAlex or US federal grants. Falls back to ROR disjointness for institutional-level independence. |
| **Cross-provider rotation** | Anti-rubber-stamp SOP | All persistent-supply-chain stories across 65+ providers | No cross-provider voucher database exists. Each provider sees only its own vouching graph. IGSC-level coordination needed; SecureDNA/IBBIS portal status unknown. |

### Complementary gaps (addressable by combining checks or operational tuning)

| Gap | Primary check | Complementary coverage | Residual |
|---|---|---|---|
| **Vouchers without ORCID (20–40%)** | ORCID OAuth | DKIM institutional email + corroborating signals (alternate-evidence SOP) | Alternate-evidence path is weaker; flag for elevated scrutiny |
| **DKIM misconfiguration (5–15% globally)** | DKIM institutional email | ARC fallback; re-send request; reviewer adjudication | Manageable for US R1; recurring friction for non-OECD |
| **University system / hospital hierarchy false positives (15–30%)** | ROR disjointness | ROR hierarchy walker + reviewer adjudication with cross-department exception SOP | Exception path is exploitable (see M1 under ROR); needs tightening |
| **Non-direct-PI vouchers failing SOC-naming (30–50%)** | Live video attestation | Mode A escalation for clarification; "I don't know — PI would know" accepted but triggers escalation | Some legitimate vouchers (department heads, BSOs) structurally cannot name SOCs |
| **Large-lab PI / BSO false positives on rate flags (30–60%)** | Anti-rubber-stamp SOP | Quarterly audit clears legitimate high-volume vouchers; increase audit interval after clearance | Recurring alert fatigue; risk-weighted sampling recommended |
| **Non-OECD compounding gap** | ORCID + DKIM + ROR + coauthor graph | All four checks simultaneously fail for institutions in countries with sparse ORCID adoption, weak DKIM, low ROR coverage, and non-US grants | **No automated check pathway for this population.** Manual alternate-evidence path is the only route. |

## 3. Bypass methods uncovered: attacker stories surviving the full stack

For each attacker story from the attacker mapping, the following survive all six selected checks:

### Persistent-supply-chain stories (most concerning)

| Attacker story | Surviving bypass path | Why the stack fails | Estimated cost |
|---|---|---|---|
| **lab-manager-voucher** (d — recruited co-conspirator PI) | PI is real, at a different institution (passes ROR), no coauthorship (passes graph), provides coherent order-specific answers (passes video attestation), low volume (passes anti-rubber-stamp) | Knowing-complicit voucher defeats all checks | $0 (ideological) to $100k+ (financial) |
| **visiting-researcher** (Option 4 — second faculty sponsor at different institution) | Real academic at different institution, may have no coauthorship, can provide coherent answers | External complicit voucher | Months of cultivation |
| **unrelated-dept-student** (Bypass G — straw purchaser via authorized lab member) | Attacker entirely absent from provider records; lab member + their PI are real, at a legitimate institution, PI reviews the order (appears legitimate) | Attacker is invisible; the voucher-customer pair looks legitimate because it *is* legitimate at the surface | $0–$5,000/order |
| **shell-nonprofit** (recruited external voucher) | External voucher at a real, different institution; real ORCID; passes disjointness; if briefed, provides coherent answers | Only cost barrier ($1k–$10k/vouch) and accountability deterrent (on-record video) remain | $1,000–$10,000/vouch |
| **shell-company** (recruited external voucher) | Same as shell-nonprofit | Same as above | $1,000–$5,000/vouch |
| **insider-recruitment** | Recruited insider *is* the legitimate voucher; real identity, real institution, genuine order knowledge | The voucher is the attacker's confederate by design | Variable |
| **biotech-incubator-tenant** | Recruit co-tenant at different organization; real ORCID, different ROR, no coauthorship | Social density of incubator makes recruitment plausible; low cost | Low |
| **community-bio-lab-network** | Peer voucher at a different community lab; if rings are >4 nodes, evades anti-rubber-stamp graph detection | Community norms + ring evasion | Low |
| **gradual-legitimacy-accumulation** | Voucher cultivated over years; if no coauthorship produced, passes graph; moderate volume passes anti-rubber-stamp; if briefed on orders, passes video attestation | Long-term cultivation defeats behavioral thresholds | Low ongoing |
| **bulk-order-noise-cover** | If voucher keeps turnaround >60s and volume below threshold, and is at a different institution with no coauthorship | SOC orders ride along in legitimate flow; voucher's inattention at moderate speed is invisible | $0 |
| **foreign-institution** | Foreign voucher at non-OECD institution; ORCID/DKIM/ROR may all have gaps; coauthor graph has no US grant data; verification asymmetry prevents real validation | Compounding coverage gaps in non-OECD populations | Low |
| **cro-framing** | CRO + fake "client institution" each at different RORs; if voucher at client institution is recruited and briefed | Two-entity construction passes disjointness by design | $5k–$15k setup |

### Non-persistent stories (less concerning — one-shot, no supply chain)

| Attacker story | Surviving bypass | Notes |
|---|---|---|
| **account-hijack** | Hijack voucher's Mode B SSO session; complete digital sign-off as voucher | Live video Mode A onboarding already passed; Mode B delegation/session-sharing vulnerability |
| **credential-compromise** | Compromise voucher's provider credentials + Mode B form | Authentication-layer attack; out of scope for voucher-legitimacy checks |
| **inbox-compromise** | If vouching workflow routes approval via email links, inbox control enables approval | ORCID OAuth (browser redirect) blocks this for ORCID; DKIM verification is on inbound email from voucher, not approval links |
| **dormant-account-takeover** | Inherit stale voucher relationship; if Mode A renewal is not triggered, stale voucher may still be valid | Annual Mode A renewal mitigates if enforced |

### Stories substantially blocked by the stack

| Attacker story | Blocked by | Residual |
|---|---|---|
| **dormant-domain** (fabricated voucher persona) | ORCID OAuth (no credible ORCID) + ROR disjointness (same domain) | Survives only if attacker creates convincing ORCID profile AND uses a different institution for the voucher |
| **it-persona-manufacturing** | ORCID OAuth (no ORCID for manufactured persona) + ROR disjointness (same institution) | Both checks must be bypassed; cost is high |
| **shell-nonprofit** (self-vouching from accomplice within shell) | ROR disjointness (same ROR or ROR-unresolved) | Forces external voucher recruitment ($1k–$10k) |
| **shell-company** (second shell entity as voucher) | ROR disjointness + coauthor graph (no coauthorship by construction, but both-company-same-city flag) | Two-shell bypass in different cities passes; M2 hardening finding |
| **cro-identity-rotation** (self-vouch within CRO) | ROR disjointness | Each rotation must reconstruct external voucher; per-rotation cost |

## 4. Structural gaps flagged as open issues

### Issue 1: Knowing-complicit voucher (irreducible)
**Status:** Accepted residual risk.
**Description:** A voucher who deliberately assists the attacker — briefed on order details, providing coherent answers, willing to go on video record — defeats every check in the stack. No attestation mechanism can distinguish a co-conspirator from a legitimate voucher.
**Mitigation (deterrence, not prevention):** Accountability framing (recorded video, digital signature, timing logs) raises the personal cost for the co-conspirator. Post-incident attribution is possible.
**Affected stories:** insider-recruitment, lab-manager-voucher (d), shell-nonprofit/shell-company (recruited external), any story with a willing accomplice.

### Issue 2: Modal PI rubber-stamp at moderate speed
**Status:** Partially addressed; gap remains.
**Description:** A PI who rubber-stamps 1–5 vouches per quarter with >60-second turnaround generates no signal on anti-rubber-stamp SOP triggers. Live video attestation's Mode B per-order content requirement is the primary defense, but habituated rubber-stampers providing plausible stock answers ("for our ongoing CRISPR research") may pass.
**Mitigation:** Mode B timing analysis + 20% random spot-check + content-engagement signal (did voucher access order details page before approving — *not yet specified in implementation*).
**Affected stories:** lab-manager-voucher (b — modal PI rubber-stamp), bulk-order-noise-cover, gradual-legitimacy-accumulation.

### Issue 3: Non-OECD compounding coverage gap
**Status:** Open — no automated pathway.
**Description:** Institutions in countries with sparse ORCID adoption (~20–40%), weak DKIM infrastructure (~20–30% misconfiguration), low ROR coverage (~20% of world's research institutions outside top-20 countries), and no US federal grants simultaneously fail all four identity/affiliation/independence checks. The coauthor graph produces no signal.
**Mitigation:** Manual alternate-evidence path (DKIM + two corroborating signals) is the only route. This population is disproportionately affected by every check in the stack.
**Affected stories:** foreign-institution, any story with non-OECD vouchers.

### Issue 4: Cross-provider voucher rotation
**Status:** Open — requires industry coordination.
**Description:** With 65+ global synthesis providers, an attacker rotating across 3–5 providers avoids any single provider's anti-rubber-stamp detection. No cross-provider voucher database exists.
**Mitigation:** IGSC-level coordination; SecureDNA/IBBIS portal (announced October 2025) may include vouching-graph sharing — status unknown.
**Affected stories:** cro-identity-rotation, shell-nonprofit, shell-company, any multi-provider strategy.

### Issue 5: Mode B delegation risk
**Status:** Open — not addressed in implementation.
**Description:** Vouchers may delegate Mode B digital sign-off to lab staff using shared SSO credentials, breaking the personal-accountability link. Estimated at 10–20% of sign-offs in academic labs where credential sharing is common.
**Mitigation options:** Biometric check on Mode B submission (selfie matching video-call face), device binding, or periodic random Mode A escalation.
**Affected stories:** lab-manager-voucher (all variants), bulk-order-noise-cover.

### Issue 6: Deepfake vulnerability in Mode A video calls
**Status:** Open — "optional" vendor augmentation is insufficient.
**Description:** Human deepfake detection rate is ~24.5% (cited). A well-resourced adversary using real-time face-swap technology with a briefed operator has >50% chance of passing human visual assessment. The implementation frames vendor deepfake detection (Facia.ai, Sensity AI) as optional.
**Recommendation:** Upgrade deepfake-detection vendor integration from optional to required for SOC-order Mode A calls.
**Affected stories:** Any story where a synthetic voucher identity is attempted.

### Issue 7: Shell organizations obtaining ROR listing
**Status:** Open — no detection mechanism specified.
**Description:** A well-resourced attacker can establish a shell organization that enters ROR via predatory publications or other legitimate-appearing activity. Once ROR-listed, the shell passes disjointness trivially (different ROR from customer).
**Size:** Unknown.
**Affected stories:** shell-nonprofit, shell-company, cro-framing (two-entity construction).

### Issue 8: ROR Q3 2026 client_id requirement
**Status:** Imminent — action required.
**Description:** ROR API transitions to required client_id registration in Q3 2026 (~3 months). Without registration, rate limits drop from 2000/5min to 50/5min. Registration is free. Bulk-dump alternative eliminates throttling entirely.
**Action:** Register for ROR client_id immediately; evaluate bulk-dump ETL as primary path.
