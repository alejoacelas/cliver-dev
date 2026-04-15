# m18-lookalike-domain — bypass-aware hardening v1

- **measure:** M18 — institution-legitimacy-soc
- **name:** Lookalike / homoglyph institutional-domain detector
- **implementation reviewed:** `04-implementation-v1.md`

---

## Story-by-story walk

### shell-nonprofit

**Summary:** Stand up a fake research nonprofit whose name near-collides with a real institution; register its own domain, build entity signals, optionally get ROR-listed.

**Bypass methods relevant to this measure:**

1. **"Name-collision reflected legitimacy"** — entity name near-collides with a real institution (e.g., "Midwest Institute for Genomic Health" vs. "Midwest Genomics Institute").
   - **Classification: CAUGHT (partial).** The implementation's `domain_levenshtein_le_2` and `domain_dnstwist_match` flags would fire if the shell's *domain* is within edit distance 2 or in the dnstwist permutation set of a ROR-listed domain. However, name collision operates primarily at the *entity name* level, not the domain level. The shell could register `migh-research.org` (Midwest Institute for Genomic Health) while the real institution uses `midwestgenomics.org` — these domains are not within Levenshtein ≤2 and may not appear in dnstwist permutations because the name-collision strategy targets entity-name similarity, not domain-string similarity.
   - **Net: MISSED for entity-name-only collisions where the domain strings are sufficiently different.**

2. **"Stand up the shell's own domain and mailbox"** — registers a domain matching the shell entity name, sets up Workspace/365, configures SPF/DKIM/DMARC.
   - **Classification: CAUGHT if the domain is string-similar to a ROR domain; MISSED if not.** The implementation catches homoglyph and near-string domains. But the shell-nonprofit branch's domain need not be close to any existing ROR domain — it can be an original string (`genomichealthmidwest.org`) that passes all four checks (skeleton, Levenshtein, dnstwist, crt.sh age) because it doesn't resemble any ROR entry.
   - **Net: CAUGHT only in the subset of cases where the attacker deliberately mimics an existing domain.**

3. **"ROR self-listing (persistence variant)"** — shell gets itself listed in ROR after preprint seeding.
   - **Classification: AMBIGUOUS.** If the shell succeeds in getting ROR-listed, its domain becomes *part of* the ROR corpus. The implementation compares customer domains against ROR domains — but the shell's domain would now match *itself* in ROR, producing no flag. The implementation does not check whether a ROR listing is suspiciously new.
   - **Detail needed:** Does the implementation treat a ROR self-match as a pass, or does it also check ROR record age / establishment year?

4. **"Thin-but-checkable website"** — builds a templated website, pre-ages domain.
   - **Classification: MISSED.** The implementation's `domain_recently_issued_cert` flag (first cert <90 days) would catch fresh domains. But the shell-nonprofit branch explicitly pre-ages the domain 2–6 months, meaning the cert would be >90 days old by the time the SOC order is placed.

**Net assessment:** The check catches a narrow subset of shell-nonprofit attempts — those where the attacker chooses a domain string very close to an existing institution's domain. The branch's primary strategy (entity-name collision with a non-similar domain) is not addressed. The check does not meaningfully reduce the cost or lead time for this attacker.

---

### shell-company

**Summary:** Build a Delaware LLC into something resembling a real small biotech with aged domain, professional website, LinkedIn profiles, preprints, lab bench, order history.

**Bypass methods relevant to this measure:**

1. **"Build entity signals from scratch"** — incorporates LLC, gets EIN/DUNS, rents virtual office or co-working lab bench, stands up website, posts preprints, builds order history.
   - **Classification: MISSED.** The shell-company branch constructs an *original* entity identity. The domain (`acmebiotech.com`) is not derived from or similar to any existing institution's domain. None of the four detection methods (skeleton, Levenshtein, dnstwist, crt.sh) fire because there is no target domain to collide with.

2. **"Acquire an existing company"** — buys a dormant/micro-CRO or going concern with live accounts.
   - **Classification: MISSED.** An acquired company's domain is a real, aged, legitimate domain with its own history. It would not trigger lookalike flags against any ROR institution (unless the company happened to have a similar domain, which is not the strategy).

**Net assessment:** This check provides zero signal against the shell-company branch. The branch does not use domain lookalikes — it builds or acquires original entity identities.

---

### biotech-incubator-tenant

**Summary:** Rent space at a biotech incubator to inherit the incubator's brand and address for institutional legitimacy.

**Bypass methods relevant to this measure:**

1. **Incubator residency inheriting institutional legitimacy** — the entity operates under its own LLC domain while leveraging the incubator's physical brand.
   - **Classification: MISSED.** The tenant's domain is original (`tenantbiotech.com`), not a lookalike of any institution. The incubator's brand operates at the physical-address and reputation level, not the domain level.

