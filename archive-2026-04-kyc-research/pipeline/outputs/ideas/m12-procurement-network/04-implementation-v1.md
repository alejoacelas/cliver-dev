# m12-procurement-network — Implementation v1

- **measure:** M12 — billing-institution-association
- **name:** Institutional supplier-onboarding verification (PaymentWorks / Jaggaer / SAM.gov)
- **modes:** A (asymmetric — proves an authorized procurement relationship)
- **summary:** When a customer claims a US (or US-funded) institutional affiliation and proposes invoice / PO billing, verify that the synthesis provider is enrolled as a recognized supplier in the institution's procurement network — PaymentWorks (universities), Jaggaer (universities and US states), or SAM.gov (federal). A confirmed supplier registration with that institution proves the institution's procurement office has authorized the relationship and is the strongest available signal that billing routes to the institution rather than to an attacker drop.
- **attacker_stories_addressed:** dormant-account-takeover (Bypasses A–C: inherited PO/Pcard/invoice — registration auditable through procurement trail), shell-company / shell-nonprofit / cro-* / biotech-incubator-tenant / community-bio-lab-network / gradual-legitimacy-accumulation (none of these LLC branches will be in any institutional supplier registry, so positive registration excludes them), credential-compromise (invoiced order under target's affiliation — registration must match the affiliated institution).

## external_dependencies

- **PaymentWorks** — third-party supplier-onboarding platform used by ~150+ US universities and large nonprofits. Suppliers maintain a single account spanning all PaymentWorks customer institutions. [source](https://www.paymentworks.com/)
- **JAGGAER One Supplier Network** — global supplier network advertised at 13M+ pre-validated suppliers; widely deployed at US public universities (Indiana, EKU, U-Dayton "Runway", Penn, U-RI) and US-state procurement (Georgia DOAS). [source](https://www.jaggaer.com/solutions/supplier-network) [source](https://doas.ga.gov/state-purchasing/team-georgia-marketplace/jaggaer-sourcing-director-for-colleges-and-universities)
- **SAM.gov** — federal System for Award Management; required for any entity receiving US federal funding or contracts. Entity Management API is documented at open.gsa.gov. [source](https://open.gsa.gov/api/entity-api/)
- Human role: provider's accounts-receivable / customer-onboarding analyst, who actually owns the supplier-portal logins for each customer institution.

## endpoint_details

### SAM.gov Entity Management API

- URL: https://api.sam.gov/entity-information/v3/entities (per GSA Open Technology). [source](https://open.gsa.gov/api/entity-api/)
- Auth: free SAM.gov account + API key. Public/non-sensitive data tier requires only standard registration. [source](https://open.gsa.gov/api/entity-api/)
- Rate limits: free public-tier accounts get **10 requests/day** at the public level; higher rates available with FOUO/sensitive credentials and roles. [source](https://open.gsa.gov/api/entity-api/) `[best guess: a synthesis provider running this against every claimed-federal customer would need an authorized federal-government-data-services account or a paid commercial wrapper to exceed 10/day]`
- Pricing: free.
- ToS: data is public-domain federal data; no commercial-use restriction. Standard SAM.gov ToS prohibits scraping the web UI but the API is the supported access path.

### PaymentWorks

- URL: https://www.paymentworks.com/ (vendor home; no public developer portal). [source](https://www.paymentworks.com/)
- Auth: vendor portal login as a registered supplier. The synthesis provider needs to be onboarded by **each** customer institution that uses PaymentWorks. Once onboarded, the supplier dashboard shows which institutions have approved them. There is no documented public API for third-party supplier-status lookup. [vendor-gated — public marketing pages describe the onboarding workflow and that suppliers maintain one account across all PaymentWorks customers; would require sales contact for any partner/API access](https://www.paymentworks.com/)
- Rate limits / pricing: `[unknown — searched for: "PaymentWorks API", "PaymentWorks developer portal", "PaymentWorks supplier lookup API"]`. The product is sold to *buying* institutions, not to suppliers; suppliers use it for free.
- ToS: no public ToS for API consumption since no public API.

### JAGGAER

- URL: https://www.jaggaer.com/solutions/supplier-network. [source](https://www.jaggaer.com/solutions/supplier-network)
- Auth: as with PaymentWorks, the synthesis provider registers as a supplier with each JAGGAER-using customer; supplier portal login shows which buyers have approved them. JAGGAER advertises an integration platform and APIs to enterprise buyers but not to suppliers for status lookup. [vendor-gated — public marketing describes 13M-supplier network and approval workflow; would require sales contact for buyer-side API or supplier-status export](https://www.jaggaer.com/solutions/supplier-network)
- Rate limits / pricing: `[unknown — searched for: "Jaggaer supplier API", "Jaggaer ONE integration documentation", "Jaggaer supplier network API"]`.

### Practical implementation pattern

Because PaymentWorks and JAGGAER do not expose third-party "is X registered as a supplier with institution Y" APIs, the operational pattern is **internal CRM lookup**, not external API call:

1. Provider's onboarding team maintains a list of customer institutions with which they hold supplier-registration status, by procurement system, with the registration ID and effective dates.
2. New order claiming institutional affiliation → check internal CRM for an active supplier registration with that institution.
3. For US federal customers, the SAM.gov API is queried to confirm the *customer institution* is itself an active SAM-registered entity (a sanity check that the customer org is real and federally recognized).

## fields_returned

### SAM.gov Entity Management API (per open.gsa.gov)

[source](https://open.gsa.gov/api/entity-api/)

- Legal business name, DBA name
- UEI (Unique Entity Identifier; replaced DUNS in 2022)
- CAGE code
- Physical and mailing address
- Registration status (Active / Expired / Submitted)
- Registration effective and expiration dates
- Business types
- NAICS, PSC codes
- Points of contact (name and address only at public tier)
- Entity URL

### PaymentWorks supplier dashboard (vendor-described, not API)

- Connected customer institutions
- Approval status per institution
- Supplier ID per institution
- W-9 / banking details (held internally; not exposed)
- [vendor-described, not technically documented](https://www.paymentworks.com/)

### JAGGAER supplier portal (vendor-described, not API)

- Connected buyer organizations
- Buyer-assigned supplier ID
- Approval state and renewal cadence
- [vendor-described, not technically documented](https://www.jaggaer.com/solutions/supplier-network)

## marginal_cost_per_check

- SAM.gov API: $0 (free) but at 10 req/day public limit, effectively free for low volume; for serious volume the provider needs an upgraded role. [source](https://open.gsa.gov/api/entity-api/)
- PaymentWorks / JAGGAER lookups: $0 marginal because the lookup is internal-CRM (provider maintains supplier-registration list themselves). [best guess: 1–3 minutes of analyst time at $30–$60/hr loaded ≈ $0.50–$3 per check when an analyst actually opens the CRM record]
- **setup_cost:** Substantial. The provider must (a) register as a supplier with each PaymentWorks/JAGGAER customer institution they want to do business with — typical registration takes ~20 minutes per institution and the institution's approval can take days to weeks [source](https://procurement.iu.edu/sdm/index.html); (b) build internal CRM tracking; (c) maintain registration renewals (most procurement systems require annual or biennial re-verification). Across ~500 R1+R2 US universities this is a meaningful one-time onboarding investment.

## manual_review_handoff

When the order claims an institutional affiliation and the customer requests invoice / PO / institutional billing:

1. Look up the institution in the provider CRM under "supplier registration."
2. **Active registration found** with that institution → proceed; record `{procurement_system, supplier_id, last_renewal_date}` on the order.
3. **No registration** but the institution is large/known and the customer is asking for invoice billing → contact the institution's procurement office at the publicly-listed AP/procurement phone or email (looked up independently from the customer-supplied contact info), confirm the order is authorized. Document the call.
4. **No registration and customer cannot connect provider with procurement office** → require a card payment instead and re-route through M12 BIN/AVS checks, or deny SOC orders.
5. **For SAM.gov customers** (federal labs, federal contractors): query the Entity Management API on the institution's UEI; confirm Active status and matching legal name.

## flags_thrown

- `procurement_no_supplier_registration` — claimed institution is not in provider's supplier-registration CRM.
- `procurement_registration_expired` — registration exists but is past renewal date.
- `procurement_institution_not_in_sam` — federal-facing customer not found in SAM.gov.
- `procurement_sam_inactive` — SAM.gov UEI is in non-Active state.
- `procurement_callback_unconfirmed` — escalation callback to procurement office did not confirm the order.

Standard human action for each: hold the order; route to the supplier-onboarding analyst; do not allow invoice billing path until resolved.

## failure_modes_requiring_review

- SAM.gov rate limit hit (10/day public) → fall back to manual sam.gov web search [source](https://sam.gov/content/entity-landing), document UEI in the case file.
- Institution uses a procurement system not in {PaymentWorks, JAGGAER, SAM.gov} (e.g., SAP Ariba, Coupa, Workday). The check has no signal — must be supplemented by callback.
- Foreign institutions (non-US): SAM.gov is US-federal only; PaymentWorks and JAGGAER have international footprints but coverage is patchy. `[best guess: <20% of non-US universities use a recognizable shared procurement portal, based on the US-centric customer lists on PaymentWorks/JAGGAER pages]`.
- Newly onboarded customer institution where the provider is mid-registration → false negative.
- Supplier-ID number changes (institution renumbers suppliers, vendor consolidation) → false flag; reviewer must reconcile with the institution's procurement office.

## false_positive_qualitative

- Legitimate small/independent labs with no relationship to a major US university. They will never appear in PaymentWorks/JAGGAER. The check should not be applied to customers who are not claiming an affiliation with a procurement-network institution.
- Legitimate university customers placing the order against a startup grant or personal funds rather than the institution's PO. Procurement-system enrollment is irrelevant to this case; the customer is paying personally even though their email is institutional. This will produce a false `procurement_no_supplier_registration` if the check is run against billing path rather than against the customer profile.
- Legitimate non-US institutions with their own national procurement system. Treat as out-of-scope rather than as a flag.

## record_left

For each invocation: `{order_id, claimed_institution, procurement_system_checked, supplier_id, registration_status, registration_effective_date, registration_expiration_date, sam_uei (if applicable), sam_status (if applicable), checked_at, checked_by, callback_log (if escalated)}`. This is auditable and supports M12's "Y" auditability flag.

## sources

- [PaymentWorks](https://www.paymentworks.com/)
- [PaymentWorks at FSU](https://procurement.fsu.edu/faqs/paymentworks-faqs)
- [PaymentWorks at UVA](https://uvafinance.virginia.edu/payments-expensing/supplier-payee-registration)
- [Jaggaer One Supplier Network](https://www.jaggaer.com/solutions/supplier-network)
- [Jaggaer at Indiana University](https://procurement.iu.edu/sdm/index.html)
- [Jaggaer at Eastern Kentucky University](https://www.eku.edu/in/guides/jaggaer/)
- [Jaggaer at Georgia DOAS](https://doas.ga.gov/state-purchasing/team-georgia-marketplace/jaggaer-sourcing-director-for-colleges-and-universities)
- [SAM.gov Entity Management API](https://open.gsa.gov/api/entity-api/)
- [SAM.gov Entity Information](https://sam.gov/content/entity-landing)
