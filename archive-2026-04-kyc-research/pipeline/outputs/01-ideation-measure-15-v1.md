# Stage 1 — Ideation, Measure 15 (SOC self-declaration), v1

Measure: customer declares whether order contains a SOC and intended use; declaration is cross-checked against sequence-screening output; misalignment escalates. Engagement is via cover stories, vague free text, exemption framings, and alignment-by-construction.

Generation modes used: Direct (D), Attacker-driven (A).

---

## 1. Mandatory structured SOC declaration field in checkout (IGSC-aligned)

- **Modes:** D, A
- **Summary:** Replace optional free-text "intended use" box with a hard-gated checkout form. Fields: (a) "Does this order contain or encode a Sequence of Concern as defined in the IGSC Harmonized Screening Protocol v2.0?" Yes/No/Unsure radio; (b) intended-use category dropdown drawn from a fixed taxonomy (e.g., "diagnostic assay positive control," "vaccine antigen R&D," "structural biology," "teaching," "exempt — non-coding," "other — describe"); (c) target organism dropdown (NCBI Taxonomy ID lookup widget); (d) BSL containment level the work will occur in (BSL-1/2/3/4); (e) free-text justification (≤500 chars) only as supplement, not substitute. Order cannot submit until all required fields populated. Produces structured tokens that can be machine-compared to screening output.
- **Attacker stories addressed:** lab-manager-voucher, unrelated-dept-student, bulk-order-noise-cover (forces per-order specificity instead of facility boilerplate)
- **External dependencies:** internal e-commerce / LIMS form layer; NCBI Taxonomy as taxonomy source; IGSC HSP v2.0 [best guess: current version] as the SOC definition reference shown to the customer
- **Manual review handoff:** none unless cross-check fails downstream
- **Flags thrown:** "Unsure" on (a) → routes to triage analyst before screening. Free-text "other — describe" entries → routed to NLP step (idea 2).
- **Failure modes requiring review:** customer selects "exempt — non-coding" but screening finds a coding hit → escalate; taxonomy widget returns no match → manual taxonomy assignment.
- **Record left:** structured per-order JSON declaration record with timestamp, user, IP, IGSC HSP version shown.
- Other fields: # stage 4

## 2. LLM extraction of intended-use free text into structured frame

- **Modes:** D, A
- **Summary:** When the customer fills the intended-use free-text box, run a server-side LLM (e.g., Claude or GPT-4-class) with a constrained JSON schema prompt to extract: (i) target organism / pathogen, (ii) gene or protein names mentioned, (iii) functional class claimed (toxin, antigen, enzyme, regulator, structural), (iv) experiment type (in vitro, in vivo, cell culture, synthetic biology), (v) claimed exemption category, (vi) confidence score. The structured frame becomes the comparable object for the cross-check. Vague/uninterpretable inputs ("research purposes", "molecular biology") get a low confidence score and flag.
- **Attacker stories addressed:** lab-manager-voucher (M9 vague free text), unrelated-dept-student (M4 Bypass E "research purposes")
- **External dependencies:** Anthropic or OpenAI API; internal prompt + schema; gene/protein name normalization to UniProt or HGNC [best guess]
- **Manual review handoff:** if LLM confidence <0.6 or required slot empty → triage analyst gets the original text and the LLM frame side-by-side; analyst either fills the frame or rejects with templated "please describe target organism and intended experiment" customer email.
- **Flags thrown:** vague-declaration flag (low confidence); empty-slot flag (required field unrecoverable); contradiction flag (LLM-extracted organism ≠ screening-hit organism family).
- **Failure modes requiring review:** LLM hallucination (organism guessed when not stated) — mitigate by requiring verbatim span citation; API outage → fallback to manual analyst frame.
- **Record left:** original text + LLM JSON frame + model + version + prompt hash, stored alongside order.
- Other fields: # stage 4

## 3. Deterministic cross-reference of declaration vs IGSC HSP screening output

