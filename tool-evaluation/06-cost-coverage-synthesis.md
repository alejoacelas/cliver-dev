# Stage 6 — BOTEC Cost & Coverage Synthesis

**Basis:** 5 KYC-step assessments (stages 3-4), 9 endpoint result sets, endpoint manifest, 134-record customer dataset.
**Cost rate:** $40/hour fully-loaded customer representative.
**Scale assumption:** 1,000 orders/month (for monthly totals).

---

## 1. Profile Group Inventory

Unified across all 5 KYC steps. Each group appears in every step but at different time tiers.

| ID | Profile Group | Description | Key Distinguishing Factors |
|----|--------------|-------------|---------------------------|
| PG-01 | Established OECD academic | Major university or research institute in ROR, >100 PubMed articles, .edu/.ac.uk/.edu.au domain. Includes US, EU, UK, AU, JP, KR, IL, SG. | In ROR; Google Places returns `university`/`research_institute`; institutional email domain |
| PG-02 | Established non-OECD academic | Major university in non-OECD country, in ROR (e.g., Nairobi, Makerere, Tsinghua, IIT Bombay). Strong PubMed presence. | In ROR; country is Group B or D; may use free email (163.com, naver.com) |
| PG-03 | Multi-campus institution (city mismatch) | University with satellite campuses; shipping address at a campus not in the primary ROR record. | In ROR but city doesn't match; Griffith (Brisbane/Gold Coast), CSIRO (Australia-wide), CDC (multi-country) |
| PG-04 | Large pharma / CRO at known address | Major pharmaceutical or contract research org. In ROR and/or GLEIF, substantial PubMed. | In registries; Google Places returns `manufacturer`/`corporate_office`; institutional card |
| PG-05 | Mid-size OECD biotech (in OpenCorporates or with publications) | Biotech with 50-500 employees, some PubMed presence, own commercial address. Not in ROR but findable via web search. | PubMed >50 articles; Google Places returns `premise`; own email domain |
| PG-06 | Small biotech at coworking/incubator | Small biotech (<50 employees) at LabCentral, BioLabs, JLABS, or similar. Not in any registry. | Zero registry results; Exa may detect incubator address; company may have minimal web presence |
| PG-07 | Small biotech at own commercial address | Small biotech at generic commercial space. Not in registries. Indistinguishable from any commercial tenant. | Zero registry results; Smarty=Commercial; Google Places=premise; only web search helps |
| PG-08 | Community bio lab / makerspace | Genspace, BioCurious, La Paillasse, etc. Zero registry coverage, zero funding signals. | Zero in ROR/GLEIF/NIH/NSF; <10 PubMed; Google Places may return `non_profit_organization` |
| PG-09 | Government research lab (sub-unit) | Government lab that may/may not have its own ROR record. | Parent agency typically in ROR; sub-unit coverage depends on publication volume |
| PG-10 | Sanctioned-country institution researcher | Researcher at institution in Iran/Russia/etc. Institution may be in ROR but country triggers export controls. Free email masks affiliation. | Country Group D/E; institution domain may have zero DNS; email is yahoo/gmail/163.com |
| PG-11 | Common-name researcher with free email | Wei Zhang, Maria Garcia, Qiang He -- thousands of results in ORCID/OpenAlex. Free email (163.com, gmail.com). | Name disambiguation impossible; free email; need customer-provided evidence |
| PG-12 | Researcher using fintech/neobank card | Startup employee paying with Mercury, Brex, Relay card. Otherwise legitimate. | Fintech BIN denylist match; card is not prepaid; company may be verified through other steps |
| PG-13 | Researcher paying with personal card from home | Academic using personal credit/debit billed to home. The most common legitimate pattern. | card.funding=credit/debit; billing != institution (soft_flag); same metro area |

---

## 2. Fraction Estimates

### Evidence sources and their biases

- **customers.csv (134 records):** Drawn from publications on controlled agents. Overweights: academia (41.8% controlled agent academia), sanctioned institutions (18.7%), non-OECD countries (China 20.9%, Russia 9.7%, Iran 5.2%). Underweights: US/EU academia (US is only 4.5%), industry, community labs (0%).
- **Industry knowledge:** Most DNA synthesis revenue comes from US/EU academic and pharma customers. Community bio labs are <5% of orders. Chinese academic customers are significant but publication-derived data overstates them relative to US/EU.
- **Stage 3 test cases:** Adversarially biased toward hard cases. Not representative of order mix.

### Fraction tree

