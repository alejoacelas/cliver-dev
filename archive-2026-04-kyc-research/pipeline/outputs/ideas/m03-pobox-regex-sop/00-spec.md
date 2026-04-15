# m03-pobox-regex-sop

- **measure:** M03
- **name:** PO Box / APO regex + reviewer SOP
- **modes:** D
- **summary:** Deterministic regex over the address string for `PO Box`, `P.O. Box`, `Postfach`, `Casilla`, `Apartado`, plus APO/FPO/DPO patterns. Catches misformatted entries that bypass DPV.
- **attacker_stories_addressed:** po-box-shipping, apo-fpo-shipping
- **external_dependencies:** Internal regex library.
- **flags_thrown:** regex_po_box; regex_apo_fpo
- **manual_review_handoff:** Reviewer reviews any regex hit.
- **failure_modes_requiring_review:** Locale-specific phrasing variants.
- **record_left:** Matched regex + raw string.
