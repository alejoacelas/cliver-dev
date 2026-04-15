# Measure 18 — Institution-legitimacy (SOC)

Attacker stories where the institution-level legitimacy signal is the load-bearing element being constructed, fabricated, inherited, or exploited. Ordered most-directly-engaging first.

---

## shell-nonprofit
- **Profile:** purpose-built-organization
- **Target:** Stand up a fake research nonprofit whose constructed entity-level signals (name, domain, website, preprints, ROR listing, fiscal sponsor) approximate a legitimate institution. The name is deliberately chosen to collide with a real research institution so casual reviewers conflate the two.
- **Bypass excerpts (verbatim):**
  - Method: "Name-collision reflected legitimacy" — "Registers an entity name that near-collides with a real research institution in the same vertical (e.g., 'Midwest Institute for Genomic Health' alongside a real 'Midwest Genomics Institute'). When a reviewer searches the entity name, Google results bleed the real institution's publications and grants into the picture." Expertise: "Novice — patient name-space research and picking a plausible near-collision." Cost: "$0 marginal (name choice made at entity registration)."
  - Method: "Stand up the shell's own domain and mailbox" — Expertise: "Novice — domain registration and hosted-email setup are template-driven." Cost: "$100–$250/year for domain + Workspace/365." Lead-up: "Hours for setup, but 4–12 weeks of pre-aging the domain before it looks plausibly established."
  - Method: "ROR self-listing (persistence variant only)" — Cost: "$0." Lead-up: "4–6 weeks after preprints exist."
  - Method: "Thin-but-checkable website" — Cost: "$100–$500." Lead-up: "1–2 weeks build + 2–6 months pre-aging."
  - Method: "Fiscal sponsorship (persistence variant)" — Cost: "$500–$2,500 onboarding + 5–10% overhead on funds." Lead-up: "4–12 weeks for sponsor due diligence."
  - Operational chain: M2 (domain + mailbox) → M3 (real-entity registration with virtual office) → M4 (name collision + website + preprint seeding + ROR + fiscal sponsorship) builds composite institutional legitimacy.
- **Why relevant:** The entire branch is a fabricated institution whose legitimacy is constructed at the entity level — exactly what M18 is designed to test.
- **Persistent supply chain:** Y

## shell-company
- **Profile:** purpose-built-organization
- **Target:** Build a Delaware LLC into something that looks like a real small biotech: aged domain, professional website, LinkedIn profiles, preprints, lab bench, order history.
- **Bypass excerpts (verbatim):**
  - Method 1: "Build entity signals from scratch" — "Incorporates a Delaware LLC, gets an EIN and DUNS number, rents either a virtual office or a co-working lab bench in a biotech hub (Boston, San Diego, RTP, Bay Area), stands up a professional website and LinkedIn profiles, posts one or two bioRxiv preprints, and places routine non-sequence-of-concern orders for several months to build a purchasing track record." Expertise: "STIX intermediate." Cost: "Virtual-office tier: ~$5-15K initial + $500-2K/month ongoing. All-in over the 9-month credibility window: ~$10-30K." Lead-up: "6-12 months to first sequence-of-concern order."
  - Method 2: "Acquire an existing company" — "(a) Dormant / micro-CRO acquisition (cheap tier): $50-100K." "(b) Going-concern with live provider accounts (premium tier): $150-300K+." Lead-up: "~3-6 months" (premium tier).
  - Operational chain: M4 entity-signal building is the dominant cost driver; M8 second-shell entity and M9 self-constituted IBC fit inside the same window.
- **Why relevant:** Branch is explicitly constructed to defeat institution-level entity-signal review for SOC orders.
- **Persistent supply chain:** Y

