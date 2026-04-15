# m20-coauthor-graph — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | OpenAlex coauthor + NIH/NSF shared-grant independence graph |
| **measure** | M20 — Voucher-legitimacy (SOC) |
| **attacker_stories_addressed** | `collusive-vouching` (directly targeted — catches pairs with coauthorship/shared grants). `lab-manager-voucher` (b — PI vouches for lab manager: CAUGHT if coauthorship exists; displacement to alternative voucher is cheap). `gradual-legitimacy-accumulation` (CAUGHT if cultivated relationship produced a paper or grant). `bulk-order-noise-cover` (CAUGHT if voucher has recent coauthorship). `ring-vouching` (partial — catches pairs that are direct coauthors). Does **not** catch: `visiting-researcher`, `unrelated-dept-student`, `shell-nonprofit`, `shell-company`, `community-bio-lab-network`, `biotech-incubator-tenant`, `cro-framing`, `cro-identity-rotation`, `dormant-domain`, `it-persona-manufacturing`, `insider-recruitment` (deliberately selected), `account-hijack`, `credential-compromise`, `inbox-compromise`, `dormant-account-takeover`. |
| **summary** | Builds an independence graph between voucher and customer using OpenAlex coauthorship (past 3 years) and NIH RePORTER + NSF Awards shared-grant participation (currently active). If the pair are coauthors, share a grant, or are within graph-distance 1 in either source, the voucher is rejected as non-independent. The customer must find an alternative voucher without collaboration ties. |
| **external_dependencies** | OpenAlex API (free key, coauthorship data). NIH RePORTER Project API v2 (free, no auth, US biomedical grants). NSF Awards Search Web API (free, no auth, US non-medical science grants). All three public and free. |
| **endpoint_details** | **OpenAlex:** `GET https://api.openalex.org/works?filter=authorships.author.id:A_v,authorships.author.id:A_c,from_publication_date:...` — free API key, standard rate limits. **NIH RePORTER:** `POST https://api.reporter.nih.gov/v2/projects/search` with `pi_names` criterion — no auth, [vendor-gated — 1 RPS figure consistent with prior guidance]. **NSF Awards:** `GET http://api.nsf.gov/services/v1/awards.json?pdPIName=...` — no auth, [unknown — searched for: "NSF awards API rate limit per second"; no explicit RPS published]. All free. ~3 API calls per voucher-customer pair. |
| **fields_returned** | `voucher_openalex_id`, `customer_openalex_id`, `coauthored_works[]` (IDs, titles, dates, venues — last 3 years), `coauthored_count_3yr`, `coauthored_count_5yr`, `nih_shared_projects[]` (project numbers, PI roles, dates), `nsf_shared_awards[]` (award IDs), `graph_distance_openalex` (1 = direct coauthors, 2 = share a coauthor), `independence_verdict` (PASS/FAIL). |
| **marginal_cost_per_check** | $0 direct API cost (all free tiers). Compute cost negligible. Author disambiguation (resolving to OpenAlex IDs) shared with m19-openalex-author check. **Setup cost:** [best guess: ~1 engineer-week for graph-construction module + SOP integration.] |
| **manual_review_handoff** | Reviewer packet: voucher/customer identities, coauthored works with DOIs and dates, shared grants with project numbers and roles, graph-distance figure. Playbook: (1) FAIL if coauthored within 3 years; (2) FAIL if shared active NIH/NSF grant; (3) AMBIGUOUS if older coauthorship (3–10 years) — reviewer adjudicates; (4) PASS if no edges within 3 years and no grant overlap; (5) large multi-author consortium papers (>20 authors) treated as weak edges, not auto-fail. |
| **flags_thrown** | `voucher_customer_coauthors_recent` (coauthored within 3 years), `voucher_customer_shared_grant_active` (joint active NIH/NSF project), `voucher_customer_close_graph` (graph distance <2), `voucher_customer_consortium_only` (only large-consortium paper edges — flagged for manual review). |
| **failure_modes_requiring_review** | Author disambiguation collisions (common names); international/non-publishing voucher (no OpenAlex/NIH/NSF signal); brand-new collaborations not yet published; industry voucher absent from academic databases; non-US grants invisible; API errors (fall back to OpenAlex-only). |
| **false_positive_qualitative** | (1) Small subfields where virtually all qualified vouchers are recent coauthors — customer structurally unable to find an independent voucher. (2) Senior figures who have coauthored with everyone in their subfield. (3) Disambiguation collisions falsely flagging non-coauthors. [best guess: false-positive rate <5% for "current coauthor" trigger on legitimate vouches; moderate for graph-distance-2 trigger.] |
| **coverage_gaps** | **Gap 1 — Industry vouchers with no publication record (no-signal):** ~30–50% of industry R&D scientists may have zero indexed publications; check silently passes. **Gap 2 — Non-US-funded researchers (weak-signal):** ~30–40% of global customers; grant-overlap leg is entirely US-only (no Wellcome, ERC, JSPS, NSFC). **Gap 3 — Pre-publication collaborators (no-signal):** New collaborations (1–3 year lag to first joint paper) invisible. [unknown — no direct data on lag distribution.] **Gap 4 — Small subfields (false-positive):** Subfields with <200 researchers where everyone is a coauthor; all vouchers fail. No numerical estimate of affected subfields. **Gap 5 — Author disambiguation failures (weak-signal):** Common names cause both false positives and false negatives. [unknown — OpenAlex error rate not published.] |
| **record_left** | Full graph-construction artifact (OpenAlex IDs, intersected works, intersected grants), snapshot URLs (OpenAlex work URLs, RePORTER project URLs, NSF award URLs), reviewer adjudication. Strong audit artifact: all source data public and re-fetchable; graph claim independently reproducible. |
| **bypass_methods_known** | PI vouches for lab manager with coauthorship — CAUGHT. Cultivated voucher with coauthorship — CAUGHT. Bulk-order voucher with coauthorship — CAUGHT. |
| **bypass_methods_uncovered** | All non-publication-mediated relationships (shells, community labs, incubators, CROs, manufactured personas); new arrivals (visiting researchers, rotation students) with zero coauthorship by construction; displacement to alternative non-coauthor voucher after PI blocked; non-publishing populations (BSOs, lab managers, technicians); authentication-layer attacks; cross-provider rotation. |

