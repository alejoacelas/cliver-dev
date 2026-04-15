# 04C claim check — m19-orcid-employments v1

## Claims verified

### PASS — 2% institution-verified affiliations

The cited URL https://info.orcid.org/a-closer-look-at-orcids-affinity-for-affiliations/ exists and confirms that as of August 2023, of ~14M ORCID iDs, only ~2% have an affiliation added by an organization (i.e., institution-asserted). The document under review faithfully reports this.

### PASS — ORCID Public API v3.0 base URL

`https://pub.orcid.org/v3.0/` is the documented Production Public API base. Confirmed via the ORCID-Source GitHub README.

### PASS — Public API is free

ORCID Public API access is free and the only requirement is registering for OAuth client credentials. Confirmed.

### PASS — employments / educations endpoints

`/{ORCID-iD}/employments` and `/{ORCID-iD}/educations` are documented as v3.0 affiliation sub-resources. Confirmed.

### Note — rate-limit specifics

The `[vendor-gated]` admission for the exact RPS/burst numbers is appropriate; the public ORCID FAQ page confirms limits exist and 503s are returned on overflow but does not always publish the precise numbers. No flag.

## Verdict

PASS
