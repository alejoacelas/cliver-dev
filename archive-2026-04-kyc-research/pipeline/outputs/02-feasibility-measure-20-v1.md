# Stage 2 Feasibility — Measure 20 — v1

Reviewing `01-ideation-measure-20-v1.md` against concreteness + relevance gates.

## Per-idea verdicts

### 1. Jumio Identity Verification — PASS
Concrete: named vendor + product (Netverify) + specific capabilities (NFC eMRTD, liveness selfie). Relevant: directly addresses account-hijack, credential-compromise, it-persona-manufacturing — IDV at vouch time blocks anonymous voucher creation. STRONG-evidence requirement is the explicit measure text.

### 2. Onfido — PASS
Concrete (vendor + Studio workflow named). Relevant (same coverage as #1, alternate vendor justified by jurisdictional differences).

### 3. Persona Verifications — PASS
Concrete (vendor + Inquiry template named). Relevant. Three IDV vendors is justified for redundancy and jurisdictional coverage.

### 4. ORCID-bound voucher identity — PASS
Concrete (specific API: ORCID public + Member API, OAuth flow, employments block). Relevant: visiting-researcher, foreign-institution, it-persona-manufacturing all benefit from longitudinal scientific identity binding. Strong idea.

### 5. Institutional-email DKIM-verified reply — PASS
Concrete (named protocols: SMTP / DKIM / DMARC, ROR for domain list, DMARC validators). Relevant: forces fresh institutional-mailbox control at vouch time. Good against dormant-domain and visiting-researcher.

### 6. Live-video SOP — PASS
Concrete: SOP is fully specified (challenge code, ID hold, directory share, recording). The measure permits SOP-as-check; the playbook is complete enough for stage 4. Relevant: directly defeats rubber-stamping (lab-manager-voucher) and gig-platform recruited vouchers (shell-nonprofit).

### 7. GA4GH Passport / Visa — PASS
Concrete: names the standard, the specific Visa types (`ResearcherStatus`, `AffiliationAndRole`), and best-guess brokers (ELIXIR AAI, NIH RAS). Per gate-1 rules, plausible best guesses pass. Relevant: visiting-researcher, foreign-institution.

### 8. UK OfDIA / DIATF certified IDSP — PASS
Concrete: names the framework, the regulator, and best-guess providers (Yoti, OneID, Post Office EasyID). Relevant for UK voucher subset. Aligns with measures.md note about OfDIA voucher guidance.

### 9. OpenAlex seniority verification — PASS
Concrete: names OpenAlex authors API and specific fields (works count, h-index, last-author count). Relevant: directly enforces measure-20 field "referent may not be junior to customer." Catches lab-manager-voucher (manager often junior), unrelated-dept-student, it-persona-manufacturing.

### 10. Scopus Author + institution directory rank — PASS
Concrete: named API (Scopus Author Retrieval), named source (institution faculty directory). Relevant as backup where OpenAlex is thin. Title-lattice approach is implementable.

### 11. OpenAlex co-authorship history — PASS
Concrete (specific API + specific computation). Relevant: enforces the measure's ≥1-year relationship-length gate against multiple "freshly recruited voucher" attacker patterns.

### 12. NIH RePORTER shared grants — PASS
Concrete (named API + named fields). Relevant for US researchers; complements idea 11 for non-publishing relationships.

### 13. CORDIS / UKRI Gateway to Research — PASS
Concrete (named registries + APIs). Relevant for foreign-institution, visiting-researcher; covers EU/UK gap in idea 12.

### 14. Independence graph check — PASS
Concrete: names a specific data structure, specific cycle/clique rules, named storage (Neo4j or PG CTEs), specific signals (BIN, shipping, mailbox). Relevant: directly addresses self-vouching (lab-manager-voucher sub-variant a, shell-nonprofit accomplice, community-bio-lab mutual vouching). This is a high-value structural check.

### 15. ROR-domain disjointness (cross-org requirement) — PASS
Concrete (named registry, named rule). Relevant: forces shell-attackers to invest in second shell or external recruiter, raising cost per shell-company / shell-nonprofit stories.

### 16. Anti-rubber-stamp friction SOP — PASS
Concrete: each sub-mechanism (free-text fields, time-on-form telemetry, voucher-attestation-freshness rule, random-audit rate) is implementable and the playbook is specified. Pairs with measure-15 declaration for the similarity check. Relevant: directly addresses the "modal path" rubber-stamp bypass that the lab-manager-voucher story flags as primary, plus bulk-order-noise-cover. This is the only idea that engages the rubber-stamp failure mode head-on — critical to keep.

### 17. WebAuthn / FIDO2 voucher MFA — PASS
Concrete (named standard, named binding ceremony tied to idea 1–3). Relevant: defeats the AitM phishing path called out verbatim in shell-nonprofit ("Tycoon 2FA or EvilProxy"), plus account-hijack and credential-compromise.

### 18. SOC-scope alignment check — PASS
Concrete: structured scope object, semantic-similarity check against necessity assessment, fresh-voucher-required rule. Relevant: addresses lab-manager-voucher sub-variant (c) (clinical batch vouching), bulk-order-noise-cover, gradual-legitimacy-accumulation. Operationalizes measure-20 fields (iii) and (iv).

### 19. ROR + GLEIF + Companies House + Charity Commission — PASS
Concrete (each registry named with API). Relevant: confirms voucher institutional legitimacy per measure text. Good against shell-nonprofit, shell-company, dormant-domain.

### 20. eduGAIN / InCommon SAML — PASS
Concrete (named federations + specific attributes: `eduPersonAffiliation`, `schacHomeOrganization`). Relevant: visiting-researcher, foreign-institution. Correctly distinguished from IDV (authentication ≠ identity proofing).

### 21. Institutional HR letter SOP — PASS
Concrete: specific SOP (letterhead, DKIM-checked HR email, phone callback against directory). Relevant: covers lab-manager-voucher relationship-length corroboration and unrelated-dept-student inheritance.

### 22. Voucher trust-score model — PASS
Concrete: 0–10 integer, signal weights described, threshold tied to measure-20 explicit "level of trust below 6" trigger. Synthesis layer — operationalizes the measure's flag trigger directly. Relevant by construction.

## Gaps (uncovered attacker classes)

Reviewing the 19 attacker stories against the coverage map:

- **insider-recruitment (knowing co-conspirator):** Only ideas 9, 14, 16, 17 engage this. None of them actually defeats a knowingly-malicious senior scientist who has a real lab and a real publication record and is willing to live-video. The lab-manager-voucher sub-variant (d) "recruit PI/BSO as co-conspirator" has the same gap. This may be irreducible — once the voucher is genuinely a real, senior, willing co-conspirator, every check passes. Worth noting in stage 5 hardening but not necessarily a v2 ideation gap. **No new idea required.**
- **dormant-account-takeover:** Covered by IDV-on-rebind (1–3), live video (6), MFA (17). Adequate.
- **cro-framing / cro-identity-rotation:** Covered by ideas 11, 14, 15, 19. Adequate.
- **biotech-incubator-tenant:** Covered by 14, 15, 19. Borderline — incubator co-tenants are often legitimate cross-org per ROR (different companies in shared space) and may have real (though casual) relationships. Idea 11/12 may not corroborate because no co-pubs/grants. Still, 14 (graph) catches the clique pattern; 19 catches if the co-tenant entity is itself shell-thin. **Acceptable.**
- **community-bio-lab-network:** Covered by 9, 11, 14. The clique-detection in 14 is the main defense; relationship-length corroboration via OpenAlex (11) may often fail because community-lab work isn't published. No additional idea needed beyond the manual fallback (21).

No attacker class is wholly uncovered. The insider-recruitment and lab-manager-voucher (d) gaps are residual and structurally hard.

## Overall

All 22 ideas pass both gates. No revisions, no drops, no uncovered attacker classes that motivate new ideas.

**STOP: yes**
