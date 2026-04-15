# Coverage research: ICAO 9303 ePassport NFC chip read with PKD validation

## Coverage gaps

### Gap 1: Customers without a biometric ePassport
- **Category:** Legitimate researchers who do not hold an ICAO Doc 9303-compliant biometric passport — either because (a) their country has not yet issued ePassports, (b) they hold an older non-chipped passport that is still valid, (c) they hold only a national ID card or driver's license with no NFC chip, or (d) they travel on refugee travel documents or emergency documents that lack chips.
- **Estimated size:** 180 countries now issue ePassports [source](https://www.signicat.com/blog/which-countries-have-epassports), covering nearly all ICAO member states. However, many individuals hold older pre-chip passports that remain valid (10-year validity means passports issued before a country adopted ePassports are still in circulation). Additionally, some customers prefer to use national ID cards or driver's licenses rather than passports for IDV. [best guess: 10–20% of DNA synthesis customers globally either lack an ePassport or would need to use a non-passport document. Reasoning: most OECD-country researchers have ePassports; the tail is older passports, non-passport-only users, and researchers from the ~13 countries that have not yet adopted ePassports.]
- **Behavior of the check on this category:** no-signal — the NFC chip read cannot be attempted; falls back to OCR-only document verification (lower assurance)
- **Reasoning:** This is a degradation gap, not a hard exclusion — the vendor IDV (Jumio/Onfido) still processes the document via OCR, but without the cryptographic assurance of PA. The security benefit of NFC is lost for this population.

### Gap 2: Customers whose devices lack NFC capability
- **Category:** Researchers whose mobile device does not support NFC (older Android phones, iPhones prior to iPhone 7, or desktop-only users who do not have a mobile device available during the IDV flow).
- **Estimated size:** Over 94% of smartphones now have NFC capability [source](https://electroiq.com/stats/nfc-payment-statistics/). iPhone 7+ (2016) and most Android devices since ~2015 support NFC. However, desktop-only users and researchers with older devices still exist. [best guess: 5–10% of synthesis customers attempting an IDV flow would be unable to complete an NFC tap. Reasoning: the 6% without NFC phones, plus desktop-only users who order from lab workstations without a phone at hand. Academic researchers frequently place orders from shared desktops.]
- **Behavior of the check on this category:** no-signal — vendor SDK silently degrades to OCR-only
- **Reasoning:** Same as Gap 1 — the NFC layer simply does not fire. The key risk is that the synthesis provider may not even know NFC was unavailable unless they explicitly log the `nfc_unavailable` flag.

### Gap 3: ePassports from non-PKD-participating countries
- **Category:** Researchers holding ePassports from countries that issue chipped passports but are NOT participants in the ICAO PKD — meaning the chip can be read, but Passive Authentication cannot be completed because the country's CSCA certificates are not in the PKD.
- **Estimated size:** 107 of 193 ICAO member states participate in the PKD [source](https://en.wikipedia.org/wiki/International_Civil_Aviation_Organization_Public_Key_Directory). That means ~86 states' ePassports cannot be PA-validated via the PKD. However, some vendors maintain bilateral CSCA exchanges outside the PKD. [best guess: 5–15% of synthesis customers hold ePassports from non-PKD-participating countries. Reasoning: most major synthesis-customer countries (US, EU, Japan, South Korea, Australia, Canada) are PKD participants; the gap is primarily researchers from smaller non-participating states.]
- **Behavior of the check on this category:** weak-signal — chip can be read and data extracted, but PA cannot confirm the data is signed by the issuing authority. The vendor may report `pa_inconclusive` or silently treat it as OCR-equivalent.
- **Reasoning:** This is a meaningful degradation. Without PA, the NFC read provides the same data as OCR but with no cryptographic assurance — a sophisticated forger could clone chip data from a legitimate passport.

### Gap 4: ePassports with PA-only (no Active Authentication or Chip Authentication)
- **Category:** Customers whose ePassport implements only Passive Authentication, without Active Authentication (AA) or Chip Authentication (CA/EAC). PA proves the data on the chip was signed by the issuer, but does NOT prove the chip is the original (cloning is mathematically possible against PA-only chips).
- **Estimated size:** [unknown — searched for: "percentage ePassports active authentication implemented", "how many countries implement chip authentication EAC ePassport", "AA CA implementation rate ePassport countries"]. The 04-implementation-v1.md notes US passports prior to 2007 lack AA. Many countries implement only PA. [best guess: 30–50% of ePassports in circulation are PA-only without AA or CA. Reasoning: AA/CA are optional in ICAO 9303; many states — especially those that adopted ePassports early — did not implement them. The first-generation spec (2006) only mandated PA.]
- **Behavior of the check on this category:** weak-signal — PA confirms data integrity but does not prove chip uniqueness. A sophisticated attacker with physical access to a legitimate passport could clone the chip data onto a new chip.
- **Reasoning:** This is a known academic attack vector. Inverid and Calderoni (2014) document it. For DNA synthesis screening, the practical risk is low (cloning an ePassport chip is non-trivial), but the security guarantee is weaker than the full AA/CA chain.

### Gap 5: NFC tap UX failures (device positioning, shielded chips, damaged chips)
- **Category:** Customers whose ePassport chip is present and device supports NFC, but the tap fails due to (a) incorrect phone positioning relative to the chip, (b) metallic passport covers or RFID-shielding sleeves, (c) physically damaged chips, or (d) iOS NFC permission not granted.
- **Estimated size:** [best guess: 10–20% first-attempt NFC tap failure rate. Reasoning: NFC passport reading requires precise positioning (chip location varies by passport design); user error is common; vendor SDKs report retry prompts. Most users succeed on retry, so the persistent failure rate is lower — perhaps 3–5%.]
- **Behavior of the check on this category:** no-signal on first attempt; most resolve on retry
- **Reasoning:** This is a UX friction gap, not a structural coverage gap. The vendor SDK should guide the user through retries. Persistent failures degrade to OCR-only.

### Gap 6: Customers using national ID cards without NFC chips (US driver's licenses, most non-EU IDs)
- **Category:** Customers who present a national ID card or driver's license instead of a passport. Only EU eID cards (German nPA, Italian CIE, etc.) have NFC chips; US driver's licenses, most Asian ID cards, and most developing-country ID cards do not.
- **Estimated size:** [best guess: 15–25% of synthesis-customer IDV attempts use a national ID card or driver's license rather than a passport. Reasoning: many US customers prefer to use their driver's license for IDV; international customers may prefer national ID cards. None of these have NFC chips (except some EU eIDs).]
- **Behavior of the check on this category:** no-signal — NFC cannot be attempted on non-chipped documents
- **Reasoning:** Same degradation as Gap 1 — falls back to OCR-only. The synthesis provider must communicate that NFC benefits require a passport.

## Refined false-positive qualitative

NFC chip reading is primarily a signal-enhancer layered on top of vendor IDV, not a standalone check. Its "false positive" profile is limited to cases where NFC produces a misleading signal:

1. **PA failure due to PKD desynchronization** — vendor has stale CSCA/CRL data; legitimate passport fails PA spuriously. Impact: hard-deny on a genuine passport. Frequency: rare if vendor refreshes daily.
2. **DG2 chip portrait vs. aged selfie mismatch** — the chip stores the portrait from issuance; if the customer has aged significantly, face-match may fail between chip portrait and live selfie. Same issue as Jumio Gap 3 but amplified because the chip portrait is the canonical reference.
3. **MRZ data (DG1) vs. account record mismatch** — same non-Latin-script / name-change issues as Jumio Gap 2/5.
4. **Damaged or partially read chip** — intermittent read produces corrupt data flagged as suspicious.

## Notes for stage 7 synthesis

- NFC ePassport reading is NOT a standalone check — it is a layer within a vendor IDV flow (Jumio/Onfido/Persona/Veriff/Inverid). Its coverage gaps compound with the vendor's own gaps.
- The coverage benefit is significant for the ~60–80% of customers who have an ePassport + NFC device + PKD-participating country: for them, NFC provides the highest-assurance remote document check available.
- The 30–50% of ePassports with PA-only (no AA/CA) remain vulnerable to chip cloning in theory, though this is a sophisticated attack.
- The synthesis provider should track `nfc_attempted` vs. `nfc_succeeded` metrics to understand what fraction of their customer base actually benefits from this layer.
- Pairing NFC with face-match against the DG2 chip portrait (not the VIZ portrait) is the key security win — it prevents visual-layer tampering.
