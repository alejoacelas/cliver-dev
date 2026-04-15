# m19-clinicaltrials-investigator — Per-idea synthesis

## Section 1: Filled-in schema

### **name**

ClinicalTrials.gov + FDA BIMO investigator

### **measure**

M19 — individual-legitimacy-soc

### **attacker_stories_addressed**

visiting-researcher, unrelated-dept-student, lab-manager-voucher, it-persona-manufacturing, dormant-account-takeover, account-hijack, foreign-institution, dormant-domain, insider-recruitment, bulk-order-noise-cover

### **summary**

Cross-check the customer's name against (a) ClinicalTrials.gov as a study official / overall official / responsible party via the v2 API, and (b) the FDA Bioresearch Monitoring Information System (BMIS) clinical-investigator list for anyone who has served on an FDA-regulated trial since Oct 2008. A hit is strong positive evidence of a regulated-research role; an OAI inspection classification is a strong negative. The check is positive-evidence-shaped: it confirms clinical-trial roles for the minority who have them and is structurally silent on the majority of researchers.

### **external_dependencies**

ClinicalTrials.gov API v2 (free, no auth, 10 req/s); FDA BMIS bulk download (quarterly, free); FDA BIMO Clinical Investigator Inspection List (Excel per FY, free); internal name-normalization; human reviewer.

### **endpoint_details**

- **ClinicalTrials.gov v2:** base `https://clinicaltrials.gov/api/v2/studies`; field-targeted Essie queries (e.g., `AREA[OverallOfficialName]`); fields parameter for selective response; no auth; 10 req/s; free; JSON/CSV; US government public-domain
- **FDA BMIS:** downloadable file from FDA landing page; quarterly refresh; format [unknown — searched for: "BMIS download format CSV", "FDA BMIS download file type"] (likely `.xlsx`); covers Form 1572/1571 investigators since Oct 1, 2008; free
- **BIMO Inspection List:** Excel files per fiscal year from FDA BIMO inspection metrics page; inspection classifications NAI/VAI/OAI; free

### **fields_returned**

**ClinicalTrials.gov:** `nctId`, `briefTitle`, `officialTitle`, `overallStatus`, `startDateStruct`, `completionDateStruct`, `responsibleParty` (type, investigatorFullName, investigatorTitle, investigatorAffiliation), `leadSponsor`, `collaborators[]`, `overallOfficials[]` (name, affiliation, role: STUDY_DIRECTOR / PRINCIPAL_INVESTIGATOR / STUDY_CHAIR), per-site PI, facility, city, country, phases, studyType, conditions. **BMIS:** investigator name, address, IND number(s), sponsor, date listed. **BIMO Inspection List:** investigator name + address, inspection date, sponsor/IND, center (CDER/CBER/CDRH), final classification (NAI/VAI/OAI), subject area.

### **marginal_cost_per_check**

$0 monetary; ClinicalTrials.gov call ~200–500ms [best guess]; BMIS/inspection lookup in-memory from pre-loaded quarterly file. **Setup cost:** ~0.5 engineer-day for API client + quarterly BMIS ingest + name normalization.

### **manual_review_handoff**

**Null result:** try transliteration variants and name aliases; try institution-filtered search; recognize expected-negative populations (basic scientists, trainees, non-US researchers, non-clinical roles); if both null AND customer claims clinical/translational work AND no NIH funding history, escalate. **OAI inspection flag:** pull inspection record; note date, sponsor, classification, findings; forward to legitimacy-review queue with recommendation (not auto-deny).

### **flags_thrown**

- `no_ctgov_record` (name not found as study official/responsible party/site PI)
- `ctgov_role_match` (positive signal)
- `no_fda_bimo_record` (not in BMIS since 2008)
- `bimo_record_present` (positive signal)
- `bimo_oai_inspection` (OAI classification — review, not auto-deny)
- `bimo_vai_inspection` (VAI — note in case file)
- `ctgov_status_anomaly` (listed only as Study Director on single industry trial, no PI roles)

### **failure_modes_requiring_review**

- API timeouts/429s (backoff and retry)
- BMIS file format changes between quarterly releases (schema validation at ingest)
- common-name collisions (use middle initial + affiliation)
- name transliterations across alphabets
- researchers active before 2008 with no recent trials
- site investigators not in `overallOfficials` (need per-location traversal)

### **false_positive_qualitative**

- Overwhelmingly positive-evidence-shaped — dominant errors are false negatives: basic researchers (~70–85% of synthesis customers, never in clinical-trial DBs)
- non-US clinical researchers (~30–50% of international clinical researchers invisible)
- trainees (~30–50% of individual order-placers)
- industry R&D scientists (>90% of pharma staff invisible)
- veterinary/agricultural/environmental researchers (100% miss)
- pre-2008 investigators. Only true false-positive risk: common-name collision matching the wrong person

### **coverage_gaps**

1. Basic-science researchers — ~70–85% of synthesis-ordering researchers are non-clinical
2. Non-US researchers without US trial sites — ~30–50% of international clinical researchers not on ClinicalTrials.gov
3. Early-career researchers and trainees — ~30–50% of individual order-placers
4. Industry scientists at pharma/biotech sponsor companies — >90% not listed as site investigators
5. Veterinary/agricultural/environmental researchers — 100% miss
6. Pre-2008 investigators — small tail (~2–5% of senior researchers)

### **record_left**

"ClinicalTrials/BMIS lookup report": input (name + variants + claimed institution); ClinicalTrials.gov top 10 matched studies with NCT IDs, role, sponsor, status; BMIS matched entries (name, IND, address, date); BIMO inspection records with classification; BMIS file release date; final flag set + reviewer disposition.

### **bypass_methods_known**

