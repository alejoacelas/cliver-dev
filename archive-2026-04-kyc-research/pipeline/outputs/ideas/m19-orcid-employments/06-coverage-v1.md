# Coverage research: ORCID employment + education record lookup

## Coverage gaps

### Gap 1: The ~98% of ORCID records without institution-verified affiliations
- **Category:** Researchers who have an ORCID but whose employment records are entirely self-asserted (added by the researcher, not by the institution's ORCID member integration). The strict "institution-verified" check produces only a weak self-asserted signal for these users.
- **Estimated size:** Per ORCID's own August 2023 statement, only ~2% of ORCID records have an affiliation added by an organization ([source](https://info.orcid.org/a-closer-look-at-orcids-affinity-for-affiliations/), as cited in 04-implementation). ORCID has 10.5 million active users ([source](https://info.orcid.org/2025-year-in-review/)), so ~10.3M have only self-asserted affiliations. [best guess: the ~2% figure may have improved slightly since 2023 as more institutions integrate ORCID, but it is unlikely to exceed 5–10% by 2026]
- **Behavior of the check on this category:** weak-signal (orcid_self_asserted_only fires; requires corroboration)
- **Reasoning:** Self-asserted employment is no harder to fabricate than any other self-reported claim. The check's strong signal (institution-verified) applies to only ~2% of the ORCID population. For the other 98%, the check degrades to "the researcher claims to work at institution X in ORCID, just as they claim it on the order form."

### Gap 2: Researchers without an ORCID at all
- **Category:** Researchers who have never registered for an ORCID iD. This includes many industry scientists, technicians, lab managers, early-career researchers at institutions that don't mandate ORCID, and researchers in regions with low ORCID adoption.
- **Estimated size:** ORCID has 10.5M active users globally ([source](https://info.orcid.org/2025-year-in-review/)). In US life-sciences faculty, adoption may be ~80–93% ([source](https://link.springer.com/article/10.1007/s11192-025-05300-7)). But among lab staff, technicians, and industry scientists, adoption is much lower. ORCID adoption varies by country: Portugal ~67%, US/China/Japan below 40%, Southeast Asia and Central Africa inconsistent ([source](https://pmc.ncbi.nlm.nih.gov/articles/PMC8996239/)). [best guess: 20–40% of legitimate DNA synthesis order-placers lack an ORCID, concentrated in industry, support staff, and researchers in lower-adoption regions]
- **Behavior of the check on this category:** no-signal (orcid_no_record fires)
- **Reasoning:** Without an ORCID, the check has nothing to look up. The search API may return no results, which is indistinguishable from a privacy-restricted record or a genuine absence.

### Gap 3: Privacy-restricted ORCID records
- **Category:** Researchers who have an ORCID but have set their employment/education records to "trusted parties only" or "private" visibility. The public API returns nothing for these fields.
- **Estimated size:** [unknown — searched for: "ORCID visibility settings percentage private records", "proportion of ORCID records with private affiliations"]. ORCID allows per-field visibility settings. [best guess: 5–15% of ORCID holders have some employment data set to non-public visibility, based on the general principle that privacy-conscious researchers exist but most accept the default public visibility]
- **Behavior of the check on this category:** no-signal (public API returns empty employment section; indistinguishable from a genuinely empty record)
- **Reasoning:** The check cannot distinguish "no employment data exists" from "employment data exists but is hidden." Both appear as empty to the public API.

### Gap 4: Industry / commercial researchers
- **Category:** R&D scientists at commercial companies. Even if they have an ORCID, their corporate employer is unlikely to be an ORCID member organization that pushes verified affiliations.
- **Estimated size:** ~50% of DNA synthesis market is commercial ([source](https://www.grandviewresearch.com/industry-analysis/us-dna-synthesis-market-report)). Few commercial companies are ORCID member organizations that push employment data. [best guess: <5% of industry R&D staff have institution-verified ORCID employment records from their corporate employer. Most have either no ORCID or a self-asserted record from their prior academic career.]
- **Behavior of the check on this category:** no-signal or weak-signal (orcid_self_asserted_only or orcid_employer_mismatch — affiliation shows old university, not current company)
- **Reasoning:** ORCID membership is concentrated in universities, research institutions, and funders. Commercial companies rarely integrate.

### Gap 5: Researchers who recently changed institutions
- **Category:** Researchers who have moved to a new institution but have not updated their ORCID record. ORCID employment is self-managed (no automatic HR feed for most institutions).
- **Estimated size:** [best guess: 5–10% of researchers are within 12 months of an institutional move at any given time. ORCID record updating is voluntary and often neglected. The stale record will show the prior employer, triggering orcid_employer_mismatch.]
- **Behavior of the check on this category:** false-positive (orcid_employer_mismatch fires for a legitimate job change)
- **Reasoning:** Unlike HR systems, ORCID relies on the researcher to update their own record. Lag is common.

### Gap 6: Recently created ORCID records (legitimate new researchers)
- **Category:** Legitimate early-career researchers who just created an ORCID (e.g., when their PhD program or funder required it). The record will be fresh with minimal content, tripping `orcid_recent`.
- **Estimated size:** [best guess: ORCID adds hundreds of thousands of new registrations per year. At any given time, perhaps 2–5% of ORCID-holding synthesis customers have records created within the last 60 days. Most of these are legitimate new registrants, not manufactured personas.]
- **Behavior of the check on this category:** false-positive (orcid_recent fires on legitimate new registrants)
- **Reasoning:** The `orcid_recent` flag is designed to catch manufactured personas, but it also catches every legitimate researcher who just created their ORCID. The false-positive rate on this flag is high.

## Refined false-positive qualitative

1. **The 98% without institution-verified affiliations** (Gap 1) — the dominant limitation. The strong check applies to only ~2% of records. For the rest, the check provides only weak corroboration.
2. **No ORCID at all** (Gap 2) — ~20–40% of order-placers. Concentrated in industry and support staff.
3. **Privacy-restricted records** (Gap 3) — ~5–15% of ORCID holders. Indistinguishable from empty records.
4. **Industry researchers** (Gap 4) — <5% have corporate-verified ORCID. Large population with weak signal.
5. **Recently moved** (Gap 5) — ~5–10% transient. Stale employer triggers mismatch.
6. **Newly created ORCIDs** (Gap 6) — 2–5% of ORCID-holders. Legitimate but suspicious-looking.

The check is strongest for mid-career academic researchers at institutions that actively push ORCID affiliations (the ~2% with verified records). For all others, it provides at best a weak positive signal (self-asserted affiliation matches claim).

## Notes for stage 7 synthesis

- The 04-implementation correctly concludes this check is best as a "confidence upgrade" gate: institution-verified ORCID affiliation is very strong evidence, but absence of verification is the norm, not the exception.
- The ~2% institution-verified rate is the key statistic. It means the strong check is effectively available only for researchers at the small number of institutions that have implemented ORCID HR integrations. This is improving but slowly.
- ORCID adoption in US life-sciences faculty is high (~80–93%), but adoption among the broader synthesis-customer population (industry, support staff, non-US) is much lower.
- The check pairs naturally with m19-openalex-author (which uses ORCID as a disambiguation key) and m19-faculty-page (for institutional-web-presence verification). It is complementary to, not a substitute for, publication-based checks.
- Consider requiring ORCID at order time: this increases the fraction of customers with a lookupable record but creates friction and excludes the ~20–40% without one.
