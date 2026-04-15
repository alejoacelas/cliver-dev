# Stage 10 — Global Product Spec: DNA Customer Screening Bundle

This document assembles the per-measure winners from Stages 8-9 into a single recommended screening product. It is designed for adoption by synthesis providers or as a third-party screening service.

---

## 1. Full list of selected checks by integration point

### 1A. At account creation (onboarding)

These checks run once when a customer first registers. Results are cached on the customer record and inform all subsequent orders.

| # | Check | Input | Output | Measures served | Est. marginal cost |
|---|---|---|---|---|---|
| 1 | **OpenSanctions sanctions screen** (OFAC + UN/EU/UK/CA/AU) | Customer legal name, DOB, nationality, address | Match score, matched entities, jurisdiction flags (`ofac_sdn_hit`, `un_hit`, `eu_fsf_hit`, `uk_ofsi_hit`, `ca_sema_hit`, `au_dfat_hit`, `multi_jurisdiction_hit`) | M01, M08 | EUR 0.10/call (or $0 self-hosted) |
| 2 | **Disposable/free-mail blocklist** | Email address | `disposable_domain` (hard reject), `free_mail_with_institution_claim` (soft flag) | M02 | $0 |
| 3 | **ROR institutional domain match** | Email domain, claimed institution | `ror_domain_match`, `ror_domain_mismatch`, `ror_no_record`, `ror_inactive` | M02, M07, M18 | $0 |
| 4 | **RDAP/WHOIS domain age + registrant** | Email domain | `domain_age_lt_12mo`, `domain_age_lt_3mo`, `domain_recent_transfer` | M02, M09 | $0 |
| 5 | **MX/M365/Workspace tenant + SPF/DMARC** | Email domain | `mx_generic_provider`, `dmarc_missing`, `m365_tenant_brand_mismatch` | M02 | $0 |
| 6 | **InCommon + eduGAIN federation IdP lookup** | Email domain | `domain_in_incommon`, `domain_in_edugain`, `domain_no_federation` | M07 | $0 |
| 7 | **Google site-search affiliation** | Institution domain, customer name | `no_site_search_hits`, `low_quality_hits_only`, `name_collision` | M07 | $0.003-$0.045 |
| 8 | **Corporate registry stack** (Companies House, SEC EDGAR, OpenCorporates) | Institution legal name, jurisdiction | `registry_no_record`, `registry_dissolved`, `sic_not_life_sciences`, `registry_recent_incorp` | M09, M18 | $0.25-$1.50 |
| 9 | **PubMed affiliation search** | Institution name | `no_pubmed_affiliation_5yr`, `affiliation_collision_risk` | M09, M18 | $0 |
| 10 | **Domain authentication stack** (DNS + RDAP baseline) | Institution domain | `domain_recent`, `domain_no_mail_auth`, `domain_reanimated` | M09 | $0 (+ $15.75/query DomainTools on escalation) |
| 11 | **ROR identity resolution + red flags** | Institution name | `ror_no_match`, `ror_recent`, `ror_self_listed`, `ror_inactive` | M18 | $0 |
| 12 | **NIH RePORTER funded-institution signal** | Institution name | `no_nih_funding_5yr`, `nih_funding_active` | M18 | $0 |
| 13 | **NSF + UKRI + CORDIS funded-institution signal** | Institution name | `no_funder_record_5yr`, `funder_jurisdiction_mismatch` | M18 | $0 |
| 14 | **Lookalike/homoglyph domain detector** | Institution domain | `domain_homoglyph_match`, `domain_levenshtein_le_2` | M18 | $0 |
| 15 | **ITA Consolidated Screening List** (BIS Entity List + DPL + UVL + MEU) | Institution name, address | `csl_entity_hit_high_confidence`, `csl_entity_hit_low_confidence`, `csl_uvl_hit` | M06, M08 | $0 |
| 16 | **Internal institution denylist** | Institution name, domain, registry ID, payment-instrument hash, beneficial-owner data | `internal_denylist_hit_high_confidence`, `internal_denylist_hit_medium_confidence`, `internal_denylist_beneficial_owner_match` | M08 | $0 |
| 17 | **Twilio Lookup v2 — line type** | Phone number (E.164) | `phone_nonfixed_voip`, `phone_tollfree`, `phone_invalid` | M13 | $0.005-$0.015 |
| 18 | **Telesign PhoneID + Score** | Phone number (E.164) | `telesign_nonfixed_voip`, `telesign_high_risk_score`, `telesign_recent_sim_swap`, `phone_provider_disagreement` | M13 | $0.01-$0.05 |
| 19 | **Hosted IdP setup** (Auth0/Okta/Cognito) — passkey enrollment + MFA policy | Customer identity | `mfa_not_enrolled`, `mfa_factor_too_weak` | M16 | $0 marginal (platform fee) |
| 20 | **FSAP + IBC roster ingestion** (pre-approval gate) | Institution name | IBC-RMS match status, BSO contact | M17 | $0 |
| 21 | **MSA crypto prohibition click-through** | Customer acceptance | MSA version + click-through timestamp | M11 | $0 |
| 22 | **PSP config audit** (CI cron — no crypto methods enabled) | Provider PSP config | `crypto_method_enabled` alert | M11 | $0 |

