# m20-live-video-attestation — implementation v2

- **measure:** M20 (voucher-legitimacy-soc)
- **name:** Live video attestation with per-order content attestation and challenge questions
- **modes:** A (manual reviewer) — optional augmentation by deepfake-detection vendor
- **summary:** Provider compliance ops conducts a live video call with the registered voucher. v2 addresses Critical findings C1 (rubber-stamping by legitimate vouchers) and C2 (no per-order content requirements) by adding: (1) mandatory per-order attestation content where the voucher must state SOC-specific details (sequence names, intended use, customer's role); (2) challenge questions that test whether the voucher has actually reviewed the order; (3) video-session recording as deterrent with explicit accountability framing.

## Changes from v1 addressing Critical Findings C1 and C2

**C1 said:** Video attestation verifies the voucher's *identity* (real person, real ID, real relationship knowledge) but does NOT verify whether the voucher has actually scrutinized the specific SOC order. The two unscripted questions test relationship knowledge, not order content review. Rubber-stamping by real, trusted vouchers passes cleanly.

**C2 said (part of C1 suggestion):** No per-order attestation content is required. The voucher is verified once (per-onboarding), not per-order. Batch rubber-stamping is unaffected.

**v2 response — three hardening layers:**

### Layer 1: Mandatory per-order attestation content

The voucher must, on each SOC order, provide a **per-order digital attestation** that includes order-specific content. Two modes:

**Mode A — Full video attestation (for first-time vouchers or high-risk orders):**
On the live video call, the voucher must:
1. State their full name and institutional affiliation.
2. State the customer's name and the customer's institutional role/position.
3. **State the SOC name or gene name(s) from the order.** The reviewer provides the order details to the voucher in advance (sent to the voucher's verified institutional email 24h before the call); the voucher must read them back and explain, in their own words, why the customer needs these specific sequences for their stated research.
4. **State the intended use** of the ordered sequences (e.g., "for a CRISPR knockout study in cell line X" or "for protein expression in E. coli for structural biology work").
5. Affirm that they have reviewed the order and believe the customer has a legitimate scientific need.

**Mode B — Per-order digital sign-off (for established vouchers on subsequent orders):**
After the initial full video attestation (Mode A), subsequent SOC orders from the same customer-voucher pair can use a lightweight digital attestation form instead of a repeat video call. The form requires:
1. Voucher logs in via institutional SSO or verified email link (DMARC-aligned).
2. Voucher reviews the order summary (SOC names, quantities, intended use as stated by the customer).
3. Voucher must type (not copy-paste) the SOC name and the intended use in free-text fields. This is a minimal cognitive-engagement check — typing forces reading.
4. Voucher signs a digital declaration: "I have reviewed order [order-ID] and affirm that [customer-name] has a legitimate scientific need for the sequences listed above for the stated purpose."
5. Timestamp + IP + browser fingerprint recorded.

**Re-attestation cadence:** Mode A (full video) required at voucher onboarding and annually thereafter. Mode B (digital sign-off) required for *every* SOC order. If a voucher's Mode B sign-offs show a pattern of rubber-stamping (e.g., <30 seconds between form load and submission for >3 consecutive orders), the system auto-escalates the next order to Mode A.

### Layer 2: Challenge questions that test order scrutiny

During Mode A video calls, the reviewer asks **order-specific challenge questions** in addition to the v1 relationship questions. These test whether the voucher has actually reviewed the order:

1. **"What sequences or genes are in this order?"** — The voucher must name at least one SOC from the order without looking at notes. (They received the order summary 24h earlier.)
2. **"Why does [customer] need [specific SOC name]? What is the experiment?"** — The voucher must provide a coherent scientific rationale. The reviewer is not expected to evaluate the science but to assess whether the answer is substantive vs. a vague "for their research."
3. **"Is there anything about this order that gave you pause or that you want to flag?"** — An open-ended accountability question. The recording serves as deterrent: the voucher is on record saying "no concerns" about a specific order. If the order later turns out to be problematic, the recording is evidence that the voucher affirmatively dismissed concerns.

During Mode B digital sign-offs, the form includes a randomized challenge:
- One of: "In one sentence, describe the experiment this order supports" / "Name one gene in this order from memory" / "What cell line or organism will these sequences be used in?"
- The response is logged. Short or nonsensical answers trigger auto-escalation to Mode A.

### Layer 3: Video-session recording as accountability deterrent

v1 already included recording. v2 makes the deterrent framing explicit:

1. **At the start of every Mode A call, the reviewer reads a standardized accountability statement:** "This call is being recorded and will be retained as part of the order's compliance record. If this order is later found to involve misuse of sequences of concern, this recording may be reviewed by the provider's biosecurity team, by regulators, or in legal proceedings. Do you wish to proceed?" The voucher must verbally affirm.
2. **The recording is hash-linked to the specific order** (not just to the voucher's general file). Each SOC order has its own recording reference or digital sign-off reference.
3. **Retention:** 7 years (consistent with SOC audit retention norms from v1).
4. **Deterrent effect:** The explicit framing converts the video call from a "verification formality" to an "on-the-record accountability event." A PI who would have rubber-stamped a checkbox or email approval now has their face, voice, and order-specific statements on a recording with an explicit liability framing. This does not prevent a determined co-conspirator from proceeding, but it substantially raises the perceived personal risk for the rubber-stamping-by-inattention class of vouchers.

### Self-vouching deconfliction (addressing M1 from v1)

**New rule:** The orderer and the voucher must be different natural persons, verified by comparing government ID names (from M14 identity verification for the orderer and from the video attestation ID check for the voucher). If the orderer and voucher share the same government ID, the attestation is rejected and a different voucher is required.

## external_dependencies

Same as v1, plus:
- Digital attestation form platform (e.g., DocuSign, internal web form with institutional SSO integration).
- Rubber-stamping detection logic (timestamp analysis on Mode B form submissions).
- Order-detail distribution to voucher (automated email with SOC names and order summary, sent to voucher's verified institutional email).

## endpoint_details

Same as v1 for the video-call and vendor paths. No new external API endpoints.

The Mode B digital sign-off form is an internal platform component:
- Auth: institutional SSO or DMARC-aligned email magic link.
- Fields: order ID, SOC names (auto-populated, read-only), free-text intended-use field (voucher must type), challenge-question response, digital signature, timestamp.
- Storage: linked to the order's compliance record.

## fields_returned

Same as v1 for vendor session results.

**New — per-order attestation record (Mode A):**
- `attestation_mode`: `video` | `digital_signoff`
- `order_id` referenced
- `soc_names_stated`: verbatim (from transcript or reviewer notes)
- `intended_use_stated`: verbatim
- `challenge_question_asked` and `challenge_response_summary`
- `accountability_statement_affirmed`: boolean
- `recording_hash` (linked to this specific order)
- `reviewer_rubric_scores` (v1 rubric + new per-order-content rubric items)

**New — per-order attestation record (Mode B):**
- `attestation_mode`: `digital_signoff`
- `order_id` referenced
- `soc_names_typed`: free-text as entered by voucher
- `intended_use_typed`: free-text
- `challenge_response`: free-text
- `form_load_timestamp`, `form_submit_timestamp` (for rubber-stamping detection)
- `digital_signature` and `ip_address`

## marginal_cost_per_check

- **Mode A (full video):** Same as v1: ~$25-30 per attestation (15-min call + 10-min write-up). Occurs at voucher onboarding + annually + on auto-escalation.
- **Mode B (digital sign-off):** ~$2-5 per order [best guess: 5 min of reviewer time to review the submitted form, at $60/hr fully loaded = ~$5; lower if automated screening catches obvious rubber-stamping]. This is the per-SOC-order cost.
- **Total for a typical customer with established voucher:** ~$25-30/year (annual Mode A) + ~$5 per SOC order (Mode B). For a customer placing 10 SOC orders/year: ~$75-80/year.
- **Setup cost:** v1 estimate ($20-40K) + ~$10-15K for Mode B form platform, rubber-stamping-detection logic, and order-detail distribution automation. Total: **$30-55K**.

## manual_review_handoff

**Mode A — updated from v1:**
1. Same scheduling flow as v1 (Calendly link, 15-min slot).
2. 24h before the call, send the order summary (SOC names, quantities, customer-stated intended use) to the voucher's verified institutional email.
3. On the call:
   a. Read the accountability statement. Voucher affirms.
   b. Gov ID check (same as v1).
   c. **New:** Voucher states the SOC names and intended use (Layer 1).
   d. **New:** Reviewer asks the three challenge questions (Layer 2).
   e. Relationship questions from v1 (unchanged).
4. Reviewer scores against updated rubric:
   - ID matches face (Y/N) — v1
   - Claims are coherent (Y/N) — v1
   - Voucher does not appear coached/scripted (Y/N) — v1
   - No technical signs of deepfake (Y/N) — v1
   - **New:** Voucher correctly named SOC(s) from the order (Y/N)
   - **New:** Voucher provided substantive intended-use explanation (Y/N)
   - **New:** Challenge-question responses were coherent and non-evasive (Y/N)
5. Save recording, compute SHA-256, link to specific order ID. Record all rubric scores.
6. Any "N" on new items → escalate: hold the order pending second reviewer or request a different voucher.

**Mode B — new:**
1. Voucher receives email with order summary + link to digital sign-off form.
2. Voucher logs in, reviews order, types SOC names and intended use, answers challenge question, signs.
3. System checks submission timing. If <30 seconds from load to submit on >3 consecutive orders, auto-flag `voucher_rubber_stamping_detected` and escalate next order to Mode A.
4. Reviewer spot-checks Mode B submissions (e.g., 20% random sample reviewed for coherence).

## flags_thrown

Same as v1, plus:
- `voucher_soc_content_failed` — voucher could not name the SOCs or provide a coherent intended-use explanation during Mode A. Action: hold order; request different voucher.
- `voucher_challenge_failed` — voucher's challenge-question responses were incoherent or evasive. Action: hold order; escalate.
- `voucher_rubber_stamping_detected` — Mode B timing analysis detected pattern of <30s form submissions. Action: escalate next order to Mode A; flag voucher for review.
- `voucher_self_vouch_blocked` — orderer and voucher share same government ID. Action: reject attestation; require different voucher.
- `voucher_accountability_declined` — voucher declined the accountability statement. Action: attestation cannot proceed; order held.

## failure_modes_requiring_review

Same as v1, plus:
- **Voucher cannot name SOCs because the order is too large or complex** (e.g., 50 sequences in one order). Mitigation: for orders >10 SOCs, the voucher is asked to name 3 representative ones and explain the project-level rationale rather than enumerating all.
- **Mode B challenge question generates false positives** for legitimate researchers who are not the PI (e.g., a lab manager vouching for a technician's order may not know the specific cell line). Mitigation: allow "I don't know — the PI would know" as a valid response, but flag for Mode A escalation.
- **Rubber-stamping detection threshold is too sensitive or too lenient.** The 30-second / 3-consecutive-order threshold is a starting point [best guess: may need calibration based on actual submission-time distributions after deployment].

## false_positive_qualitative

Same as v1, plus:
- **Vouchers for large orders** who cannot name all SOCs (mitigated by the 3-representative-SOCs rule for >10 SOC orders).
- **Vouchers who are PIs with many students** — may not remember every student's specific experimental details. The challenge questions are designed to accept "project-level" answers, not just "order-level" answers.
- **Established, legitimate vouchers** who find Mode B tedious and perceive it as distrust. This is a deliberate tradeoff: the friction *is* the point for the rubber-stamping deterrent.

## record_left

Same as v1, plus:
- Per-order attestation record (Mode A or Mode B) linked to the specific order ID.
- Rubber-stamping detection logs (form timing data).
- Accountability-statement affirmation (audio in recording for Mode A; checkbox for Mode B).
- Self-vouching deconfliction check result.

## Sources

Same as v1, plus:
- No new external sources required; the v2 additions are SOP design changes, not new vendor integrations.
