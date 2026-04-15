# Stage 2 — Feasibility check — measure 08 institution-denied-parties — v1

## Relevance gate limitation (read first)

The mapping file `attackers/by-measure/measure-08-institution-denied-parties.md` contains **zero** relevant wg attacker stories. Per the run instructions for this measure, the relevance gate is interpreted as **"would plausibly catch a customer claiming affiliation with a listed institution"** (e.g., Entity-Listed Chinese university, OFAC-designated Russian state lab, UN-1718 DPRK institute, IRGC-affiliated Iranian university). This is a known limitation: no attacker-story-driven adversarial pressure is being applied to these ideas at stage 2. Stage 5 (bypass-aware hardening) will not have relevant material to work from either, and stage 8 should note that measure 08 ideas are being carried through the pipeline on the basis of a regulatory-compliance argument rather than a wg-attested bypass.

Given that limitation, I am applying the relevance gate **leniently** here: any idea whose data source genuinely lists institutions of the type measure 08 was written to catch passes the relevance gate.

## Per-idea verdicts

### 1. BIS Entity List screen — **PASS**
Concrete (named source: BIS Entity List, EAR Supplement No. 4 to Part 744). Relevant: list explicitly enumerates research / university entities of concern.

### 2. OFAC SDN + non-SDN consolidated screening — **PASS**
Concrete (OFAC SDN + SSI / FSE / NS-PLC, Treasury). Relevant.

### 3. Consolidated Screening List via trade.gov API — **PASS**
Concrete (trade.gov CSL API, named endpoint). Relevant. Note for stage 3: this idea overlaps heavily with #1 and #2 (CSL is a union of those lists). It is **not** a duplicate to drop here, because the access mechanism is materially different (single free API vs separate per-list pulls) and stage 3 / 4 should evaluate them comparatively. Keep both.

### 4. EU Consolidated Financial Sanctions List XML feed — **PASS**
Concrete (EU FSF feed). Relevant for any provider with EU exposure.

### 5. UN Security Council Consolidated Sanctions List — **PASS**
Concrete and explicitly named in the measure text ("national or UN").

### 6. UK OFSI Consolidated List — **PASS**
Concrete (OFSI consolidated list). Relevant for UK exposure.

### 7. Refinitiv (LSEG) World-Check One — **PASS**
Concrete (named vendor + product). Relevant (institutional sanctions coverage is a documented World-Check use case).

### 8. Dow Jones Risk & Compliance — **PASS**
Concrete (named vendor + product). Relevant.

### 9. LexisNexis Bridger Insight XG — **PASS**
Concrete (named vendor + product). Relevant.

### 10. Sayari Graph — **PASS**
Concrete (named vendor + product). Relevant, and uniquely addresses the parent / subsidiary evasion vector (OFAC 50% rule, BIS affiliate guidance) that none of the flat-list ideas address. Highest marginal value among the commercial ideas given the threat model.

### 11. SECO (Switzerland) sanctions list — **PASS**
Concrete. Marginal coverage relative to CSL + EU is questionable but the idea author already flagged that and stage 4 / 6 can quantify. Lean keep.

### 12. Internal denied-institution allow/deny list (SOP) — **PASS**
Concrete: names ASPI China Defence Universities Tracker and C4ADS as the seeded inputs and specifies an internal-list SOP. Relevant: ASPI tracker covers exactly the institutional class (PLA-linked Chinese universities) most likely to be a measure-08 evasion target via name variation.

## Gaps / classes not addressed by any current idea

Because the mapping file is empty, "gaps" are necessarily speculative. Two patterns the current 12 ideas collectively under-address, in case stage 1 wants to add ideas in a future iteration:

- **Non-Western national lists beyond EU / UK / Switzerland**: e.g., Japan METI End User List, Australia DFAT consolidated list, Canada OSFI consolidated list. A multi-jurisdictional provider may need these. None of the 12 ideas name them.
- **Academic-cooperation watchlists that are not formal sanctions lists** but flag concerning institutions: e.g., the ASPI tracker (now partially covered under #12), the Strider Technologies / Datenna research, the US DOJ China Initiative-era indictments database. These produce intelligence rather than legal denied-parties effect, and arguably belong under a different measure, but listing them here in case stage 1 wants a "soft denied parties" idea.

Neither gap is severe enough to require another iteration purely on its own; both are stage-3 / stage-1-iteration-2 candidates if iteration is happening anyway.

## Stop condition

All 12 ideas PASS. No REVISE, no DROP. The two gaps above are nice-to-have, not blocking, given the empty mapping file and the lenient relevance gate. Recommending stop.

**STOP: yes**
