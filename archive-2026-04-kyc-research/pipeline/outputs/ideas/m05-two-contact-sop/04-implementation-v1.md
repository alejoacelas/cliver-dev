# m05-two-contact-sop — implementation research v1

- **measure:** M05 — shipping-institution-association
- **name:** Two-contact directory verification SOP
- **modes:** A (manual reviewer SOP)
- **summary:** Reviewer SOP. When the shipping address↔institution tie is borderline, the reviewer independently obtains TWO contacts from the institution's PUBLIC directory (not from the customer): (1) the institution's main switchboard or biosafety officer, and (2) a departmental contact email scraped from the institution's `.edu`/`.ac.*` site. The reviewer phones channel (1) to confirm the named customer is affiliated and authorized to receive synthesis at the listed shipping address, and emails channel (2) for written confirmation. Both must independently confirm.

- **attacker_stories_addressed:** shell-company, cro-framing, ghost-office, biotech-incubator-tenant, dormant-domain, foreign-institution, visiting-researcher

## external_dependencies

- Public institutional directory (web). No vendor.
- Reviewer time (~20–60 min per case).
- Telephony (any business line; no special vendor).
- Email (institutional review address — should be on a domain the institution can recognize as a screening provider, otherwise the response rate craters).
- Optionally, the [HHS SynNA Guidance 2023](https://aspr.hhs.gov/S3/Documents/SynNA-Guidance-2023.pdf) callback recommendation: HHS recommends contacting the customer's biosafety officer / supervisor / lab director / institutional rep to "confirm the order, verify the customer's and principal user's identity, and verify the legitimacy of the order" — this is the regulatory anchor for the two-contact SOP.
- [IGSC Harmonized Screening Protocol v3.0](https://genesynthesisconsortium.org/wp-content/uploads/IGSC-Harmonized-Screening-Protocol-v3.0-1.pdf) requires providers to "verify independently a) the identity of the potential customer and purchasing organization, and b) that the described use is consistent with the activities of the purchasing organization" — independent verification is the IGSC contract this SOP implements.

## endpoint_details

No endpoint. This is a human SOP with the following structure:

- **Trigger:** Address-association check raised a borderline flag (commercial address that classifies cleanly but has no found public association to the claimed institution; or a virtual-office / coworking / incubator address that needs human disposition; or a foreign address requiring local-language verification).
- **Step 1 — Contact (1) discovery:** Reviewer goes to the institution's `.edu` / official site, navigates to "Contact" / "About" / "Office of Research" / "Biosafety," and records the main switchboard number and one named institutional contact (research compliance, EHS, biosafety officer, departmental administrator). MUST NOT use any number or contact provided by the customer. If only the customer-provided contact exists, the SOP fails — flag escalation.
- **Step 2 — Contact (2) discovery:** Reviewer locates a departmental email on the same `.edu` domain, ideally the named PI's listed lab page or department admin. Same independence rule.
- **Step 3 — Phone call (channel 1):** Reviewer phones switchboard, asks to be routed to research compliance / departmental admin, identifies as a synthesis provider performing routine customer verification, asks: "Is `<named customer>` affiliated with `<department>`? Is `<shipping address>` an authorized receiving location for laboratory consumables for that customer?"
- **Step 4 — Email (channel 2):** Reviewer emails the departmental admin with the same questions; expects a reply from a `@<institution.edu>` address within 5 business days.
- **Step 5 — Disposition:** Both channels confirm → release. One confirms, one silent → re-attempt; if still silent in 5 days, treat as soft-fail (escalate, do not auto-release). One denies → block + report. Both silent in 5 days → block.
- **Auth:** None.
- **Rate limits:** Bounded by reviewer hours. Realistic throughput per FTE reviewer: ~6–10 cases/day [best guess: 30–60 min wall clock per case including phone tag, with a 50% same-day callback rate].
- **Pricing:** Internal labor only.
- **ToS:** None — uses publicly available institutional websites.

## fields_returned

The reviewer produces a structured record:

- `directory_url_used` — URL the contact was scraped from
- `channel1_phone` — number dialed; time of call; person reached (name + title); verbatim Q&A summary
- `channel2_email` — address emailed; time sent; reply time; sender domain on reply; verbatim Q&A summary
- `channel1_outcome` — confirm | deny | unreachable | refused
- `channel2_outcome` — confirm | deny | unreachable | refused
- `disposition` — release | escalate | block

`[best guess: this is the standard playbook a screening compliance team would put in a written SOP; HHS guidance describes the contact step but does not prescribe form fields. Searched for: "DNA synthesis customer screening SOP form fields", "biosafety officer callback verification template gene synthesis"]`

## marginal_cost_per_check

- **Labor:** ~$30–$60/case [best guess: 30–60 minutes of a compliance reviewer at fully loaded ~$60/hr; this matches the [CSR follow-up screening report](https://councilonstrategicrisks.org/2024/05/07/supporting-follow-up-screening-for-flagged-nucleic-acid-synthesis-orders/) characterization of follow-up screening as labor-intensive but not specialized.]
- **Telephony / email:** negligible.
- **setup_cost:** Writing the SOP, training reviewers, building a directory-scrape helper or contact-record template: ~$5K–$20K one-time `[best guess]`.

## manual_review_handoff

This *is* the manual handoff. Output of the SOP is a structured case file appended to the order's audit log (see `record_left`).

Reviewer escalation paths:
- One channel denies → reviewer escalates to senior compliance + flags the order for export-control review.
- Both channels silent past 5 days → reviewer marks order as "verification failed," does not release, sends customer-side notice.
- Customer attempts to "help" by providing an alternative contact → reviewer logs the attempt and ignores it (independence rule).

## flags_thrown

- `two_contact_unconfirmed` — both channels silent
- `two_contact_denied` — at least one channel denied affiliation/authorization
- `two_contact_partial` — one confirm, one silent (escalation, not auto-release)
- `two_contact_independence_failure` — couldn't find a public contact independent of the customer; SOP can't run

Standard human action per flag:
- `two_contact_unconfirmed` → block + customer-side challenge.
- `two_contact_denied` → block + report (likely SAR-equivalent for export controls).
- `two_contact_partial` → senior reviewer disposition.
- `two_contact_independence_failure` → senior reviewer; treat as a strong negative signal for fabricated-institution profiles.

## failure_modes_requiring_review

- Switchboard routes to voicemail; no callback.
- Departmental admin is on leave / has departed.
- Foreign institution: language barrier on phone; reviewer needs a local-language speaker or a translation service.
- Institution has a privacy-suppressed directory (common at small colleges, common in EU under GDPR; also common at clinical sites). No public contact discoverable → SOP can't run as designed.
- Institution policy is to refuse third-party verification requests on principle.
- Reviewer accidentally calls a customer-controlled number (independence failure) — only catchable by training and audit.

## false_positive_qualitative

Legitimate-customer cases this SOP would incorrectly hold up:

- **Small / new labs** where the PI is the only listed contact and is also the customer. There is no second independent person to call.
- **Industry customers** (real biotech employees) at companies with no public switchboard staffed for inbound research-compliance queries; reception will not vouch for an employee's purchase authorization.
- **Visiting researchers / postdocs in the first ~30 days** before the directory updates.
- **Institutions with strong privacy policies** (German universities under GDPR; UK universities; many US small colleges) that suppress individual directory entries by default.
- **Foreign institutions** where the local-language website does not surface a research-compliance contact and the switchboard does not route English-speaking calls.
- **Clinical / hospital labs** where ordering authority is delegated to a procurement office that the directory does not list as such.
- **Core facilities / role accounts** where the customer-of-record is a role mailbox and no individual is listed.

[best guess: these are the obvious thin populations; quantitative coverage handled by stage 6.]

## record_left

Auditable artifact stored alongside the order:
- Screenshot or saved HTML of the institution directory page where contacts were sourced (timestamped).
- Phone log entry: number dialed, time, duration, person reached, verbatim notes.
- Email thread: outbound + inbound, with full headers (preserves the responding institutional domain — primary forensic anchor).
- Disposition record signed by the reviewer.
- Retention: minimum 5 years to align with [BIS export-control recordkeeping requirements (15 CFR Part 762)](https://www.bis.doc.gov/index.php/documents/regulations-docs/2333-part-762-recordkeeping/file) `[best guess on applicability: BIS 762 covers export transactions; gene synthesis providers handling controlled items would need this regardless. Searched for: "BIS recordkeeping 15 CFR 762 retention period"]`.

This is one of the strongest paper-trail artifacts of any check in the pipeline: it captures *human-to-human* attestation and preserves the responding institutional domain.

## bypass_methods_known

(Stage 5 fills.)

## bypass_methods_uncovered

(Stage 5 fills.)
