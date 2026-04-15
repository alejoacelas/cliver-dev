# Per-idea synthesis: m07-incommon-edugain

## Section 1: Filled-in schema

**name**

InCommon + eduGAIN federation IdP enumeration

**measure**

M07 — institution-affiliation-low-scrutiny

**attacker_stories_addressed**

free-mail-affiliation, shell-company, lookalike-domain, dormant-domain, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, shell-nonprofit

**summary**

Build a lookup table from public SAML federation metadata aggregates — InCommon (US R&E federation) and eduGAIN (international interfederation). For each new customer, extract the email domain and check whether it (or its parent) corresponds to a registered Identity Provider (IdP) in either aggregate. A match is a high-confidence signal that the email is on a federated research-and-education domain; absence of a match is uninformative (not evidence of illegitimacy).

**external_dependencies**

eduGAIN metadata aggregate (`https://mds.edugain.org/edugain-v2.xml`, anonymous HTTPS, hourly refresh); InCommon Federation metadata (signed XML aggregate from Internet2, anonymous HTTPS); XML parser + domain-to-IdP index; optional REFEDS R&S entity-category filter.

**endpoint_details**

**eduGAIN MDS:** `https://mds.edugain.org/edugain-v2.xml` — anonymous GET, XML-DSig signed (RSA + SHA-256), regenerated at quarter past each hour. No published rate limit; community guidance is fetch at most once per hour. **InCommon metadata:** published at Internet2 wiki; includes preview and production aggregates; anonymous HTTPS GET; signed. **InCommon membership** (NOT required for read-only metadata consumption): $700 one-time registration + annual fee scaled by Carnegie classification. [vendor-gated — exact Carnegie-tier annual figures are on the published participation-fees-he page but were not retrieved verbatim.] **ToS:** eduGAIN aggregate use governed by eduGAIN Constitution and metadata aggregation practice statement; out-of-band use for KYC is neither explicitly authorized nor prohibited. [unknown — searched for: "edugain metadata permitted use kyc", "edugain metadata third party use license" — no explicit ruling surfaced; legal review recommended.] **Pricing:** $0 marginal for metadata fetch.

**fields_returned**

Per `<EntityDescriptor>`: `entityID` (canonical IdP URL); `<IDPSSODescriptor>` (IdP indicator); `<md:Organization>` (OrganizationName, OrganizationDisplayName, OrganizationURL); `<mdui:UIInfo>` (DisplayName, Description, Logo, InformationURL); `<mdui:Scope>` — the email/eppn scope(s) the IdP claims authority over (**primary lookup key**); `<md:ContactPerson>`; `<mdrpi:RegistrationInfo>` (registering federation); `<mdattr:EntityAttributes>` (REFEDS R&S, Sirtfi, CoCo).

**marginal_cost_per_check**

~$0.000 per check (O(1) hashmap lookup on pre-built `<scope>` → IdP index). **Setup cost:** ~$5–15k engineering (parser, refresh cron, signature verification, domain→IdP index; est. 1–2 engineer-weeks). Optional InCommon participation (not required for metadata consumption): $700 one-time + annual fee.

**manual_review_handoff**

Fires when `domain_no_federation` triggers. Reviewer receives the customer email domain, parent domain, and "no IdP found" record. Reviewer (1) checks if a parent domain has an IdP the child domain inherits; (2) cross-references ROR and global higher-ed lists (e.g., Hipolabs) to distinguish "real institution, no federation" from "fake/shell"; (3) if real-but-non-federated, downgrades to "M07 weak; require corroboration via M07-google-site-search or M19-faculty-page"; (4) if no third-party directory match, escalates to "fake-affiliation candidate; require institutional contact verification."

**flags_thrown**


- `domain_in_incommon` — strong M07 pass; release.

- `domain_in_edugain` — strong M07 pass; release.

- `domain_no_federation` — human triage per SOP.

- `domain_in_federation_but_idp_low_assurance` — soft signal; downgrade confidence if IdP lacks REFEDS R&S / Sirtfi attributes.

**failure_modes_requiring_review**

