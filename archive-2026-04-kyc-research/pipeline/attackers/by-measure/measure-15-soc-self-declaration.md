# Measure 15 — SOC self-declaration

Measure: The customer is asked whether the order contains a Sequence of Concern (SOC) and what the intended use is. The declaration is cross-checked against sequence-screening output; misalignment triggers review.

Engagement here is via cover stories and end-use framing: branches whose attackers write a benign / vague / exemption-claiming declaration that reads as plausible against the screening hit, or that pre-empt cross-checks by aligning the cover story with the order content.

---

## 1. lab-manager-voucher — exploit-affiliation, Branch C

- **Profile:** exploit-affiliation
- **Target:** Real lab manager with real institutional email orders SOC sequences using vague end-use language.
- **Bypass excerpts (verbatim):**
  - M9 "Vague end-use self-declaration": "the attacker writes a free-text declaration broad enough that nearly any sequence aligns ('molecular biology research,' 'positive control for assay development'). Reviewed for obvious red flags but not independently cross-checked."
- **Why relevant:** This is the canonical M15 evasion: declaration crafted to *make* any screening hit look intended-and-benign. Direct hit on the cross-check logic.
- **Persistent supply chain:** Yes — the lab manager's standing affiliation supports repeated declarations.

## 2. unrelated-dept-student — exploit-affiliation, Branch A

- **Profile:** exploit-affiliation
- **Target:** Student in an unrelated department orders SOC under a generic research framing.
- **Bypass excerpts (verbatim):**
  - M4 Bypass E "Vague research self-declaration": "Submits a generic end-use description like 'research purposes.' Providers have reported... that such descriptions are difficult to interpret."
- **Why relevant:** Same vague-declaration vector as lab-manager-voucher, with explicit acknowledgment by providers that the descriptions are uninterpretable. Direct M15 hit.
- **Persistent supply chain:** No (student tenure-bounded).

## 3. cro-framing — purpose-built, Branch A

- **Profile:** purpose-built-organization
- **Target:** Real LLC styled as a small CRO with a services page that legitimizes any SOC scope it claims.
- **Bypass excerpts (verbatim):**
  - M9 Method 1: "Self-authored biosafety plan referencing standard frameworks ... 6–12 hours of writing for a tailored 5–15 page plan ... the plan's research scope must match Measure 4 publication seeding (if used) and order categories."
  - M4 Method 7 (predatory journal): "the paper's stated research area locks in Measure 9 biosafety scope and order categories."
- **Why relevant:** The branch *engineers* alignment between cover story and SOC declaration — the screening hit, the declared use, the biosafety plan, and the publication trail are all forced consistent up front. M15's cross-check finds no misalignment because the attacker has manufactured the alignment.
- **Persistent supply chain:** Yes — the CRO persists.

## 4. cro-identity-rotation — purpose-built, Branch B

- **Profile:** purpose-built-organization
- **Target:** Rotating CRO personas, each with its own claimed research scope.
- **Bypass excerpts (verbatim):**
  - Each persona's stated CRO service area is tuned to match the SOC orders that persona will place.
- **Why relevant:** Same alignment-by-construction as cro-framing, multiplied across personas.
- **Persistent supply chain:** Yes.

## 5. gradual-legitimacy-accumulation — purpose-built, Branch E

- **Profile:** purpose-built-organization
- **Target:** Build a real-looking legitimate research history over time and place SOC orders late in the lifecycle.
- **Bypass excerpts (verbatim):**
  - Cover-story legitimacy is built through real publications, real grants, real conference presence in a research area that retroactively justifies the SOC declaration.
- **Why relevant:** The declaration matches the screening hit because the attacker spent months/years constructing a research identity in which that hit is expected. M15 cross-check passes because the alignment is real-on-paper.
- **Persistent supply chain:** Yes.

## 6. account-hijack — impersonate-employee, Branch C

- **Profile:** impersonate-employee
- **Target:** Place SOC orders through a hijacked PI account, with declared use matching the PI's published research area.
- **Bypass excerpts (verbatim):**
  - Order content and stated use align with the real PI's publicly known research scope.
- **Why relevant:** M15 cross-check sees a SOC hit consistent with the account holder's published work — looks normal. Detection requires noticing the account is hijacked, not noticing the declaration is wrong.
- **Persistent supply chain:** No (per-victim).

## 7. visiting-researcher — fake-affiliation, Branch D

- **Profile:** fake-affiliation
- **Target:** Present as a visiting researcher with a sponsoring institution.
- **Bypass excerpts (verbatim):**
  - Orders framed as part of a sponsored collaboration; declared use references the sponsor's research program.
