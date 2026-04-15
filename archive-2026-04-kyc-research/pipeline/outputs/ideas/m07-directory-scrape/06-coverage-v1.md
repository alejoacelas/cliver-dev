# Coverage research: Institutional directory people-search scrape

## Coverage gaps

### Gap 1: Institutions without a public people-search directory
- **Category:** Universities and research institutions that either (a) have no public-facing directory at all, (b) gate their directory behind SSO/VPN, or (c) suppress individual entries under GDPR or institutional privacy policy. This includes most EU institutions (GDPR default is suppression of individual data without opt-in), many Asian institutions, and smaller colleges worldwide.
- **Estimated size:** There are ~25,000–30,000 universities worldwide [source](https://en.uhomes.com/blog/how-many-universities-are-there-worldwide), with ~50,000 higher education institutions of all types. In the US, there are 187 R1 and 140 R2 research universities (2025 Carnegie Classification) [source](https://carnegieclassifications.acenet.edu/news/carnegie-classifications-release-2025-research-activity-designations-debut-updated-methodology/). Building per-institution adapters for the ~327 US R1+R2 institutions is feasible (stage 4 estimates ~$40K–$160K one-time). But outside the US, EU GDPR commonly suppresses individual directory entries [source](https://www.insidehighered.com/news/2018/03/13/colleges-are-still-trying-grasp-meaning-europes-new-digital-privacy-law/), and many institutions gate directories behind authentication. A conservative estimate: adapters can be built for ~200–400 US/UK/Canadian/Australian institutions; the remaining ~25,000+ worldwide institutions would require manual fallback or the m07-google-site-search approach.
- **Behavior of the check on this category:** no-signal (the scrape returns `directory_gated` or no adapter exists; the check cannot confirm or deny affiliation)
- **Reasoning:** This is the dominant coverage gap. The idea is explicitly designed as a bottom-of-funnel check for institutions where federated authentication (m07-incommon-edugain) is unavailable, but even the scrape path fails for institutions that don't expose public directories.

### Gap 2: Postdocs, visiting researchers, and temporary staff not listed in central directories
- **Category:** Postdoctoral researchers, visiting scholars, courtesy/adjunct faculty, and temporary research staff whose names appear only on lab-specific web pages, not in the institution's central people-search directory. Also: newly hired staff in the lag period between appointment and directory publication.
- **Estimated size:** There are approximately 40,000–60,000 postdocs active in the US at any time [best guess: based on NSF Survey of Graduate Students and Postdoctorates estimates of ~60,000 postdocs in science and engineering in the US]. Reliable data on postdocs is lacking due to "difficulties that lack of job title standardization, postdoc mobility, and the ad hoc nature of institutional postdoctoral administration present to data collection efforts" [source](https://pmc.ncbi.nlm.nih.gov/articles/PMC8809557/). Directory publication lag for new hires is typically 2–6 weeks [best guess: from stage 4 estimate]. At any given time, ~5–10% of active researchers at a large university may not appear in the central directory [best guess: derived from postdoc-to-faculty ratios at research-intensive institutions].
- **Behavior of the check on this category:** false-positive (the scrape returns `directory_no_match` for a legitimate researcher who is simply not yet listed or listed only on a lab page)
- **Reasoning:** Stage 4 identifies this as a key false-positive source. The SOP correctly treats directory misses as a soft signal, but the review burden accumulates: each miss requires manual follow-up (lab page search, Google Scholar check, ORCID lookup).

### Gap 3: Industry, hospital, and government lab employees
- **Category:** Customers at pharmaceutical companies, hospital research labs, national labs (NIH intramural, DOE labs), and contract research organizations (CROs) whose employee directories are corporate/SSO-gated and not publicly scrapable.
- **Estimated size:** Biotechnology and pharmaceutical companies represent ~55% of the synthetic biology market by revenue [source](https://www.grandviewresearch.com/industry-analysis/synthetic-biology-market). Not all of these are DNA synthesis customers (many buy from in-house synthesis capabilities), but a substantial fraction of synthesis orders come from industry. Government labs (NIH, CDC, USAMRIID, DOE national labs) and hospital research departments typically do not expose employee directories to public scraping.
- **Behavior of the check on this category:** no-signal (the scrape cannot access gated corporate directories)
- **Reasoning:** This is a structural limitation. The idea is designed for academic institutions with public directories. Industry customers require different verification approaches (corporate email domain verification via m02-mx-tenant, LinkedIn via m07-proxycurl-linkedin, or institutional attestation).

### Gap 4: Customers using preferred names or name variants
- **Category:** Customers whose name on the order differs from their directory listing: preferred first names, maiden vs. married surnames, hyphenated names, accented characters, nicknames, or transliterated non-Latin names.
- **Estimated size:** [unknown — searched for: "percentage of researchers using preferred name different from legal name", "name mismatch rate institutional directory" — no data]. Anecdotally, name variation is common (marriage-related surname changes, preference for English first names among international researchers). The fuzzy-matching field (`name_similarity_score`) partially mitigates this.
- **Behavior of the check on this category:** weak-signal (fuzzy matching catches some variants but misses others, especially across scripts)
- **Reasoning:** Stage 4 documents this as a failure mode. The mitigation is to use fuzzy matching with a tunable threshold, but threshold tuning is per-institution and error-prone.

### Gap 5: Small colleges and non-university research organizations
- **Category:** Community colleges, teaching-focused liberal arts colleges, independent research institutes (think tanks, NGOs, foundations), and industry research parks that do not have standard university-style directories.
- **Estimated size:** The US has ~3,278 higher education institutions [source](https://en.uhomes.com/blog/how-many-universities-are-there-worldwide) but only 327 are R1/R2. The remaining ~2,950 US institutions plus thousands of non-university research organizations worldwide are unlikely to have scrapable directories in a standard format.
- **Behavior of the check on this category:** no-signal (no adapter exists; fallback to m07-google-site-search or manual review)
- **Reasoning:** The adapter-per-institution model scales to a few hundred institutions. Beyond that, the marginal cost of writing and maintaining adapters exceeds the value. The m07-google-site-search idea is the intended complement for the long tail.

### Gap 6: EU institutions under GDPR opt-out defaults
- **Category:** European universities and research institutes where individual directory entries are suppressed by default under GDPR data-minimization principles. Faculty may appear if they've consented, but staff, students, and postdocs often do not.
- **Estimated size:** Europe represents ~20–25% of the global DNA synthesis market [best guess: derived from total market minus APAC 23%, North America 40–55%, and rest-of-world]. The EU has thousands of higher education institutions. GDPR's "right to be forgotten" and data-minimization requirements mean that many EU institutions do not publish comprehensive people directories online [source](https://www.insidehighered.com/news/2018/03/13/colleges-are-still-trying-grasp-meaning-europes-new-digital-privacy-law).
- **Behavior of the check on this category:** no-signal (directory entries are suppressed; the scrape finds no record)
- **Reasoning:** This is a policy-driven gap, not a technical one. EU customers at GDPR-compliant institutions will systematically produce directory misses. The SOP must account for this by treating EU-institution misses differently from US-institution misses.

## Refined false-positive qualitative

Cross-referenced with gaps above:

1. **Postdocs and new hires** (Gap 2): The most common false-positive scenario for US institutions with adapters. Estimated ~5–10% of active researchers at R1 institutions may not appear in the central directory at any time.

2. **Common-name customers** (noted in stage 4): At large institutions (e.g., major Chinese or Indian universities with tens of thousands of faculty/staff), a common name may match multiple directory entries, none clearly the right person. This produces ambiguous rather than negative results.

3. **Preferred-name mismatches** (Gap 4): Customers using English preferred names (common among Chinese and Korean researchers in the US) when the directory lists legal names. The fuzzy matcher may not bridge the gap between "Mike" and "Mingwei."

4. **EU GDPR suppression** (Gap 6): Systematic false negatives for EU-institution customers. Not a per-customer error but a per-institution structural absence.

5. **Core facility / shared-resource lab customers** (noted in stage 4): The person listed on the order is a technician or facility manager whose name appears only in the facility's internal booking system, not in the central directory.

## Notes for stage 7 synthesis

- This idea has structurally limited coverage: it works well for ~200–400 US/UK/Canadian/Australian research universities with public directories and dedicated adapters, but provides no signal for the majority of global institutions (Gap 1), industry customers (Gap 3), or EU-GDPR-suppressed institutions (Gap 6).
- The adapter maintenance burden is significant: institutional websites redesign ~1–3 times per year (stage 4 estimate), requiring ongoing engineering investment.
- The idea is explicitly complementary to m07-google-site-search (handles the long tail), m07-incommon-edugain (handles federated institutions), and m07-proxycurl-linkedin (handles industry customers). It should not be evaluated in isolation.
- For the policymaker audience: this check confirms *presence* on an institutional directory, which is a weak signal of legitimacy (an attacker who is a genuine university employee would pass). Its value is primarily negative: a directory miss raises a flag for further investigation.