**Net assessment:** Zero signal. The branch operates entirely outside this check's detection surface.

---

### cro-framing

**Summary:** Stand up a CRO façade with entity-type cover (research services), virtual office, website, faked client engagements.

**Bypass methods relevant to this measure:**

1. **CRO entity construction** — virtual office, website, faked client engagements under an original CRO name/domain.
   - **Classification: MISSED.** Same reasoning as shell-company: the CRO's domain is original, not a lookalike.

**Net assessment:** Zero signal.

---

### cro-identity-rotation

**Summary:** Operate multiple CRO shell identities that rotate to avoid cumulative trace.

**Bypass methods relevant to this measure:**

1. **Multiple rotated shell identities** — each shell has its own original domain.
   - **Classification: MISSED.** Each rotation creates a fresh original domain. None trigger lookalike detection.

**Net assessment:** Zero signal.

---

### community-bio-lab-network

**Summary:** Establish or exploit a community biology lab as the registered institution.

**Bypass methods relevant to this measure:**

1. **Community lab as institutional cover** — the lab has its own legitimate domain.
   - **Classification: MISSED.** Community labs use their own domains (e.g., `genespacenyc.org`), not lookalikes.

**Net assessment:** Zero signal.

---

### gradual-legitimacy-accumulation

**Summary:** Spend 12–24 months building a real-looking entity track record (preprints, grants, orders).

**Bypass methods relevant to this measure:**

1. **Accumulated entity legitimacy** — patient construction of a unique entity identity over months.
   - **Classification: MISSED.** The entity has its own original aged domain with a long cert history. All four detection methods produce no signal.

**Net assessment:** Zero signal.

---

### dormant-domain

**Summary:** Acquire an expired domain of a defunct research institution and revive it; inherit the domain's publication trail.

**Bypass methods relevant to this measure:**

1. **"Acquire the lapsed canonical domain"** — buys the exact domain previously belonging to a defunct institution.
   - **Classification: MISSED.** The attacker uses the *exact* domain of the defunct institution, not a lookalike. The implementation compares customer domains against ROR domains. If the defunct institution is still in ROR, the customer domain would exactly match, producing no flag. If the defunct institution has been removed from ROR, there is no reference domain to compare against. Either way, no lookalike flag fires.

2. **"Dangling-DNS subdomain takeover on live parent institution"** — claims a deprovisioned cloud resource behind a real university's subdomain.
   - **Classification: MISSED.** The attacker controls `lab.harvard.edu` — a subdomain of the real institution. The implementation compares the full domain string against ROR-listed domains. `lab.harvard.edu` vs. `harvard.edu` would fail the Levenshtein ≤2 test (edit distance is 4: "lab." prefix). dnstwist permutations of `harvard.edu` might include subdomain variants, but only if the `subdomain` fuzzer is applied in the reverse direction (generating subdomains of the ROR domain). The implementation document does not specify whether the comparison is bidirectional.
   - **Detail needed:** Is the dnstwist comparison run from the ROR domain generating permutations and checking if the customer domain is among them, or from the customer domain generating permutations and checking against ROR? The former would catch subdomain variants; the latter would not.

3. **"Typosquat / lookalike fallback"** — registers a near-collision domain at a retail registrar.
   - **Classification: CAUGHT.** This is exactly what the implementation is designed to detect. `lab-genomics.org` vs. `labgenomics.org` would trigger `domain_levenshtein_le_2` or `domain_dnstwist_match`. The implementation document correctly identifies this class and would flag it.

4. **"Catch-all MX for multi-persona mailboxes"** — multiple persona addresses on the controlled domain.
   - **Classification: MISSED (out of scope).** This bypass operates at the persona level, not the domain level. The implementation does not inspect individual email addresses for multiplicity.

**Net assessment:** The check catches the weakest, cheapest fallback variant (typosquat) but misses the primary bypass (exact domain acquisition) and the dangling-DNS variant. The dormant-domain branch's main strategy specifically avoids lookalike domains — it uses the real domain. Moderate value: the check forces the attacker away from the cheap typosquat fallback.

---

### foreign-institution

**Summary:** Claim affiliation with a foreign institution that providers cannot meaningfully verify.

**Bypass methods relevant to this measure:**

