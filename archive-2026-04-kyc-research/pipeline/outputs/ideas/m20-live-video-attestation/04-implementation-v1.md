# m20-live-video-attestation — implementation v1

- **measure:** M20 (voucher-legitimacy-soc)
- **name:** Live video attestation (voucher on scheduled call holding gov ID)
- **modes:** A (manual reviewer) — optional augmentation by deepfake-detection vendor
- **summary:** Provider compliance ops schedules a live (synchronous) video call with the registered voucher. On the call the voucher (a) shows their government ID, (b) audibly states the customer name and the SOC order context they are vouching for, (c) answers two unscripted questions about their relationship to the customer. Call is recorded; an attestation form is completed by the reviewer.

## external_dependencies

- A video conferencing platform that records and produces a stable artifact hash. Off-the-shelf options: Zoom (cloud recording + per-meeting UUID), Microsoft Teams, Google Meet. All three produce a recording stored in vendor cloud with retrievable metadata.
- A scheduling tool (e.g. Calendly, Cal.com) for booking the voucher.
- A reviewer (compliance ops headcount) trained on a written SOP. Estimated minimum 1 reviewer per ~30 attestations/day at 15-min sessions plus 10-min write-up [best guess: 8-hour day with realistic queue gaps].
- Optional: a video-KYC vendor (Sumsub Video Identification, Ondato Video Identity, Identomat Video KYC, Shufti Pro live agent video, KYCAID Assisted Video Verification) which bundles agent UI, ID OCR, face-match-to-ID, liveness, and an audit log into one product. [source: [Sumsub Video Identification](https://sumsub.com/video-identification/), [Ondato](https://ondato.com/identity-verification/video-identity-verification/), [Identomat](https://www.identomat.com/video-kyc), [Shufti Pro](https://shuftipro.com/blog/video-kyc-in-2025-what-it-is-how-it-works-and-why-it-matters/), [KYCAID](https://kycaid.com/live-video-verification/)]
- Optional: a deepfake/injection-attack detector layered on the call. Vendors: Facia.ai (claims >90% accuracy on live-video deepfake detection), Sensity AI, Reality Defender. [source: [Facia.ai](https://facia.ai/), [Sensity AI KYC](https://sensity.ai/use-cases/kyc/)]

## endpoint_details

- **Build-vs-buy split:**
  - **Build path:** Zoom/Teams + a Google Form attestation + manual SOP. No vendor API. Recording hash via SHA-256 over downloaded MP4. ToS: Zoom permits recording with notice; the voucher must consent on-camera.
  - **Buy path:** A video-KYC vendor's agent console. Each vendor exposes a REST API to (a) create a verification session, (b) get a session-completed webhook, (c) pull the recording + structured result (ID extracted, face-match score, liveness score, agent verdict).
- **Auth model:** Vendor-issued API key + webhook secret (Sumsub, Ondato, Shufti). No public OAuth. [source: [Sumsub developer docs are public; full pricing requires sales](https://sumsub.com/video-identification/)] — [vendor-gated — public pages describe the product surface; full API reference and pricing require sales contact]
- **Rate limits:** Not the binding constraint — limited by reviewer agent capacity, not API. [unknown — searched for: "Sumsub video identification rate limit", "Ondato video KYC API rate limit"]
- **Pricing:** All four major vendors (Sumsub, Ondato, Jumio, Onfido) use custom enterprise pricing; no public per-call rate card. [source: [Jumio pricing overview — custom packages](https://hyperverge.co/blog/jumio-pricing/), [Onfido — custom pricing](https://www.au10tix.com/blog/onfido-competitors-top-8-onfido-alternatives/)] [vendor-gated — exact $/call requires sales contact]
- **ToS constraints:** Recording-with-consent is universally required. EU vendors (Ondato, Identomat) explicitly handle GDPR data-subject obligations as part of their video-KYC product.

## fields_returned

A typical vendor session result includes (per Sumsub / Ondato / Identomat marketing + docs, [vendor-described]):

- `session_id`, `start_ts`, `end_ts`, `agent_id`
- `id_document`: extracted MRZ + OCR fields (name, DOB, doc number, country, expiry)
- `face_match_score` (ID photo vs live video frames)
- `liveness_score` (passive)
- `agent_verdict`: PASS / REFER / FAIL with free-text agent note
- `recording_url` and `recording_hash`
- `audit_log_xml` (Shufti retains 5–10 years)
- For deepfake-detector overlay (Facia / Sensity): `synthetic_face_score`, `injection_attack_detected` boolean

For the build path, the equivalent is whatever the reviewer types into the attestation form: voucher legal name, doc type + last 4, the verbatim attestation sentence, and the SHA-256 of the recording.

## marginal_cost_per_check

- **Reviewer labor:** 25 min (15 call + 10 write-up) at fully loaded $60/hr ≈ **$25 per attestation** [best guess: US comp-ops loaded rate].
- **Vendor cost (buy path):** Video-KYC sessions are typically priced in the **$2–$8 per session** range for high volume; live-agent video typically sits at the higher end vs. unattended IDV. [best guess: triangulated from public IDV per-call ranges; exact rate vendor-gated]
- **Total per check (build):** ~$25.
- **Total per check (buy + own reviewer):** $25 + $5 ≈ **$30**.
- **Total per check (buy with vendor's agent pool, no internal reviewer):** typically $15–$40 [vendor-gated].
- **Setup cost:** SOP authoring, reviewer training, recording-retention infra → ~$20–40k one-time [best guess: 1 FTE-month + legal review].

## manual_review_handoff

Standard SOP (build path):

1. After voucher is identified by the order workflow, send a Calendly link with a 15-min slot in the next 5 business days.
2. Reviewer joins on camera, identifies themself, states the order ID, asks the voucher to:
   - hold their gov ID next to their face for 5 seconds;
   - state aloud their full legal name, the customer's name, the order ID, and that they vouch for the customer's legitimacy for the SOC scope listed in the voucher form;
   - answer two unscripted questions: "When did you last work directly with [customer]?" and "What lab/group do they work in?"
3. Reviewer scores against attestation rubric: ID matches face (Y/N); claims are coherent (Y/N); voucher does not appear coached/scripted (Y/N); no technical signs of deepfake (Y/N).
4. Save the recording, compute SHA-256, attach to order record. Record reviewer name and timestamp.
5. Any "N" → escalate to senior reviewer for second call or hard-decline.

## flags_thrown

- `video_attestation_no_show` — voucher failed to join after 2 attempts.
- `video_attestation_id_mismatch` — face does not match presented ID, or ID is expired/visibly altered.
- `video_attestation_coaching_detected` — voucher reading from a script, glancing off-camera, or another voice prompting.
- `video_attestation_relationship_incoherent` — voucher cannot answer the two unscripted questions about the customer.
- `video_attestation_deepfake_signal` — vendor synthetic-face score above threshold OR reviewer notices uncanny artifacts.
- `video_attestation_passed` — non-flag, recorded as positive evidence.

## failure_modes_requiring_review

- Voucher genuinely cannot make the time (legitimate friction). Reviewer offers async fallback (notarized written attestation).
- Bad audio/video quality preventing scoring.
- Voucher is in a jurisdiction where on-camera ID display is restricted (some EU privacy regimes).
- Vendor liveness/deepfake API errors out → fall back to reviewer judgment alone, flag as "unaugmented."
- Voucher is a public figure whose face is widely scraped (deepfake risk elevated; demand step-up: a second call with a freshly generated challenge phrase).

## false_positive_qualitative

- **Senior researchers in time zones with little working overlap** (East Asia ↔ US). Multi-week scheduling friction.
- **Vouchers at institutions that prohibit recording of identity-document images** (some German, French, and Swiss employers). Build-path workaround: live read-out without on-camera ID display, plus separate emailed ID copy.
- **Vouchers with disability accommodations** (visually impaired, ASL-only) requiring adapted scripts; reviewer must be trained.
- **Highly cited vouchers who refuse for privacy reasons** (the more legitimate the voucher, the more leverage they have to refuse a video call). Empirically, this skews the false-positive load toward exactly the most-trustworthy vouchers.
- **Vouchers from foreign-language regions** where the reviewer cannot judge naturalness of unscripted answers → translator overhead or false flags.

## record_left

- Recording file (MP4), stored in encrypted bucket with immutable retention (e.g. S3 Object Lock, 7-year retention to match likely SOC audit retention norms).
- SHA-256 hash of the recording, written to the order's audit log.
- Reviewer's structured rubric scores + free-text note.
- For buy path: vendor's audit-log XML (Shufti retains 5–10 years per its product page) and session UUID.
- Calendly meeting metadata (scheduled-at, joined-at, duration) as tamper-evident timing evidence.

## Sources

- [Sumsub Video Identification](https://sumsub.com/video-identification/)
- [Ondato Video Identity Verification](https://ondato.com/identity-verification/video-identity-verification/)
- [Identomat Video KYC](https://www.identomat.com/video-kyc)
- [Shufti Pro Video KYC 2025 guide](https://shuftipro.com/blog/video-kyc-in-2025-what-it-is-how-it-works-and-why-it-matters/)
- [KYCAID Assisted Video Verification](https://kycaid.com/live-video-verification/)
- [Facia.ai deepfake detection](https://facia.ai/)
- [Sensity AI KYC use case](https://sensity.ai/use-cases/kyc/)
- [Jumio pricing overview](https://hyperverge.co/blog/jumio-pricing/)
- [Onfido competitors / pricing context](https://www.au10tix.com/blog/onfido-competitors-top-8-onfido-alternatives/)
