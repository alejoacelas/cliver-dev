# Coverage research: Institutional supplier-onboarding verification (PaymentWorks / Jaggaer / SAM.gov)

## Coverage gaps

### Gap 1: Non-US institutional customers
- **Category:** Academic researchers and institutional buyers at non-US universities and research institutes (EU, Asia-Pacific, rest of world) whose institutions do not use PaymentWorks, Jaggaer, or SAM.gov.
- **Estimated size:** North America accounts for ~39.5% of the gene synthesis market by revenue; the remaining ~60.5% is outside North America. [source](https://www.gminsights.com/industry-analysis/gene-synthesis-market) Europe holds ~27% and Asia-Pacific ~24%. [source](https://www.marketdataforecast.com/market-reports/gene-synthesis-market-report) Since PaymentWorks/Jaggaer are US-centric and SAM.gov is US-federal-only, the check produces **no signal** for roughly 60% of global synthesis customers by revenue and likely a higher share by order count (non-US orders are smaller on average). [best guess: 55–65% of all institutional orders come from outside the US, based on the ~60% non-North-American revenue share plus some Canadian orders also lacking coverage]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** PaymentWorks adoption is ~150+ US universities per its marketing page. Jaggaer claims 13M+ suppliers globally but its institutional-buyer deployment is concentrated in the US. SAM.gov is exclusively US federal. Non-US institutions have their own national procurement systems (e.g., UK's SciQuest/Unimarket, Australia's TenderSearch) that are not interoperable.

### Gap 2: US institutions not on PaymentWorks or Jaggaer
- **Category:** US academic institutions (smaller colleges, community colleges, teaching-focused universities, non-R1/R2 institutions) that use a different procurement platform (SAP Ariba, Coupa, Workday, or homegrown systems) and are not federally funded enough to require SAM.gov registration for their suppliers.
- **Estimated size:** There are 187 R1 and 140 R2 universities in the US (327 total) per the 2025 Carnegie Classification. [source](https://en.wikipedia.org/wiki/List_of_research_universities_in_the_United_States) PaymentWorks claims ~150+ university customers; Jaggaer has a comparable but partially overlapping set. [best guess: combined unique coverage is 200–300 of the ~327 R1/R2 universities, but there are ~4,000 degree-granting institutions in the US total. The ~3,700 non-R1/R2 institutions are mostly uncovered, though they are a small fraction of synthesis ordering volume.] Among R1/R2 institutions, perhaps 30–80 use platforms other than PaymentWorks/Jaggaer (Ariba, Coupa, etc.). [best guess: 10–25% of R1/R2 institutions use alternative platforms, based on the fact that PaymentWorks/Jaggaer together appear to cover the majority but not all of the top-tier research university market]
- **Behavior of the check on this category:** no-signal (for non-PaymentWorks/Jaggaer institutions) or weak-signal (SAM.gov confirms the institution exists as a federal entity, but does not confirm the specific order)
- **Reasoning:** The implementation itself notes this gap: "Institution uses a procurement system not in {PaymentWorks, JAGGAER, SAM.gov}." The fallback is the callback SOP, which is manual.

### Gap 3: Commercial / biotech customers (non-institutional)
- **Category:** Small-to-medium biotech companies, contract research organizations (CROs), diagnostics startups, and independent consultants who order gene synthesis but do not operate through a university procurement network.
- **Estimated size:** Biopharmaceutical and diagnostics companies hold ~42% of the DNA synthesis market by revenue globally and ~50% of US revenue. [source](https://www.grandviewresearch.com/industry-analysis/us-dna-synthesis-market-report) These customers pay by corporate card, wire transfer, or commercial invoice — not through university procurement networks. The check has zero coverage for this segment.
- **Behavior of the check on this category:** no-signal
- **Reasoning:** PaymentWorks/Jaggaer are university/government procurement systems. A biotech startup paying by corporate card or wire will never appear in these systems. The idea spec notes this: "Legitimate small/independent labs with no relationship to a major US university... will never appear in PaymentWorks/JAGGAER." The check is designed for institutional-affiliation verification and should not be applied to this category, but this means ~42–50% of customers by revenue are structurally outside its scope.

### Gap 4: Institutional customers paying personally (not through procurement)
- **Category:** Researchers at US institutions who pay with personal funds, startup grants administered outside the institution's procurement system, or personal credit cards — then expense later or do not expense at all.
- **Estimated size:** [unknown — searched for: "fraction of university researchers paying for lab supplies with personal funds", "academic researchers personal credit card lab purchases percentage"] No direct proxy found. [best guess: 5–15% of orders from academic-affiliated customers may be paid personally rather than through institutional procurement, based on anecdotal reports that early-career researchers and small-lab PIs sometimes use personal funds for small orders before grant funding is confirmed]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** The implementation notes this: "Legitimate university customers placing the order against a startup grant or personal funds... Procurement-system enrollment is irrelevant to this case." The check fires `procurement_no_supplier_registration` even though the customer is a legitimate institutional researcher.

### Gap 5: Government labs using non-SAM procurement paths
- **Category:** US government researchers (NIH intramural, DOE national labs, DOD labs) who order through their own agency procurement systems rather than through open-market PO channels that would surface in SAM.gov supplier registration.
- **Estimated size:** [best guess: ~20 major national labs and ~30 intramural NIH/CDC/FDA facilities. These are a small number of institutions but high-volume synthesis customers. SAM.gov confirms the institution's existence but the synthesis provider may not be registered as a supplier in the agency's specific procurement system (e.g., DOE's STRIPES, NIH's NBS).] 
- **Behavior of the check on this category:** weak-signal
- **Reasoning:** SAM.gov can confirm the institution is real and federally active, but the supplier-registration check (PaymentWorks/Jaggaer) does not apply. The provider may need separate supplier registration with each federal agency's procurement system.

### Gap 6: Newly onboarded institutional customers (registration lag)
- **Category:** Legitimate institutional customers whose institution recently adopted PaymentWorks/Jaggaer, or whose institution uses one of these platforms but the synthesis provider has not yet completed supplier registration with that institution.
- **Estimated size:** [best guess: At any given time, 5–10% of institutional orders may come from institutions where the provider's registration is in progress or recently expired, based on the implementation's note that "registration takes ~20 minutes per institution and the institution's approval can take days to weeks" and renewals are annual/biennial]
- **Behavior of the check on this category:** false-positive (false `procurement_no_supplier_registration` or `procurement_registration_expired`)
- **Reasoning:** The implementation acknowledges this: "Newly onboarded customer institution where the provider is mid-registration → false negative."

## Refined false-positive qualitative

The primary false-positive-generating categories are:
1. **Gap 4 (personal payment):** Fires `procurement_no_supplier_registration` on legitimate institutional researchers paying personally. Absorbed by routing to M12 BIN/AVS checks.
2. **Gap 6 (registration lag):** Fires `procurement_no_supplier_registration` or `procurement_registration_expired` on legitimate customers at institutions where the provider's registration is pending or recently lapsed.
3. **Gap 2 (alternative procurement platforms):** Fires `procurement_no_supplier_registration` for institutions using Ariba/Coupa/Workday. Absorbed by callback fallback, but adds friction.

The no-signal categories (Gaps 1, 3, 5) do not generate false positives because the check should not fire for them at all — it is scoped to institutional-affiliation + invoice/PO billing claims. If the check is incorrectly applied to customers outside this scope, it would generate massive false-positive volume.

## Notes for stage 7 synthesis

- This check has a structurally narrow scope: it applies only to US institutional customers using invoice/PO billing through PaymentWorks/Jaggaer-enrolled institutions. That is perhaps 15–25% of all synthesis customers by count (US academic, at enrolled institutions, using institutional billing). [best guess]
- The check is very strong within its scope (active supplier registration is hard to forge) but provides zero signal outside it.
- Complementary pairing with m12-psp-avs is essential: AVS covers card-paying customers that this check misses entirely.
- International coverage is nil. A provider serving a global customer base gets no benefit from this check for >55% of orders.
