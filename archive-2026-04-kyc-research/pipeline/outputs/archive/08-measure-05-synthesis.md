# Measure 05 — Shipping-Institution-Association: Per-Measure Synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| **m05-ror-gleif-canonical** | ROR, GLEIF, Companies House, OSM Overpass, GeoNames | <$0.02/check | Street-level mismatch: check satellite offices. Polygon/point mismatch: consult campus maps. No-record: investigate entity legitimacy. | 6+ (ghost-office, address-spoofing, shell-company, inbox-compromise, foreign-institution, visiting-researcher, dormant-domain, account-hijack — many contingent on OSM polygon) | 10-20% of customers have no record in any registry (early-stage biotech, community bio, non-UK commercial) | Same-city addresses for non-OECD institutions without OSM polygons; shell entities whose registered address matches shipping; inside-institution paths; carrier-level redirect |
| **m05-google-places-campus** | Google Places Text Search, OSM Overpass, Nominatim geocoder | ~$0.032/institution (cacheable) + ~$200/mo infra | Outside-polygon: check affiliate buildings <500m. Missing-polygon: construct manual fallback bounding box. | 6+ (cro-framing, inbox-compromise, account-hijack, visiting-researcher off-campus, dormant-domain, foreign-institution — all contingent on polygon existence) | Industry customers (~30-45% of orders) get zero signal; 40-50% of institutions globally lack OSM polygon | Biotech-incubator-tenant (inside polygon); inside-institution paths; carrier redirect; self-claimed entities with no polygon |
| **m05-incubator-tenant** | Scraped incubator tenant directories (~30-50 buildings) | ~$0/check (index lookup); $8-25/case manual review when triggered | Contact incubator manager by email; wait up to 5 business days. 10-30% FP rate among triggered cases. | 2 (biotech-incubator-tenant fraudulent claim; dormant-domain at tracked incubator) | <1% of orders fire the check; non-incubator addresses invisible; real tenants pass positively | Real incubator tenancy at $1,500-$5,000/mo; all non-incubator address types; JLABS and invitation-only programs |
| **m05-two-contact-sop** | Public institutional directory (phone + email verification) | $30-$60/case (30-60 min reviewer time) | This IS the manual review: phone switchboard + email departmental admin; 5-day response window; ~6-10 cases/day/FTE. | 10+ (shell-nonprofit, cro-framing, cro-identity-rotation, dormant-domain, inbox-compromise, foreign-institution, visiting-researcher, gradual-legitimacy-accumulation) | Industry customers (30-45%): switchboard won't confirm; GDPR-suppressed EU (10-20%); single-PI labs (10-20%); institutions refusing verification (5-15%) | Post-shipment carrier redirect; physical interception at institution; accomplice at real address; genuine-affiliation attacks confirmed rather than caught |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

Three coverage gaps appear in EVERY idea's gap list, indicating structural limitations of measure 05 as conceived:

1. **Post-shipment carrier redirect** (UPS My Choice, FedEx Delivery Manager, USPS COA). Every M05 idea operates at order time; carrier redirect occurs during transit. No address-association check can detect diversions that happen after the package leaves the provider. This is a finding for policymakers: M05 has a structural ceiling against the credential-compromise, account-hijack, and it-persona-manufacturing stories once the package is in transit.

2. **Inside-institution attackers.** All four ideas either miss or positively confirm attackers who operate from within a real institution (visiting-researcher shipping to host lab, it-persona-manufacturing at real campus, biotech-incubator-tenant with real bench lease). The address IS the institution's address, so the association check succeeds for the attacker. M05 cannot distinguish a legitimate researcher from a malicious insider at the same address.

3. **Industry customers with no institutional campus.** The ror-gleif-canonical and google-places-campus ideas fall back to city-level or no-signal for commercial entities without campus polygons (~30-45% of orders by count). The two-contact-sop fails because corporate switchboards refuse to confirm employees. The incubator-tenant idea is irrelevant. Industry customers structurally receive weak M05 signal.

### Complementary gaps

| Gap | Present in | Closed by | Notes |
|---|---|---|---|
| Entities not in any registry (10-20%) | ror-gleif-canonical, google-places-campus | two-contact-sop (can phone and verify) | SOP catches fabricated entities through `two_contact_independence_failure` |
| Non-OECD institutions without OSM polygons (15-25%) | ror-gleif-canonical, google-places-campus | two-contact-sop (language-permitting) | SOP works at English-speaking institutions; foreign-language gap persists |
| Biotech-incubator-tenant (structural miss at campus level) | ror-gleif-canonical, google-places-campus | incubator-tenant (catches fraudulent claims) | Only raises cost to ~$1,500-$5,000/mo for real tenancy |
| JLABS and invitation-only incubators | incubator-tenant | two-contact-sop (direct contact) | SOP can phone incubator manager as fallback |
| Shell entities whose registered address matches shipping | ror-gleif-canonical | two-contact-sop + google-places-campus | SOP catches no-directory shells; polygon catches off-campus shells |
| Multi-campus false positives (10-20% of large university orders) | google-places-campus, ror-gleif-canonical | two-contact-sop (phone confirms satellite site) | SOP resolves ambiguity but at $30-60/case |

### Net coverage estimate