**Onboarding-only human escalations:**
- **Visiting-scholar new-hire corroboration SOP** (M07 Tier 3): $10-$30/case, 3-5 business days. Triggered when both federation lookup and site-search fail, and customer claims visiting/postdoc/new-hire role.
- **Two-contact directory verification SOP** (M05): $30-$60/case. Triggered when automated address-institution checks produce ambiguous results.

---

### 1B. At order submission

These checks run on every order (or every SOC order, as noted). They consume data from the order, the customer record, and the onboarding checks.

| # | Check | Input | Output | Measures served | Applies to | Est. marginal cost |
|---|---|---|---|---|---|---|
| 1 | **PO Box regex + locale-aware backstop** | Shipping address (raw text) | `regex_po_box`, `regex_apo_fpo`, `regex_locale_mismatch` | M03 | All orders | $0 |
| 2 | **Smarty/Melissa address verification** (PO Box + CMRA + RDI) | Shipping address | `smarty_po_box`, `smarty_cmra`, `address_is_residential`, `rdi_unknown` | M03, M04 | All orders | $0.001-$0.05 |
| 3 | **Google Places business presence** | Shipping coordinates | `no_places_business_at_address`, `places_category_mismatch`, `places_category_residential` | M04 | All orders | $0.032-$0.035 |
| 4 | **ROR/GLEIF/Companies House canonical address cross-reference** + OSM polygon | Shipping address, institution name | `canonical_address_mismatch` (with resolution level), `institution_no_canonical_record`, `institution_status_inactive` | M05 | All orders | <$0.02 |
| 5 | **ISO 3166 normalization + sanctioned-territory geofence** | Shipping address | ISO country code, geofence verdict | M06 | All orders | $0 |
| 6 | **BIS Country Group D/E + EAR licensing matrix** | ISO country code, ECCN | Country group, license-required flag | M06 | All orders | $0 |
| 7 | **BIS Entity List + CSL consignee screen** | Consignee name, address | Entity List/DPL/UVL/MEU match flags | M06 | All orders | $0 |
| 8 | **HS code / ECCN classification SOP** | Sequence screening output | EAR99 or 1C353 classification | M06 | SOC orders (~5%) | $0 (EAR99 path); $15-$45/case (1C353 path) |
| 9 | **PSP AVS** (read card authorization response) | Card payment object | `avs_zip_mismatch`, `avs_address_mismatch`, `avs_unavailable_us` | M12 | All card-paid orders | $0 |
| 10 | **Billing-shipping-institution consistency** | Billing address, shipping address, institution canonical address | `billing_shipping_metro_mismatch`, `billing_institution_postal_mismatch`, `billing_residential_on_institutional_order` | M12 | All orders with billing address | $0-$0.009 |
| 11 | **Fintech-neobank BIN denylist** | Card BIN | `fintech_neobank_billing` | M12 | All card-paid orders | $0-$0.07 |
| 12 | **PSP funding-source check** (Stripe `card.funding` / Adyen equivalent) | Payment method | `psp_funding_prepaid`, `psp_funding_unknown` | M10 | SOC orders | $0 (bundled with PSP) |
| 13 | **Order-text crypto-reference scan** | Order metadata free text | `order_text_crypto_reference` | M11 | All orders | $0 |
| 14 | **Structured SOC declaration form** | Customer-entered: use category, NCBI taxon, BSL, IBC status | `bsl_inconsistent`, `select_agent_no_ibc`, `taxid_invalid`, `excessive_other` | M15 | All orders | $0 |
| 15 | **Sequence screening reconciliation** (SecureDNA + commercial vendors) | Sequences + declaration form fields | `soc_screening_disagreement`, `vendor_disagreement`, `inferred_organism_mismatch` | M15 | All orders | $0.20-$4.00/order line |
| 16 | **LLM extraction + deterministic cross-reference** | Free-text order notes + form + screening output | `llm_form_mismatch`, `llm_sequence_disagreement` | M15 | All orders | $0.005-$0.02 |
| 17 | **FIDO2/WebAuthn order-time step-up** (`max_age=0`) | Customer authenticator | `webauthn_assertion_failed`, `webauthn_no_credentials` | M14, M16 | SOC orders | $0 |

**Order-submission human escalations:**
- **HS/ECCN classification SOP** (M06): ~5% of orders trigger; most resolve to EAR99 in seconds; ~<1% require 15-45 min reviewer time for 1C353 path.
- **Role-vs-scope / seniority alignment SOP** (M19): $50-$300/flagged order. Triggered on SOC orders where sequence screening flags the order AND individual-legitimacy automated checks produce weak/null signal.
- **Independent-switchboard callback SOP** (M13): $2.50-$15/case. Triggered when phone-type automated checks flag the order.

---

### 1C. Periodic re-screen / maintenance

These checks run on schedules (daily, monthly, annually) against existing customer records.