1. **Foreign institution exploitation** — the institution may be real-but-misrepresented or wholly fabricated, often with a domain in a non-Latin script or unfamiliar TLD.
   - **Classification: AMBIGUOUS.** If the attacker claims a real foreign institution and uses its actual domain (via compromise or visiting-researcher account), no lookalike flag fires. If the attacker fabricates a wholly new institution with a domain similar to a real foreign institution, the check could catch it — but only if that foreign institution is in ROR. ROR coverage of non-Anglophone institutions is incomplete (~30% of records lack domain data per the implementation's own estimate).
   - **Detail needed:** ROR's coverage of non-Anglophone/Global South institutions.

**Net assessment:** Marginal signal. The check's effectiveness depends heavily on ROR's foreign-institution coverage, which is acknowledged as incomplete.

---

### inbox-compromise

**Summary:** Compromise or create a lookalike of a real institutional inbox to inherit legitimacy.

**Bypass methods relevant to this measure:**

1. **Breach-dump credential reuse / targeted phishing** — attacker gains control of a real institutional email.
   - **Classification: MISSED.** The attacker uses the *real* domain of the compromised institution. No lookalike detection applies.

2. **Lookalike inbox creation** — if the attacker creates a lookalike domain instead of compromising the real one.
   - **Classification: CAUGHT.** This is exactly the implementation's target scenario. A homoglyph or typosquat of `smallcollege.edu` would be flagged.

**Net assessment:** Catches one variant (lookalike domain) but misses the primary variant (real compromised inbox). However, the implementation's spec (`00-spec.md`) correctly lists this story, and the check does address the lookalike sub-path.

---

### credential-compromise

**Summary:** Compromise a real institutional employee's credentials to inherit institutional legitimacy.

**Bypass methods relevant to this measure:**

1. **Account takeover via credential reuse** — attacker operates inside the real institution's authenticated session.
   - **Classification: MISSED.** The attacker uses the real institution's domain. No lookalike signal.

**Net assessment:** Zero signal. The branch operates entirely within a legitimate institution's domain.

---

### it-persona-manufacturing

**Summary:** IT admin manufactures a researcher persona at a real institution by exploiting IT onboarding flows.

**Bypass methods relevant to this measure:**

1. **Direct injection / visiting-scholar pathway** — attacker creates a real email at a real institution using IT admin privileges.
   - **Classification: MISSED.** The persona operates on the real institution's domain. No lookalike detection applies.

**Net assessment:** Zero signal. The manufactured persona uses a legitimate domain.

---

## Findings

### Critical

*None.*

### Moderate

**M1. Entity-name collision not addressed by domain-string comparison.**
- **Source:** shell-nonprofit, bypass "Name-collision reflected legitimacy."
- **Why missed:** The implementation operates exclusively on domain strings (Levenshtein, dnstwist, UTS #39 skeleton). The shell-nonprofit branch's primary strategy is entity-*name* collision (e.g., "Midwest Institute for Genomic Health" vs. "Midwest Genomics Institute") where the domains can be entirely different strings. The check is designed to catch domain lookalikes, not entity-name lookalikes, so this is an inherent scope limitation rather than an implementation gap.
- **Suggestion:** This gap is structural to this idea's scope. A separate idea targeting entity-name similarity (fuzzy matching of claimed institution name against ROR names) would address it, but it belongs in a different idea, not a tweak to this one.

**M2. Exact-domain acquisition (dormant-domain branch) evades all four detection methods.**
- **Source:** dormant-domain, bypass "Acquire the lapsed canonical domain."
- **Why missed:** The attacker uses the *exact* former domain of a defunct institution. The implementation only flags near-matches, not exact matches. An exact match to a ROR domain would either (a) produce no flag if the record still exists (customer domain = ROR domain), or (b) produce no comparison target if the record has been removed.
- **Suggestion:** This is structural — a domain-lookalike detector cannot catch exact-domain reuse. A WHOIS-history / registrant-change detector (a different idea) would address this.

**M3. Pre-aged domains defeat the 90-day cert-age threshold.**
- **Source:** shell-nonprofit (bypass "Thin-but-checkable website"), dormant-domain (bypass "Acquire the lapsed canonical domain"), shell-company, gradual-legitimacy-accumulation.
- **Why missed:** Multiple branches explicitly pre-age domains for 2–12 months before placing SOC orders. The `domain_recently_issued_cert` flag (first cert <90 days) does not fire for pre-aged domains.
- **Suggestion:** Extend the cert-age window to 12–18 months for domains that also trigger one of the string-similarity flags. This is a parameter tweak, not a re-research issue, and only helps for the subset where string similarity also fires.

**M4. ROR self-listing converts the check into a self-match.**
- **Source:** shell-nonprofit, bypass "ROR self-listing (persistence variant)."
- **Why missed:** If the shell entity gets ROR-listed, its domain enters the ROR corpus. The implementation would then see the customer domain matching a ROR domain exactly — which is the expected case for a legitimate customer. No flag fires.
- **Suggestion:** Cross-check ROR record `established` year and listing date against domain WHOIS creation date. A ROR record for an organization "established" in 2025 with a domain created 6 months ago could be flagged. However, this requires ROR to expose listing date metadata, which is not guaranteed.

### Minor

**m1. Bidirectional dnstwist comparison ambiguity.**
- **Source:** dormant-domain, bypass "Dangling-DNS subdomain takeover."
- **Why ambiguous:** The implementation document does not specify whether dnstwist permutations are generated from ROR domains (checking if the customer domain appears in the set) or from the customer domain (checking if any ROR domain appears). The direction matters for subdomain detection.
- **Suggestion:** Specify bidirectional comparison in the implementation: generate permutations from each ROR domain and also from the customer domain.

**m2. ROR domain coverage gap (~30% of records).**
- **Source:** foreign-institution.
- **Why ambiguous:** The implementation's own `failure_modes_requiring_review` notes that ~30% of ROR records lack a `domains` field. For these institutions, the entire check produces no signal. The implementation notes a "fall back to name fuzzy match" but does not specify the name-matching algorithm or thresholds.
- **Suggestion:** Specify the name-fuzzy-match fallback algorithm and thresholds for cases where the ROR domain field is empty.

---

## bypass_methods_known

| Bypass method | Source story | Classification |
|---|---|---|
| Name-collision reflected legitimacy (entity-name level) | shell-nonprofit | MISSED |
| Stand up shell's own domain (non-similar to any ROR domain) | shell-nonprofit | MISSED |
| ROR self-listing (domain enters ROR corpus) | shell-nonprofit | AMBIGUOUS |
| Thin-but-checkable website (pre-aged domain) | shell-nonprofit | MISSED |
| Build entity signals from scratch (original domain) | shell-company | MISSED |
| Acquire existing company (real aged domain) | shell-company | MISSED |
| Incubator tenant (original domain) | biotech-incubator-tenant | MISSED |
| CRO façade (original domain) | cro-framing | MISSED |
| Rotated CRO shells (original domains) | cro-identity-rotation | MISSED |
| Community lab (own domain) | community-bio-lab-network | MISSED |
| Gradual legitimacy accumulation (aged original domain) | gradual-legitimacy-accumulation | MISSED |
| Acquire lapsed canonical domain (exact domain) | dormant-domain | MISSED |
| Dangling-DNS subdomain takeover | dormant-domain | AMBIGUOUS |
| Typosquat / lookalike fallback | dormant-domain | CAUGHT |
| Catch-all MX multi-persona | dormant-domain | MISSED (out of scope) |
| Foreign institution (real or fabricated domain) | foreign-institution | AMBIGUOUS |
| Breach-dump credential reuse (real domain) | inbox-compromise | MISSED |
| Lookalike inbox creation | inbox-compromise | CAUGHT |
| Account takeover (real domain) | credential-compromise | MISSED |
| IT persona on real domain | it-persona-manufacturing | MISSED |

## bypass_methods_uncovered

| Bypass method | Source story | Why uncovered |
|---|---|---|
| Name-collision reflected legitimacy | shell-nonprofit | Check operates on domain strings, not entity names |
| Stand up shell's own domain (non-similar) | shell-nonprofit | Original domain not near any ROR domain |
| Thin-but-checkable website (pre-aged) | shell-nonprofit | 90-day cert threshold defeated by pre-aging |
| Build entity signals from scratch | shell-company | Original domain, no lookalike relationship |
| Acquire existing company | shell-company | Real aged domain, no lookalike |
| Incubator tenant | biotech-incubator-tenant | Original domain |
| CRO façade | cro-framing | Original domain |
| Rotated CRO shells | cro-identity-rotation | Original domain |
| Community lab | community-bio-lab-network | Original domain |
| Gradual legitimacy accumulation | gradual-legitimacy-accumulation | Aged original domain |
| Acquire lapsed canonical domain | dormant-domain | Exact domain reuse, not lookalike |
| Catch-all MX | dormant-domain | Persona-level bypass, not domain-level |
| Breach-dump credential reuse | inbox-compromise | Uses real domain |
| Account takeover | credential-compromise | Uses real domain |
| IT persona on real domain | it-persona-manufacturing | Uses real domain |

---

## Verdict: **PASS**

No Critical findings. The moderate findings (M1–M4) reflect structural scope limitations of a domain-lookalike detector — it catches domain lookalikes and misses attacks that use original or exact-real domains. This is expected and correct: the idea's value proposition is narrow (catching homoglyph/typosquat domains), and the missed attack classes are addressed by other ideas under M18 (e.g., m18-ror for entity verification, m18-nih-reporter for grant-based legitimacy checks). The findings are informative for stage 8 cross-measure synthesis but do not warrant re-research of this idea.
