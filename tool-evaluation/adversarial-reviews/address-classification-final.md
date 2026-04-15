# Adversarial review: address-classification (FINAL)

**Iterations:** 1 (thorough initial testing -- no high-severity untested gaps requiring re-run)

## Resolved findings

- **Smarty CMRA flag is systematically broken.** 4 known CMRA addresses (UPS Store locations, PMB addresses) all returned dpv_cmra=N. This is not a sampling issue -- the flag is non-functional. Workaround identified: use components.pmb_designator="PMB" as a stronger heuristic. The boundary is established and a re-run would not change the verdict.
- **Smarty RDI is bidirectionally unreliable.** Harvard science building classified as Residential (false positive for institutional flagging). NYC residential high-rise classified as Commercial (false negative). RDI reflects USPS mail delivery infrastructure, not building occupancy. Both directions of failure tested.
- **Google Places address-only search is useless for institutional classification.** 10+ addresses tested by street address alone. MIT, Pfizer, Institut Pasteur, freight forwarder buildings, residential -- all returned "premise" with no institutional type. The institution name must be included in the query. This transforms Google Places from a discovery tool to a verification tool.
- **Coworking lab spaces (LabCentral, BioLabs, JLABS) are invisible to all APIs.** Three different wet-lab incubators tested. None correctly classified. Google's type taxonomy has "coworking_space" for office coworking (WeWork, Regus) but no category for wet-lab incubators. A maintained denylist (~50-100 addresses) is the only viable detection method.
- **Freight forwarders invisible without keyword injection.** Two multi-tenant freight buildings tested (Elmont NY, La Cienega LA). Address-only search returned "premise." With "freight forwarder" keyword, returned "shipping_service" with 5-8 companies. The data exists in Google but is unreachable from address alone. Nearby Search with type=shipping_service filter proposed as workaround.
- **GeoNames provides zero useful signal.** Street addresses return empty. Name search found only MIT (as "SCH"). Reverse geocode returned only building names. Recommend dropping from the pipeline entirely.
- **OSM useful for university campuses only.** MIT campus polygon confirmed. LabCentral (500m from MIT) not in OSM. Genspace not in OSM. OSM is accurate for large university campuses but adds nothing for commercial, coworking, or residential classification.
- **All four customer types tested.** Universities (academia), pharma (industry), community labs (general life science), sanctioned-country institutions. International coverage spans US, UK, France, India, Nigeria, China, Uganda.

## Unresolved findings (forwarded to final synthesis)

- **No automated freight forwarder detection from address alone.** The Nearby Search workaround (Google Places with type=shipping_service filter at address coordinates) was proposed but not tested. This is an architectural recommendation, not an empirical finding. Forward to final synthesis as a design consideration.

## Open medium/low findings (informational, not blocking)

- **MEDIUM: Virtual office detection not tested.** Regus/Spaces as virtual office (mail only, no physical presence) vs. Regus as coworking (actual tenancy) are indistinguishable from the address. Google Places returns "coworking_space" for both. A KYC pipeline cannot distinguish mail-only tenants from real tenants at these addresses.
- **MEDIUM: Non-US address classification not tested with Smarty.** Smarty is a US-only service. International addresses require a different tool (Google Places name+address, or a geocoding service). The gap is documented but Stage 3 correctly focused Smarty testing on US addresses.
- **MEDIUM: Google Places Nearby Search endpoint not tested.** The proposed freight forwarder detection workaround uses a different Google Places endpoint than what was tested. Would need additional API calls to validate.
- **LOW: primaryType vs. types array inconsistency documented.** University of Ibadan has primaryType=consultant but university in the types array. Operational guidance (always scan full types array) is clear.
- **LOW: Smarty PO Box addresses return empty.** US Street API does not process PO Box addresses. Separate endpoint or regex needed. This is covered by the export-control group's PO Box regex.