| # | Check | Cadence | Input | Output | Measures served | Est. marginal cost |
|---|---|---|---|---|---|---|
| 1 | **Daily sanctions delta re-screening** | Daily | New sanctions list entries vs. all customer records | `delta_new_hit`, `delta_addr_change_hit` | M01 | ~$0 |
| 2 | **Phone re-verification + SIM-swap monitoring** | 6-12 months + high-risk event triggers | Customer phone number | `rebind_overdue`, `sim_swap_recent`, `sim_swap_with_high_risk_event` | M13 | ~$0.24/customer/year |
| 3 | **Annual positive-verification SOP** (pre-approval maintenance) | 12 months (or event-triggered early) | Pre-approved entity record | Confirmation, suspension, or revocation | M17 | $75-$150/entity/year |
| 4 | **Event-driven re-evaluation** | Continuous feeds | OpenCorporates officer changes, OFAC delta, breach feeds, dormancy timers | Entity demotion to `needs-review` | M17 | $1-$5/entity/year |
| 5 | **Cross-shell rotation graph** maintenance | Ongoing ingestion | All screened entity fingerprints (officers, certs, domains, GLEIF parents) | `cross_shell_shared_officer`, `cross_shell_shared_cert` | M18 | $0.10-$1.00/entity |
| 6 | **Cross-order SOC drift detector** | Per-order (asynchronous) | Per-customer feature vector of declarations + screening history | `soc_drift_detected`, `concerning_trajectory_match` | M15 | $0 |
| 7 | **Anti-rubber-stamp voucher SOP** | Quarterly audit + continuous monitoring | Voucher activity graph (volume, turnaround, concentration) | Rate/concentration/ring flags | M20 | ~$0/automated; $100-$300/audit per flagged voucher |
| 8 | **PSP config audit** (crypto methods) | Daily CI + infra-PR triggered | PSP management APIs | `crypto_method_enabled` alert | M11 | $0 |
| 9 | **Dormancy re-IDV trigger** | On login after >180 days idle | Customer selfie vs. stored portrait | `dormancy_reidv_selfie_mismatch` | M16 | ~$1.50-$3.00/re-IDV event |

---

### 1D. SOC-specific checks (triggered by sequence screening finding a SOC)

These checks fire only on orders containing sequences of concern. They are the highest-cost, highest-signal tier.

| # | Check | Input | Output | Measures served | Est. marginal cost |
|---|---|---|---|---|---|
| 1 | **Jumio Identity Verification** (document + selfie + Liveness Premium) | Government ID photo, live selfie | `jumio_doc_failed`, `jumio_liveness_failed`, `jumio_face_no_match` | M14 | $1.50-$3.50 |
| 2 | **NFC ePassport chip read** (within Jumio flow) | ePassport NFC chip | `nfc_pa_failed`, `nfc_chip_face_mismatch` | M14 | $0-$0.50 incremental |
| 3 | **FIDO2/WebAuthn step-up** (at order time) | Customer authenticator | `webauthn_assertion_failed`, `webauthn_no_credentials` | M14, M16 | $0 |
| 4 | **MFA step-up enforcement** (`max_age=0` + passkey-required `acr_values`) | Hosted IdP | `stepup_failed`, `stepup_factor_downgraded` | M16 | $0 |
| 5 | **Predecessor re-IAL2** (per-order identity binding) | Document + selfie + liveness | `predecessor_rebind_name_mismatch` | M17 | $1.50 (Stripe Identity) |
| 6 | **OpenAlex author + affiliation history** | Customer name, ORCID, institution | `openalex_affiliation_mismatch`, `openalex_topic_mismatch`, `openalex_no_author_found` | M19 | $0 |
| 7 | **ORCID employment + education record** | Customer ORCID iD | `orcid_institution_verified`, `orcid_self_asserted_only`, `orcid_recent` | M19 | $0 |
| 8 | **NIH/NSF/Wellcome/ERC/UKRI PI lookup** | Customer name, ORCID | `pi_record_present`, `no_pi_record`, `pi_at_different_institution` | M19 | $0 |
| 9 | **Faculty / lab page + institutional directory** | Customer name, institution domain | `faculty_page_present`, `faculty_page_recent_only`, `faculty_page_directory_mismatch` | M19 | $0.01-$0.015 |
| 10 | **SOC self-declaration form** (structured) | Customer input | `bsl_inconsistent`, `select_agent_no_ibc`, `taxid_invalid` | M15 | $0 |
| 11 | **Screening/declaration reconciliation** | Sequences + declaration + LLM extraction | `soc_screening_disagreement` | M15 | (already counted above) |
| 12 | **PSP funding-source check** (prepaid block) | Card BIN | `psp_funding_prepaid` | M10 | $0 |
| 13 | **ORCID OAuth proof-of-control** (voucher identity) | Voucher's ORCID OAuth flow | OAuth token + ORCID record snapshot | M20 | $0 |
| 14 | **DKIM-verified institutional email** (voucher) | Voucher email | DKIM verification trace | M20 | $0 |
| 15 | **ROR disjointness rule** (voucher independence) | Customer ROR ID, voucher ROR ID | Disjointness verdict | M20 | $0 |
| 16 | **Live video attestation** (voucher) | Video call (Mode A onboarding) or digital sign-off (Mode B per-order) | Video recording hash, rubric scores, typed SOC names | M20 | ~$25-$30/Mode A; ~$2-$5/Mode B |
| 17 | **Coauthor-graph independence check** (voucher) | Customer name/ORCID, voucher name/ORCID | Coauthorship flag, shared-grant flag | M20 | $0 |

