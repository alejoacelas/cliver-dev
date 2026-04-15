# m15-structured-form — Implementation v1

- **measure:** M15 — soc-self-declaration
- **name:** Structured SOC declaration form
- **modes:** D
- **summary:** Replace the current free-text "intended use" field at order time with a structured form that uses controlled vocabularies for intended use, host organism (NCBI Taxonomy ID), target gene/protein, BSL containment level, and IBC approval status. Each field has machine-checkable values, and downstream cross-checks (m15-llm-extraction, m15-screening-reconciliation) operate over the structured fields rather than free text.

## external_dependencies

- Internal order intake portal (web form).
- [NCBI Taxonomy](https://www.ncbi.nlm.nih.gov/taxonomy) for host-organism dropdown / lookup (free, public).
- Controlled vocabularies for intended-use category and BSL — provider-curated, seeded from existing biosafety reference works (CDC BMBL 6th edition; Stanford EHS BSL classification).
- Validator service that ranks free-text overrides ("other / specify") for downstream LLM extraction.
- Reviewer queue.

## endpoint_details

- **Internal HTTPS form** rendered at order time, JSON-backed.
- **Auth:** customer's existing portal session.
- **NCBI Taxonomy:** lookup via [NCBI E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/) — free public API, ~3 req/sec without API key, 10 req/sec with key. Used to validate that the entered organism is a real taxon, and to attach the canonical taxon ID.
- **Pricing:** $0 vendor cost. Internal labor only.
- **ToS:** NCBI E-utilities permits programmatic use with the standard rate-limit etiquette and contact-email header.

## fields_returned

The submitted form is a structured object stored with the order:

- `intended_use_category` — enum: `vaccine-development`, `diagnostic-assay`, `protein-expression-purification`, `gene-editing-tool`, `pathway-engineering`, `synthetic-biology-parts`, `evolutionary-study`, `teaching-demonstration`, `other`.
- `host_organism_taxid` — NCBI Taxonomy ID, validated against the live taxonomy database.
- `host_organism_name` — auto-filled from taxid.
- `source_organism_taxid` (when the inserted sequence is from a different organism than the host).
- `target_gene_or_protein` — free text but indexed.
- `bsl_level_required` — enum: `BSL-1`, `BSL-2`, `BSL-2+`, `BSL-3`, `BSL-4`, `unknown`.
- `select_agent_or_toxin` — bool; if true, list which under HHS/USDA Select Agent regulations.
- `ibc_approval_status` — enum: `approved` (with protocol id), `pending`, `exempt-section-III-F`, `not-applicable`, `unknown`.
- `funder` — free text + grant id.
- `notes` — free text fallback (this is the field m15-llm-extraction operates on).
- `submitted_by` — account holder ID.
- `submitted_at` — timestamp.

## marginal_cost_per_check

- $0 marginal per order (form rendering + DB write).
- **setup_cost:** 3–6 engineer-weeks for the form, controlled-vocabulary curation, NCBI lookup integration, validation, and reviewer-queue UI. Plus ongoing curator effort to keep vocabularies current `[best guess]`.

## manual_review_handoff

1. Customer submits the structured form at checkout.
2. Validator runs:
   - All required fields populated.
   - `host_organism_taxid` resolves in NCBI.
   - `bsl_level_required` is consistent with the source organism's CDC BMBL classification (look up the source organism's risk group).
   - If `select_agent_or_toxin = true`, `ibc_approval_status` must be `approved` with a protocol id.
3. Failures route to `field_missing` or `field_unsupported_value` flags.
4. Reviewer reviews submissions where flags fired or where the customer used `other / unknown` heavily; can request a fully-typed resubmission.

## flags_thrown

- `field_missing` — required field empty.
- `field_unsupported_value` — submitted enum value not in the controlled vocabulary.
- `taxid_invalid` — NCBI lookup failed.
- `bsl_inconsistent` — declared BSL is below the source organism's known risk group.
- `select_agent_no_ibc` — `select_agent_or_toxin = true` and `ibc_approval_status != approved`.
- `excessive_other` — three or more controlled fields are filled `other / unknown` → reviewer queue (the form's value depends on customers actually using the controlled options).

## failure_modes_requiring_review

- Customer uses the `other / unknown` escape hatch for everything → form has no information advantage over free text. This is the structural risk and the reason m15-llm-extraction exists as a paired check.
- Novel organisms not yet in NCBI Taxonomy.
- Order spans multiple use categories — single-select form forces a coarse choice.
- Source-organism inference for synthetic sequences (e.g., codon-optimized constructs) is ambiguous.
- Vocabulary drift: as new use categories emerge, the form can't represent them until curators update.

## false_positive_qualitative

- Researchers doing genuinely novel work where no enum value fits — they pick `other` and trip the `excessive_other` heuristic.
- Diagnostic developers ordering primer/probe sets — `intended_use_category` is `diagnostic-assay` but the organism is a select agent and `bsl_inconsistent` may fire because primers don't actually require BSL-3 work.
- Educational orders for safe portions of regulated pathogens.
- Researchers in jurisdictions where IBC review is structured differently (UK Biological Agents Order, EU directives, etc.) who can't represent their oversight in NIH Section III-F vocabulary.

## record_left

- Submitted form JSON.
- NCBI lookup snapshot (taxid → canonical name at time of submission).
- Validator output.
- Reviewer disposition.

## Notes

- IGSC's Harmonized Screening Protocol v3.0 ([PDF](https://genesynthesisconsortium.org/wp-content/uploads/IGSC-Harmonized-Screening-Protocol-v3.0-1.pdf)) requires "a written description of the intended use of the synthetic product" but does NOT mandate a structured format; this idea operationalizes that requirement with controlled vocabularies.
- The form is a precondition for the higher-leverage M15 checks: m15-llm-extraction cross-checks free-text against the structured fields, m15-screening-reconciliation cross-checks vendor outputs against `host_organism_taxid` and `intended_use_category`, m15-drift-detector tracks per-customer feature trajectories over the structured fields. Without the form, those checks degrade.
