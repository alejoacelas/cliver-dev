# Measure 04 — Residential vs business: Per-measure synthesis

## 1. Side-by-side comparison table

| Field | m04-usps-rdi | m04-google-places-business | m04-county-assessor | m04-str-coloc-sop |
|---|---|---|---|---|
| **Name** | USPS RDI residential indicator | Google Places business presence | County assessor parcel use-code (US) | STR / Wayback co-location SOP |
| **Data source** | USPS AIS via Smarty/Melissa (same API as m03 CMRA) | Google Places API (New) Nearby Search | Regrid / ATTOM / ReportAll national parcel aggregators | Manual Airbnb/VRBO search + Inside Airbnb CSV + AirDNA |
| **Marginal cost** | ~$0.001-$0.005 via Smarty; $0 incremental if reusing m03 call | $0.032-$0.035/check | Regrid $80K/yr bulk (~$0.0005/check at high volume, ~$1.60 at 50K orders/yr); ATTOM ~$0.05-$0.20/call | $8-17/check (reviewer time: 10-20 min at $50/hr) |
| **Manual review burden** | Legitimate CMRA/home-office biotechs (~2-5% commercial customers); community-bio carve-out decisions | New/stealth startups (30-50% of sub-12mo startups unlisted); multi-tenant building mismatch (20-40% of shared-building tenants); security-conscious orgs | Same FP population as RDI (garage labs, home-office founders, live-work buildings); stale county records add uncertainty | Small: only fires on upstream-flagged subset; STR long-term tenants and multi-unit building neighbors are rare FPs |
| **Attacker stories addressed** | 5 stories, residential variants only: community-bio-lab-network, dormant-domain, foreign-institution (US only), cro-framing (edge), gradual-legitimacy-accumulation (edge) | Same 5 stories, same residential variants; adds partial international coverage | Same 5 stories, same residential variants (identical hit/miss profile to RDI) | 1 story: foreign-institution Method 4 STR drop variant |
| **Headline coverage gap** | International addresses (40-55% of orders): zero signal; US-only | International sparse coverage (10-20% of international orders unreliable); Google ToS risk may block deployment | International: zero signal; cost prohibitive for small providers ($80K/yr Regrid); 5-15% of US parcels missing use-code | Narrow: only catches active Airbnb/VRBO STR listings; misses 40-50% of global STR market (non-Airbnb platforms) |
| **Headline uncovered bypass** | All commercial-address paths (virtual offices, coworking, maker spaces, incubator benches, freight forwarders) | Same commercial-address blind spot; ToS risk is structural blocker | Same commercial-address blind spot; identical to RDI | All residential-own-home paths; all commercial paths; delisted STRs; non-Airbnb platforms |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

Three gaps appear in every M04 idea's coverage-gap list:

1. **All commercial-address bypass methods.** Virtual offices, coworking spaces (WeWork), maker spaces, executive suites, biotech incubator benches (BioLabs, LabCentral), and freight forwarders all classify as "commercial" by every M04 check. These are the primary address methods used by the most dangerous purpose-built-organization attacker stories (cro-framing, gradual-legitimacy-accumulation, dormant-domain). M04 cannot detect them because its mandate is residential detection, not commercial-address vetting. Commercial address scrutiny belongs to M05 (institutional address verification) and M03 (CMRA detection).

2. **International addresses with no or weak coverage.** m04-usps-rdi and m04-county-assessor are US-only. m04-google-places-business has global reach but degraded signal in non-OECD/rural areas and zero coverage in China. m04-str-coloc-sop depends on Airbnb/VRBO presence, which is US/EU/tourist-market-centric. An estimated 40-55% of synthesis orders by count are international; for these, M04 produces weak or no signal.

3. **Community-bio / DIY-bio residential addresses.** The community-bio-lab-network story explicitly constructs a "garage lab at home" framing that is by design indistinguishable from a legitimate community-bio customer. Every M04 idea correctly flags the address as residential, but the manual review carve-out for community bio creates a structural pass-through that the attacker exploits. This is an inherent tension between the measure's intent (flag residential) and the policy goal of not excluding legitimate home-based labs.

### Complementary gaps

| Gap | Ideas that leave it open | Ideas that close it |
|---|---|---|
| International residential detection | m04-usps-rdi (US-only), m04-county-assessor (US-only), m04-str-coloc-sop (US/EU/tourist-market only) | m04-google-places-business (partial: OECD urban areas) |
| Active STR used as drop address | m04-usps-rdi (not an STR check), m04-county-assessor (not an STR check), m04-google-places-business (may show STR listing but not flagged as such) | m04-str-coloc-sop (catches active Airbnb/VRBO listings) |
| Richer land-use context beyond binary residential/commercial | m04-usps-rdi (binary only), m04-str-coloc-sop (not applicable) | m04-county-assessor (LBCS codes: mixed-use, live-work, agricultural, industrial), m04-google-places-business (business types: lodging, apartment, university, medical_lab) |

### Net coverage estimate

If a provider implemented all four M04 ideas:

- **Most** US customers shipping to residential addresses would be flagged with high confidence (RDI + county assessor + Google Places triple coverage).
- **Many** international customers in OECD urban areas would be flagged via Google Places (partial coverage).
- **Few** international customers in non-OECD or rural areas would be caught (Google Places sparse, all other ideas zero signal).
- Against the modeled threat set: **all five mapped stories are caught only on their residential-address edge variants.** The primary bypass methods in each story use commercial addresses that pass every M04 idea. The residential flag raises the attacker's minimum cost from $0 (home address) to ~$60-500/month (virtual office or coworking), which is a meaningful but not prohibitive cost increase.

## 3. Bypass cross-cut

### Universally uncovered bypasses

