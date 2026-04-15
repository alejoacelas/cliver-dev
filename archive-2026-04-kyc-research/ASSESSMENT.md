# KOSC Screening Tools — Automation & Coverage Assessment

This document assesses each CSSWG screening tool across two dimensions:
1. **Automation level** — how much human input is needed, operationalized as estimated hours per customer
2. **Global coverage** — how well the tool works across countries where life science researchers reside

---

## Summary Table

| # | Tool | Tier | Automation | Hours/Customer | Global Coverage | Data Sources | API Cost |
|---|------|------|------------|----------------|-----------------|--------------|----------|
| 1 | Sanctions List Name Screening | 1 | Full | ~0.01h (auto) + 0.1h/flag | High | OFAC SDN, UN, EU, UK lists | Free (public data) |
| 2 | Email Domain Verification | 1 | Full | ~0.01h | Medium-High | DNS, ROR domain mappings | Free |
| 3 | Institution Verification | 1 | Mostly | ~0.02h (auto) + 0.25h/suspicious | Medium | ROR, OpenAlex | Free |
| 4 | Individual Legitimacy | 1 | Full | ~0.02h (auto) + 0.3h/no-evidence | Medium | PubMed, Semantic Scholar, OpenAlex, NIH Reporter | Free |
| 5 | Shipping Address Sanctions | 1 | Full | ~0.005h | High | Country sanctions lists | Free (public data) |
| 6 | Institution Sanctions Screening | 1 | Full | ~0.01h (auto) + 0.1h/flag | High | BIS Entity List, OFAC, UN, EU | Free (public data) |
| 7 | Address Type Classification | 2 | Full | ~0.01h | Low-Medium | Pattern matching (geocoding for prod) | Free (pattern) / $0.005/lookup (geocoding) |
| 8 | Affiliation Verification | 2 | Semi | ~0.05h (auto) + 0.2h/not-found | Medium | OpenAlex, PubMed | Free |
| 9 | Phone VoIP Detection | 2 | Full | ~0.005h | High | Carrier lookup APIs | $0.005/lookup (Twilio) |
| 10 | Billing Address Association | 2 | Semi | ~0.03h (auto) + 0.1h/inconclusive | Low-Medium | ROR (geocoding for prod) | Free (ROR) |
| 11 | Payment Method Screening | 2 | Full | ~0.005h | High | BIN databases | Free (binlist.net) / paid for better coverage |
| 12 | SOC Self-Declaration Cross-Check | 3 | Full | ~0.001h | N/A | Internal (sequence screening output) | Free |
| 13 | MFA Step-Up Authentication | 3 | Full | ~0.001h | N/A | Internal (account system) | Free |
| 14 | Pre-Approval Screening | 3 | Full | ~0.001h | N/A | Internal (CRM/database) | Free |
| 15 | Voucher-Based Legitimacy | 3 | Semi | ~0.05h auto + 0.5-2h waiting | N/A | Form workflow + tools #2-4 for referent | Free |
| 16 | Identity Document Verification | 3 | Full (vendor) | ~0.01h | Medium-High | Vendor (Onfido, Jumio, etc.) | $1-3/verification |

---

## Tier 1 — Build First

### 1. Sanctions List Name Screening

**Automation:** Fully automated. The tool runs fuzzy matching (Fuse.js, threshold 0.4) against consolidated sanctions lists. Exact matches (>95% similarity) are hard denies. Near-matches (70-95%) are flagged for human triage. Below 70% is treated as no match.

**Hours/customer:** ~0.01h automated. Near-matches add ~0.1h for a human to assess whether it's a name collision or genuine hit. In practice, with common names (e.g., "Kim" in Korean), expect ~5-10% of customers to generate near-match flags.

**Global coverage:** High. Sanctions lists exist for all major jurisdictions. The prototype covers OFAC SDN, UN Consolidated, EU Consolidated, and BIS Entity List. The main challenge is **non-Latin scripts and transliteration** — a name romanized differently across lists may produce false negatives. Production should normalize names (remove diacritics, standardize romanization) before matching.

**What the prototype reveals:** False positive rate on common names across different cultural naming conventions. With the sample data, fuzzy matching handles basic transliteration variants (e.g., "LUKASHENKA" vs "LUKASHENKO") but would need more sophisticated normalization for Arabic, Chinese, and Korean names.