---

## 2. Shared infrastructure

Multiple checks across measures consume the same underlying API or data source. Consolidating these into single integrations reduces vendor contracts, engineering effort, and maintenance burden.

### 2A. OpenSanctions API (or self-hosted bulk data)

- **Consumers:** M01 (OFAC SDN + global sanctions union), M01 (daily delta re-screening), M08 (optional non-US sanctions supplement)
- **What it provides:** Multi-jurisdictional sanctions screening (OFAC, UN, EU FSF, UK OFSI, CA SEMA, AU DFAT) in a single API call; delta files for re-screening; 328 source datasets
- **Cost:** EUR 0.10/call (commercial API) or $0 (self-hosted bulk data, CC-BY-SA); commercial license required for production use (pricing vendor-gated)
- **Integration:** Single REST endpoint; bulk download alternative for airgapped operation

### 2B. ROR (Research Organization Registry) API / Bulk Dump

- **Consumers:** M02 (domain match), M07 (implicit via federation), M09 (implicit via PubMed affiliation cross-ref), M18 (identity resolution + red flags), M20 (disjointness rule + hierarchy walker)
- **What it provides:** Canonical institution identity (120K records), aliases, domains, websites, relationships (parent/child/sibling), status, cross-IDs
- **Cost:** $0 (CC0 license, free API, bulk dump available)
- **Integration:** Single v2 API endpoint; bulk dump ETL recommended for throughput. **Action required:** Register for client_id before Q3 2026 rate-limit change.

### 2C. Smarty / Melissa Address Verification API

- **Consumers:** M03 (PO Box + CMRA detection), M04 (USPS RDI residential indicator), M12 (billing-shipping consistency address normalization)
- **What it provides:** USPS DPV-based PO Box classification, CMRA flag, RDI (residential/commercial), international address-type classification, address normalization
- **Cost:** ~$0.001-$0.005/US lookup; ~$0.01-$0.05/international. Bundled — single call serves M03 + M04 + M12.
- **Integration:** Single REST endpoint per vendor; self-service signup

### 2D. ITA Consolidated Screening List (CSL) API

- **Consumers:** M06 (BIS Entity List + DPL + UVL + MEU consignee screen), M08 (institution denied-parties screen)
- **What it provides:** Free, federally maintained fuzzy-name search across 13 US restricted-party lists with hourly updates
- **Cost:** $0 per query
- **Integration:** Single REST endpoint; bulk download alternative

### 2E. Hosted Identity Provider (Auth0 / Okta CIC / AWS Cognito)

- **Consumers:** M16 (MFA + step-up infrastructure), M14 (FIDO2/WebAuthn enrollment and assertion), M16 (no-SMS/no-email-reset policy), M16 (dormancy re-IDV trigger as post-login Action)
- **What it provides:** OIDC plumbing, factor enforcement policy, adaptive risk scoring, step-up endpoint, WebAuthn RP, recovery flows, audit logs
- **Cost:** Platform fee (varies by provider and tier); $0 per passkey/TOTP assertion
- **Integration:** OIDC RP integration (4-8 engineer-weeks one-time); all M16 checks configure the same platform

### 2F. Jumio / IDV Vendor

- **Consumers:** M14 (primary IDV at SOC onboarding), M16 (dormancy re-IDV selfie match), M17 (predecessor re-IAL2 per-order binding)
- **What it provides:** Document capture, OCR, template authentication, NFC chip read, biometric face match, liveness detection
- **Cost:** $1.50-$3.50/verification
- **Integration:** Single SDK + REST callback integration. Stripe Identity ($1.50/verification) can serve as lighter-weight alternative for M17 predecessor re-IAL2.

### 2G. Twilio + Telesign Phone Intelligence

- **Consumers:** M13 (onboarding line-type + risk scoring), M13 (periodic SIM-swap monitoring via rebind cadence)
- **What it provides:** Line-type classification (Twilio), SIM-swap detection + risk score (Telesign), carrier metadata
- **Cost:** ~$0.02-$0.07/customer at onboarding; ~$0.24/customer/year for rebind cadence
- **Integration:** Two vendor accounts; both consume E.164 phone number

### 2H. PSP Integration (Stripe / Adyen)

- **Consumers:** M10 (card.funding field), M11 (PSP config audit), M12 (AVS response codes + BIN lookup)
- **What it provides:** Card funding type, AVS response codes, BIN metadata, payment method capabilities audit
- **Cost:** $0 incremental (bundled with card processing fees); Stripe Radar 2-7 cents/tx for rule engine
- **Integration:** Single PSP account; checks read fields already present on charge/PaymentMethod objects

