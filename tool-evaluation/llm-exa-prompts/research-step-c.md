# LLM+Exa Prompt Research: Step (c) Email to Affiliation

**Flag:** "Does not match institution domain / non-institutional domain."
**Goal:** Design the LLM+Exa prompt to provide complementary coverage where structured APIs fail.

---

## 1. Coverage Gaps from Structured APIs

The structured endpoints for step (c) are: disposable blocklist, free-email blocklist, ROR domain match, RDAP creation date, MX/SPF/DMARC, lookalike/homoglyph detector, InCommon/eduGAIN, ORCID, and OpenAlex. Here is where they fail, with specific examples from testing.

### Gap 1: Obscure or unusual institutional domains -- no ROR domain, no InCommon match

ROR domain coverage is ~50% of institutions. InCommon/eduGAIN drops sharply outside US/China/India (Iran: 2 IdPs, Russia: 0, Korea: 29). When an email comes from a legitimate domain that is not in ROR and not in a federation, the structured APIs produce silence -- no match, no rejection, just nothing.

**Examples:**
- `aasciences.africa` (African Academy of Sciences) -- `.africa` TLD is unusual, not in ROR domains list, not in any federation. The domain is legitimate but would produce zero signal from structured APIs.
- `chula.ac.th` (Chulalongkorn University) -- `.ac.th` is Thai academic. ROR may not have the domain populated. InCommon MDQ may not surface Thai federation members.
- `uonbi.ac.ke` (University of Nairobi) -- `.ac.ke` Kenyan academic. Same issue.
- `genspace.org` (community bio lab) -- not an academic domain, not in ROR, not in any federation, not a free email provider. Falls through every structured check.
- `sharif.edu` (Sharif University of Technology, Iran) -- has a `.edu` domain registered through Educause but is NOT in InCommon. The heuristic "if .edu then InCommon member" has false negatives.

**What LLM+Exa can do:** Search for `"{domain}" official website` or `"{domain}" institution` and confirm the domain belongs to a real institution from the institution's own web pages, contact pages, or directory listings.

### Gap 2: Free email + claimed institution -- no email-to-institution bridge

When a customer uses `163.com`, `qq.com`, `naver.com`, `mail.ru`, `yahoo.com`, or `gmail.com` and claims an institution, the structured APIs can only say "this is free email." They cannot confirm or deny the affiliation claim. Step (c) is completely blind.

**Examples:**
- `shlei668@163.com` claiming China Agricultural University -- 163.com is correctly flagged as free email, but there is no bridge from the email to the institution. OpenAlex returns 18 "Honglei Sun" results, none clearly at China Agri. ORCID returns nothing.
- `yahoo.com` user claiming Baqiyatallah University (IRGC-affiliated) -- Baqiyatallah has ZERO DNS infrastructure (no MX, no SPF, no DMARC). Researchers *must* use free email. Step (c) is completely blind to the sanctioned-institution risk.
- `163.com` user claiming Wuhan University -- free email is the regional norm in China. 12+ customers in the dataset use 163.com.

**What LLM+Exa can do:** Search for the person's name + institution on the institution's faculty directory, publication listings, or research group pages. This crosses into "individual-affiliation verification" territory but is the only way to bridge free email to a claimed institution.

### Gap 3: Dual affiliation -- email domain from institution A, claimed affiliation is institution B

Researchers who straddle academia and industry use their academic email but claim their startup as the customer entity. The structured APIs see the academic domain and either pass it (if it matches a known institution) or flag the mismatch with the claimed entity. But they cannot determine whether the dual affiliation is legitimate.

**Examples:**
- `pasteur.fr` email, claiming TheraVectys -- Kirill Nemirov. OpenAlex shows both Institut Pasteur and Theravectys affiliations. But the structured email check just sees pasteur.fr != TheraVectys and flags a mismatch.
- `tum.de` email, claiming Fusix Biotech -- Jennifer Altomonte. OpenAlex shows TU Munich but no Fusix. The mismatch is real but the dual affiliation may be legitimate (she may have founded/cofounded Fusix while at TUM).
- `yuhs.ac` email (Yonsei University Health System), claiming GREENVAX INC. -- SOHN Myung Hyun. OpenAlex shows Yonsei but no GREENVAX. Same pattern.

