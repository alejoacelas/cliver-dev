# Stage 1 Ideation — Measure 14: Identity Evidence Match (IAL2 / GPG45 STRONG)

Measure: For SOC orders, the named orderer must present identity evidence (NIST 800-63 IAL2 / GPG45 STRONG equivalent) that matches the account holder. Refusal -> deny; mismatch -> manual follow-up / report.

Each idea below targets either (a) the IDV proofing pipeline itself (document + biometric + liveness binding the named orderer to a verifiable identity) or (b) the order-time re-binding ("does the human submitting *this SOC order* match the account holder of record?"). The two together form M14.

Mode legend: D = direct, A = attacker-driven, H = hardening (iter 2+ only).

---

## 1. Jumio KYX — document + selfie + iProov-class liveness, IAL2 package
- **Modes:** D, A
- **summary:** Run the named orderer through Jumio's KYX identity-verification flow (ID Verification + Identity Verification with biometric liveness). Jumio captures a government photo ID (passport/driver licence/national ID), runs document forensics (template/MRZ/PDF417/security feature checks), captures a selfie with passive + active liveness, and returns a face-match score against the document portrait. For order-time re-binding the orderer's freshly captured face is also matched against the stored enrollment template on file for the account holder. Jumio markets IAL2 / eIDAS-High alignment and is on the iBeta PAD Level 2 list. Signal: pass/fail + match score + document authenticity verdict + liveness verdict.
- **attacker_stories_addressed:** account-hijack, credential-compromise, dormant-account-takeover, dormant-domain, bulk-order-noise-cover, inbox-compromise (if forced through), it-persona-manufacturing
- **external_dependencies:** Jumio KYX API; webhook endpoint; storage of enrollment biometric template; human reviewer for ambiguous match scores
- **manual_review_handoff:** Reviewer sees: doc image, selfie, liveness frames, face-match score, document-forensics breakdown, and stored enrollment template if re-binding. Playbook: (i) if doc forensics fails -> deny + SAR; (ii) if liveness fails -> re-attempt once on a different device, else deny; (iii) if face-match below threshold but doc OK -> request second selfie + step-up call; (iv) if all pass but enrollment-template mismatch on re-bind -> hold order, contact registered account holder out-of-band.
- **flags_thrown:** doc_authenticity_fail; liveness_fail; face_match_low; injection_attack_detected (Jumio Liveness Premium / FaceTec-style); template_mismatch_to_enrollment; expired_document; sanctioned_country_doc.
- **failure_modes_requiring_review:** vendor API timeout; OCR misread of MRZ on worn passports; legitimate users with twins / heavy makeup / post-surgery; document type not in Jumio template library (rare nationalities).
- **record_left:** signed Jumio verification record (verification ID, doc images, selfies, liveness video, all scores), timestamped, retained per ToS — auditable artifact for SAR/law enforcement.

## 2. Onfido (Entrust) Document + Motion liveness, IAL2 / GPG45 Medium-to-High
- **Modes:** D, A
- **summary:** Equivalent flow via Onfido. Onfido's Motion liveness is iBeta PAD L2 certified; Onfido publishes a GPG45 mapping (Document = score 3, Biometric = score 3 -> Medium/High profile). For UK/EU customers Onfido is the most commonly cited route to GPG45 STRONG via Document + Biometric + activity history. Signal: discrete pass/refer/fail with sub-checks.
- **attacker_stories_addressed:** account-hijack, credential-compromise, dormant-account-takeover, dormant-domain
- **external_dependencies:** Onfido SDK / API; webhook; reviewer console; biometric template store
- **manual_review_handoff:** Onfido "consider" results route to reviewer with sub-check breakdown (visual_authenticity, image_integrity, data_consistency, face_comparison, facial_similarity_motion). Playbook same as #1.
- **flags_thrown:** consider/clear at sub-check level; spoofing_attempt; document_unsupported.
- **failure_modes_requiring_review:** SDK injection from rooted devices; supported-doc list gaps for some African/Pacific national IDs.
- **record_left:** Onfido check ID, document images, motion video, all sub-check scores.