### 2I. Sequence Screening Pipeline (SecureDNA + Commercial Vendors)

- **Consumers:** M15 (screening/declaration reconciliation), M06 (ECCN classification trigger), M19 (role-vs-scope SOP trigger)
- **What it provides:** SOC identification from submitted sequences
- **Cost:** SecureDNA $0; commercial vendors $0.10-$2/sequence at enterprise tier
- **Integration:** Multi-vendor pipeline with reconciliation engine

### 2J. OpenAlex / ORCID / Funder APIs (Bibliometric Stack)

- **Consumers:** M19 (individual legitimacy — OpenAlex, ORCID, PI lookup), M20 (coauthor graph), M18 (funder signals)
- **What it provides:** Publication records, affiliation history, employment verification, PI/co-PI grant records, coauthorship graph
- **Cost:** $0 (all free/open APIs)
- **Integration:** Shared name-normalization layer seeded from ROR aliases; ORCID iD as cross-source disambiguator

---

## 3. Suggested integration architecture

### 3.1 High-level data flow

```
                        ACCOUNT CREATION
                              |
        +-----------+---------+---------+----------+
        |           |         |         |          |
   [Sanctions]  [Email     [Phone   [Institution [IdP
    Screen]     Domain]    Checks]  Verification] Setup]
        |           |         |         |          |
        |    ROR, RDAP,   Twilio,   Corp-reg,    Auth0/
        |    MX/SPF,     Telesign  PubMed,      Okta
        |    blocklist,            NIH/NSF,     passkey
        |    eduGAIN,              IBC roster,  enroll
        |    site-search           domain-auth
        |           |         |         |          |
        +-----+-----+---------+---------+----------+
              |
         [Customer Record]  <-- flags + dispositions stored
              |
              v
                        ORDER SUBMISSION
                              |
        +-----------+---------+---------+----------+
        |           |         |         |          |
   [Address     [Payment  [SOC      [Export     [Step-up
    Checks]     Checks]   Declaration Control]   Auth]
        |           |         |         |          |
    PO-Box     AVS,       Form +    ISO norm,   FIDO2
    regex,     BIN,       LLM +     BIS groups, max_age=0
    Smarty,    fintech    screen    Entity List,
    Places,    denylist   reconcile ECCN SOP
    ROR/GLEIF
    polygon
        |           |         |         |          |
        +-----+-----+---------+---------+----------+
              |
         [Order Screening Result]  <-- composite flag set
              |
     +--------+--------+
     | SOC detected?    |
     | No: pass/flag    |
     | Yes: SOC tier    |
     +--------+---------+
              |
              v
                   SOC-SPECIFIC CHECKS
                          |
     +----------+---------+---------+----------+
     |          |         |         |          |
  [IDV]     [Individual [Voucher  [Pre-       [MFA
  Jumio +   Legitimacy] Workflow] Approval]   Step-up]
  NFC +         |         |       re-IAL2
  FIDO2    OpenAlex,   ORCID-OAuth,
           ORCID,      DKIM,
           PI lookup,  ROR disjoint,
           faculty pg, video attest,
           role SOP    anti-rubber,
                       coauthor graph
     |          |         |         |          |
     +----+-----+---------+---------+----------+
          |
     [SOC Order Disposition]  --> approve / review / deny
          |
          v
                  PERIODIC / MAINTENANCE
     +----------+---------+---------+----------+
     |          |         |         |          |
  [Sanctions  [Phone    [Pre-appr  [Cross-    [PSP
   delta]     rebind]   annual     shell      config
                        SOP +      graph]     audit]
                        event-
                        driven]
```

### 3.2 Execution model

**Parallel API calls into a shared schema.** All automated checks at each integration point run in parallel where they have no data dependencies. Results land in a shared per-order (or per-customer) flag schema. A rules engine evaluates the composite flag set.

**Specific parallelism:**

At account creation:
- **Wave 1 (parallel, no deps):** OpenSanctions, disposable-blocklist, RDAP, MX/SPF/DMARC, Twilio, Telesign, CSL, internal denylist, IBC roster lookup
- **Wave 2 (depends on Wave 1):** ROR domain match (needs email domain extraction), corporate registry (needs institution name), PubMed (needs institution name), NIH/NSF/UKRI/CORDIS (needs institution name), site-search (needs institution domain), InCommon/eduGAIN lookup (needs email domain), domain-auth stack (needs institution domain), lookalike domain detector (needs institution domain)
- **Wave 3 (human, conditional):** Visiting-scholar SOP, two-contact SOP (only if automated checks produce insufficient signal)

At order submission:
- **Wave 1 (parallel):** PO Box regex, Smarty/Melissa (serves M03+M04+M12), Google Places, ROR/GLEIF polygon, ISO normalization, CSL consignee, AVS (from PSP), BIN lookup, crypto text scan, SOC declaration form validation
- **Wave 2 (depends on Wave 1):** BIS Country Groups (needs ISO code + ECCN), billing-shipping consistency (needs normalized addresses), sequence screening reconciliation (needs screening output + form data), LLM extraction (needs free text + form)
- **Wave 3 (human, conditional):** ECCN classification SOP, role-vs-scope SOP, callback SOP

