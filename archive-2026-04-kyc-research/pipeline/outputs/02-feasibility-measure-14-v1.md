# Stage 2 Feasibility Check — Measure 14 v1

Reviewing `01-ideation-measure-14-v1.md` against the concreteness and relevance gates.

## Per-idea verdicts

1. **Jumio KYX** — PASS. Named vendor, named product, IAL2 alignment is publicly claimed; addresses the IDV-pipeline cluster directly.
2. **Onfido (Entrust) Document + Motion** — PASS. Concrete vendor + named product; iBeta L2 + GPG45 mapping are public.
3. **Persona Inquiry + database** — PASS. Concrete vendor + named workflow; LexisNexis is the documented data partner.
4. **Veriff IDV + injection-attack defense** — PASS. Concrete; targets the deepfake-injection bypass explicitly named in account-hijack and dormant-domain.
5. **Stripe Identity** — PASS (weak). Concrete, but the ideation correctly notes Stripe doesn't claim IAL2 certification and lacks granular forensics. Keep for cost/coverage comparison; stage 4 will mark its STRONG-equivalence as unsupported.
6. **Socure ID+** — PASS. Concrete; strong on synthetic/ATO which maps to credential-compromise.
7. **AU10TIX BOS** — PASS. Concrete; the morphing-detection angle is the right counter to face-morphing bypasses in account-hijack Method 2 and dormant-account-takeover Bypass B.
8. **iProov GPA / Liveness Assurance** — PASS. Concrete; explicitly cited by GOV.UK One Login and the right anti-deepfake-injection control.
9. **Incode Omni** — PASS. Concrete; somewhat duplicative of Jumio/Veriff but worth keeping as a market comparator since the attacker-story bypasses motivate plural-vendor coverage.
10. **IDnow VideoIdent** — PASS. Concrete; the live-agent leg is the only idea here that addresses the IDV-session handoff exploit (account-hijack Method 3) by construction, and is the right re-bind tool for dormant-account reactivation.
11. **Trulioo GlobalGateway** — PASS. Concrete; the only idea covering non-US/EU authoritative-source matching, which matters for GPG45 verification score 3 across borders.
12. **Login.gov federation** — PASS. Concrete; named US federal IAL2 source.
13. **ID.me federation** — PASS. Concrete commercial alternative; some duplication with #12 but coverage differs.
14. **GOV.UK One Login** — PASS. Concrete; UK customer leg.
15. **eIDAS-High notified eID federation** — PASS. Lists specific national schemes (itsme, FranceConnect+, German nPA, SPID L3, Cl@ve, Estonian eID), all real and named — concrete enough for stage 4.
16. **ICAO 9303 NFC chip read** — PASS. Concrete and the strongest single answer to face-morphing bypasses (the chip's signed portrait can't be morphed without a CSCA key compromise).
17. **MRZ + PDF417 cross-check SOP** — PASS. Concrete in-house SOP grounded in ICAO 9303 and AAMVA specs.
18. **Order-time IAL2 re-proofing SOP** — PASS. This is the SOP the mapping file *names* as the pivot defense; relevance is maximal. Concrete because it pins the trigger ("every SOC order"), the action (biometric re-capture + template match), and the playbook.
19. **Cross-tenant biometric dedup (Jumio Identity Verification 360 / Onfido Known Faces / Incode shared signal)** — PASS. Names specific vendor features; addresses the cluster the mapping notes is otherwise hard to reach (it-persona-manufacturing, cro-identity-rotation single-provider leg).
20. **Phone-of-record OOB callback** — PASS. Concrete (Twilio/Telesign), and explicitly addresses account-hijack Method 3 handoff.
21. **Telesign / Prove SIM-swap lookup** — PASS. Named vendors, named products; targets the credential-compromise SIM-swap path.
22. **Device + IDV-session origin binding** — PASS. Concrete (WebAuthn + session pinning) and a direct counter to account-hijack Method 3.
23. **Manual reviewer dual-control + scripted unscripted prompts SOP** — PASS. Concrete SOP with named case-management tools (Unit21, Sardine, Hummingbird); addresses dormant-account-takeover Bypass C and credential-compromise social-engineering. The "manual review of the order — FAIL unless paired with a specific signal and playbook" rule is satisfied: this idea pairs the reviewer playbook with named triggering signals (override_attempted etc) and a named action (dual-control + unscripted prompts).
24. **FIDO2/passkey AAL2/AAL3 step-up** — PASS. Concrete; addresses ATO-inherits-prior-pass.
25. **PIV / CAC federal smartcard acceptance** — PASS. Concrete; covers federal customer subset at strictly higher assurance than commercial IDV.
26. **In-house face-embedding selfie history** — PASS. Concrete (named models ArcFace/FaceNet); independent of vendor cross-tenant features so addresses the same coverage from a different angle (defense-in-depth, not a duplicate of #19 because the dedup boundary differs — provider-internal vs vendor-cross-tenant).
27. **Force email-orders through portal IAL2 SOP** — PASS. The mapping note for inbox-compromise explicitly says "if forced through IAL2, the branch dies" — this idea is exactly that SOP.
28. **ICAO PKD as trust anchor SOP** — PASS. Concrete public dataset (ICAO PKD) with a named role (CSCA verification cross-check).
29. **Acuant (GBG)** — PASS. Concrete vendor; the two-vendor cross-check rationale is sound for catching single-SDK injection bypasses.
30. **In-person proofing fallback (USPS / Notarize / NotaryCam)** — PASS. Concrete named providers; the right ultimate fallback for any flag from #1-29.

## Gaps (attacker-story coverage)

Walking the mapping file, every attacker story for which M14 has any plausible reach is covered:

- **account-hijack** — 1-10, 16-18, 20, 22-24, 28-30. Strong coverage.
- **credential-compromise** — 1-10, 18, 21, 24, 25, 30. Strong coverage.
- **dormant-account-takeover** — 1-10, 18, 20, 23, 30. The pivot SOP (#18) is present.
- **dormant-domain** — 1-9, 16, 17, 28, 29 (two-vendor cross-check addresses the weak-SDK bypass). Covered.
- **cro-identity-rotation** — 19, 26 cover the single-provider leg. The mapping file explicitly notes the *cross-provider* leg is structural and not addressable inside one provider's M14 — not a gap to fill in v2.
- **shell-nonprofit, biotech-incubator-tenant** — 19, 26 are the only ideas with any traction (multi-account accomplice collision). Mapping file states M14 cannot distinguish a willing accomplice from a real principal; this is a structural gap and acknowledging it inside the ideation file is the correct response (which v1 does in the coverage-notes section). No new idea would close it without re-purposing M14 into legitimacy/affiliation measures.
- **bulk-order-noise-cover** — 1-3, 6, 11, 18 cover the textbook mismatch case (named orderer ≠ IAL2 record).
- **it-persona-manufacturing** — 19, 26 cover the cross-persona biometric clustering risk.
- **inbox-compromise** — 27 covers the force-through-portal SOP.

No uncovered classes within M14's scope.

## Duplication check

- #1 Jumio, #2 Onfido, #5 Stripe, #6 Socure, #9 Incode are five general-purpose document+selfie+liveness vendors. They are not redundant for stage 4 because each has a meaningfully different posture (Jumio: broad doc coverage + cross-tenant 360; Onfido: GPG45 mapping; Stripe: cheap/easy but unclaimed IAL2; Socure: deepest US identity graph; Incode: LATAM + injection defense). Keep all.
- #4 Veriff and #29 Acuant are alternates for the same role; both meaningfully named and cited for different reasons (Veriff = injection defense, Acuant = AAMVA/DMV depth + second-vendor cross-check). Keep both.
- #19 (vendor cross-tenant dedup) and #26 (in-house embedding store) overlap functionally but cover different perimeters (vendor's customer base vs the provider's own). Keep both.
- #12, #13, #14, #15, #25 are five federation paths, each scoped to a distinct user population (US civilian, US commercial, UK, EU, US federal/DoD). Not duplicative.
- #1, #2 inherently include their own document forensics, but #16 (NFC chip read) and #17 (MRZ/PDF417 SOP) and #28 (ICAO PKD) are *independent* layers above any vendor's verdict and address the "trust the vendor, get burned by a single SDK weakness" failure mode. Keep all four.

## Conclusion

All 30 ideas PASS both gates. No REVISE, no DROP. No uncovered attacker classes within M14's reach. Two acknowledged structural gaps (real-accomplice fronting, cross-provider CRO rotation) are out of scope for M14 and correctly noted by the ideation agent.

STOP: yes
