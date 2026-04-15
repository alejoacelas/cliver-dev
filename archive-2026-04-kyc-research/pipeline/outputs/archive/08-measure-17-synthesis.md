# Measure 17 — Pre-approval list: Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (of 7) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| m17-fsap-ibc-roster | NIH IBC-RMS (public web), FSAP (manual attestation) | $0 IBC; $5–25/FSAP attestation | BSO confirmation email + 14-day timeout; RO callback for FSAP | 5 (gradual-legit, shell-co, incubator — by exclusion; bulk-order partial; dormant partial) | Foreign + commercial institutions (~70–80% of customers) get zero signal | Account-hijack / credential-compromise inherit legitimate IBC affiliation |
| m17-igsc-shared-list | IGSC member channel (ad-hoc, human-to-human) + internal CRM | $0 incremental; IGSC dues unknown | Biosecurity officer bilateral confirmation with originating member (rare) | 0 of 7 mapped stories | >99% of new customers receive no signal; channel "rarely used" | All 14 bypass methods across all 7 stories MISSED — check cannot detect first-time attackers with clean histories |
| m17-positive-verification-sop | Internal SOP + IBC-RMS + switchboard + faculty directories + DMARC | $75–150/entity/year | 45–90 min analyst time per annual re-verification; phone callbacks for non-DMARC institutions | 4 (stale-approval, account-hijack, credential-compromise via independent-contact mandate; purpose-built orgs marginally) | Purpose-built orgs controlling all channels; ~70–80% of academic domains lack DMARC enforcement | Shell organizations where all "independent" sources lead back to attacker |
| m17-event-driven-reeval | OpenCorporates, OFAC SLS delta, SpyCloud/Constella, dormancy timer | $1–5/entity/year | Reviewer adjudicates triggered demotions; false-positive noise from officer turnover | 4 (shell-co acquisition, incubator LLC-purchase, credential-compromise via breach feed, dormant-account via timer) | 30–50% of pre-approved entities (academic/govt) outside OpenCorporates; build-from-scratch purpose-built entities generate no events | Patient construction of purpose-built entities — no events generated; bulk-order noise cover at real unchanged institutions |
| m17-predecessor-reidv | M14 IDV vendors (Stripe Identity $1.50, Jumio, Onfido, etc.) | $1.50–5/verification | Reviewer handles name mismatches and legitimate handoffs (10–20% of accounts/year in academia) | 6 (account-hijack, credential-compromise, dormant-account, shell-co acquisition, incubator-LLC-purchase, shared-account — all via name mismatch); attribution-only for own-identity attackers | 10–25% IDV abandonment; 10–20% legitimate handoff volume; sophisticated deepfake bypass | Own-identity purpose-built-org attacks pass re-IAL2 because identity is real (prevention only — attribution via biometric commitment is provided) |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

- **Purpose-built entities with patience:** Every idea under M17 either misses or only marginally catches the gradual-legitimacy-accumulation branch (entity builds a 12+ month history using real identity). FSAP/IBC excludes them from fast-track but does not block them. IGSC provides zero signal. Positive-verification SOP is a marginal speed bump. Event-driven reeval sees no events. Predecessor-reidv provides attribution but not prevention. This is a structural limitation of the pre-approval-list measure as conceived: it rewards accumulated clean history, which is exactly what patient attackers construct.

- **Foreign institutions and commercial entities without IBC/FSAP:** FSAP/IBC is US-centric (no signal for ~40–50% foreign customers and ~30–40% commercial customers). IGSC is near-null for everyone. Positive-verification SOP degrades to switchboard/directory lookup for non-US institutions (more labor-intensive and less reliable). Event-driven reeval has OpenCorporates jurisdiction gaps. Predecessor-reidv works regardless of institution type (the strongest idea for this population).

- **Bulk-order noise cover (insider at pre-approved R1):** Every idea fails against the core-facility technician who is a real employee at a real, pre-approved institution. FSAP/IBC confirms the person is within the IBC's purview but not that specific sequences are authorized. IGSC provides zero signal. Positive-verification SOP confirms entity status, not order content. Event-driven reeval sees no events. Predecessor-reidv passes the attacker because their identity is real.

### Complementary gaps

- **Account-hijack / credential-compromise:** FSAP/IBC misses these entirely (attacker inherits legitimate IBC affiliation). IGSC misses. But **positive-verification-sop** (independent-contact mandate routes confirmation to BSO/switchboard, not compromised inbox) and **predecessor-reidv** (name mismatch forces attacker to expose themselves) both catch these. Bundle these two for coverage.

