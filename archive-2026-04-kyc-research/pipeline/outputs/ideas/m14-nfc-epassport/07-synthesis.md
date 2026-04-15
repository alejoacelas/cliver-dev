# Per-idea synthesis: m14-nfc-epassport

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | ICAO 9303 ePassport NFC chip read with PKD validation |
| **measure** | M14 — identity-evidence-match |
| **attacker_stories_addressed** | credential-compromise (Branch A — fraudulent-doc paths fail PA), account-hijack (Branch C — face morph on chip portrait fails PA since chip portrait is signed), dormant-account-takeover (Branch D — chip-bound portrait prevents morphing), dormant-domain (Branch A — forged passports cannot produce valid CSCA-signed chip). |
| **summary** | Read the contactless chip embedded in an ICAO Doc 9303-compliant biometric passport via mobile NFC, perform Passive Authentication (PA) against the ICAO Public Key Directory, and where supported perform Active Authentication (AA) or Chip Authentication (CA/EAC) to detect cloned chips. The result is a cryptographically signed copy of the MRZ data (DG1), facial portrait (DG2), and optionally fingerprints (DG3, EAC-gated), bound to the issuing authority's CSCA certificate. Used as a layer within a Jumio/Onfido/Persona/Veriff/Inverid IDV flow, not as a standalone integration. Highest-assurance remote documentary check available. |
| **external_dependencies** | ICAO Public Key Directory (CSCAs + CRLs for participating states; free public download); vendor SDK with NFC support (Onfido v29.1.0+ iOS / v18.1.0+ Android, Jumio, Veriff, Inverid ReadID, Regula, IDEMIA); customer device with NFC (iPhone 7+ iOS 13+, Android 4.4+ with NFC hardware); synthesis-provider account profile for chip-claim comparison. |
| **endpoint_details** | No standalone ICAO PKD API — PKD is a download repository at `download.pkd.icao.int` with CSCA Master List, Defect List, and CRLs. Free public download; issuer participation fee USD 15,900 (reduced from USD 56,000 in March 2015). 104 PKD participants as of April 2025. Integration via vendor IDV SDK that bundles PKD validation. Auth model: vendor-SDK level (API key/secret). PKD content unauthenticated. Rate limits: none for PKD; vendor SDK inherits parent vendor quota. Pricing: PKD = $0; NFC typically bundled with vendor Document report, not separately metered [best guess: incremental $0–$0.50 per report when NFC succeeds]. Inverid ReadID: [vendor-gated]. |
| **fields_returned** | LDS Data Groups: DG1 (MRZ: document type, issuing state, name, doc number, nationality, DOB, sex, expiry, check digits), DG2 (facial image JPEG/JP2), DG3 (fingerprints, EAC-gated — typically unavailable to commercial IDV), DG11 (full name, place of birth, address), DG12 (issuing authority, issuance dates), DG14 (CA public key), DG15 (AA public key), SOD (Document Security Object: hashes of all DGs, signed by DSC chaining to CSCA). Authentication results: `passive_authentication` (pass/fail), `active_authentication` (pass/fail/not_supported), `chip_authentication` (pass/fail/not_supported), `csca_country`, `dsc_validity_period`. |
| **marginal_cost_per_check** | PKD: $0 marginal. Vendor SDK with NFC: [best guess: incremental $0–$0.50 per Document report]. Total per-check cost dominated by parent IDV product, not NFC. Inverid ReadID: [vendor-gated]. **setup_cost:** Standard vendor SDK integration (a few engineering weeks); no incremental setup beyond parent IDV. |
| **manual_review_handoff** | Seven-step playbook: (1) Chip not read (NFC tap failed, not chipped, device unsupported) — request re-tap, fall back to OCR-only, mark `nfc_unavailable`. (2) PA failed (CSCA chain invalid) — hard-deny, freeze account, escalate (strong fraud signal). (3) PA passed but DG2 does not match selfie — hard-deny + escalate. (4) PA passed but DG2 does not match document VIZ portrait — visual tampering suspected, escalate. (5) PA passed, AA/CA not_supported — lower confidence, combine with other signals before clearing. (6) PA passed, AA/CA failed — cloning signal, hard-deny. (7) DG1 MRZ inconsistent with account profile — clarification + compliance review. |
| **flags_thrown** | `nfc_unavailable` (degrade to OCR), `nfc_pa_failed` (hard-deny + escalate), `nfc_aa_failed` (hard-deny, cloning signal), `nfc_ca_failed` (hard-deny), `nfc_dsc_revoked` (hard-deny + escalate), `nfc_chip_face_mismatch` (hard-deny + escalate), `nfc_dg2_viz_mismatch` (hard-deny + escalate). |
| **failure_modes_requiring_review** | ICAO PKD desynchronization at vendor side (spurious PA failures); devices without NFC (silent degrade to OCR); iOS NFC tap UX failures; country-specific chip interoperability quirks (US pre-2007 passports lack AA; some African states use older chip OS); ePassport cloning against PA-only chips (no AA/CA); BAC vs PACE handshake variance. |
| **false_positive_qualitative** | (1) PA failure from stale PKD data — hard-deny on genuine passport; rare if vendor refreshes daily. (2) DG2 chip portrait vs. aged selfie mismatch — chip stores issuance portrait; significant aging causes face-match failure. (3) DG1 MRZ vs. account record mismatch — non-Latin-script and name-change issues. (4) Damaged or partially read chip — intermittent read produces corrupt data flagged as suspicious. |
| **coverage_gaps** | (1) No ePassport: ~10–20% of customers lack an ePassport or prefer non-passport documents. (2) No NFC device: ~5–10% unable to complete NFC tap (older phones, desktop-only users). (3) Non-PKD-participating countries: ~5–15% of customers hold ePassports from ~86 non-participating states, preventing PA validation. (4) PA-only chips (no AA/CA): [best guess: 30–50% of ePassports in circulation]; vulnerable to chip cloning in theory. (5) NFC tap UX failures: ~10–20% first-attempt failure, ~3–5% persistent. (6) Non-chipped ID documents (US driver's licenses, most non-EU IDs): ~15–25% of IDV attempts use these. |
| **record_left** | Per invocation: chip read transaction ID, LDS data groups extracted (or hashes), SOD, CSCA chain validation result, DSC serial, PA/AA/CA pass/fail flags, timestamp, device fingerprint. Packaged inside vendor Document report payload. Demonstrably the highest-assurance remote documentary check available. |
| **bypass_methods_known** | Face morphing on document visual page (CAUGHT — chip portrait is cryptographic ground truth), fraudulent govt ID / forged document (CAUGHT — PA fails), shared-account predecessor mismatch with re-proofing (CAUGHT), email-only ordering (CAUGHT if NFC IDV required). Deepfake injection (AMBIGUOUS — targets selfie layer, not chip), injection against SDK (AMBIGUOUS — orthogonal), chip cloning on PA-only passports (AMBIGUOUS). |
| **bypass_methods_uncovered** | All liveness/injection/presentation attacks (orthogonal — NFC is document-authenticity layer); IDV-session handoff; ATO inherits prior IAL2; social-engineer support; chip cloning on PA-only passports; fresh real accomplice with real ePassport (structural); same-person multi-persona; real passport throughout (structural). |

---

## Section 2: Narrative

### What this check is and how it works

NFC ePassport chip reading is a document-authenticity verification layer that reads the contactless chip embedded in ICAO Doc 9303-compliant biometric passports. When the customer holds their phone against their passport, the NFC reader extracts the chip's data groups — MRZ data (DG1), a facial portrait (DG2), and optional biometric data — along with a Document Security Object (SOD) containing cryptographic hashes signed by the issuing state's Document Signer Certificate. The system performs Passive Authentication by validating the DSC's chain to the issuing state's Country Signing Certificate Authority (CSCA) via the ICAO Public Key Directory, confirming the data was signed by the government and has not been tampered with. Where the issuing state supports it, Active Authentication or Chip Authentication further proves the chip is the original (not cloned). This is implemented as a layer within a vendor IDV flow (Jumio, Onfido, Persona, Veriff, or Inverid ReadID), not as a standalone integration. The synthesis provider enables NFC in the vendor SDK, and the chip read result becomes part of the Document report.

### What it catches

NFC chip reading's unique contribution is defeating document fraud and face morphing. A forged government document without a valid CSCA-signed chip fails Passive Authentication outright. A passport where the visual portrait has been replaced with a morph but the chip retains the original portrait triggers the `nfc_dg2_viz_mismatch` flag — the chip portrait is the cryptographic ground truth that cannot be altered without invalidating the CSCA signature. This directly addresses the face-morphing bypass documented in the credential-compromise, account-hijack, and dormant-account-takeover attacker branches. Additionally, the signed chip portrait (DG2) provides a trusted reference face for the biometric-match component, strengthening the selfie comparison by ensuring the reference is authentic.

### What it misses

NFC is a document-authenticity layer, not a liveness or biometric-binding layer. It does not detect deepfake injection, presentation attacks (masks, printouts), or camera-emulator injection — all of which target the selfie/liveness component, not the document. Session-handoff attacks succeed because NFC verifies the document is genuine but not that the same person presenting the document completed liveness. ATO that inherits a prior IAL2 pass is missed unless re-proofing is triggered. Chip cloning against PA-only passports (estimated 30–50% of ePassports in circulation) remains a theoretical vulnerability, though practically non-trivial. The standard structural gaps apply: fronted-accomplice with a real ePassport, same-person multi-persona, and real-ID-throughout all pass natively.

### What it costs

The ICAO PKD is free to download. NFC within a vendor IDV flow is typically bundled with the Document report rather than separately metered, with an estimated incremental cost of $0–$0.50 per check. The total per-check cost is dominated by the parent IDV product (Jumio, Onfido, etc.), not the NFC layer. Setup cost is limited to enabling NFC in the vendor SDK configuration — a few engineering hours beyond the parent IDV integration. Inverid ReadID, a standalone enterprise NFC product, has vendor-gated pricing that requires a sales conversation.

### Operational realism

The main operational challenge is that NFC coverage is incomplete: an estimated 10–20% of customers lack an ePassport, 5–10% lack an NFC-capable device, 15–25% attempt IDV with a non-chipped document (driver's license, national ID), and 5–15% hold ePassports from non-PKD-participating countries. When NFC is unavailable, the vendor SDK silently degrades to OCR-only — and the implementation does not specify whether the provider should hard-require NFC for SOC orders or accept the degraded path. The synthesis provider should track `nfc_attempted` vs. `nfc_succeeded` metrics to understand what fraction of customers actually benefits. First-attempt NFC tap failures (~10–20%) are common due to phone positioning; most resolve on retry, leaving a persistent failure rate of ~3–5%. Each successful chip read produces the most forensically complete audit record available remotely: the full LDS data, the SOD, and the PA/AA/CA validation results.

### Open questions

The implementation does not specify an NFC-enforcement policy for SOC orders: whether to hard-require NFC (rejecting non-NFC attempts) or accept OCR with downgraded assurance. The proportion of ePassports with AA/CA support is unknown (searched for but not found); the 30–50% PA-only estimate is a best guess. Jumio and Veriff NFC SDK version gates are unknown (3-query searches each returned no specific documentation). Whether the synthesis provider should treat PA-only passports differently from PA+AA/CA passports in the SOC order risk assessment is not specified.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 passed with no Critical flags.
- **Moderate finding M1 (silent NFC degradation):** The vendor SDK silently falls back to OCR-only when NFC is unavailable. The provider must define an explicit NFC-enforcement policy for SOC orders: hard-require NFC (customer must use NFC device with ePassport) or accept OCR fallback with downgraded assurance and compensating controls.
- **Moderate finding M2 (PA-only chip cloning):** ~30–50% of ePassports lack AA/CA, making them theoretically vulnerable to chip cloning. Practical risk is low but the security guarantee is weaker. Provider should apply compensating controls (document age check, visual inspection) for PA-only passports.
- **Moderate finding M3 (fronted-accomplice structural gap):** NFC proves "this document is genuine," not "this person is not an accomplice." Cross-measure mitigation needed.
- **[unknown] fields:**
  - Jumio NFC SDK version gate (3-query search).
  - Veriff NFC SDK documentation (3-query search).
  - Proportion of ePassports implementing AA/CA vs. PA-only (3-query search; 30–50% PA-only is best guess).
  - NFC first-attempt tap failure rate (best guess 10–20%, persistent 3–5%).
- **[vendor-gated] fields:**
  - Inverid ReadID pricing.
  - Incremental NFC line-item pricing from Jumio/Onfido/Veriff.
- **[best guess] fields requiring validation:**
  - 10–20% of customers without ePassport.
  - 5–15% of customers from non-PKD-participating countries.
  - 30–50% of ePassports with PA-only.
  - 15–25% of IDV attempts using non-chipped documents.
- **Missing citation (flagged by 04C):** Calderoni 2014 active-authentication bypass paper — referenced but not cited with URL or DOI. Should cite `https://www.researchgate.net/publication/261371280`.