Aggregate fetch failure (network / signature verification); domain with multiple scopes spanning multiple IdPs (state university systems); sub-domain rollup logic (`@cs.stanford.edu` where IdP scope is `stanford.edu`); `alumni.<u>.edu` forwarders (may or may not be a registered scope); institution uses Microsoft Entra / Google Workspace federation without SAML R&E federation; legitimate non-R&E institutions (hospitals, biotech).

**false_positive_qualitative**

The check does not generate classical false positives (wrongly accusing malicious actors). It generates systematic **false negatives** — legitimate customers who fire `domain_no_federation` and require manual review: (1) ~42–46% of the market (commercial biotech/pharma) — structurally excluded; (2) ~91% of US higher-ed institutions by count (mostly community colleges and small colleges with low synthesis demand); (3) ~85% of worldwide institutions by count (demand-weighted fraction lower because OECD academic institutions are disproportionate buyers); (4) government labs with partial coverage; (5) institutions on Entra/Google Workspace without SAML federation; (6) non-institutional researchers (<1% of orders).

**coverage_gaps**


- **Gap 1 — US HE not in InCommon:** ~5,300 of ~5,819 US Title IV institutions (~91%) are not InCommon members; concentrated in community colleges and small 4-year schools.

- **Gap 2 — Non-OECD outside eduGAIN:** eduGAIN covers ~6,000 IdPs across ~80 federations vs ~40,000 HE institutions worldwide; thin in sub-Saharan Africa, Central Asia, parts of Latin America.

- **Gap 3 — Commercial biotech/pharma:** ~42–46% of synthesis market revenue; excluded by design from R&E federations.

- **Gap 4 — Government/military labs:** partial; US DOE/NIH labs often federated, but state-level and foreign government labs often not.

- **Gap 5 — Entra/Google Workspace institutions:** overlaps Gap 1; no census exists.

- **Gap 6 — Independent/DIY bio:** <1% of orders; no institutional domain.

**record_left**

Exact `<scope>` matched + matching `entityID`; federation registrar (`<mdrpi:RegistrationInfo>`); aggregate version timestamp + signature verification result; optional snapshot of matched `<EntityDescriptor>`. Tamper-evident: metadata is XML-DSig signed by eduGAIN/InCommon, re-verifiable years later.

**bypass_methods_known**

**CAUGHT:** shell-company (self-owned LLC domain), shell-nonprofit (self-owned domain), cro-framing (CRO LLC domain), cro-identity-rotation (per-entity domains), biotech-incubator-tenant (LLC/incubator domain), gradual-legitimacy-accumulation (LLC domain), community-bio-lab-network (community lab domain), dormant-domain (revived lapsed domain), inbox-compromise at non-federated small college, foreign-institution at non-eduGAIN institution.

**bypass_methods_uncovered**

**Structural — any attacker on a federated domain (9+ stories):** it-persona-manufacturing (all sub-paths), visiting-researcher, unrelated-dept-student, lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise, dormant-account-takeover (all bypass methods at federated institutions). **Implementation-specific:** alumni-forwarder rollup logic unspecified (inbox-compromise alumni variant).


## Section 2: Narrative


### What this check is and how it works

This check uses publicly available SAML federation metadata from InCommon (the US research-and-education identity federation operated by Internet2) and eduGAIN (the international interfederation connecting ~80 national R&E federations). Both federations publish signed XML metadata aggregates listing every registered Identity Provider (IdP), including the DNS-style "scopes" each IdP claims authority over — effectively the email domains that institution controls. The check downloads these aggregates (hourly for freshness), builds a hashmap from scope to IdP entity, and for each incoming customer, looks up whether their email domain appears as a registered scope. A match fires `domain_in_incommon` or `domain_in_edugain` (strong pass); no match fires `domain_no_federation` (human triage). The check does not perform actual federated single sign-on — it uses the metadata out-of-band as a domain-trust signal.


### What it catches

The check is highly effective against purpose-built-organization attackers — those who create shell companies, shell nonprofits, CRO LLCs, or revive dormant domains. These entities cannot join InCommon or eduGAIN because R&E federation membership requires genuine academic or research status. The check catches shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, and dormant-domain stories with strong resistance. It also catches inbox-compromise and foreign-institution variants specifically when the target institution is not in a federation, serving as a useful trust-tier signal that separates federated (higher-trust) from non-federated (lower-trust) domains.


