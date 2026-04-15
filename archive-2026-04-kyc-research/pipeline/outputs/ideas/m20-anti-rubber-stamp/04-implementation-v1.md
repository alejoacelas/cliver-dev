# m20-anti-rubber-stamp — Implementation v1

- **measure:** M20
- **name:** Anti-rubber-stamp voucher SOP (rate-limit + diversity audit)
- **modes:** A
- **summary:** Internal SOP layered on the provider's voucher workflow. Rate-limits the number of distinct customers a single voucher can vouch for in a given quarter, requires diversity across customers (not all from one institution / one lab), and routes vouchers exceeding either threshold to senior compliance review. Targets the `rubber-stamp-voucher`, `lab-manager-voucher`, and `ring-vouching` patterns where one trusted senior signs many vouches without due diligence.

## external_dependencies

- **Internal voucher database** (the provider's own record of who has vouched for whom and when).
- **Optional cross-provider sharing** via IGSC member portals — would require a sharing mechanism that does not currently exist as a documented public API. [unknown — searched for: "IGSC voucher sharing API", "IBBIS voucher cross-provider", "gene synthesis consortium customer sharing list"]
- **Reference baselines:** the IGSC Harmonized Screening Protocol v3.0 establishes the consortium baseline; specific anti-rubber-stamp limits are not stipulated in the public protocol. [source](https://genesynthesisconsortium.org/wp-content/uploads/IGSC-Harmonized-Screening-Protocol-v3.0-1.pdf)

## endpoint_details

- **No external API.** Internal database query.
- **Suggested logic (per voucher per quarter):**
  - Count distinct customers vouched for; flag if > N (default N = 10, see below).
  - Compute Herfindahl-style concentration index across the voucher's customer set; flag if concentration > 0.5 (i.e., one institution accounts for >70% of vouches).
  - Flag if voucher's vouches all originate from a single account / lab / department.
- **Auth model:** internal IAM only.
- **Pricing:** internal compute cost negligible.
- **ToS:** none external; internal record-keeping only.

## Threshold-setting rationale

The IGSC v3.0 protocol does not publish specific anti-rubber-stamp limits. [source](https://genesynthesisconsortium.org/wp-content/uploads/IGSC-Harmonized-Screening-Protocol-v3.0-1.pdf)

Comparable rate-limit conventions in fraud-prevention referral systems range from "5–10 referrals per hour" for fast consumer flows. [source](https://www.voucherify.io/blog/blowing-the-whistle-how-to-combat-referral-abuse-and-fraud) For DNA-synthesis vouching, the cadence is much slower:

- [best guess: a typical PI in an active life-sciences lab supervises 5–15 trainees + staff at any time. Vouching for all of them in a quarter is fully legitimate. A "rate-limit" set at 10 *distinct customers* per quarter per voucher would catch only the most egregious rubber-stampers and would still false-positive on large lab heads.]
- [best guess: a more defensible threshold is *audit*-on-volume rather than block-on-volume: any voucher exceeding 20 distinct customers per quarter is automatically routed to a quarterly compliance review, where the reviewer spot-checks 3 vouches for due diligence.]

By analogy with electoral "vouching" caps (Minnesota's 8-voter limit cited as a fraud-control measure [source](https://www.foxnews.com/politics/mn-policy-allowing-voters-vouch-8-others-amid-somali-scandals-leads-calls-federal-action)), per-actor caps in the single-digit to low-double-digit range are the norm in adjacent vouching contexts.

## fields_returned

The internal report on a flagged voucher contains:
- `voucher_id`, `voucher_orcid` (if collected), `voucher_institution`
- `quarter`, `vouch_count`, `distinct_customers`
- `customer_concentration_hhi` (institution / lab Herfindahl index)
- `customers_list[]` with names, institutions, dates, SOC categories vouched for
- `prior_audit_outcomes` (if voucher previously audited)

## marginal_cost_per_check

- **Per-customer marginal cost:** ~$0 (internal DB query).
- **Per-voucher quarterly audit:** [best guess: 1–3 reviewer hours per audited voucher × ~$100/hr senior compliance staff = $100–$300 per audit. If 5% of active vouchers are audited per quarter, the amortized cost per *order* is well under $1.]
- **setup_cost:** [best guess: ~2 engineer-weeks to add voucher-volume tracking + Herfindahl calculation to the existing voucher workflow + define the reviewer SOP. ~$10k.]

## manual_review_handoff

When a voucher is flagged:

1. **Compliance reviewer pulls the voucher's quarterly activity packet.**
2. **Sample 3 random vouches from the period:**
   - Was the relationship at least 1 year (per M20 / IGSC guidance)?
   - Is the SOC category in the vouch consistent with the customer's stated work?
   - Is there evidence the voucher actually corresponded with the customer about the order, or did they sign within seconds of receiving the request?
3. **Action triggers:**
   - All sampled vouches well-documented → mark "high-volume legitimate" (e.g., a large lab PI), increase the voucher's audit interval but do not block.
   - 1+ sampled vouch shows < 60-second turnaround OR no documented relationship → escalate to in-depth audit of all vouches in the quarter.
   - Pattern of cross-customer ring (voucher A vouches for B, who vouches for A) → block both vouchers pending senior review.
4. **Document outcome** in the voucher's record. Track recurring offenders.
5. **Customer impact:** customers whose vouches are invalidated must obtain a new voucher; they are not by themselves penalized.

## flags_thrown

- `voucher_rate_exceeded` — distinct-customer count > threshold (default 20 / quarter).
- `voucher_diversity_low` — Herfindahl index across institutions > 0.5.
- `voucher_turnaround_fast` — vouch signed within < 60 seconds of request issuance (suggests scripted / no-read approval).
- `voucher_ring_detected` — graph cycle of length ≤ 4 in the voucher-customer graph.

## failure_modes_requiring_review

- **Legitimate large-lab PIs** routinely vouch for 15–30 trainees + staff per quarter. The threshold catches them, but the audit playbook should clear them quickly.
- **Core-facility directors** with broad legitimate vouching authority across many user labs.
- **Newly-appointed PIs** with no track record — false-negative because their vouch volume is too low to flag.
- **Adversarial counter-tactic:** attackers spread their requests across multiple vouchers to stay under the threshold. The Herfindahl check addresses this only if the spread is across the *same* institution; ring-vouching across institutions defeats both checks.
- **No cross-provider visibility:** an attacker who uses different DNA providers for each order avoids any one provider's voucher-volume detection. [unknown — searched for: "IGSC shared vouching database", "cross-provider customer denylist gene synthesis"]

## false_positive_qualitative

- **Large-lab PIs** as above.
- **BSOs (biosafety officers) and IRB-style approvers** whose institutional role is precisely to sign off on many requests.
- **Department chairs** who routinely sign for departmental staff.
- **Core-facility directors** and shared-instrument managers.
- **Long-term collaborators** whose vouching pattern looks like a cycle but is genuinely mutual (e.g., two PIs in the same field who vouch for each other's staff).

[best guess: false positive rate of "voucher_rate_exceeded" alone could be 30–60% of flagged vouchers being legitimate large labs; the "voucher_turnaround_fast" trigger is much more discriminating because no legitimate due diligence happens in <60 seconds]

## record_left

- The voucher's quarterly audit packet (immutable snapshot).
- The reviewer's free-text findings.
- The decision (clear / restrict / block).
- The graph snapshot of the voucher-customer network for that quarter.
- Auditable, internal artifact; supports an external biosecurity audit.

## attacker_stories_addressed (refined)

- `lab-manager-voucher` (b — PI rubber-stamps modal path) — partial: catches the PI only when their vouching velocity is anomalously high or their turnaround time is suspiciously short. A PI who rubber-stamps moderately (5/quarter) is invisible to volume thresholds.
- `lab-manager-voucher` (a — attacker is the registered voucher) — does not catch: the attacker's vouching volume is low because they vouch only for themselves.
- `lab-manager-voucher` (b' — BSO-as-voucher) — directly targeted: BSOs by job design vouch for many people; the audit would flag them but legitimate BSOs would clear the audit.
- `ring-vouching` — partially targeted: the ring-detection sub-check catches cycles ≤ 4 in the voucher graph; longer rings or cross-provider rings escape.
- `community-bio-lab-network` — partial: the community's mutual-vouching norms create exactly the patterns the diversity check flags; this would force community-lab vouchers into compliance review, with uncertain outcomes.
- `shell-nonprofit` self-vouching — does not catch: only one vouch from each shell, well under any threshold.
- `gradual-legitimacy-accumulation` — does not catch: the cultivated vouch is one of many legitimate vouches the senior figure issues.
- `bulk-order-noise-cover` — partial: catches the voucher behind bulk orders only if the voucher's own volume becomes extreme.

[best guess: anti-rubber-stamp is most useful as a *detection* mechanism for the modal "PI clicks approve without reading" failure mode; it is structurally weak against single-shot attacks and against cross-provider rotation]
