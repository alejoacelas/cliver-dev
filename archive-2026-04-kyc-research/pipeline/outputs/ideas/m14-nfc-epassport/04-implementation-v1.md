# m14-nfc-epassport — Implementation research v1

- **measure:** M14 — identity-evidence-match
- **name:** ICAO 9303 ePassport NFC chip read with PKD validation (via vendor SDK)
- **modes:** D

## summary

Read the contactless chip embedded in an ICAO Doc 9303-compliant biometric passport via the customer's mobile device NFC, perform Passive Authentication (PA) against the ICAO Public Key Directory (PKD), and — where supported by the issuing state — also Active Authentication (AA) or Chip Authentication (CA, EAC) to detect cloned chips. Result is the highest-assurance documentary identity check available remotely: a cryptographically signed copy of the data groups (DG1 = MRZ, DG2 = facial portrait, optional DG3 fingerprints) bound to the issuing authority's CSCA certificate. Used as a layer inside a Jumio / Onfido / Persona / Veriff / Inverid (ReadID) IDV flow rather than as a standalone integration.

## attacker_stories_addressed

- credential-compromise (Branch A) — fraudulent-doc paths fail PA
- account-hijack (Branch C) — face morph on the chip portrait fails PA (chip portrait is signed)
- dormant-account-takeover (Branch D) — chip-bound portrait makes morphing harder
- dormant-domain (Branch A) — forged passports cannot produce a valid CSCA-signed chip

NFC chip read does NOT address: fronted-accomplice branches (real chip, real face), genuine cloned chips that pass PA but no AA (issuer dependent), customers without an ePassport, or stolen-then-altered passport books where the chip is intact but the visual layer was tampered with.

## external_dependencies

