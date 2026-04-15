# Measure 06 — shipping-export-country

Screen shipping address for countries subject to broad (not just SOC) export restrictions. Flag triggers: shipping address in country subject to local comprehensive sanctions or export restrictions.

---

## foreign-institution

- **Branch slug:** foreign-institution
- **Profile:** fake-affiliation
- **Target description:** Attacker claims affiliation with a foreign academic institution and ships synthesis to that foreign country (the branch enumerates Brazil, Japan, India, Indonesia, Vietnam, and Russian-language CIS variants), then re-exports or self-collects.
- **Bypass excerpts:**

  > **Method 1: In-country freight forwarder + fabricated "satellite office" framing (variant 3a).** The attacker opens a forwarder account in the institution's country, ships to the forwarder's commercial address, and re-exports.
  > - Expertise: Practitioner — business-formation literacy in a foreign jurisdiction, local KYC workaround, customs navigation.
  > - Cost: $350-$1,500 setup (forwarder account $50-$200; local KYC workaround such as CPF/MyNumber/PAN $200-$1,000; fabricated local-language "research annex" letter $50-$200) plus $50-$300 per shipment handling. Shipment-loss risk from biological-materials refusal at intake or re-export adds probabilistic cost. Brazilian customs requires CPF/CNPJ ([PagBrasil](https://www.pagbrasil.com/blog/news/international-parcels-must-require-customers-cpf-number/)); ANVISA controls health-related products ([Trade.gov](https://www.trade.gov/country-commercial-guides/brazil-import-requirements-and-documentation)); re-exports of US-origin items may require BIS authorization.
  > - Attacker trace: Forwarder records attacker's real name, passport, and payment details under local KYC. Customs records in both the institution's country and re-export destination, keyed on HTS codes for biological/genetic materials flagged under Wassenaar regimes. Retention: 5+ years in most signatories. This is the highest-attribution Matrix A step.

  > **Method 6: In-country customs broker.**
  > - Expertise: Practitioner. Cost: $500-$3,000 per shipment (compresses re-export into one step). Lead-up time: weeks.

- **Why relevant:** This is the only branch that ships internationally as the primary path, and it explicitly engages export/customs regimes — even though the enumerated host countries (Brazil, Japan, India, Indonesia, Vietnam) are not themselves comprehensively sanctioned. The branch's re-export step is what could land in an export-restricted destination, so the export-country shipping screen is the relevant gate the attacker is structuring around.
- **Persistent supply chain?** N

---

## Notes

The export-country shipping screen is narrowly engaged across the branch set. Only foreign-institution ships to a foreign country as the primary path. None of the wg branches name a comprehensively-sanctioned destination (Iran, Syria, North Korea, Cuba, Crimea, Russia/Belarus under post-2022 EU/US controls) as the actual delivery address — the foreign-institution branch deliberately picks "broadly legitimate" foreign academic destinations (Brazil, Japan, India, Indonesia, Vietnam, CIS) precisely to avoid the export-country flag, with re-export as a separate step. No other branch (cro-framing's Estonian e-Residency variant, cro-identity-rotation's offshore mention, shell-nonprofit's foreign-formation sub-variant) actually ships to the foreign jurisdiction — those branches form foreign entities but ship to US addresses. Therefore measure 06 has only one weakly-engaging story (foreign-institution), included because its bypass methods structure around customs/export regimes even if the host countries are not on broad-sanctions lists.