---

### 2. Email Domain Verification

**Automation:** Fully automated for known institutional domains. The tool checks against a database of institution-to-domain mappings and flags free email providers (Gmail, Yahoo, etc.) and domain mismatches.

**Hours/customer:** ~0.01h. Flagged non-institutional domains add ~0.05h for follow-up (asking customer to provide institutional email).

**Global coverage:** Medium-High for well-known universities (MIT, Oxford, Tsinghua, etc.). Coverage drops significantly for:
- Small institutions without standard academic TLDs
- Government labs in countries where .gov isn't consistently used
- Private biotech companies and startups
- Institutions using country-code TLDs with no centralized registry

**Key gap:** The prototype uses a static domain mapping. Production should integrate with ROR (which includes domain data for ~110K organizations) and GRID/Ringgold for broader coverage. Even then, ~20-30% of institutions globally may not have mappable domains.

---

### 3. Institution Verification

**Automation:** Mostly automated. The tool queries ROR (Research Organization Registry) for institutional identity and OpenAlex for academic output and life sciences relevance. Verified results are fully automated; suspicious/not-found results need human investigation.

**Hours/customer:** ~0.02h automated. Suspicious cases add ~0.25h for manual investigation (searching the institution online, checking corporate registries).

**Global coverage:** Medium. ROR has ~110K organizations, which covers most research universities worldwide but misses:
- Small labs and startups (not in any registry)
- Government agencies with research arms
- Many institutions in Africa, Southeast Asia, and parts of South America
- Recently established organizations

**What the prototype reveals:** The ROR + OpenAlex combination gives strong signals for established research institutions. The "life sciences connection" check via OpenAlex topics helps filter out non-relevant institutions (e.g., a law school). The main blind spot is small/new organizations that have no registry presence — these require manual investigation.

---

### 4. Individual Legitimacy — Publication & Grant History

**Automation:** Fully automated search across four databases in parallel. The tool looks for publications (PubMed, Semantic Scholar, OpenAlex) and grants (NIH Reporter) to assess whether someone is a legitimate researcher.

**Hours/customer:** ~0.02h automated. No-evidence cases add ~0.3h for manual verification (contacting institution, asking for ORCID, etc.).

**Global coverage:** Medium. The free academic APIs have good coverage for:
- Researchers publishing in English-language journals
- NIH-funded researchers (US only for grants)
- Researchers with ORCID profiles

Coverage drops for:
- Early-career researchers with 0-2 publications
- Researchers publishing primarily in non-English journals
- Lab technicians, managers, and other non-publishing roles
- Researchers in countries with less online academic infrastructure

**What the prototype reveals:** The parallel search across 4 APIs significantly reduces false negatives — a researcher might be in Semantic Scholar but not PubMed, or vice versa. The h-index from OpenAlex provides a quick signal strength indicator. The main concern is **common name ambiguity** — "Wei Zhang" will match hundreds of researchers across all databases.

---

### 5. Shipping Address Screening (Sanctions/Export Control)

**Automation:** Fully automated. Country extraction from address text + lookup against comprehensive sanctions (US, EU, UN) and partial restrictions. No human input needed for clear/embargoed results.

**Hours/customer:** ~0.005h. Essentially instant. Embargoed countries are hard denies; restricted countries trigger enhanced screening.

**Global coverage:** High. Country-level sanctions are well-documented. Edge cases handled:
- Disputed territories (Crimea, Kosovo, Taiwan)
- Partial sanctions (Belarus, Venezuela — entity-level, not comprehensive)
- Countries with specific export controls for biological materials (China, Pakistan)

**What the prototype reveals:** The main risk is address parsing — free-form addresses don't always have clean country extraction. Production should use geocoding APIs for robust country identification. The sanctions data itself is straightforward and changes infrequently (quarterly updates from OFAC, more frequent from EU).

---

### 6. Institution Sanctions Screening