---

## Section 2: Narrative

### What this check is and how it works

The coauthor-graph independence check queries three free, public data sources — OpenAlex (coauthorship), NIH RePORTER (shared federal grants), and NSF Awards (shared federal grants) — to determine whether a proposed voucher and customer have a recent professional relationship that disqualifies the voucher as an independent referent. The check resolves both parties to OpenAlex Author IDs, intersects their publication histories (looking for coauthored papers within the past 3 years), and intersects their grant records (looking for joint listings on currently active NIH or NSF awards). If any edge exists, or if the pair shares a coauthor (graph distance <2), the voucher is rejected. The customer must then find an alternative voucher without collaboration ties.

### What it catches

The check directly targets collusive vouching — the pattern where a PI vouches for their own lab member, or two collaborators vouch for each other. When the collaboration is visible in the publication or grant record, the check catches it: a PI who has coauthored with their lab manager in the last 3 years cannot serve as that person's voucher. It also catches gradual-legitimacy-accumulation patterns where the cultivated relationship has produced published work, and bulk-order scenarios where the voucher is a recent collaborator. The check's primary value is forcing the attacker to displace to a less natural voucher — someone outside their publication network — which raises the social cost and creates additional attribution risk.

### What it misses

The check is structurally blind to relationships not mediated by publications or US federal grants. All shell entities, CRO fabrications, manufactured personas, and dormant-domain revivals produce no publication footprint and pass trivially. Visiting researchers and rotation students are by definition new to the host lab — zero coauthorship by construction — so the independence check paradoxically passes the attacker with the weakest genuine relationship to the voucher. Non-publishing populations (BSOs, lab managers, technicians) are invisible to the graph. The grant-overlap leg is entirely US-only; non-US-funded collaborations (ERC, Wellcome, JSPS, NSFC) are missed unless the pair also coauthored. Industry vouchers with no indexed publications (~30–50% of industry R&D scientists) produce no signal. Even when the check catches the direct PI-voucher path, displacement to an alternative non-coauthor voucher is cheap.

### What it costs

Direct API cost is $0 across all three data sources (all free/public). The check requires ~3 API calls per voucher-customer pair. Author disambiguation (resolving names to OpenAlex Author IDs) is the dominant implementation cost but is shared with other OpenAlex-based checks. Setup cost is approximately one engineer-week. The marginal operational cost is negligible.

### Operational realism

The check produces a strong, reproducible audit artifact: all source data is public, all graph edges are traceable to specific DOIs and grant numbers, and any reviewer can independently re-fetch and verify the graph. Manual review is needed primarily for edge cases: older coauthorships (3–10 years ago), large-consortium papers (>20 authors treated as weak edges), and disambiguation collisions with common names. The false-positive rate is estimated as low (<5%) for the strict "current coauthor" trigger. The main operational risk is that the check provides a false sense of security for non-academic populations where it silently produces no signal.

### Open questions

The hardening stage's M2 finding highlights a structural paradox: the independence check most easily passes attackers whose relationship with the voucher is newest and least established — exactly the visiting-researcher and rotation-student patterns. A "minimum relationship duration" requirement alongside independence was suggested but creates a contradictory dual requirement (closeness and distance). The coverage form check flagged that Gap 4 (small subfields where all vouchers fail) lacks a numerical size estimate, and that Gap 2 (non-US grants) could be strengthened by citing specific funder scales. The OpenAlex author disambiguation error rate is unknown and would affect confidence in the check's reliability for common-name populations.

---

## Section 3: Open issues for human review

- **Moderate hardening finding M1 (structural):** The check is blind to all non-publication-mediated relationships. Shells, community labs, incubators, CROs, and manufactured personas pass trivially. No fix within the coauthor graph.
- **Moderate hardening finding M2 (structural):** Visiting researchers and rotation students pass by construction (zero coauthorship). The independence check paradoxically clears the attacker pattern it should most suspect. Consider whether a minimum-relationship-duration requirement is feasible alongside independence.
- **Moderate hardening finding M3 (surviving):** Displacement to an alternative voucher after PI blocked is cheap. The check is a friction-adding mechanism, not a blocking mechanism.
- **Moderate hardening finding M4 (structural):** Non-publishing populations (BSOs, lab managers, technicians) are invisible to the graph. Fallback to institutional-role-based independence (m20-ror-disjointness) needed.
- **[unknown] field:** NSF Awards API rate limit — searched for "NSF awards API rate limit per second"; no explicit RPS published.
- **[vendor-gated] field:** NIH RePORTER exact RPS — 1 RPS figure consistent with prior guidance but not re-verified for 2026.
- **Coverage Gap 4 size estimate:** No numerical proxy for the number of small subfields where all vouchers fail the coauthor check.
- **Coverage Gap 5 (disambiguation):** OpenAlex author disambiguation error rate is [unknown]; affects reliability for common-name populations.
- **No 06C (claim check on coverage) was run.** Coverage citations (Grand View Research, LinkedIn article, OpenAlex stats) not independently verified.
