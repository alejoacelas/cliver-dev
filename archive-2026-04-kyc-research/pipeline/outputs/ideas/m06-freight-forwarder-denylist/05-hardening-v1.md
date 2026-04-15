# m06-freight-forwarder-denylist — bypass-aware hardening v1

**Idea under review:** `outputs/ideas/m06-freight-forwarder-denylist/04-implementation-v1.md`
**Measure:** M06 — shipping-export-country

---

## Attacker story walk

### foreign-institution

**Summary:** Attacker claims affiliation with a foreign academic institution and ships synthesis through an in-country freight forwarder or customs broker, then re-exports.

**Bypass methods relevant to M06 (freight forwarder denylist):**

1. **In-country freight forwarder + fabricated "satellite office" framing (Method 1).**
   - **AMBIGUOUS.** The denylist catches forwarders that are already identified (BIS Entity List, OFAC SDN, Trade Integrity Project, internal incidents). Whether the specific forwarder used by the attacker is on the list depends on whether the forwarder has a documented diversion history. The foreign-institution branch targets countries (Brazil, Japan, India, Indonesia, Vietnam) where most freight forwarders are NOT on diversion-risk lists — these are not the UAE/Turkey/Armenia/Georgia/Kazakhstan corridor that TIP and BIS enforcement focus on.
   - **Key gap:** The denylist is reactive — it catches known-bad forwarders, not novel ones. A first-time forwarder in Sao Paulo or Jakarta that has no prior enforcement history will not appear on the list.

2. **In-country customs broker (Method 6).**
   - **AMBIGUOUS (same analysis).** Customs brokers in Brazil, Japan, etc. are generally not on diversion-risk lists. The customs broker denylist catches the Russia/China/Iran transshipment corridor, not the "legitimate country, re-export as a separate step" pattern.

**Additional bypass analysis:**

3. **Forwarder name not on the order.**
   - **MISSED.** The implementation correctly identifies this as a failure mode: "Many orders ship to a forwarder address without naming the forwarder." If the attacker lists the customer name (the fake-affiliated researcher) as the consignee at the forwarder's commercial address, the denylist match on the forwarder name never fires. Only the address-based match (`freight_forwarder_address_match`) would catch this — and that requires the forwarder's specific address to be in the denylist, which it likely is not for forwarders in Brazil/Japan/India.

4. **Newly-formed shell forwarders.**
   - **MISSED.** The implementation correctly identifies this: "Newly-formed shell forwarders" are not on any list by definition. An attacker could use a newly-formed forwarding entity specifically created for the re-export, with no enforcement history.

**Net assessment:** The freight forwarder denylist has limited leverage against the foreign-institution branch because (a) the branch uses countries outside the primary diversion-risk corridors, (b) the specific forwarders used are unlikely to be listed, and (c) the attacker may not disclose the forwarder relationship. The denylist's value is primarily against the Russia/China/Iran transshipment pattern, not the "ship to a broadly legitimate country and re-export" pattern. The check is additive — it catches forwarders that happen to be listed — but is not a reliable gate against this branch.

---

## Findings

### Critical

None.

### Moderate

1. **Denylist coverage gap for non-diversion-corridor countries (foreign-institution Methods 1 and 6).**
   - Stories: foreign-institution Method 1 (freight forwarder in Brazil/Japan/India/Indonesia/Vietnam), Method 6 (customs broker in same countries).
   - Why missed: The denylist sources (BIS Entity List, OFAC SDN, TIP) are heavily concentrated on the Russia/China/Iran diversion corridor (UAE, Turkey, Armenia, Georgia, Kazakhstan, Kyrgyzstan, Hong Kong). Forwarders in Brazil, Japan, India, Indonesia, and Vietnam are underrepresented because those countries are not targets of comprehensive sanctions. The foreign-institution branch deliberately picks these countries.
   - Suggestion: Structural limitation of the reactive-denylist approach. Could be partially mitigated by adding a "flag any international shipment routed through a freight forwarder" rule — not a denylist hit, but an informational flag that triggers additional due diligence. Stage 4 could add a `freight_forwarder_international_routing` flag for any order where the shipping address resolves to a known freight-forwarding facility (using commercial-address-classification data) regardless of whether the forwarder is on the denylist.

2. **Forwarder name omission from order (documented failure mode).**
   - The implementation identifies this but does not specify a mitigation. If the customer ships to a forwarder's address under the customer's own name, the name-based denylist match fails. Only address-based matching catches this — and address coverage for non-corridor countries is thin.
   - Suggestion: Stage 4 could add an `intake_forwarder_unspecified` flag (already listed in flags_thrown) with a more aggressive follow-up rule: if the shipping address resolves to a known freight/logistics facility via commercial-address-classification, require the customer to disclose the forwarder relationship.

### Minor

3. **TIP web rate-limits and commercial scraping permission are unresolved.**
   - The implementation notes that TIP has no batch API and that "commercial scraping at scale would likely require permission." This affects the denylist's refresh completeness.
   - Suggestion: Stage 4 should note whether the provider intends to scrape TIP or use it as a manual-lookup supplement. If manual-only, acknowledge that coverage is limited to cases where a reviewer happens to check TIP.

---

## bypass_methods_known

| Bypass | Classification |
|---|---|
| foreign-institution Method 1 (freight forwarder in non-corridor country) | AMBIGUOUS (depends on whether forwarder is listed) |
| foreign-institution Method 6 (customs broker in non-corridor country) | AMBIGUOUS (same) |
| foreign-institution (forwarder name omitted from order) | MISSED |
| foreign-institution (newly-formed shell forwarder) | MISSED |

## bypass_methods_uncovered

- Freight forwarders in non-diversion-corridor countries (Brazil, Japan, India, Indonesia, Vietnam) are underrepresented on denylist sources
- Forwarder name omission from order defeats name-based matching
- Newly-formed shell forwarders have no enforcement history — invisible to reactive denylist

---

**Verdict: PASS**

No Critical findings. The denylist is correctly designed as a reactive catch for known-bad forwarders and is effective against the Russia/China/Iran diversion corridor. Its weak leverage against the foreign-institution branch is a structural limitation of the reactive approach, not a gap in the implementation. The Moderate findings suggest specification improvements (international-routing flag, forwarder-disclosure requirement) but do not require re-research.