**What LLM+Exa can do:** Search for `"{person name}" "{institution A}" "{institution B}"` to find LinkedIn profiles, press releases, or publications that link the person to both institutions.

### Gap 4: Common names make ORCID/OpenAlex disambiguation impossible

When the name has thousands of results, ORCID and OpenAlex cannot identify the specific person. Adding institution filters helps but does not resolve it for common institutions.

**Examples:**
- Wei Zhang: 3,304 ORCID results, 9,085 OpenAlex results.
- Maria Garcia: 2,464 ORCID, 17,865 OpenAlex.
- Qiang He at Chongqing Medical University: even with institution filter, 7 different "Qiang He" at that institution.
- Yi Shi at Chinese Academy of Sciences: 1,820 OpenAlex results.
- John Smith: 262 ORCID, 1,415 OpenAlex.

**What LLM+Exa can do:** Probably nothing better than ORCID/OpenAlex for disambiguation. Exa web search would face the same name ambiguity problem. This gap should be explicitly called out as NOT something LLM+Exa should attempt -- it will produce false confidence. The correct action for common names + free email is to request customer-provided evidence (ORCID ID, publication DOI, institutional ID page link).

### Gap 5: Small companies invisible to all registries

Lay Sciences, Fusix Biotech, GREENVAX, Lanzhou Yahua Biotech, Darts Bio -- all real synthesis DNA customers, all zero results in OpenAlex, ORCID, ROR, and every other structured API.

**Examples:**
- Satishchandran Chandrasekhar at Lay Sciences Inc -- 0 ORCID, 0 OpenAlex. Complete blind spot.
- Du Huifen at Lanzhou Yahua Biotech -- ORCID exists but employment empty, OpenAlex matches are wrong people. Company not in OpenAlex.

**What LLM+Exa can do:** Search for the company name to verify it exists as a real entity (website, state incorporation records, LinkedIn, press coverage). This does not verify the person-institution link but at least confirms the institution is real. Better than silence.

### Gap 6: .com impersonation domains -- detection requires web intelligence

`mit-edu.com` (July 2025, self-hosted MX), `stanford-edu.com` (August 2025, Zoho MX), `harvard-edu.com` (2019, PrivateEmail) all have functioning email infrastructure. RDAP creation date catches recent registrations, and the homoglyph detector should catch the pattern. But for domains >2 years old (harvard-edu.com is 7 years old), RDAP age alone does not flag them.

**What LLM+Exa can do:** For domains that look like `{institution}-edu.com` or `{institution}research.com`, search for who actually owns the domain. If it is not the institution's official domain, flag it. Exa's existing test showed correct negative for `helix-tx.com` (no web presence found). But this should be handled by the homoglyph detector first -- LLM+Exa is a fallback.

---

## 2. Cases LLM+Exa Is Already Known to Handle Well

From the 12 step (c) test cases in the existing LLM+Exa results:

### Institutional domain verification (PASS -- all cases)

Exa correctly confirmed institutional domains across a wide range of TLDs:
- `mit.edu` -- all 3 results from MIT domains (web.mit.edu, ist.mit.edu, mailto.mit.edu)
- `ox.ac.uk` -- Oxford email setup guides showing `username@ox.ac.uk` format
- `pfizer.com` -- first result is pfizer.com/contact/email, WHOIS shows registration since 1992
- `biontech.de` -- investor relations contact page shows `service@biontech.de`
- `chula.ac.th` -- contact page and main website on chula.ac.th domain (WEAK_PASS -- connection inferred, not explicit)
- `aasciences.africa` -- `.africa` TLD worked, AAS pages found on this domain
- `genspace.org` -- community bio lab confirmed as real organization
- `uonbi.ac.ke` -- official UoN pages with faculty emails as `*@uonbi.ac.ke`

**Key strength:** Exa can verify obscure and non-Western TLDs that structured APIs miss entirely. This is the primary step (c) use case for LLM+Exa.

### Free email provider rejection (CORRECT_NEGATIVE -- all cases)

Exa correctly identified free email providers and returned "cannot verify affiliation":
- `163.com` -- identified as "Active Free Email Provider" by NetEase
- `qq.com` -- identified as Tencent's QQ Mail free consumer email
- `mail.ru` -- identified as free email registration service
- `yandex.ru` -- identified as "Yandex 360 Mail - free email"

**Key strength:** Exa can identify obscure or regional free email providers that might not be on the static blocklist. This is a secondary but useful capability.