- **Dormant-account-takeover:** FSAP/IBC catches partially only if BSO callback re-fires. But **event-driven-reeval** (dormancy timer) and **predecessor-reidv** (name mismatch) both catch this. Either alone provides coverage; together they provide defense-in-depth.

- **Shell-company acquisition variant:** FSAP/IBC excludes shells from fast-track. **Event-driven-reeval** catches via OpenCorporates officer-change event (with latency caveat). **Predecessor-reidv** catches via name mismatch on new principal. Two independent catches.

### Net coverage estimate

If a provider implemented all five ideas: **many** legitimate customers would still fall in a coverage gap. The FSAP/IBC roster covers only US NIH-funded academic institutions (~50–70% of US academic customers, a much smaller fraction of total). IGSC provides near-zero signal. The positive-verification SOP and event-driven reeval cover the "stale approval" threat well but cannot detect patient entity construction. Predecessor-reidv provides the broadest coverage against identity-inheritance attacks but cannot prevent own-identity attackers. The combined stack addresses stale-approval and identity-inheritance threats effectively but leaves the purpose-built-entity and insider-abuse threats structurally uncovered.

## 3. Bypass cross-cut

### Universally uncovered bypasses

- **Gradual-legitimacy-accumulation (build-from-scratch):** No idea catches this. The attacker operates stably, generates no events, uses their real identity, and manufactures exactly the clean history that pre-approval rewards.

- **Bulk-order noise cover (core-facility insider, per-user account):** No idea catches this. The attacker has a real identity, real institutional affiliation, legitimate IBC coverage, clean order history, and no anomalous events.

### Bypass methods caught by at least one idea

| Bypass | Catching idea(s) |
|---|---|
| Account-hijack inherited footprint | predecessor-reidv (name mismatch), positive-verification-sop (independent contact) |
| Credential-compromise account takeover | predecessor-reidv (name mismatch), positive-verification-sop (independent contact), event-driven-reeval (breach feed) |
| Dormant-account-takeover inherited footprint | predecessor-reidv (name mismatch), event-driven-reeval (dormancy timer) |
| Shell-company acquisition (officer change) | event-driven-reeval (OpenCorporates), predecessor-reidv (name mismatch) |
| Incubator-tenant LLC purchase | event-driven-reeval (OpenCorporates), predecessor-reidv (name mismatch) |
| Dormant-account gradual ramp | predecessor-reidv (re-IAL2 on SOC order) |
| Shell-company build-from-scratch | fsap-ibc-roster (exclusion from fast-track only — forces to m18/m19, does not block) |

### Attacker stories where every idea fails

- **gradual-legitimacy-accumulation** (build-from-scratch, time-aged domain + clean order history)
- **bulk-order-noise-cover** (core-facility insider, per-user account variant)

## 4. Bundling recommendations

**Recommended core bundle: positive-verification-sop + event-driven-reeval + predecessor-reidv.** These three ideas provide complementary coverage: the annual SOP catches stale approvals and account-hijack via independent-contact routing; event-driven reeval catches acquisition variants and post-approval drift; and predecessor-reidv catches identity-inheritance attacks at order time. Together they close gaps in the account-hijack, credential-compromise, dormant-account-takeover, and shell-company-acquisition stories. Operational cost: one annual SOP cycle per entity ($75–150) + event monitoring (~$1–5/entity/year) + per-SOC-order IDV ($1.50–5). The main new operational burden is the predecessor-reidv legitimate-handoff volume (10–20% of accounts/year in academic settings).

**FSAP/IBC roster** is a worthwhile addition as a gating mechanism that routes non-IBC entities to harder m18/m19 verification. Its value is concentrated in the US NIH-funded academic population. Cost is minimal ($0 for IBC-RMS data). Include it as a fast-track filter, not a primary screening mechanism.

**IGSC shared list** provides near-zero value against the mapped attacker stories. Its value is concentrated in the narrow repeat-offender use case (known-bad actor returning with same identity). Include as a supplementary intelligence source but do not count it toward coverage of any mapped attacker story.

**Residual uncovered threats:** Even with all five ideas bundled, the patient purpose-built-entity threat (gradual-legitimacy-accumulation) and the insider-abuse threat (bulk-order-noise-cover) remain structurally unaddressed by M17. These require complementary measures: m18 (institution legitimacy) for the purpose-built-entity threat, and behavioral/order-pattern analytics (outside the current measure set) for the insider-abuse threat.
