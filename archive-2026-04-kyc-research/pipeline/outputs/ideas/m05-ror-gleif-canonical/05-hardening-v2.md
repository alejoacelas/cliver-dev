# m05-ror-gleif-canonical — Bypass-aware hardening v2 (Critical-only re-check)

- **measure:** M05 — shipping-institution-association
- **idea:** ROR / GLEIF / Companies House canonical address cross-reference + OSM campus polygon augmentation
- **scope:** Re-evaluation of Critical Finding C1 from v1 only.

---

## C1 re-assessment: ROR v2's city-level-only location data makes the check ineffective against same-city bypass methods

**v1 finding:** ROR v2 provides city-level location only. Same-city bypass addresses (CMRAs, virtual offices, residential addresses in the institution's metro) pass a city-level check. This is the dominant attacker strategy across multiple stories.

**v2 fix:** Added a three-layer resolution cascade: (1) GLEIF street-level where available, (2) OSM campus polygon via Overpass API, (3) GeoNames campus-center point via ROR's geonames_id, (4) city-level fallback.

### Did the fix address C1?

**Partially — substantial improvement for OECD institutions, limited improvement elsewhere.**

**What improved:**
- For institutions with OSM campus polygons (~60-80% of OECD research institutions per the implementation's estimate), the check now operates at campus-boundary resolution rather than city-level. A CMRA, virtual office, or residential address in the same city but outside the campus polygon would now be caught. This directly addresses the dominant attacker strategy for the inbox-compromise, foreign-institution, visiting-researcher, dormant-domain, and account-hijack stories.
- The GeoNames point + radius provides an intermediate fallback (~500m) for institutions without OSM polygons, catching addresses clearly off-campus.
- The resolution cascade degrades gracefully: higher resolution when available, city-level when not, with the resolution level recorded in the audit log so reviewers know the strength of the evidence.

**What remains unclosed:**
1. **Non-OECD institutions with poor OSM coverage** still fall back to city-level or GeoNames point. Attacker stories targeting institutions in regions with low OSM mapping activity retain the city-level bypass. [best guess: ~20-50% of non-OECD institutions lack OSM polygons].
2. **Addresses at campus edge or in adjacent research parks** may fall just outside the OSM polygon, creating false positives. The implementation acknowledges this.
3. **Multi-campus institutions** — OSM may not capture all satellite campuses. An attacker shipping to a legitimate but unmapped satellite campus address gets a false mismatch; an attacker at an address near a mapped campus but not on it gets correctly caught. The asymmetry works in favor of security but creates reviewer workload.
4. **Inside-institution paths remain structurally unaffected** — an attacker operating from within the institution (it-persona-manufacturing, visiting-researcher host lab) passes the polygon check because their address IS on campus. This was expected; the polygon tightening does not help here.
5. **Entities without canonical records** remain unaffected — biotech-incubator-tenant, community-bio-lab-network, etc. still produce `institution_no_canonical_record`. The augmentation helps only when a ROR record exists.

### Story-level reassessment (C1-relevant stories only)

| Story | v1 classification | v2 classification | Change |
|---|---|---|---|
| inbox-compromise (same-city CMRA) | MISSED | CAUGHT (if OSM polygon) / MISSED (if no polygon) | Improved |
| foreign-institution (same-metro virtual office) | MISSED | CAUGHT (if OSM polygon) / MISSED (if no polygon) | Improved |
| foreign-institution (same-metro residential) | MISSED | CAUGHT (if OSM polygon) / AMBIGUOUS (GeoNames point) | Improved |
| visiting-researcher (same-metro virtual office) | MISSED | CAUGHT (if OSM polygon) | Improved |
| dormant-domain (same-metro colocation) | MISSED | CAUGHT (if OSM polygon, and address is off-campus) | Improved |
| account-hijack (same-city drop) | MISSED | CAUGHT (if OSM polygon) | Improved |

### Verdict on C1

**Downgraded from Critical to Moderate.** The OSM campus polygon augmentation converts the check from city-level to campus-level for the majority of OECD research institutions, directly addressing the dominant attacker strategy. The remaining gap (non-OECD institutions, missing OSM polygons) is a coverage limitation rather than a fundamental design flaw, and the implementation explicitly documents it with a fallback cascade and resolution-level logging. The residual gap is appropriate for the Moderate label: it reduces the check's effectiveness for a subset of the customer base but does not defeat the check's primary mechanism for the majority of cases.

---

## Other v1 findings (not re-assessed; carry forward)

- **Finding 2 (Moderate):** `institution_no_canonical_record` fires for most small entities — unchanged.
- **Finding 3 (Moderate):** Shell entities pass by construction — unchanged.
- **Finding 4 (Moderate):** Carrier-redirect bypasses are post-check — unchanged.

---

## Verdict: **PASS**

The single Critical finding (C1) has been addressed and downgraded to Moderate. Three Moderate findings carry forward unchanged. No remaining Critical findings. No further re-research loop required.
