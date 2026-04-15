# Coverage research: FSAP + NIH OSP IBC roster ingestion

## Coverage gaps

### Gap 1: Commercial biotech companies without IBC registration or FSAP registration
- **Category:** Commercial biotech companies, CROs, and startups that do not receive NIH funding (and thus have no obligation to register an IBC with NIH OSP) and do not work with select agents (and thus are not in FSAP). These companies are structurally invisible to both data sources.
- **Estimated size:** Biopharmaceutical and diagnostics companies hold 42% of the DNA synthesis market ([Credence Research, 2024](https://www.credenceresearch.com/report/dna-synthesis-market)). FSAP has only 230 registered entities nationally ([2024 FSAP Annual Report](https://www.selectagents.gov/resources/publications/docs/2024-FSAP-Annual-Report_508.pdf)). The IBC-RMS roster covers institutions with NIH-funded recombinant/synthetic nucleic acid research, which skews heavily academic. [best guess: the majority of commercial synthesis customers — perhaps 30–40% of all synthesis customers — have neither IBC registration nor FSAP registration and receive no signal from this check. They route entirely to alternative verification (m18, m19).]
- **Behavior of the check on this category:** no-signal — `ibc_not_listed` flag fires, routing to alternative checks. The check provides no positive or negative signal for these customers.
- **Reasoning:** The implementation acknowledges this explicitly: commercial biotechs "may not have an IBC and are not FSAP-registered for any agent they work with; the check provides no signal for them."

### Gap 2: Foreign institutions (non-US)
- **Category:** All synthesis customers at institutions outside the United States. FSAP is US-only; the NIH IBC-RMS roster covers primarily US institutions receiving NIH funding. Non-US institutions, even major research universities, are not in either registry.
- **Estimated size:** The international market outside North America is ~45% of the gene synthesis market ([GM Insights, 2025](https://www.gminsights.com/industry-analysis/gene-synthesis-market)). Even within North America, Canadian institutions are not in FSAP or IBC-RMS. [best guess: 40–50% of synthesis customers are at non-US institutions and receive zero signal from this check.]
- **Behavior of the check on this category:** no-signal — neither FSAP nor IBC-RMS covers non-US entities. The check returns null and routes to alternative verification.
- **Reasoning:** The implementation flags "foreign institutions — entirely uncovered by FSAP / IBC; FSAP is US-only, IBC is US-NIH-funded primarily."

### Gap 3: US academic institutions without NIH-funded recombinant/synthetic nucleic acid research
- **Category:** US academic institutions that do not receive NIH funding for work under the NIH Guidelines for Research Involving Recombinant or Synthetic Nucleic Acid Molecules. Small liberal-arts colleges, community colleges with biology programs, and institutions funded primarily by NSF, DoD, or private foundations may not have registered an IBC with NIH OSP.
- **Estimated size:** [unknown — searched for: "NIH IBC registered institutions count number how many universities biosafety committee"]. The total count of IBC-RMS-registered institutions is not publicly disclosed in the search results. [best guess: most US R1 (~130) and R2 (~130) universities have IBCs, plus many medical schools and research institutes — perhaps 400–600 institutions. There are ~4,000 degree-granting US postsecondary institutions ([NCES](https://nces.ed.gov/fastfacts/display.asp?id=84)); the IBC-registered fraction is perhaps 10–15%. However, synthesis-ordering institutions are heavily concentrated among R1/R2 universities, so the effective coverage of IBC-RMS among actual synthesis customers is higher — perhaps 50–70% of US academic synthesis customers.]
- **Behavior of the check on this category:** no-signal — institution is not in IBC-RMS; routes to alternative verification.
- **Reasoning:** IBC registration is tied to NIH-funded recombinant/synthetic nucleic acid work. Institutions doing biology without NIH funding for that specific category are not required to register.

### Gap 4: Researchers at IBC-registered institutions working outside the IBC's scope
- **Category:** Scientists at institutions that have a registered IBC, but whose specific work does not fall under the IBC's purview (e.g., purely computational biology, chemical synthesis, or research not involving recombinant/synthetic nucleic acids as defined by the NIH Guidelines).
- **Estimated size:** [unknown — searched for: "IBC scope recombinant synthetic nucleic acid proportion researchers institution"]. [best guess: at a typical R1 university with a registered IBC, perhaps 30–50% of biology-adjacent researchers are doing work that falls outside the IBC's formal scope. These researchers may still order synthetic DNA for reasons outside IBC oversight. The check would pass them (their institution is in IBC-RMS) even though the BSO cannot meaningfully vouch for their specific work.]
- **Behavior of the check on this category:** false-positive (over-crediting) — the check passes the researcher as pre-approved based on institutional IBC status, but the IBC has no actual oversight of their specific research.
- **Reasoning:** The implementation flags this: "researchers at IBC-registered institutions doing work outside the IBC's scope (e.g., purely chemical synthesis) — the check passes them as pre-approved without validating the actual order is in scope."

### Gap 5: BSO responsiveness and data freshness in IBC-RMS
- **Category:** Institutions where the BSO listed in IBC-RMS has departed, changed roles, or is unresponsive. The verification email bounces or goes unanswered, stalling the pre-approval process.
- **Estimated size:** [unknown — searched for: "biosafety officer turnover rate university", "IBC roster data freshness NIH OSP"]. [best guess: BSO turnover at smaller institutions is probably every 3–5 years; at larger institutions it may be more frequent. If IBC-RMS data is updated annually or less frequently, 10–20% of BSO contact records may be stale at any given time.]
- **Behavior of the check on this category:** weak-signal — the check initiates correctly but stalls at the BSO confirmation step. The 14-day fallback to alternative verification (m18, m19) handles this, but adds weeks of delay.
- **Reasoning:** The implementation flags "BSO email bounces or BSO has departed" as a failure mode. The manual SOP (email BSO → wait → fallback) is the mitigation but introduces latency.

### Gap 6: FSAP entity list is not public (structural limitation)
- **Category:** All customers claiming FSAP registration. The check cannot be automated because the FSAP entity list is security-sensitive and not publicly disclosed. Verification degrades to manual attestation + phone/email callback to the Responsible Official.
- **Estimated size:** 230 FSAP-registered entities nationally ([2024 FSAP Annual Report](https://www.selectagents.gov/resources/publications/docs/2024-FSAP-Annual-Report_508.pdf)). All 230 entities' pre-approval via this check requires manual human verification. At $5–$25 per verification ([best guess from the implementation]), total cost for full-roster verification: ~$1,150–$5,750.
- **Behavior of the check on this category:** weak-signal — depends entirely on the RO responding and confirming truthfully. No automated cross-reference possible.
- **Reasoning:** The implementation identifies this as "the central limitation." The check is a manual SOP, not an automated lookup. It is reliable when the RO responds but slow and unscalable.

## Refined false-positive qualitative

1. **Researchers at IBC-registered institutions doing out-of-scope work** (stage 4 + Gap 4) — upgraded. The check over-credits these researchers.
2. **Adjunct / visiting researchers** (stage 4) — remains. BSO may not recognize them.
3. **Core facility staff** ordering on behalf of multiple PIs (stage 4) — remains. BSO cannot vouch for every downstream PI.
4. **Institutions with stale BSO contacts** (Gap 5) — new. Stalls the process but is ultimately a delay, not a false credential.

## Notes for stage 7 synthesis

- The combined coverage gap of Gaps 1 + 2 + 3 means that **the majority of synthesis customers receive no signal from this check**: commercial companies (~30–40%), international institutions (~40–50%), and US academic institutions without IBC registration (~remaining gap). Only the subset of US academic institutions with active IBC registration + current BSO contacts gets reliable coverage.
- This is a high-value check for the narrow population it covers (US NIH-funded academic institutions doing recombinant/synthetic nucleic acid work), but it should not be treated as a general-purpose pre-approval mechanism.
- FSAP verification (Gap 6) is structurally a manual SOP and will remain so unless the government changes its disclosure policy. The 230-entity FSAP roster is small enough that manual verification is operationally feasible.
- The check is complementary to m18 (institution legitimacy) and m19 (individual legitimacy) — those checks cover the populations this one misses. The stage 8 synthesis should evaluate whether the IBC check adds marginal value over m18+m19 for the populations it does cover.