**Automation:** Fully automated with fuzzy matching. Same approach as name sanctions (#1) but against entity/institution lists. BIS Entity List is the most critical list for DNA synthesis (contains defense-connected institutions and bioweapons-related entities).

**Hours/customer:** ~0.01h automated. Near-matches add ~0.1h for human triage.

**Global coverage:** High. The BIS Entity List, OFAC SDN, UN, and EU entity lists cover the most significant restricted entities globally. The challenge is **institutions with multiple names** across languages (e.g., "Beijing University of Aeronautics and Astronautics" vs "Beihang University" vs "北京航空航天大学") — the prototype handles English aliases but not CJK characters directly.

---

## Tier 2 — Build Next

### 7. Shipping Address Type Classification

**Automation:** Fully automated via pattern matching. Detects PO Boxes, freight forwarders, residential vs. institutional addresses using regex patterns across multiple languages.

**Hours/customer:** ~0.01h. Unknown classifications add ~0.05h for follow-up.

**Global coverage:** Low-Medium. Pattern matching works well for:
- US/UK/EU addresses (PO Box detection, institutional keywords)
- Major languages (English, Spanish, French, German, Italian, Portuguese)

Works poorly for:
- Countries with non-standardized address formats
- Addresses in non-Latin scripts (requires transliteration first)
- Countries where residential delivery is the norm for institutional orders

**Production gap:** For reliable classification, integrate Google Places API or SmartyStreets ($0.005/lookup). The current pattern-based approach catches obvious cases but misses ambiguous ones.

---

### 8. Affiliation Verification

**Automation:** Semi-automated. Checks OpenAlex and PubMed for evidence linking a person to an institution. Multiple sources increase confidence.

**Hours/customer:** ~0.05h automated. Not-found results add ~0.2h for manual outreach (emailing institution, checking staff directories).

**Global coverage:** Medium. Depends entirely on whether:
- The person publishes (many institutional staff don't)
- The institution is indexed in OpenAlex
- Publications list the correct affiliation

Overlaps significantly with tools #2 (email domain) and #4 (individual legitimacy) — in practice, these three tools provide complementary signals and should be run together.

---

### 9. Phone Number VoIP Detection

**Automation:** Fully automated via carrier lookup API. The prototype provides country identification and basic format validation; production requires a carrier lookup API (Twilio Lookup, numverify) for definitive VoIP classification.

**Hours/customer:** ~0.005h. VoIP is a soft flag — it warrants follow-up but is never a deny on its own.

**Global coverage:** High via APIs like Twilio Lookup, which covers 200+ countries. VoIP detection accuracy is strong for well-known providers (Google Voice, Skype, Twilio numbers) but can miss smaller regional VoIP providers.

**Cost:** ~$0.005/lookup via Twilio. At scale (10K customers/month), ~$50/month.

---

### 10. Billing Address vs. Institution Association

**Automation:** Semi-automated. Uses ROR to get institution location, then compares against billing address at city/country level. Many mismatches are legitimate (procurement offices, branch campuses).

**Hours/customer:** ~0.03h automated. Inconclusive results add ~0.1h for manual check.

**Global coverage:** Low-Medium. Billing address comparison is inherently noisy because:
- Centralized procurement departments bill from different locations
- Hospital systems and multi-campus institutions have many addresses
- International billing arrangements are common in academia
- Some institutions use external purchasing services

**Production gap:** Geocoding APIs would improve from city-name matching to distance-based comparison (e.g., "within 50km of known campus locations").

---

### 11. Payment Method Screening (Gift Card / Crypto Detection)

**Automation:** Fully automated. BIN lookups identify prepaid/gift cards; crypto detection depends on payment integration.

**Hours/customer:** ~0.005h. Prepaid/gift cards are hard flags requiring immediate follow-up or denial per CSSWG standard.

**Global coverage:** High. BIN databases have global coverage. The free binlist.net API provides basic card type and prepaid status. Commercial databases (binbase.com, maxmind) offer better coverage and accuracy.

**Cost:** Free via binlist.net (rate-limited). $0.001-0.01/lookup for commercial databases.

---

## Tier 3 — Build Later

### 12. SOC Self-Declaration Cross-Check

**Automation:** Fully automated. Boolean comparison between customer's declaration and screening result. The value is in the **workflow integration**, not the check itself.

**Hours/customer:** ~0.001h. The mismatch direction matters:
- Customer says SOC, screening says no → mild flag (honest/cautious customer)
- Customer says no SOC, screening says yes → **strong flag** (possible evasion)

**Global coverage:** N/A — applies to all orders regardless of geography.

---

### 13. MFA Step-Up Authentication

**Automation:** Fully automated. Standard auth pattern — check MFA status, block if not enabled for SOC orders.

**Hours/customer:** ~0.001h. Instant check.

**Global coverage:** N/A — account security feature.

**Open question from CSSWG:** Whether to require MFA for all accounts (simpler UX, better security posture) or only for SOC orders (lower friction for non-SOC customers).

---

### 14. Pre-Approval / Repeat Customer Screening

**Automation:** Fully automated. Database lookup of customer history and pre-approval status.

**Hours/customer:** ~0.001h. Pre-approved customers skip full verification, saving ~0.5-1h per SOC order.

**Global coverage:** N/A — internal system. Effectiveness depends on how many customers place repeat SOC orders (likely 10-20% of SOC volume based on industry patterns).

---

### 15. Voucher-Based Legitimacy Verification

**Automation:** Semi-automated. Form dispatch and rule validation are automated; the bottleneck is **waiting for the referent to respond** (typically 1-5 business days).

**Hours/customer:** ~0.05h of automated work + 0.5-2h of elapsed time waiting for referent. The automated validation checks:
- Referent seniority (not student/intern)
- Relationship duration (>= 1 year)
- Institutional email usage
- Trust level assessment

**Global coverage:** N/A as a workflow tool. Practical coverage depends on:
- Whether the customer can identify a suitable referent
- Whether the referent responds (academic email response rates vary)
- Cultural norms around professional references in different regions

---

### 16. Identity Document Verification

**Automation:** Fully automated via vendor integration (Onfido, Jumio, Persona, Veriff). This is a vendor evaluation, not a build-from-scratch tool.

**Hours/customer:** ~0.01h via vendor. Manual fallback (human document review): ~0.5h.

**Global coverage:** Medium-High via vendors:
- Passports: 200+ countries
- National IDs: varies (strong in EU/US/UK, weaker in some African/Asian countries)
- Institutional IDs: not supported by most vendors (custom integration needed)

**Cost:** $1-3 per verification at scale. All major vendors offer volume discounts.

**Recommendation:** Evaluate Persona (best developer experience, customizable workflows) and Onfido (strongest NFC/biometric support) for the CSSWG use case.

---

## Aggregate Cost Estimate

For a provider processing **1,000 orders/month** where ~10% are SOC orders:

| Category | Per-order cost | Monthly cost |
|----------|---------------|--------------|
| Tier 1 tools (free APIs) | $0 | $0 |
| Address classification (geocoding) | $0.005 | $5 |
| Phone VoIP detection | $0.005 | $5 |
| BIN lookup (commercial) | $0.005 | $5 |
| ID verification (SOC only, ~100/mo) | $2.00 | $200 |
| **Total** | | **~$215/month** |

Human review time (estimated):
- ~5% of orders flagged for manual review across all tools
- ~0.3h average per flagged order
- **~15 hours/month** of human review time for 1,000 orders

---

## Coverage Gap Analysis by Region

| Region | Coverage Strength | Gaps |
|--------|------------------|------|
| North America | Very High | Minimal — most tools have excellent coverage |
| Western Europe | Very High | Minimal |
| East Asia (JP, KR, SG, AU, NZ) | High | Some transliteration issues for names |
| China | Medium-High | Institution naming in CJK, some institutions not in ROR |
| South America | Medium | Smaller institutions missing from ROR, non-English publications |
| Eastern Europe | Medium | Some institutions not in ROR, address format variation |
| South/Southeast Asia | Medium | Institution coverage varies, residential delivery norms |
| Middle East | Medium | Transliteration challenges (Arabic names), some institutions not indexed |
| Africa | Low-Medium | Many institutions not in ROR, limited publication indexing, address classification poor |
| Central Asia | Low | Limited institutional data, few indexed publications |

The highest-impact investment for improving global coverage is **expanding the institution database** (tool #3) beyond ROR, particularly for institutions in Africa, South/Southeast Asia, and Central Asia.
