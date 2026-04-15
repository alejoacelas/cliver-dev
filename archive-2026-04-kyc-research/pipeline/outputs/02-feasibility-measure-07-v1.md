# Measure 07 — Feasibility check v1

Measure: low-scrutiny institution-affiliation check (email-domain match + "shown on institution website").

Two gates: concreteness (named source/vendor/SOP), relevance (addresses ≥1 mapped attacker story on the merits).

## Verdicts

### 1. ROR institution-domain match — PASS
Names a specific public API (api.ror.org) and a specific schema field (`links`). Catches dormant-domain, shell-* (won't have ROR records), foreign-institution (positive). Both gates pass.

### 2. InCommon metadata IdP enumeration — PASS
Specific federation (Internet2 InCommon) and a specific metadata mechanism (Shibboleth `scope`). Distinguishes real R&E institutions from self-controlled domains.

### 3. eduGAIN federation metadata — PASS
Specific (eduGAIN MDS, named national federations). Addresses foreign-institution and unrelated-dept-student.

### 4. Institutional directory people-search scrape — PASS
This is the literal "shown on institution website" leg of the measure. SOP is concrete (canonical paths under canonical domain); cleanly catches dormant-account-takeover Bypass C, inbox-compromise role-mailbox case, and forces it-persona-manufacturing into directory-write. Both gates pass.

### 5. ORCID employments + education affiliation lookup — PASS
Specific (pub.orcid.org/v3.0). Addresses visiting-researcher (lag), shell-* (no ORCID record), it-persona-manufacturing.

### 6. OpenAlex author-institution affiliation history — PASS
Specific (api.openalex.org/authors). Addresses unrelated-dept-student (department visibility), shell-*/dormant-domain (no authorships).

### 7. LinkedIn current-employer match — REVISE
Concreteness borderline: "Proxycurl" is a real vendor and is named, but the idea conflates Proxycurl, Sales Navigator API, and manual review. Pick one as the primary path and name it without `[best guess]`. Relevance OK (gradual-legitimacy-accumulation, it-persona-manufacturing). Action: in v2, commit to Proxycurl `/proxycurl/api/v2/linkedin` person-lookup as the primary endpoint and treat manual reviewer search as fallback.

### 8. `site:<institution-domain>` Google name search — PASS
Specific (Google Programmable Search Engine, Bing Web Search API, SerpAPI named). Catches it-persona-manufacturing sub-path A (indexed directory entry), forces dormant-account-takeover Bypass C to also touch search-indexable pages.

### 9. WHOIS + DNS provenance check — PASS
Specific (RDAP, SecurityTrails, crt.sh). Catches dormant-domain, shell-*, cro-*, gradual-legitimacy-accumulation, community-bio-lab-network. The single most-load-bearing check against purpose-built-organization stories.

### 10. Ringgold institutional identifier lookup — PASS
Named registry (Ringgold Identify Database). Concreteness OK even though API specifics are vendor-gated — stage 4 will resolve. Relevance: catches the shell-* and cro-* cluster (single-person orgs explicitly out of scope per Ringgold policy). Pass.

### 11. GRID & ISNI cross-reference — REVISE
Concreteness OK (GRID dump, ISNI search). Relevance is weak: GRID is frozen and largely subsumed by ROR; ISNI's value-add over ROR is small for the attacker stories listed. Drop GRID, keep ISNI only, and tie ISNI explicitly to one story (foreign-institution — ISNI has stronger non-Anglophone coverage than ROR for ministries / agricultural universities). Action in v2: rename to "ISNI institution authority lookup" and explicitly drop GRID half.

### 12. NIH RePORTER + NSF Awards PI affiliation lookup — PASS
Specific APIs (api.reporter.nih.gov, NSF Award Search). Relevance: catches visiting-researcher (no awards under host yet — though weak), gradual-legitimacy-accumulation, shell-*, dormant-domain.

### 13. Step-up SSO via institutional IdP — PASS
Specific (SAML/OIDC via InCommon/eduGAIN, eduPersonScopedAffiliation attribute named). Catches all the self-controlled-domain stories on the merits. Acknowledged not to catch credential/account compromise — that's fine, idea doesn't claim it.

### 14. Email-domain MX/SPF authoritative-host check — PASS
Specific (`/.well-known/openid-configuration` for O365 tenant display name). Concrete and addresses dormant-domain, shell-*, cro-*.

### 15. Institutional news search for new-hire mentions — REVISE
Concrete (Bing News Search API named) but relevance is thin and the agent itself admits it is a positive corroborator only, with no clear flag. Either define a precise flag rule or fold into idea 4/8 as a sub-signal. Action in v2: drop unless reframed as "for visiting-scholar claims, require either a news mention OR a directory entry, not neither" — i.e., hardening for the visiting-researcher story specifically.

### 16. Wayback Machine snapshot timeline — PASS
Specific (Internet Archive CDX API). Catches it-persona-manufacturing (fresh fabrication has no snapshot history) and dormant-account-takeover Bypass C. Useful complement to idea 4.

### 17. Community-bio directory recognition — PASS
Specific (DIYbio.org, DIYbiosphere named) and directly addresses community-bio-lab-network on the merits (treats self-list-only evidence as unverified).

### 18. Self-asserted-startup listing detection — PASS
Specific (Crunchbase, AngelList, Pitchbook named). Addresses gradual-legitimacy-accumulation explicitly via the "self-asserted only" framing.

### 19. Biotech incubator tenant directory check — PASS
Specific (BioLabs, LabCentral, JLABS, CIC, Genspace, IndieBio named). Addresses biotech-incubator-tenant and inversely cro-framing (virtual offices won't be in any incubator directory). Both gates pass.

### 20. Alumni-/forwarder-domain denylist — PASS
Concrete SOP. Catches inbox-compromise variant 5 directly. Both gates pass.

### 21. Institutional HR system role validation — DROP
Idea author already concedes this is not feasible at low scrutiny and there is no standardized API. Move to dropped; revisit under measure 18 (institution-legitimacy-soc) where higher-scrutiny mechanisms are in scope.

## Gaps (attacker classes no current idea catches on the merits)

- **visiting-researcher (real courtesy appointment):** every check returns a clean affirmative because the affiliation is real. Only soft signals (5, 6, 12, 15) — none are gating. This is a structural gap of M07; flag in stage 8 synthesis rather than try to fix at M07 level.
- **lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, credential-compromise, account-hijack:** affiliation is genuine, identity is genuine. M07 has zero leverage. Structural gap; document.
- **dormant-account-takeover Bypass A:** legacy faculty page still cached; passes ideas 4, 8, 16. No idea catches this on the merits at M07.
- **inbox-compromise variant 6 (sysadmin-issued visiting account with directory entry):** real name on directory; passes ideas 4, 8, 16. WHOIS check (9) is irrelevant because the domain is the real institution's. Possibly catchable by ideas 5/6/12 (no ORCID/OpenAlex/RePORTER footprint) — barely. Mark as a partial gap.
- **it-persona-manufacturing sub-path D (HR injection):** with HR-record backing the persona will likely show up in directory + Google + ORCID-feeder pipelines too, eventually. Idea 16 (Wayback timing) is the only check that flags freshness. Mark as partial gap.

## Stop condition

Three REVISE verdicts (7, 11, 15) and one DROP (21) plus identified gaps.

STOP: no
