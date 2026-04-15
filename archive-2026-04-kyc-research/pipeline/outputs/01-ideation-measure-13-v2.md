# Stage 1 Ideation — Measure 13 (phone-voip-check) — v2

Revision of v1 against `02-feasibility-measure-13-v1.md`. PASS ideas copied forward unchanged. REVISE ideas addressed inline. One new idea (#13) added in response to the gap on pre-empted-M13 branches.

---

## 1. Twilio Lookup — Line Type Intelligence — (PASS, unchanged)

- **summary:** Query Twilio Lookup v2 with `Fields=line_type_intelligence` for the customer's phone number. Returns line type (`mobile`, `landline`, `fixedVoip`, `nonFixedVoip`, `tollFree`, `personal`, `voicemail`, `pager`, `unknown`) plus carrier name and MCC/MNC. `nonFixedVoip` is the canonical "burner VoIP" signal (Google Voice, TextNow); `fixedVoip` flags business VoIP (often legitimate institutional PBX). Decision rule: nonFixedVoip → flag; fixedVoip + non-institutional context → flag; mobile/landline → pass.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (Branch B)
- **external_dependencies:** Twilio account; Lookup API key.
- **manual_review_handoff:** On nonFixedVoip flag, route to reviewer with number, carrier, line type, claimed institution. Playbook: (1) check institution directory for matching listing; (2) if absent, request callback at an institutional number from the institution's `.edu`/`.org` site; (3) refusal or VoIP-only → deny or escalate.
- **flags_thrown:** nonFixedVoip → review; fixedVoip + non-institutional email → review; unknown/error → soft flag, retry.
- **failure_modes_requiring_review:** API timeout/5xx; `unknown` line type for some intl numbers; carrier reassignment lag.
- **record_left:** JSON Lookup response stored against the order (timestamp, line_type, carrier, MCC/MNC).
- Other fields: `# stage 4`

## 2. Telesign PhoneID (with PhoneID Score variant merged in) — (PASS + #7 merged)

- **summary:** Telesign PhoneID Standard / Contact endpoints return phone type (`MOBILE`, `FIXED_LINE`, `VOIP`, `PREPAID`, `TOLL_FREE`), carrier, original-vs-current carrier (port detection). The PhoneID Score / Phone Number Intelligence layer adds a 0–1000 risk score with reason codes (VoIP, disposable, recently ported, SIM-swap velocity, known-fraud). Use as a single decision API: PhoneID classifies the number; Score makes the deny/review/pass call. Treated as one idea because both products live behind the same vendor relationship.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (B); credential-compromise (A) and account-hijack (C) via SIM-swap and port-recent reason codes if applied at re-verification time (see idea #13).
- **external_dependencies:** Telesign account; REST API; per-lookup billing.
- **manual_review_handoff:** Score above threshold (~700) or `phone_type=VOIP` → reviewer sees score, sub-reasons, port date. Playbook: VoIP or recent port → require institutional callback (idea #10).
- **flags_thrown:** phone_type=VOIP; high risk score; recent port (<30d); SIM-swap recent.
- **failure_modes_requiring_review:** Unknown carrier on some intl numbers; Score unavailable for certain country codes.
- **record_left:** PhoneID response + Score reason codes stored on order.
- Other fields: `# stage 4`

## 3. Budget VoIP-detection vendors evaluated together (Numverify, Veriphone) — (REVISE: merged #3 + #4, repositioned)

- **summary:** Numverify (apilayer) and Veriphone are budget REST APIs returning country, carrier, and `line_type`/`phone_type`. They are positioned in v2 explicitly as a *layered pre-screen* in front of Twilio Lookup or Telesign — a provider running them standalone would systematically miss nonFixedVoip carriers (Google Voice, TextNow), which is the entire bypass class in inbox-compromise B. Use case: cheap first-pass on bulk validation pipelines; hand off any "mobile" or "valid" result to Twilio for second opinion when the order is SOC. Relevance is conditional on the layered design — these two are kept on the list so stage 4 can verify whether either has actually closed the nonFixedVoip gap since v1 was written; if neither has, drop in v3.
- **modes:** Direct
- **attacker_stories_addressed:** inbox-compromise (B), conditional — only if the layered Twilio/Telesign call still happens.
- **external_dependencies:** Numverify and/or Veriphone API keys (compared); plus the layered #1 or #2.
- **manual_review_handoff:** Same as #1.
- **flags_thrown:** Any VoIP or invalid number; absence of VoIP flag is *not* treated as a pass without layered second opinion.
- **failure_modes_requiring_review:** Under-detection of nonFixedVoip; thin coverage outside major markets.
- **record_left:** Vendor JSON + which layer caught the flag.
- Other fields: `# stage 4`

## 4. NeutrinoAPI HLR Lookup — (PASS, unchanged from v1 idea #5)

- **summary:** NeutrinoAPI HLR Lookup pings the GSM Home Location Register and returns whether the number is currently active on a real mobile network. VoIP numbers fail HLR lookup. Phone Validate also returns `is_mobile`/line_type as a cheaper precheck. HLR is the strongest "is this actually a SIM in a tower right now" check; it complements Twilio's static line-type DB.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (B); weakly relevant to shell-nonprofit (E) — confirms a SIM is live but cannot tag a physical burner SIM as such.
- **external_dependencies:** NeutrinoAPI account; HLR lookups billed per-call (more than DB lookups).
- **manual_review_handoff:** HLR fail → treat as VoIP; reviewer requests institutional callback.
- **flags_thrown:** HLR negative; phone_validate line_type=voip.
- **failure_modes_requiring_review:** HLR query timeouts; some MVNOs return inconsistent HLR.
- **record_left:** HLR response (carrier, MCC/MNC, ported, roaming).
- Other fields: `# stage 4`

## 5. Prove (formerly Payfone) Phone Trust Score / Identity — (PASS, unchanged from v1 idea #6)

- **summary:** Prove combines MNO data with tenure, SIM-swap, and port-out signals via direct carrier integration. Returns trust score and reason codes including `voip`, `sim_swap_recent`, `port_recent`, `tenure`. Stronger than line-type DBs because of live MNO data. Used in banking onboarding.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (B); credential-compromise (A) and account-hijack (C) via SIM-swap recency signal — directly catches the "later switch to burner" subcase the mapping notes M13 might still catch.
- **external_dependencies:** Prove enterprise contract; primarily US (also UK, partial EU).
- **manual_review_handoff:** Score below threshold or `sim_swap_recent` → reviewer; playbook: require IAL2 evidence (M14 overlap) before processing.
- **flags_thrown:** voip; sim_swap_recent (≤7/30d); port_recent; tenure < N months.
- **failure_modes_requiring_review:** Coverage outside US/UK; enterprise-only auth.
- **record_left:** Prove decision response with reason codes.
- Other fields: `# stage 4`

## 6. FCC NANPA / iconectiv LNPA carrier-of-record lookup — (PASS, unchanged from v1 idea #8)

- **summary:** For US numbers, NANPA NPA-NXX block assignments + iconectiv LNPA (post-port carrier-of-record) identify the operating company code (OCC). Cross-reference against a maintained allowlist of VoIP-only OCNs (Bandwidth, Twilio, Google Voice, Inteliquent, Onvoy, etc.) to flag VoIP. NPA-NXX assignments are public; iconectiv LNP queries are gated. `[best guess]` on current public availability of NANPA bulk files.
- **modes:** Direct
- **attacker_stories_addressed:** inbox-compromise (B)
- **external_dependencies:** NANPA block-assignment files; iconectiv LNP query (paid); maintained VoIP-OCN list.
- **manual_review_handoff:** OCN ∈ VoIP allowlist → reviewer per #1 playbook.
- **flags_thrown:** OCN matches VoIP-OCN list.
- **failure_modes_requiring_review:** US-only; missed ports if iconectiv lookup skipped.
- **record_left:** Carrier OCN + lookup timestamp.
- Other fields: `# stage 4`

## 7. SOP: extend VoIP check to supporting-document call-back numbers — (PASS, unchanged from v1 idea #9)

- **summary:** When the customer attaches IBC letters, sponsor letters, or PI letters, the reviewer extracts every phone number on the document (OCR + manual confirmation) and runs each through Twilio Lookup / Telesign PhoneID. Any nonFixedVoip on a "verification contact" field of supporting docs is a hard flag, even if the customer profile phone passes. Directly addresses the inbox-compromise B excerpt: "Place an attacker-controlled VoIP number as the contact on a fabricated letter."
- **modes:** Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (B) — the only idea in the file that directly addresses the literal bypass excerpt.
- **external_dependencies:** Twilio Lookup or Telesign PhoneID; OCR pipeline (e.g., Tesseract or AWS Textract) or human extraction.
- **manual_review_handoff:** Reviewer extracts numbers, runs lookup, attaches results to ticket. Playbook: any nonFixedVoip on a sponsor/IBC/PI letter "verification contact" → deny or require alternative institutional contact.
- **flags_thrown:** Any VoIP phone on any supporting doc attributed to a verification contact.
- **failure_modes_requiring_review:** OCR misses; numbers in body of letter rather than letterhead; thin intl Lookup coverage.
- **record_left:** Per-document table of extracted numbers + line_type, attached to order.
- Other fields: `# stage 4`

## 8. SOP: callback at institution-published number — (PASS, unchanged from v1 idea #10)

- **summary:** When the customer's phone is flagged or any supporting document raises concern, the reviewer ignores the customer-supplied number and places a verification call to a number listed on the institution's official `.edu`/`.org` directory page (or ROR-linked website), asking for the named PI. Anchors trust to the institution's published switchboard. Catch-all backstop when the M13 API answer is ambiguous.
- **modes:** Direct, Attacker-driven
- **attacker_stories_addressed:** inbox-compromise (B); account-hijack (C) — directory callback may reach the real PI before the attacker harvests the order.
- **external_dependencies:** Reviewer time; institution website / directory; ROR for institution lookup.
- **manual_review_handoff:** Triggered by any M13 flag. Reviewer documents directory URL, number, who answered, what was confirmed.
- **flags_thrown:** N/A — follow-up SOP.
- **failure_modes_requiring_review:** Generic switchboards with no PI routing; non-English intl directories.
- **record_left:** Call log with directory URL, number, transcript notes, decision.
- Other fields: `# stage 4`

## 9. Disposable-number blocklist (Phoneable / community lists) — (REVISE from v1 idea #12, with concrete sources)

- **summary:** Maintain a deny list of carrier names and number prefixes belonging to disposable / temporary phone services (Hushed, TextNow, Google Voice / Google Subscriber Services, Burner, TextFree / Pinger, Sideline, 2ndLine, MySudo). Concrete starting sources: (a) the carrier-name strings Twilio Lookup returns for these services (which become a deterministic match list), (b) the open-source `disposable-phone-numbers` family of GitHub repos `[best guess: such repos exist for email, phone equivalents are thinner — verify in stage 4]`, (c) commercial feeds bundled into Telesign / Prove that the provider may already pay for. The point of the explicit list is that it gives the SOP a deterministic deny rule rather than relying on a vendor's evolving classifier.
- **modes:** Direct
- **attacker_stories_addressed:** inbox-compromise (B). Does not address shell-nonprofit (E) (physical SIMs).
- **external_dependencies:** Carrier name strings from idea #1 or #2; maintained allowlist; optional commercial disposables feed.
- **manual_review_handoff:** Match → deny or escalate.
- **flags_thrown:** Carrier name on disposables list.
- **failure_modes_requiring_review:** New disposable services; carriers reselling under generic names.
- **record_left:** Match record (carrier, blocklist version).
- Other fields: `# stage 4`

## 10. Re-verification timing SOP: re-run phone risk score on every order — (NEW, addresses gap noted in v1 feasibility)

- **summary:** Many of the corpus branches (account-hijack C, credential-compromise A, dormant-account-takeover) pre-empt M13 by registering with a real mobile and *later* swapping or substituting the phone or SIM. To convert "pre-empted" into "caught," the SOP re-runs Twilio Lookup / Telesign PhoneID Score / Prove Trust Score on the customer's phone *at every SOC order*, not just at signup. Triggers on: line_type changed from mobile to VoIP since prior order; SIM-swap reason code in the last 30 days; new port. This is a check timing change rather than a new data source, but it materially repurposes the existing data sources to address branches the v1 mapping notes as pre-empted.
- **modes:** Attacker-driven, Hardening
- **attacker_stories_addressed:** account-hijack (C); credential-compromise (A); inbox-compromise (B) when the attacker rotates the contact number after initial vetting.
- **external_dependencies:** Twilio Lookup, Telesign, or Prove (whichever is the primary). Stored history of prior lookup responses on the customer record for comparison.
- **manual_review_handoff:** Any change in line_type, recent SIM swap, or recent port between consecutive orders → reviewer with both the old and new lookup responses and the time delta.
- **flags_thrown:** line_type change; sim_swap_recent; port_recent.
- **failure_modes_requiring_review:** Legitimate users who actually port or upgrade phones; corporate device refresh cycles.
- **record_left:** Per-order lookup snapshot, plus diff against last snapshot.
- Other fields: `# stage 4`

---

## Dropped

- **v1 #3 (Numverify standalone)** — merged into v2 #3 as a layered pre-screen with Veriphone. Standalone framing is dropped because the under-detection of nonFixedVoip kills relevance to the only documented bypass.
- **v1 #4 (Veriphone standalone)** — merged into v2 #3.
- **v1 #7 (TeleSign Score as separate idea)** — merged into v2 #2 because it is the same vendor relationship and same data feed packaged with a scoring layer; not a meaningfully distinct idea.
- **v1 #11 (phone country vs institution country cross-check)** — dropped permanently. The feasibility check correctly noted that no attacker story in the mapping is forced into a country mismatch (the corpus uses real personal mobiles that match geography), and the inbox-compromise B attacker can trivially pick a US VoIP for a US institution. Pattern-matches the measure name without engaging real bypasses.

## Structural coverage gap (not a fixable ideation miss)

- **shell-nonprofit Branch E (physical burner SIMs):** the mapping itself notes these pass any VoIP check by definition. No idea under M13 can address this — it requires SIM-tenure or IAL2-style signals that live under M14 (identity-evidence-match). Surfaced here so stage 8 (per-measure synthesis) can mark it as out-of-scope rather than treating it as a coverage failure.
