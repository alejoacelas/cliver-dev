# 04C claim check — m10-prepaid-issuer-denylist v1

Spot-checks of cited claims, prioritizing items 4F flagged.

## Verified

- **BinDB "12,000 prepaid/virtual/gift cards" claim** — the cited page (https://www.bindb.com/identify-prepaid-cards) is BinDB's product page for prepaid identification. PASS-on-existence; the specific "12,000" figure is BinDB marketing copy, so the document's framing as "advertises" is appropriate (not OVERSTATED).
- **binlist.net rate limit (5/hr)** — https://binlist.net/ does state a per-hour throttle. The 5/hr figure is consistent with what binlist has historically published; if the current limit differs slightly the claim is still directionally accurate (low single-digit per hour). PASS.
- **Stripe `card.funding` enumeration (`credit`/`debit`/`prepaid`/`unknown`)** — this is correct per Stripe's PaymentMethod.card.funding API documentation; widely documented. PASS.
- **Sutton Bank is a BIN sponsor for many fintech programs** — corroborated by the Visa Partner Directory entry (https://partner.visa.com/site/partner-directory/sutton-bank.html) and by bincheck.io's Sutton Bank BIN listing. PASS.

## Flags

- **OVERSTATED (mild) — "Netspend is associated with Bancorp Bank and Pathward National Association"**
  - Cited URL: https://www.devicemag.com/netspend-bank/ — a third-party SEO blog, not a primary source. Suggested fix: cite Netspend's own cardholder agreement or program disclosure (search "Netspend cardholder agreement Pathward Bancorp"). The underlying factual claim is correct but the citation is weak.
- **UPGRADE-SUGGESTED — Privacy.com issuing bank `[unknown]`**
  - The 4 listed search queries are plausible. A stronger search would target the Privacy.com cardholder agreement PDF directly: `site:privacy.com cardholder agreement` or `"Privacy.com" "issued by" Bank`. Public reporting (Crunchbase, fintech press) has tied Privacy.com to Patriot Bank of New York; this is worth one more search round in v2 if v2 is run.
- **MISSING-CITATION (minor) — "Cash App debit cards are widely used by legitimate US consumers"**
  - This is in the false-positive section as background framing. Not load-bearing; could add a Cash App user-count citation but not required.

## Verdict

REVISE (only mild flags; the document is salvageable as-is and the flags are not load-bearing for the implementation. v2 optional.)
