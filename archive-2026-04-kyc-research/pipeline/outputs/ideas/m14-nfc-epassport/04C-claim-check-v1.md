# 04C claim-check v1 — m14-nfc-epassport

## Verified

- **ICAO PKD registration fee USD 56,000 → USD 15,900 in March 2015.** Wikipedia article on the ICAO PKD reproduces this figure; the ICAO PKD Regulations PDF on icao.int is the canonical source. PASS.
- **104 participants in the ICAO PKD as of April 2025.** Wikipedia article. PASS-with-stale-risk (the count grows quarterly).
- **PKD content open to public, downloadable from `https://download.pkd.icao.int/`.** ICAO PKD page and ICAO FAQ confirm. PASS.
- **Onfido iOS SDK NFC default-enabled from v29.1.0; Android v18.1.0.** Confirmed by the Onfido NFC for Document report guide page on documentation.identity.entrust.com. PASS.
- **NFC requires iPhone 7+ on iOS 13+ for CoreNFC.** Standard Apple platform requirement; not directly cited in v1, but this is widely documented and not vendor-specific. PASS.
- **Passive Authentication proves issuer signature but cannot detect chip cloning; Active Authentication / Chip Authentication required for cloning detection; both AA/CA optional per issuing state.** Confirmed by Signicat, Inverid, and the ICAO 9303 standard. PASS.
- **Cloning real-world cases (cloned chip data with replaced photo).** Inverid blog and academic literature describe these cases. PASS.

## Flags

- **MISSING-CITATION (minor):** v1 mentions "Calderoni 2014 active-authentication bypass" in the bypass_methods note but the actual paper is not cited with a URL. Suggested fix: cite the ResearchGate page or DOI: `https://www.researchgate.net/publication/261371280_Cloning_and_tampering_threats_in_e-Passports`.
- **OVERSTATED (minor):** v1 says "DG3 fingerprints only if EAC enforced and inspection system has Document Verifier rights — typically NOT available to commercial IDV." This is correct; commercial IDV does not get DG3 access. No fix.
- **UPGRADE-SUGGESTED:** Jumio and Veriff specific SDK NFC version gates `[unknown ...]` — the queries listed are reasonable but adding `site:documentation.jumio.ai NFC` and `site:developers.veriff.com NFC` could yield direct hits.
- **MINOR:** v1 hedges that "some vendors charge a small premium when NFC succeeds." This is `[best guess]` and acceptable, but if Onfido or Jumio publishes NFC pricing the claim could be tightened.

## Verdict

REVISE-OPTIONAL — all critical claims hold. Salvageable as v1.