- **Modes:** D, A
- **Summary:** Define the comparison surface explicitly. Sequence screening (in-house BLAST against the IGSC Harmonized Screening Protocol regulated-pathogen database; or vendored equivalent) returns: matched pathogen taxon, matched gene/protein (e.g., botulinum neurotoxin A), match length, match identity, regulated-list source. The cross-check SOP runs a rules table: (i) screening returns regulated hit AND customer declared "no SOC" → STOP, escalate to Tier-2 biosecurity reviewer; (ii) screening returns hit on organism X AND customer declaration's extracted organism ≠ X family (per NCBI Taxonomy parent walk) → REVIEW; (iii) screening returns hit on functional class Y (toxin) AND customer's extracted functional class ≠ Y → REVIEW; (iv) customer claims exemption AND screening returns hit on Select Agent → STOP; (v) full alignment → pass to next gate.
- **Attacker stories addressed:** lab-manager-voucher, unrelated-dept-student, inbox-compromise, shell-company (catches exemption claims that conflict with screening hits)
- **External dependencies:** sequence-screening pipeline (in-house or Aclid / Battelle UltraScreen / SecureDNA); NCBI Taxonomy for parent walks; rules table maintained by biosecurity team
- **Manual review handoff:** Tier-2 biosecurity reviewer receives the screening hit, the structured declaration, the rule that fired, and templated decision options (Approve, Approve-with-customer-clarification, Hold, Refuse-and-report).
- **Flags thrown:** as enumerated in rules table.
- **Failure modes requiring review:** screening pipeline timeout → queue order; LLM frame missing organism → escalate to triage.
- **Record left:** rule fired, both inputs, reviewer decision, timestamp, reviewer ID.
- Other fields: # stage 4

## 4. Vendor sequence-screening API integration: Aclid

