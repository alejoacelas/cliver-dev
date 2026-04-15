---
gdoc: 19E8f-5lZ3nq6NEl_0IR3lL0X-spZeTO-SIcJTBFnaI4
title: KYC measures — automation overview
---
# KYC measures — automation overview

Per measure: function, automatability, implementing services with unit cost, and access concerns. Sourced from `pipeline/outputs/archive/08-measure-NN-synthesis.md` and `pipeline/measures.md`.

**On "automatable":** a measure is *automatable* when the cheapest faithful implementation of the standard throws a flag volume × FP rate that software (incl. an LLM triage layer) can clear without per-order human work. It is *not automatable* when the standard, applied to the real population, forces material manual adjudication. Coverage gaps and auditability constraints are tracked separately — they don't drive the verdict. Two adjacent failure modes get their own tags: *judgment / multi-source* (a normative call or fusing many thin signals — outside the scope of an initial automated version) and *injection-exposed* (the input is attacker-controlled free text feeding an LLM).

## Summary

| # | Measure | Verdict | Options | Key access concern |
|---|---|---|---|---|
| 01 | Sanctions name screen | Automatable with LLM triage (auditability slice to humans) | [OFAC SDN](https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists), [OpenSanctions](https://www.opensanctions.org/), [World-Check](https://www.lseg.com/en/risk-intelligence/screening-solutions/world-check-kyc-screening) / [Dow Jones](https://www.dowjones.com/professional/risk/products/risk-compliance/) / [Bridger](https://risk.lexisnexis.com/products/bridger-insight-xg), [daily delta re-screen](https://www.opensanctions.org/docs/bulk/) | CJK/Arabic/Russian names face 5–10× FP rates from common-name collisions. |
| 02 | Email affiliation & WHOIS | Not automatable (FP noise) | [ROR](https://ror.org/), [RDAP](https://data.iana.org/rdap/dns.json)/[WHOIS](https://www.iana.org/whois), [Wayback CDX](https://archive.org/developers/wayback-cdx-server.html), DNS+SPF/DMARC+[GetUserRealm](https://login.microsoftonline.com/getuserrealm.srf), [Kickbox](https://kickbox.com/), [SES](https://aws.amazon.com/ses/)/[Postmark](https://postmarkapp.com/) round-trip, [dnsReaper](https://github.com/punk-security/dnsReaper)+[crt.sh](https://crt.sh/)+[Tranco](https://tranco-list.eu/), [DomainTools](https://www.domaintools.com/) | 5–15% of academics use personal/free-mail; new biotechs and thin-ROR institutions mis-flagged. |
| 03 | Shipping PO box | Automatable with LLM triage | Regex SOP, [USPS DPV](https://postalpro.usps.com/address-quality/delivery-point-validation), [Smarty](https://www.smarty.com/), [Melissa](https://www.melissa.com/v2/global-address-verification/) | Non-OECD coverage near-zero; CJK/Arabic/Russian PO box equivalents undetected. |
| 04 | Shipping residential | Automatable with LLM triage | [USPS RDI](https://postalpro.usps.com/address-quality/rdi), [Google Places](https://developers.google.com/maps/documentation/places/web-service/overview), county assessor bulk | 40–55% international orders get weak/zero signal; community-bio and rural researchers structurally flagged. |
| 05 | Shipping institution association | Not automatable (FP noise + judgment / multi-source) | [ROR](https://ror.org/), [GLEIF](https://www.gleif.org/), [OSM Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API), [Google Places](https://developers.google.com/maps/documentation/places/web-service/overview), two-contact SOP, incubator-tenant verification | 30–45% of industry/commercial orders get zero signal from registries. |
| 06 | Shipping export country | Automatable with LLM triage for country/DPL; not automatable (judgment) for ECCN | [ISO 3166](https://www.iso.org/iso-3166-country-codes.html)+[BIS Country Groups](https://www.bis.doc.gov/index.php/documents/regulations-docs/2255-supplement-no-1-to-part-740-country-groups-1/file), [BIS CSL](https://www.trade.gov/consolidated-screening-list), manual HS/ECCN, freight-forwarder denylist | Non-US providers (45–60% of market) operate under unharmonized EU/UK frameworks. |
| 07 | Institution affiliation (low scrutiny) | Automatable with LLM triage | [InCommon](https://www.incommon.org/)/[eduGAIN](https://edugain.org/), [Google Programmable Search](https://programmablesearchengine.google.com/), [Proxycurl](https://nubela.co/proxycurl), faculty scraping, visiting-scholar SOP | ~91% of US higher-ed not in InCommon; 42–46% commercial excluded from federation. |
| 08 | Institution denied parties | Automatable with LLM triage (auditability forces human signoff) | [BIS CSL](https://www.trade.gov/consolidated-screening-list), [OpenSanctions](https://www.opensanctions.org/), [World-Check](https://www.lseg.com/en/risk-intelligence/screening-solutions/world-check-kyc-screening) / [Dow Jones](https://www.dowjones.com/professional/risk/products/risk-compliance/), internal denylist | Non-US list coverage thin; commercial vendors run 30–60% alert FP rates. |
| 09 | Institution real life sciences | Automatable with LLM triage + judgment / multi-source on residual | [OpenCorporates](https://opencorporates.com/), [PubMed](https://pubmed.ncbi.nlm.nih.gov/)/[bioRxiv](https://www.biorxiv.org/), [ClinicalTrials.gov](https://clinicaltrials.gov/), [Candid](https://candid.org/) 990s, domain age/DMARC, registered-agent denylist | 40–60 non-OECD jurisdictions sparse in registries; new entities indistinguishable from shells. |
| 10 | Payment BIN gift card | Automatable | [Stripe](https://stripe.com/)/[Adyen](https://www.adyen.com/) `card.funding`, [binlist.net](https://binlist.net/)/[NeutrinoAPI](https://www.neutrinoapi.com/api/bin-lookup/), prepaid-issuer denylist | 20–40% of biotech startups use Brex/Ramp virtual cards classified as prepaid. |
| 11 | Payment no crypto | Automatable | PSP config audit ([Stripe](https://stripe.com/)/[Adyen](https://www.adyen.com/)/[Braintree](https://www.braintreepayments.com/)), crypto-onramp BIN denylist, MSA prohibition clause | Crypto-debit cards reported as plain debit can evade detection. |
| 12 | Billing institution association | Not automatable (FP noise + judgment / multi-source) | Card AVS, [Smarty](https://www.smarty.com/)/[Melissa](https://www.melissa.com/), [PaymentWorks](https://www.paymentworks.com/)/[JAGGAER](https://www.jaggaer.com/)/[SAM.gov](https://sam.gov/), P-card BIN, [Plaid](https://plaid.com/) ACH, fintech-bank denylist | Non-US customers (30–50%) get weak/no AVS; procurement networks are US/CA/UK only. |
| 13 | Phone VoIP check | Automatable with LLM triage | [Twilio Lookup](https://www.twilio.com/docs/lookup), [Telesign PhoneID](https://www.telesign.com/products/phone-id), callback SOP, periodic rebind | Google Voice academics mis-flagged; 10–25% "unknown line type" in non-OECD. |
| 14 | Identity evidence match | Automatable with LLM triage (residual FP tail) | [Jumio](https://www.jumio.com/), [Onfido](https://onfido.com/), [Persona](https://withpersona.com/), [Stripe Identity](https://stripe.com/identity), NFC ePassport, [Login.gov](https://www.login.gov/)/[ID.me](https://www.id.me/), [FIDO2](https://fidoalliance.org/fido2/), cross-tenant biometric dedup | 8–15% non-Latin-script name mismatches; demographic bias in face matching. |
| 15 | SOC self-declaration | Not automatable (injection-exposed + judgment) | Structured form, LLM extraction ([GPT-4](https://openai.com/api/)/[Claude](https://www.anthropic.com/api)), [IDT](https://www.idtdna.com/)/[Twist](https://www.twistbioscience.com/)/[Aclid](https://aclid.io/) reconciliation, IBC attestation, drift detector | 10–25% submissions degrade to free-text; foreign institutions lack IBC registry (40–50%). |
| 16 | MFA step-up | Automatable with LLM triage | [Auth0](https://auth0.com/)/[Okta](https://www.okta.com/), [WebAuthn](https://webauthn.io/)/passkey, order-time step-up, [SpyCloud](https://spycloud.com/)/[Constella](https://constella.ai/), dormancy re-IDV, help-desk SOP | 30–60% enrollment friction at rollout; 10–30% of API order volume bypasses browser step-up. |
| 17 | Pre-approval list | Roster automatable; positive-verification SOP not automatable (FP noise + judgment) | [IBC-RMS](https://primr.org/), [FSAP](https://www.selectagents.gov/) attestation, event-driven re-eval, positive-verification SOP, predecessor re-IDV, [IGSC](https://genesynthesisconsortium.org/) shared list | Foreign + commercial customers (70–80%) get zero signal from US-centric roster. |
| 18 | Institution legitimacy (SOC) | Not automatable (judgment / multi-source) | [ROR](https://ror.org/), [GLEIF](https://www.gleif.org/), [Companies House](https://www.gov.uk/government/organisations/companies-house)/[OpenCorporates](https://opencorporates.com/), [NIH RePORTER](https://reporter.nih.gov/), [NSF Awards](https://www.nsf.gov/awardsearch/), [CORDIS](https://cordis.europa.eu/), [UKRI GtR](https://gtr.ukri.org/), [Candid](https://candid.org/), shell-company graph, lookalike-domain detector | Commercial entities 30–50% lack ROR; long-aged shells (>2 yrs) clear all checks. |
| 19 | Individual legitimacy (SOC) | Not automatable (judgment / multi-source) | [ORCID](https://info.orcid.org/documentation/features/public-api/), [OpenAlex](https://openalex.org/), [NIH RePORTER](https://reporter.nih.gov/)/[NSF](https://www.nsf.gov/awardsearch/), [ClinicalTrials.gov](https://clinicaltrials.gov/), [Google Scholar](https://serpapi.com/google-scholar-api), faculty scraping, [Scopus](https://dev.elsevier.com/sc_apis.html), role-vs-scope SOP | 40–60% of industry researchers invisible to bibliometrics; non-OECD severely under-indexed. |
| 20 | Voucher legitimacy (SOC) | Not automatable (judgment + injection-exposed) | Voucher IDV ([Jumio](https://www.jumio.com/)/[Onfido](https://onfido.com/)/[Persona](https://withpersona.com/)), [ORCID OAuth](https://info.orcid.org/documentation/integration-guide/orcid-sign-in/), [ROR](https://ror.org/) disjointness, [DKIM](https://datatracker.ietf.org/doc/html/rfc6376) email, [OpenAlex](https://openalex.org/) coauthor graph, live video attestation, voucher trust score, anti-rubber-stamp audit | 20–40% senior-academic IDV refusal; 15–30% of institutions not in ROR. |

## 01. Sanctions name screen

- **What it does:** Screens customer names against national/international sanctions lists (OFAC, UN, EU, UK) to block designated persons.
- **Automatable?** Automatable with LLM triage. Common-name collisions are noisy but structured; LLM disambiguation clears them. Auditability constraint (regulator wants a paper trail per cleared alert) pushes a slice back to human signoff.
- **Options:**
  - **[OFAC SDN](https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists) / [US Treasury SLS](https://sanctionssearch.ofac.treas.gov/)** — official US sanctions list, self-hosted name match ($0)
  - **[OpenSanctions API](https://www.opensanctions.org/)** — aggregated OFAC + UN/EU/UK/CA/AU lists in one call (~$0.11/check)
  - **[LSEG World-Check One](https://www.lseg.com/en/risk-intelligence/screening-solutions/world-check-kyc-screening) / [Dow Jones R&C](https://www.dowjones.com/professional/risk/products/risk-compliance/) / [LexisNexis Bridger](https://risk.lexisnexis.com/products/bridger-insight-xg)** — commercial watchlist with PEP and adverse-media coverage ($0.50–$5/check + low-to-mid 5-figure annual license)
  - **Daily delta re-screen** — re-runs [OpenSanctions](https://www.opensanctions.org/docs/bulk/) or OFAC SLS XML diffs against the existing customer base ($0)
- **Access concerns:** Chinese, Iranian, Russian, and Arabic-name customers face 5–10× elevated false-positive rates from common-name collisions. Commercial watchlists run ~90% alert FP rates and disproportionately flag state-owned-university researchers as PEPs.

## 02. Email affiliation & WHOIS

- **What it does:** Verifies the email domain matches the claimed institution via WHOIS/RDAP, ROR domain registry, mail-tenant fingerprinting, and inbox round-trip.
- **Automatable?** Not automatable (FP noise). ROR domain coverage is thin and DMARC-none is widespread; residual mismatches bottom out in customer follow-up because the only ground truth is the customer themselves.
- **Options:**
  - **[ROR API](https://ror.org/)** — research organization registry, matches institutional domain to canonical institution record ($0)
  - **[RDAP](https://data.iana.org/rdap/dns.json) / [WHOIS bootstrap](https://www.iana.org/whois)** — returns domain age and registrant info ($0)
  - **[Internet Archive Wayback CDX](https://archive.org/developers/wayback-cdx-server.html)** — first-seen date and content history of the domain, classified by LLM (~$0.001/check)
  - **DNS MX + SPF/DMARC + [Microsoft GetUserRealm](https://login.microsoftonline.com/getuserrealm.srf)** — identifies mail tenant (M365, Workspace, self-hosted) and authentication posture ($0)
  - **[Kickbox](https://kickbox.com/) / disposable-domain GitHub lists** — flags throwaway and free-mail providers ($0)
  - **Inbox round-trip via [SES](https://aws.amazon.com/ses/)/[Postmark](https://postmarkapp.com/)** — confirms inbox control with a signed JWT link (<$0.001/check)
  - **[dnsReaper](https://github.com/punk-security/dnsReaper) + [crt.sh](https://crt.sh/) + [Tranco](https://tranco-list.eu/)** — detects dangling DNS / drop-catch domains ($0)
  - **[DomainTools](https://www.domaintools.com/) (escalation only)** — historical WHOIS for ambiguous cases (~$15/lookup)
- **Access concerns:** 5–15% of academics use personal/free-mail (gmail), heavier in developing countries. New biotech startups (<12 months domain) and non-Anglophone institutions with thin ROR coverage are falsely flagged.

## 03. Shipping PO box

- **What it does:** Detects P.O. Boxes and CMRA/virtual-mailbox addresses in shipping fields.
- **Automatable?** Automatable with LLM triage. DPV output is structured; the only "FPs" are CMRA-using biotechs, which is the measure firing as designed, and the follow-up is templatable.
- **Options:**
  - **Regex SOP** — pattern match for "PO Box", "P.O.B.", localized variants ($0)
  - **[USPS Delivery Point Validation (DPV)](https://postalpro.usps.com/address-quality/delivery-point-validation)** — official USPS classification of US addresses incl. PO box flag ($0.001–$0.005/check)
  - **[Smarty (SmartyStreets)](https://www.smarty.com/)** — US + international address validation with PO box and CMRA flag ($0.003–$0.05/check)
  - **[Melissa Global Address](https://www.melissa.com/v2/global-address-verification/)** — international address verification with PO box detection ($0.003–$0.05/check)
- **Access concerns:** Non-OECD coverage near-zero. Legitimate PO Box users (~2–5% commercial) and Dutch "Postbus" official addresses get falsely flagged. CJK/Arabic/Russian PO box equivalents (20–40% international) not detected by English regex.

## 04. Shipping residential

- **What it does:** Flags residential vs. business shipping addresses to discourage personal-residence delivery.
- **Automatable?** Automatable with LLM triage. RDI + Places is structured and the FP archetypes (community labs, rural researchers) are enumerable and clearable from side signals.
- **Options:**
  - **[USPS Residential Delivery Indicator (RDI)](https://postalpro.usps.com/address-quality/rdi)** — official US residential flag ($0–$0.005/check, incremental to DPV)
  - **[Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview)** — business listing lookup at the shipping address; non-match suggests residential (~$0.032/check)
  - **County assessor bulk data** — property-use codes for US residential classification ($0.0005/check at bulk scale, or $0.05–$0.20/call retail; ~$80K/yr bulk subscription)
- **Access concerns:** 40–55% of orders are international and get weak or zero signal. Community-bio home labs and rural researchers are structurally flagged. Google Places coverage degrades outside OECD.

## 05. Shipping institution association

- **What it does:** Ties the shipping address to the claimed institution via canonical registry addresses, campus polygons, and (for ambiguous cases) two-contact human verification.
- **Automatable?** Not automatable (FP noise + judgment / multi-source). Registry stack misses 10–20% with no entry, throws 15–30% multi-campus FPs, and gives 30–45% of industry orders zero signal; the standard's own answer is the $30–60/case two-contact SOP.
- **Options:**
  - **[ROR API](https://ror.org/)** — canonical institutional address (<$0.02/check)
  - **[GLEIF LEI registry](https://www.gleif.org/)** — legal entity address for commercial institutions ($0)
  - **[OpenStreetMap (Overpass)](https://wiki.openstreetmap.org/wiki/Overpass_API) campus polygons** — geofences for university campuses ($0)
  - **[Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview)** — institution location lookup with cached results (~$0.032/institution)
  - **Two-contact SOP** — human-driven outreach to a second known institutional contact ($30–$60/case)
  - **Incubator-tenant verification** — manual check that a shared-address tenant exists at a biotech incubator ($8–$25/case triggered)
- **Access concerns:** 30–45% of industry/commercial orders get zero signal. Non-OECD institutions without OSM polygons (15–25%) are under-served. Single-PI labs and GDPR-suppressed EU contacts produce review friction.

## 06. Shipping export country

- **What it does:** Blocks shipments to embargoed/export-controlled countries and triggers ECCN review for controlled items to Group D/E destinations.
- **Automatable?** Automatable with LLM triage for the country/DPL layers; not automatable (judgment) for ECCN classification on the ~5% of SOC orders that trigger it — 15–45 min biosafety expert per case is the canonical irreducible-judgment call.
- **Options:**
  - **[ISO 3166](https://www.iso.org/iso-3166-country-codes.html) country normalization + [BIS Country Groups](https://www.bis.doc.gov/index.php/documents/regulations-docs/2255-supplement-no-1-to-part-740-country-groups-1/file) table** — looks up which country group (D/E/embargo) applies to the destination ($0)
  - **[BIS Entity List API (CSL)](https://www.trade.gov/consolidated-screening-list)** — federal denied-parties and end-user list ($0)
  - **HS / ECCN classification (manual)** — biosafety expert classifies the sequence under Export Administration Regulations ($15–$45/case for ~5% of SOC orders)
  - **Freight-forwarder denylist** — self-curated blocklist of known transshipment forwarders ($0 lookup + $5K–$20K/yr curation)
- **Access concerns:** Non-US providers (45–60% of market) operate under EU Dual-Use / UK ECO frameworks with no harmonized check. Re-export via intermediary countries is invisible. The hard deny-gate produces no follow-up path for legitimate edge cases.

## 07. Institution affiliation (low scrutiny)

- **What it does:** Low-scrutiny check that the customer is affiliated with the claimed institution via federated identity, web-presence search, and directory scraping.
- **Automatable?** Automatable with LLM triage. Federation + site-search clears the bulk; the visiting-scholar / non-publishing residual is a small judgment tail, not a per-order bottleneck.
- **Options:**
  - **[InCommon](https://www.incommon.org/) / [eduGAIN](https://edugain.org/) federated login** — university IdP single-sign-on confirms membership ($0)
  - **[Google Programmable Search](https://programmablesearchengine.google.com/) (site: query)** — searches the institution's domain for the customer's name ($0.003–$0.045/check)
  - **[Proxycurl](https://nubela.co/proxycurl) LinkedIn lookup** — confirms employment via LinkedIn profile (~$0.01–$0.04/check; LinkedIn ToS risk)
  - **Faculty directory scraping** — automated where possible ($0.001/check), manual fallback for unmapped institutions ($15–$30/case)
  - **Visiting-scholar SOP** — human verification of temporary affiliations ($10–$30/case)
- **Access concerns:** ~91% of US higher-ed not in InCommon; 42–46% of commercial customers excluded from federation. Non-OECD institutions poorly indexed in Google; 20–40% of EU GDPR-suppressed. China/Russia LinkedIn coverage gaps.

## 08. Institution denied parties

- **What it does:** Screens institutional name against US/international denied-parties lists.
- **Automatable?** Automatable with LLM triage on FP-noise grounds, but auditability constraint bites: commercial watchlists run 30–60% alert FP rates and the BIS-style per-alert signoff requirement effectively forces human work. The clearest case where the FP-noise definition alone misleads.
- **Options:**
  - **[BIS Consolidated Screening List (CSL) API](https://www.trade.gov/consolidated-screening-list)** — free federal screen across BIS Entity List, OFAC SDN, State Department lists ($0)
  - **[OpenSanctions](https://www.opensanctions.org/)** — extends CSL with non-US sanctions lists (~$0.11/check)
  - **[LSEG World-Check](https://www.lseg.com/en/risk-intelligence/screening-solutions/world-check-kyc-screening) / [Dow Jones R&C](https://www.dowjones.com/professional/risk/products/risk-compliance/)** — commercial entity screen with deeper non-US coverage ($0.10–$2.00/check + $5K–$300K/yr license)
  - **Internal denylist** — provider-curated blocklist ($0 lookup; cold-start curation cost)
- **Access concerns:** Non-US lists thin (~10–20% of relevant entities missing from free CSL). Commercial vendors produce 30–60% alert FP rates and PEP flags on state-owned-university researchers. Cost barrier excludes 50–70% of small providers from the commercial tier.

## 09. Institution real life sciences

- **What it does:** Verifies the institution is a real, active life-sciences entity via corporate registries, publication records, and regulatory databases.
- **Automatable?** Automatable with LLM triage + judgment / multi-source on the residual. Clean cases auto-resolve; entity-acquisition / thin-CRO / community-bio cases require fusing 5+ heterogeneous signals into a normative front-vs-real call.
- **Options:**
  - **[OpenCorporates](https://opencorporates.com/)** — global corporate registry lookup; confirms legal entity exists ($0.25–$1.50/check)
  - **[PubMed](https://pubmed.ncbi.nlm.nih.gov/) / [bioRxiv](https://www.biorxiv.org/)** — searches publications for institutional affiliation ($0)
  - **[ClinicalTrials.gov](https://clinicaltrials.gov/)** — confirms institution sponsors or hosts clinical trials ($0)
  - **IRS Form 990 ([Candid](https://candid.org/))** — US nonprofit financial filings ($0 free tier; $5–$50/check for richer Candid data)
  - **Domain age + DMARC posture** — corroborating signal that institutional infrastructure is established ($0; [DomainTools](https://www.domaintools.com/) escalation ~$15)
  - **Registered-agent denylist** — flags shell-company formation agents ($0.05–$0.50/check)
- **Access concerns:** Non-Anglophone/non-OECD jurisdictions (40–60) sparse in registries. New entities (<12 months) indistinguishable from shells. Community-bio and sole-PI consulting LLCs have no PubMed footprint and look like fakes by construction.

## 10. Payment BIN gift card

- **What it does:** Flags or blocks gift-card and prepaid-card BINs on SOC orders.
- **Automatable?** Automatable. Structured PSP enum + deterministic rule; the Brex/Ramp FP class is cleared by a static exception list.
- **Options:**
  - **[Stripe](https://stripe.com/) / [Adyen](https://www.adyen.com/) `card.funding` field** — PSP-native classification of card as credit/debit/prepaid ($0)
  - **[binlist.net](https://binlist.net/) / [NeutrinoAPI BIN Lookup](https://www.neutrinoapi.com/api/bin-lookup/)** — independent BIN database for corroboration ($0.005–$0.05/check)
  - **Prepaid-issuer denylist** — curated list of known gift-card issuers ($0 lookup + $1K–$10K/yr subscription)
- **Access concerns:** 20–40% of biotech startups use Brex/Ramp corporate virtual cards classified as prepaid → false positives. Non-US BIN coverage sparse (4.5–13.5% "unknown" rate internationally).

## 11. Payment no crypto

- **What it does:** Disables cryptocurrency rails at the PSP and blocks crypto-onramp debit-card BINs.
- **Automatable?** Automatable. The load-bearing control is a one-time PSP config audit with zero customer-facing FPs; BIN denylist maintenance is 10–60 min/week.
- **Options:**
  - **PSP configuration audit ([Stripe](https://stripe.com/) / [Adyen](https://www.adyen.com/) / [Braintree](https://www.braintreepayments.com/))** — disable crypto payment methods at the gateway level ($0; one-time 4–8 hour setup)
  - **Crypto-onramp BIN denylist** — blocklist of debit cards issued by crypto exchanges ([Coinbase](https://www.coinbase.com/card), [Crypto.com](https://crypto.com/cards), [BlockFi](https://blockfi.com/)) ($0 lookup + 2 hours/quarter maintenance)
  - **MSA prohibition clause** — contractual prohibition on crypto resellers, scannable via regex ($300–$1,500 one-time legal review)
- **Access concerns:** Crypto-debit cards reported as plain "debit" can evade detection. Sponsor-bank ambiguity (e.g., Pathward issues both crypto and non-crypto BINs) creates collateral false positives. Threat model is unstressed by this measure.

## 12. Billing institution association

- **What it does:** Verifies billing address and payment instrument tie to the claimed institution.
- **Automatable?** Not automatable (FP noise + judgment / multi-source). 15–30% P-card mismatches, 20% multi-campus FPs, and 10–25% small-biotech fintech-bank flags can only be resolved by fusing measure-09 / measure-18 signals into a normative call.
- **Options:**
  - **Card AVS (PSP-native)** — verifies billing address matches issuer record ($0)
  - **[Smarty](https://www.smarty.com/) / [Melissa](https://www.melissa.com/) address normalization** — canonicalizes billing for comparison with institutional address ($0–$0.009/check)
  - **[PaymentWorks](https://www.paymentworks.com/) / [JAGGAER](https://www.jaggaer.com/) / [SAM.gov](https://sam.gov/) procurement networks** — confirms institution is a registered procurement entity ($0–$3/check, includes analyst time)
  - **P-card BIN lookup** — identifies institutional purchasing-card BINs ($0.001–$0.01/check)
  - **[Plaid](https://plaid.com/) ACH account verification** — links bank account to account holder identity ($0.20–$1.00/check)
  - **Fintech-bank denylist** — self-hosted blocklist of consumer-fintech banks ([Chime](https://www.chime.com/), [Cash App](https://cash.app/)) ($0)
- **Access concerns:** Non-US customers (30–50%) get weak or no AVS signal. Procurement networks and P-card BINs are US/CA/UK phenomena. Multi-campus universities produce high FP volume on geographic checks.

## 13. Phone VoIP check

- **What it does:** Classifies phone-line type (VoIP / mobile / landline) and flags SIM-swap exposure; callback SOP for escalations.
- **Automatable?** Automatable with LLM triage. Structured enum signal; FP sources (Google Voice academics, PBX) clearable by cross-referencing institution. Callback SOP is a tail.
- **Options:**
  - **[Twilio Lookup API](https://www.twilio.com/docs/lookup)** — line-type classification (mobile / landline / VoIP) ($0.005–$0.015/check)
  - **[Telesign PhoneID](https://www.telesign.com/products/phone-id)** — line-type plus risk score and SIM-swap signal ($0.01–$0.05/check + $0.10/check SIM-swap add-on)
  - **Callback SOP** — human dials the number to confirm ownership ($2.50–$15/case)
  - **Periodic rebind cadence** — re-verifies phone ownership annually (~$0.24/customer/year)
- **Access concerns:** US academics on Google Voice are falsely flagged as VoIP. MVNO/prepaid customers (10–20% of US wireless) lack SIM-swap data. International "unknown line type" 10–25% in non-OECD countries.

## 14. Identity evidence match

- **What it does:** Document IDV with biometric liveness, NFC ePassport read, and FIDO2 step-up to NIST 800-63 IAL2 for SOC orders.
- **Automatable?** Automatable with LLM triage, with a residual FP-noise tail. Vendor IDV runs end-to-end; 5–15% of attempts (non-Latin-script name mismatches, low-end-device liveness failures) route to human review.
- **Options:**
  - **[Jumio](https://www.jumio.com/)** — document + biometric IDV with liveness ($1.50–$3.50/verification)
  - **[Onfido](https://onfido.com/)** — document + biometric IDV with liveness ($1.20–$3.50/verification)
  - **[Persona](https://withpersona.com/)** — configurable IDV workflows ($1.20–$3.50/verification)
  - **[Stripe Identity](https://stripe.com/identity)** — document + selfie verification, integrated with Stripe payments ($1.50/verification)
  - **NFC ePassport read** — cryptographic chip read of passport (add-on $0–$0.80; 10–20% of customers lack ePassport)
  - **[Login.gov](https://www.login.gov/) / [ID.me](https://www.id.me/)** — federated US government IDV ($2–$5/verification)
  - **[FIDO2 / WebAuthn](https://fidoalliance.org/fido2/) hardware tokens** — phishing-resistant step-up ($14–$80/customer hardware, one-time)
  - **Cross-tenant biometric dedup** — vendor-or-in-house dedup across providers ($2–$8/check vendor; $0.01–$0.10/check in-house with $100K–$300K setup)
- **Access concerns:** 8–15% of customers face non-Latin-script name mismatches. 5–10% fail liveness on low-end devices. 10–20% lack ePassport, 5–10% lack NFC-capable phone. Login.gov/ID.me excludes 40–60% of international researchers. Demographic bias in face-matching.

## 15. SOC self-declaration

- **What it does:** Structured SOC declaration form with LLM-assisted extraction and reconciliation against sequence-screening output; IBC attestation for SOC orders.
- **Automatable?** Not automatable (injection-exposed + judgment). The free-text declaration is attacker-controlled input feeding an LLM extractor, and 10–25% of submissions degrade to "other" free-text. IBC attestation and drift adjudication add a normative layer that doesn't reduce to a classifier.
- **Options:**
  - **Structured declaration form** — typed dropdowns for SOC category and intended use ($0)
  - **LLM extraction ([GPT-4](https://openai.com/api/) / [Claude](https://www.anthropic.com/api))** — parses free-text declarations and normalizes to schema ($0.005–$0.02/order)
  - **[IDT](https://www.idtdna.com/) / [Twist](https://www.twistbioscience.com/) / [Aclid](https://aclid.io/) sequence-screening reconciliation** — compares declaration against multi-vendor screening output ($0.20–$4/order line)
  - **IBC (Institutional Biosafety Committee) attestation** — provider asks IBC to confirm the order ($5–$25/SOC order, human-mediated)
  - **Drift detector** — flags declarations diverging from a customer's historical baseline ($0 infrastructure)
- **Access concerns:** 10–25% of submissions degrade to free-text via "other" escape hatch. Non-English submissions degrade LLM extraction (10–20%). Foreign institutions lack IBC registry presence (40–50%). Benign select-agent gene matches generate 7–9% false positives.

## 16. MFA step-up

- **What it does:** Enforces MFA on SOC orders, requires step-up auth at order time, hardens recovery flows, and re-IDVs dormant accounts.
- **Automatable?** Automatable with LLM triage. Per-order path is structured IdP claims; help-desk recovery (5–10% of customers/year) is exceptional, not per-order.
- **Options:**
  - **[Auth0](https://auth0.com/) / [Okta](https://www.okta.com/) hosted IdP** — managed identity with WebAuthn, TOTP, and step-up enforcement ($0 marginal/login + license tier)
  - **[WebAuthn / passkey](https://webauthn.io/) enrollment** — phishing-resistant browser-native MFA ($0; hardware token $50–$100/customer one-time)
  - **Order-time step-up (`max_age=0`)** — forces re-auth at SOC order submission ($0)
  - **[SpyCloud](https://spycloud.com/) / [Constella](https://constella.ai/) credential-leak feeds** — flags reused breached passwords (~$0.01 amortized/login)
  - **Dormancy re-IDV** — re-runs vendor IDV on dormant accounts ($1.50–$3.00/event)
  - **Help-desk recovery SOP** — human-mediated account recovery ($5–$15/ticket)
- **Access concerns:** 30–60% enrollment friction at rollout. Shared-device lab environments (5–15%) trigger MFA failures. 10–25% IDV abandonment on dormancy re-IDV. 10–30% of order volume via API bypasses browser-mediated step-up.

## 17. Pre-approval list

- **What it does:** Keeps a pre-approved customer roster (institutional IBC records, prior clean orders, IGSC shared list) and re-evaluates entries on adverse events.
- **Automatable?** Roster lookup automatable; positive-verification SOP not automatable (FP noise + judgment). Annual re-verification at $75–150/entity/year and 10–20%/yr academic handoffs set the manual floor.
- **Options:**
  - **[IBC-RMS roster](https://primr.org/)** — institutional biosafety committee records of approved researchers ($0)
  - **[FSAP](https://www.selectagents.gov/) (Federal Select Agent Program) attestation** — confirms US select-agent registration ($5–$25/approval)
  - **Event-driven re-evaluation** — triggers on news, sanctions delta, or adverse event ($1–$5/entity/year)
  - **Positive-verification SOP** — annual human re-verification of pre-approved entities ($75–$150/entity/year, 45–90 min/entity)
  - **Predecessor re-IDV** — re-runs vendor IDV on customers already on the roster ($1.50–$5/verification)
  - **[IGSC](https://genesynthesisconsortium.org/) shared list** — industry-shared customer roster ($0 incremental)
- **Access concerns:** Foreign + commercial customers (70–80%) get zero signal from US-centric IBC roster. IGSC channel "rarely used." Positive-verification SOP fails for institutions refusing verification (5–15%) and GDPR-suppressed EU (10–20%).

## 18. Institution legitimacy (SOC)

- **What it does:** Multi-source institutional legitimacy verification for SOC orders.
- **Automatable?** Not automatable (judgment / multi-source). Each lookup automates; the composite "legitimate institution with clear life-sciences connection" call fuses ROR + GLEIF + registries + grant DBs + shell-graph signals into a normative judgment that is outside the scope of an initial automated version.
- **Options:**
  - **[ROR API](https://ror.org/)** — research organization registry ($0)
  - **[GLEIF LEI registry](https://www.gleif.org/)** — global legal entity identifier ($0)
  - **[Companies House (UK)](https://www.gov.uk/government/organisations/companies-house) / [OpenCorporates](https://opencorporates.com/)** — corporate registry filings ($0–$1.50/check)
  - **[NIH RePORTER](https://reporter.nih.gov/)** — US federally funded biomedical grant records ($0)
  - **[NSF Awards Search](https://www.nsf.gov/awardsearch/)** — US National Science Foundation grant records ($0)
  - **[CORDIS](https://cordis.europa.eu/)** — EU framework research funding records ($0)
  - **[UKRI Gateway to Research](https://gtr.ukri.org/)** — UK research council funding records ($0)
  - **[Candid](https://candid.org/) (accreditation data)** — nonprofit accreditation and 990 financials ($5–$50/check)
  - **Shell-company graph** — links shell entities via shared addresses, agents, officers ($0.10–$1/customer vendor; in-house with $100K–$300K setup)
  - **Lookalike-domain detector** — flags institutional domain spoofing ($0 self-hosted)
- **Access concerns:** Commercial entities 30–50% lack ROR. Non-Anglophone/non-OECD coverage thin. Community bio labs 0% covered. Long-aged shell entities (>2 years) clear all checks; insider attacks pass entirely.

## 19. Individual legitimacy (SOC)

- **What it does:** Verifies the customer as a legitimate SOC user via publication record, grant PI status, and institutional role.
- **Automatable?** Not automatable (judgment / multi-source). The bibliometric layer is LLM-triagable; the role-vs-scope call ("does this PI's actual research justify this SOC") is the irreducible bottleneck on ~5% of orders.
- **Options:**
  - **[ORCID API](https://info.orcid.org/documentation/features/public-api/)** — researcher persistent ID with employment and publication history ($0)
  - **[OpenAlex](https://openalex.org/)** — open scholarly works graph (authors, institutions, citations) ($0)
  - **[NIH RePORTER](https://reporter.nih.gov/) / [NSF Awards](https://www.nsf.gov/awardsearch/)** — confirms PI status on funded grants ($0)
  - **[ClinicalTrials.gov](https://clinicaltrials.gov/)** — investigator role on registered trials ($0)
  - **Google Scholar ([SerpApi](https://serpapi.com/google-scholar-api))** — publication record search (~$0.01–$0.015/check)
  - **Faculty directory scraping** — confirms current institutional role ($0)
  - **[Scopus (Elsevier API)](https://dev.elsevier.com/sc_apis.html)** — commercial scholarly index ($10K–$50K/yr; low marginal value over free sources)
  - **Role-vs-scope SOP** — human review of whether the researcher's role matches the SOC requested ($50–$300/case)
- **Access concerns:** 15–25% of academic staff (lab managers, technicians) never publish; 40–60% of industry researchers invisible to bibliometrics. Early-career researchers (<2–3 years) have thin footprints. Non-OECD/non-English researchers severely under-indexed.

## 20. Voucher legitimacy (SOC)

- **What it does:** Collects a third-party voucher attesting to the customer's legitimacy; verifies the voucher's identity, affiliation, and (for high-trust) live engagement.
- **Automatable?** Not automatable (judgment + injection-exposed). Identity sub-checks automate, but live video attestation, anti-rubber-stamp adjudication (30–60% large-lab FP rate), and the free-text "assessment of need" feeding an LLM all force per-order human work.
- **Options:**
  - **Vendor voucher IDV ([Jumio](https://www.jumio.com/) / [Onfido](https://onfido.com/) / [Persona](https://withpersona.com/))** — runs the voucher through document + biometric IDV ($1.50–$5/voucher)
  - **[ORCID OAuth](https://info.orcid.org/documentation/integration-guide/orcid-sign-in/)** — voucher proves ownership of an ORCID record ($0)
  - **[ROR](https://ror.org/) institutional disjointness check** — confirms voucher and customer are not at the same institution where required ($0)
  - **[DKIM](https://datatracker.ietf.org/doc/html/rfc6376)-signed institutional email** — cryptographic proof the voucher's email came from a real institutional domain ($0)
  - **Coauthor-graph proximity** — checks voucher and customer have prior coauthorship via [OpenAlex](https://openalex.org/) ($0)
  - **Live video attestation** — scheduled video session with the voucher ($25–$30/session Mode A; $2–$5/order with spot-check Mode B)
  - **Voucher trust score** — composite score of voucher signals ($30K–$60K setup)
  - **Anti-rubber-stamp audit** — periodic human audit of high-volume vouchers ($100–$300/quarter)
- **Access concerns:** 20–40% senior-academic refusal/abandonment on IDV. 10–20% non-OECD document failures; 3× demographic bias in face matching. 15–30% of institutions not in ROR. 20–40% of vouchers lack ORCID; non-publishing vouchers structurally invisible.
