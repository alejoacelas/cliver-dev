# Cliver Dev

Research and development workspace for **Cliver** — a KYC verification showcase for DNA/nucleic acid synthesis order screening.

## Project context

Cliver aims to be a user-facing website demonstrating automated KYC verification tools for synthesis providers. The work here feeds into the design and implementation of those tools.

## Live directories

- **`data/`** — Datasets for tool evaluation.
  - `frontiers-profiles.csv` — 134 real life science researcher profiles from the Frontiers paper evaluation (`cliver/frontiers-evals`). Columns: `work_url`, `Type`, `Name`, `Institution`, `Email`, `Order`, `customer_info`. Multiline CSV (customer_info spans multiple lines). Four customer types: Controlled Agent Academia (56), General Life Science (29), Sanctioned Institution (25), Controlled Agent Industry (24). Covers 18+ countries. Non-anonymized — contains real names, emails, and institutions.
- **`tool-evaluation/`** — KYC tool evaluation pipeline. Empirical testing of API endpoints against adversarial cases for 5 priority KYC steps (M02, M03, M04, M05, M12 + adjacent M06, M07, M10).
  - `run.md` — Pipeline execution spec. 8 stages: credential check → relevance classification → adversarial test set → endpoint testing → field assessment → adversarial review → BOTEC cost synthesis → final synthesis.
  - `customers.csv` — 535 deanonymized researcher profiles (name, institution, email, order) for test case sourcing.
- **`notes/`** — Meeting notes, planning docs, and investigation summaries.
  - `2026-04-07-minimal-standard-meeting2-agenda.md` — CSSWG Meeting #2 agenda and discussion notes. Contains the draft minimal standard structure, stakeholder alignment criteria, discussion of attacker stories, and the full measure-by-measure table with screening processes, requirements, and open questions. Key reference for ongoing work.
  - `measure-A-deep-dive-planning.md` — Planning doc for the Measure A (address-to-institution) deep dive.
  - `reference-wg-and-phishing.md` — Pointers and excerpts from `cliver/wg` (bypass research, measures-in-practice, false-negative rates) and `tries/phishing` (provider email security, attack chain costs). Maps our 5 KYC steps to the wg measure numbers.
  - `tool-evaluation-plan.md` — Plan for the KYC tool evaluation pipeline. 8 stages (0–7): credential check, endpoint relevance classification, adversarial test set construction, endpoint testing, field-level assessment, adversarial review, BOTEC cost synthesis, and final synthesis. Covers 5 priority KYC steps across ~21 endpoints. Working plan — subject to refinement during execution.

## Archive

`archive-2026-04-kyc-research/` contains all prior research from early-to-mid April 2026:

- **`investigations/`** — API-level investigations for the address-to-institution screening measure (ROR, GLEIF, Companies House, OSM Overpass, GeoNames, BIN lookup, Smarty, Stripe AVS, Plaid Identity Match, and a resolution cascade synthesis).
- **`ASSESSMENT.md`** — Coverage and automation assessment of 16 CSSWG screening tools.
- **`DESIGN.md`** — Original Cliver website design doc (three-panel structure, Gemini Flash model, etc.).
- **`pipeline/`** — Multi-stage research pipeline on KYC bypass hardening. 10 numbered stages (00–10) from attacker mapping through global product spec, plus supporting material. Key contents:
  - `measures.md` — Master list of 20 screening measures with definitions and scope.
  - `run.md` — Pipeline execution log and configuration.
  - `attackers/` — Attacker persona profiles used as inputs to the pipeline.
  - `outputs/` — All pipeline stage outputs, organized by stage number and measure:
    - `00-attacker-mapping-summary.md` — Attacker landscape summary.
    - `01-ideation-measure-NN-vN.md` (29 files) — Bypass ideas per measure, sometimes multiple versions.
    - `02-feasibility-measure-NN-vN.md` (29 files) — Feasibility assessments of those ideas.
    - `03-ideas.md` — Consolidated idea list after feasibility filtering.
    - `ideas/mNN-<idea-name>/` (~100 subdirs) — Per-idea deep dives. Each contains a spec (`00-spec.md`), implementation research (`04-implementation-vN.md`), claim checks, form checks, hardening analysis, coverage research, and a final synthesis (`07-synthesis.md`).
    - `08-product-prioritization-measure-NN.md` (20 files) — Product prioritization per measure: which ideas/services to adopt, cost-benefit, and recommended bundles.
    - `09-measure-synthesis-NN.md` (20 files) — Per-measure synthesis rolling up all ideas into a single recommended stack per measure.
    - `archive/08-measure-NN-synthesis.md` (20 files) — Earlier version of per-measure synthesis (side-by-side comparison tables of all ideas within each measure).
    - `10-bundle-spec.md` — Global product spec assembling all 20 measures into a single screening product, organized by integration point (onboarding, per-order, periodic).
    - `measures-automation-overview-v3.md` — Summary table of all 20 measures with automation verdicts, service options with links, and access concerns.
    - `99-run-summary.md` — Pipeline run summary and statistics.