## 3. Persona Inquiry with Government ID + Selfie + Database verification
- **Modes:** D, A
- **summary:** Persona's Inquiry orchestrates document, selfie, and database steps in one workflow. Persona explicitly markets a NIST 800-63 IAL2 template. Adds optional database lookup (LexisNexis-fed) cross-checking name+DOB+SSN4 against authoritative records, which strengthens evidence beyond a single document and helps clear GPG45 verification score 3. Signal: Inquiry decision + per-report verdicts.
- **attacker_stories_addressed:** account-hijack, credential-compromise, dormant-account-takeover, bulk-order-noise-cover
- **external_dependencies:** Persona API; LexisNexis Risk Solutions (via Persona); reviewer console
- **manual_review_handoff:** Reviewer evaluates the full Inquiry timeline: doc, selfie, database, plus device/IP signals Persona surfaces. Playbook as #1, plus: if database lookup says identity is "deceased" or "synthetic indicators present" -> deny + SAR.
- **flags_thrown:** doc_fraud; selfie_mismatch; database_no_hit; deceased; synthetic_identity; velocity (same selfie across many inquiries).
- **failure_modes_requiring_review:** non-US identities have weaker DB coverage; LexisNexis hit-rate degrades for under-25 / thin-file customers.
- **record_left:** Persona Inquiry artefact bundle.

## 4. Veriff IDV + injection-attack defense
- **Modes:** D, A
- **summary:** Veriff offers document + biometric verification with explicit injection-attack detection (camera virtualization, emulator, deepfake-frame fingerprints). Targets the "deepfake injection against weak SDK" bypass called out in dormant-domain Branch A and account-hijack Method 1. Signal: verification verdict plus injection_attempt sub-flag.
- **attacker_stories_addressed:** account-hijack, dormant-domain, dormant-account-takeover, credential-compromise
- **external_dependencies:** Veriff API; reviewer console
- **manual_review_handoff:** Same as #1; injection_attempt flag is auto-deny + SAR (no second chance) because it indicates intent.
- **flags_thrown:** injection_attempt; deepfake_detected; emulator_detected; doc_tamper.
- **failure_modes_requiring_review:** false positives on legitimate users with virtual cameras (OBS users, accessibility tools).
- **record_left:** Veriff session record incl. raw video frames.

## 5. Stripe Identity (document + selfie)
- **Modes:** D
- **summary:** Lightweight option for providers already using Stripe billing. Stripe Identity captures government ID + selfie, runs document forensics and face match, and returns a verification result. Marketed as suitable for IAL2-style use cases though Stripe does not formally claim IAL2 certification. Signal: verified/requires_input/canceled with sub-checks.
- **attacker_stories_addressed:** credential-compromise, account-hijack (weaker — no injection-attack hardening at the level of Veriff/iProov)
- **external_dependencies:** Stripe Identity API; tied to Stripe account
- **manual_review_handoff:** Reviewer sees doc, selfie, document_check + selfie_check verdicts. Playbook as #1; escalate any "document.unverified_other" because Stripe will not surface why.
- **flags_thrown:** document.unverified_*; selfie.unverified_*.
- **failure_modes_requiring_review:** Stripe does not return granular forensic sub-scores; harder to triage borderline cases.
- **record_left:** Stripe verification report.

## 6. Socure ID+ Predictive DocV
- **Modes:** D, A
- **summary:** Socure ID+ combines document verification, selfie + liveness, and the deepest US consumer-identity graph (PII verification, synthetic identity, velocity, KYC watchlist) of any IDV vendor. Particularly strong against synthetic identities and ATO patterns common in credential-compromise. Signal: decision + reason codes + Sigma synthetic-identity score.
- **attacker_stories_addressed:** credential-compromise, account-hijack, bulk-order-noise-cover, it-persona-manufacturing
- **external_dependencies:** Socure ID+ API; primarily US data
- **manual_review_handoff:** Reviewer evaluates Sigma score + reason codes; high Sigma -> deny + SAR; medium -> manual call-back to phone-of-record.
- **flags_thrown:** sigma_synthetic_high; ato_pattern; velocity; pii_inconsistent; doc_fail.
- **failure_modes_requiring_review:** non-US customers; thin-file legitimate users.
- **record_left:** Socure decision + all reason codes.

