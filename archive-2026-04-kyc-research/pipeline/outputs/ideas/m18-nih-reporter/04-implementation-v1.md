# m18-nih-reporter — implementation v1

- **measure:** M18 — institution-legitimacy-soc
- **name:** NIH RePORTER funded-institution signal
- **modes:** A
- **summary:** Query NIH RePORTER's `projects/search` endpoint by `org_names` for the customer's claimed institution. Count active and recent (≤5y) awards. A non-zero, multi-year award history is strong positive evidence the institution is a real, NIH-recognized research entity. Zero awards is a soft negative — many legitimate (non-medical, foreign, industry) institutions have no NIH grants — so this combines with other M18 signals.

## external_dependencies

- **NIH RePORTER Project API v2** ([source](https://api.reporter.nih.gov/)). Operated by NIH Office of Extramural Research. Free, no auth.
- **NIH ExPORTER bulk files** ([source](https://reporter.nih.gov/exporter)) — annual CSV/XML dumps as a backstop / cache.
- **Internal name-normalization table** mapping common institutional aliases (e.g., "Harvard", "Harvard Medical School", "Harvard University") to canonical strings RePORTER recognizes. Custom build, can be seeded from ROR aliases.
- **Human reviewer** for ambiguous-name and zero-result adjudication.

## endpoint_details

- **URL:** `POST https://api.reporter.nih.gov/v2/projects/search` ([source](https://api.reporter.nih.gov/)).
- **Auth:** none. No registration required ([source](https://api.reporter.nih.gov/)).
- **Rate limit:** "no more than one URL request per second" and large jobs restricted to weekends or 9PM–5AM EST ([source](https://api.reporter.nih.gov/)). Excess traffic risks IP block.
- **Pricing:** free.
- **ToS:** governed by NIH RePORTER terms — non-commercial OK; service reserves right to terminate automated queries that affect performance ([source](https://api.reporter.nih.gov/)). [unknown — searched for: "NIH RePORTER API commercial use terms", "NIH RePORTER allowed use cases KYC"] — no explicit prohibition on commercial KYC use found; data is public-domain government data.
- **Request body**: JSON with `criteria` block (`org_names`, `pi_names`, `fiscal_years`, `agencies`, `activity_codes`, `advanced_text_search`), `offset`, `limit` (≤500), `sort_field`, `sort_order` ([source](https://api.reporter.nih.gov/documents/Data%20Elements%20for%20RePORTER%20Project%20API_V2.pdf)).

## fields_returned

Per-project fields (from the v2 Data Elements PDF, [source](https://api.reporter.nih.gov/documents/Data%20Elements%20for%20RePORTER%20Project%20API_V2.pdf)):

- `appl_id`, `project_num`, `project_serial_num`, `subproject_id`
- `fiscal_year`, `award_amount`, `direct_cost_amt`, `indirect_cost_amt`
- `project_start_date`, `project_end_date`, `award_notice_date`
- `agency_ic_admin` (admin IC), `agency_ic_fundings`, `is_active`
- `principal_investigators` (array of objects with `profile_id`, `first_name`, `middle_name`, `last_name`, `is_contact_pi`, `full_name`, `title`)
- `program_officers`
- `organization` object: `org_name`, `org_city`, `org_state`, `org_country`, `org_zipcode`, `org_duns`, `org_ueis`, `dept_type`, `org_fips`, `org_ipf_code`
- `project_title`, `abstract_text`, `phr_text` (public health relevance)
- `pref_terms`, `terms`, `spending_categories`
- `activity_code`, `study_section`, `award_type`
- `core_project_num`, `full_study_section`

## marginal_cost_per_check

- API call: $0 monetary; ~1–2s wall time per query [best guess: based on the 1 req/s guidance and typical JSON POST latency to a federal API].
- **Total marginal cost:** ~$0; the only "cost" is rate-limit budget.
- **setup_cost:** ~0.5 engineer-day for the API client + name-normalization table.

## manual_review_handoff

When `no_nih_funding_5yr` fires, the reviewer:

1. Confirm the name search wasn't defeated by formatting. Try aliases from the internal table and from ROR's `aliases` list. Also try `pi_names` if a customer name was provided.
2. Check whether the institution is the kind that *would* receive NIH funding: US-based, life-sciences, university or NIH-eligible nonprofit. If the institution is a foreign company, an industrial CRO, or a non-medical research org, document "negative result expected — not an NIH-eligible category" and rely on parallel signals (NSF, ERC, ROR, IRS 990).
3. If the institution *should* have NIH funding (US biomedical academic / nonprofit) and has none in 5 years, that's a substantive flag — escalate to M19 individual checks and the legitimacy review queue.
4. Record the dispositioning: search terms tried, alias list used, NIH-eligibility category, and final flag status.

## flags_thrown

- `no_nih_funding_5yr` — zero matches in past 5 fiscal years for the institution under any tried alias. Action: per the playbook above; soft flag for non-eligible categories, hard for biomedical academic.
- `nih_funding_active` — at least one active project; positive signal, no human action.
- `nih_funding_historical_only` — past projects but none active in past 2 years. Soft positive.
- `nih_pi_count_anomaly` — institution has only 1 PI ever, useful as a "tiny org" signal that combines with shell-org indicators.

## failure_modes_requiring_review

- API timeouts / 5xx (NIH off-hours or rate limit). Retry with backoff; mark `nih_unknown` if persistently failing.
- Name-normalization failures — institution exists in NIH database under a slightly different string. Mitigation: alias table + fuzzy fallback (Levenshtein over distinct `org_name` values from ExPORTER bulk dump).
- Foreign-affiliate handling — NIH funds some foreign collaborators; the org_name in the record may be the US prime, not the foreign sub. May produce false negatives for foreign customers.
- Subgrants and pass-throughs — the customer may benefit from an NIH grant via subaward but not appear as the prime org in RePORTER. RePORTER does include sub-projects but only spottily.

## false_positive_qualitative

The check is designed for *positive* evidence (presence of grants), so false positives in the "this is a real institution" sense are rare — gaming RePORTER would require literally getting an NIH grant. The relevant failure mode is **false negatives**:

- Brand-new legitimate biomedical labs (founded <5y ago) with applications pending but no awards yet.
- Foreign biomedical institutions (most of Europe, Asia).
- US biomedical institutions whose funding is private (HHMI, philanthropy) rather than NIH.
- Industrial / for-profit biotech without SBIR/STTR history.
- Research hospitals listed under a parent system name in NIH but a sub-name on the customer form.
- Departmental or institute-level subdivisions of large universities — RePORTER organizes by `org_name` at the prime-recipient level.

## record_left

A "RePORTER funding report" record per check, persisted in the case management system, containing:
- Input: institution name + alias list tried.
- Result counts: total projects in past 5y, active projects, distinct contact PIs, total dollars.
- Sample projects: 5 most recent project records (`project_num`, `project_title`, `fiscal_year`, contact PI name, award amount).
- Final flag set + reviewer disposition.
- API request payload + response timestamp (for audit reproducibility).
