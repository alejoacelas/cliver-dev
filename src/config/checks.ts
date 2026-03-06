import type { CheckDeclaration } from "@cliver/contracts";

export const MODEL = "google/gemini-3-flash-preview";

export const CHECK_DECLARATIONS: CheckDeclaration[] = [
  {
    id: "institution_check",
    name: "Institution verification",
    requiredFields: ["institution"],
    needsConsent: false,
    description: "Verify the institution is a legitimate biomedical research institution",
  },
  {
    id: "affiliation_check",
    name: "Affiliation verification",
    requiredFields: ["name", "institution"],
    needsConsent: false,
    description: "Verify the customer is affiliated with their claimed institution",
  },
  {
    id: "sanctions_check",
    name: "Sanctions screening",
    requiredFields: ["name", "institution"],
    needsConsent: false,
    description: "Screen against sanctions and export control lists",
  },
  {
    id: "publication_search",
    name: "Publication search",
    requiredFields: ["name"],
    needsConsent: false,
    description: "Find customer publications in scientific databases",
  },
  {
    id: "coauthor_finder",
    name: "Coauthor finder",
    requiredFields: ["name"],
    needsConsent: false,
    description: "Find coauthors and suggest verification emails",
  },
  {
    id: "email_domain_check",
    name: "Email domain verification",
    requiredFields: ["email", "institution"],
    needsConsent: false,
    description: "Verify the email domain matches the claimed institution",
  },
  {
    id: "background_work",
    name: "Background work search",
    requiredFields: ["name", "order_description"],
    needsConsent: false,
    description: "Find lab work related to the order",
  },
  {
    id: "securedna_mock",
    name: "SecureDNA screening",
    requiredFields: ["order_description"],
    needsConsent: false,
    description: "Screen order against SecureDNA database (mock)",
  },
];
