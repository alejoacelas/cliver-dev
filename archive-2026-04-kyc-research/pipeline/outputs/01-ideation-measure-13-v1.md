# Stage 1 Ideation — Measure 13 (phone-voip-check) — v1

Measure: detect whether the customer-supplied phone number is VoIP (vs mobile/landline). Per the attacker mapping, only `inbox-compromise` (Branch B) directly engages M13 — by placing an attacker-controlled VoIP number on a fabricated supporting letter. The other branches pre-empt M13 by using real personal mobiles. So the relevance bar is high: ideas should either (a) detect VoIP on the customer profile phone field, (b) extend the check to supporting-document call-back numbers, or (c) catch adjacent phone-tradecraft (burner SIM, recently-ported, low-reputation number).

---

## 1. Twilio Lookup — Line Type Intelligence

- **summary:** Query Twilio Lookup v2 with `Fields=line_type_intelligence` for the customer's phone number. Returns line type (`mobile`, `landline`, `fixedVoip`, `nonFixedVoip`, `tollFree`, `personal`, `voicemail`, `pager`, `unknown`) plus carrier name and mobile country/network code. `nonFixedVoip` is the canonical "burner VoIP" signal (Google Voice, TextNow, etc.); `fixedVoip` flags business VoIP (often legitimate for institutional PBX). Decision rule: nonFixedVoip → flag; fixedVoip + non-institutional context → flag; mobile/landline → pass.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (Branch B — VoIP contact-back number on fabricated letter, if the SOP extends the lookup to supporting-doc numbers as well as the profile field)
- **external_dependencies:** Twilio account + Lookup API key; per-lookup billed.
- **manual_review_handoff:** On nonFixedVoip flag, route to a reviewer with: number, carrier, line type, customer-claimed institution. Reviewer playbook: (1) check if institution publishes a directory listing matching the number; (2) if not, request a callback at an institutional landline/PBX listed on the institution's `.edu`/`.org` site; (3) if customer refuses or only offers VoIP, deny or escalate.
- **flags_thrown:**
  - `nonFixedVoip` → review (most likely fabricated/concealed identity)
  - `fixedVoip` + non-institutional email → review
  - `unknown`/lookup error → soft flag, retry
- **failure_modes_requiring_review:** API timeout or 5xx; `unknown` line type for valid intl numbers; carrier reassignment lag (legitimate mobile recently ported to MVNO sometimes mislabeled).
- **record_left:** JSON Lookup response stored against the order, including request timestamp, line_type, carrier name, MCC/MNC. Auditable artifact for the M13 row.
- Other fields: `# stage 4`

## 2. Telesign PhoneID

- **summary:** Telesign PhoneID Standard / Contact / Score endpoints return phone type (`MOBILE`, `FIXED_LINE`, `VOIP`, `PREPAID`, `TOLL_FREE`, etc.), carrier, original vs current carrier (port detection), and a risk score (PhoneID Score / Intelligence) blending VoIP, port history, SIM-swap velocity, and known-fraud signals. Use as the primary check or as a second opinion on Twilio.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (B); also covers credential-compromise A indirectly via SIM-swap velocity if the SOP applies it at re-verification time, not just first order.
- **external_dependencies:** Telesign account; REST API; per-lookup billed.
- **manual_review_handoff:** PhoneID Score above threshold (e.g., 700) → reviewer sees score, sub-reasons, port date. Playbook: if recently ported (<30 days) or VoIP, request callback at an institutional number.
- **flags_thrown:** `phone_type=VOIP` → review; high risk score → review; recent port → review.
- **failure_modes_requiring_review:** Lookup returns `unknown carrier` for some intl numbers; Score unavailable for certain country codes.
- **record_left:** PhoneID JSON response, score, sub-reasons.
- Other fields: `# stage 4`

## 3. Numverify (apilayer) phone validation

- **summary:** Cheap REST endpoint returning country, carrier, line_type (`mobile`/`landline`), and validity. Lower fidelity than Twilio/Telesign — does not reliably tag nonFixedVoip — but useful as a pre-screen or for low-budget providers. `[best guess]` on completeness of VoIP tagging; in practice it under-detects Google Voice / TextNow.
- **modes:** Direct
- **attacker_stories_addressed:** inbox-compromise (B), partially — would catch obvious VoIP carriers but miss hidden ones
- **external_dependencies:** Numverify/apilayer key; per-call quota.
- **manual_review_handoff:** Same as #1 but with awareness that absence of VoIP flag is weak evidence.
- **flags_thrown:** line_type indicating VoIP carrier; invalid number.
- **failure_modes_requiring_review:** Misses nonFixedVoip; stale carrier data.
- **record_left:** JSON response stored on order.
- Other fields: `# stage 4`

## 4. Veriphone