```
Orders (100%)
├── Academic (55%)
│   ├── PG-01: Established OECD academic (35%)
│   │   Evidence: customers.csv has ~30 US/EU/AU/JP academics out of 134 (22%), but dataset
│   │   underweights OECD. Real order mix is US/EU-dominated. ROR covers ~110K orgs; stage 3
│   │   tested 22/25 institutions found in ROR + PubMed. Google Places returns university for
│   │   MIT, Oxford, Pasteur, IIT Bombay, Tsinghua, USP, Makerere, NUST.
│   │
│   ├── PG-02: Established non-OECD academic (10%)
│   │   Evidence: customers.csv has ~45 non-OECD academics (33%), but dataset overweights this
│   │   category (Frontiers paper focus). Real market share is lower. Includes China (~8%), 
│   │   India (~1%), Africa (<1%), other (~1%). All tested non-OECD universities found in ROR.
│   │
│   ├── PG-03: Multi-campus institution (2%)
│   │   Evidence: 3/35 stage 3 address cases (Griffith, CSIRO, CDC). Fraction is small because
│   │   most orders ship to the main campus.
│   │
│   ├── PG-09: Government lab sub-unit (3%)
│   │   Evidence: 4/35 institution-registry cases (NML, Lincoln Lab, CDC, USAMRIID). Government
│   │   labs are a meaningful fraction of synthesis customers (NIH, USAMRIID, CDC, CSIRO, INRAE).
│   │
│   └── PG-11: Common-name researcher + free email (5%)
│       Evidence: 5/28 individual-affiliation cases. customers.csv has 18 Chinese free email
│       (163.com/126.com/qq.com) out of 134 (13.4%), but dataset overweights China. Real
│       fraction: ~5% of orders come from researchers where name disambiguation is the bottleneck.
│
├── Industry (30%)
│   ├── PG-04: Large pharma / CRO (15%)
│   │   Evidence: 5/25 funding cases (Pfizer, Charles River, WuXi, Eurofins). Large pharma and
│   │   CROs are the main commercial customers. All found in registries + PubMed.
│   │
│   ├── PG-05: Mid-size OECD biotech (8%)
│   │   Evidence: Agilent-like companies. In OpenCorporates or with publications. Not in ROR
│   │   but findable via web search. Google Places returns premise but Exa finds corporate info.
│   │
│   ├── PG-06: Small biotech at coworking/incubator (3%)
│   │   Evidence: 6/35 institution-registry cases were small biotechs (all zero in registries).
│   │   LabCentral and BioLabs both invisible to Google Places. JLABS classified as corporate_office.
│   │   Concentrated in US biotech hubs.
│   │
│   ├── PG-07: Small biotech at own commercial address (3%)
│   │   Evidence: Lay Sciences pattern. Zero across all registries. PubMed false positive
│   │   for common-word names. Only web search / state incorporation records provide verification.
│   │
│   └── PG-12: Fintech neobank card user (1% -- overlaps with PG-06/PG-07)
│       Evidence: 2/10 payment-bin cases (Mercury, Brex). All 9 known fintech BINs detected by
│       denylist. Common for startups but a subset of PG-06/PG-07, not additive.
│
├── Other (10%)
│   ├── PG-08: Community bio lab / makerspace (2%)
│   │   Evidence: 5/35 institution-registry cases, 4/25 funding cases. All returned hard zero
│   │   across all registries and funding databases. <5% of market per industry knowledge.
│   │   customers.csv has 0 community labs (bias: publication-derived dataset misses them entirely).
│   │
│   └── PG-10: Sanctioned-country institution (3%)
│       Evidence: customers.csv has 25/134 (18.7%) sanctioned institution, but this is massively
│       overweighted. Real fraction: ~3% based on Iran, Russia, DPRK, Syria, Cuba being a small
│       share of the global synthesis market. Most flagged by BIS country group before other checks.
│
└── PG-13: Personal card (home billing) — cross-cutting (60-70% of all orders)
    Evidence: documented as "the most common legitimate pattern" in assessment (b). Researcher
    pays with personal debit/credit billed to home. Billing != institution is the NORMAL case.
    Not a separate fraction — it's a payment pattern that spans PG-01 through PG-09.
```

### Summary fractions used for cost calculations

| ID | Profile Group | Fraction | Confidence |
|----|--------------|----------|------------|
| PG-01 | Established OECD academic | 35% | Medium-high |
| PG-02 | Established non-OECD academic | 10% | Medium |
| PG-03 | Multi-campus (city mismatch) | 2% | Low |
| PG-04 | Large pharma / CRO | 15% | Medium |
| PG-05 | Mid-size OECD biotech | 8% | Medium |
| PG-06 | Small biotech at incubator | 3% | Low |
| PG-07 | Small biotech at own address | 3% | Low |
| PG-08 | Community bio lab | 2% | Low-medium |
| PG-09 | Government lab sub-unit | 3% | Low |
| PG-10 | Sanctioned-country institution | 3% | Medium |
| PG-11 | Common-name + free email | 5% | Medium |
| PG-12 | Fintech neobank card | 1% | Low |
| PG-13 | Personal card from home | 60-70% cross-cutting | High |

