# m14-cross-tenant-biometric-dedup — Form check v1

**Document under review:** `04-implementation-v1.md`

## Field verdicts

### name
**PASS.** "Cross-tenant biometric dedup" — clear.

### measure
**PASS.** M14 (identity-evidence-match).

### attacker_stories_addressed
**PASS.** Detailed per-story analysis. Correctly identifies the cross-vendor structural gap for cro-identity-rotation and the inherent limitation against fronted-accomplice patterns.

### summary
**PASS.** Clear description of the 1:N matching mechanism.

### external_dependencies
**PASS.** Four vendor options (Jumio, MetaMap, Didit, Regula) plus in-house alternative documented. Privacy/consent framework acknowledged with cost estimate.

### endpoint_details
**VAGUE** (partial). Jumio's API endpoint URL and specific 1:N Face Lookup API path are not documented — the entry says "RESTful; documented at jumio.com" without giving the actual endpoint path. MetaMap is similarly thin. Didit is better (product page URL given). The in-house option describes the stack but not endpoints (which is appropriate since it's self-hosted).

**What's missing:** Jumio's actual developer API endpoint path for the Face Lookup / dedup feature. The document should either document this or mark it as `[vendor-gated — developer docs behind account creation]`.

### fields_returned
**PASS.** Concrete field list with types. Includes similarity_score, matched_identity_status, liveness_result.

### marginal_cost_per_check
**PASS** (with caveats). All vendor pricing is correctly marked `[vendor-gated]` with industry-range best guesses. In-house cost estimated. Composite range given.

### manual_review_handoff
**PASS.** Detailed SOP with similarity-score thresholds and decision branches. Privacy constraint noted.

### flags_thrown
**PASS.** Four distinct flags with escalation actions.

### failure_modes_requiring_review
**PASS.** Six modes including privacy/consent constraints, vendor lock-in, cross-vendor gap, deepfake attacks, demographic bias, and cold-start problem. The cross-vendor gap is the most important finding.

### false_positive_qualitative
**PASS.** Four categories: twins, institution changers, demographic bias, low-quality sessions.

### record_left
**PASS.** Template ID, scores, consent record, audit log documented. Correctly notes that biometric images are not in order records.

## Borderline observations

1. **Jumio endpoint details are vague.** The document states Jumio has a RESTful API but doesn't give the actual Face Lookup endpoint path or describe the request/response format. This should be marked `[vendor-gated — developer portal requires account; public documentation describes the feature but not the API specification]`.

2. **Similarity-score thresholds** (0.95, 0.85) in the manual review playbook are presented without citation. These are design choices but should be marked as `[best guess]` or cited to vendor-recommended thresholds.

3. **The "cross-tenant" naming is misleading.** The document establishes that no vendor supports cross-tenant (cross-provider) dedup. The check is really "within-tenant" dedup. The title inherits from `00-spec.md` and should be flagged as potentially misleading — though changing the name is a stage 3 decision, not a stage 4 issue.

## For 4C to verify

- Jumio Face Lookup feature and AAMVA partnership (BiometricUpdate.com 2020 article cited).
- MetaMap Duplicate Detection via Facematch documentation (docs.metamap.com link).
- Didit Face Search 1:N free-tier claim.
- Regula Face SDK 1:N capability.
- Jumio "200+ countries" and "billions of data points" claims.
- HyperVerge pricing analysis claim about Jumio being "customized."
- BIPA written-consent requirement for biometric identifiers.

## Verdict

**REVISE.** One VAGUE flag on `endpoint_details` for Jumio/MetaMap. The document should either provide actual API paths or add explicit `[vendor-gated]` admissions for the developer documentation. Remaining fields are solid.
