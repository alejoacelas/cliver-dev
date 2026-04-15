# Stage 2 Feasibility — Measure 10 (payment-bin-giftcard) — v2

**Limitation:** Mapping file still has zero attacker stories. Relevance gate vacuously satisfied for ideas implementing the measure as written.

## Verdicts

- **Idea 1 — binlist.net:** PASS (unchanged from v1).
- **Idea 2 — BinDB:** PASS (unchanged).
- **Idea 3 — Neutrino API:** PASS (unchanged).
- **Idea 4 — IINAPI.com:** PASS (unchanged).
- **Idea 5 — Stripe `card.funding` + Radar:** PASS (unchanged).
- **Idea 6 — Adyen `fundingSource` + RevenueProtect:** PASS (unchanged).
- **Idea 7 — Visa ARDEF / Mastercard BIN Table:** PASS (unchanged).
- **Idea 8 — Curated prepaid-issuer blocklist:** PASS (unchanged).
- **Idea 9 — PSP hard-block on `funding=prepaid` for SOC SKUs:** PASS (unchanged).
- **Idea 10 (revised) — FinCEN MSB Registrant Search prepaid-access filter:** PASS. Now points to a specific public URL and a specific filter category. Stage 4 will confirm whether the activity-type filter is exposed in the search UI; if not, the idea degrades to "use FinCEN's published MSB list and filter offline," which is still concrete.
- **Idea 11 (new) — Virtual single-use card BIN detection:** PASS. Names specific issuers (Privacy.com / Patriot Bank / Sutton Bank, Lithic, Marqeta consumer programs) and a clear playbook distinct from the gift-card flow. Concreteness met. Addresses the obscured-identity intent of the measure that pure prepaid-flagging misses.

## Gaps

None remaining at the idea level. Mapping file is empty by construction; broader prepaid + virtual-card classes are now both covered. No further attacker classes to target.

## STOP

`STOP: yes` — zero REVISE/DROP verdicts; no uncovered attacker classes (mapping file empty; the two adjacent prepaid sub-options noted in the mapping file are covered by Ideas 1–9, and the virtual-card gap is covered by Idea 11).
