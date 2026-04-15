# Measure 04 — shipping-residential

Screen shipping address for residential address. Flag triggers: address is residential.

---

## community-bio-lab-network

- **Branch slug:** community-bio-lab-network
- **Profile:** purpose-built-organization
- **Target description:** Attacker constructs a community-bio / DIY-bio entity (real LLC + community-lab framing) and orders synthesis as that "lab," exploiting the legitimate-customer category of garage and home-based community biology.
- **Bypass excerpts:**

  > **Bypass method — Real LLC + residential garage as stated lab address.** List the attacker's own residence as the lab address, framed as a "garage lab" — legitimate for community bio. **Cost: ~$50–$100 setup, no monthly address cost.** **Trace:** strongest of any variant — attacker's home address on file with the synthesis provider and named in state filings. **Key uncertainty:** depends on the provider having a customer-class-aware policy that tolerates residential addresses for community bio. Without that, address classification fails and this variant is unavailable.

- **Why relevant:** Nominates a residential address as the primary shipping address, framed as a garage lab; explicitly engages the residential-address gate.
- **Persistent supply chain?** N

---

## dormant-domain

- **Branch slug:** dormant-domain
- **Profile:** purpose-built-organization
- **Target description:** Attacker revives the domain and identity of a defunct small research lab and orders synthesis under it, sourcing a shipping address consistent with the revived lab's geographic identity.
- **Bypass excerpts:**

  > **Bypass B — Address sourcing (virtual office / residential / mail aggregator):**
  > - **What the attacker does:** Provides a shipping address consistent with the revived lab's geographic identity. Three options: residential (if the attacker lives in the target metro — $0 marginal), virtual office ($100–$500/mo; CMRA-flag risk per [Smarty docs](https://www.smarty.com/docs/cmra)), or biotech coworking ($500–$2,000/mo with its own KYB intake). Cheapest CMRA-flag-safe path is genuine local residency.
  > - **Expertise:** Novice (virtual office) to Practitioner (understanding which providers use CMRA-flag-aware validation from Smarty/Melissa/Google address products).
  > - **Cost:** $0 (residential) to $100–$500/mo (virtual office) to $500–$2,000/mo (biotech coworking). iPostal1 starts at $9.99/mo ([iPostal1](https://ipostal1.com/virtual-mailing-address-plans-pricing.php)); UPS Store mailboxes at $10–$60/mo ([MailboxAvenue](https://mailboxavenue.com/blogs/the-mailbox-blog/how-much-are-ups-mailboxes)).
  > - **Lead-up time:** 1–2 weeks (virtual office application, USPS Form 1583 notarization). Biotech coworking: 4–12 weeks.
  > - **Attacker trace:** Lease or aggregator account under attacker's real name with real payment. USPS Form 1583 on file at the CMRA. Physical delivery location known.

  > **Sub-config 1 — Residential-colocation lucky case, no accomplice, no seeding:** $600–$2,000. Domain $500 + hosting $100–$500 + $0 residential address + $0 personal card + $0 reflected legitimacy. Only available when the attacker genuinely lives in the original lab's metro area.

- **Why relevant:** Names residency as the cheapest CMRA-flag-safe shipping path and includes a "residential-colocation" sub-configuration in the cheapest-path enumeration.
- **Persistent supply chain?** N

---

## foreign-institution

- **Branch slug:** foreign-institution
- **Profile:** fake-affiliation
- **Target description:** Attacker claims affiliation with a foreign academic institution and ships synthesis to a foreign address, then re-exports or self-collects.
- **Bypass excerpts:**

  > **Method 4: Residential address framed as researcher's home office.**
  > - Expertise: Novice. Cost: $500-$2,000/month short-term rental if no in-country address; $0 if they do. Lead-up time: 1-4 weeks.
  > - Attacker trace: Booking platform records (Airbnb, etc.) link attacker to the residence during the shipment window.

- **Why relevant:** Lists residential address (short-term rental or owned home) as one of the enumerated shipping methods for the foreign-institution persona.
- **Persistent supply chain?** N

---

## cro-framing

- **Branch slug:** cro-framing
- **Profile:** purpose-built-organization
- **Target description:** Attacker stands up a real LLC framed as a small contract research organization and uses it to order synthesis, with the address forming the structural anchor of the branch.
- **Bypass excerpts:**

  > - **FNR:** ~15–30% of legitimate small-business / startup applicants may use addresses that fail strict CMRA-style classification (virtual offices, coworking, residential sole-proprietor addresses). Best guess from USPS CMRA prevalence and small-biotech operating norms.

- **Why relevant:** Branch explicitly notes residential sole-proprietor addresses as part of the FNR landscape its bypass methods rely on; while its primary methods are virtual office / coworking, the FNR framing assumes residential addresses are part of the legitimate-small-biz population the attacker hides among.
- **Persistent supply chain?** N

---

## gradual-legitimacy-accumulation

- **Branch slug:** gradual-legitimacy-accumulation
- **Profile:** purpose-built-organization
- **Target description:** Attacker stands up a real entity and accumulates legitimate-looking history over 12+ months before placing the target SOC order; the address must survive provider review during the accumulation window.
- **Bypass excerpts:**

  > **False-negative rate:** Moderate for small and new entities. The provider's address classifier may flag virtual offices, CMRA addresses, or residential addresses; manual review catches most but adds friction. [Estimated.]

- **Why relevant:** Branch explicitly counts on the residential-address category being part of the population that triggers manual-review escape hatches, even if its primary method is a virtual office.
- **Persistent supply chain?** N
