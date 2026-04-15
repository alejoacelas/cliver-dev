# m14-nfc-epassport

- **measure:** M14
- **name:** NFC ePassport chip read (ICAO PKD)
- **modes:** D
- **summary:** Read the ICAO 9303 ePassport chip via mobile NFC; verify document signing certificate against the ICAO PKD. Highest-assurance document check.
- **attacker_stories_addressed:** document-fraud, synthetic-identity
- **external_dependencies:** Vendor SDK (Jumio / Onfido / Veriff support); ICAO PKD.
- **flags_thrown:** nfc_chip_failed; pkd_cert_invalid
- **manual_review_handoff:** Reviewer reviews failures.
- **failure_modes_requiring_review:** Requires NFC-capable device.
- **record_left:** Chip read result.
