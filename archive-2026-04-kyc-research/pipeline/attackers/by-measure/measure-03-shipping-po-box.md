# Measure 03 — shipping-po-box

Screen shipping address for P.O. Box. Flag triggers: address is a P.O. Box.

---

## inbox-compromise

- **Branch slug:** inbox-compromise
- **Profile:** impersonate-employee
- **Target description:** Attacker compromises a dormant institutional `.edu` inbox at a small college and orders synthesis under that persona, needing a delivery destination that does not require physical presence on campus.
- **Bypass excerpts:**

  > **4. USPS PO Box / hold-for-pickup**
  >    - Expertise: **Novice.**
  >    - Cost: $5–$25/month.
  >    - Lead-up time: 1–2 days.
  >    - Attacker trace: Real ID shown at PO Box rental; USPS retains rental record.

- **Why relevant:** Explicitly names a USPS PO Box as a delivery option for the compromised-inbox persona — the only branch that nominates a PO Box as a primary shipping path.
- **Persistent supply chain?** N

---

## Notes

The PO-Box check is narrowly engaged across the branch set. Most branches that build a fake institution use commercial addresses (virtual offices, coworking, incubators, makerspaces, freight forwarders, residential homes framed as labs) precisely because PO Boxes are trivially flagged. Only inbox-compromise enumerates "USPS PO Box / hold-for-pickup" as a discrete shipping sub-method. Carrier-redirect bypasses (credential-compromise, account-hijack, foreign-institution 3b-i, it-persona-manufacturing) redirect to "drop addresses" without naming PO Boxes specifically; they are mapped to measures 04/05 instead.
