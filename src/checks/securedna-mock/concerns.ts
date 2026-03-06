export interface SecureDnaConcern {
  organism: string;
  riskLevel: "high" | "medium" | "low";
  description: string;
}

export const KNOWN_CONCERNS: SecureDnaConcern[] = [
  {
    organism: "Variola major",
    riskLevel: "high",
    description: "Causative agent of smallpox, classified as Category A bioterrorism agent",
  },
  {
    organism: "Bacillus anthracis",
    riskLevel: "high",
    description: "Causative agent of anthrax, classified as Category A bioterrorism agent",
  },
  {
    organism: "Yersinia pestis",
    riskLevel: "high",
    description: "Causative agent of plague, classified as Category A bioterrorism agent",
  },
  {
    organism: "Francisella tularensis",
    riskLevel: "medium",
    description: "Causative agent of tularemia, classified as Category A bioterrorism agent",
  },
  {
    organism: "Clostridium botulinum",
    riskLevel: "medium",
    description: "Produces botulinum toxin, classified as Category A bioterrorism agent",
  },
  {
    organism: "Ebola virus",
    riskLevel: "high",
    description: "Causative agent of Ebola hemorrhagic fever, BSL-4 pathogen",
  },
  {
    organism: "SARS-CoV-2 GoF",
    riskLevel: "medium",
    description: "Gain-of-function sequences related to SARS-CoV-2",
  },
];
