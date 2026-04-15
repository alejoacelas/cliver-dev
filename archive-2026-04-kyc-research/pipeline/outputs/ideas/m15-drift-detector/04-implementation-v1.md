# m15-drift-detector — Implementation v1

- **measure:** M15 — soc-self-declaration
- **name:** Cross-order SOC drift detector
- **modes:** A
- **summary:** Internal time-series detector that ingests every customer's SOC declarations and screening outputs over time and flags when the customer's declared use, organism, or screening hits drift in a direction associated with escalation toward known threats. Implementation: a streaming change-point detector (River ADWIN/Page-Hinkley) over a feature vector per order, plus a hand-curated set of "concerning trajectories." Pure internal data — no vendor.

## external_dependencies

- Internal order DB (one row per order with SOC declaration fields, sequence-screening output, customer ID, timestamp).
- Open-source streaming-ML library: [River](https://riverml.xyz/) for ADWIN, Page-Hinkley, KSWIN drift detectors ([drift module](https://riverml.xyz/dev/api/drift/ADWIN/)).
- Reviewer queue UI to surface flagged customers and the underlying drift episode.
- Optional: a small labeled training set of known-bad escalation patterns for supervised augmentation `[best guess: not strictly required for change-point detection but improves precision]`.

## endpoint_details

- **Architecture:** in-house service. No external API. Runs as a stream processor over the orders table (e.g. nightly batch or Kafka consumer).
- **Auth model:** internal RBAC; reviewer queue behind SSO.
- **Throughput:** River ADWIN updates are O(log n) per observation; trivially handles synthesis-provider order volumes (largest providers report `[unknown — searched for: "Twist Bioscience annual orders volume", "IDT gene synthesis orders per year"]` but well under 1M/year/customer).
- **Cost:** infrastructure only — one small VM + database storage. No per-check API fee.
- **ToS:** internal data; the only constraint is the provider's own privacy policy on customer data retention.

## fields_returned

Per customer, the detector emits:

- `customer_id`
- `drift_detected_at` (timestamp of the order that tripped the detector)
- `drift_type` — one of: `vocab_shift` (controlled-vocab field values changed), `organism_shift` (host organism family changed), `bsl_escalation` (declared BSL increased), `screening_hit_rate_increase` (rate of sequence-screening flags rose), `concerning_trajectory_match` (matched a hand-curated bad pattern).
- `window_size` and `mean_before` / `mean_after` from the underlying ADWIN window.
- Pointer to the most recent N orders (default 20) for reviewer context.

## marginal_cost_per_check

- ~$0 marginal per order. Compute is negligible — O(log n) update on a streaming detector.
- **setup_cost:** 4–8 engineer-weeks to define the per-customer feature vector (vocab embeddings, organism taxonomy mapping, BSL ordinal), wire River into the order pipeline, build the reviewer queue, and curate an initial set of "concerning trajectories." `[best guess: standard greenfield ML-stream service]`

## manual_review_handoff

When the detector flags a customer:

1. Reviewer pulls the customer's last 20 orders (or the full window) plus the drift summary (which feature shifted, by how much).
2. Reviewer first checks "is this a legitimate research pivot?" — they look for: a published preprint by the customer in the new area, a new grant award, a new collaborator on file, an explanatory note from the customer in any prior order.
3. If yes → close as benign, annotate the drift episode with the explanation, exclude that customer from re-flagging on the same trajectory for N months.
4. If unclear → contact the customer ("we noticed your orders have shifted toward X — could you describe the project?") and route the response to scientific review.
5. If no plausible explanation OR the trajectory matches a curated bad pattern → escalate to scientific review and place a hold on subsequent SOC orders.

## flags_thrown

- `soc_drift_detected` — generic ADWIN/Page-Hinkley change point on the customer's feature stream → reviewer queue.
- `concerning_trajectory_match` — match to a curated bad pattern (e.g., escalating from BSL2 housekeeping genes to BSL3 toxin-adjacent sequences) → priority reviewer queue + scientific review.
- `screening_hit_rate_increase` — the customer's per-order sequence-screening flag rate stepped up significantly → reviewer queue.
- `narrowing_to_known_threat` — feature embedding moved closer to a centroid of historical denied orders → priority queue.

## failure_modes_requiring_review

- Cold-start: customers with <10 orders cannot be drifted against themselves; detector returns no signal.
- Sparse customers: an active customer placing 1 order/quarter generates noisy windows.
- Vocabulary changes in the structured form (e.g. m15-structured-form rev) cause artificial drift across the entire customer base — must be handled with a recalibration event.
- Legitimate research pivots (PI joins new lab, gets a new grant). The base rate of pivots in active labs is high enough that false positives dominate without a triage step. Concept-drift detection in general is sensitive to gradual benign change ([overview](https://identitymanagementinstitute.org/behavioral-drift-detection/)).

## false_positive_qualitative

- Postdocs / new PIs starting in a new direction.
- Core facility accounts whose order mix shifts as their client mix shifts (the account is not a single project).
- CRO accounts that legitimately serve many different research projects — drift is the steady state, not a signal.
- Educational accounts (course materials change semester to semester).
- Accounts that use the m15-structured-form's "other / free text" escape hatch heavily — the detector cannot stream over free text without an embedding step, and embedding noise drives FPs.

## record_left

- Drift event log: customer_id, timestamp, detector type, feature deltas, window contents.
- Reviewer disposition (benign / contacted / escalated / denied) tied to the event.
- Long-term: per-customer drift history that future stage 5 hardening can audit ("did this customer ever previously trip the detector?").

## Notes on detector choice

- ADWIN is the canonical streaming change detector with mathematical guarantees ([River ADWIN docs](https://riverml.xyz/dev/api/drift/ADWIN/)); good for the per-customer feature mean of a low-dimensional vector.
- Page-Hinkley is a CUSUM-style detector ([River Page-Hinkley docs](https://riverml.xyz/dev/api/drift/PageHinkley/)); better for slow gradual escalation where ADWIN's window may smooth over the change.
- Run both in parallel and OR their outputs `[best guess: standard practice for orthogonal-strength detectors in concept-drift literature]`.

## Why this is M15-relevant

The attacker stories under M15 (`gradual-legitimacy-accumulation`, `cro-identity-rotation`, `lab-manager-voucher` with vague declarations) each rely on a *consistent* declaration over time. A drift detector flips that: the attacker who suddenly escalates from benign declarations to SOC-adjacent ones gets caught, while the attacker who maintains a long, consistent fake history is *not* caught (this is a known structural gap — see [biosecurityhandbook.com on cross-order pattern detection](https://biosecurityhandbook.com/biotechnology/dna-synthesis-screening.html)).