If a provider deployed all four ideas, the combined coverage would reach **many** legitimate customers with reliable signal (est. 50-65% of orders). The remaining gap is dominated by: industry customers (~30-45%), non-OECD/non-Anglophone institutions (~10-15% with no polygon AND language barrier for SOP), and single-PI labs where the SOP's independence requirement fails (~10-20% of academic labs). The BOTEC from ror-gleif-canonical estimates 10-20% of customers have no registry record; google-places-campus estimates 40-50% of institutions lack polygons globally; two-contact-sop estimates reliable coverage for only 40-60% of academic customers.

## 3. Bypass cross-cut

### Universally uncovered bypasses

These bypass methods slip through EVERY M05 idea:

1. **Carrier-level redirect after order placement.** UPS My Choice / FedEx Delivery Manager / USPS COA diversions occur post-shipment. All four ideas operate at order time. Branch slugs: `credential-compromise`, `account-hijack`, `it-persona-manufacturing`.

2. **Physical interception at institutional mailroom/loading dock.** Attacker (or confederate) picks up the package at the real institutional address. The address-association check passed because the address IS the institution's. Branch slugs: `account-hijack`, `it-persona-manufacturing`.

3. **Accomplice at real institutional address (foreign-institution Method 2).** A paid local person receives at the institution and forwards. The institution confirms affiliation; the address is the institution's own. Branch slug: `foreign-institution`.

### Bypass methods caught by at least one idea

| Bypass method | Caught by | Missed by |
|---|---|---|
| Virtual office under shell entity / CRO / dormant-domain | two-contact-sop, ror-gleif-canonical (no-record flag) | google-places-campus (no polygon for self-owned entity), incubator-tenant (not an incubator) |
| CMRA in institution's metro (inbox-compromise) | google-places-campus (outside polygon), ror-gleif-canonical (polygon check), two-contact-sop | incubator-tenant (not an incubator address) |
| Fraudulent incubator-address claim (not a real tenant) | incubator-tenant | ror-gleif-canonical (address is in a biotech building), google-places-campus (inside polygon) |
| Off-campus virtual office (visiting-researcher) | google-places-campus (outside polygon), two-contact-sop | ror-gleif-canonical (may pass city-level), incubator-tenant (not an incubator) |
| IT-manufactured persona at directory-injected department | two-contact-sop (AMBIGUOUS - depends on which contact reviewer reaches) | All others (confirm attacker) |

### Attacker stories where every idea fails

- **credential-compromise** (carrier redirect is the dominant path)
- **account-hijack** physical interception sub-path
- **it-persona-manufacturing** carrier reroute sub-path
- **foreign-institution** Method 2 (accomplice at real address)
- **biotech-incubator-tenant** with real bench-space lease (passes all four checks positively)
- **visiting-researcher** shipping to host lab address (passes all four checks positively)
- **gradual-legitimacy-accumulation** incubator-bench variant (real tenant, real address)

## 4. Bundling recommendations

**Recommended core bundle: ror-gleif-canonical + google-places-campus + two-contact-sop.**

This three-idea bundle provides the strongest combined coverage:
- **ror-gleif-canonical** serves as the automated first pass, catching cross-city/cross-country mismatches at <$0.02/check and providing registry-based institutional identity.
- **google-places-campus** adds sub-city polygon containment for the ~60-80% of OECD institutions with OSM coverage, catching same-city virtual offices and CMRAs that slip through city-level matching.
- **two-contact-sop** sits behind both as the escalation path for ambiguous cases: no-record entities, polygon-missing institutions, and borderline matches. At $30-60/case, it should fire only when automated checks cannot resolve.

Together, these three close the virtual-office/CMRA gap (inbox-compromise, cro-framing), the shell-entity gap (shell-nonprofit, dormant-domain), and most of the foreign-institution off-campus paths. The bundle still leaves three gaps uncovered: carrier redirect (structural, requires carrier-level controls outside M05), inside-institution attackers (requires M18/M19 legitimacy checks), and industry customers (requires alternative institutional-verification approaches).

**Optional addition: incubator-tenant.** Adding the incubator-tenant check to the bundle provides targeted coverage for the biotech-incubator-tenant attacker story. Its value is as a cost-raiser (attacker must pay $1,500-$5,000/mo for real bench space) rather than a blocker. The extremely narrow firing surface (<1% of orders) means operational burden is minimal. However, the scraper maintenance cost grows linearly with the number of tracked incubators, and JLABS (13 locations, ~520 companies) has no public directory. Include only if the provider considers the biotech-incubator-tenant story a priority threat.

**Operational cost of the bundle:** The three-idea core introduces one vendor API dependency (Google Places, ~$0.032/institution cached), two self-hosted services (Nominatim + Overpass, ~$200/mo), five free API integrations (ROR, GLEIF, Companies House, GeoNames, Overpass), and one manual review queue (two-contact SOP at ~$30-60/case). A mid-size provider with 50K orders/year and a 5% borderline rate would need ~1 FTE dedicated to the SOP, plus 2-3 engineer-weeks of setup. Adding incubator-tenant adds ~1 engineer-week plus ~30 min/incubator/month of scraper maintenance.

**What the bundle cannot close:** Genuine-affiliation attacks (visiting-researcher, biotech-incubator-tenant with real lease, gradual-legitimacy-accumulation) pass all M05 checks positively. These require M18 (institution legitimacy), M19 (individual legitimacy), and M20 (voucher legitimacy) to address the intent question that M05 by design does not ask.
