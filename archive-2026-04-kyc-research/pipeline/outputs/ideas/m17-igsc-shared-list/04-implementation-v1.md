# m17-igsc-shared-list — implementation v1

- **measure:** M17 (pre-approval-list)
- **name:** IGSC shared customer list + member CRM rollup
- **modes:** A
- **summary:** Use the International Gene Synthesis Consortium (IGSC) member-to-member information-sharing channel to flag customers known by other IGSC members to be problematic, combined with an internal CRM rollup of the customer's prior order/approval/flag history at this provider. Signal: "this customer (or near-match) has been flagged by another IGSC member, or has a non-clean internal history."

## external_dependencies

- **IGSC membership.** The provider must be one of the ~40+ IGSC member companies that subscribe to the [Harmonized Screening Protocol v3.0](https://genesynthesisconsortium.org/wp-content/uploads/IGSC-Harmonized-Screening-Protocol-v3.0-1.pdf). Membership is industry-gated; non-members cannot use the channel.
- **IGSC information-sharing mechanism.** A member-to-member channel for surfacing suspicious customers. Public sources confirm it exists but describe it as "rarely used" ([Crawford/RAND, 2024](https://www.rand.org/content/dam/rand/pubs/research_reports/RRA3300/RRA3329-1/RAND_RRA3329-1.pdf); [Council on Strategic Risks, 2024](https://councilonstrategicrisks.org/2024/05/07/supporting-follow-up-screening-for-flagged-nucleic-acid-synthesis-orders/)).
- **Internal CRM / order-history database** of the provider, with prior screening verdicts attached to customer records.

## endpoint_details

- **URL / interface:** `[unknown — searched for: "IGSC shared customer list API", "International Gene Synthesis Consortium information sharing portal", "IGSC member portal flagged customers", "IGSC harmonized protocol customer database endpoint"]`. No public API or portal URL is documented. The mechanism is described in policy literature only ([IBBIS 2025 white paper](https://ibbis.bio/wp-content/uploads/2025/11/IBBIS_Whitepaper_2025_Implementing-Emerging-Customer-Screening-Standards-for-Nucleic-Acid-Synthesis.pdf); [Council on Strategic Risks, 2024](https://councilonstrategicrisks.org/2024/05/07/supporting-follow-up-screening-for-flagged-nucleic-acid-synthesis-orders/)).
- `[best guess: based on the "rarely used" framing in multiple secondary sources, the mechanism is likely an ad-hoc channel — email list, IGSC officer relay, or member-to-member phone calls — rather than a queryable API or shared database. Implementation almost certainly involves a human-to-human notification, not a programmatic lookup.]`
- **Auth model:** IGSC membership credential / identified IGSC liaison contact. `[vendor-gated — IGSC publishes its member roster and the protocol but not the operational sharing mechanism; would require IGSC liaison contact to confirm the actual handoff format.]`
- **Rate limits / pricing:** No public information. `[best guess: $0 marginal cost beyond IGSC dues, since the channel is member-to-member; IGSC dues amount is not publicly disclosed.]`
- **ToS constraints:** Antitrust and data-protection (GDPR / state biometric laws) are the load-bearing constraints — sharing customer PII between competitors is the central reason the channel is "rarely used" per [Crawford/RAND, 2024](https://www.rand.org/content/dam/rand/pubs/research_reports/RRA3300/RRA3329-1/RAND_RRA3329-1.pdf). `[best guess: in practice members likely share narrow facts (name, organization, modus operandi) rather than full customer records, to stay within competition-law safe harbors.]`
- **Internal CRM side:** standard internal database query against the provider's own customer table; no external endpoint.

## fields_returned

For the IGSC channel: `[unknown — searched for: "IGSC shared list fields", "IGSC information sharing format", "gene synthesis consortium customer alert format"]`. No public documentation of what data is exchanged.

`[best guess: when used, the channel likely transmits the customer's name, claimed organization, claimed shipping address, claimed institutional email, and a brief narrative of why the originating member flagged them. This is the minimum payload needed to be useful and the maximum that's plausibly defensible under antitrust.]`

For the internal CRM rollup, fields are provider-controlled and would include at minimum:
- prior order count, dates, and dollar value
- prior screening verdicts (clean / yellow / red flag) per [Council on Strategic Risks, 2024](https://councilonstrategicrisks.org/2024/05/07/supporting-follow-up-screening-for-flagged-nucleic-acid-synthesis-orders/) flag taxonomy
- prior IBC / institutional verification artifacts on file
- any prior law-enforcement reports filed against this customer

## marginal_cost_per_check

- **IGSC channel:** `[best guess: $0 incremental per check if implemented as a passive watchlist (the provider receives alerts when other members file them, stores them locally, and matches incoming customers against the local cache). If implemented as outbound query per customer, the cost is the human-time of the IGSC liaison answering, which is not a per-check API cost.]`
- **Internal CRM:** `[best guess: <$0.01 per check — a database lookup against the provider's own customer table.]`
- **Setup cost:** IGSC membership dues `[unknown — searched for: "IGSC membership cost", "International Gene Synthesis Consortium dues"]`. `[best guess: industry consortium dues for ~40 members are typically in the $5-50K/year range.]`

## manual_review_handoff

When `igsc_flagged` or `internal_history_concerning` fires, the screening reviewer should:

1. Pull the IGSC alert payload (or local mirror entry) and the internal CRM record side-by-side.
2. Check whether the match is exact (same name + same email + same shipping address) or fuzzy (one of these matches).
3. For exact matches: escalate to the provider's biosecurity officer, who contacts the originating IGSC member liaison directly to confirm the flag is still active and learn what the originating concern was. Decision: deny order, hold for further review, or release with monitoring.
4. For fuzzy matches: document the match dimensions, request additional KYC artifacts from the customer (institutional email re-verification, second contact at the institution), and re-screen.
5. For internal history flags: pull the prior screening verdict reason. If a prior order was released after follow-up that resolved cleanly, the new order can ride on that resolution unless the underlying facts changed; if a prior order was denied, the new order is denied by default unless the customer's circumstances have demonstrably changed.
6. Log decision, reasoning, and the IGSC liaison contact (if used) in the customer record.

## flags_thrown

- `igsc_flagged` — customer matches an IGSC member alert (exact or fuzzy). Action: escalate to biosecurity officer; contact originating member.
- `igsc_fuzzy_match` — partial match on name+org or name+address only. Action: enhanced KYC, re-screen.
- `internal_prior_red_flag` — prior order from this customer was denied or law-enforcement-reported. Action: deny by default; require explicit override with documented reasoning.
- `internal_prior_yellow_unresolved` — prior order had a yellow flag that was released but with caveats. Action: re-evaluate the caveat against the new order context.

## failure_modes_requiring_review

- **Channel under-utilization.** Multiple secondary sources note the IGSC sharing channel is "rarely used" ([RAND 2024](https://www.rand.org/content/dam/rand/pubs/research_reports/RRA3300/RRA3329-1/RAND_RRA3329-1.pdf); [PMC Screening State of Play, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11319849/)). A null result from the channel does not mean the customer is clean — it likely means no one has filed an alert.
- **Identity drift.** Attacker uses a different name, LLC, or domain than the one originally flagged; fuzzy match fails.
- **Antitrust / GDPR redaction.** The originating member may have shared only narrative facts, not enough PII to confirm a match on the receiving side.
- **CRM staleness.** Internal records may be tied to a stale email or org name that doesn't match the new order's surface fields.
- **No record at all.** New customer, no IGSC alert, no internal history → check returns null and provides no signal at all (this is the dominant case for net-new customers).

## false_positive_qualitative

- Common-name collisions (a researcher whose name matches a flagged customer at another institution).
- Shared institutions: a customer at the same university as a previously-flagged researcher who has no actual connection.
- Researchers who legitimately changed employers and whose prior CRM record contains a stale yellow flag from an earlier organizational context that has since been resolved.
- Foreign-name romanization variants matching across distinct individuals.

## record_left

- IGSC alert payload (or pointer to liaison conversation log).
- Internal CRM diff: prior verdicts vs. current order.
- Biosecurity-officer escalation memo with decision and timestamp.
- IGSC liaison contact log (date, member contacted, summary of confirmation call) if the alert was confirmed bilaterally.
- Per [Council on Strategic Risks, 2024](https://councilonstrategicrisks.org/2024/05/07/supporting-follow-up-screening-for-flagged-nucleic-acid-synthesis-orders/), follow-up screening of yellow/red flagged orders is an integral part of the IGSC protocol; the artifact set should be sufficient to satisfy a third-party audit of that follow-up.

## Sourcing notes

- Multiple independent secondary sources (RAND, Council on Strategic Risks, PMC Screening State of Play, IBBIS 2025) confirm that the IGSC information-sharing mechanism exists and is used rarely; none describe its technical interface. The implementation here is therefore necessarily mostly `[best guess]` and `[unknown]` on the operational fields, with citations to substantiate the "exists but rarely used" framing and the protocol's general structure.
- Direct vendor documentation searched: the IGSC website ([genesynthesisconsortium.org](https://genesynthesisconsortium.org/)) publishes only the Harmonized Screening Protocol PDF and a member roster — no operational sharing-channel documentation is public.
