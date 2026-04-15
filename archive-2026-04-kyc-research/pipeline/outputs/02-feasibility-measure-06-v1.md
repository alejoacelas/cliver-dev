# Stage 2 — Feasibility check: measure 06 — v1

Reviewing `01-ideation-measure-06-v1.md`. Only mapped attacker story is `foreign-institution`, whose bypass methods (in-country forwarder, in-country customs broker) deliberately route through *non*-embargoed host countries and re-export. So relevance bar: an idea is only useful if it (a) catches the literal embargo-country case as a baseline control, OR (b) catches the forwarder/broker/re-export structuring.

## Verdicts

1. **OFAC sanctions-program country list — PASS.** Concrete (Treasury sanctions program page + ISO normalizer). Relevance: this is the literal measure-as-written control. Mapped attacker explicitly avoids it, but it's still the canonical baseline and would catch the *theoretical* variant where attacker picks Iran/Cuba/etc. Keep as the floor.

2. **BIS Country Group E (EAR Part 740 Supp 1) — PASS.** Concrete (EAR Part 740 Supplement 1). Same baseline role. Slightly different bucket than OFAC; worth keeping distinct because BIS chart drives ECCN×destination cells.

3. **EU consolidated FSF — PASS.** Concrete (FISMA XML feed URL named). Relevance: required for any EU-domiciled provider; covers Russia/Belarus territorial scope which OFAC/BIS doesn't comprehensively embargo.

4. **UK OFSI consolidated list — PASS.** Concrete (gov.uk page + JSON/CSV). Relevance: UK regime; complementary jurisdiction.

5. **UN SC consolidated list — PASS.** Concrete (XML feed URL). Floor for multinational providers.

6. **Address-to-ISO normalization (libpostal + Google/Smarty) — PASS.** Concrete (named libraries + APIs). Relevance: enabling control for ideas 1–5 *and* catches subdivision-level Crimea/occupied-oblast cases that the country-list ideas miss without it. Strong keep.

7. **Loqate / Melissa freight-forwarder attribute — PASS.** Concrete (named vendors + named attribute fields, with `[best guess]` on local BR/IN equivalents which is acceptable). Relevance: directly addresses Method 1 of the foreign-institution branch — this is the only mapped attacker story and this idea is the most direct hit on its primary bypass. Highest-value idea in the file.

8. **Customs-broker registry scrape — PASS.** Concrete (names US CBP, Brazilian RFB, India CBIC registries; JP/VN marked best-guess). Relevance: addresses Method 6 of foreign-institution explicitly.

9. **HS / Schedule B + ECCN destination check — PASS.** Concrete (BIS Country Chart Part 738 Supp 1, EU Annex I Reg 2021/821, HS 2934.99, ECCN 1C353 named). Relevance: catches the re-export structuring against destinations that are license-controlled but not embargoed — exactly the gap the foreign-institution branch is built around. Strong keep.

10. **Re-export risk scoring (Kharon / Sayari / LSEG) — PASS.** Concrete (three named vendors + specific products: Kharon ClearView, Sayari Graph, LSEG World-Check One Trade Compliance). Relevance: Sayari's bills-of-lading shipment graph is the canonical tool for catching consignees with onward-shipment patterns to embargoed destinations — exactly Methods 1 and 6. Strong keep.

11. **BIS Entity / Unverified / MEU list via Trade.gov CSL API — PASS.** Concrete (named API endpoint URL, free, no auth). Relevance: catches the case where the consignee in an allowed country is a named restricted entity — non-trivial because foreign-institution Method 1 uses real local forwarders, some of which have appeared on Unverified List historically. Keep.

12. **OFAC SDN + SSI screen — PASS.** Concrete (XML URL named). Some overlap with idea 11 (CSL aggregates SDN) and idea 16 (OpenSanctions aggregates SDN). Not a duplicate per se because providers may want a direct OFAC source for legal-defensibility reasons rather than relying on an aggregator. Keep but flag overlap for stage 3 dedupe.

13. **ROR-based geofence "satellite office" check — PASS.** Concrete (ROR API URL + algorithm). Relevance: directly attacks the "fabricated satellite office framing" half of Method 1, which neither the forwarder-attribute nor the broker-registry catches if the forwarder slips both lists. Strong keep.

14. **Basel AML / FATF tier — PASS.** Concrete (FATF + Basel AML Index named). Relevance: the foreign-institution branch enumerates "Russian-language CIS variants" — several of which are FATF grey-listed. Catches the "host country not embargoed but elevated risk" tier the literal measure leaves uncovered. Keep.

15. **Wassenaar participating-states check — PASS.** Concrete (Wassenaar public list). Relevance: thinner — most of the enumerated host countries (BR, JP, IN, ID, VN) have mixed Wassenaar status (Japan yes, others no/varied), so this would actually flag the foreign-institution destinations and force EDD. Keep.

16. **OpenSanctions aggregator — PASS.** Concrete (Match API URL named). Overlaps ideas 1, 3, 4, 5, 11, 12 by aggregation. Stage 3 should decide whether to keep OpenSanctions plus one canonical source per jurisdiction, or OpenSanctions alone. Keep for now; flag dedupe.

## Gaps

The mapped attacker story is well covered:
- Method 1 (forwarder + satellite-office framing): ideas 7, 13 directly; ideas 9, 10, 11 indirectly.
- Method 6 (customs broker): ideas 8, 10 directly.
- The literal measure (country on broad-restriction list): ideas 1–5, 14, 16.
- Re-export onward path: ideas 9, 10.

No uncovered attacker classes from the mapping file. One latent gap worth surfacing: the mapping file's "Notes" call out that *no* wg branch ships to a comprehensively-sanctioned country directly. This means ideas 1–5 are largely defensive baselines rather than active catches. That's fine — the measure as written demands them — but stage 3 should not over-weight them when sampling for downstream research.

## Stop

All 16 ideas PASS. No REVISE, no DROP. No uncovered attacker classes.

`STOP: yes`