- **summary:** REST API returning phone validity, country, carrier, and `phone_type` (mobile, landline, voip, etc.). Positioned as a budget alternative to Twilio Lookup. Plausibly catches the same nonFixedVoip cases Twilio catches but with thinner carrier coverage outside major markets. `[best guess]` on the depth of VoIP detection.
- **modes:** Direct
- **attacker_stories_addressed:** inbox-compromise (B)
- **external_dependencies:** Veriphone API key.
- **manual_review_handoff:** Same playbook as #1.
- **flags_thrown:** `phone_type=voip`; invalid number.
- **failure_modes_requiring_review:** Coverage gaps in non-OECD markets; stale carrier-of-record.
- **record_left:** JSON response.
- Other fields: `# stage 4`

## 5. NeutrinoAPI Phone Validate / HLR Lookup

- **summary:** NeutrinoAPI's Phone Validate returns line type and a `is_mobile` flag. The HLR Lookup endpoint pings the GSM Home Location Register and returns whether the number is currently active on a real mobile network — VoIP numbers fail HLR lookup. HLR Lookup is the strongest "is this actually a SIM in a tower right now" check available; it complements Twilio's static line-type DB.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (B); also adds weak signal vs shell-nonprofit (E) burner-SIM enrollment because HLR confirms the SIM is live but does nothing to identify it as burner.
- **external_dependencies:** NeutrinoAPI account; per-call billing; HLR lookups cost more than DB lookups.
- **manual_review_handoff:** HLR fail → treat as VoIP-equivalent; reviewer asks for institutional callback.
- **flags_thrown:** HLR lookup negative; phone_validate line_type=voip.
- **failure_modes_requiring_review:** HLR query timeouts; certain MVNOs return inconsistent HLR records.
- **record_left:** HLR response (carrier, MCC/MNC, ported flag, roaming flag).
- Other fields: `# stage 4`

## 6. Prove (formerly Payfone) Phone Trust Score / Identity

- **summary:** Prove's Trust Score / Pre-Fill / Identity Manager combines mobile-network-operator (MNO) data with tenure, SIM-swap, and port-out signals. Returns a numeric trust score and reason codes including `voip`, `sim_swap_recent`, `port_recent`. Stronger than line-type DBs because it pulls live MNO data via direct carrier integration. Used in banking onboarding.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (B); credential-compromise A and account-hijack C (via SIM-swap recency signal — catches the SIM-swap pre-empt-then-bypass case the mapping notes).
- **external_dependencies:** Prove enterprise contract; primarily US carrier coverage.
- **manual_review_handoff:** Score below threshold or `sim_swap_recent` → reviewer sees Prove reason codes; playbook is to require IAL2 evidence (overlaps M14) before processing.
- **flags_thrown:** voip; sim_swap_recent (≤7/30 days); port_recent; tenure < N months.
- **failure_modes_requiring_review:** No coverage outside US/UK/some EU; enterprise-only auth.
- **record_left:** Prove decision response with reason codes.
- Other fields: `# stage 4`

## 7. TeleSign Score (PhoneID Score / Intelligence)

- **summary:** Risk-scoring product layered on top of PhoneID. Returns a 0–1000 risk score plus reasons (VoIP, disposable, recently ported, SIM-swap). Use as a single decision API instead of stitching line-type and behavioral signals manually.
- **modes:** Direct
- **attacker_stories_addressed:** inbox-compromise (B); partial coverage of credential-compromise A.
- **external_dependencies:** Telesign account; per-lookup billed.
- **manual_review_handoff:** Score above threshold → reviewer; playbook same as #1.
- **flags_thrown:** Score >700; VoIP reason code; disposable reason code.
- **failure_modes_requiring_review:** Score unavailable for some country codes.
- **record_left:** Score + reason codes.
- Other fields: `# stage 4`

## 8. FCC NANPA / Local Number Portability Administrator (LNPA / iconectiv) carrier-of-record lookup

- **summary:** For US numbers, the FCC NANPA + iconectiv LNPA databases identify the current operating company code (OCC) for an NPA-NXX block and (via LNP) the actual current carrier after porting. Cross-reference the carrier against a maintained list of VoIP-only OCNs (Bandwidth, Twilio, Google Voice, Inteliquent, Onvoy, etc.) to flag VoIP. Free underlying data, requires building the OCN→VoIP mapping. `[best guess]` on whether NANPA bulk data is freely downloadable in current form (NPA-NXX block assignments are public; live ported-number lookup is gated through iconectiv).
- **modes:** Direct
- **attacker_stories_addressed:** inbox-compromise (B)
- **external_dependencies:** NANPA block-assignment files (public); iconectiv LNP query (gated, paid); maintained VoIP-OCN allowlist.
- **manual_review_handoff:** OCN matches VoIP allowlist → reviewer sees carrier name and decides per #1 playbook.
- **flags_thrown:** OCN ∈ VoIP-OCN list.
- **failure_modes_requiring_review:** NANPA block lookup misses ported numbers; only US.
- **record_left:** Carrier OCN + lookup timestamp.
- Other fields: `# stage 4`

