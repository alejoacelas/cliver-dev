# 4C claim check — m15-screening-reconciliation v1

## Verified claims

- **Aclid 2.49s for ≤100k bp** — https://www.aclid.bio/resources/guide-to-the-screening-certification-process and other Aclid resource pages substantively reference this. **PASS.**
- **SecureDNA: free, FASTA in → JSON out, multi-party oblivious hashing** — https://securedna.org/features/ and https://securedna.org/faq/. Confirmed. **PASS.**
- **SecureDNA Foundation is Swiss nonprofit (Zug)** — confirmed in FAQ. **PASS.**
- **Battelle UltraSEQ uses proprietary SOC DB + Threat Identification Algorithm** — https://www.battelle.org/markets/health/public-health/epidemiology/ultraseq. Confirmed. **PASS.**
- **Sensitivity study: 7–9% non-regulated SOC matches across 140k sequences** — https://pmc.ncbi.nlm.nih.gov/articles/PMC11447129/ substantively reports this. **PASS.**
- **Battelle minimum-region argument** — https://inside.battelle.org/blog-details/why-screen-sequences-200-bp-at-a-time. **PASS** as a citation for the blog claim, not a regulatory standard.

## Flags

- **MISSING-CITATION:** "Reports for confirmed-malicious go to FBI WMD Coordinator" — best-guess in-doc. Suggested fix: cite HHS Screening Framework Guidance (https://aspr.hhs.gov/S3/Documents/SynNA-Guidance-2023.pdf) which discusses notification, or weaken to "per the provider's incident-response policy."
- **UPGRADE-SUGGESTED:** SecureDNA API endpoint URL — the SecureDNA GitHub org hosts client code that exposes the actual endpoints; reviewer could find it.
- **VENDOR-GATED (legitimate):** Aclid and Battelle pricing/auth — appropriately marked.

## Verdict

`REVISE-minor` — fix the FBI reporting citation; otherwise claims hold.