---

## 3. Cases LLM+Exa Is Already Known to Fail On

### The Harvard/Gmail hallucination -- CRITICAL

**Test case (adv-7):** Query: `"gmail.com email domain affiliated with Harvard University"`.

Exa returned Harvard's own "Gmail for Harvard" page (huit.harvard.edu/gmail) and g.harvard.edu client configuration. These are **factually correct** search results -- Harvard genuinely uses Google Workspace. But they are **fatally misleading** for the flag question: a random `@gmail.com` address has zero affiliation with Harvard. Harvard's institutional email is `@g.harvard.edu`, not `@gmail.com`.

This is the highest-risk failure mode for step (c). Without explicit prompt guardrails, the LLM has evidence that superficially supports a wrong conclusion -- and it's exactly the kind of evidence an LLM would find compelling (official institutional page confirming a connection between the institution and the email provider).

The hallucination risk generalizes to any institution that uses Google Workspace, Microsoft 365, or another consumer email provider's infrastructure:
- MIT uses Google Workspace (email is `@mit.edu`, not `@gmail.com`)
- UC Berkeley uses Google Workspace (email is `@berkeley.edu`)
- Thousands of universities use Microsoft 365 (email is `@institution.edu`, not `@outlook.com`)

### Entity name collisions

From the step (a)/(b) results but applicable to step (c): when the customer's company name matches a real but different entity, Exa may provide false confirmation. "Helix Therapeutics at LabCentral" found a real unrelated "Helix Therapeutics" company. The same could happen with domain verification -- a domain might belong to a different entity with the same name.

### Weak pass for implicit domain connections

Chulalongkorn University's `chula.ac.th` was a WEAK_PASS because no result explicitly stated "chula.ac.th is the official email domain of Chulalongkorn University." The connection was inferred from the domain hosting the university's content. This is usually correct but could produce false positives if a domain hosts content about (but not belonging to) an institution.

---

## 4. Proposed Focus Areas for the Prompt

Based on the gap analysis, the LLM+Exa prompt for step (c) should focus on these tasks, in priority order:

### Focus 1: Verify unknown institutional domains

**When to trigger:** Email domain is NOT on the free/disposable blocklist, NOT matched by ROR domain, NOT in InCommon/eduGAIN, and the homoglyph detector did not flag it. The domain is "unknown" to all structured checks.

**What the prompt should instruct:**
1. Search for the domain (e.g., `"aasciences.africa" official website`) to find the domain owner.
2. Search for the claimed institution's known domains (e.g., `"African Academy of Sciences" official email domain`) to cross-reference.
3. Compare: does the domain belong to the claimed institution?

