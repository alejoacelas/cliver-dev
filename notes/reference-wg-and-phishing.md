# Reference pointers: cliver/wg and tries/phishing

Excerpts and pointers to material in sibling repos that's relevant to the KYC tool-testing pipeline.

---

## cliver/wg — Bypass research & measures-in-practice

**Location:** `/Users/alejo/code/cliver/wg`

### Key files

| File | What it contains |
|---|---|
| `measures-in-practice.md` | Implementation baselines for 9 KYC measures (5 all-orders + 4 SOC-only). Describes likely operational choices, uncertainty that matters, and serious alternatives for each. |
| `kyc-bypass-research-idea.md` | Foundational framework: 4 attacker profiles, 17 attack scenarios, Matrix A (all orders) vs Matrix B (SOC). |
| `notes/idv-in-practice.md` | IAL1/IAL2 implementation pathways via commercial vendors (Onfido, Entrust, Persona). Per-country coverage gaps (0% Iran → 99% India/Thailand). Face morphing, injection attacks, SIM swap costs. |
| `notes/provider-side-dependency-tree.md` | What providers actually need to build for each measure: systems, data sources, thresholds, review triggers, fallback workflows. |
| `notes/address-reuse-idea.md` | Verified shipping addresses as a KYC barrier. Carrier-level redirect restrictions (FedEx, UPS, DHL). |
| `notes/vouching-idea.md` | Design principles for third-party vouching: friction, verification channels, calibration, global scalability. |
| `pipeline/outputs-archive/` | 17 completed attack scenario branches. Each has detailed tables with per-measure binding assessment, bypass methods, cost, lead time, expertise, false-negative rate, attacker trace. |
| `deliverable/outputs/summary/_short_concat.final.md` | All 17 branches condensed with costs and key findings. |
| `deliverable/outputs/summary/_measures_concat.md` | Same data aggregated by measure rather than by branch. |

### Measures mapping (wg → CSSWG agenda)

The wg repo uses 9 measures. The 5 KYC steps we're testing map to:

| Our step | wg measure(s) | wg measure # |
|---|---|---|
| a. Address → institution | Organization registry + verified shipping address | 3 |
| b. Payment → institution | Payment integrity | 5 |
| c. Email → affiliation | Institutional affiliation check | 2 |
| d. Residential address | Organization registry + verified shipping address | 3 (subset) |
| e. PO box / freight forwarder | Organization registry + verified shipping address | 3 (subset) |

### False-negative rates (from bypass tables)

Key numbers from the detailed tables across 17 scenarios — these tell us what fraction of legitimate customers would fail a measure:

- **Affiliation check (email domain):** High false-negative for personal/free-mail users (5–15% of academics), new biotechs, thin-ROR institutions.
- **Org registry + address:** 30–45% of industry/commercial orders get zero signal from registries. Non-OECD coverage sparse.
- **Payment integrity:** 20–40% of biotech startups use virtual cards classified as prepaid (Brex/Ramp). Non-US AVS weak.
- **Research/entity signals:** 40–60% of industry researchers invisible to bibliometrics.

---

## tries/phishing — Provider infrastructure security

**Location:** `/Users/alejo/code/tries/2026-04-13-phishing-dna-providers`

### Key files

| File | What it contains |
|---|---|
| `igsc-assessment/summary.md` | Email security assessment of 13 IGSC member providers. Only 3/13 have DMARC p=reject + DKIM. 10/13 can be domain-spoofed. |
| `report-attack-vectors.md` | Three attack chains: order swap ($500), identity fraud ($15–$250), intelligence-assisted fraud ($200–$500). |
| `small-provider-tech-profile.md` | Tech stacks of 11 small-mid providers. Ordering models: e-commerce ~30%, quote-form ~50%, email-only ~20%. |
| `research-links.md` | 316 lines of curated links: AI-assisted exploitation, phishing, zero-day costs, KYC bypass costs. |

### Relevance to the pipeline

The phishing research shows that **email-based affiliation checks are weaker than they appear** because:
1. Institutional email accounts are available on dark web for $50–$200.
2. 10/13 IGSC providers can be email-spoofed (no DMARC reject).
3. Compromised .edu credentials remain active for extended periods (44% not revoked within 24h per one finding).

This matters for step (c) email→affiliation: the pipeline should test not just "does the API return a match" but also document how easily the input (the email address itself) can be fabricated or compromised.
