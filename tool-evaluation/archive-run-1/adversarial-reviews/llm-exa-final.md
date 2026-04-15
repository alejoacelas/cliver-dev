# Adversarial review: llm-exa (FINAL)

**Iterations:** 1 (thorough initial testing -- no high-severity untested gaps requiring re-run)

## Resolved findings

- **Strong for address-to-institution (step a).** 13/16 pass. Excels at confirming well-known institutions (MIT, Oxford, Pfizer, BioNTech) and correctly identifying shared spaces (LabCentral, BioLabs, WeWork, JLABS) as incubators/coworking. Non-OECD institutions (Chulalongkorn, University of Lagos, Universiti Malaya, IIT Bombay) have strong English-language web presence. The hypothesis that non-English institutions would be underrepresented was not confirmed for major universities.
- **Strongest for email-domain verification (step c).** 10/12 pass. Correctly verifies institutional domains (.edu, .ac.uk, .ac.th, .de, .africa, .ac.ke) AND correctly rejects free email providers (163.com, qq.com, mail.ru, yandex.ru). Two distinct capabilities validated.
- **Critical hallucination risk identified and documented.** When queried about gmail.com affiliation with Harvard, Exa returned Harvard's "Gmail for Harvard" Google Workspace pages -- factually correct results that would lead the LLM to a wrong conclusion. The prompt must explicitly distinguish "institution uses Google Workspace internally" from "@gmail.com belongs to institution." This is the single highest-risk failure mode.
- **Weak for freight forwarder and CMRA detection (step e).** 4/8 pass. PO box detection is trivial (regex sufficient). Named coworking/forwarding services (WeWork, Shipito, MyUS) are findable when the name is included in the query. But unlabeled freight forwarder/CMRA addresses (UPS Store by street address, freight warehouses) return nothing useful. This step requires dedicated CMRA databases, not web search.
- **Moderate for residential vs. commercial (step d).** 4/6 pass. Commercial detection works via real estate listing sites (LoopNet, CommercialCafe). Residential detection is weaker -- Zillow/Redfin results are incomplete. Address classification APIs (Smarty) are more reliable for this.
- **Outdated addresses are correctly flagged as mismatches.** Genspace (moved from 150 Broadway to 132 32nd St Brooklyn), Mammoth Biosciences (moved from Letterman Drive to Brisbane). Exa returns the most recent information, which creates a valid KYC signal when it doesn't match the customer's address.
- **Mismatch signal is uniquely valuable.** Exa can find that an address belongs to a different entity than claimed (e.g., LabCentral, not the claimed startup). No structured API provides this cross-referencing capability.
- **Cost is viable.** $0.007/call, 5-10 calls per full verification, $0.035-0.070 per verification. At 1,000 orders/month: $35-70/month.

## Unresolved findings (forwarded to final synthesis)

- **LLM hallucination mitigation is architecturally critical but not system-tested.** The Harvard/Gmail hallucination risk is documented, and the mitigation (explicit prompt instruction) is designed, but the LLM prompt was not tested as a system against the full range of edge cases. The question "does the prompt reliably prevent hallucination on free-email + institutional queries?" requires a separate evaluation.

## Open medium/low findings (informational, not blocking)

- **MEDIUM: Fictional entity name collisions.** "Helix Therapeutics at LabCentral" correctly surfaced LabCentral but also found a real unrelated "Helix Therapeutics" company. When a customer's company name matches a real but different entity, Exa may provide false confirmation. The LLM must be instructed to check address consistency, not just name presence.
- **MEDIUM: Step (b) payment-to-institution has limited test coverage.** Only 3 cases tested. Pfizer and BioNTech confirmed through SEC/investor relations. Corporate registry APIs (SEC EDGAR, Companies House) are more reliable for this step. Exa is a fallback, not a primary tool.
- **MEDIUM: Index freshness unknown.** Exa returned current addresses for moved institutions, but the index freshness guarantee is unclear. For very recent moves or name changes, Exa may return stale data.
- **LOW: Community bio lab detection works but is niche.** Genspace and BioCurious are findable as real organizations -- a capability no structured API has. But the use case is narrow (confirming legitimacy of community labs that fail all other checks).
- **LOW: Cost estimate does not include LLM inference cost.** The $0.007/call is Exa only. If a language model is needed to interpret each result, the total cost per verification may be 5-10x higher depending on the model used.
