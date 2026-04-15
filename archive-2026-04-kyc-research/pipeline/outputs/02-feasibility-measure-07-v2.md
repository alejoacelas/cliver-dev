# Measure 07 — Feasibility check v2

Reviewing v2 ideation against concreteness + relevance gates.

## Verdicts

1. ROR institution-domain match — **PASS** (unchanged)
2. InCommon metadata IdP enumeration — **PASS** (unchanged)
3. eduGAIN federation metadata — **PASS** (unchanged)
4. Institutional directory people-search scrape — **PASS** (unchanged)
5. ORCID employments + education affiliation — **PASS** (unchanged)
6. OpenAlex author-institution affiliation history — **PASS** (unchanged)
7. Proxycurl LinkedIn person-lookup — **PASS**. Now names a single specific endpoint (`/proxycurl/api/v2/linkedin` Person Lookup) and a specific vendor; relevance unchanged from v1. Both gates pass.
8. `site:<domain>` Google name search — **PASS** (unchanged)
9. WHOIS + DNS provenance check — **PASS** (unchanged)
10. Ringgold institutional identifier lookup — **PASS** (unchanged)
11. ISNI institution authority lookup — **PASS**. GRID half dropped; ISNI tied explicitly to foreign-institution. Both gates pass.
12. NIH RePORTER + NSF Awards PI affiliation — **PASS** (unchanged)
13. Step-up SSO via institutional IdP — **PASS** (unchanged)
14. Email-domain MX/SPF authoritative-host check — **PASS** (unchanged)
15. Visiting-scholar new-hire corroboration rule — **PASS**. Now defined as a conditional rule with a precise trigger (customer claims new-hire / visiting status) and a precise flag (zero corroborators). Tied to visiting-researcher and it-persona-manufacturing. Both gates pass.
16. Wayback Machine snapshot timeline — **PASS** (unchanged)
17. Community-bio directory recognition — **PASS** (unchanged)
18. Self-asserted-startup listing detection — **PASS** (unchanged)
19. Biotech incubator tenant directory check — **PASS** (unchanged)
20. Alumni-/forwarder-domain denylist — **PASS** (unchanged)

## Gaps

The structural gaps surfaced in v1 (visiting-researcher with a real courtesy appointment; lab-manager-voucher / bulk-order-noise-cover / insider-recruitment / credential-compromise / account-hijack — all of which have genuine institutional affiliations that M07 cannot challenge on the merits; dormant-account-takeover Bypass A inheriting cached faculty pages) are properties of measure 07 itself, not gaps that more ideation can close. They are documented for stage 8 cross-measure synthesis: catching these requires measures 14 (identity evidence), 18 (institution-legitimacy-soc with publication / grant scrutiny), 19 (individual legitimacy), or 20 (vouching) — outside M07's scope.

No remaining REVISE or DROP verdicts. No newly identified addressable gaps.

## Stop condition

STOP: yes
