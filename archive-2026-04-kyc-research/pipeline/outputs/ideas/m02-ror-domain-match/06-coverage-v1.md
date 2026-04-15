# Coverage research: ROR institutional domain match

## Coverage gaps

### Gap 1: Institutions not in ROR (non-OECD, small, newly founded)
- **Category:** Academic researchers and government lab scientists at institutions not yet registered in ROR — disproportionately in Africa, South/Southeast Asia, Latin America, and small/new institutions worldwide.
- **Estimated size:** ROR contains ~120,000 organizations as of late 2024 ([ROR: Year in Review 2024](https://ror.org/blog/2024-12-17-year-in-review/)). The Scimago Institutions Ranking 2026 lists ~9,000+ research-active institutions ([Scimago IR](https://www.scimagoir.com/rankings.php)), but this undercounts small labs and government facilities. UNESCO estimates ~30,000+ higher education institutions globally. [best guess: ROR covers ~70-80% of institutions that produce >1 indexed publication/year, but only ~40-50% of all institutions that might plausibly order DNA synthesis (including small CROs, government labs, teaching hospitals). Coverage in Africa is particularly thin — a dedicated Africa subset effort is underway but incomplete ([AfricArXiv: ROR spotlight on Africa](https://info-africarxiv.ubuntunet.net/research-organization-registry-ror-the-identifier-for-research-institutions-and-universities-a-spotlight-on-africa/)).]
- **Behavior of the check on this category:** no-signal (`ror_no_record`)
- **Reasoning:** The check returns `ror_no_record` and degrades gracefully (no auto-flag). But the positive-signal pathway is closed: these customers cannot get the `ror_domain_match` green light, so they must be cleared by other means. This disproportionately burdens non-OECD customers with additional manual review.

### Gap 2: ROR `domains[]` field sparsely populated (~2% of records)
- **Category:** Researchers at institutions that ARE in ROR but whose ROR record has no `domains[]` data. The match must then fall back to extracting the apex domain from `links[type=website]`, which may not match the email domain (e.g., a hospital affiliated with a university may have a different web domain than its email domain).
- **Estimated size:** As of ROR data release v1.54 (late 2024), only 2,366 out of ~111,068 records (~2.1%) have `domains[]` populated ([ROR Data dump v1.54 on Zenodo](https://zenodo.org/records/13965926)). The remaining ~98% rely entirely on the `links[type=website]` apex fallback.
- **Behavior of the check on this category:** weak-signal
- **Reasoning:** The `links[type=website]` fallback works well for simple cases (institution website = institution email domain) but fails when: (a) the institution uses a different email domain than its website (e.g., `partners.org` email vs `massgeneralbrigham.org` website), (b) the institution has multiple domains for different schools/hospitals, (c) the website URL in ROR is outdated. The 04-implementation's manual review SOP handles (a) but at cost of reviewer time.

### Gap 3: Commercial / industrial customers (not in ROR by design)
- **Category:** Legitimate commercial synthesis customers — biotech companies, pharmaceutical companies, CROs, CDMOs — that are not research organizations and will never appear in ROR.
- **Estimated size:** ~46% of DNA synthesis revenue comes from commercial customers (biopharmaceutical companies + CROs) ([Fortune Business Insights: DNA Synthesis Market](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799)). ROR's `types[]` field includes `company`, but curation is focused on research organizations; most commercial biotech firms are absent. [best guess: <5% of commercial synthesis customers' employers are in ROR.]
- **Behavior of the check on this category:** no-signal (`ror_no_record`)
- **Reasoning:** ROR is a research-organization registry. It structurally does not cover the commercial segment. The check is simply irrelevant for ~46% of the customer base by revenue. This is not a flaw — the check is designed for academic affiliation verification — but it means ROR domain match is a partial-coverage tool that must be paired with commercial-entity verification ideas (GLEIF, corporate registries, etc.).

### Gap 4: Researchers using personal email (Gmail, Outlook.com) for synthesis orders
- **Category:** Legitimate researchers at ROR-listed institutions who submit orders using a personal email address rather than their institutional email.
- **Estimated size:** [unknown — searched for: "percentage of researchers using personal email for professional orders", "academic scientists gmail for lab purchases"]. [best guess: 5-15% of academic synthesis orders may use personal email, particularly from researchers in countries where institutional email systems are unreliable or where personal accounts are culturally preferred for procurement.]
- **Behavior of the check on this category:** false-positive (`ror_domain_mismatch`)
- **Reasoning:** The email apex (`gmail.com`) will not match any ROR record's domain. This is exactly the `free-mail-affiliation` attacker pattern — the check correctly flags it — but it also catches legitimate researchers. The SOP routes to manual review, not auto-deny, which is appropriate but generates queue volume.

### Gap 5: Multi-domain institutions (medical schools, affiliated hospitals, research parks)
- **Category:** Researchers at institutions that operate multiple email domains not all listed in ROR — e.g., Harvard (`harvard.edu`, `hms.harvard.edu`, `partners.org`, `bidmc.org`), or large university hospital systems where clinical and research email domains differ.
- **Estimated size:** [best guess: ~10-20% of R1-equivalent universities operate 3+ distinct email domains, and ROR's `domains[]` field (when populated) typically lists only 1-2. US alone has 187 R1 universities ([NSF NCSES: HERD rankings](https://ncsesdata.nsf.gov/profiles/site?method=rankingbysource&ds=herd)), many with affiliated hospital systems.]
- **Behavior of the check on this category:** false-positive (`ror_domain_mismatch`) or weak-signal
- **Reasoning:** A researcher at `partners.org` (Mass General Brigham) claiming affiliation with Harvard Medical School will get `ror_domain_mismatch` because `partners.org` is not in Harvard's ROR record. The 04-implementation's manual review handles this but it is a systematic source of false positives for the highest-volume academic customers.

## Refined false-positive qualitative

1. **Personal email researchers (Gap 4):** `ror_domain_mismatch` fires. Estimated 5-15% of academic orders. Intentionally flagged (overlaps with `free-mail-affiliation` attacker story) but creates FP volume.
2. **Multi-domain institutions (Gap 5):** `ror_domain_mismatch` fires. Systematic for large university-hospital systems. Could be partially mitigated by maintaining a local multi-domain mapping table, but this adds maintenance burden.
3. **Institutions in ROR with outdated website URL:** ROR records are community-curated; some have stale `links[type=website]` values. The apex comparison fails silently. [unknown — searched for: "ROR data quality stale URLs", "ROR record accuracy audit"]

## Notes for stage 7 synthesis

- ROR domain match is a strong **positive signal** (when it works, it is high-confidence) but has very narrow coverage: only ~54% of customers (academic segment) are even candidates, only ~70-80% of those are in ROR, and only ~2% have the `domains[]` field populated (rest fall back to website-apex comparison).
- The effective coverage for a clean automatic positive match is likely ~30-40% of academic customers, or ~15-20% of all synthesis customers. The remainder either get no signal or get flagged for manual review.
- Pair with m02-mx-tenant (covers commercial segment) and m02-rdap-age (covers domain freshness). ROR is not a standalone check — it is a high-confidence fast-pass for the subset it covers.