## biotech-incubator-tenant
- **Profile:** purpose-built-organization
- **Target:** Rent legitimate space at a biotech incubator (LabCentral, BioLabs, JLABS) so the incubator's institutional brand and IBC umbrella vouch for the shell entity at the institution-legitimacy layer.
- **Bypass excerpts (verbatim):** Branch leverages incubator residency to inherit institutional legitimacy, IBC umbrella coverage, and address verification — see source for full details on incubator costs ($3-8K/month range) and 2-6 month application cycles.
- **Why relevant:** Institutional legitimacy is borrowed wholesale from a real incubator's reputation rather than constructed from scratch.
- **Persistent supply chain:** Y

## cro-framing
- **Profile:** purpose-built-organization
- **Target:** Stand up a contract research organization façade so the entity-level signals look like a service provider with legitimate client relationships.
- **Bypass excerpts (verbatim):** CRO framing uses entity-type cover (research services) to defuse research-signal scrutiny; combines virtual office, website, and faked client engagements.
- **Why relevant:** Institution legitimacy is the central construction — the entity must look like a real CRO to pass M18.
- **Persistent supply chain:** Y

## cro-identity-rotation
- **Profile:** purpose-built-organization
- **Target:** Operate multiple CRO shell identities that rotate to avoid cumulative trace; each instance must independently pass institution-legitimacy review.
- **Why relevant:** Each rotated shell must reconstruct institutional legitimacy from scratch.
- **Persistent supply chain:** Y

## community-bio-lab-network
- **Profile:** purpose-built-organization
- **Target:** Establish or exploit a community biology lab as the registered institution; the lab's collective identity provides the institutional cover.
- **Why relevant:** Branch builds institutional legitimacy via the community-lab category, which providers may treat as a soft-vetted institution type.
- **Persistent supply chain:** Y

## gradual-legitimacy-accumulation
- **Profile:** purpose-built-organization
- **Target:** Spend 12–24 months building a real-looking entity track record (preprints, conference posters, small grants, prior orders) so by the time SOC orders are placed, M18 review finds a substantive institution.
- **Why relevant:** The branch is named for and constructed around accumulated institution-level legitimacy.
- **Persistent supply chain:** Y

## dormant-domain
- **Profile:** fake-affiliation
- **Target:** Acquire an expired/lapsed domain previously belonging to a defunct research institution and revive it. The domain's age, archive history, and prior associations provide institutional legitimacy at zero construction cost.
- **Bypass excerpts (verbatim):** Dormant domain provides aged WHOIS, Wayback history, and residual citations from the defunct entity that bleed into entity-signal review.
- **Why relevant:** Institution-legitimacy signal is inherited from a defunct real institution via domain reuse.
- **Persistent supply chain:** Y

## foreign-institution
- **Profile:** fake-affiliation
- **Target:** Claim affiliation with a foreign institution that providers cannot meaningfully verify due to language, jurisdiction, and registry-access barriers. The institution may be real-but-misrepresented or wholly fabricated.
- **Why relevant:** Exploits the asymmetric verification gap on foreign institutional legitimacy.
- **Persistent supply chain:** Y

## inbox-compromise
- **Profile:** fake-affiliation
- **Target:** Compromise (or create lookalike of) a real institutional inbox to inherit that institution's legitimacy signal during onboarding correspondence.
- **Why relevant:** Borrows real institutional legitimacy via control of the institutional email channel.
- **Persistent supply chain:** N

## credential-compromise
- **Profile:** impersonate-employee
- **Target:** Compromise a real institutional employee's credentials so the institution-level signal is inherited natively.
- **Why relevant:** Institutional legitimacy passes because the attacker is operating inside a real institution's authenticated session.
- **Persistent supply chain:** N

## it-persona-manufacturing
- **Profile:** exploit-affiliation
- **Target:** Manufacture a researcher persona at a real institution by exploiting IT onboarding flows (helpdesk social engineering, contractor accounts, alumni systems) to obtain real institutional credentials.
- **Why relevant:** Institutional legitimacy is real because the IT system has issued real credentials, even though the persona is fabricated.
- **Persistent supply chain:** Y