## 9. SOP: extend VoIP check to supporting-document call-back numbers

- **summary:** When the customer attaches IBC letters, sponsor letters, or PI letters (as in the inbox-compromise branch), the reviewer extracts every phone number on the document and runs it through Twilio Lookup / Telesign PhoneID. Any nonFixedVoip in a "contact for verification" field on supporting docs is treated as a hard flag, even if the customer profile phone passes. This is the only SOP that meaningfully addresses the only branch in the corpus that documents a VoIP bypass.
- **modes:** Attacker-driven (inbox-compromise B is the named target)
- **attacker_stories_addressed:** inbox-compromise (B) — direct address of the M9 Method 4 bypass excerpt
- **external_dependencies:** Twilio Lookup or Telesign PhoneID; OCR or human extraction of phone numbers from PDF letters.
- **manual_review_handoff:** Reviewer extracts numbers, runs lookup, attaches results to ticket. Playbook: if any verification-contact number on a sponsor/IBC/PI letter is nonFixedVoip, deny or require an alternative verifiable contact (institutional switchboard) before proceeding.
- **flags_thrown:** Any VoIP phone on any supporting document attributed to a "verification contact."
- **failure_modes_requiring_review:** OCR misses; numbers given as text in body of letter rather than letterhead; international numbers with thin Lookup coverage.
- **record_left:** Per-document table of extracted numbers + Lookup line type, attached to the order.
- Other fields: `# stage 4`

## 10. SOP: callback at institution-published number

- **summary:** Independent of any VoIP API: when the customer's phone is flagged or when a supporting document raises any concern, the reviewer ignores the customer-supplied number and instead places a verification call to a number listed on the institution's official `.edu`/`.org` directory page (or ROR-linked website), asking for the named PI. This sidesteps VoIP detection entirely by anchoring trust to the institution's published switchboard. It is the catch-all backstop when M13's API answer is ambiguous.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (B); account-hijack (C) — even if the registered phone is the real PI's mobile, an institutional-directory callback may reach the PI before the attacker harvests the order.
- **external_dependencies:** Reviewer time; institution website / directory.
- **manual_review_handoff:** Triggered by any M13 flag. Reviewer documents the directory URL used, the number called, who answered, and what was confirmed.
- **flags_thrown:** N/A — this is a follow-up SOP triggered by other flags.
- **failure_modes_requiring_review:** Institution publishes only a generic switchboard with no PI-level routing; international institutions in non-English directories.
- **record_left:** Call log entry with directory URL, number, transcript notes, decision.
- Other fields: `# stage 4`

## 11. Cross-check phone country code vs claimed institution country

- **summary:** Compute the country implied by the E.164 prefix and compare to the country of the customer's claimed institution (resolved via ROR). A US-claimed academic with a Bulgarian or +44 mobile is not by itself disqualifying, but combined with a VoIP flag or a non-institutional email it raises composite risk. Free check, no external API beyond ROR.
- **modes:** Direct
- **attacker_stories_addressed:** inbox-compromise (B) as a composite signal; weakly addresses several geo-mismatch attacker patterns not explicitly in M13's mapping.
- **external_dependencies:** libphonenumber (Google) for parsing; ROR API for institution country.
- **manual_review_handoff:** Mismatch + any other M13 flag → reviewer.
- **flags_thrown:** country(phone) ≠ country(institution) AND another flag present.
- **failure_modes_requiring_review:** Legitimate visiting researchers, sabbaticals, recent relocations.
- **record_left:** Computed country pair stored on order.
- Other fields: `# stage 4`

## 12. Disposable / temporary number list cross-reference

- **summary:** Maintain or subscribe to a blocklist of known disposable-phone services (Hushed, TextNow, Google Voice, Burner, TextFree, Sideline, Pinger). Match the phone's carrier-of-record against this list. Many of these are tagged `nonFixedVoip` by Twilio already, but a maintained explicit list lets the SOP make a deterministic deny/flag decision rather than rely on a vendor's evolving classifier. `[best guess]` that no single public blocklist exists; some open-source projects maintain partial lists.
- **modes:** Direct
- **attacker_stories_addressed:** inbox-compromise (B); shell-nonprofit (E) only weakly because that branch uses physical burner SIMs not VoIP services.
- **external_dependencies:** Maintained blocklist; carrier name from any of #1–#5.
- **manual_review_handoff:** Match → deny or escalate per provider policy.
- **flags_thrown:** Carrier name in disposable list.
- **failure_modes_requiring_review:** New disposable services not yet in list; carriers that resell to disposable apps under generic names.
- **record_left:** Match record (carrier, blocklist version).
- Other fields: `# stage 4`
