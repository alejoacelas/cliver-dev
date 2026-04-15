# m14-jumio — Implementation research v1

- **measure:** M14 — identity-evidence-match
- **name:** Jumio Identity Verification (document + selfie liveness, IAL2-equivalent)
- **modes:** D (deterministic vendor pipeline)

## summary

Jumio's KYX/Identity Verification platform performs ID document capture and authentication, optional NFC chip read on ePassports, biometric face match against the document portrait, and active+passive liveness detection. The vendor advertises 5,000+ document subtypes across 200+ countries/territories and is certified at NIST SP 800-63-3 IAL2 (per Kantara list, vendor claim) [vendor-described — see security page](https://www.jumio.com/privacy-center/security/). Output is a per-transaction verification record that a DNA-synthesis provider can use as the IAL2 evidence-match artifact required by M14 for SOC orders.

## attacker_stories_addressed

- account-hijack (Branch C) — IAL2 deepfake / morph / handoff bypasses
- credential-compromise (Branch A) — IAL1/IAL2 fraudulent-doc and injection paths
- dormant-account-takeover (Branch D) — order-time re-proofing
- dormant-domain (Branch A) — injection-against-weak-SDK fallback
- bulk-order-noise-cover (Branch E) — IAL2 record vs current-orderer mismatch

Jumio addresses these only insofar as the integrating provider re-triggers Jumio at *order time* for SOC orders (not just onboarding). It does NOT address fronted-accomplice branches (shell-nonprofit, cro-identity-rotation) where the registered identity legitimately matches the IAL2 record.

## external_dependencies

- Jumio KYX Platform / Identity Verification product (commercial vendor)
- Jumio web/mobile SDKs (iOS, Android, JS) for capture
- Jumio REST API for backend integration and result retrieval
- ICAO PKD (Jumio-managed) for ePassport NFC chip verification on supported devices
- Customer portal at customer-portal.netverify.com for manual review console

## endpoint_details