- Manufactured persona with clinical role claim (it-persona-manufacturing) — CAUGHT weakly
- reflected legitimacy from defunct entity / name-collision variant (dormant-domain) — AMBIGUOUS.

### **bypass_methods_uncovered**

1. Institution piggyback (visiting-researcher) — absence expected for non-clinical
2. Grad-student footprint floor (unrelated-dept-student) — all grad students lack clinical records
3. Real lab-manager credentials (lab-manager-voucher) — lab staff lack records
4. Dormant account inheritance (dormant-account-takeover) — check validates registered name, not current operator
5. Active session hijack (account-hijack) — same
6. Foreign researcher (foreign-institution) — US-centric databases
7. Real insider (insider-recruitment) — insider is genuinely legitimate
8. Bulk-order noise cover (bulk-order-noise-cover) — researcher is genuinely legitimate

---

## Section 2: Narrative

### What this check is and how it works

This check queries ClinicalTrials.gov (the US government registry of clinical studies) and the FDA's Bioresearch Monitoring Information System (BMIS) to determine whether a customer has served as an investigator on an FDA-regulated clinical trial. At onboarding, the system sends the customer's name (with transliteration variants) to the ClinicalTrials.gov v2 API, searching the `overallOfficials`, `responsibleParty`, and per-site PI fields. In parallel, it queries an in-memory index of the quarterly BMIS bulk download, which lists every investigator who submitted Form FDA 1572 or 1571 to CDER since October 2008. If the customer also appears on the BIMO Clinical Investigator Inspection List with an OAI (Official Action Indicated) classification, that is a substantive integrity flag. All three data sources are free, public, and require no authentication. The API supports 10 requests per second; BMIS is a pre-loaded quarterly file.

### What it catches

The check provides strong positive evidence for the narrow population of customers who have served as principal investigators or study officials on FDA-regulated trials. A match in ClinicalTrials.gov or BMIS confirms a regulated-research role that is difficult to fabricate — the records are created by trial sponsors and validated through FDA submission processes. This is most useful against the IT-persona-manufacturing attacker story when the manufactured persona claims a clinical or translational research role: the absence of any clinical-trial record contradicts the claim. Against the dormant-domain story, a name search correctly returns no results for the attacker's real name. An OAI inspection flag provides an additional negative signal about investigator integrity.

### What it misses

The check is structurally null for the vast majority of M19 attacker stories. It validates institutions indirectly and individuals only when they have clinical-trial records. Basic-science researchers (estimated 70–85% of synthesis customers), trainees (30–50% of individual order-placers), industry scientists at pharma sponsors (>90%), and all non-human-health researchers produce expected negative results. Attacker branches involving real individuals — insider-recruitment, bulk-order-noise-cover, dormant-account-takeover, account-hijack — pass because the check validates the registered name, not the current operator. Foreign researchers without US trial involvement are invisible. The single moderate hardening finding confirms that the check provides zero marginal signal for most M19 stories because its databases cover only clinical/translational investigators, a small subset of the synthesis customer base.

### What it costs

Marginal cost per check is $0. The ClinicalTrials.gov API is free and public-domain; the BMIS and inspection-list files are free downloads. Latency is sub-second. Setup cost is approximately half an engineer-day for the API client, quarterly BMIS file ingest pipeline, and name normalization logic.

### Operational realism

When both `no_ctgov_record` and `no_fda_bimo_record` fire, the reviewer must first determine whether the customer's claimed role makes the absence informative. For a customer claiming to run clinical trials, a dual null is substantive — especially when combined with a null from m19-nih-nsf-pi. For a customer claiming basic-science work, the dual null is expected and the reviewer moves on. The playbook instructs trying transliteration variants, institution-filtered searches, and recognizing the specific populations where absence is normal. When an OAI inspection flag fires, the record goes to a legitimacy-review queue with a recommendation rather than an automatic denial. Every lookup produces an auditable report with the input name, variants tried, matched studies/BMIS entries, inspection records, BMIS file release date, and final disposition.

### Open questions

The 04C claim check flagged two minor issues:

1. the exact Essie query syntax for the v2 API (`AREA[OverallOfficialName]` vs `overallOfficialName`) should be verified against the current v2 documentation before implementation, and
2. the BMIS download file format was marked `[unknown]` and should be confirmed (likely `.xlsx`). The 06F form check noted that coverage gap size estimates for Gaps 3–6 (trainees, industry scientists, non-human-health researchers, pre-2008 investigators) rely on [best guess] reasoning with limited external citations. The broader design question is whether this check, given its narrow coverage, merits inclusion as a standalone component or should exist only as one signal within a multi-check fusion model — the stage 6 analysis strongly recommends the latter

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.**
- **Moderate finding M1 (structural null for most M19 stories):** The check is structurally uninformative for the majority of attacker stories and customer populations. This is not an implementation gap — it reflects the inherent narrowness of clinical-trial databases as an individual-legitimacy signal. The check should never be used as a standalone denial gate.
- **[unknown] BMIS download file format:** The FDA landing page references a downloadable file but the exact format was not confirmed. Likely `.xlsx`. (Stage 4C, UPGRADE-SUGGESTED.)
- **Essie query syntax for v2 API:** The exact field-name token (`OverallOfficialName` vs `overallOfficialName`) needs verification against current v2 documentation. (Stage 4C, MINOR.)
- **[best guess] coverage gap sizes for Gaps 3–6:** Trainee, industry scientist, non-human-health, and pre-2008 populations are estimated from reasoning without strong external citations. (Stage 6F, BORDERLINE.)
- **Design decision: standalone vs. fusion-only:** This check's value is concentrated in positive-evidence confirmation for the ~15–30% of customers with clinical-trial roles. Whether it merits its own implementation or should exist only within a signal-fusion pipeline is a policy/architecture question for stage 8.
