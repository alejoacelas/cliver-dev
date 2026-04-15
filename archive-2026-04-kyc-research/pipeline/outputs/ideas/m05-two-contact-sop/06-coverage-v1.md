# Coverage research: Two-contact directory verification SOP

## Coverage gaps

### Gap 1: Industry customers at companies with no public switchboard for verification
- **Category:** Employees at biotech, pharmaceutical, and other commercial companies where the front desk or reception will not (or cannot) confirm an individual employee's purchase authorization to an external caller. Includes companies with strict information-security policies, companies with automated phone trees that don't route to compliance, and companies that outsource procurement to GPOs.
- **Estimated size:** Biotech/pharma companies account for ~46–52% of gene synthesis revenue [source](https://www.gminsights.com/industry-analysis/gene-synthesis-market). [best guess: among mid-to-large biotech/pharma companies (500+ employees), perhaps 50–70% have front-desk policies that would refuse or be unable to process a third-party verification request for an individual employee's purchasing authority. The SOP would fail on these customers.] By order count, industry customers may represent 30–45% of total orders [best guess].
- **Behavior of the check on this category:** false-positive (triggers `two_contact_independence_failure` or `two_contact_unconfirmed`)
- **Reasoning:** The SOP requires two independent institutional contacts who can confirm affiliation. At a large pharma company, the switchboard routes to procurement, who may not recognize the individual researcher's name; the departmental email may be a team mailbox that doesn't respond to external screening queries. The SOP structurally assumes an academic/hospital governance model and does not map well to corporate procurement workflows.

### Gap 2: Institutions with privacy-suppressed directories (GDPR, small colleges)
- **Category:** Customers affiliated with institutions that suppress individual directory entries by default. This is common at: (a) German, Austrian, and Swiss universities under GDPR, (b) many UK universities post-GDPR, (c) US small colleges with opt-out directories, (d) clinical/hospital sites under HIPAA-adjacent privacy policies. The SOP cannot find two independent contacts if the directory is suppressed.
- **Estimated size:** The EU represents ~22% of gene synthesis market revenue [source](https://www.precedenceresearch.com/gene-synthesis-market). [best guess: among EU academic institutions, perhaps 30–50% have directory policies that suppress individual researcher listings by default under GDPR's data minimization principle. For US institutions, perhaps 5–10% of small colleges suppress directories. Combined, this affects maybe 10–20% of academic-origin orders globally.]
- **Behavior of the check on this category:** false-positive (triggers `two_contact_independence_failure`)
- **Reasoning:** If the reviewer cannot find two independent public contacts, the SOP cannot run as designed. The `two_contact_independence_failure` flag fires, which is treated as a strong negative signal — exactly wrong for a legitimate customer at a privacy-conscious institution.

### Gap 3: Foreign institutions with language barriers
- **Category:** Customers at institutions in non-English-speaking countries where: (a) the institution's website is in the local language only, (b) the switchboard does not route English-speaking calls, and (c) the email contact may not understand the screening request.
- **Estimated size:** Asia-Pacific accounts for ~17% and rest-of-world ~5–10% of gene synthesis revenue [source](https://www.precedenceresearch.com/gene-synthesis-market). Among these, [best guess: perhaps 40–60% of institutions in non-English-speaking countries would present a language barrier that slows or blocks the SOP. This affects ~10–15% of total orders globally.]
- **Behavior of the check on this category:** weak-signal (SOP runs but slowly and with higher failure rate)
- **Reasoning:** The reviewer either needs a local-language speaker (additional cost) or relies on English-language email, which may not get a response. The SOP's 5-day response window may be insufficient for institutions that require internal translation or routing of the request.

### Gap 4: Small / new labs where the PI is the only contact
- **Category:** Customers at small labs (1–3 people) or newly established research groups where the principal investigator is both the customer and the only person the directory lists. There is no second independent contact available.
- **Estimated size:** [unknown — searched for: "single PI lab percentage academic institutions", "one person research lab fraction universities"]. [best guess: among academic labs, perhaps 10–20% are single-PI operations without a separate lab manager, admin, or departmental contact who would recognize the customer's name. For industry sole proprietors, this fraction is much higher — nearly 100% for one-person companies.]
- **Behavior of the check on this category:** false-positive (triggers `two_contact_independence_failure` or `two_contact_partial`)
- **Reasoning:** If the only contact the reviewer can find is the customer themselves, the independence requirement fails. The SOP explicitly prohibits using customer-provided contacts, creating a dead end.

### Gap 5: Institutions that refuse third-party verification requests on principle
- **Category:** Institutions whose legal or privacy offices have a blanket policy of refusing to confirm or deny the affiliation of individuals to external inquirers. This includes some US universities, most EU universities under GDPR, and many government agencies.
- **Estimated size:** [unknown — searched for: "university refuse confirm employee affiliation third party", "FERPA directory information opt out rate"]. Under FERPA, US students can opt out of directory information disclosure; faculty/staff are typically not covered by FERPA but may be covered by institutional privacy policies. [best guess: perhaps 5–15% of institutions have policies that would result in a refusal or non-response to the verification request, independent of language barriers.]
- **Behavior of the check on this category:** false-positive (triggers `two_contact_unconfirmed`)
- **Reasoning:** The institution actively refuses to participate. Both channels return "refused" or go silent, and the SOP disposition is block — which is incorrect for a legitimate customer at a privacy-conscious institution.

### Gap 6: Scalability constraint (manual SOP, ~6–10 cases/day per FTE)
- **Category:** Not a customer-category gap but an operational coverage gap: the SOP can only process ~6–10 cases per day per full-time reviewer. For a synthesis provider with high order volumes, this creates a bottleneck where the SOP cannot be applied to all borderline cases.
- **Estimated size:** The implementation estimates ~30–60 minutes per case, yielding 6–10 cases/day per reviewer. A mid-size provider with 50K orders/year and a 5% borderline rate would need to process ~2,500 cases/year = ~10 cases/business day. This requires approximately 1 FTE dedicated to this SOP [best guess]. A large provider would need more.
- **Behavior of the check on this category:** no-signal (cases that cannot be processed are deferred or skipped)
- **Reasoning:** If the queue exceeds reviewer capacity, some cases are delayed or de-prioritized. This is a throughput constraint, not an accuracy constraint, but it limits the check's practical coverage.

## Refined false-positive qualitative

Updated from stage 4:

1. **Industry customers at large companies** (Gap 1): the largest false-positive population by volume. The SOP's academic-governance assumptions do not translate to corporate structures. ~30–45% of orders by count.
2. **GDPR-suppressed EU institutions** (Gap 2): ~10–20% of academic orders globally. Structurally excluded by privacy law.
3. **Foreign-language institutions** (Gap 3): ~10–15% of total orders. Partially mitigable with multilingual reviewers but at additional cost.
4. **Single-PI labs** (Gap 4): ~10–20% of academic labs [best guess]. Independence requirement fails by design.
5. **Privacy-refusing institutions** (Gap 5): ~5–15% of institutions. Overlaps with Gap 2 for EU.

Combined, the check has reliable coverage for: mid-to-large academic institutions in English-speaking countries with non-suppressed directories and multi-person labs. This is a substantial but not universal population — perhaps 40–60% of academic customers and a small fraction of industry customers [best guess].

## Notes for stage 7 synthesis

- This SOP has the **strongest paper trail** of any check in the pipeline (human-to-human attestation with domain-verified email replies). Where it works, it works very well.
- The problem is **where it doesn't work**: industry customers (Gap 1), GDPR-suppressed institutions (Gap 2), foreign-language institutions (Gap 3), and single-person labs (Gap 4) collectively represent a large fraction of the customer base. The SOP's design assumes a specific institutional archetype (English-speaking, multi-person, directory-public, verification-willing) that is far from universal.
- The scalability constraint (Gap 6) means this SOP is reserved for borderline/escalated cases, not bulk screening. This is appropriate for its cost structure ($30–60/case) but limits its coverage role in the pipeline.
- The false-positive rate is high for legitimate customers who happen to be at institutions that don't cooperate — and the SOP disposition for non-cooperation is "block," which is the wrong answer for these customers.
- Recommendation for synthesis: pair this SOP with m05-google-places-campus (automated positive signal) so that the SOP is only triggered when automated checks provide no signal, reducing the case load and concentrating the SOP on cases where it's most likely to succeed.