SOC-specific checks:
- **Wave 1 (parallel):** OpenAlex, ORCID, PI lookup, faculty page search, Jumio IDV + NFC, FIDO2 step-up
- **Wave 2 (voucher workflow, after IDV):** ORCID OAuth for voucher, DKIM verification, ROR disjointness, coauthor graph
- **Wave 3 (human):** Live video attestation (Mode A/B), role-vs-scope SOP

### 3.3 Where human review sits

Human review is positioned as the terminal step for flagged orders, never as a mass-screening bottleneck:

1. **Compliance reviewer queue:** Receives all high-confidence sanctions/entity-list hits, export-control escalations, and denylist matches. Auto-deny on clear matches; adjudicate fuzzy matches. Estimated volume: <1% of orders.

2. **Scientific reviewer queue:** Receives SOC-flagged orders with screening/declaration disagreements, individual-legitimacy concerns, or voucher flags. Requires PhD-trained biosafety staff. Estimated volume: ~5% of orders (SOC-containing), of which ~30-50% require substantive review.

3. **Identity/affiliation reviewer queue:** Receives orders with address mismatches, phone flags, email-domain anomalies, and billing inconsistencies. Can be handled by trained KYC analysts. Estimated volume: ~5-15% of orders at deployment (decreasing as thresholds calibrate).

4. **Pre-approval maintenance:** Annual SOP for pre-approved entities; event-triggered re-evaluation. Steady-state: ~1 analyst-hour per entity per year.

---

## 4. Total estimated per-order cost

### 4A. All-orders automated checks (run on every order)

| Check cluster | Per-order cost |
|---|---|
| Address verification (Smarty, regex, Places, polygon) | $0.035-$0.09 |
| Payment checks (AVS, BIN, billing consistency) | $0-$0.08 |
| Export control (ISO norm, BIS groups, CSL, crypto scan) | $0 |
| SOC declaration (form + LLM extraction) | $0.005-$0.02 |
| Sequence screening (SecureDNA + 1 commercial vendor) | $0.20-$2.00/order line |
| **Subtotal per order (automated, ex-screening)** | **~$0.04-$0.19** |
| **Subtotal per order (incl. screening, 1-10 lines)** | **~$0.24-$20.19** |

### 4B. Amortized onboarding checks (run once per customer, amortized over ~50 orders/year)

| Check cluster | Per-customer one-time | Amortized per order |
|---|---|---|
| Sanctions screen | EUR 0.10 | ~$0.002 |
| Email/domain checks (ROR, RDAP, MX, blocklist, federation, site-search) | $0-$0.045 | ~$0.001 |
| Institution verification (corp-reg, PubMed, domain-auth, NIH/NSF, lookalike) | $0.25-$1.50 | ~$0.005-$0.03 |
| Phone checks (Twilio + Telesign) | $0.02-$0.07 | ~$0.001 |
| CSL + internal denylist | $0 | $0 |
| **Amortized onboarding subtotal** | | **~$0.01-$0.04** |

### 4C. SOC-specific checks (applied to ~5% of orders containing SOCs)

| Check | Per-SOC-order cost | Blended per-order (at 5% SOC rate) |
|---|---|---|
| Jumio IDV + NFC (onboarding, amortized) | $1.50-$4.00 | ~$0.075-$0.20 |
| FIDO2 step-up | $0 | $0 |
| Predecessor re-IAL2 | $1.50 | ~$0.075 |
| Individual legitimacy (OpenAlex, ORCID, PI, faculty page) | $0.01-$0.015 | ~$0.001 |
| Voucher workflow (ORCID OAuth, DKIM, ROR disjointness, coauthor graph) | $0 | $0 |
| Live video attestation (Mode A 1x/year + Mode B per order) | ~$7-$8/order (blended) | ~$0.35-$0.40 |
| Role-vs-scope SOP (on ~30% of SOC orders) | $50-$300 | ~$0.75-$4.50 |
| **SOC-specific subtotal (blended per order)** | | **~$1.25-$5.18** |

### 4D. Periodic/maintenance checks (amortized across all orders)

| Check | Annual cost per customer | Amortized per order (50 orders/yr) |
|---|---|---|
| Sanctions delta re-screening | ~$0 | $0 |
| Phone rebind cadence | ~$0.24 | ~$0.005 |
| Pre-approval annual SOP | $75-$150/entity | ~$1.50-$3.00 (entity-level) |
| Event-driven re-eval | $1-$5/entity | ~$0.02-$0.10 |
| Cross-shell graph maintenance | $0.10-$1.00/entity | ~$0.002-$0.02 |
| **Maintenance subtotal per order** | | **~$0.03-$0.14** (excl. pre-approval SOP) |

### 4E. Total estimated per-order cost

