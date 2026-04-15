# m20-coauthor-graph — Implementation v1

- **measure:** M20
- **name:** OpenAlex coauthor + NIH/NSF shared-grant independence graph
- **modes:** A
- **summary:** Build an "independence graph" between voucher and customer using (a) OpenAlex coauthorship within the past N years and (b) NIH RePORTER + NSF Awards shared-grant participation. If voucher and customer are coauthors on a paper within the last 3 years, share a current grant, or are within graph-distance 1 in either, the voucher fails the M20 independence requirement and is rejected as an independent referent.

## external_dependencies

- **OpenAlex API** for coauthorship: each work has an `authorships[]` list with author IDs; intersecting two authors' works yields shared papers and dates. [source](https://docs.openalex.org/api-entities/works/filter-works)
- **NIH RePORTER Project API v2** for US biomedical grants: search by PI / co-PI name. [source](https://api.reporter.nih.gov/)
- **NSF Awards Search Web API** for US non-medical science grants: search by PI / co-PI name. [source](https://resources.research.gov/common/webapi/awardapisearch-v1.htm)
- All three sources are free and public. No commercial license needed.
- **Coverage gap (already known):** non-US grants and non-academic researchers are invisible to NIH/NSF; reliance on OpenAlex coauthorship is the main signal for international cases.

## endpoint_details

### OpenAlex (coauthorship)

- **Strategy:** for the candidate voucher (Author ID `A_v`) and customer (Author ID `A_c`), fetch each one's works and intersect, OR query directly: `GET https://api.openalex.org/works?filter=authorships.author.id:A_v,authorships.author.id:A_c,from_publication_date:2023-01-01`. [source](https://docs.openalex.org/api-entities/works/filter-works)
- **Auth:** free API key (per the m19-openalex-author idea, OpenAlex now requires a free key). [source](https://developers.openalex.org/how-to-use-the-api/rate-limits-and-authentication)
- **Rate limits:** within free freemium tier; 1 filter call per voucher-customer pair.

### NIH RePORTER

- **Base URL:** `https://api.reporter.nih.gov/v2/projects/search`
- **Method:** POST with JSON criteria. Searching by investigator: `pi_names: [{first_name, last_name, any_name}]`. [source](https://api.reporter.nih.gov/)
- **Auth model:** none — public API, no key required.
- **Rate limits:** documented as 1 request/second baseline; bulk via `ExPORTER` files. [vendor-gated — exact RPS published in API docs at api.reporter.nih.gov; the 1 RPS figure is consistent with prior published guidance but not re-verified for 2026]
- **Pricing:** Free.
- **Strategy:** query both voucher and customer names; intersect on `project_num` to find shared awards. Date-window the project to "current" (i.e., within `award_notice_date` to `project_end_date`).
- **Fields:** `project_num`, `pi_profiles[]` (with `pi_id`, name, role), `award_notice_date`, `project_end_date`, `org_name`, `principal_investigators[]`, `program_officers`. [source](https://api.reporter.nih.gov/documents/Data%20Elements%20for%20RePORTER%20Project%20API_V2.pdf)

### NSF Awards

- **Base URL:** `http://api.nsf.gov/services/v1/awards.json`
- **Method:** GET with query parameters. Search by `pdPIName=Doe,+Jane` or `coPDPI=...`. [source](https://resources.research.gov/common/webapi/awardapisearch-v1.htm)
- **Auth model:** none — public.
- **Rate limits:** [unknown — searched for: "NSF awards API rate limit per second", "research.gov awardapisearch throttling"] — no explicit RPS published; the API has been reliable for moderate-volume programmatic queries.
- **Pricing:** Free.
- **Strategy:** query both voucher and customer; intersect on award `id`. Date-window on `startDate / expDate`.
- **Fields:** `id`, `title`, `pdPIName`, `coPDPI`, `awardeeName`, `startDate`, `expDate`, `fundsObligatedAmt`, `abstractText`.

## fields_returned

The independence-graph computation produces:
- `voucher_openalex_id`, `customer_openalex_id`
- `coauthored_works[]`: list of work IDs, titles, dates, venues where both names appear (last 3 years).
- `coauthored_count_3yr`, `coauthored_count_5yr`
- `nih_shared_projects[]`: list of NIH project numbers where both are listed PIs / co-PIs (currently active).
- `nsf_shared_awards[]`: list of NSF award IDs where both are listed.
- `graph_distance_openalex`: 1 if direct coauthors; 2 if share a coauthor; >2 otherwise.
- `independence_verdict`: PASS / FAIL.

## marginal_cost_per_check

- **Direct API cost:** $0 across OpenAlex (free key tier), NIH RePORTER (free), NSF (free). 1 OpenAlex filter + 1 RePORTER POST + 1 NSF GET per voucher-customer pair = ~3 calls per check.
- **Compute cost:** intersection logic is trivial. Author disambiguation (resolving voucher and customer to OpenAlex IDs) is the dominant cost; this is shared with the m19-openalex-author check, so the marginal cost beyond having OpenAlex Author IDs in hand is essentially zero.
- **setup_cost:** [best guess: ~1 engineer-week to build the graph-construction module + the SOP integration]

## manual_review_handoff

When the independence check flags a voucher-customer pair, the reviewer packet contains:
1. The voucher and customer claimed identities.
2. The list of coauthored works (with DOIs and dates).
3. The list of shared current grants (with project numbers, roles, dates).
4. The OpenAlex graph-distance figure.
5. The reviewer's options:

**Reviewer playbook:**
1. **FAIL — current coauthors:** voucher and customer have a paper within the last 3 years → reject voucher as not independent. Customer must obtain a different voucher.
2. **FAIL — current shared grant:** voucher and customer are both listed on an active NIH or NSF award → reject. Same role, same funding stream, no independence.
3. **AMBIGUOUS — older coauthorship (3–10 years ago) only:** flag for reviewer adjudication. May still be acceptable if the coauthorship is genuinely historical and the voucher does not currently work with the customer.
4. **PASS — no edges within 3 years and no current grant overlap.** Independence confirmed.
5. **EDGE CASES — large multi-author consortium papers (>20 authors):** treat as weak edges; do not auto-fail purely on a consortium paper unless the two are also in a smaller working group.

## flags_thrown

- `voucher_customer_coauthors_recent` — coauthored work within 3 years.
- `voucher_customer_shared_grant_active` — joint listing on a currently-active NIH or NSF project.
- `voucher_customer_close_graph` — graph distance < 2 in the OpenAlex coauthor graph (i.e., share a coauthor in common).
- `voucher_customer_consortium_only` — only edges are large-consortium papers; flagged for manual reviewer assessment.

## failure_modes_requiring_review

- **Author disambiguation collisions** (especially common names): if the voucher or customer cannot be unambiguously resolved to OpenAlex Author IDs, the graph check is structurally unable to fire correctly. Reviewer must adjudicate.
- **International / non-publishing voucher:** voucher is real but absent from OpenAlex/NIH/NSF; the check produces no signal → unable to verify independence.
- **Brand-new collaborations** (in-progress, not yet published): a voucher who legitimately just started collaborating with the customer 6 months ago is invisible to the published-paper-and-funded-grant check.
- **Industry voucher:** absent from NIH/NSF; weak OpenAlex coverage.
- **Non-US grants** (Wellcome, ERC, JSPS, NSFC, BMBF): not covered by RePORTER or NSF API.
- **API errors:** retry with backoff; fall back to OpenAlex-only if RePORTER or NSF time out.

## false_positive_qualitative

- **Legitimate non-collaborator pairs in a small field** who happen to share a third-party coauthor (graph distance 2). The check would only flag them on the weak `voucher_customer_close_graph` trigger, which is reviewer-routed, not auto-block.
- **Senior figures** who have coauthored with virtually everyone in their subfield over their career: hard to find an "independent" voucher.
- **Voucher from the same institution as customer** but no actual coauthorship: passes the check but the institution overlap may be a separate signal (handled by m20-ror-disjointness, not here).
- **Customers in small subfields** where the only available qualified vouchers are inevitably collaborators.

[best guess: false positive rate is low for the strict "current coauthor" trigger (<5% of legitimate vouches are with recent coauthors, since by M20 design the relationship must be ≥1 year and not require collaboration), and moderate for the graph-distance-2 trigger]

## record_left

- The full graph-construction artifact (voucher OpenAlex ID, customer OpenAlex ID, intersected works, intersected grants).
- Snapshot URLs: OpenAlex work URLs, RePORTER project URLs (`https://reporter.nih.gov/project-details/<APPL_ID>`), NSF award URLs.
- Reviewer adjudication on edge cases.
- Strong audit artifact: all source data is public and re-fetchable; the graph claim is independently reproducible.

## attacker_stories_addressed (refined)

- `collusive-vouching` — directly targeted: if the colluding pair has any current coauthorship or shared grant, this catches them.
- `ring-vouching` — partial: catches pairs that are direct coauthors but not pairs that are deliberately built to avoid public collaboration (i.e., the ring members never publish or get grants together).
- `lab-manager-voucher` (PI vouches for own lab manager) — directly targeted: PI and lab manager will typically share coauthored papers, and the check flags this.
- `gradual-legitimacy-accumulation` — partial: only catches the cultivated voucher relationship if it has produced a paper or grant.
- `shell-nonprofit` self-vouching — does not catch: there is no public collaboration history because the shell does no published work.
- `community-bio-lab-network` — partial: community-lab peers may not coauthor; the check would clear them as "independent" even though they are socially close.

[best guess: this check is most useful against the `collusive-vouching` and `lab-manager-voucher` patterns where the conflict-of-interest is publicly visible; it is structurally weak against attacker patterns built explicitly to avoid public collaboration traces]
