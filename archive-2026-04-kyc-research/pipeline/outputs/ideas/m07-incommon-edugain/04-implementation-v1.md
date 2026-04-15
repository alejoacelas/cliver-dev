# m07-incommon-edugain — Implementation v1

- **measure:** M07 — institution-affiliation-low-scrutiny
- **name:** InCommon + eduGAIN federation IdP enumeration
- **modes:** D, A
- **summary:** Build a lookup table from public SAML federation metadata aggregates: InCommon (US R&E federation) and eduGAIN (international interfederation). For each new customer, extract the email domain and check whether it (or its parent) corresponds to a registered IdP in either aggregate. A hit is a strong signal that the email is on a federated R&E identity domain (not a free-mail or shell-company domain).

## external_dependencies

- **eduGAIN metadata aggregate** — single signed XML file at `https://mds.edugain.org/edugain-v2.xml`, refreshed approximately hourly. ([source](https://technical.edugain.org/metadata))
- **InCommon Federation metadata** — published by Internet2 as a signed XML aggregate; downloadable by InCommon participants and (for the public/preview aggregate) by integrators. ([source](https://spaces.at.internet2.edu/spaces/federation/pages/168691871/working-with-saml-metadata))
- A small XML parser + a domain → IdP entityID index built from the metadata.
- Optional: REFEDS R&S entity category for additional confidence the IdP releases identity attributes. ([source](https://wiki.geant.org/display/eduGAIN/IDP+Attribute+Profile+and+Recommended+Attributes))

Note: this idea uses the metadata aggregate **out-of-band** — we are not actually federating SSO. We're using the public metadata to know "is this domain operated by a real R&E institution that runs an academic IdP." That distinction matters for cost/auth.

## endpoint_details

- **eduGAIN MDS:** `https://mds.edugain.org/edugain-v2.xml` — anonymous HTTPS GET, signed (RSA + SHA-256). Aggregate is regenerated at quarter past each hour. ([source](https://technical.edugain.org/metadata), [aggregation practice](https://wiki.geant.org/display/eduGAIN/Metadata+Aggregation+Practice+Statement))
- **Auth model:** none — public anonymous fetch. The aggregate is XML-DSig signed, so consumers should verify the signature against the eduGAIN signing certificate.
- **Rate limits:** [unknown — searched for: "edugain mds rate limit", "edugain metadata fetch frequency policy" — no published numerical limit; community guidance is to fetch at most once per hour to match generation cadence.] [best guess: a single hourly fetch is universally accepted; aggressive polling would be socially unwelcome but is not technically blocked.]
- **InCommon metadata:** participant aggregate URLs are published on the InCommon "working with SAML metadata" wiki; the URL set includes a "preview" aggregate and a production aggregate. ([source](https://spaces.at.internet2.edu/spaces/federation/pages/168691871/working-with-saml-metadata)) Anonymous HTTPS GET; signed.
- **InCommon membership** (only required if you want to *federate* SSO, not for metadata consumption): one-time **$700 registration fee** + annual fee scaled by Carnegie classification + one IdP and 50 SPs included. ([source](https://incommon.org/join-incommon/fees/), [source](https://incommon.org/join-incommon/fees/participation-fees-he/)) [vendor-gated — the per-Carnegie-tier annual numbers are on a published table that we did not retrieve verbatim in this iteration; would require direct page fetch for exact figures.]
- **ToS:** eduGAIN aggregate use is governed by the eduGAIN Constitution and metadata aggregation practice statement; both permit consumption by participating federations. Using the metadata for non-SSO out-of-band purposes (KYC enrichment) is not explicitly authorized. [unknown — searched for: "edugain metadata permitted use kyc", "edugain metadata third party use license" — no explicit authorization or prohibition surfaced; legal review recommended.]
- **Pricing:** $0 marginal for metadata fetch.

## fields_returned

For each `<EntityDescriptor>` in the aggregate (per the SAML metadata schema and eduGAIN profile docs):

- `entityID` — canonical IdP URL
- `<IDPSSODescriptor>` — presence indicates the entity is an IdP
- `<md:Organization>` — `OrganizationName`, `OrganizationDisplayName`, `OrganizationURL` (often the institution's canonical web domain)
- `<mdui:UIInfo>` — `DisplayName`, `Description`, `Logo`, `InformationURL` per language
- `<mdui:Scope>` — the email/eppn scope(s) the IdP claims authority over (this is the *primary* lookup key for "does this email domain correspond to an IdP")
- `<md:ContactPerson>` — technical / support / admin contacts
- `<mdrpi:RegistrationInfo>` — federation that registered the entity (e.g., `https://incommon.org`)
- `<mdattr:EntityAttributes>` — entity categories such as REFEDS R&S, Sirtfi, CoCo

For the KYC use case the load-bearing field is `<mdui:Scope>` which lists the DNS-style scope under which the IdP issues `eduPersonScopedAffiliation` values like `staff@stanford.edu`. ([source](https://wiki.geant.org/display/eduGAIN/IDP+Attribute+Profile+and+Recommended+Attributes), [source](https://www.ukfederation.org.uk/content/Documents/IdP3AttributeConfiguration))

## marginal_cost_per_check

- Metadata fetch: $0 (one hourly download, ~250 MB uncompressed for the full eduGAIN aggregate). [best guess on size: eduGAIN aggregate has ~5,000 entities × ~50 KB metadata each.]
- Per-customer lookup: O(1) hashmap on `<scope>` → IdP entity. **~$0.000 per check.**
- **setup_cost:** ~$5–15k engineering for the parser, refresher cron, signature verification, and the domain → IdP index. [best guess: 1–2 engineer-weeks.]
- Optional InCommon participation (NOT required for read-only metadata use): $700 one-time + annual fee. ([source](https://incommon.org/join-incommon/fees/))

## manual_review_handoff

When the check fires `domain_no_federation`:

1. Reviewer receives the customer's email domain, the parent domain, and a "no IdP found" record.
2. Reviewer manually checks (a) whether the parent domain has an IdP that the child domain inherits via SSO, (b) whether the institution is a known R&E entity that simply hasn't joined a federation (most US community colleges, many small colleges, most corporate research labs, most non-OECD universities outside Europe).
3. Reviewer cross-references against ROR (Research Organization Registry) and a global higher-ed list (e.g., Hipolabs `universities` list) to distinguish "real institution, no federation" from "fake/shell."
4. If the institution is real-but-non-federated, downgrade the flag to "M07 weak; require corroboration via M07-google-site-search or M19-faculty-page."
5. If the institution cannot be located in any third-party directory, escalate to "fake-affiliation candidate; require institutional contact verification before order release."

## flags_thrown

- `domain_in_incommon` — domain matches an `<mdui:Scope>` registered by InCommon. **Action:** strong M07 pass; release.
- `domain_in_edugain` — domain matches a non-InCommon eduGAIN federation IdP scope. **Action:** strong M07 pass; release.
- `domain_no_federation` — no scope match. **Action:** human triage per SOP.
- `domain_in_federation_but_idp_low_assurance` — IdP is in metadata but lacks REFEDS R&S / Sirtfi entity attributes. **Action:** soft signal; downgrade confidence.

## failure_modes_requiring_review

- Aggregate fetch failure (network, signature verification fail).
- Domain has multiple scopes spanning multiple IdPs (federated state university systems).
- Customer email is on a sub-domain (`@cs.stanford.edu`) where the IdP scope is the parent (`stanford.edu`) — requires parent-domain rollup logic.
- Email is on an `alumni.<u>.edu` forwarder; the alumni domain may or may not be a registered scope.
- Customer is at an institution that uses Microsoft Entra / Google Workspace federation rather than SAML R&E federation (very common for small colleges and corporate labs).
- Customer is at a legitimate non-R&E institution (e.g., a hospital, a small biotech) that has no R&E federation membership by design.

## false_positive_qualitative

- Researchers at small US colleges and community colleges that never joined InCommon (covered by stage 6 BOTEC).
- Researchers at corporate labs and biotech firms (Genentech, Regeneron, etc.) — by design these are not R&E federation members.
- Researchers at non-OECD universities whose national federation never joined eduGAIN (large parts of Africa, Central Asia, parts of Latin America).
- Researchers at K-12 / vocational labs where work is genuine.
- Customers using a personal `alumni.*.edu` forwarder issued by their alma mater.

## record_left

- The exact `<scope>` matched + the matching `entityID`
- The federation registrar (`<mdrpi:RegistrationInfo>`)
- Aggregate version timestamp + signature verification result
- Optional: snapshot of the matched `<EntityDescriptor>` for the audit log

This is a tamper-evident artifact: the metadata is XML-DSig signed by eduGAIN/InCommon, so the audit trail can be re-verified years later.

## Open issues for v2

- Verbatim InCommon HE Carnegie-tier fee schedule (currently `[vendor-gated]`).
- Explicit ToS / acceptable-use ruling on out-of-band metadata use for KYC.
- Quantitative coverage: what fraction of US R1 / R2 / liberal-arts colleges are actually in InCommon (deferred to stage 6).
