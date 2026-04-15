# Measure 04 — shipping-residential: Per-measure synthesis

## Selected stack

| Field | m04-usps-rdi | m04-google-places-business |
|---|---|---|
| **Full name** | USPS RDI residential indicator (via Smarty / Melissa) | Google Places business presence |
| **What it does** | Binary residential/commercial flag from USPS AIS, consumed via Smarty API | Queries Google Places Nearby Search at shipping coordinates; returns business types, photos, status |
| **Geography** | US only | Global (signal quality degrades outside US/EU urban) |
| **Marginal cost** | $0.001–$0.005/lookup; $0 incremental if reusing m03 Smarty call | $0.032–$0.035/check (Advanced SKU) |
| **Setup cost** | ~1 day; Smarty account is self-service | ~1 day + legal review of Google Maps Platform ToS (days–weeks) |
| **Signal type** | Single binary flag (`metadata.rdi`: Residential / Commercial) | Structured: business types, photos, reviews, operational status |
| **Flags thrown** | `address_is_residential`, `rdi_unknown`, `rdi_data_stale` | `no_places_business_at_address`, `places_category_mismatch`, `places_category_residential`, `places_business_status_closed` |
| **FP population** | Garage labs / community bio, sole-proprietor home offices, live-work units, converted apartments | New/stealth-mode startups (30–50% of sub-12-month), security-conscious orgs, multi-tenant building mismatch, sparse international coverage |
| **Key dependency risk** | Smarty ToS for screening use (unconfirmed but no known restriction) | Google Maps Platform ToS — restrictive clause may block deployment; narrowed to Places Aggregate API specifically but needs legal opinion |
| **Attacker stories addressed** | All 5 mapped stories (residential variants only) | All 5 mapped stories (residential variants only); adds international coverage for foreign-institution |

---

## Coverage gap cross-cut

### Structural gaps (inherent to M04 as a measure)

These gaps cannot be closed by any M04 idea — they are boundaries of the measure's mandate.

| Gap | Nature | Affected stories | Mitigation path |
|---|---|---|---|
| **All commercial-address bypass methods** | Structural — M04 classifies residential vs. commercial; any commercial address passes by design | All 5 stories (virtual offices, coworking, maker spaces, executive suites, biotech incubator benches, freight forwarders) | Downstream measures: m03 (CMRA), m05 (institutional address verification), m09 (institution legitimacy) |
| **Home-office / garage-lab false positives** | Structural — M04 correctly identifies residential but cannot distinguish legitimate home-based labs from drop addresses | community-bio-lab-network, cro-framing | Institution-class-aware review policy with carve-out for community bio (lab photos, BSL designation, fume hood permits) |

### Complementary gaps (addressable by stacking the two selected ideas)

| Gap | Which idea has it | How the other idea helps |
|---|---|---|
| **International addresses (40–55% of orders)** | m04-usps-rdi: zero signal | m04-google-places-business: provides signal in OECD urban areas; leaves residual gap in non-OECD rural / China |
| **Binary-only signal (no context for reviewers)** | m04-usps-rdi: Residential / Commercial only | m04-google-places-business: returns business types, photos, reviews — reduces reviewer time-to-decision |
| **New labs not yet on Google Places (3–12 month lag)** | m04-google-places-business: false positive | m04-usps-rdi: RDI correctly classifies the address regardless of business listing age (US only) |
| **Mixed-use building unit-level accuracy (85–95%)** | m04-usps-rdi: building-level RDI may misclassify | m04-google-places-business: returns specific businesses at address, partially disambiguating |

### Residual gaps after stacking both ideas

| Gap | Estimated scope | Notes |
|---|---|---|
| **Non-OECD rural / China international addresses** | 10–20% of international orders | Google blocked in China; sparse Places data in developing regions. No M04 signal available. Reliance on m05, m09. |
| **New construction (US, 3–6 month RDI assignment lag)** | Small fraction of US orders | RDI returns `rdi_unknown`; Places may or may not have data. |
| **Security-conscious orgs suppressing public presence** | Few dozen to low hundreds of US facilities | Both ideas miss. Small population but high-value customers. |