- **Why relevant:** Sponsor framing makes the declared use harder to falsify against the screening hit — the attacker borrows institutional plausibility.
- **Persistent supply chain:** No.

## 8. inbox-compromise — fake-affiliation, Branch B

- **Profile:** fake-affiliation
- **Target:** Order through a compromised inbox using fabricated supporting documents.
- **Bypass excerpts (verbatim):**
  - M5 Method 5 "Claim exemption / no IBC required" — frame the order as falling under an exemption that excuses both biosafety review and detailed end-use disclosure.
- **Why relevant:** Exemption-claim framing is a structural M15 evasion: the declaration says "this is exempt, no SOC use to declare," and the cross-check has no expected use to compare against.
- **Persistent supply chain:** No.

## 9. shell-company — Branch D

- **Profile:** purpose-built-organization
- **Target:** Real LLC with real employees ordering under a benign business cover story.
- **Bypass excerpts (verbatim):**
  - Method 5 (Measure 9): "Claim exemption" — assert the work falls outside SOC-relevant categories.
- **Why relevant:** Same exemption pathway as inbox-compromise, bound to a fully real LLC identity.
- **Persistent supply chain:** Yes.

## 10. insider-recruitment — impersonate-employee, Branch B

- **Profile:** impersonate-employee
- **Target:** Recruited insider at a real institution declares SOC orders as covered by their lab's existing IBC protocol.
- **Bypass excerpts (verbatim):**
  - M9 Option 3: "self-attest covered by IBC protocol".
- **Why relevant:** Insider self-attests that the SOC use is pre-approved under an existing real protocol. M15 cross-check sees an institutionally-coherent declaration.
- **Persistent supply chain:** Yes.

## 11. it-persona-manufacturing — exploit-affiliation, Branch B

- **Profile:** exploit-affiliation
- **Target:** Multiple personas inside a real institution, each declaring a research scope matching its persona.
- **Bypass excerpts (verbatim):**
  - M9 method: lift-and-modify a real IBC letter from elsewhere in the institution to back the declaration.
- **Why relevant:** Provides documentary support for whatever SOC declaration the persona makes; M15 cross-check finds matching paperwork.
- **Persistent supply chain:** Yes.

## 12. bulk-order-noise-cover — exploit-affiliation, Branch E

- **Profile:** exploit-affiliation
- **Target:** Hide SOC orders inside bulk legitimate ordering at a shared facility account.
- **Bypass excerpts (verbatim):**
  - SOC orders are submitted under the same generic facility-research declaration as hundreds of legitimate orders.
- **Why relevant:** The declared use is a shared boilerplate that legitimizes any SOC hit appearing in the facility's ordering pattern. M15 cross-check is dulled by base-rate dilution.
- **Persistent supply chain:** Yes.

## 13. biotech-incubator-tenant — purpose-built, Branch D

- **Profile:** purpose-built-organization
- **Target:** Incubator tenant with a stated research program that backs the SOC declaration.
- **Bypass excerpts (verbatim):**
  - Tenant's stated research scope to the incubator and to the synthesis provider is identical and self-consistent.
- **Why relevant:** Aligned cover story, similar to cro-framing.
- **Persistent supply chain:** Yes.

## 14. dormant-account-takeover — exploit-affiliation, Branch D

- **Profile:** exploit-affiliation
- **Target:** Reactivated dormant account inherits the original lab's declared research scope.
- **Bypass excerpts (verbatim):**
  - SOC orders match the previously-recorded lab research area.
- **Why relevant:** The declared use is whatever the original lab declared; M15 cross-check has no anomaly.
- **Persistent supply chain:** Yes.

---

## Branches with no relevant engagement

- **dormant-domain** — no SOC ordering documented in branch.
- **foreign-institution** — branch doesn't engage SOC declaration mechanics specifically.
- **shell-nonprofit** — declaration covered under M9 plan-authorship rather than M15 cross-check.
- **community-bio-lab-network** — Genspace-style declarative biosafety frameworks; engages M9 more than M15.
- **credential-compromise** — focuses on identity layer, not declaration content.

**Net assessment for M15:** Two failure modes dominate. First, vague free-text declarations that match anything (lab-manager-voucher, unrelated-dept-student) — direct holes in the cross-check itself. Second, alignment-by-construction (cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, biotech-incubator-tenant, account-hijack, insider-recruitment, dormant-account-takeover) — the attacker engineers consistency between cover story, paperwork, and SOC content so the cross-check finds nothing wrong. Exemption-claim framings (inbox-compromise, shell-company) are a third, smaller cluster.
