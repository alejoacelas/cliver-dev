# Coverage research: Mass-formation registered agent + virtual-office / CMRA denylist

## Coverage gaps

### Gap 1: Legitimate small biotechs that use mass-formation registered agents

- **Category:** Real biotech startups and small life-sciences companies that formed through mass-formation services (Northwest Registered Agent, ZenBusiness, LegalZoom, Bizee/Incfile) because they are cheap, convenient, and standard practice for small business formation.
- **Estimated size:** LegalZoom has served >4 million businesses; Northwest Registered Agent has served >2 million; ZenBusiness has served >850,000 ([source](https://www.zenbusiness.com/best-registered-agent-services/)). These services are mainstream, not niche. [best guess: 30–50% of newly formed US small businesses use a mass-formation service for incorporation and/or registered agent. Among biotech startups specifically, the rate may be similar or higher because founders prioritize speed over selecting a bespoke legal provider. This means the `registered_agent_mass_formation` flag would fire on a very large fraction of legitimate new biotech customers].
- **Behavior of the check on this category:** false-positive (`registered_agent_mass_formation` flag)
- **Reasoning:** The implementation itself notes that "mass agents legitimately serve thousands" of real businesses. The denylist conflates the mass-formation channel (which is the default for most small businesses) with shell-company formation. The signal-to-noise ratio is poor when used in isolation.

### Gap 2: Biotech incubator tenants at shared lab addresses

- **Category:** Early-stage biotech startups operating out of shared lab spaces (LabCentral, BioLabs, Genspace, JLABS, QB3 incubators) whose registered or physical address is the incubator's address — a "shared address" pattern that resembles virtual-office use but is in fact a legitimate wet-lab facility.
- **Estimated size:** LabCentral can support up to 125 startups ([source](https://www.labcentral.org/)). BioLabs has supported >500 companies across its international network ([source](https://www.biolabs.io/post/university-of-vermont-and-biolabs-to-launchstartup-incubator)). JLABS (Johnson & Johnson) operates 14 locations globally. QB3 (UCSF) has similar scale. [best guess: at any given time, 500–1,500 early-stage biotech companies operate out of shared incubator addresses in the US alone. These are exactly the companies most likely to order custom DNA synthesis, as they are conducting active wet-lab research].
- **Behavior of the check on this category:** false-positive (address triggers `address_high_density_registrations` or `address_virtual_office` depending on whether the incubator's address is flagged as CMRA)
- **Reasoning:** Incubator addresses show high registration density (100+ companies at the same address), which the implementation flags. But these are real labs, not virtual offices. The implementation acknowledges this gap ("coworking biotech labs") but does not include a mitigation in the denylist design.

### Gap 3: Pass-through state LLCs where registered agent is legally required

- **Category:** Companies incorporated in Delaware, Wyoming, or New Mexico that are required by state law to have a registered agent in-state, and therefore always use a registered-agent service regardless of legitimacy.
- **Estimated size:** Delaware has >1.9 million active business entities as of 2024 ([best guess: derived from Delaware Division of Corporations annual report figures]). [best guess: nearly 100% of out-of-state-managed Delaware/Wyoming LLCs use a registered-agent service because it's a legal requirement, not a choice. Among biotech companies, Delaware incorporation is extremely common — an estimated 60–70% of venture-backed biotechs are Delaware C-corps or LLCs].
- **Behavior of the check on this category:** false-positive (`registered_agent_mass_formation` flag fires on the standard incorporation structure for most venture-backed biotechs)
- **Reasoning:** The denylist cannot distinguish between "used a registered agent because Delaware requires it" and "used a registered agent to obscure identity." For the DE/WY/NM incorporation pattern, the flag is structurally uninformative.

### Gap 4: Non-US customers (denylist is US-centric)

- **Category:** International customers whose institutions are not incorporated in the US and whose registered agents / office addresses are not in the CMRA or virtual-office denylist.
- **Estimated size:** [best guess: 30–50% of synthesis customers are non-US based, given the global nature of the market. The implementation's denylist is constructed from US registered-agent services, US CMRA data (USPS), and US-headquartered virtual-office chains. International equivalents (UK company formation agents, offshore incorporators) are not covered].
- **Behavior of the check on this category:** no-signal (the denylist does not contain non-US entries; the Smarty CMRA flag is US-only)
- **Reasoning:** The Smarty address-validation service is US-only. CMRA detection does not exist for international addresses. International virtual-office chains (Regus/IWG operates globally but the denylist's address-level entries would need to include international locations). The check is blind to the international customer base.

### Gap 5: Sole-PI consulting LLCs run by real scientists

- **Category:** Single-investigator LLCs, consulting firms, or advisory entities formed by established scientists for grant management, consulting, or small-scale research — often using a registered-agent address for the formation and a home address for operations.
- **Estimated size:** [unknown — searched for: "scientist consulting LLC registered agent", "PI consulting firm biotech sole proprietor LLC"]. [best guess: a small but non-trivial fraction of synthesis customers — perhaps 3–5% — are sole-PI entities that use registered agents as a matter of convenience and privacy].
- **Behavior of the check on this category:** false-positive (`registered_agent_mass_formation` + possibly `address_virtual_office`)
- **Reasoning:** A real professor running a consulting LLC through Northwest Registered Agent trips both the agent denylist and potentially the address flags. Their institutional affiliation (verifiable via PubMed, ROR, etc.) is what makes them legitimate, not their LLC structure.

## Refined false-positive qualitative

1. **Mass-formation agent false positives** (Gaps 1, 3, 5) — The `registered_agent_mass_formation` flag has an extremely high false-positive rate because mass-formation services are the default channel for most small US businesses. The flag is useful only as a clustering signal (mass-agent + recent incorporation + no PubMed + fresh domain = shell pattern), never as a standalone indicator.
2. **Biotech incubator addresses** (Gap 2) — The check should maintain a **whitelist** of known biotech incubator addresses (LabCentral, BioLabs, JLABS, QB3, etc.) to suppress false positives. This is a concrete implementation gap in the current design.
3. **Pass-through state mandatory agents** (Gap 3) — DE/WY/NM incorporated entities should have their registered-agent flag down-weighted or suppressed entirely, since the use of a registered agent is legally required.
4. **International blindness** (Gap 4) — The denylist provides zero signal for non-US customers, which is a substantial share of the market.

## Notes for stage 7 synthesis

- This check has the **highest false-positive rate** of any M09 idea because mass-formation registered agents are the mainstream incorporation channel, not a red flag. The implementation's own false_positive_qualitative section acknowledges this.
- The check is only useful in **combination with other shell-pattern signals** (corp-registry-stack, domain-auth, PubMed). As a standalone signal, `registered_agent_mass_formation` has near-zero discriminative power.
- **Concrete improvement:** add a biotech-incubator whitelist to the implementation. LabCentral, BioLabs, JLABS, QB3, Genspace, and similar facilities should be exempted from the `address_high_density_registrations` flag.
- The denylist requires ongoing curation labor (~2–4 hours/quarter per the implementation) but the value proposition is marginal given the high FP rate. Stage 7 should weigh whether this idea carries its weight in the M09 suite or is dominated by the corp-registry-stack + PubMed combination.
