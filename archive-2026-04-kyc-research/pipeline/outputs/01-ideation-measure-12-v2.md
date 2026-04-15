# Stage 1 Ideation — Measure 12: billing-institution-association (v2)

Carries v1 PASSes unchanged; revises 5, 13; adds 17, 18 to close v1 gaps.

---

## 1–4, 6–12, 14–16 — PASS, copied from v1 unchanged

(See `01-ideation-measure-12-v1.md` for full text. Names: Stripe Radar AVS; Adyen AVS; Braintree AVS + Account Updater; ROR registered-address; Companies House; SAM.gov; Google Places geocoding; Procurement-system originator (PaymentWorks/Jaggaer/Coupa); ACH NACHA originator name; P-Card BIN range; Plaid Identity; Billing-vs-shipping + Smarty/Melissa RDI; Mercury/Brex/Relay sponsor-bank denylist; SOP name-match Jaro-Winkler tier.)

---

## 5 (REVISED). GLEIF LEI lookup — corporate-customer scope only

- **summary:** When the customer self-identifies as a CRO, contract lab, or corporate research entity (not academic), look up its LEI in the GLEIF public API. Use as a positive corroborating signal: an active LEI whose `entity.legalAddress` matches the billing address strongly upgrades trust. Absence of LEI is NOT a flag (most life-sciences SMBs lack one); the only flag is "LEI present but address mismatches" or "LEI status = LAPSED."
- **modes:** Direct
- **attacker_stories_addressed:** shell-company, LLC-cluster (cro-framing) — only as corroboration, not gating
- **external_dependencies:** GLEIF public API (free)
- **flags_thrown:** LEI lapsed → soft. LEI address mismatch → soft.
- **manual_review_handoff:** Reviewer compares the LEI legal address with billing on the order.
- **record_left:** LEI + GLEIF address snapshot.

## 13 (REVISED). Cardholder vs institutional HR/faculty directory

- **summary:** For institutional customers, scrape the institution's public faculty/staff directory (most US universities expose `/directory`, `/people`, or LDAP-backed lookup pages) at customer-onboarding time, snapshot it, and refresh quarterly. For each new card or new account-holder added to a customer record, fuzzy-match the cardholder name against the snapshot. ORCID is used only as a fallback corroborator, not the primary source. For institutions whose directory is gated (FERPA-style), require the customer to supply a department head's contact for callback verification at onboarding instead.
- **modes:** Attacker-driven
- **attacker_stories_addressed:** dormant-account-takeover (D), account-hijack
- **external_dependencies:** in-house scraper + per-institution config; ORCID public API as fallback
- **flags_thrown:** Cardholder name absent from snapshot → hold; reviewer phones AP via callback-verified number.
- **failure_modes_requiring_review:** small institutions without public directories; new hires not yet listed.
- **record_left:** snapshot date + name-match score + reviewer notes.

---

## 17 (NEW, gap-filler). PO budget-code stability check

- **summary:** When a customer pays via PO, store the budget/cost-center code from each PO. On every new order, compare the new PO's budget code to the customer's historical PO budget codes. If the new code has never been seen for this customer, OR if it differs from the modal code by more than the institution's typical pattern, flag for AP callback. Catches dormant-account-takeover **Bypass C** (mid-cycle PO budget reroute via finance admin) which v1 left uncovered.
- **modes:** Attacker-driven (gap-filler)
- **attacker_stories_addressed:** dormant-account-takeover (Bypass C, explicit gap from v1)
- **external_dependencies:** in-house PO history store
- **manual_review_handoff:** AP callback to institution finance contact via phone number from institution's public website.
- **flags_thrown:** Novel budget code on a long-running customer → hold pending callback. Budget code change paired with shipping-address change → hard hold.
- **record_left:** PO history table + diff that triggered the flag.

## 18 (NEW, gap-filler). Cross-customer originator clustering (structured-shell-formation detector)

- **summary:** Across all customer accounts, cluster by NACHA originator name (idea #10), Mercury/Brex sponsor-bank routing (idea #15), and shared beneficial-owner names (from Plaid Identity, idea #12). When ≥3 customer accounts share an originator profile (same fintech sponsor + similar entity-name pattern + ≥1 shared signatory) created within a 90-day window, flag the entire cluster. Mirrors the AML "structured shell formation" pattern that the cro-identity-rotation source warns banks file SARs on. Catches the LLC-cluster branches at the provider tier instead of relying on the bank to do it.
- **modes:** Attacker-driven (gap-filler)
- **attacker_stories_addressed:** cro-identity-rotation (explicit AML pattern), LLC-cluster, shell-nonprofit
- **external_dependencies:** internal customer DB; reuse of #10/#12/#15 outputs
- **manual_review_handoff:** Cluster hit → escalate the entire cluster to compliance lead, not order-level reviewer; freeze pending review.
- **flags_thrown:** ≥3 customers / 90 days / shared sponsor + signatory → cluster freeze. ≥2 → soft watch.
- **record_left:** Cluster ID, member account IDs, shared attributes.

---

## Dropped

(none — v1 had zero DROPs)
