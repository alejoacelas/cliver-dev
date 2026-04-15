# Stage 2 Feasibility Check — Measure 12 (v1)

## Per-idea verdicts

1. **Stripe Radar AVS + cardholder-name** — PASS. Names a specific API + specific field codes; addresses dormant-account-takeover D, inbox-compromise, dormant-domain.

2. **Adyen AVS + Issuer Name** — PASS. Concrete vendor + endpoint; relevance same as #1. Note duplication risk with #1 — kept because Adyen handles non-US issuers differently and stage 4 will distinguish.

3. **Braintree AVS + Account Updater** — PASS. The Account Updater angle (detecting card-reissue to a new name) is a non-duplicative twist relevant to account-hijack.

4. **ROR registered-address cross-check** — PASS. Specific public API; addresses LLC-cluster (LLCs absent from ROR), inbox-compromise driving-distance trick, shell entities.

5. **GLEIF LEI registered-address** — PASS on concreteness. Relevance is weaker: most academic institutions and shell LLCs alike lack LEIs (LEIs are for entities trading securities/derivatives). REVISE: clarify it's a positive signal only when present, and explicitly scope to corporate/CRO customers (LLC-cluster, shell-nonprofit cases that need an LEI for swap reporting); drop the "no LEI = flag" claim — too noisy.

6. **Companies House registered-office** — PASS. Concrete API; addresses UK variants of dormant-domain / shell-company.

7. **SAM.gov entity registration** — PASS. Concrete API; addresses shell-nonprofit and CRO-framing claims of federal-grant work.

8. **Google Places address-to-institution geocoding** — PASS. Directly engages inbox-compromise's "driving distance" trick which the mapping file flags as an explicit measure-12 evasion.

9. **Procurement-system originator (PaymentWorks/Jaggaer/Coupa)** — PASS. Concrete vendor list; this is the only idea targeting dormant-account-takeover Bypasses A/B/C and credential-compromise's invoiced-order dominant path.

10. **ACH originator name (NACHA company-name)** — PASS. Names the specific NACHA field and the exact "fintech BIN sponsor leak" the shell-nonprofit source calls out verbatim.

11. **P-Card BIN range check** — PASS. Concrete BIN-DB vendor + Visa Level II/III field name. Addresses inherited-P-card and small-LLC business card paths.

12. **Plaid Identity issuer-billing cross-check** — PASS. Concrete vendor (Plaid Identity product), concrete fields, addresses LLC-cluster (Plaid pulls bank CIP records that surface real owner name vs claimed institution).

13. **Cardholder vs ORCID institutional roster** — PASS on concreteness (ORCID API named) but REVISE on relevance: ORCID's affiliation field is self-asserted, not authoritative for "is this person on the payroll." Better source: institution's published faculty directory or a vendor like Faculty Insight / AcademicAnalytics. Revise to name a specific institutional-directory source or downgrade to "ORCID-as-corroborating-signal-only."

14. **Billing-vs-shipping consistency + RDI** — PASS. Smarty/Melissa RDI is a real product; addresses account-hijack Method 2 explicitly.

15. **Mercury/Brex/Relay sponsor-bank denylist** — PASS. Concrete (Fed E-Payments Routing Directory + named sponsor banks); addresses shell-nonprofit verbatim.

16. **SOP: name-match consistency tier** — PASS. This is the codification of the "design-intent block" the dormant-account-takeover source explicitly cites. SOP is concrete (Jaro-Winkler threshold + playbook).

## Gaps

- No idea addresses **dormant-account-takeover Bypass C** (mid-cycle PO budget-code reroute via finance-system admin) beyond #9's mention. A PO-budget-code-stability check (compare PO budget code to prior orders for same customer) would target this directly. Add in v2.
- No idea targets the **cro-identity-rotation AML "structured shell formation"** angle — multiple LLCs from the same principal hitting the provider. A cross-customer originator-name clustering check (same NACHA originator name or same Mercury sponsor across N customer accounts) would catch it.

## Verdicts summary

- PASS: 14 (1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16)
- REVISE: 2 (5, 13)
- DROP: 0
- Gaps: 2

STOP: no
