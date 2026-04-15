# Stage 2 Feasibility Check — Measure 18 (institution-legitimacy-soc) — v2

Reviewing `01-ideation-measure-18-v2.md`. Ideas 1–24 and 26–35 are unchanged from v1 and were PASS in `02-feasibility-measure-18-v1.md`; their verdicts carry forward unchanged. Re-reviewing only revised idea 25 and new ideas 36, 37.

---

## 1–24, 26–35
Carry forward as PASS from v1.

## 25. Global BioLabs map + national high-containment registries (REVISED)
- **Concreteness:** PASS — names globalbiolabs.org dataset (a real King's College London / GMU project led by Filippa Lentzos), UK HSE published containment-level lists, Canada PHAC HPTA licence holder list. These are concrete enough for stage 4 to look up.
- **Relevance:** PASS — narrowly addresses the foreign-institution + community-bio-lab-network attacker classes when they claim BSL-3+ work. Acknowledges the structural gap that some legitimate high-containment labs are intentionally not public.
- **Verdict:** PASS

## 36. Cross-shell rotation detector (NEW)
- **Concreteness:** PASS — names specific data sources (Companies House officers endpoint, GLEIF Level 2, crt.sh, Censys, Shodan, ProPublica Nonprofit Explorer 990 boards) and a specific data structure (entity graph with named edge types and a ≥2-fingerprint threshold).
- **Relevance:** PASS — cro-identity-rotation is the gap stage 2 v1 explicitly flagged; this idea targets it directly and also strengthens shell-company / shell-nonprofit / cro-framing.
- **Verdict:** PASS

## 37. Lookalike / homoglyph domain detector (NEW)
- **Concreteness:** PASS — names UTS #39 confusables list, `dnstwist` (a real open-source tool), Levenshtein, ROR domain corpus, crt.sh. Stage 4 can look these up immediately.
- **Relevance:** PASS — inbox-compromise lookalike-domain variant was the second gap from v1; this targets it. Also engages shell-nonprofit's name-collision tactic when extended to domains and it-persona-manufacturing's `university-edu.org`-style fakes.
- **Verdict:** PASS

---

## Gaps

- **credential-compromise (full inside-real-institution compromise)** remains structurally outside M18's reach: once an attacker is on a live `@institution.edu` mailbox with valid IdP credentials, no institution-level legitimacy check can resolve the question — the institution *is* legitimate. Mitigations live in M14 (identity evidence) and M19 (individual legitimacy). Surfaced for stage 8 cross-measure synthesis; not an action item for stage 1.
- No other uncovered attacker classes. cro-identity-rotation and inbox-compromise lookalike-domain are now covered by ideas 36 and 37 respectively.

---

## Summary

37 ideas reviewed. All 37 PASS. Zero REVISE, zero DROP. The one structural gap (full credential-compromise inside a real institution) is outside M18's design scope and is noted for cross-measure synthesis.

STOP: yes