**Expected output:** `MATCH` (domain confirmed as institution's), `MISMATCH` (domain belongs to a different entity), `UNKNOWN` (insufficient evidence).

### Focus 2: Confirm free-email-to-institution bridge (individual lookup)

**When to trigger:** Email is on the free email blocklist AND the person has a unique or moderately common name. Do NOT trigger for very common names (see pitfall section).

**What the prompt should instruct:**
1. Search for `"{person name}" "{institution name}" researcher OR professor OR scientist`.
2. Look for: faculty directory listings, lab group pages, publication author pages, university news articles, LinkedIn profiles.
3. Determine: is this person publicly associated with this institution?

**Expected output:** `CONFIRMED` (person found at institution with supporting evidence), `NOT_FOUND` (no evidence of association), `AMBIGUOUS` (multiple people with same name, cannot disambiguate).

### Focus 3: Verify legitimacy of unknown company domains

**When to trigger:** Email domain belongs to a small company not in ROR or OpenAlex. The domain passes basic checks (not disposable, not free, not a lookalike) but is unknown.

**What the prompt should instruct:**
1. Search for the domain to find the company website.
2. Search for the company name to find incorporation records, LinkedIn page, press coverage, or product pages.
3. Determine: is this a real company? Does the domain belong to it?

**Expected output:** `VERIFIED` (company exists, domain is theirs), `NOT_FOUND` (no web presence for company or domain), `SUSPICIOUS` (domain exists but company claims seem inconsistent).

### Focus 4: Resolve email-institution mismatches (dual affiliation)

**When to trigger:** Email domain matches institution A (confirmed by ROR or other), but the customer claims institution B. The structured check flags a mismatch.

**What the prompt should instruct:**
1. Search for `"{person name}" "{institution A}" "{institution B}"` to find dual affiliation evidence.
2. Look for: co-authored publications listing both affiliations, LinkedIn showing both roles, press releases, patent filings.
3. Determine: is the dual affiliation legitimate?

**Expected output:** `DUAL_CONFIRMED` (evidence of both affiliations), `SINGLE_ONLY` (person only associated with institution A), `NOT_FOUND`.

---

## 5. Known Pitfalls to Guard Against

### Pitfall 1: Harvard/Gmail hallucination -- HIGHEST PRIORITY

**The rule:** If the email domain is a known free email provider (gmail.com, outlook.com, yahoo.com, 163.com, 126.com, qq.com, mail.ru, yandex.ru, naver.com, hanmail.net, protonmail.com, tutanota.com, or any domain on the free email blocklist), the answer to "is this domain affiliated with [institution]?" is always **CANNOT_VERIFY**, regardless of what search results show.

The prompt must include this as an explicit, unconditional instruction -- not a guideline the LLM can override based on evidence. The instruction should explain WHY: "Many institutions use Google Workspace or Microsoft 365 internally. Their institutional email addresses are @g.institution.edu or @institution.edu, NOT @gmail.com or @outlook.com. Search results showing that an institution uses Google Workspace do NOT mean that a @gmail.com address belongs to that institution."

### Pitfall 2: Do not attempt common-name disambiguation

**The rule:** If the person's name has >100 results in a general web search (typical for Chinese, Korean, Indian, and common Western names), the LLM should return `AMBIGUOUS` immediately without further searching. Continued searching will produce false confidence -- the LLM will find *a* person with that name at that institution and may incorrectly conclude they are the requester.

The prompt should include examples of names that trigger this: Wei Zhang, Maria Garcia, Qiang He, Yi Shi, John Smith.

### Pitfall 3: Entity name collisions

**The rule:** When verifying a company domain, the LLM must verify that the company found at the domain is the *same* company as the customer's claimed institution, not just a company with a similar name. Check for address consistency, industry match, and founding date.

Example: "Helix Therapeutics" in the search results may be a real HIV/AIDS biotech in a different city, not the customer's "Helix Therapeutics Inc." at LabCentral in Cambridge.

### Pitfall 4: ORCID self-asserted data has zero verification value

**The rule:** If the LLM finds an ORCID profile confirming affiliation, it should note that ORCID employment records are self-asserted (0% institution-verified in testing). An attacker can create an ORCID profile claiming any institution in ~5 minutes. ORCID findings should be reported but with a `trust_level: low` tag.

### Pitfall 5: OpenAlex conflation and splitting

**The rule:** OpenAlex author profiles may merge publications from different people with similar names, or split a single person across multiple profiles. If the LLM uses OpenAlex-sourced information from Exa results, it should flag conflation risk when the profile shows unusually diverse affiliations or unusually high publication counts.

### Pitfall 6: Stale institutional affiliation data

**The rule:** Researchers change institutions. OpenAlex lags reality by 1-3 years. ORCID is more current but only because the user manually updates it. If the LLM finds evidence of a person at an institution, it should check the date of the evidence. A 2022 publication from a 2025 order does not confirm current affiliation.

---

## 6. Draft Input/Output Schema

### Input fields

```yaml
# Required
email_domain: "aasciences.africa"          # The email domain to verify
claimed_institution: "African Academy of Sciences"  # Customer's claimed institution

# Optional -- provided when available
person_name: "Jane Doe"                    # Customer name (for individual lookup)
person_email: "jane.doe@aasciences.africa" # Full email address
institution_country: "Kenya"               # Known country of institution

# Context from prior structured checks
structured_results:
  disposable_blocklist: false              # Is on disposable email list?
  free_email_blocklist: false              # Is on free email list?
  ror_domain_match: null                   # ROR match result (matched/not_matched/not_in_ror)
  incommon_match: null                     # InCommon/eduGAIN match result
  rdap_creation_date: null                 # Domain creation date from RDAP
  homoglyph_flag: false                    # Lookalike detector triggered?
  openalex_match: null                     # OpenAlex affiliation match result
```

### Output schema

```yaml
# Primary verdict
verdict: "MATCH"
  # MATCH -- domain confirmed as belonging to claimed institution
  # MISMATCH -- domain belongs to a different entity than claimed
  # FREE_EMAIL -- domain is a free email provider, cannot verify affiliation
  # CANNOT_VERIFY -- insufficient evidence to confirm or deny
  # AMBIGUOUS -- multiple interpretations possible (e.g., common name)
  # SUSPICIOUS -- domain or entity shows red flags

confidence: "high"    # high / medium / low

# Evidence
evidence_summary: "aasciences.africa hosts official AAS pages including contact page with staff emails as *@aasciences.africa. Domain clearly belongs to AAS."

evidence_sources:
  - url: "https://www.aasciences.africa/contact"
    relevance: "Official contact page showing institutional email addresses on this domain"
  - url: "https://www.aasciences.africa/about"
    relevance: "About page confirming AAS identity"

# Exa search queries used (for audit trail)
searches_performed:
  - query: "aasciences.africa official website"
    num_results: 3
  - query: "African Academy of Sciences email domain"
    num_results: 3

# Flags and warnings
flags:
  - flag: "unusual_tld"
    detail: ".africa is an uncommon TLD but legitimate for African organizations"

# Individual affiliation (only populated when person_name provided and domain is free email)
individual_verification:
  attempted: false      # Was individual lookup attempted?
  result: null          # CONFIRMED / NOT_FOUND / AMBIGUOUS
  common_name_risk: false  # Was the name too common to disambiguate?
  evidence: null

# Dual affiliation (only populated when email domain != claimed institution domain)
dual_affiliation:
  detected: false
  institution_a: null   # Institution matching email domain
  institution_b: null   # Claimed institution
  evidence: null
```

### Decision logic for which task to perform

```
IF email_domain is on free_email_blocklist:
  IF person_name provided AND name is not common:
    -> Perform Focus 2 (individual affiliation lookup)
    -> Verdict: based on individual lookup result
  ELSE:
    -> Verdict: FREE_EMAIL / CANNOT_VERIFY
    -> Do NOT search for "{free_provider} affiliated with {institution}"

ELIF email_domain is on disposable_blocklist:
  -> Verdict: SUSPICIOUS (should have been caught by structured check)

ELIF ror_domain_match == "matched":
  IF claimed_institution matches ROR institution:
    -> Verdict: MATCH (already confirmed, LLM+Exa not needed)
  ELSE:
    -> Perform Focus 4 (dual affiliation resolution)

ELIF email_domain is unknown (not free, not disposable, not in ROR):
  -> Perform Focus 1 (verify unknown institutional domain)
  -> If domain belongs to a company not in registries:
    -> Also perform Focus 3 (verify company legitimacy)
```

---

## 7. Summary of Exa Queries to Design

Based on the focus areas, the prompt should template these search patterns:

| Task | Query template | Expected signal |
|---|---|---|
| Verify unknown domain | `"{domain}" official website email` | Institution's own pages on the domain |
| Cross-reference institution domain | `"{institution name}" official email domain contact` | Institution page listing its email format |
| Individual affiliation (free email) | `"{person name}" "{institution}" researcher OR faculty` | Faculty page, lab group page, publication |
| Company domain verification | `"{company name}" company website founded` | Company homepage, LinkedIn, incorporation |
| Dual affiliation evidence | `"{person name}" "{institution A}" "{institution B}"` | LinkedIn, co-authored papers, press |
| Impersonation domain check | `"{suspicious domain}" who owns` | WHOIS info, registrant details |

---

## 8. What This Prompt Should NOT Do

1. **Should NOT replace the disposable/free email blocklists.** The blocklists are deterministic, instant, and free. LLM+Exa is a $0.007+ supplement for cases that fall through.

2. **Should NOT attempt to verify DMARC/SPF/MX.** DNS-based checks are already covered by the structured email-domain endpoints and are unreliable as trust signals anyway (guerrillamail has p=reject).

3. **Should NOT attempt common-name disambiguation.** This is a dead end that produces false confidence. If Wei Zhang + 163.com comes through, the correct answer is CANNOT_VERIFY + request customer evidence.

4. **Should NOT use ORCID findings as high-trust evidence.** 0% institution-verified. Self-asserted data is no better than the customer's own claim.

5. **Should NOT search for "{free email provider} affiliated with {institution}."** This is the query pattern that triggers the Harvard/Gmail hallucination. The prompt must explicitly forbid this query formulation.