- **Product page:** https://www.jumio.com/products/identity-verification/ [source](https://www.jumio.com/products/identity-verification/)
- **Documentation hub:** https://documentation.jumio.ai [source](https://documentation.jumio.ai)
- **API base (legacy NetVerify v4 / current KYX Platform):** REST endpoints under `*.netverify.com` and `*.jumio.ai`. Newer "Jumio Platform" API uses OAuth2 bearer tokens; legacy NetVerify uses HTTP Basic Auth with API token (user) + API secret (password) [source](https://github.com/Jumio/implementation-guides/blob/master/netverify/fastfill-api.md). Required headers: `Accept: application/json`, `Authorization: Basic ...`, `User-Agent: Company App/v1.0` (vendor enforces a non-default UA).
- **Auth model:** API key/secret (Basic) on legacy; OAuth2 bearer on Platform. Basic-auth deprecation announced but still supported [source](https://documentation.jumio.ai/docs/Integrate/netVerifyv2/upgrading-from-netverify).
- **Result retrieval:** Netverify Retrieval API (pull) and Netverify Callback (push to a customer-hosted HTTPS URL) deliver the final decision and extracted data [source](https://documentation.jumio.ai/docs/Integrate/netVerifyv2/idVerification/callbackIDVerification).
- **Rate limits:** [unknown — searched for: "Jumio API rate limit", "Jumio Netverify requests per second", "Jumio KYX throttling docs"; vendor docs require login for the throttling page]
- **Pricing:** [vendor-gated — Jumio publishes no list price. Public reviews indicate volume-based per-verification pricing customized per contract; would require sales contact for tier specifics] [source](https://hyperverge.co/blog/jumio-pricing/)
- **ToS constraints relevant to customer screening:** Jumio's master service agreement is gated. Public privacy/trust center confirms ISO 27001, SOC 2 Type II, and that biometric data is processed under explicit consent; cross-tenant biometric matching requires opt-in per customer contract [source](https://www.jumio.com/privacy-center/security/).
- **Compliance posture:** Vendor claims IAL2 certification under NIST SP 800-63-3 [vendor-described — security page; Kantara TFP listing not directly verified in this round; searched for: "Kantara approved trust services Jumio IAL2"](https://www.jumio.com/privacy-center/security/).

## fields_returned

From the Netverify Retrieval / Callback response (vendor-documented but exact JSON requires login on current docs site; the publicly-mirrored older guides show):

- `transactionStatus` — DONE / FAILED / PENDING
- `verificationStatus` — APPROVED_VERIFIED / DENIED_FRAUD / DENIED_UNSUPPORTED_ID_TYPE / ERROR_NOT_READABLE_ID / NO_ID_UPLOADED
- `idType`, `idCountry`, `idNumber`, `idExpiry`, `idFirstName`, `idLastName`, `idDob`, `idAddress`
- `identityVerification` (similarity / validity sub-fields for face match: `MATCH` / `NO_MATCH` / `NOT_POSSIBLE`)
- `livenessDetection` — `PASSED` / `FAILED` (Jumio Liveness or Liveness Premium)
- `rejectReason` — coded reason (e.g., MANIPULATED_DOCUMENT, FAKE, BLACK_WHITE_PHOTOCOPY, DIGITAL_COPY)
- `additionalChecks` — NFC chip read result where applicable
- `clientIp`, `merchantReportingCriteria`, `customerId`, `additionalInformation`
- Image URLs / scan references for the captured document and selfie (retention-window gated)

[source](https://github.com/alindogandev/jumio-implementation-guides/blob/master/netverify/netverify-web-v4.md) [vendor-described, partially mirrored from older NetVerify Web v4 docs]

## marginal_cost_per_check

[best guess: $1.50–$3.50 per completed verification in mid-volume contracts (10k–100k/month). Reasoning: G2 and SaaSWorthy reviews repeatedly cite $1–$5 per IDV transaction for Jumio-tier vendors; Onfido and Persona disclose comparable per-check ranges in public RFP responses; Jumio is generally positioned at the higher end of this band because of its document coverage and IAL2 certification.] [source](https://hyperverge.co/blog/jumio-pricing/)

- **setup_cost:** [best guess: $0–$25k integration fee plus minimum monthly commitment $2k–$10k. Reasoning: standard for enterprise IDV vendors at this tier per public RFP responses; vendor-gated for exact figure.]

## manual_review_handoff

When Jumio returns anything other than `APPROVED_VERIFIED`:

1. Reviewer opens the Jumio Customer Portal (`customer-portal.netverify.com`) and pulls the transaction by ID.
2. Reviewer inspects the captured ID image, the selfie, the rejection code, and Jumio's confidence sub-scores.
3. For `ERROR_NOT_READABLE_ID` or `NO_ID_UPLOADED`: contact the customer through the synthesis provider's account messaging, request a re-capture using a different device or better lighting, re-run Jumio.
4. For `DENIED_FRAUD` with rejection codes `MANIPULATED_DOCUMENT`, `FAKE`, `DIGITAL_COPY`: hard-deny the SOC order, freeze the customer account, file an internal SAR-style note, and, if the customer-id ties to a US person, refer to the synthesis provider's compliance officer for HHS reporting per the screening framework guidance.
5. For `NO_MATCH` on face: request a fresh liveness selfie via Jumio re-invitation; if the second attempt also fails, escalate to compliance.
6. Document the decision and reviewer ID in the synthesis provider's case-management system.

[source](https://documentation.jumio.ai)

## flags_thrown

- `jumio_doc_failed` — `verificationStatus` ∈ {DENIED_FRAUD, DENIED_UNSUPPORTED_ID_TYPE, ERROR_NOT_READABLE_ID}. Action: deny SOC order pending review (steps 3–4 above).
- `jumio_liveness_failed` — `livenessDetection = FAILED`. Action: re-invite once; on second failure escalate to compliance.
- `jumio_face_no_match` — `identityVerification.similarity = NO_MATCH`. Action: hold order, require manual re-review against documentary evidence.
- `jumio_nfc_chip_invalid` — additionalChecks NFC failure on a chipped passport. Action: treat as elevated suspicion of forged passport; deny SOC order, escalate.
- `jumio_pending_timeout` — `transactionStatus = PENDING` beyond expected callback window. Action: poll Retrieval API; if still pending after Jumio's documented SLA, treat as unverified.

## failure_modes_requiring_review

- API errors / 5xx from Jumio backend → retry with exponential backoff; if persistent, fail-closed for SOC orders.
- Customer using an unsupported document subtype (e.g., a regional/territorial ID not in the 5,000-doc catalog).
- Genuine document with damaged MRZ, glare, or low-light capture causing `ERROR_NOT_READABLE_ID`.
- NFC unavailable on customer device (no NFC, iOS pre-iOS 13, etc.) — chip path silently degrades to OCR-only; reviewer must know whether NFC was attempted.
- Liveness Premium not enabled on the account → injection attacks (camera emulators, deepfake feeds) more likely to slip through; vendor reported 88% YoY rise in injection attempts and 9x surge in 2024 [source](https://www.jumio.com/about/press-releases/injection-attacks-next-major-threat/) [source](https://www.helpnetsecurity.com/2025/06/18/jumio-liveness-premium/).
- Webhook callback delivery failure → fall back to Retrieval API polling.
- Customer cancels mid-flow (closed browser tab) — transaction left in NO_ID_UPLOADED.

## false_positive_qualitative

Legitimate-customer cases where Jumio would incorrectly trip the M14 evidence-match gate:

- Researchers from countries whose national IDs are outside Jumio's supported subtype list (some African and Central Asian states, some sub-national IDs).
- Customers whose legal name on the ID is in a non-Latin script and the synthesis provider's account record uses a romanized form — `idFirstName`/`idLastName` mismatch flagged as NO_MATCH against account profile even though the human is the same person.
- Recent name changes (marriage, gender marker update) where the ID lags the account record.
- Older customers, customers with strong facial occlusions (medical masks for clinical reasons, religious head coverings), and customers with significant age gap between the ID portrait and current face — known to depress face-match similarity scores in vendor benchmarks.
- Low-bandwidth or low-end-device customers triggering capture-quality failures.

## record_left

For each invocation: Jumio `scanReference` / transaction ID, the structured JSON callback payload, the captured document image and selfie URLs (retention window: vendor default ~30 days unless customer extends), the human reviewer's decision and notes from the synthesis provider's case-management system, and the final SOC-order disposition. Auditable artifact suitable for regulator review under the proposed M14 SOP.

## bypass_methods_known / uncovered

(Stage 5 will populate. Known active threats from the attacker mapping that Jumio can resist: presentation-attack deepfakes vs. Liveness Premium, low-quality forged documents vs. document authenticity checks, NFC-supported passports vs. chip read. Threats Jumio cannot resist: injection attacks against weak SDK builds, fronted-accomplice with real ID, ATO that inherits prior IAL2 if the integrator does not re-trigger at order time.)

---

## Sources

- https://www.jumio.com/products/identity-verification/
- https://documentation.jumio.ai
- https://github.com/Jumio/implementation-guides/blob/master/netverify/fastfill-api.md
- https://github.com/alindogandev/jumio-implementation-guides/blob/master/netverify/netverify-web-v4.md
- https://documentation.jumio.ai/docs/Integrate/netVerifyv2/idVerification/callbackIDVerification
- https://documentation.jumio.ai/docs/Integrate/netVerifyv2/upgrading-from-netverify
- https://www.jumio.com/privacy-center/security/
- https://hyperverge.co/blog/jumio-pricing/
- https://www.jumio.com/about/press-releases/injection-attacks-next-major-threat/
- https://www.helpnetsecurity.com/2025/06/18/jumio-liveness-premium/