- ICAO Public Key Directory (PKD) — Country Signing Certificate Authorities (CSCAs) and CRLs for participating states [source](https://www.icao.int/icao-pkd) [source](https://en.wikipedia.org/wiki/International_Civil_Aviation_Organization_Public_Key_Directory)
- A vendor SDK with NFC support (Onfido v29.1.0+ iOS / v18.1.0+ Android, Jumio, Veriff, Inverid ReadID, Regula, IDEMIA, ComplyCube, Innovatrics) — none of the major synthesis-tier vendors provide a generic NFC primitive without bundling identity proofing
- Customer device with NFC: iPhone 7+ on iOS 13+ (CoreNFC + NDEF/ISO7816), Android 4.4+ with NFC hardware
- Synthesis-provider account profile to compare chip claims against

## endpoint_details

- **No standalone "ICAO PKD API"** for IDV. The PKD itself is a download repository at `https://download.pkd.icao.int/` with the CSCA Master List, Defect List, and CRLs. Free public download; participation as an issuer requires a one-time registration fee of USD 15,900 (reduced from USD 56,000 in March 2015) plus annual fees [source](https://www.icao.int/sites/default/files/2025-06/ICAO-PKD-Regulations_Version_July2020.pdf).
- **Membership status:** As of April 2025, 104 participants in the ICAO PKD [source](https://en.wikipedia.org/wiki/International_Civil_Aviation_Organization_Public_Key_Directory).
- **Integration pattern:** the synthesis provider integrates a vendor IDV SDK that bundles PKD validation. The relevant integration surfaces are:
  - Onfido NFC for Document report — enabled by default in iOS SDK ≥ v29.1.0 and Android SDK ≥ v18.1.0; offered automatically when both document and device support NFC [source](https://documentation.identity.entrust.com/guide/document-report-nfc).
  - Jumio NFC — supported within Jumio ID Verification when chip is present; specific SDK version gate is `[unknown — searched for: "Jumio NFC SDK version", "Jumio ePassport chip read", "Jumio NFC supported devices"]`.
  - Veriff NFC — supported; specific docs `[unknown — searched for: "Veriff NFC SDK", "Veriff ePassport chip", "Veriff NFC documentation"]`.
  - Inverid ReadID — pure NFC chip-read product, white-label, used by border/banking; commonly cited as the deepest NFC implementation [source](https://www.inverid.com/blog/authenticity-electronic-passports).
- **Auth model:** vendor-SDK level (API key/secret, region-pinned). PKD content itself is unauthenticated public download.
- **Rate limits:** PKD downloads — none documented (full download is ~hundreds of MB; refreshed every 24h). Vendor SDK rate limits inherit from the parent IDV vendor's quota.
- **Pricing:** PKD itself is free for download. Vendor IDV pricing inherits from the parent product (Onfido/Jumio/Persona/Veriff/Inverid). NFC is typically a flag on the Document report rather than a separately metered product. [vendor-gated — incremental NFC line-item pricing not published; would require sales contact.]
- **ToS:** ICAO PKD content open to public; using it for commercial KYC is permitted by ICAO regulations.

## fields_returned

From a successful chip read with PA (and optional AA/CA):

**LDS Data Groups:**
- DG1 — MRZ data: document type, issuing state, surname, given names, document number, nationality, date of birth, sex, date of expiry, optional data, composite check digit
- DG2 — encoded facial image (JPEG / JP2), used as the canonical biometric for face match against a live selfie
- DG3 — encoded fingerprints (only if EAC enforced and inspection system has Document Verifier rights — typically NOT available to commercial IDV)
- DG4 — iris (rare; same EAC gate as DG3)
- DG11 — additional personal details (full name, place of birth, address)
- DG12 — additional document details (issuing authority, dates of issuance)
- DG14 — security info (Chip Authentication public key)
- DG15 — Active Authentication public key (if AA implemented)
- SOD — Document Security Object: hashes of all data groups, signed by the Document Signer Certificate (DSC), which chains to the CSCA in the PKD

**Authentication results:**
- `passive_authentication` — pass / fail (CSCA chain valid, hashes match, no revoked DSC)
- `active_authentication` — pass / fail / not_supported (proves chip private key exists; defeats simple cloning if implemented)
- `chip_authentication` — pass / fail / not_supported (EAC; same purpose, more modern)
- `cscca_country` — issuing CSCA identity
- `dsc_validity_period`

[source](https://www.signicat.com/blog/overview-security-mechanisms-in-epassports) [source](https://regulaforensics.com/blog/rfid-chip-logical-data-structure/) [source](https://www.inverid.com/blog/authenticity-electronic-passports)

## marginal_cost_per_check

- **PKD:** $0 marginal (free download); amortized cost of one-time PKD-syncing infrastructure is negligible.
- **Vendor SDK with NFC enabled:** [best guess: incremental $0–$0.50 per Document report when NFC is included as a workflow step. Reasoning: vendor-comparison blogs (BeVerified, ComplyCube) describe NFC as bundled with Document report rather than separately priced; some vendors charge a small premium when NFC succeeds because it materially upgrades assurance.] Total per-check cost is dominated by the parent IDV product, not NFC itself.
- **Inverid ReadID:** [vendor-gated — Inverid is an enterprise-tier white-label NFC product; pricing not publicly listed; would require sales contact.]
- **setup_cost:** Integrating a new IDV vendor with NFC requires standard SDK integration (a few engineering weeks). No incremental setup cost beyond the parent IDV.

## manual_review_handoff

When the chip read fails or returns inconsistent results:

1. **Chip not read at all** (NFC tap failed, document not chipped, device unsupported, OS too old): not necessarily fraud — request a re-tap with clearer instructions, fall back to OCR-only Document report, and mark `nfc_unavailable` so reviewers know NFC was attempted but degraded.
2. **PA failed (CSCA chain invalid):** strong fraud signal — issuing-state CSCA does not validate the chip's DSC. Hard-deny the SOC order, freeze the customer account, escalate to compliance.
3. **PA passed but DG2 (chip facial portrait) does NOT match selfie liveness:** strong fraud signal — chip data is genuine but the human presenting it is not the holder. Hard-deny + escalate.
4. **PA passed but DG2 matches a face that does NOT match the document VIZ portrait visible on the printed page:** suggests the visible portrait was tampered with (sticker, replacement); escalate to compliance.
5. **PA passed and AA/CA `not_supported`:** issuing state did not implement clone detection. Lower confidence; combine with other signals (issue date, recent travel patterns, document age) before clearing.
6. **PA passed, AA/CA failed:** strong cloning signal. Hard-deny.
7. **MRZ data (DG1) inconsistent with synthesis-provider account profile:** clarification + compliance review (could be name change, transliteration, or impersonation).

## flags_thrown

- `nfc_unavailable` — chip not read; document non-chipped or device unsupported. Action: degrade to OCR; reviewer notes.
- `nfc_pa_failed` — Passive Authentication failure. Action: hard-deny + escalate (strong fraud signal).
- `nfc_aa_failed` — Active Authentication failure where AA is implemented. Action: hard-deny (cloning signal).
- `nfc_ca_failed` — Chip Authentication failure where EAC implemented. Action: hard-deny.
- `nfc_dsc_revoked` — DSC appears in PKD CRL. Action: hard-deny + escalate.
- `nfc_chip_face_mismatch` — DG2 portrait does not match live selfie. Action: hard-deny + escalate.
- `nfc_dg2_viz_mismatch` — chip portrait does not match printed VIZ portrait. Action: hard-deny + escalate.

## failure_modes_requiring_review

- ICAO PKD desynchronization at the vendor SDK side → spurious PA failures; vendor must refresh CSCA Master List daily.
- Devices without NFC (older Android, iPhones < 7) → silent degrade to OCR.
- iOS NFC tap UX failures (user holds phone wrong, chip in wrong position) → false `nfc_unavailable`.
- Certain countries' chip implementations have known interoperability quirks (US passports prior to 2007 don't have AA; some African states use older chip OS).
- ePassport cloning is mathematically possible against chips that implement only PA (no AA/CA) — passive auth proves data is signed by the issuer, not that the chip is the original [source](https://www.inverid.com/blog/cloning-detection-identity-documents).
- BAC vs PACE handshake variance — older chips use BAC (weak), newer use PACE; vendor SDK must handle both.

## false_positive_qualitative

- Customers from countries that issue non-electronic passports (a shrinking but still nonzero set, especially refugee travel documents and emergency travel documents).
- Customers using national ID cards or driver's licenses instead of passports — only NFC-chipped ID cards (EU eIDs, German nPA, Italian CIE) read; US driver's licenses don't.
- Older devices without NFC — disproportionately affects researchers in low-income contexts.
- iOS users who don't enable NFC permission for the app.
- Damaged or shielded chip (rare but happens).
- Some legitimate older passports (<2007) where AA is not implemented and PA alone is the only attestation — these would be flagged as lower-confidence rather than false-positive, but the policy decision matters.

## record_left

For each invocation: chip read transaction ID, the LDS data groups extracted (or hashes thereof), the SOD, the CSCA chain validation result, the DSC serial, the PA/AA/CA pass/fail flags, the timestamp of the read, and the device fingerprint (model, OS, NFC capability). The vendor IDV product packages this inside its Document report payload. Auditable artifact suitable for regulator review and demonstrably the highest-assurance documentary check available.

## bypass_methods_known / uncovered

(Stage 5. Inverid and academic literature [Calderoni 2014] document AA bypass on first-generation chips and full chip cloning that defeats PA-only checks. Cannot resist fronted-accomplice with their own real ePassport. Cannot help customers who lack an ePassport.)

---

## Sources

- https://www.icao.int/icao-pkd
- https://www.icao.int/icao-pkd/epassport-validation
- https://www.icao.int/icao-pkd/epassport-validation-roadmap-tool-system-requirements
- https://www.icao.int/sites/default/files/2025-06/ICAO-PKD-Regulations_Version_July2020.pdf
- https://en.wikipedia.org/wiki/International_Civil_Aviation_Organization_Public_Key_Directory
- https://www.signicat.com/blog/overview-security-mechanisms-in-epassports
- https://www.inverid.com/blog/overview-security-mechanisms-epassports
- https://www.inverid.com/blog/authenticity-electronic-passports
- https://www.inverid.com/blog/cloning-detection-identity-documents
- https://regulaforensics.com/blog/rfid-chip-logical-data-structure/
- https://documentation.identity.entrust.com/guide/document-report-nfc
- https://documentation.onfido.com/sdk/ios/
- https://github.com/onfido/onfido-android-sdk
- https://beverified.org/publications/nfc-enabled-passports-what-compliance-teams-need-to-know/