## 7. AU10TIX BOS — bank-grade document forensics
- **Modes:** D, A
- **summary:** AU10TIX is the IDV vendor most often cited for low-FAR document forensics; widely used by tier-1 banks and crypto exchanges. Includes deepfake/morphing detection in the document portrait (counter to face-morphing bypass in account-hijack Method 2 and dormant-account-takeover Bypass B). Signal: BOS verdict + per-test breakdown.
- **attacker_stories_addressed:** account-hijack (face morphing), dormant-account-takeover (face morphing), dormant-domain, credential-compromise
- **external_dependencies:** AU10TIX BOS API
- **manual_review_handoff:** Reviewer console exposes morphing-detection score per face. If morph_score elevated -> deny + SAR even if liveness passes.
- **flags_thrown:** doc_morph_detected; doc_template_unknown; mrz_checksum_fail; portrait_inconsistency.
- **failure_modes_requiring_review:** false positives on heavily compressed scans.
- **record_left:** AU10TIX session record.

## 8. iProov Genuine Presence Assurance + Liveness Assurance
- **Modes:** D, A
- **summary:** iProov is the dedicated face-biometric / liveness vendor used by the UK Home Office, GOV.UK One Login, US DHS, and Singapore SingPass. Their Flashmark / Genuine Presence Assurance is purpose-built against deepfake injection and uses one-time illumination challenge frames the attacker cannot pre-render. Pair with any document vendor as the biometric leg of the IAL2 / GPG45 score-3 biometric requirement. Signal: GPA verdict (genuine / not genuine) + liveness verdict.
- **attacker_stories_addressed:** account-hijack (deepfake injection), dormant-account-takeover (Bypass A deepfake), dormant-domain (injection Bypass B), credential-compromise (injection)
- **external_dependencies:** iProov API; pairs with a document vendor (1-7) or stands alone for re-binding flows
- **manual_review_handoff:** GPA "not genuine" -> auto-deny + SAR. Borderline -> reviewer watches the Flashmark capture clip.
- **flags_thrown:** gpa_fail; injection_detected; replay_detected.
- **failure_modes_requiring_review:** users with photosensitive epilepsy (Flashmark contraindication — fall back to Liveness Assurance non-flashing variant); poor lighting.
- **record_left:** iProov capture clip + GPA decision.

## 9. Incode Omni — IDV with deepfake-injection defense
- **Modes:** D, A
- **summary:** Incode (used by HSBC, Banorte, Rappi) provides document + biometric + liveness with explicit deepfake-injection countermeasures and an in-house reviewer console. Alternative to Jumio/Onfido positioned at large LATAM customers. Signal: verification verdict + risk codes.
- **attacker_stories_addressed:** account-hijack, credential-compromise, dormant-account-takeover
- **external_dependencies:** Incode Omni API
- **manual_review_handoff:** As #1.
- **flags_thrown:** as #1, plus injection_score.
- **failure_modes_requiring_review:** as #1.
- **record_left:** Incode Omni session record.

## 10. IDnow VideoIdent (live video agent, German BaFin standard)
- **Modes:** D, A
- **summary:** Live agent watches the customer turn the document, recite a code, and tilt their head — explicitly designed against asynchronous deepfakes (the agent can prompt unscripted actions). The agent is also a circuit-breaker against IDV-session handoff exploits. eIDAS-High / German AML standard. Useful as the *order-time re-bind* leg for high-risk SOC orders even if the onboarding leg used a self-serve vendor.
- **attacker_stories_addressed:** account-hijack (Method 3 IDV-session handoff), dormant-account-takeover (Bypass A and Bypass C — the live agent IS the manual reviewer, so social-engineering them is the threat), credential-compromise
- **external_dependencies:** IDnow VideoIdent agent pool; SLA on agent availability
- **manual_review_handoff:** The session itself is supervised. Escalation: if the agent is uncertain, second-agent review.
- **flags_thrown:** agent_unsure; behavior_inconsistent; document_concern; handoff_suspected (different device/IP than session start).
- **failure_modes_requiring_review:** agent fatigue / social engineering of agent (this is precisely dormant-account-takeover Bypass C — must be addressed via dual-agent and scripted unscripted-prompts).
- **record_left:** full video recording of the agent session.

