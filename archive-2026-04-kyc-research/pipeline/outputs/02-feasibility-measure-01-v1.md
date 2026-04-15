# Measure 01 — sanctions-name-screen — Feasibility v1

**Note on Gate 2 (relevance):** The measure's mapping file `attackers/by-measure/measure-01-sanctions-name-screen.md` records **zero** wg attacker stories. Per run instructions for this measure, Gate 2 cannot be evaluated against the wg story set; instead, relevance is interpreted as "would plausibly catch the kind of listed-person actor the measure targets." I apply that relaxed test below and flag this as a structural limitation that no ideation iteration can fix — it is a gap in the wg attacker corpus, not in the ideas.

---

## Idea 1 — OFAC SDN List direct ingestion

- **Concreteness:** PASS. Names a specific government-published feed (Treasury OFAC SDN.XML / Consolidated Sanctions List) with a specific URL fragment, specific normalization techniques (Jaro-Winkler, token-set ratio), and specific recordkeeping citation (31 CFR 501.601/603). Stage 4 has a clear target.
- **Relevance (relaxed):** PASS. Direct primary-source check on the canonical US sanctions list — the textbook implementation of this measure. Would catch any SDN-listed individual using their real name.
- **Verdict: PASS.**

## Idea 2 — UN Security Council Consolidated List

- **Concreteness:** PASS. Specific feed URL (`scsanctions.un.org/resources/xml/en/consolidated.xml`), specific list scope (1267/1989/2253, 1718, etc.).
- **Relevance (relaxed):** PASS. UN 1718 (DPRK) is the most directly relevant regime for a bio synthesis provider — covers WMD-procurement actors.
- **Verdict: PASS.**

## Idea 3 — EU Consolidated Financial Sanctions List (CFSP)

- **Concreteness:** PASS. Names FSF / `webgate.ec.europa.eu/fsd/fsf`, specific regulation cite (2018/1542 chemical-weapons regime).
- **Relevance (relaxed):** PASS. Required for EU-nexus providers; chemical-weapons regime is bio-adjacent.
- **Verdict: PASS.**

## Idea 4 — UK OFSI Consolidated List

- **Concreteness:** PASS. Names OFSI, specific gov.uk publication, specific statutory basis (SAMLA 2018).
- **Relevance (relaxed):** PASS. UK-only designations not on SDN/EU.
- **Verdict: PASS.**

## Idea 5 — Refinitiv World-Check One

- **Concreteness:** PASS. Names a specific commercial vendor and product (LSEG/Refinitiv World-Check One). Pricing left for stage 4 as appropriate.
- **Relevance (relaxed):** PASS. Industry-standard aggregator; stage 4 will surface coverage breadth vs. OFAC alone.
- **Verdict: PASS.**

## Idea 6 — Dow Jones Risk & Compliance

- **Concreteness:** PASS. Specific named vendor product.
- **Relevance (relaxed):** PASS. Functional alternative to Idea 5 with different list-coverage tradeoffs — worth keeping as a parallel candidate so stage 4 can compare both.
- **Verdict: PASS.** Not a duplicate of Idea 5: distinct vendor with distinct match-tuning and list coverage; stage 4 should research both and let stage 8 compare.

## Idea 7 — OpenSanctions.org

- **Concreteness:** PASS. Names OpenSanctions specifically, names the matching API endpoint and the FollowTheMoney schema and the underlying matching library (`nomenklatura`).
- **Relevance (relaxed):** PASS. Open-data alternative for cost-constrained providers.
- **Verdict: PASS.**

## Idea 8 — Descartes Visual Compliance

- **Concreteness:** PASS. Specific named vendor (with corporate-history note).
- **Relevance (relaxed):** PASS. Specifically referenced in wg's `foreign-institution`/`visiting-researcher` branches as the screening tool in actual use; among the most likely real-world implementation choices for synthesis providers.
- **Verdict: PASS.**

## Idea 9 — Secondary-identifier name-collision SOP

- **Concreteness:** PASS. Although it is an SOP rather than a data source, it specifies a concrete decision tree, the inputs the order form must collect, and the recordkeeping artifact. Per the stage 2 prompt, "Manual review of the order — FAIL unless paired with a specific signal that triggers it and a specific playbook" — this idea provides exactly that pairing (it is the playbook layer for the upstream list-match signals).
- **Relevance (relaxed):** PASS. Without this SOP the upstream ideas are operationally unworkable on common names; with it, they are.
- **Verdict: PASS.**

## Idea 10 — Daily delta re-screening of stored customers

- **Concreteness:** PASS. Specific operational pattern (delta diff against yesterday's snapshot of feeds named in Ideas 1–4), specific trigger (designation change), specific OFAC compliance posture cited.
- **Relevance (relaxed):** PASS. Closes the temporal gap that single-point-in-time onboarding screening leaves open. Stage 8 will likely treat this as a required complement to any of Ideas 1–8.
- **Verdict: PASS.**

---

## Gaps

- **Structural gap (not addressable by ideation):** The wg attacker story set contains zero attackers whose name is on a designated-persons list. No ideation iteration can produce ideas that "address attacker stories" for this measure, because there are no relevant stories. This should be recorded as a known limitation in the stage 8 per-measure synthesis and in the run summary, and possibly fed back as a request to the wg pipeline to add a sanctioned-individual attacker profile.
- **No within-set gaps:** within the relaxed-relevance frame, the 10 ideas span: 4 primary-source feeds (US/UN/EU/UK), 3 commercial aggregators (Refinitiv, Dow Jones, Descartes), 1 open-data aggregator (OpenSanctions), 1 review SOP, 1 continuous-monitoring pattern. No obvious additional class of check is missing for this measure. (Possible adjacent ideas — Australian DFAT, Japanese METI, Swiss SECO, Canadian OSFI standalone feeds — would add jurisdictional breadth but are functionally identical to Ideas 3/4 and would be absorbed by Idea 7's OpenSanctions aggregation; not worth proliferating.)

---

## Stop condition

Zero ideas got REVISE or DROP. The only outstanding "gap" is structural and not addressable by another ideation pass.

**STOP: yes**
