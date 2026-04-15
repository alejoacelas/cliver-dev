# Adversarial review: export-control (FINAL)

**Iterations:** 1 (thorough initial testing -- no high-severity untested gaps requiring re-run)

## Resolved findings

- **PO Box regex has excellent precision and recall within its scope.** 14 true positives, 11 true negatives, 0 false positives, 0 false negatives across labeled cases. Covers 7 language families (English, German, Spanish, French, Portuguese, Dutch, Italian) plus Australian, South African, and military variants (APO/FPO/PSC). 52 PO Box cases tested across 4 categories: should-match, false-positive bait, obfuscation attacks, and international variants.
- **PO Box false positive resistance is strong.** Zero false positives on 6 adversarial bait addresses containing "Box", "PO", "Post" substrings (Boxwood Lane, Polar Bear St, Apostle Drive, Pomelo Way, Box Elder Lane, Polish address). Word boundary anchors and PO-prefix requirement prevent false matches.
- **Fullwidth Unicode correctly caught via NFKC normalization.** Fullwidth "PO Box" detected after normalization to ASCII. This obfuscation vector is handled.
- **ISO normalization at 97.4% accuracy.** 76/78 correct across alpha-2 codes, alpha-3 codes, common abbreviations (USA, UK, UAE, PRC, DPRK), formal ISO names, non-English names (6 languages), dangerous ambiguities, old/historical names, territories, and misspellings. The custom alias table is essential -- without it, pycountry alone would fail on Rossiya, Zhongguo, Deutschland, PRC, UK, People's Republic of China, etc.
- **Ambiguous country names fail safely.** "Korea" and "Congo" correctly return null with ambiguity warnings instead of silently mapping to one country. This is critical safety behavior -- mapping "Korea" to KR (Group A) instead of KP (Group E) would be catastrophic.
- **BIS Country Group classification is 100% accurate on tested cases.** 17/17 correct dispositions: 5 auto_deny (3 Group E + 2 Part 746), 4 license_required (Group D), 6 pass (Group A/B), 2 edge cases. Russia/Belarus Part 746 de-facto embargo correctly captured. Hong Kong correctly distinguished from China.
- **Old country names resolve correctly for high-stakes cases.** Persia -> IR (Group E auto-deny), Burma -> MM, Formosa -> TW. These are critical because an unresolved old name for an embargoed country would let an order slip through.

## Unresolved findings (forwarded to final synthesis)

- **Consolidated Screening List API is BLOCKED (deprecated, returns 301).** This is the most significant gap in the entire export-control group. There is zero automated entity-level screening against OFAC SDN, BIS Entity List, BIS DPL, BIS UVL, or BIS MEU List. An order to a named denied party in a non-embargoed country (e.g., a BIS Entity List entity in China) would pass all three working endpoints. Mitigation options: vendor solution ($5K-50K/yr), manual CSV/XML download from trade.gov (free but loses real-time updates), or finding a replacement API. This is a CRITICAL gap that must be addressed before any production deployment.
- **CJK/Arabic/Russian PO Box equivalents not covered.** Chinese (信箱), Arabic (ص.ب), Russian (а/я), Turkish (P.K.) bypass the regex. Estimated impact: 20-40% of customers in non-covered-language countries, though most synthesis order forms use Latin script. Not triggered as a re-run because the fix is straightforward (extend the regex) and the deterrent value of the existing regex already exceeds its direct detection value -- per the m03 synthesis assessment.

## Open medium/low findings (informational, not blocking)

- **MEDIUM: Zero-for-O character substitution bypasses regex.** "P 0 Box" (digit zero) not detected. Fix: add [oO0] character class. Low engineering cost, deferred to implementation.
- **MEDIUM: "Post Office Lock Box" creative rewording bypasses regex.** Known gap from m03 synthesis, confirmed empirically. The "Lock" insertion breaks the pattern. Fix is more complex (would need to match "Post Office * Box" with wildcards, risking false positives).
- **MEDIUM: Kosovo ISO normalization bug.** "Kosovo" fuzzy-matched to Serbia (RS) instead of user-assigned XK. pycountry does not recognize Kosovo. Fix: add "KOSOVO": "XK" to custom alias table. Kosovo is not a major export-control concern, but incorrect normalization is a data integrity issue.
- **LOW: Misspelling tolerance is limited.** "Australa" (missing 'i') failed to resolve. pycountry's fuzzy search is too strict. Levenshtein-based matching would help but risks introducing false matches for short country names.
- **LOW: Sub-national sanctioned territories not tested.** Crimea addresses listed as "Russia" vs. "Ukraine" were not tested. Would require sub-national geocoding beyond country-level classification.
- **LOW: ECCN x Country Chart cross-reference not tested.** Depends on m06-hs-eccn-classification (out of scope for this group). Would refine the disposition beyond country-level.
