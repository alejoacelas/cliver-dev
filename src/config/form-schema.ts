import type { FormSchema } from "@cliver/contracts";

export const SCREENING_FORM: FormSchema = {
  id: "screening-intake",
  version: "1.0.0",
  title: "Customer screening intake",
  fields: [
    {
      id: "name",
      label: "Full name",
      type: "text",
      placeholder: "e.g. Jane Smith",
      validationRules: [{ type: "required" }],
    },
    {
      id: "email",
      label: "Email address",
      type: "email",
      placeholder: "e.g. jane.smith@university.edu",
      validationRules: [{ type: "required" }],
    },
    {
      id: "institution",
      label: "Institution",
      type: "text",
      placeholder: "e.g. MIT",
      validationRules: [{ type: "required" }],
    },
    {
      id: "order_description",
      label: "Order description",
      type: "textarea",
      placeholder: "Describe the sequences being ordered and their intended use",
      validationRules: [{ type: "required" }],
    },
    {
      id: "notes",
      label: "Additional notes",
      type: "textarea",
      placeholder: "Any additional context",
    },
  ],
};