| Component | Low estimate | High estimate |
|---|---|---|
| Automated all-orders checks | $0.24 | $20.19 |
| Amortized onboarding | $0.01 | $0.04 |
| SOC-specific (blended at 5%) | $1.25 | $5.18 |
| Periodic/maintenance | $0.03 | $0.14 |
| **Total blended per-order** | **~$1.53** | **~$25.55** |

**Notes on range:**
- The low end assumes 1-2 sequence lines per order with free screening (SecureDNA only), minimal human review, and few SOC escalations.
- The high end assumes 10 sequence lines with a commercial screening vendor, frequent SOC orders at a research-heavy provider, and substantial reviewer time on role-vs-scope SOPs.
- A typical mid-market provider with ~5% SOC rate and 3-5 lines/order would land at approximately **$2-$8 per order**.
- The dominant cost driver is sequence screening ($0.20-$2/line) and SOC-specific human review (role-vs-scope SOP, video attestation). Automated KYC checks are negligible (<$0.25/order).

---

## 5. What this bundle does NOT cover

The following structural gaps were identified across Stage 9 syntheses. No selected check in the bundle addresses them. They are consolidated here by theme, not repeated per measure.

### 5.1 Genuine-insider intent detection

**Affected measures:** M07, M14, M15, M17, M19, M20

The entire bundle verifies identity, affiliation, and institutional legitimacy. It cannot detect a person who is genuinely affiliated, genuinely credentialed, and genuinely authorized --- but acting with malicious intent. This includes:
- Lab managers ordering unauthorized sequences on legitimate accounts (lab-manager-voucher)
- Recruited insiders using their own credentials (insider-recruitment)
- Core-facility staff hiding SOC orders within legitimate high-volume purchasing (bulk-order-noise-cover)
- Students in unrelated departments exploiting enrollment-based access (unrelated-dept-student)

**Why no check covers it:** Intent is invisible to identity-verification and institutional-verification systems. Detection would require behavioral analytics, order-pattern anomaly detection, or end-use monitoring --- none of which are in the current bundle. The cross-order drift detector (M15) provides a partial longitudinal signal but is defeated by consistent-from-start deception.

### 5.2 Post-shipment carrier redirect and physical interception

**Affected measures:** M03, M04, M05

UPS My Choice, FedEx Delivery Manager, USPS Change of Address, and physical interception at institutional mailrooms are invisible to all pre-shipment address checks. An attacker who passes address screening can redirect the package after the provider releases it. The bundle has no post-shipment controls.

**Why no check covers it:** Carrier-level redirect blocking, signature-from-named-recipient requirements, and institutional mailroom controls are outside the provider's direct control surface. They require carrier partnerships or institutional cooperation that are not part of a screening product.

### 5.3 Re-export / transshipment invisibility

**Affected measures:** M06

All export-control checks screen against the declared first-hop shipping address. An attacker shipping to a non-embargoed intermediary (Brazil, Japan, India) and re-exporting is invisible. This is the dominant coverage ceiling for the bundle's export-control layer.

**Why no check covers it:** End-use monitoring and post-shipment enforcement require government-level intelligence and enforcement capabilities beyond any customer-screening product.

### 5.4 EAR99 items to Group D destinations

**Affected measures:** M06

~95% of synthesis orders are EAR99 (not export-controlled). The BIS Country Groups check and ECCN classification produce zero signal for EAR99 items shipped to non-embargoed destinations, even Group D countries. The export-control layer has leverage only on the ~5% of orders that trigger SOC screening and classify as 1C353.

### 5.5 Cross-provider information sharing

**Affected measures:** M08, M17, M18, M20

An entity denied by one provider can order from 60+ others. No cross-provider customer denylist, voucher graph, or screening-outcome database exists. The DOJ withdrew the information-sharing safe harbor in February 2023, creating legal uncertainty around shared denylists. The IGSC does not publicly document cross-provider screening coordination. SecureDNA/IBBIS portal (announced October 2025) may address some of this; status unknown.

This is the single most impactful structural gap in the bundle. Every provider operates in isolation.

### 5.6 Non-OECD / non-Anglophone coverage asymmetry

**Affected measures:** M02, M04, M07, M09, M13, M18, M19, M20

Multiple checks systematically degrade for non-OECD, non-Anglophone customers:
- ROR coverage is thinnest outside US/EU
- Funder checks (NIH/NSF/UKRI/CORDIS) cover only Western funders
- Google Places data is sparse or blocked in China
- Faculty-page and site-search checks degrade on non-English/non-indexed sites
- ORCID adoption is lowest outside OECD
- DKIM misconfiguration rates are highest in non-OECD institutions (15-25%)
- Phone-intelligence APIs return higher `unknown` rates for non-US/EU numbers

This creates a systematic coverage gap and a disproportionate false-positive burden on ~23-38% of the synthesis market (Asia-Pacific, Latin America, Africa). No alternate verification pathway is defined for populations that simultaneously fail multiple automated checks.

### 5.7 Invoice / PO / wire orders invisible to payment controls

**Affected measures:** M10, M12

An estimated 30-50% of B2B synthesis order volume uses invoices, purchase orders, or wire transfers rather than card payments. These orders bypass the entire payment-control layer: no AVS, no BIN check, no funding-source check, no billing-address comparison. The bundle relies on institution-legitimacy controls (M09, M18) as the sole backstop for these orders.

