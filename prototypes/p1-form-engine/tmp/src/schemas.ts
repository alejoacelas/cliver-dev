import type { FormSchema } from "@cliver/contracts";

/**
 * Schema 1: KYC screening form
 * Showcases: conditional fields (academic vs commercial paths),
 * select, email validation, required fields, description text
 */
export const kycSchema: FormSchema = {
  id: "kyc-screening",
  version: "1.0.0",
  title: "Customer screening intake",
  fields: [
    {
      id: "name",
      label: "Full name",
      type: "text",
      placeholder: "e.g. Jane Smith",
      validationRules: [
        { type: "required", message: "Full name is required" },
        { type: "minLength", value: 2, message: "Name must be at least 2 characters" },
      ],
    },
    {
      id: "email",
      label: "Email address",
      type: "email",
      placeholder: "jane@university.edu",
      description: "We'll use this to verify your institutional affiliation.",
      validationRules: [{ type: "required" }],
    },
    {
      id: "org_type",
      label: "Organization type",
      type: "select",
      options: ["academic", "commercial", "government", "nonprofit"],
      validationRules: [{ type: "required" }],
    },
    {
      id: "institution",
      label: "Institution name",
      type: "text",
      placeholder: "e.g. MIT, Stanford University",
      visibleWhen: [{ field: "org_type", operator: "equals", value: "academic" }],
      validationRules: [{ type: "required" }],
    },
    {
      id: "department",
      label: "Department",
      type: "text",
      placeholder: "e.g. Department of Molecular Biology",
      visibleWhen: [{ field: "org_type", operator: "equals", value: "academic" }],
    },
    {
      id: "pi_name",
      label: "Principal investigator",
      type: "text",
      placeholder: "Name of your lab PI",
      description: "We may contact your PI to verify your affiliation.",
      visibleWhen: [{ field: "org_type", operator: "equals", value: "academic" }],
    },
    {
      id: "company_name",
      label: "Company name",
      type: "text",
      visibleWhen: [{ field: "org_type", operator: "in", value: ["commercial", "nonprofit"] }],
      validationRules: [{ type: "required" }],
    },
    {
      id: "registration_number",
      label: "Company registration number",
      type: "text",
      placeholder: "e.g. 12345678",
      description: "Your official company registration or EIN.",
      visibleWhen: [{ field: "org_type", operator: "equals", value: "commercial" }],
      validationRules: [
        { type: "pattern", value: "^[A-Z0-9-]+$", message: "Only uppercase letters, digits, and dashes" },
      ],
    },
    {
      id: "gov_agency",
      label: "Government agency",
      type: "text",
      visibleWhen: [{ field: "org_type", operator: "equals", value: "government" }],
      validationRules: [{ type: "required" }],
    },
    {
      id: "order_details",
      label: "Order details",
      type: "textarea",
      placeholder: "Describe your sequence order...",
      validationRules: [
        { type: "required" },
        { type: "maxLength", value: 2000, message: "Maximum 2000 characters" },
      ],
    },
    {
      id: "notes",
      label: "Additional notes",
      type: "textarea",
      placeholder: "Any additional context for the screening team...",
    },
  ],
};

/**
 * Schema 2: All field types
 * Showcases: every supported field type, multiselect, checkbox,
 * file upload, number, date
 */
export const allTypesSchema: FormSchema = {
  id: "all-field-types",
  version: "1.0.0",
  title: "All field types",
  fields: [
    {
      id: "text_field",
      label: "Text input",
      type: "text",
      placeholder: "Plain text...",
      description: "A basic text input field.",
    },
    {
      id: "email_field",
      label: "Email input",
      type: "email",
      placeholder: "user@example.com",
      description: "Has built-in email format validation.",
    },
    {
      id: "number_field",
      label: "Number input",
      type: "number",
      placeholder: "42",
      description: "Renders a numeric input.",
    },
    {
      id: "date_field",
      label: "Date input",
      type: "date",
      description: "Renders a date picker.",
    },
    {
      id: "textarea_field",
      label: "Textarea",
      type: "textarea",
      placeholder: "Multi-line text...",
      description: "For longer text content.",
    },
    {
      id: "select_field",
      label: "Select dropdown",
      type: "select",
      options: ["Option A", "Option B", "Option C"],
      description: "Single selection from a list. Rejects values not in the list.",
    },
    {
      id: "multiselect_field",
      label: "Multi-select (checkboxes)",
      type: "multiselect",
      options: ["Biology", "Chemistry", "Physics", "Engineering"],
      description: "Multiple selections rendered as checkboxes.",
    },
    {
      id: "checkbox_field",
      label: "I agree to the terms",
      type: "checkbox",
      description: "A single boolean checkbox.",
    },
    {
      id: "file_field",
      label: "Upload a document",
      type: "file",
      description: "Captures filename only in this prototype.",
    },
  ],
};

/**
 * Schema 3: Chained visibility
 * Showcases: transitive dependencies (A -> B -> C), exists operator,
 * contains operator, AND conditions (multiple visibleWhen)
 */