## 11. Trulioo GlobalGateway Person Match + Document Verification
- **Modes:** D
- **summary:** Trulioo is the broadest cross-border identity-data network: matches name+DOB+address+ID-number against 400+ authoritative datasets in 195 countries, plus document verification. Useful as the *data verification* leg of GPG45 (verification score 3 requires authoritative-source match), and to get coverage for non-US/EU customers where Persona/Socure are weak.
- **attacker_stories_addressed:** credential-compromise (synthetic identities), bulk-order-noise-cover, foreign-institution-style cases
- **external_dependencies:** Trulioo GlobalGateway API
- **manual_review_handoff:** Reviewer evaluates which authoritative sources matched and which didn't; partial match patterns indicate synthetic identity.
- **flags_thrown:** no_match; partial_match; deceased; pep_watchlist.
- **failure_modes_requiring_review:** countries with no authoritative dataset coverage.
- **record_left:** Trulioo match record per source.

## 12. Login.gov SAML/OIDC federation at IAL2
- **Modes:** D, A
- **summary:** Federate the SOC-order identity step to Login.gov, which already runs IAL2 (document + selfie/biometric + phone + remote proofing or in-person at a USPS Post Office). The provider receives a signed assertion that the named orderer is IAL2-proofed under that Login.gov identity. Eliminates the provider's need to run its own IDV pipeline, and crucially, Login.gov binds re-authentication to a phishing-resistant authenticator, blunting credential-compromise.
- **attacker_stories_addressed:** credential-compromise, account-hijack (if AAL2/AAL3 enforced too), bulk-order-noise-cover
- **external_dependencies:** Login.gov as RP; provider becomes Login.gov relying party (US-only customers)
- **manual_review_handoff:** Login.gov failures cannot be appealed by the provider; provider falls back to running its own IDV (chain to #1-10).
- **flags_thrown:** assertion_below_ial2; subject_changed (the SAML subject differs from the one bound at account creation).
- **failure_modes_requiring_review:** non-US customers cannot use Login.gov; in-person fallback latency.
- **record_left:** signed SAML/OIDC assertion incl. IAL/AAL claims.

## 13. ID.me federation
- **Modes:** D
- **summary:** Same model as Login.gov but commercial; covers IAL2 and offers in-person video-call proofing as a fallback. Used by the IRS, VA, many state agencies. Provider becomes an ID.me RP. Useful where Login.gov coverage gaps exist and the provider wants commercial SLA.
- **attacker_stories_addressed:** credential-compromise, account-hijack
- **external_dependencies:** ID.me RP integration
- **manual_review_handoff:** As Login.gov.
- **flags_thrown:** as Login.gov.
- **failure_modes_requiring_review:** documented past disputes around ID.me's proofing; some users refuse on privacy grounds.
- **record_left:** signed assertion.

## 14. GOV.UK One Login federation (GPG45 Medium / High)
- **Modes:** D
- **summary:** UK government identity service. UK customers complete the GPG45 Medium profile (document + biometric + activity history) once, and providers verify them via the One Login OIDC RP. Iterates the iProov leg internally so injection-resistance is upstream of the provider. Strongest fit for UK academic / NHS / pharma customers.
- **attacker_stories_addressed:** credential-compromise, account-hijack (UK customers)
- **external_dependencies:** GOV.UK One Login RP onboarding; UK-only customers
- **manual_review_handoff:** As Login.gov.
- **flags_thrown:** confidence_below_medium.
- **failure_modes_requiring_review:** non-UK customers.
- **record_left:** OIDC ID-token with vot/vtm claims.

## 15. eIDAS-High notified scheme federation (itsme, FranceConnect+, German Personalausweis)
- **Modes:** D
- **summary:** For EU customers, accept assertions from eIDAS-High notified eID schemes — Belgian itsme, FranceConnect+, German nPA / AusweisApp, Italian SPID L3, Spanish Cl@ve, Estonian eID. These bind the user to a smartcard / SIM-stored key issued after in-person proofing — equivalent to GPG45 STRONG / IAL2-or-higher. Provider integrates as an eIDAS RP via national eIDAS nodes. Defeats injection bypasses entirely because the binding is a hardware key, not a face match per session.
- **attacker_stories_addressed:** account-hijack, credential-compromise, dormant-account-takeover (EU customers), dormant-domain
- **external_dependencies:** eIDAS node connection; per-country contracts
- **manual_review_handoff:** None at proofing; cryptographic.
- **flags_thrown:** assertion_below_high; certificate_revoked.
- **failure_modes_requiring_review:** eligibility limited to citizens of the issuing country; setup overhead.
- **record_left:** signed eIDAS assertion + LoA claim.

## 16. ICAO 9303 chip read of ePassport via NFC (passive + active authentication)
- **Modes:** D, A
- **summary:** Independently of any IDV vendor, require an NFC chip read of the ePassport on a phone (the React Native / iOS NFC-Passport-Reader libraries do this). The chip's Document Security Object is signed by the issuing country's CSCA; passive authentication verifies the data wasn't tampered, active authentication proves the chip wasn't cloned. This is the GPG45 score-4 evidence level — STRONGER than visual document inspection. Defeats face-morphing because the chip's portrait is signed by the issuing country and immutable; the attacker would have to forge a signing key.
- **attacker_stories_addressed:** account-hijack (face morphing), dormant-account-takeover, dormant-domain, credential-compromise
- **external_dependencies:** mobile NFC SDK; access to ICAO PKD (Public Key Directory) for CSCA certs
- **manual_review_handoff:** If passive auth fails -> reviewer evaluates whether the ePassport is from a country whose CSCA cert is missing from PKD (rare); else auto-deny.
- **flags_thrown:** sod_signature_invalid; chip_clone_suspected; csca_unknown.
- **failure_modes_requiring_review:** US passports issued before 2007 lack chips; older chips don't support active authentication; ICAO PKD coverage gaps for some countries.
- **record_left:** signed chip dump + verification log.

## 17. MRZ checksum + OCR cross-check + barcode parse SOP
- **Modes:** D, A
- **summary:** As a defense in depth on top of the chosen IDV vendor, run an in-house parser on the captured ID image: validate the MRZ check digits per ICAO 9303, cross-check the MRZ-derived name/DOB/doc-number against the visual OCR fields (mismatch = tampered), and (for US driver licences) parse the PDF417 barcode and cross-check against the visual zone. Catches naive forgeries the vendor's OCR may have normalized away. Independent reviewer code that doesn't trust the vendor.
- **attacker_stories_addressed:** account-hijack, credential-compromise, dormant-domain
- **external_dependencies:** in-house parser library; AAMVA PDF417 spec; ICAO 9303 spec
- **manual_review_handoff:** mismatch -> reviewer compares MRZ vs visual zone vs barcode.
- **flags_thrown:** mrz_checksum_fail; mrz_visual_mismatch; pdf417_visual_mismatch.
- **failure_modes_requiring_review:** legitimate documents with worn MRZ.
- **record_left:** parser report.

## 18. Order-time IAL2 re-proofing trigger SOP (the "M14 pivot")
- **Modes:** A, D
- **summary:** The single highest-leverage SOP per the attacker mapping: every SOC order triggers a fresh IAL2 capture (document re-scan optional, biometric re-capture mandatory) via vendor #1/2/8/10, and the resulting biometric template must match the *enrollment* template stored at account creation. This is the explicit pivot defense called out in dormant-account-takeover ("not binding under onboarding-only IAL2; fully catching under order-triggered IAL2 with biometric re-proofing"). Without this SOP, M14 collapses into onboarding-only, which inheritance attacks defeat.
- **attacker_stories_addressed:** account-hijack, credential-compromise (ATO-inherits-prior-pass), dormant-account-takeover, bulk-order-noise-cover, inbox-compromise
- **external_dependencies:** any biometric vendor (1, 2, 8, 9, 10); enrollment-template store
- **manual_review_handoff:** If new template doesn't match enrollment within threshold -> hold order, contact account holder via phone-of-record (out-of-band), require either video re-enrollment with IDnow or explicit account-holder change procedure.
- **flags_thrown:** template_mismatch; enrollment_missing (legacy account never enrolled); device_change (new IDV session from a wholly different device/IP cluster vs enrollment).
- **failure_modes_requiring_review:** legitimate users on new phone, post-injury appearance change, new glasses — all hand off to live agent.
- **record_left:** new IDV session record + diff against enrollment.

## 19. Cross-tenant biometric dedup via vendor-side hash (Jumio Identity Verification 360, Onfido Known Faces, Incode shared signal)
- **Modes:** A
- **summary:** Several IDV vendors offer cross-tenant biometric deduplication: the vendor stores a perceptual / embedding hash of every face ever enrolled in their network and flags re-use across tenants (with privacy controls). Targets it-persona-manufacturing and the cro-identity-rotation single-vendor leak: if the same accomplice enrolls under three personas at one provider, or one persona at three providers using the same vendor, the vendor signals collision. Note attacker mapping explicitly notes CROs route around this by picking at most one provider per vendor — so this idea narrows but doesn't close cro-identity-rotation.
- **attacker_stories_addressed:** it-persona-manufacturing, cro-identity-rotation, shell-nonprofit (if accomplice serves multiple shells), biotech-incubator-tenant
- **external_dependencies:** vendor's cross-tenant feature (opt-in); privacy/legal review
- **manual_review_handoff:** Cross-tenant hit -> reviewer reads the linked-account context the vendor exposes; deny if linked accounts are cross-organization with no plausible legitimate sharing.
- **flags_thrown:** cross_tenant_face_collision; cross_account_face_collision_within_provider.
- **failure_modes_requiring_review:** legitimate cases (consultant working at multiple labs); embedding-hash false positives on twins.
- **record_left:** collision report ID + linked account refs.

## 20. Phone-of-record out-of-band callback at order time (anti-handoff SOP)
- **Modes:** A
- **summary:** For SOC orders, after the IDV session passes, place an automated callback to the phone-number-of-record bound at IAL2 enrollment (not a number provided in the current session). The customer must answer and confirm a one-time code displayed in the IDV session UI. Defeats account-hijack Method 3 (IDV-session handoff exploit) because the legitimate account holder's phone gets the call, not the attacker's. Layered with #18.
- **attacker_stories_addressed:** account-hijack (handoff), dormant-account-takeover, credential-compromise (if SIM swap is filtered by SIM-swap detection on the carrier API — see #21)
- **external_dependencies:** Twilio Voice / Telesign; phone bound at enrollment
- **manual_review_handoff:** No answer / wrong code -> hold order, contact via secondary channel (institution email).
- **flags_thrown:** callback_unanswered; wrong_otp_voiced; recent_sim_swap_on_target_msisdn.
- **failure_modes_requiring_review:** legitimate users who changed phone number; international callback friction.
- **record_left:** call CDR + outcome.

## 21. Telesign / Prove SIM-swap and number-port lookup at IDV time
- **Modes:** A
- **summary:** Before trusting any SMS- or phone-anchored IAL2 step, query Telesign Score / Prove Pre-Fill / Twilio Lookup for the phone number's recent SIM-swap, port-out, or carrier-change events. credential-compromise explicitly cites "breached PII + SIM swap" as an IAL1 path. A hit on recent SIM-swap is auto-deny for that channel and forces video re-proofing.
- **attacker_stories_addressed:** credential-compromise, account-hijack
- **external_dependencies:** Telesign / Prove / Twilio Lookup
- **manual_review_handoff:** Recent SIM swap (≤14 days) -> deny SMS path, require IDnow video session.
- **flags_thrown:** sim_swap_recent; port_out_recent; mvno_unverified.
- **failure_modes_requiring_review:** legitimate users who recently changed carriers.
- **record_left:** lookup record.

## 22. Device + IDV-session origin binding (anti-handoff)
- **Modes:** A
- **summary:** Bind the IDV session technically to the device that initiated it: pin the session's WebAuthn-attested device handle, the IP /24 it was opened from, and the user-agent. The selfie capture must complete on the same device handle. account-hijack Method 3 ("initiate the session on the victim's account and complete liveness from a different device under attacker control") is precisely the bypass this denies.
- **attacker_stories_addressed:** account-hijack (handoff), dormant-account-takeover
- **external_dependencies:** WebAuthn / device attestation; IDV vendor that supports session pinning (Jumio, Onfido, Veriff, Persona all do via session tokens)
- **manual_review_handoff:** Device mismatch -> reviewer asks customer to restart from the original device or escalate to IDnow.
- **flags_thrown:** session_device_mismatch; ip_geo_jump; ua_change_mid_session.
- **failure_modes_requiring_review:** legitimate users who switch from desktop to phone for the selfie leg (must be supported via QR handoff that re-binds).
- **record_left:** session telemetry log.

## 23. Manual reviewer playbook with anti-social-engineering controls (dual-control + scripted unscripted prompts)
- **Modes:** A
- **summary:** Defeats dormant-account-takeover Bypass C and credential-compromise "social-engineer support". Every IAL2 manual override requires two reviewers (dual control), uses a scripted set of "unscripted" prompts (drawn at random from a bank, e.g. "show me the back of any utility bill from last month") that the attacker cannot pre-prepare for, and forbids any reviewer concession that a customer's "urgency" justifies bypassing IDV. SOP not vendor.
- **attacker_stories_addressed:** dormant-account-takeover (Bypass C), credential-compromise (social-engineer support), dormant-domain
- **external_dependencies:** internal trust-and-safety team SOP; reviewer training; case-management tool (e.g. Unit21, Sardine, Hummingbird)
- **manual_review_handoff:** This *is* the manual review.
- **flags_thrown:** override_attempted; second_reviewer_disagrees; customer_resistant_to_unscripted_prompts.
- **failure_modes_requiring_review:** N/A — terminal node.
- **record_left:** dual-signed override decision log.

## 24. Biometric-bound AAL2/AAL3 step-up with FIDO2/passkey at order time
- **Modes:** A
- **summary:** Even with IAL2 enrollment, require a FIDO2/passkey or hardware-token re-auth at SOC order submission, bound to the device that did enrollment. Defeats credential-compromise's "ATO inherits prior pass" because stolen passwords don't carry the passkey, and phishing-resistant authenticators block the credential-stuffing path entirely. Pairs with #18 (re-bind) for AAL+IAL together.
- **attacker_stories_addressed:** credential-compromise, account-hijack
- **external_dependencies:** WebAuthn server-side; passkey enrollment at IAL2 enrollment time
- **manual_review_handoff:** Lost passkey -> recovery flow that requires fresh IDnow video proofing (not knowledge-based recovery).
- **flags_thrown:** passkey_missing; passkey_recovery_invoked; non_attested_authenticator.
- **failure_modes_requiring_review:** legitimate authenticator loss.
- **record_left:** WebAuthn assertion log.

## 25. PIV / CAC certificate acceptance for US federal / DoD customers
- **Modes:** D
- **summary:** For US federal and DoD-affiliated customers, accept PIV/CAC smartcard certificates as the IAL2/AAL3 evidence. PIV is issued post-NACI background check — strictly stronger than commercial IDV. Provider becomes a relying party that validates the cert chain to the Federal PKI bridge. Strongest evidence available for the population it covers.
- **attacker_stories_addressed:** credential-compromise, account-hijack (federal users)
- **external_dependencies:** FPKI trust anchor; OCSP / CRL checks
- **manual_review_handoff:** Cert revoked -> deny.
- **flags_thrown:** cert_revoked; cert_expired; chain_invalid.
- **failure_modes_requiring_review:** N/A.
- **record_left:** cert chain + OCSP response.

## 26. Selfie-against-prior-orders biometric history (in-house template store)
- **Modes:** A
- **summary:** Independently of any vendor's cross-tenant feature (#19), the provider stores its own embedding hash (e.g. ArcFace, FaceNet) of every order-time selfie from every account, and on each new SOC order checks for collisions across distinct accounts within the provider. Catches the it-persona-manufacturing and shell-nonprofit accomplice patterns where one human runs many accounts. Privacy-bounded to the provider's own customer base.
- **attacker_stories_addressed:** it-persona-manufacturing, shell-nonprofit, biotech-incubator-tenant, cro-identity-rotation (single-provider leg)
- **external_dependencies:** in-house face-embedding model; vector store
- **manual_review_handoff:** Collision across distinct accounts -> reviewer evaluates whether the linked accounts are the same legal entity (legitimate) or distinct (suspicious accomplice).
- **flags_thrown:** in_house_face_collision_distinct_accounts.
- **failure_modes_requiring_review:** twins; consultants serving multiple labs.
- **record_left:** collision record with both selfies.

## 27. Bound-to-account inbox challenge for inbox-compromise pivot
- **Modes:** A
- **summary:** For "orders by email" surfaces (inbox-compromise Branch B), refuse to process the order until the orderer completes an IAL2 capture in the account portal — i.e. forcibly route email-initiated SOC orders through the IDV pipeline instead of trusting the email. The mapping note explicitly says "if forced through IAL2, the branch dies." This is an SOP, not a vendor.
- **attacker_stories_addressed:** inbox-compromise
- **external_dependencies:** policy + portal infrastructure
- **manual_review_handoff:** Customer who refuses portal flow -> deny.
- **flags_thrown:** soc_order_via_email_no_portal_completion.
- **failure_modes_requiring_review:** legitimate customers who only use email — escalate to live IDnow.
- **record_left:** email + portal-completion correlation.

## 28. CSCA / ICAO PKD lookup as document-trust anchor SOP
- **Modes:** D
- **summary:** Maintain a synced copy of the ICAO Public Key Directory (CSCA master list) and use it as the trust anchor for #16 (NFC chip read) and as a sanity check for any vendor's document-forensics verdict. If the vendor returns "doc OK" but the country's CSCA verification disagrees, flag for review. Defense in depth against vendor blind spots.
- **attacker_stories_addressed:** account-hijack, dormant-domain, credential-compromise
- **external_dependencies:** ICAO PKD subscription
- **manual_review_handoff:** Vendor-vs-CSCA disagreement -> reviewer adjudicates.
- **flags_thrown:** vendor_csca_disagreement.
- **failure_modes_requiring_review:** PKD lag for newly-issued CSCA roots.
- **record_left:** PKD verification log.

## 29. Acuant (GBG) IDV — alternative document/biometric vendor
- **Modes:** D
- **summary:** Acuant (now part of GBG) offers document + biometric + database verification with strong US driver-licence coverage (used by many state DMVs). Useful as a second-vendor cross-check on borderline cases — running the same evidence through two independent vendors and comparing verdicts catches single-vendor SDK weaknesses.
- **attacker_stories_addressed:** dormant-domain (weak SDK injection), account-hijack
- **external_dependencies:** Acuant API
- **manual_review_handoff:** Two-vendor disagreement -> reviewer.
- **flags_thrown:** vendor_disagreement.
- **failure_modes_requiring_review:** as #1.
- **record_left:** two vendor records.

## 30. In-person proofing fallback via USPS (Login.gov) or notary network (Notarize / NotaryCam)
- **Modes:** D, A
- **summary:** For high-risk SOC orders or after a Critical flag from any of #1-29, require in-person proofing at a USPS Post Office (Login.gov in-person path) or via a remote online notary (Notarize / NotaryCam) where a commissioned notary verifies the physical document on a recorded video session. Equivalent to GPG45 evidence score 4 in person. Final fallback that no remote injection attack defeats.
- **attacker_stories_addressed:** account-hijack, dormant-account-takeover, credential-compromise, dormant-domain
- **external_dependencies:** USPS / Notarize partnerships
- **manual_review_handoff:** Notary's identity report attached to order.
- **flags_thrown:** notary_doubts_doc; notary_doubts_match.
- **failure_modes_requiring_review:** N/A (notary is the reviewer).
- **record_left:** notarized identity-verification record.

---

## Coverage notes for self-critique

- Branches catching: account-hijack (1-10, 16-18, 20, 22-24, 28-30); credential-compromise (all of the above + 21, 24, 25); dormant-account-takeover (1-10, 16-18, 20, 22-24, 30); dormant-domain (1-9, 16-17, 22, 28-30); bulk-order-noise-cover (1-3, 6, 11, 18); inbox-compromise (27); it-persona-manufacturing (19, 26); cro-identity-rotation (19, 26 — *only single-provider leg; structural cross-provider gap remains uncovered, as the mapping note acknowledges*); shell-nonprofit / biotech-incubator-tenant (19, 26 — *weak: real-accomplice attacks pass M14 by definition; mapping note acknowledges this is a structural gap M14 cannot close*).
- Known structural uncovered: shell-nonprofit, biotech-incubator-tenant, cro-framing — all use real fronted humans whose ID legitimately matches the account holder. M14 cannot detect them; this belongs to legitimacy/affiliation measures, not M14.

## Dropped
(none — first iteration)