- **Modes:** D
- **Summary:** Use Aclid's screening API [best guess on product name] as the screening source whose JSON output gets compared to the customer declaration. Aclid returns regulated hits with taxon and functional annotation; those become the canonical "what the screen says" half of the cross-check.
- **Attacker stories addressed:** lab-manager-voucher, unrelated-dept-student, account-hijack (provides the screening half of the cross-check; doesn't catch alignment-by-construction by itself)
- **External dependencies:** Aclid screening API
- **Manual review handoff:** see idea 3
- **Flags thrown:** Aclid HIT + declaration NONE
- **Failure modes requiring review:** API rate limit, API down, ambiguous match (low identity)
- **Record left:** Aclid request ID, response JSON, hash
- Other fields: # stage 4

## 5. Vendor sequence-screening API integration: Battelle UltraScreen

- **Modes:** D
- **Summary:** Same role as idea 4 but using Battelle's UltraScreen [best guess product name] as the screening backend. Listed separately because vendors differ on functional-class annotations (toxin vs adjacent gene), which changes what "alignment" with a customer declaration even means.
- **Attacker stories addressed:** same as idea 4
- **External dependencies:** Battelle UltraScreen API
- **Manual review handoff:** see idea 3
- **Flags thrown:** as idea 4
- **Failure modes requiring review:** as idea 4
- **Record left:** Battelle request ID + response
- Other fields: # stage 4

## 6. Vendor sequence-screening API integration: SecureDNA

- **Modes:** D
- **Summary:** Same role as ideas 4–5 using SecureDNA's hashed-screening protocol. SecureDNA returns regulated/not-regulated and (for hits) a regulated-list category, with privacy guarantees on the query. The category becomes the comparator against the customer's declared functional class.
- **Attacker stories addressed:** same as 4
- **External dependencies:** SecureDNA service
- **Manual review handoff:** see idea 3
- **Flags thrown:** SecureDNA HIT category ≠ declared functional class
- **Failure modes requiring review:** hashed-screening false positive on benign sequence; service outage
- **Record left:** SecureDNA receipt token (cryptographic), retained
- Other fields: # stage 4

## 7. Daily batch reconciliation report: declared-vs-screened

- **Modes:** D, A
- **Summary:** Nightly job emits a CSV/Looker dashboard of all orders processed in the prior 24h with columns: order ID, customer, declared SOC (Y/N), declared organism, declared functional class, screening result, screening organism, screening functional class, alignment verdict (PASS/SOFT-FAIL/HARD-FAIL), reviewer disposition. Surfaces drift (customer X never declares SOC but consistently has soft hits), base-rate dilution (a single facility account responsible for 80% of generic boilerplate declarations), and declaration-template re-use across nominally distinct customers.
- **Attacker stories addressed:** bulk-order-noise-cover (catches base-rate dilution at the facility account), it-persona-manufacturing (catches identical-template declarations across personas at one institution), cro-identity-rotation (catches matching declaration templates across CRO personas), gradual-legitimacy-accumulation (longitudinal view exposes the late shift to SOC orders)
- **External dependencies:** internal data warehouse; BI tool (Looker / Metabase); biosecurity team to staff the weekly review
- **Manual review handoff:** weekly biosecurity-team standup reviews the dashboard; any account with >N soft-fail rows in 30d is added to enhanced-review queue.
- **Flags thrown:** repeat-vague-declarer; template-clone across customers; first-ever SOC order from an established account.
- **Failure modes requiring review:** dashboard pipeline failure; reviewer absent.
- **Record left:** dashboard snapshot per week; enhanced-review-queue additions logged with reason.
- Other fields: # stage 4

## 8. Discrepancy-escalation playbook: tiered SOP with templated customer outreach

- **Modes:** D, A
- **Summary:** Written SOP defining tiers. Tier-1 (analyst, ≤30 min): if soft-fail, send templated clarification email ("Your declared use mentions X; the synthesized sequence aligns to Y. Please clarify the relationship between X and Y and your IBC protocol number"). Tier-2 (biosecurity officer, ≤24h): if hard-fail or no satisfactory Tier-1 response, hold order, request institutional contact (PI email, IBC chair email), require written attestation referencing a verifiable IBC protocol number. Tier-3 (CISO + legal, ≤72h): if Tier-2 response is unverifiable or evasive, refuse order, file Suspicious Activity Report under the IGSC framework, notify FBI WMD coordinator [best guess channel]. Templated emails, decision trees, escalation contacts in a runbook.
- **Attacker stories addressed:** lab-manager-voucher, unrelated-dept-student, insider-recruitment, inbox-compromise, account-hijack (a templated SOP forces independent verification of IBC claims rather than accepting self-attestation)
- **External dependencies:** internal SOP doc; ticket system (Jira / ServiceNow); FBI WMD field-coordinator contact list [best guess]
- **Manual review handoff:** the SOP itself is the handoff; analyst → officer → CISO+legal.
- **Flags thrown:** soft-fail, hard-fail, evasive-response, refusal-and-report.
- **Failure modes requiring review:** customer non-response → auto-escalate after 5 business days; institutional contact unreachable.
- **Record left:** ticket with full thread; SAR if filed.
- Other fields: # stage 4

## 9. Independent IBC-protocol-number verification SOP

- **Modes:** A
- **Summary:** When a customer's declaration cites an IBC protocol number ("covered by IBC #2024-117") as exemption justification, an analyst calls or emails the institution's published IBC office (from the institution's official website, not from the customer-supplied contact) and asks: (i) does protocol #2024-117 exist; (ii) does it cover the declared organism / functional class; (iii) is the customer named on it. Required for any declaration that invokes an IBC protocol as cross-check shield.
- **Attacker stories addressed:** insider-recruitment (M9 Option 3 "self-attest covered by IBC protocol"), it-persona-manufacturing (lifted IBC letters), inbox-compromise (fabricated IBC documents)
- **External dependencies:** institutional IBC office contact (looked up via institutional website, not customer-supplied)
- **Manual review handoff:** biosecurity analyst owns the call; IBC office's verbal + written confirmation logged.
- **Flags thrown:** IBC office cannot confirm protocol exists → HARD-FAIL; protocol exists but doesn't cover declared scope → SOFT-FAIL with customer clarification; customer not on protocol → HARD-FAIL.
- **Failure modes requiring review:** IBC office unresponsive (>5 business days) → hold order, escalate to CISO.
- **Record left:** call notes, email confirmation, screenshot of institutional IBC page used to source contact.
- Other fields: # stage 4

## 10. Exemption-claim hard gate: structured exemption taxonomy

- **Modes:** A
- **Summary:** "Exemption" cannot be a free-text claim. Customer must select from a closed list of exemption categories drawn from the Select Agent Regulations (42 CFR 73 / 9 CFR 121 / 7 CFR 331 — exclusions and permissible toxin amounts), the HHS Screening Framework Guidance, and the IGSC HSP exclusions list. Each exemption category has prerequisites the customer must attest to (e.g., "non-functional fragment <200bp," "permissible toxin amount <100mg LD50 equivalents", "killed-vaccine strain on the published exclusion list"). The cross-check then verifies prerequisites against the screening output (e.g., screening returned a hit ≥200bp → "non-functional fragment" exemption is invalid).
- **Attacker stories addressed:** inbox-compromise (M5 "claim exemption"), shell-company (Method 5 "claim exemption")
- **External dependencies:** legal/regulatory team to maintain the exemption taxonomy; Select Agent regs + HHS guidance as canonical source
- **Manual review handoff:** any selected exemption with screening-output prerequisites unmet → biosecurity officer.
- **Flags thrown:** exemption-prerequisite-violated; "other exemption" free text (forbidden).
- **Failure modes requiring review:** new exemption category needed → blocked until taxonomy team reviews.
- **Record left:** selected exemption code, attested prerequisites, screening output verifying or violating them.
- Other fields: # stage 4

## 11. Cover-story consistency cross-check across measures (M4/M9/M15 unification)

- **Modes:** A
- **Summary:** A meta-check that pulls the customer's M4 publication-seeded research area, M9 biosafety plan scope, and M15 declared use into one record and runs a consistency rules engine: do they reference the same organism family? Same functional class? Same BSL? Mismatch in any pair triggers review. Aimed at catching the alignment-by-construction stories where attackers force consistency at order time but slip on cross-document granularity (e.g., biosafety plan is BSL-2 but the declared experiment requires BSL-3 for the screened organism).
- **Attacker stories addressed:** cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, biotech-incubator-tenant, dormant-account-takeover
- **External dependencies:** outputs of M4 and M9 checks must be structured (not just stored as PDFs); rules engine
- **Manual review handoff:** biosecurity officer reviews any inconsistency with all three documents side-by-side.
- **Flags thrown:** organism mismatch; functional-class mismatch; BSL mismatch; declared scope outside biosafety-plan scope.
- **Failure modes requiring review:** structured M4/M9 outputs missing → fall back to manual reading.
- **Record left:** unified per-customer scope record.
- Other fields: # stage 4

## 12. Longitudinal declaration-drift detector

- **Modes:** A
- **Summary:** Per-account rolling profile of declared organisms and functional classes. Alerts when an account that has declared "molecular biology, E. coli expression" for 2 years suddenly declares "BSL-3 viral antigen R&D" — the kind of step-change associated with hijacked accounts, dormant-account takeover, and gradual-legitimacy lifecycles.
- **Attacker stories addressed:** account-hijack, dormant-account-takeover, gradual-legitimacy-accumulation
- **External dependencies:** internal order history DB
- **Manual review handoff:** biosecurity officer gets the account's 24-month declaration timeline + the new declaration; decision options: pass (with note), hold for clarification, hold for institutional re-verification.
- **Flags thrown:** organism step-change; functional-class step-change; BSL step-change.
- **Failure modes requiring review:** new account (no history) → not applicable; baseline window <90d → low-confidence alert.
- **Record left:** drift-event record with before/after profile.
- Other fields: # stage 4

## 13. Sponsor-attestation requirement for visiting-researcher framings

- **Modes:** A
- **Summary:** When a customer self-identifies as a visiting researcher or sponsored collaborator, require an out-of-band sponsor attestation: an email from the sponsoring PI's verified institutional address (verified via institutional directory, not customer-supplied) confirming the visit dates, the research scope, and the SOC use. Without the attestation the order does not enter the cross-check at all.
- **Attacker stories addressed:** visiting-researcher
- **External dependencies:** institutional directory lookup (e.g., institution website / ROR + email pattern)
- **Manual review handoff:** analyst confirms email comes from the verified address; logs the thread.
- **Flags thrown:** sponsor email from non-institutional domain → reject; sponsor never replies → reject after 10 business days.
- **Failure modes requiring review:** institution publishes no directory → escalate to officer.
- **Record left:** sponsor email thread, directory snapshot.
- Other fields: # stage 4

## 14. Per-order (not per-account) declaration enforcement

- **Modes:** A
- **Summary:** Block accounts (especially shared facility accounts) from re-using a stored declaration template across orders. Each order requires a fresh structured declaration tied to its specific sequences. Designed to defeat the bulk-order noise-cover pattern where one boilerplate declaration legitimizes hundreds of orders.
- **Attacker stories addressed:** bulk-order-noise-cover
- **External dependencies:** checkout form layer; account-type metadata (facility vs individual)
- **Manual review handoff:** none unless cross-check fails downstream.
- **Flags thrown:** identical declaration text on >N orders in 24h from facility account → review.
- **Failure modes requiring review:** legitimate template re-use complaint from customer → biosecurity officer adjudicates.
- **Record left:** per-order declaration hash + diff vs prior order.
- Other fields: # stage 4

## 15. Hijack-detection cross-check: declaration provenance vs account behavior baseline

- **Modes:** A
- **Summary:** Compare declaration-time signals (browser fingerprint, IP geolocation, time-of-day, typing cadence in the free-text field) to the account's baseline. When the declaration is content-aligned with the screening hit but the provenance is anomalous, route to a hijack-suspicion review independent of the cross-check itself. Acknowledges that for account-hijack the declaration content is correct — the anomaly is who wrote it.
- **Attacker stories addressed:** account-hijack
- **External dependencies:** behavioral analytics (Sift, Castle, or in-house); session telemetry
- **Manual review handoff:** fraud analyst reviews session evidence; if confirmed anomalous, freezes account and contacts the PI via institutional directory email (not customer-supplied).
- **Flags thrown:** geo-impossible login; new device + first-ever SOC declaration; declaration submitted outside historical hours.
- **Failure modes requiring review:** legitimate travel; legitimate device change.
- **Record left:** session telemetry record + decision.
- Other fields: # stage 4

---

## Dropped

(none in v1)
