# Measure 07 — Ideation v2

Carries v1 verdicts forward. PASS ideas copied unchanged (summarized by reference). REVISE ideas reworked. DROP moved to bottom.

## 1. ROR institution-domain match — PASS (carried)
Unchanged from v1.

## 2. InCommon metadata IdP enumeration — PASS (carried)
Unchanged from v1.

## 3. eduGAIN federation metadata — PASS (carried)
Unchanged from v1.

## 4. Institutional directory people-search scrape — PASS (carried)
Unchanged from v1.

## 5. ORCID employments + education affiliation lookup — PASS (carried)
Unchanged from v1.

## 6. OpenAlex author-institution affiliation history — PASS (carried)
Unchanged from v1.

## 7. Proxycurl LinkedIn person-lookup — REVISED

- **name:** Proxycurl LinkedIn person-lookup
- **summary:** Use Proxycurl's `/proxycurl/api/v2/linkedin` Person Profile Endpoint and `Person Lookup Endpoint` (resolve by `first_name`, `last_name`, `company_domain`) to fetch the LinkedIn profile of the customer. Compare `experiences[0].company` to the claimed institution and check `experiences[0].starts_at` (account/employment age proxies for legitimacy). Proxycurl is a single named vendor with documented endpoints; manual reviewer LinkedIn search is the fallback only when Proxycurl returns null.
- **modes:** direct; attacker-driven
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-company, cro-framing, it-persona-manufacturing, dormant-domain
- **external_dependencies:** Proxycurl API (paid per call).
- **manual_review_handoff:** Reviewer sees current employer, employer tenure, total experience entries, profile age. Playbook: profile age <12 months OR <3 prior experiences OR current employer != claimed institution → review.
- **flags_thrown:** (a) Proxycurl returns no profile; (b) profile current_employer != claimed institution; (c) profile minted <12 months ago.
- **failure_modes_requiring_review:** privacy-conscious researchers without LinkedIn; common names; ToS uncertainty.
- **record_left:** Proxycurl response JSON.

## 8. `site:<institution-domain>` Google name search — PASS (carried)
Unchanged from v1.

## 9. WHOIS + DNS provenance check — PASS (carried)
Unchanged from v1.

## 10. Ringgold institutional identifier lookup — PASS (carried)
Unchanged from v1.

## 11. ISNI institution authority lookup — REVISED

- **name:** ISNI institution authority lookup
- **summary:** Resolve the customer's claimed institution against ISNI (ISO 27729) via the public ISNI search at https://isni.org. ISNI assigns identifiers to organizations including ministries, agricultural universities, prefectural labs, and government research institutes that ROR sometimes lacks. Use as the second-line registry check specifically for non-Anglophone foreign institutions where ROR coverage is uneven.
- **modes:** attacker-driven
- **attacker_stories_addressed:** foreign-institution
- **external_dependencies:** ISNI public search; OCLC ISNI API (institutional subscription).
- **manual_review_handoff:** Reviewer sees ISNI ID, canonical name in local + Latin script, country.
- **flags_thrown:** Institution absent from both ROR and ISNI despite claiming to be a national/government research body.
- **failure_modes_requiring_review:** ISNI coverage uneven; record duplication.
- **record_left:** ISNI ID, name variants.
- **Note:** GRID half of v1 idea 11 dropped (frozen 2021, subsumed by ROR).

## 12. NIH RePORTER + NSF Awards PI affiliation lookup — PASS (carried)
Unchanged from v1.

## 13. Step-up SSO via institutional IdP — PASS (carried)
Unchanged from v1.

## 14. Email-domain MX/SPF authoritative-host check — PASS (carried)
Unchanged from v1.

## 15. New-hire corroboration: news + directory consistency — REVISED

- **name:** Visiting-scholar new-hire corroboration rule
- **summary:** Reframe v1 idea 15 from a standalone search into a hardening rule for visiting-scholar / postdoc claims specifically: when the customer claims a visiting-scholar / postdoc / new-hire status (declared or inferred from a recent appointment date), require that *at least one* of the following positive corroborators returns a hit: (a) the institution's `/news/` subtree (Bing News Search API + `site:news.<domain>`), (b) the dept's "people / news / events" page (idea 4), (c) a press release on the dept blog. Absence of all three is a soft flag specific to claimed-new-affiliation customers, not all customers.
- **modes:** attacker-driven (visiting-researcher)
- **attacker_stories_addressed:** visiting-researcher, it-persona-manufacturing
- **external_dependencies:** Bing News Search API; Google CSE.
- **manual_review_handoff:** Reviewer sees corroborator hits and absence list. Playbook for new-hire claims with zero corroborators: ask for sponsoring PI's email and a one-line confirmation.
- **flags_thrown:** Customer claims new-hire / visiting status AND zero positive corroborators.
- **failure_modes_requiring_review:** Most legit visiting scholars don't get press; rule deliberately fires only as a soft flag.
- **record_left:** Search queries + result URLs.

## 16. Wayback Machine snapshot timeline — PASS (carried)

## 17. Community-bio directory recognition — PASS (carried)

## 18. Self-asserted-startup listing detection — PASS (carried)

## 19. Biotech incubator tenant directory check — PASS (carried)

## 20. Alumni-/forwarder-domain denylist — PASS (carried)

---

## Coverage notes
Same as v1; structural gaps (visiting-researcher with real courtesy appointment; lab-manager-voucher / bulk-order-noise-cover / insider-recruitment / credential-compromise / account-hijack; dormant-account-takeover Bypass A) remain by construction of M07 and are surfaced in v1 stage 2.

## Dropped

- **v1 idea 21 — Institutional HR system role validation:** Dropped permanently. No standardized API; not feasible at low scrutiny. Belongs to measure 18, not M07.
- **v1 idea 11 (GRID half):** GRID is frozen 2021 and subsumed by ROR. ISNI half retained as new idea 11.
