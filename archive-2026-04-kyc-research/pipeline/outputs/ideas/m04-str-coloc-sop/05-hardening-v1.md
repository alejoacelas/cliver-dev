# m04-str-coloc-sop — Bypass-aware hardening v1

- **measure:** M04 — shipping-residential
- **idea:** STR / Wayback co-location SOP

---

## Attacker story walk

### community-bio-lab-network

**Story summary:** Attacker constructs community-bio LLC(s) and ships from residential, maker space, coworking, or virtual office addresses.

**Bypass methods relevant to M04:**

1. **Residential garage lab (own home).**

   **MISSED.** The attacker's own home is not a short-term rental. Unless the attacker happens to list their home on Airbnb (extremely unlikely for an operational address), the STR search returns nothing. This SOP does not catch a genuine residential address that is not an STR.

2. **Maker space / coworking / virtual office.**

   **MISSED.** These are commercial addresses. The SOP is only triggered by upstream residential/ambiguous flags. Even if triggered, commercial addresses do not appear on STR platforms.

**Net assessment:** The STR SOP is irrelevant to this story. The attacker uses their own home (not an STR) or a commercial address.

---

### dormant-domain

**Story summary:** Attacker revives defunct lab, sources address (residential, virtual office, biotech coworking).

**Bypass methods relevant to M04:**

1. **Residential colocation ($0, attacker's own home).**

   **MISSED.** Same as above — own home is not an STR.

2. **Virtual office / biotech coworking.**

   **MISSED.** Commercial addresses, not STRs.

**Sub-configuration 1 note:** The cheapest-path "residential-colocation lucky case" uses the attacker's genuine residence, not a short-term rental. STR co-location does not apply.

**Net assessment:** The STR SOP does not engage any dormant-domain bypass method.

---

### foreign-institution

**Story summary:** Attacker claims foreign affiliation, ships to residential/virtual/forwarder address.

**Bypass methods relevant to M04:**

1. **Method 4: Residential address framed as researcher's home office — via short-term rental ($500–$2,000/mo).**

   **CAUGHT.** The attacker explicitly enumerates the Airbnb-type STR option. If the address is a current Airbnb listing, the manual search finds it. `address_is_str` fires.

   **AMBIGUOUS.** The attacker could also use a non-STR short-term rental (corporate housing, month-to-month lease) that does not appear on Airbnb/VRBO. The implementation acknowledges this: "an active drop site may have been delisted between the booking and the screening."

2. **Method 4: Residential address — attacker's own home ($0).**

   **MISSED.** Own home is not an STR.

3. **Methods 1, 5 (freight forwarder, virtual office).**

   **MISSED.** Commercial addresses, SOP not triggered.

**Net assessment:** Catches the specific case where the attacker uses an active Airbnb/VRBO listing. Misses corporate housing, delisted STRs, and the attacker's own residence. Narrow hit surface.

---

### cro-framing

**Story summary:** LLC framed as CRO, primary methods are virtual office/executive suite/coworking.

**Bypass methods relevant to M04:**

1. **All primary methods (virtual office, executive suite, coworking).**

   **MISSED.** Commercial addresses. SOP not triggered.

2. **FNR edge (residential sole-proprietor).**

   **MISSED unless the residential address happens to be an active STR listing.** An attacker using their own residence as a sole-proprietor address is not an STR. If this fires at all, it would be a coincidental catch.

**Net assessment:** The STR SOP is irrelevant to cro-framing.

---

### gradual-legitimacy-accumulation

**Story summary:** 12+ months of history at virtual office or incubator bench.

**Bypass methods relevant to M04:**

1. **Virtual office (baseline), incubator bench.**

   **MISSED.** Commercial addresses.

2. **FNR edge (residential).**

   **MISSED.** Same as cro-framing analysis.

**Net assessment:** Irrelevant to this story.

---

## Findings

### Finding 1 — Moderate: The SOP's effective hit surface is extremely narrow — only active STR listings used as drop addresses

- **Source:** All stories.
- **Why missed:** The SOP catches only the specific case where an attacker ships to an address that is simultaneously a live Airbnb or VRBO listing. This is a narrow intersection: the attacker must (a) use a residential address, (b) that address must be an active STR, and (c) the STR listing must be discoverable via manual search. Most residential bypass paths use the attacker's own home (not an STR) or a non-listed rental. Most attacker stories in the M04 mapping do not use STRs at all.
- **Severity: Moderate.** The SOP is correctly designed for what it does (detect STR drop addresses), and the foreign-institution Method 4 does explicitly enumerate the STR option. But the SOP's coverage across the mapped stories is minimal. It is a niche supplement, not a primary detection mechanism.
- **Suggestion:** No re-research needed. The SOP is correctly scoped as a manual escalation triggered by upstream flags, not a primary check. Stage 7 should note the narrow applicability.

### Finding 2 — Minor: Inside Airbnb lat/lng obfuscation (~150m) makes address-level matching unreliable

- **Source:** foreign-institution Method 4.
- **Why ambiguous:** Even when an STR exists at the address, Inside Airbnb's ~150m obfuscation means the manual search may not positively identify the exact address. The implementation documents this but does not specify how the reviewer resolves it (e.g., by counting listings within 150m and using room-type + review count to narrow).
- **Severity: Minor.** The reviewer's judgment is the fallback, and the implementation acknowledges the limitation.

### Finding 3 — Minor: Wayback CDX for address-by-URL is circular

- **Source:** Implementation § endpoint_details.
- **Why ambiguous:** The implementation notes "Wayback indexes by URL, not by physical address — to search by address, the SOP would query for known property listing URL patterns... This is not a clean lookup." The Wayback dimension of the SOP is effectively unimplementable for address-based searches. It is useful only if the reviewer already has a listing URL from the Airbnb search step.
- **Severity: Minor.** The Wayback component adds marginal value for historical-STR detection but is not the SOP's primary mechanism.

---

## bypass_methods_known

| Bypass method | Story | Classification |
|---|---|---|
| Residential garage (own home) | community-bio-lab-network | MISSED |
| Maker space / coworking / virtual office | community-bio-lab-network | MISSED |
| Residential colocation (own home) | dormant-domain | MISSED |
| Virtual office / biotech coworking | dormant-domain | MISSED |
| STR short-term rental (active listing) | foreign-institution | CAUGHT |
| Non-STR short-term rental | foreign-institution | MISSED |
| Residential (own home, foreign) | foreign-institution | MISSED |
| Freight forwarder | foreign-institution | MISSED |
| Virtual office (foreign metro) | foreign-institution | MISSED |
| Virtual office / exec suite / coworking | cro-framing | MISSED |
| Residential sole-proprietor | cro-framing | MISSED |
| Virtual office / incubator bench | gradual-legitimacy-accumulation | MISSED |

## bypass_methods_uncovered

- All residential-own-home paths (community-bio-lab-network, dormant-domain, foreign-institution, cro-framing)
- All commercial-address paths (all stories)
- Non-STR short-term rentals (foreign-institution)
- Delisted / historical STRs that are no longer active (foreign-institution)

---

## Verdict: **PASS**

No Critical findings. The SOP has a deliberately narrow scope (detect active STR listings at flagged addresses) and performs that function correctly for the one bypass method that explicitly uses STRs (foreign-institution Method 4). Its low coverage across the M04 story set is expected — it is an escalation SOP, not a primary detection check. Pipeline continues to stage 6.