The following bypass patterns pass **every** M04 idea:

1. **Virtual office / executive suite** (Regus, IWG, Davinci, Alliance Virtual): classified as commercial by RDI, coded commercial by county assessor, has a Google Places business listing, and is not an STR. Used by: community-bio-lab-network, dormant-domain, cro-framing, gradual-legitimacy-accumulation, foreign-institution.

2. **Coworking space / maker space** (WeWork, BioLabs, Genspace): same as virtual office across all checks. Used by: community-bio-lab-network, dormant-domain, cro-framing.

3. **Biotech incubator bench** (LabCentral, BioLabs, university-affiliated): commercial address with a legitimate business listing. Used by: gradual-legitimacy-accumulation.

4. **Freight forwarder / customs broker**: real commercial address, no flags. Used by: foreign-institution.

5. **All non-US residential addresses in sparse-coverage areas**: zero signal from three of four ideas; Google Places may or may not have data.

### Bypass methods caught by at least one idea

| Bypass | Catching idea(s) | Missing idea(s) |
|---|---|---|
| Residential garage lab (own home) | m04-usps-rdi, m04-county-assessor, m04-google-places-business (all CAUGHT for US) | m04-str-coloc-sop (not an STR) |
| Residential colocation at $0 (dormant-domain) | m04-usps-rdi, m04-county-assessor, m04-google-places-business (all CAUGHT for US) | m04-str-coloc-sop |
| Active Airbnb/VRBO STR as drop (foreign-institution Method 4) | m04-str-coloc-sop (CAUGHT) | m04-usps-rdi (classified residential but does not identify STR specifically), m04-county-assessor (same), m04-google-places-business (may show lodging type) |
| Residential home office, OECD international (foreign-institution) | m04-google-places-business (CAUGHT in urban areas) | m04-usps-rdi (US-only), m04-county-assessor (US-only), m04-str-coloc-sop (may not have data) |

### Attacker stories where every idea fails

No story's **entire** bypass portfolio fails across all ideas — each story has at least one residential variant that is caught. However, the **primary** (cheapest, most commonly used) bypass methods in four of five stories use commercial addresses that pass all M04 ideas:

- **cro-framing**: primary method is virtual office / coworking lease (commercial address, passes all M04 ideas)
- **gradual-legitimacy-accumulation**: primary method is incubator bench or virtual office (commercial, passes all)
- **dormant-domain**: preferred path is biotech coworking or virtual office (commercial, passes all)
- **foreign-institution**: preferred commercial-address methods (local accomplice at real institution, freight forwarder) pass all

Only **community-bio-lab-network** has a residential address as its primary/cheapest method, and that address is caught by three ideas but may be released via the community-bio carve-out policy.

## 4. Bundling recommendations

### Recommended bundle: m04-usps-rdi + m04-google-places-business

This two-idea bundle provides the best coverage-per-dollar:

- **m04-usps-rdi** is the cheapest and most reliable US residential detection signal. At $0.001-$0.005/check (or $0 incremental if the provider already calls Smarty for m03), it delivers the authoritative USPS binary classification for every US address. It shares the same API call as m03-smarty-melissa, meaning zero additional integration cost for providers already running M03.

- **m04-google-places-business** adds international coverage and richer context. At $0.032-$0.035/check, it provides business-type classification globally wherever Google has data. It distinguishes lodging from lab, apartment building from university — nuance that the binary RDI flag cannot provide. For US addresses, it corroborates RDI with independent signal. **Caveat: deployment is gated on legal review of Google Maps Platform ToS for screening use.** If the ToS blocks this use, the provider must fall back to RDI-only for US and accept the international gap.

**Combined cost:** ~$0.035/check total. **Setup:** ~2 engineer-days + legal review for Google ToS.

### m04-county-assessor: not recommended for most providers

The county assessor check has an identical hit/miss profile to RDI across every mapped attacker story — it catches exactly the same residential variants and misses exactly the same commercial bypasses. Its advantage is richer land-use codes (mixed-use, live-work, agricultural), but this nuance rarely changes the reviewer's decision. At $80K/year for Regrid or $0.05-$0.20/call for ATTOM, the cost-per-incremental-signal is poor. **Exception:** providers with high-volume US orders who want independent corroboration and already have a Regrid license for other purposes may find the incremental cost acceptable.

### m04-str-coloc-sop: conditional add for specific threat profiles

The STR co-location SOP catches exactly one bypass variant (active Airbnb/VRBO listing used as a drop address, per foreign-institution Method 4). At $8-17/check in reviewer time, it is expensive relative to its narrow hit surface. **Recommended only for providers who:** (a) have material international customer bases where the foreign-institution threat is credible, (b) see upstream residential flags on addresses in tourist-market metros, and (c) can absorb the reviewer cost on the small number of escalated cases. For most providers, it is a nice-to-have, not essential.

### What no bundle can fix

1. **Commercial-address bypasses are outside M04's scope.** The measure detects residential addresses; it has no mandate or mechanism to detect virtual offices, coworking spaces, or other commercial addresses used as fronts. This is by design — M05 (institutional address verification) and M03 (CMRA detection) cover the commercial dimension.

2. **The community-bio carve-out is inherently exploitable.** The community-bio-lab-network story constructs a framing that is by design indistinguishable from a legitimate community-bio customer. No M04 idea can resolve this without signals from other measures (m09 institution legitimacy, m18/m19 researcher legitimacy).

3. **International residential detection remains weak.** Even with Google Places, non-OECD rural and Chinese addresses produce no signal. For providers with large international customer bases, M04 is effectively a US+OECD-urban measure. Closing this gap requires country-specific data sources that do not exist at reasonable cost for a synthesis provider's scale.
