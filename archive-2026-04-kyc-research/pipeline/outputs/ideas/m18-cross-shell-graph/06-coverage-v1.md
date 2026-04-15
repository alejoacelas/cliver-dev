# Coverage research: Cross-shell rotation graph

## Coverage gaps

### Gap 1: Cold-start problem — new providers or providers with thin screening history
- **Category:** DNA synthesis providers who have recently started using the system, or smaller providers with few prior customers. The graph's value is proportional to the number of previously screened entities it contains.
- **Estimated size:** [best guess: A provider with <500 screened customers would have a sparse graph where cross-shell matches are unlikely even if a rotation actor is present. The major synthesis providers (Twist, IDT, GenScript, Thermo Fisher) collectively serve thousands of institutional customers, but a new entrant or a provider newly adopting this check would see near-zero matches for the first 1–2 years of operation.]
- **Behavior of the check on this category:** no-signal (first entity in a rotation series sees no prior entity to match against)
- **Reasoning:** The implementation acknowledges the cold-start problem. The first shell in a rotation series will always pass because there is no prior node in the graph. Only the second and subsequent shells are caught.

### Gap 2: WHOIS/RDAP registrant data redacted by privacy services or GDPR
- **Category:** Entities whose domain registrant information is hidden behind privacy/proxy services or redacted under GDPR. The "domain registrant" fingerprint node is null or generic for these entities.
- **Estimated size:** As of January 2024, only 10.8% of domain records identify the actual registrant; 58.2% are behind proxy-protection services and 31.0% have redacted contact data ([source](https://www.dnib.com/articles/interisle-report-examines-domain-name-contact-data-availability)). This means ~89% of domains provide no usable registrant fingerprint.
- **Behavior of the check on this category:** weak-signal (one of the ~7 fingerprint types is unavailable; the graph must rely on the remaining fingerprints)
- **Reasoning:** The implementation lists "domain registrant (RDAP / WHOIS)" as one fingerprint type. With ~89% of domains now privacy-redacted, this fingerprint is effectively dead for most entities. The graph loses one pivot dimension.

### Gap 3: Mass-formation registered agents producing noise
- **Category:** Entities formed through high-volume registered agent services (CT Corporation, Northwest Registered Agent, Harvard Business Services, etc.) in Delaware and other formation-friendly states. These agents appear as the registered agent for tens of thousands of entities, making "shared agent" a noise signal.
- **Estimated size:** Delaware alone had 231,196 new LLC formations in 2022 ([source](https://www.delawareinc.com/blog/delaware-secretary-of-state-report-2022/)). A small number of commercial registered agents handle the majority — Harvard Business Services alone has formed 400,000+ entities since 1981 ([source](https://www.delawareinc.com/)). [best guess: the top 10 US registered-agent services collectively serve >1 million active entities. Any "shared agent" match involving these services is noise.]
- **Behavior of the check on this category:** false-positive (the `cross_shell_shared_agent` flag fires for unrelated entities that happen to use the same mass-formation agent)
- **Reasoning:** The implementation describes a "mass-formation discount" for known registered agents. The coverage gap is that maintaining and tuning this discount list is non-trivial, and an attacker aware of the discount can deliberately use a mass-formation agent to avoid the flag.

### Gap 4: Companies House PSC/officer data — partial DOB and redacted addresses
- **Category:** UK entities whose officer and PSC records provide only month/year of birth (day is redacted) and service addresses rather than residential addresses ([source](https://www.gov.uk/guidance/your-personal-information-on-the-public-record-at-companies-house)).
- **Estimated size:** This affects 100% of UK entities in the Companies House register. The partial-DOB reduces match precision for common names.
- **Behavior of the check on this category:** weak-signal (officer name matches are noisier without full DOB; "John Smith, born March 1985" matches more false positives than "John Smith, born 15 March 1985")
- **Reasoning:** The implementation notes "CH PSC data redacts full DoB and partial address; reduces match precision."

### Gap 5: Entities without LEIs, NIH grants, or institutional web presence
- **Category:** Small private companies, early-stage startups, and independent researchers that lack an LEI (no GLEIF parent fingerprint), have no NIH-funded PI (no NIH PI fingerprint), and may use shared hosting (no distinctive hosting fingerprint).
- **Estimated size:** GLEIF has ~2.8M active LEIs ([source](https://www.gleif.org/en/newsroom/blog/the-lei-in-numbers-global-transparency-and-digitalization-push-drives-lei-adoption-in-2025)) out of an estimated 300M+ businesses worldwide. Most small entities lack LEIs. [best guess: 80–90% of small commercial synthesis customers have no LEI, no NIH PI, and shared-cloud hosting — reducing their fingerprint set to at most 2–3 dimensions (agent, officer, CT cert).]
- **Behavior of the check on this category:** weak-signal (fewer fingerprint dimensions means the "≥2 independent fingerprints" threshold is harder to reach, reducing both false positives and true positives)
- **Reasoning:** The graph's power comes from the union of many fingerprint types. Entities with sparse fingerprints are harder to link even when they are genuinely part of a rotation.

### Gap 6: Cloud-hosting noise (shared IPs, CDNs, serverless)
- **Category:** Entities whose websites are hosted on shared infrastructure (AWS, Cloudflare, Vercel, Netlify) where IP, ASN, and JARM fingerprints are shared with thousands of unrelated entities.
- **Estimated size:** [best guess: the majority of small institutional websites use shared cloud hosting. Cloudflare alone proxies ~20% of all websites. An IP-level or ASN-level hosting fingerprint match for two entities on the same Cloudflare plan is meaningless.]
- **Behavior of the check on this category:** false-positive (the `cross_shell_shared_hosting` flag fires for unrelated entities on shared infrastructure)
- **Reasoning:** The implementation notes "the graph must filter out cloud-tenant noise" but does not specify how. This is an engineering problem that, if poorly solved, produces either excessive false positives or an overly aggressive filter that also discards legitimate hosting-fingerprint matches.

## Refined false-positive qualitative

1. **Mass-formation agent matches** (Gap 3) — two unrelated Delaware LLCs sharing CT Corporation as registered agent. Mitigated by discount list but imperfect.
2. **Shared cloud hosting** (Gap 6) — two entities on the same Cloudflare or AWS plan. Must be filtered aggressively.
3. **Common-name officer collisions** (Gap 4) — "John Smith, March 1985" matches across unrelated entities. Partial-DOB compounds the problem.
4. **Legitimate spinouts/consortia** — two real biotechs sharing a co-founder, a hosting provider, and a registered agent because they emerged from the same incubator. These are not shells but look like them to the graph.
5. **Shared NIH PI** — a real PI with joint appointments or collaborative grants at two institutions. Legitimate but triggers `cross_shell_shared_pi`.

## Notes for stage 7 synthesis

- The cross-shell graph is structurally a *second-order* check: it only works when there is a prior entity to match against (cold-start, Gap 1) and when the fingerprint dimensions are populated (Gap 5). Its value increases monotonically with the size of the screening history.
- The WHOIS/RDAP registrant fingerprint is effectively dead (~89% redaction rate). The implementation should drop it from the default fingerprint set or note it as a legacy dimension.
- The mass-formation-agent discount (Gap 3) and cloud-hosting filter (Gap 6) are the two most operationally demanding pieces of the graph. Both require ongoing maintenance and tuning. An attacker who understands the discount list can exploit it.
- The strongest fingerprint dimensions are: shared CT cert serial (very high signal, hard to fake), shared officer name with DOB (medium-high signal), and shared GLEIF parent (high signal for entities that have LEIs). The weakest are: shared agent (noise), shared hosting (noise), and shared WHOIS registrant (redacted).
