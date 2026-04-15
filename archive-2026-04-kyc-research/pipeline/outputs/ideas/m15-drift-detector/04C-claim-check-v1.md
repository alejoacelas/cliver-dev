# 4C claim check — m15-drift-detector v1

## Verified claims

- **River ADWIN module exists and is O(log n) streaming detector** — https://riverml.xyz/dev/api/drift/ADWIN/. Confirmed; River documents ADWIN as adaptive sliding window detector. **PASS.**
- **Page-Hinkley is a CUSUM-style detector** — https://riverml.xyz/dev/api/drift/PageHinkley/. Confirmed in River docs. **PASS.**
- **Cross-order pattern detection is a known biosecurity gap requiring shared data** — biosecurityhandbook.com substantively describes this as a known concern for split-order attackers. **PASS.**
- **Behavioral drift gradual-vs-abrupt framing** — identitymanagementinstitute.org page covers this. **PASS** but it's a general security blog, not a peer-reviewed source — adequate for the framing claim.

## Flags

- **UPGRADE-SUGGESTED:** "O(log n) per observation" for ADWIN — the doc says it uses an adaptive window with low overhead but does not explicitly state O(log n). Weaken to "low-overhead streaming update" or cite the original Bifet & Gavaldà 2007 paper.
- **MISSING-CITATION (minor):** "synthesis providers report under 1M/year/customer" — this is flagged as unknown in-doc, fine.

## Verdict

`PASS-minor` — REVISE to soften the O(log n) claim. Otherwise all cited claims hold.