export const chainedSchema: FormSchema = {
  id: "chained-visibility",
  version: "1.0.0",
  title: "Chained conditional visibility",
  fields: [
    {
      id: "has_sequences",
      label: "Are you ordering DNA sequences?",
      type: "select",
      options: ["yes", "no"],
      description: "Select 'yes' to reveal the sequence input chain.",
    },
    {
      id: "sequence_type",
      label: "Sequence type",
      type: "select",
      options: ["gene_synthesis", "oligo", "fragment"],
      visibleWhen: [{ field: "has_sequences", operator: "equals", value: "yes" }],
      description: "Only visible when sequences = yes. Selecting 'gene_synthesis' reveals more fields.",
    },
    {
      id: "sequence_data",
      label: "Paste your sequence (FASTA)",
      type: "textarea",
      placeholder: ">seq1\nATCGATCG...",
      visibleWhen: [{ field: "has_sequences", operator: "equals", value: "yes" }],
      validationRules: [
        { type: "required", message: "Sequence data is required when ordering sequences" },
      ],
    },
    {
      id: "organism",
      label: "Target organism",
      type: "text",
      placeholder: "e.g. E. coli, S. cerevisiae",
      visibleWhen: [
        { field: "sequence_type", operator: "equals", value: "gene_synthesis" },
      ],
      description: "Chain depth 2: only visible when sequence_type = gene_synthesis (which requires has_sequences = yes).",
    },
    {
      id: "biosafety_level",
      label: "Biosafety level",
      type: "select",
      options: ["BSL-1", "BSL-2", "BSL-3", "BSL-4"],
      visibleWhen: [
        { field: "organism", operator: "exists" },
      ],
      description: "Chain depth 3: only visible when organism has a value.",
    },
    {
      id: "bsl3_justification",
      label: "BSL-3/4 justification",
      type: "textarea",
      placeholder: "Explain why BSL-3 or BSL-4 work is needed...",
      visibleWhen: [
        { field: "biosafety_level", operator: "in", value: ["BSL-3", "BSL-4"] },
      ],
      description: "Chain depth 4: only visible for high biosafety levels.",
      validationRules: [
        { type: "required", message: "Justification is required for BSL-3/4" },
        { type: "minLength", value: 20, message: "Please provide at least 20 characters of justification" },
      ],
    },
    {
      id: "applications",
      label: "Intended applications",
      type: "multiselect",
      options: ["therapeutic", "diagnostic", "research", "agricultural", "industrial"],
      description: "Select all that apply. Selecting 'therapeutic' reveals an extra field.",
    },
    {
      id: "clinical_stage",
      label: "Clinical development stage",
      type: "select",
      options: ["preclinical", "phase_1", "phase_2", "phase_3", "approved"],
      visibleWhen: [
        { field: "applications", operator: "contains", value: "therapeutic" },
      ],
      description: "Visible only when 'therapeutic' is selected in the multiselect above.",
    },
    {
      id: "dual_condition",
      label: "Dual-condition field",
      type: "text",
      placeholder: "I only appear under two conditions...",
      visibleWhen: [
        { field: "has_sequences", operator: "equals", value: "yes" },
        { field: "applications", operator: "contains", value: "research" },
      ],
      description: "AND logic: requires BOTH has_sequences = yes AND applications contains 'research'.",
    },
  ],
};

/**
 * Schema 4: Validation showcase
 * Showcases: required, minLength, maxLength, pattern regex,
 * select option enforcement, custom error messages
 */
export const validationSchema: FormSchema = {
  id: "validation-showcase",
  version: "1.0.0",
  title: "Validation rules showcase",
  fields: [
    {
      id: "required_text",
      label: "Required field",
      type: "text",
      description: "Tab out of this field while empty to see the error.",
      validationRules: [{ type: "required", message: "This field cannot be left empty" }],
    },
    {
      id: "min_length",
      label: "Minimum 10 characters",
      type: "text",
      placeholder: "Type at least 10 chars...",
      validationRules: [
        { type: "minLength", value: 10, message: "Too short! Need at least 10 characters." },
      ],
    },
    {
      id: "max_length",
      label: "Maximum 5 characters",
      type: "text",
      placeholder: "No more than 5...",
      validationRules: [
        { type: "maxLength", value: 5, message: "Too long! Maximum 5 characters." },
      ],
    },
    {
      id: "pattern_field",
      label: "Code (format: ABC-1234)",
      type: "text",
      placeholder: "ABC-1234",
      description: "Must match the pattern ^[A-Z]{3}-\\d{4}$",
      validationRules: [
        { type: "required" },
        { type: "pattern", value: "^[A-Z]{3}-\\d{4}$", message: "Must be 3 uppercase letters, dash, 4 digits" },
      ],
    },
    {
      id: "email_builtin",
      label: "Email (built-in validation)",
      type: "email",
      description: "Email fields have automatic format validation beyond any explicit rules.",
      validationRules: [{ type: "required" }],
    },
    {
      id: "select_enforced",
      label: "Country (enforced options)",
      type: "select",
      options: ["US", "UK", "DE", "FR", "JP"],
      description: "Select fields reject values not in the options list.",
      validationRules: [{ type: "required" }],
    },
    {
      id: "multi_enforced",
      label: "Tags (enforced options)",
      type: "multiselect",
      options: ["alpha", "beta", "gamma", "delta"],
      description: "Multiselect validates each selected value against the options list.",
    },
    {
      id: "combined_rules",
      label: "Combined: required + minLength + pattern",
      type: "text",
      placeholder: "REF-xxxxx (at least 9 chars)",
      description: "Multiple rules on one field. All errors shown.",
      validationRules: [
        { type: "required", message: "Reference code is required" },
        { type: "minLength", value: 9, message: "Must be at least 9 characters" },
        { type: "pattern", value: "^REF-", message: "Must start with REF-" },
      ],
    },
  ],
};

export const allSchemas = [
  { label: "KYC screening", schema: kycSchema },
  { label: "All field types", schema: allTypesSchema },
  { label: "Chained visibility", schema: chainedSchema },
  { label: "Validation rules", schema: validationSchema },
] as const;