Note: PG-11 through PG-13 overlap with PG-01 through PG-10 (e.g., a PG-02 researcher may also be PG-11 and PG-13). For cross-step rollup, PG-01 through PG-10 are the primary groups (sum to ~89%, with ~11% unallocated margin). PG-11 adds time within step (c) only. PG-12 and PG-13 affect step (b) only.

---

## 3. Per-KYC-Step Cost Tables

### Step (a): Address-to-Institution

**Recommended endpoint combination:** ROR (free) + Google Places name+address ($0.032) + PubMed (free) + Exa (on flagged cases, $0.007) + NIH/UKRI (free, supplementary).

**API cost per order:**
- ROR lookup: $0.00
- Google Places Text Search: $0.032 (every order)
- PubMed affiliation search: $0.00
- Exa web search (on ~20% of orders that aren't auto-resolved): $0.007 x 0.20 = $0.0014
- **Total API: $0.033/order**

**Human time by profile group:**

| Profile Group | Fraction | Time Tier | Est. Time | Evidence |
|--------------|----------|-----------|-----------|---------|
| PG-01 OECD academic | 35% | auto | 0 min | ROR city match + PubMed >100 + Google Places=university. MIT, Oxford, Scripps all auto-pass (stage 3 cases 1-2). |
| PG-02 Non-OECD academic | 10% | auto | 0 min | ROR city match + PubMed. Nairobi, Tsinghua, IIT Bombay all in ROR (stage 3 cases 11, 21, 19). |
| PG-03 Multi-campus | 2% | quick_review | 2-3 min | ROR finds institution but city mismatch. Reviewer checks satellite campus. Griffith, CSIRO, CDC (stage 3 cases 6, 23, 19). |
| PG-04 Large pharma/CRO | 15% | auto | 0 min | ROR/GLEIF + PubMed + Google Places=manufacturer. Pfizer, Charles River, Eurofins (funding cases 3, 18, 20). |
| PG-05 Mid-size biotech | 8% | quick_review | 1-2 min | Not in ROR. Google Places=premise. Quick web search to verify company exists. Agilent pattern (address case 4). |
| PG-06 Small biotech/incubator | 3% | investigation | 5-15 min | Zero in all registries. Exa may ID incubator. Web search for company. LabCentral, BioLabs invisible (address cases 6, 11). |
| PG-07 Small biotech/own address | 3% | investigation | 10-15 min | Zero in registries. Generic commercial. Must check incorporation, LinkedIn. Lay Sciences (funding case 8). |
| PG-08 Community bio lab | 2% | customer_follow_up | 15-30 min | Zero in all registries and funding DBs. Must verify biosafety setup. Genspace, BioCurious (institution-registry cases 10-14). |
| PG-09 Government lab | 3% | quick_review | 2-5 min | Check ROR for parent + sub-unit. NML not in ROR, Lincoln Lab has own record (inst-registry cases). |
| PG-10 Sanctioned-country | 3% | auto (export control handles) | 0 min | Institution may be in ROR but step (e) catches country before step (a) matters. BIS Group E = auto-deny. |
| Other/unclassified | 6% | quick_review | 2-3 min | Safety margin. Assume quick review. |

**Weighted average human time per order:**
```
= (0.35 x 0) + (0.10 x 0) + (0.02 x 2.5) + (0.15 x 0) + (0.08 x 1.5) + (0.03 x 10)
  + (0.03 x 12.5) + (0.02 x 22.5) + (0.03 x 3.5) + (0.03 x 0) + (0.06 x 2.5)
= 0 + 0 + 0.05 + 0 + 0.12 + 0.30 + 0.375 + 0.45 + 0.105 + 0 + 0.15
= 1.55 min/order
```

**Monthly totals at 1,000 orders/month:**

| Metric | Value |
|--------|-------|
| API cost | $33/month |
| Auto-pass fraction | 63% (PG-01 + PG-02 + PG-04 + PG-10) |
| Quick review hours | 1,000 x 0.19 x 2.5 / 60 = **7.9 hrs** |
| Investigation hours | 1,000 x 0.06 x 11.25 / 60 = **11.3 hrs** |
| Customer follow-up hours | 1,000 x 0.02 x 22.5 / 60 = **7.5 hrs** |
| **Total human hours** | **26.7 hrs/month** |
| Blended cost/order | $0.033 + (26.7 x $40) / 1,000 = **$1.10/order** |

---

### Step (b): Payment-to-Institution

**Recommended endpoint combination:** Stripe card.funding (free on PaymentMethod creation) + fintech BIN denylist (free, local) + billing-shipping-institution consistency (free, local) + Stripe AVS (included in charge, US/UK/CA only).

**API cost per order:**
- Stripe PaymentMethod creation (card.funding): $0.00 (metadata only)
- Fintech BIN denylist: $0.00 (local)
- Billing-shipping consistency: $0.00 (local)
- AVS: $0.00 (included in Stripe charge fee, not an incremental KYC cost)
- Exa for flagged billing entities (~5% of orders): $0.007 x 0.05 = $0.00035
- **Total API: ~$0.00/order** (incremental KYC cost is zero; Stripe charges are a payment processing cost, not a KYC cost)

**Human time by payment pattern:**

| Payment Pattern | Fraction | Time Tier | Est. Time | Evidence |
|----------------|----------|-----------|-----------|---------|
| Institutional card matching institution | 20% | auto | 0 min | card.funding=credit + billing=institution + no BIN flag. MIT exact match, Pfizer Amex (payment cases 1-2). |
| Personal card from home (PG-13) | 55% | auto | 0 min | card.funding=credit/debit + soft_flag logged but auto-pass. The NORMAL case (payment case 4). |
| International card, non-AVS country | 10% | auto | 0 min | card.funding=credit/debit + card.country matches institution. AVS unavailable but other signals clean (payment case 5). |
| Prepaid card / gift card | 2% | investigation | 5-10 min | card.funding=prepaid = hard_flag. Check if corporate virtual card. (payment case 7). |
| Fintech neobank card | 3% | quick_review | 1-2 min | BIN denylist match = soft_flag. Mercury/Brex normal for startups (payment cases 8-9). |
| Wire transfer / non-card | 5% | quick_review | 2-5 min | Only SWIFT/BIC info. Check originating country. No test data (0/10 test cases). |
| Other/edge cases | 5% | quick_review | 1-2 min | Safety margin. |

**Weighted average human time per order:**
```
= (0.20 x 0) + (0.55 x 0) + (0.10 x 0) + (0.02 x 7.5) + (0.03 x 1.5) + (0.05 x 3.5) + (0.05 x 1.5)
= 0 + 0 + 0 + 0.15 + 0.045 + 0.175 + 0.075
= 0.45 min/order
```

**Monthly totals at 1,000 orders/month:**

| Metric | Value |
|--------|-------|
| API cost | ~$0/month (incremental) |
| Auto-pass fraction | 85% |
| Quick review hours | 1,000 x 0.13 x 2.1 / 60 = **4.6 hrs** |
| Investigation hours | 1,000 x 0.02 x 7.5 / 60 = **2.5 hrs** |
| **Total human hours** | **7.1 hrs/month** |
| Blended cost/order | $0.00 + (7.1 x $40) / 1,000 = **$0.28/order** |

---

### Step (c): Email-to-Affiliation

**Recommended endpoint combination:** Disposable blocklist (free) + free-mail blocklist (free) + lookalike detector (free) + RDAP domain age (free) + ROR domain match (free) + InCommon/eduGAIN (free) + Exa for ambiguous cases ($0.007) + OpenAlex for unique-name researchers (free).

**API cost per order:**
- All primary checks are free (local logic + DNS + free APIs)
- Exa for ambiguous cases (~15% of orders): $0.007 x 0.15 = $0.001
- **Total API: ~$0.001/order**

**Human time by email pattern:**

| Email Pattern | Fraction | Time Tier | Est. Time | Evidence |
|--------------|----------|-----------|-----------|---------|
| Institutional email matching institution | 50% | auto | 0 min | Domain matches ROR or confirmed via Exa. berkeley.edu, ox.ac.uk, biontech.de (email-domain cases 1-3). |
| Institutional email, domain-institution mismatch | 3% | quick_review | 2-3 min | pasteur.fr + TheraVectys; tum.de + Fusix. Dual affiliation check (individual-affiliation cases 6-7). |
| Free email, non-OECD country norm | 10% | quick_review | 2-5 min | 163.com, qq.com, naver.com. Institution verified via ROR + PubMed (email-domain case 7). |
| Free email, OECD country | 5% | quick_review | 1-3 min | gmail.com, outlook.com for US/EU researcher. Why not institutional email? (email-domain case 14). |
| Sanctioned-country, no email infra | 3% | investigation | 10-15 min | bmsu.ac.ir has zero DNS. Free email masks affiliation. Entity screening required (email-domain case 8, cases 36-37). |
| Disposable email | <0.5% | auto (reject) | 0 min | guerrillamail, mailinator: hard block (email-domain cases 10, 18). |
| Impersonation domain (.com of .edu) | <0.5% | auto (reject) | 0 min | mit-edu.com, stanford-edu.com: lookalike detector + RDAP age (email-domain cases 20-23). |
| Common-name + free email (PG-11) | 5% | investigation | 5-15 min | Wei Zhang + 163.com: 9K OpenAlex results. Must request customer evidence (individual-affiliation cases 10-12, 14). |
| Other/unclassified | 3% | quick_review | 2-3 min | Safety margin. |

**Weighted average human time per order:**
```
= (0.50 x 0) + (0.03 x 2.5) + (0.10 x 3.5) + (0.05 x 2) + (0.03 x 12.5) + (0.005 x 0)
  + (0.005 x 0) + (0.05 x 10) + (0.03 x 2.5)
= 0 + 0.075 + 0.35 + 0.10 + 0.375 + 0 + 0 + 0.50 + 0.075
= 1.475 min/order
```

**Monthly totals at 1,000 orders/month:**

| Metric | Value |
|--------|-------|
| API cost | ~$1/month |
| Auto-pass fraction | 51% (institutional email + disposable reject + impersonation reject) |
| Quick review hours | 1,000 x 0.21 x 2.8 / 60 = **9.8 hrs** |
| Investigation hours | 1,000 x 0.08 x 11.6 / 60 = **15.5 hrs** |
| **Total human hours** | **25.3 hrs/month** |
| Blended cost/order | $0.001 + (25.3 x $40) / 1,000 = **$1.01/order** |

---

### Step (d): Residential Address Detection

**Recommended endpoint combination:** Smarty RDI (US only, $0.00 free tier / $0.003-0.009 paid) + Google Places name+address ($0.032) + Exa for ambiguous cases ($0.007).

**API cost per order:**
- Smarty RDI (US orders only, ~60% of orders): $0.003 x 0.60 = $0.0018
- Google Places (already called in step (a) -- can reuse, incremental cost $0): $0.00
- Exa for ambiguous cases (~5% of orders): $0.007 x 0.05 = $0.00035
- **Total API: ~$0.002/order** (assuming Google Places result from step (a) is cached/reused)

Note: Step (d) heavily overlaps with step (a). If step (a) already confirmed the address is at a known institution (university, hospital, manufacturer), step (d) auto-passes. The residential flag is essentially "step (a) failed to find an institution at this address."

**Human time by address pattern:**

| Address Pattern | Fraction | Time Tier | Est. Time | Evidence |
|----------------|----------|-----------|-----------|---------|
| US address at known institution | 35% | auto | 0 min | Step (a) already confirmed institution. Smarty=Commercial + Google Places=university/manufacturer. MIT, Pfizer, MGH (address cases 1, 2, 33). |
| International address at known institution | 25% | auto | 0 min | Step (a) confirmed via ROR + Google Places name+address. Oxford, IIT Bombay, Tsinghua (address cases 3, 19, 20). |
| US address Smarty=Residential | 5% | quick_review | 2-3 min | Includes false positives (Harvard building) and correct flags (home address). Reviewer checks quickly (address cases 29, 10). |
| US residential high-rise, Smarty=Commercial | 2% | quick_review | 1-2 min | False negative: NYC apt returns Commercial. Step (a) failure is the real flag (address case 30). |
| International address, no Smarty | 15% | quick_review | 2-5 min | Google Places name+address; if institutional type returned, pass. Otherwise Exa check (address cases 5, 19-24). |
| Coworking/virtual office | 3% | quick_review | 2-3 min | WeWork, Regus detectable by Google Places. Virtual office invisible (address cases 12-13, 35). |
| Step (a) already flagged | 10% | 0 min (handled in (a)) | 0 min | If step (a) triggered investigation/follow-up, step (d) is subsumed. |
| Other/unclassified | 5% | quick_review | 2-3 min | Safety margin. |

**Weighted average human time per order:**
```
= (0.35 x 0) + (0.25 x 0) + (0.05 x 2.5) + (0.02 x 1.5) + (0.15 x 3.5) + (0.03 x 2.5)
  + (0.10 x 0) + (0.05 x 2.5)
= 0 + 0 + 0.125 + 0.03 + 0.525 + 0.075 + 0 + 0.125
= 0.88 min/order
```

**Monthly totals at 1,000 orders/month:**

| Metric | Value |
|--------|-------|
| API cost | ~$2/month |
| Auto-pass fraction | 70% |
| Quick review hours | 1,000 x 0.30 x 2.9 / 60 = **14.5 hrs** |
| **Total human hours** | **14.5 hrs/month** |
| Blended cost/order | $0.002 + (14.5 x $40) / 1,000 = **$0.58/order** |

---

### Step (e): PO Box / Freight Forwarder / Export Control

**Recommended endpoint combination:** PO Box regex (free) + ISO country normalization (free) + BIS country group lookup (free) + Smarty pmb_designator (free) + Exa for freight detection ($0.007 on flagged cases).

**API cost per order:**
- All primary checks are free (local logic)
- Exa for suspected freight forwarder (~2% of orders): $0.007 x 0.02 = $0.00014
- **Total API: ~$0.00/order**

**Human time by address/country pattern:**

| Pattern | Fraction | Time Tier | Est. Time | Evidence |
|---------|----------|-----------|-----------|---------|
| Standard street, OECD country (Group A/B) | 65% | auto | 0 min | Regex=no hit, BIS=pass. MIT, BioNTech, Japanese institute (export-control cases 1-3). |
| Standard street, Group D country (CN, VN, PK) | 8% | quick_review | 2-5 min | BIS=license_required. Check institution + order contents. China is the volume case (export-control case 5). |
| Embargoed country (Group E + Part 746) | 3% | auto (deny) | 0 min | IR, CU, KP, SY, RU, BY: auto-deny (export-control cases 6, 36-40). |
| Explicit PO Box (Latin script) | 2% | auto (reject) | 0 min | Regex detects all Latin PO Box variants, 14/14 true positive (export-control round 2). |
| Freight forwarder (known address) | 1% | investigation | 5-15 min | Not detectable from address alone. Denylist or keyword search needed. Elmont, LAX clusters (address cases 9, 18). |
| CMRA/UPS Store (no PMB) | 1% | investigation | 5-10 min | Smarty dpv_cmra is broken (0/4 detected). Manual investigation needed (address cases 8, 15-16). |
| CJK/Arabic/Russian PO Box gap | <1% | quick_review | 1-3 min | Regex doesn't cover these. Most forms use Latin script (export-control cases 33-35). |
| Other/unclassified | 5% | quick_review | 1-2 min | Safety margin. Includes entity screening gap (Consolidated Screening List blocked). |

**Weighted average human time per order:**
```
= (0.65 x 0) + (0.08 x 3.5) + (0.03 x 0) + (0.02 x 0) + (0.01 x 10) + (0.01 x 7.5)
  + (0.005 x 2) + (0.05 x 1.5)
= 0 + 0.28 + 0 + 0 + 0.10 + 0.075 + 0.01 + 0.075
= 0.54 min/order
```

**Monthly totals at 1,000 orders/month:**

| Metric | Value |
|--------|-------|
| API cost | ~$0/month |
| Auto-pass fraction | 70% (OECD street + embargo deny + PO Box reject) |
| Quick review hours | 1,000 x 0.135 x 2.7 / 60 = **6.1 hrs** |
| Investigation hours | 1,000 x 0.02 x 8.75 / 60 = **2.9 hrs** |
| **Total human hours** | **9.0 hrs/month** |
| Blended cost/order | $0.00 + (9.0 x $40) / 1,000 = **$0.36/order** |

---

## 4. Cross-Step Rollup

### Per-profile-group total time across all 5 steps

| Profile Group | (a) Address | (b) Payment | (c) Email | (d) Residential | (e) PO Box/Export | Total Time | API Cost |
|--------------|-------------|-------------|-----------|-----------------|-------------------|------------|----------|
| **PG-01** Established OECD academic | auto (0) | auto (0) | auto (0) | auto (0) | auto (0) | **0 min** | $0.035 |
| **PG-02** Non-OECD academic, institutional email | auto (0) | auto (0) | auto (0) | auto (0) | quick (3 min)* | **0-3 min** | $0.035 |
| **PG-02** Non-OECD academic, free email (163.com) | auto (0) | auto (0) | quick (3.5 min) | auto (0) | quick (3 min)* | **3.5-6.5 min** | $0.035 |
| **PG-03** Multi-campus | quick (2.5 min) | auto (0) | auto (0) | auto (0) | auto (0) | **2.5 min** | $0.035 |
| **PG-04** Large pharma/CRO | auto (0) | auto (0) | auto (0) | auto (0) | auto (0) | **0 min** | $0.035 |
| **PG-05** Mid-size biotech | quick (1.5 min) | auto (0) | auto (0) | quick (2 min) | auto (0) | **3.5 min** | $0.035 |
| **PG-06** Small biotech/incubator | invest (10 min) | quick (1.5 min)** | quick (2.5 min) | quick (2 min) | auto (0) | **16 min** | $0.042 |
| **PG-07** Small biotech/own address | invest (12.5 min) | quick (1.5 min)** | invest (7.5 min)*** | quick (2 min) | auto (0) | **23.5 min** | $0.042 |
| **PG-08** Community bio lab | follow-up (22.5 min) | quick (2 min) | invest (10 min) | quick (2.5 min) | auto (0) | **37 min** | $0.042 |
| **PG-09** Government lab | quick (3.5 min) | auto (0) | auto (0) | auto (0) | auto (0) | **3.5 min** | $0.035 |
| **PG-10** Sanctioned-country | auto (0)† | auto (0)† | invest (12.5 min) | auto (0)† | auto-deny (0) | **0 min (denied at (e))** | $0.00 |
| **PG-11** Common-name + free email | auto (0) | auto (0) | invest (10 min) | auto (0) | auto (0) | **10 min** | $0.036 |

*Group D countries (China, Vietnam, etc.) require export license review at step (e).
**Fintech card (Mercury/Brex) likely for startup employees.
***If company has no institutional email domain and researcher uses free email, step (c) requires investigation.
†Embargoed countries are denied at step (e); steps (a)-(d) are moot. Group D countries proceed through all 5 steps.

### Blended monthly totals across all steps

**Total API cost per order (all 5 steps):**
```
= $0.033 (a) + $0.00 (b) + $0.001 (c) + $0.002 (d) + $0.00 (e)
= $0.036/order
= $36/month at 1,000 orders
```

**Total human hours per month:**

| Step | Hours/Month |
|------|-------------|
| (a) Address-to-institution | 26.7 |
| (b) Payment-to-institution | 7.1 |
| (c) Email-to-affiliation | 25.3 |
| (d) Residential address | 14.5 |
| (e) PO Box/freight/export | 9.0 |
| **Total** | **82.6 hrs/month** |

**Important: this total double-counts some overlap.** When step (a) triggers investigation for a community bio lab, the reviewer already gains context that speeds up steps (c) and (d) for the same order. Estimated overlap reduction: 15-20%. Adjusted estimate: **~68 hrs/month**.

**Blended cost per order (all 5 steps):**
```
API: $0.036
Human: 68 hrs x $40 / 1,000 = $2.72
Total: $2.76/order
```

**Weighted by profile group:**

| Profile Group | Fraction | Total Time (min) | Monthly Hours (1,000 orders) |
|--------------|----------|-------------------|------------------------------|
| PG-01 OECD academic | 35% | 0 | 0 |
| PG-02 Non-OECD academic (inst. email) | 5% | 0-3 | 0-2.5 |
| PG-02 Non-OECD academic (free email) | 5% | 3.5-6.5 | 2.9-5.4 |
| PG-03 Multi-campus | 2% | 2.5 | 0.8 |
| PG-04 Large pharma/CRO | 15% | 0 | 0 |
| PG-05 Mid-size biotech | 8% | 3.5 | 4.7 |
| PG-06 Small biotech/incubator | 3% | 16 | 8.0 |
| PG-07 Small biotech/own address | 3% | 23.5 | 11.8 |
| PG-08 Community bio lab | 2% | 37 | 12.3 |
| PG-09 Government lab | 3% | 3.5 | 1.8 |
| PG-10 Sanctioned-country | 3% | 0 (denied) | 0 |
| PG-11 Common-name + free email | 5% | 10 | 8.3 |
| Other/unclassified | 6% | ~5 | 5.0 |
| **Total** | **95%** | -- | **~56-60 hrs** |

After accounting for overlap (cross-step context sharing), the estimate converges around **55-70 hrs/month** at 1,000 orders/month.

---

## 5. Sensitivity Analysis

The top 5 most time-consuming profile groups by monthly hours:

### 1. PG-08: Community bio lab (2% of orders)

| Fraction | Monthly Hours | Monthly Cost |
|----------|--------------|--------------|
| 1% (half) | 6.2 hrs | $247 |
| **2% (base)** | **12.3 hrs** | **$493** |
| 4% (double) | 24.7 hrs | $987 |

Community labs are the single most expensive per-order group (37 min each). Even at 2%, they consume more human time than the 35% of OECD academics (which cost 0 min each). A provider with higher community-lab exposure (e.g., iGEM-adjacent) would see disproportionate cost.

### 2. PG-07: Small biotech at own address (3% of orders)

| Fraction | Monthly Hours | Monthly Cost |
|----------|--------------|--------------|
| 1.5% | 5.9 hrs | $235 |
| **3% (base)** | **11.8 hrs** | **$470** |
| 6% | 23.5 hrs | $940 |

Generic commercial addresses with zero registry signals. The investigation time is dominated by web search for company existence, state incorporation check, LinkedIn review.

### 3. PG-11: Common-name researcher + free email (5% of orders)

| Fraction | Monthly Hours | Monthly Cost |
|----------|--------------|--------------|
| 2.5% | 4.2 hrs | $167 |
| **5% (base)** | **8.3 hrs** | **$333** |
| 10% | 16.7 hrs | $667 |

This group is highly sensitive because it's driven by China-specific patterns (163.com + common Chinese names). A provider with heavy Chinese academic business could easily be at 10%.

### 4. PG-06: Small biotech at incubator (3% of orders)

| Fraction | Monthly Hours | Monthly Cost |
|----------|--------------|--------------|
| 1.5% | 4.0 hrs | $160 |
| **3% (base)** | **8.0 hrs** | **$320** |
| 6% | 16.0 hrs | $640 |

Concentrated in US biotech hubs (Cambridge, SF, San Diego). A provider with a strong startup customer base could be at 6%.

### 5. PG-05: Mid-size OECD biotech (8% of orders)

| Fraction | Monthly Hours | Monthly Cost |
|----------|--------------|--------------|
| 4% | 2.3 hrs | $93 |
| **8% (base)** | **4.7 hrs** | **$187** |
| 16% | 9.3 hrs | $373 |

Low per-order time (3.5 min) but higher volume. Doubling the fraction only adds ~$186/month.

### Worst-case scenario

If all 5 groups are at the high end simultaneously:
```
PG-08 at 4%: 24.7 hrs
PG-07 at 6%: 23.5 hrs
PG-11 at 10%: 16.7 hrs
PG-06 at 6%: 16.0 hrs
PG-05 at 16%: 9.3 hrs
Subtotal just these 5 groups: 90.2 hrs
+ remaining groups: ~15 hrs
Total: ~105 hrs/month = $4,200/month human cost
```

This would be a provider serving primarily startups and Chinese academics, with very few large institutional customers. Unlikely for a typical synthesis provider.

---

## 6. Key Findings

### Which profile groups drive the most cost?

1. **Community bio labs (PG-08)** are the most expensive per order (37 min / $24.67 per order). Every endpoint returns hard zero. Verification requires manual investigation of biosafety setup, IBC registration, and entity legitimacy. But they're only 2% of orders.

2. **Small biotechs at own addresses (PG-07)** are the second most expensive (23.5 min / $15.67 per order) and slightly more common (3% of orders). They drive the highest total monthly hours because no automated tool can verify a small private company at a generic commercial address.

3. **Common-name researchers with free email (PG-11)** are expensive not because each case is hard but because disambiguation is impossible without customer-provided evidence. ORCID is self-asserted (0/11 institution-verified), OpenAlex has thousands of matches for common names, and free email provides no linkage.

### Which KYC steps are most expensive?

| Step | Monthly Hours | % of Total |
|------|-------------|-----------|
| (a) Address-to-institution | 26.7 | 32% |
| (c) Email-to-affiliation | 25.3 | 31% |
| (d) Residential address | 14.5 | 18% |
| (e) PO Box/freight/export | 9.0 | 11% |
| (b) Payment-to-institution | 7.1 | 9% |

Steps (a) and (c) together account for 63% of human time. This is because they share the same fundamental problem: linking an entity claim (institution name) to a verifiable signal (address, email domain) requires registry lookups that return zero for small/new entities.

Step (b) is cheap because card.funding is a binary global signal (prepaid = flag) and the billing-shipping consistency check is local logic. Step (e) is cheap because PO Box regex and BIS country groups are deterministic.

### Where are the biggest uncertainties?

1. **Fraction of orders from small biotechs (PG-06 + PG-07) is highly uncertain.** customers.csv has zero community labs and very few startups. The 6% combined estimate is based on industry knowledge, not data. Actual could be 3-12%.

2. **Chinese academic free-email fraction is uncertain.** customers.csv overweights China (21% of records). Real fraction of orders from Chinese academics using 163.com/qq.com is probably 5-10%, not 21%.

3. **Overlap between steps is estimated, not measured.** The 15-20% overlap reduction assumes reviewers gain context from step (a) that carries through to (c) and (d). This has not been validated with actual workflow timings.

4. **Step (d) may largely collapse into step (a).** If step (a) already determined "no institution found at this address," step (d) adds little incremental work. The 14.5 hrs/month for step (d) may be 50% redundant with step (a), dropping total hours to ~60.

5. **Entity-level screening is BLOCKED.** The Consolidated Screening List API is deprecated. A named entity on the BIS Entity List in a non-embargoed country (e.g., a specific Chinese military university) would pass all working automated checks. This gap requires a vendor solution ($5K-50K/yr) or bulk CSV download before production.

### Cost summary

| Metric | Value |
|--------|-------|
| API cost per order | $0.036 |
| Human cost per order (blended) | $2.72 |
| **Total cost per order** | **~$2.76** |
| Monthly cost at 1,000 orders | ~$2,760 |
| FTE equivalent | ~0.4 FTE (68 hrs / 170 hrs per FTE-month) |
| Auto-pass rate (no human touch) | ~50% of orders |

The dominant cost is human time, not API calls. API costs are negligible ($36/month). The $2.76/order is driven almost entirely by the ~14% of orders that require investigation or customer follow-up, while the ~50% that auto-pass cost only $0.036 in API fees.