### 5.8 Knowing-complicit voucher (M20 irreducible gap)

**Affected measures:** M20

A voucher who deliberately assists the attacker --- briefed on order details, providing coherent answers on video, willing to go on record --- passes every check in the voucher workflow. No attestation mechanism can distinguish a co-conspirator from a legitimate voucher. The bundle converts this from a prevention problem to a deterrence/attribution problem (recorded video, digital signature, timing logs), but it cannot prevent it.

### 5.9 Cloud account compromise enabling synced passkey injection

**Affected measures:** M14, M16

An attacker who compromises a customer's iCloud or Google account can inject a passkey into the sync group. The provider sees a valid WebAuthn assertion indistinguishable from the legitimate user. No check in the bundle distinguishes synced passkeys from hardware-bound credentials. Mitigation would require mandating hardware-bound-only passkeys via AAGUID allowlist, which was dropped from the bundle due to prohibitive deployment friction.

### 5.10 Purpose-built entities that are structurally identical to legitimate customers

**Affected measures:** M09, M18

Small CROs, community bio labs, and biotech-incubator tenants produce entity profiles that are indistinguishable from the corresponding legitimate customer class. An attacker operating a real-but-hollow CRO with an active LLC, correct SIC code, aged domain, and professional mail infrastructure cannot be separated from a legitimate small CRO without unacceptable false-positive rates on the real population. The bundle applies friction (soft flags, reviewer signals) but cannot reliably block these entities without also blocking their legitimate counterparts.

### 5.11 Novel / engineered sequences not in screening databases

**Affected measures:** M15

De novo or heavily engineered sequences that do not match known agents in any screening vendor's database produce no SOC hit. The reconciliation engine has nothing to compare against. This is a fundamental limitation of homology-based sequence screening, not a customer-screening gap per se, but it means the entire SOC-specific check tier is never triggered for novel threats.

### 5.12 Programmatic / API ordering bypasses browser-based controls

**Affected measures:** M14, M16

Orders submitted via LIMS-to-provider API integrations (estimated 10-30% of volume at scale providers) bypass the browser-based OIDC redirect entirely. FIDO2/WebAuthn step-up, `max_age=0` enforcement, and dormancy re-IDV trigger produce no signal for these orders. A parallel authentication mechanism (OAuth client-credentials with per-request signing or mutual TLS) must be defined for API-submitted SOC orders but is not currently specified.

---

## Appendix: Setup cost summary

| Infrastructure component | Estimated setup cost | Engineering time |
|---|---|---|
| OpenSanctions integration + delta pipeline | $5K-$15K | 2-4 engineer-weeks |
| ROR API + bulk dump ETL | $2K-$5K | 1-2 engineer-days |
| Smarty/Melissa address verification | $2K-$5K | 1-2 engineer-days |
| CSL API integration | $3K-$10K | 1 engineer-week |
| Hosted IdP (Auth0/Okta) + FIDO2 | $15K-$50K | 4-8 engineer-weeks |
| Jumio IDV integration | $2K-$25K | 1-2 engineer-weeks |
| Twilio + Telesign phone intelligence | $5K-$15K | 1-2 engineer-weeks |
| Email domain checks (RDAP, MX, blocklist, federation) | $2K-$5K | 4-6 engineer-days |
| Institution verification (corp-reg, PubMed, funder, domain-auth, lookalike) | $20K-$60K | 8-12 engineer-days |
| Internal denylist | $25K-$75K | 4-8 engineer-weeks |
| Sequence screening reconciliation engine | $20K-$50K | 4-8 engineer-weeks |
| SOC declaration form + LLM extraction + drift detector | $30K-$80K | 9-18 engineer-weeks |
| Billing/payment checks (AVS, BIN, consistency) | $5K-$15K | 2-3 engineer-weeks |
| Individual legitimacy stack (OpenAlex, ORCID, PI, faculty page) | $10K-$25K | 3-6 engineer-weeks |
| Voucher workflow (ORCID OAuth, DKIM, disjointness, video, anti-rubber-stamp, coauthor) | $50K-$100K | 6-12 engineer-weeks |
| Pre-approval system (IBC roster, annual SOP, event-driven, re-IAL2) | $60K-$150K | 10-20 engineer-weeks |
| Cross-shell rotation graph | $80K-$300K | 12-24 engineer-weeks |
| Export control stack (ISO norm, BIS groups, ECCN SOP) | $20K-$60K | 4-8 engineer-weeks |
| Rules engine + reviewer queues + audit trail | $30K-$80K | 6-12 engineer-weeks |
| **Total estimated setup** | **$380K-$1.1M** | **~80-170 engineer-weeks** |

This is a full-featured deployment. A phased rollout prioritizing compliance-mandatory checks (sanctions, export control, sequence screening) and high-signal automated checks (email/domain, address, institution verification) could bring an MVP to ~$150K-$300K and 30-60 engineer-weeks, with SOC-specific and voucher tiers added in subsequent phases.