### What it misses

The check is structurally blind to all attackers who operate on genuinely federated domains. Because it validates the domain, not the individual, any email on a federated university's domain gets a strong pass — including manufactured personas (it-persona-manufacturing), visiting researchers with real appointments, enrolled students in unrelated departments, compromised accounts, hijacked accounts, and recruited insiders. This covers 9+ attacker stories and represents the check's fundamental limitation: it is a domain-trust classifier, not a person-affiliation verifier. The alumni-forwarder case is also ambiguous because the rollup policy from `alumni.<u>.edu` to the parent scope is unspecified. Coverage gaps compound the miss rate: ~42–46% of the synthesis market (commercial biotech/pharma) is structurally invisible because R&E federations exclude commercial entities by design. Roughly 91% of US higher-ed institutions (by count) and 85% of worldwide institutions are not federation members, though these are disproportionately small institutions with lower synthesis demand.


### What it costs

Marginal cost per check is effectively zero — a single hashmap lookup against a pre-built index. The metadata aggregates are free to download anonymously; no API key or membership is required for read-only consumption. Setup cost is estimated at $5–15k (1–2 engineer-weeks) for the XML parser, hourly refresh cron, XML-DSig signature verification, and domain-to-IdP index. InCommon membership ($700 one-time + Carnegie-scaled annual fee) is not required for this metadata-only approach. The primary ongoing cost is the manual review burden for the large population of legitimate customers whose domains are not federated.


### Operational realism

The manual review handoff is the operational bottleneck. When `domain_no_federation` fires, the reviewer must distinguish "real institution, no federation" from "fake/shell" by cross-referencing ROR, global higher-ed lists (e.g., Hipolabs), and other signals. Given that the majority of legitimate customers will trip this flag (commercial biotech alone is ~42–46% of the market), the check works best as a fast-pass for federated domains rather than as a screen. Federated matches bypass further M07 review; non-federated domains proceed to other checks (M07-google-site-search, M19-faculty-page, M18-ror). The audit trail is strong: the XML-DSig-signed metadata provides a tamper-evident record of the federation match, re-verifiable years later.


### Open questions

The legal basis for out-of-band metadata consumption for KYC purposes is unresolved. The eduGAIN Constitution and metadata aggregation practice statement govern use by participating federations; using the metadata for non-SSO KYC enrichment is neither explicitly authorized nor prohibited. Legal review is recommended before deployment. The exact InCommon Carnegie-tier annual fee schedule was not retrieved verbatim (vendor-gated). The alumni-forwarder domain rollup policy needs a design decision: the stage 5 hardening report recommends that `alumni.*` sub-domains should NOT roll up to the parent scope, as alumni are not current affiliates.

## Section 3: Open issues for human review


- **Surviving Critical finding (Finding 1 from Stage 5):** Any attacker on a genuinely federated domain passes with zero resistance. This is structural to the out-of-band domain-level design and cannot be fixed without fundamentally changing the implementation to require actual federated SSO (which would change the cost structure). This check must be understood as a domain-trust classifier, not a person-level screen.


- **[unknown — searched for: "edugain metadata permitted use kyc", "edugain metadata third party use license"]:** Legal basis for out-of-band KYC use of federation metadata is unresolved; affects deployment viability.


- **[vendor-gated]:** InCommon Carnegie-tier annual fee schedule (not load-bearing for the metadata-only approach, but relevant if the provider later chooses to federate for SSO).


- **Unspecified alumni-forwarder rollup policy:** The implementation notes sub-domain rollup as a failure mode but does not define the policy for `alumni.*` domains. Stage 5 recommends treating `alumni.*` as a negative signal (stale affiliation), not rolling up to the parent scope.


- **UNESCO ~40,000 worldwide HE institutions figure:** Used in Gap 2 estimation but marked [best guess] with no direct citation. The denominator for worldwide coverage fraction is uncertain.
