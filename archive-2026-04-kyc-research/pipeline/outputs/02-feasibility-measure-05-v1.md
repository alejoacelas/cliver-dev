# Stage 2 — Measure 05 — Feasibility v1

Reviewing 18 ideas in `01-ideation-measure-05-v1.md` against concreteness + relevance gates.

---

1. **ROR institutional-address cross-reference** — **PASS.** Names a specific public API and the field used. Addresses fake-affiliation stories where a virtual office is far from any ROR address for the claimed institution.

2. **GLEIF LEI registered-address lookup** — **PASS.** Specific public API; addresses purpose-built-LLC stories where LEIs are absent or registered to an agent address.

3. **Companies House registered-office lookup** — **PASS.** Concrete UK API; relevance covers UK CIC sub-variants in cro-framing/shell-nonprofit/foreign-institution.

4. **Charity Commission lookup** — **PASS.** Concrete; addresses community-bio and shell-nonprofit charity sub-variants. Best-guess on exact endpoint is plausible.

5. **Google Maps Places API — institution viewport** — **PASS.** Specific paid API and concrete fields. Addresses biotech-incubator and visiting-researcher stories.

6. **OSM / Nominatim institution polygon** — **PASS.** Specific free service with named endpoint and relevant attacker stories.

7. **Ringgold Identify** — **PASS.** Named commercial directory; concrete; addresses fake-affiliation stories.

8. **Smarty US CMRA / RDI flag** — **PASS.** Highly concrete and the single most cross-cutting idea — most virtual-office bypasses get flagged here.

9. **Melissa Global Address Verification** — **PASS.** Concrete vendor; closes Smarty's non-US gap relevant to foreign-institution and Estonian shell sub-variants.

10. **Institutional website scrape** — **PASS.** SOP is concrete (canonical "Contact"/"Locations" pages from the ROR-listed domain). Addresses fake-affiliation stories where ROR/Ringgold lack satellite address coverage.

11. **University campus map / facilities portal** — **REVISE.** Concept is concrete but no standardized API; the idea acknowledges this. Either (a) name 2-3 specific universities' map data URLs (e.g., Harvard `campusmap.harvard.edu`, MIT `whereis.mit.edu`) so stage 4 has a concrete starting point, or (b) reframe as a fallback that only triggers when the customer's claimed institution publishes machine-readable building data. Otherwise risks being unimplementable.

12. **OpenCorporates registered-address** — **PASS.** Specific API and a thoughtful caveat about registered-agent addresses. Combined-flag logic is sound.

13. **EDGAR / SEC entity address** — **REVISE.** Concrete API but relevance is thin: the attacker stories under measure 05 are all small LLCs / community labs / shells, none of which file with the SEC. EDGAR catches almost no one in the mapping file. Either justify with a specific story or drop.

14. **Incubator/coworking tenant directory scrape** — **PASS.** Specific incubators named; directly addresses biotech-incubator-tenant and gradual-legitimacy-accumulation, the load-bearing stories for measure 05.

15. **Carrier-redirect lockdown SOP** — **PASS.** Concrete carrier features named; the only idea that addresses credential-compromise / account-hijack / dormant-account-takeover post-shipment redirect, which no database lookup can catch.

16. **Provider org registry with two-contact change control SOP** — **PASS.** Concrete SOP with specific gates; uniquely addresses the registry-add-address sub-paths in account-hijack, it-persona-manufacturing, dormant-account-takeover, inbox-compromise.

17. **Wikidata institution coordinates** — **PASS.** Specific SPARQL endpoint and properties named. Some duplication with ROR but uses different data path and is a valid free fallback.

18. **GRID legacy dataset** — **REVISE.** Concrete but functionally dominated by ROR (which is GRID's successor and is actively maintained). Either justify as an offline cache / outage fallback explicitly, or drop as duplicate of #1.

---

## Gaps

No idea explicitly addresses **physical-interception at a real institutional address** (account-hijack Method 1, visiting-researcher Option 3). Measure 05 strictly speaking *passes* in those cases — the address really is the institution — so this is arguably out of scope, but worth noting that measure 05 is structurally blind to that bypass.

## STOP: no