---

## Bypass methods uncovered cross-cut

The following attacker bypass methods survive the entire selected stack (both m04-usps-rdi and m04-google-places-business). These are methods that use commercial addresses and therefore fall outside M04's residential detection mandate.

| Bypass method | Attacker stories using it | Why it survives M04 | Which downstream measure catches it |
|---|---|---|---|
| **Virtual office** (Regus, IWG, iPostal1) | community-bio-lab-network, dormant-domain, cro-framing, gradual-legitimacy-accumulation, foreign-institution | Classified as commercial by RDI; has legitimate Places listing | m03 (CMRA flag for mail aggregators); m05 (institutional address mismatch) |
| **Coworking at biotech cluster** | community-bio-lab-network | Commercial address; legitimate Places listing | m05 (tenant verification); m09 (institution legitimacy) |
| **Maker space address** | community-bio-lab-network | Commercial address; legitimate Places listing | m09 (institution legitimacy check) |
| **Biotech coworking** | dormant-domain | Commercial address; legitimate Places listing | m05 (incubator tenant verification) |
| **Executive suite** | cro-framing | Commercial address; legitimate Places listing | m03 (CMRA flag if suite is a CMRA); m05 |
| **Coworking lease** | cro-framing | Commercial address; legitimate Places listing | m05; m09 |
| **Freight forwarder** | foreign-institution | Commercial address; legitimate Places listing | m03 (CMRA flag); m05 (address mismatch with claimed institution) |
| **Local accomplice at real institution** | foreign-institution | Ships to a genuine institutional address | Not catchable by address checks — requires m06 (end-user verification), m09 |
| **Incubator bench** | gradual-legitimacy-accumulation | Commercial address; legitimate Places listing | m05 (incubator tenant verification) |
| **Residential address in non-OECD rural / China** | foreign-institution | RDI: no signal (non-US). Places: no signal (sparse/blocked coverage) | m05 (institutional address verification); m09 (institution legitimacy) |

---

## Structural gaps — open issues

1. **Google Maps Platform ToS (blocking).** The restrictive clause in Google's service-specific terms may prohibit using Places API output for customer screening. The 04C claim check narrowed the scope (the clause targets the Places Aggregate API, not the standard API), but no legal opinion has been obtained. If standard Places API use is also prohibited, the stack falls back to RDI-only with no international M04 signal. **Status: must resolve before deployment.**

2. **Smarty ToS for screening use (non-blocking but unconfirmed).** No known restriction on B2B KYC use of the Smarty US Street API, but this has not been explicitly confirmed with Smarty. **Status: verify with vendor.**

3. **International coverage gap after stacking (residual).** Even with Google Places, an estimated 10–20% of international orders (non-OECD rural, China) have no M04 signal. The provider must accept this gap at M04 and rely on m05 and m09. **Status: accepted structural limitation; document in provider guidance.**

4. **New-lab false positive rate (unquantified).** The estimate that 30–50% of sub-12-month startups lack a Google Places listing is an ungrounded best guess. The actual FP burden on reviewers from this population is unknown. **Status: needs empirical measurement after deployment.**

5. **Mixed-use building RDI accuracy (unverified).** The 85–95% unit-level accuracy estimate for RDI in mixed-use buildings has no external citation. **Status: best guess, monitor in production.**

6. **Category-mismatch flag lacks defined suspicious-type list.** The `places_category_mismatch` flag has no enumerated list of which Google Places types are incompatible with a claimed lab. Without this, the flag relies on reviewer judgment. **Status: define type-incompatibility matrix before deployment.**

7. **All commercial-address bypasses survive M04 by design.** M04's mandate is residential detection. Virtual offices, coworking, maker spaces, executive suites, freight forwarders, and incubator benches are structurally outside scope. These must be caught by m03 (CMRA), m05 (institutional address), and m09 (institution legitimacy). **Status: accepted; no M04 action needed.**
