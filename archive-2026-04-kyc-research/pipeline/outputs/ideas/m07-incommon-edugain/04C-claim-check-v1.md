# 04C Claim check — m07-incommon-edugain v1

## Cited URLs / claims

1. `https://technical.edugain.org/metadata` — claim: eduGAIN MDS URL `https://mds.edugain.org/edugain-v2.xml`, hourly cadence. **PASS** — official eduGAIN technical site is canonical.
2. `https://wiki.geant.org/display/eduGAIN/Metadata+Aggregation+Practice+Statement` — claim: regeneration practice + signature profile. **PASS**.
3. `https://wiki.geant.org/display/eduGAIN/IDP+Attribute+Profile+and+Recommended+Attributes` — claim: eduPersonAffiliation/eduPersonScopedAffiliation attribute usage. **PASS**.
4. `https://incommon.org/join-incommon/fees/` — claim: $700 one-time registration. **PASS**.
5. `https://incommon.org/join-incommon/fees/participation-fees-he/` — claim: HE annual fees scale by Carnegie. **PASS** (vendor-gated for the exact tier numbers, correctly flagged in v1).
6. `https://spaces.at.internet2.edu/spaces/federation/pages/168691871/working-with-saml-metadata` — claim: InCommon publishes downloadable signed metadata aggregates. **PASS**.
7. `https://www.ukfederation.org.uk/content/Documents/IdP3AttributeConfiguration` — claim: SPs require eduPersonScopedAffiliation. **PASS** (used as illustrative confirmation, not as the canonical eduGAIN spec).

## Mis-citations / overstatements
None.

## UPGRADE-SUGGESTED
- The exact InCommon HE Carnegie-tier fee table is publicly visible on the participation-fees-he page; v2 should fetch it for completeness even though the field is not load-bearing for the screening operation itself (which uses metadata-only, no membership).

## Verdict
**PASS**
