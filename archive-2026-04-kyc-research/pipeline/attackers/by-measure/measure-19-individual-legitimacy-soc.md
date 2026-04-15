# Measure 19 — Individual-legitimacy (SOC)

Attacker stories where the individual researcher's legitimacy (role, footprint, identity-affiliation match) is the load-bearing element. Ordered most-directly-engaging first.

---

## visiting-researcher
- **Profile:** fake-affiliation
- **Target:** Lone operator obtains a real visiting-scholar or courtesy appointment at a US/European R1 university through the institution's own lightweight vetting, then uses the resulting genuine `.edu` credentials. Real name throughout.
- **Bypass excerpts (verbatim):**
  - Method (M4 Option 1): "Piggyback on host-lab publication trail / institution signal dominance" — "The host university's entity footprint (publications, grants, institutional standing) passes any provider review. The attacker inherits this by association." Expertise: "Aspirant — free signal." Cost: "$0."
  - Method (M4 Option 2): "Self-asserted ORCID with host-university affiliation" — "As of 2023, ~2% of ORCID records have institution-verified affiliations." Cost: "$0." Lead-up: "Minutes."
  - Method (M4 Option 3): "LLM-assisted draft methods paper" — Expertise: "Novice — domain literacy + LLM prompting." Cost: "$0–$240."
  - Method (M4 Option 5): "Real minor footprint (preprint)" — Cost: "$0 (preprint servers) to $2,000." Lead-up: "1–2 weeks."
  - Operational chain: Upstream sub-chain ($0–$3,000, 2–4 months) gets the appointment; M4 individual-legitimacy is then resolved by institution-piggyback + ORCID + optional preprint.
- **Why relevant:** Branch is precisely about constructing individual-legitimacy via a real-but-lightly-vetted appointment + thin personal signals.
- **Persistent supply chain:** Y

## unrelated-dept-student
- **Profile:** exploit-affiliation
- **Target:** Real grad student in a non-wet-lab department uses their own real `.edu` and identity. Individual-legitimacy review must distinguish them from a wet-lab peer based on publication footprint and role — which it cannot, because early-career thinness is population-normal.
- **Bypass excerpts (verbatim):**
  - "Bypass A — Reflected legitimacy from home institution: ... the institution's research profile carries the attacker through individual-level thinness." Cost: "$0."
  - "Bypass B — Grad-student footprint floor: ... having 0–3 publications in the first 2–3 years of a PhD is population-normal." Cost: "$0."
  - "Bypass C — Cite a rotation host with a substantive footprint." Cost: "$0."
  - "Bypass D — Transliteration / name-disambiguation collision."
  - "Bypass E — Vague research self-declaration."
  - Note: "Estimated 15–30% of legitimate customers have individual footprints thin enough to flag on strict review — early-career researchers, industry scientists, community labs."
- **Why relevant:** Individual-legitimacy is the sole layer that could distinguish this attacker; branch demonstrates structural inability to do so.
- **Persistent supply chain:** Y

## lab-manager-voucher
- **Profile:** exploit-affiliation
- **Target:** Insider whose legitimate day job is placing oligo orders. Their individual role and institutional record are real and pass M19 natively.
- **Bypass excerpts (verbatim):**
  - "The attacker uses their own real government ID, real PII, and real phone number." Cost: "$0."
  - "The attacker's institutional email, HR record, and directory listing are all genuine. Domain recognition, inbox verification, and consistency review pass on the merits."
  - "Early-career exception: The attacker personally may lack publications, but reviewers expect lab managers, technicians, and visiting affiliates to lack individual research footprints. This is normatively acceptable."
  - "Total Matrix A cost: $0 direct, $0 lead-up."
- **Why relevant:** Individual legitimacy is real and authentic — the branch's whole point is that M19 cannot bind an insider whose role legitimately includes oligo ordering.
- **Persistent supply chain:** Y

## it-persona-manufacturing
- **Profile:** exploit-affiliation
- **Target:** Manufacture a researcher persona via IT onboarding flows so the individual record (HR, directory, ORCID, role) is institutionally real even though the persona is fabricated.
- **Why relevant:** Individual-legitimacy review checks records that the attacker has succeeded in populating with real institutional data.
- **Persistent supply chain:** Y

## dormant-account-takeover
- **Profile:** exploit-affiliation
- **Target:** Take over a dormant but real provider account belonging to a real researcher. Individual-legitimacy is the original account holder's, inherited wholesale.
- **Why relevant:** M19 passes because the registered individual is real; binding only if providers re-verify currency.
- **Persistent supply chain:** N

## account-hijack
- **Profile:** impersonate-employee
- **Target:** Hijack a real PI's active provider session/credentials. Individual-legitimacy is the PI's own.
- **Why relevant:** M19 trivially passes — the legitimate individual is on file; the hijack is invisible at the legitimacy-review layer.
- **Persistent supply chain:** N

## foreign-institution
- **Profile:** fake-affiliation
- **Target:** Individual claims affiliation with a foreign institution; provider cannot verify the individual against the foreign institution's HR/directory.
- **Why relevant:** Individual-legitimacy verification is asymmetrically harder across borders.
- **Persistent supply chain:** Y

## dormant-domain
- **Profile:** fake-affiliation
- **Target:** Use a revived dormant institutional domain to send mail as a "researcher" at the (defunct) institution. Individual-legitimacy review keys on the institutional email and any matching residual web footprint.
- **Why relevant:** Individual-legitimacy is constructed atop a real-but-defunct institutional shell.
- **Persistent supply chain:** Y

## insider-recruitment
- **Profile:** impersonate-employee
- **Target:** Recruit a real insider whose individual legitimacy is authentic; the insider places the order.
- **Why relevant:** M19 is satisfied by a real, willing individual.
- **Persistent supply chain:** Y

## bulk-order-noise-cover
- **Profile:** exploit-affiliation
- **Target:** Hide SOC orders inside high-volume legitimate ordering by an established individual; the individual's legitimacy is real.
- **Why relevant:** M19 passes natively; bypass relies on the legitimate individual's standing.
- **Persistent supply chain:** Y
