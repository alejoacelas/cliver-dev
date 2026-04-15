# m12-procurement-network

- **measure:** M12
- **name:** PaymentWorks / Jaggaer / SAM.gov supplier registration
- **modes:** A
- **summary:** If the customer is a US institution, verify supplier registration in PaymentWorks, Jaggaer, or SAM.gov. Confirms the institution's procurement office authorized the payment relationship.
- **attacker_stories_addressed:** third-party-billing, shell-company
- **external_dependencies:** PaymentWorks; Jaggaer; SAM.gov.
- **flags_thrown:** no_supplier_registration
- **manual_review_handoff:** Reviewer contacts procurement office.
- **failure_modes_requiring_review:** Coverage limited to enrolled institutions.
- **record_left:** Registration ID.
