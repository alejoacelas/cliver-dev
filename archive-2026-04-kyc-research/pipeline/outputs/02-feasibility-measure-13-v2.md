# Stage 2 Feasibility Check — Measure 13 (phone-voip-check) — v2

Reviewing `01-ideation-measure-13-v2.md`. v1 had 4 REVISE verdicts; v2 addressed all 4 (two merges, one repositioning, one drop) and added one new SOP idea (#10) targeting the gap on pre-empted-M13 branches.

---

## 1. Twilio Lookup — Line Type Intelligence — **PASS**

Unchanged from v1; verdict unchanged. Concrete vendor + product + field + enum values; directly catches the inbox-compromise B bypass when paired with idea #7.

## 2. Telesign PhoneID (with PhoneID Score merged in) — **PASS**

The merge of v1 #7 into v1 #2 is the right call: same vendor relationship, same underlying data, scoring layer is a packaging detail not a distinct check. Concreteness is preserved (both products named, both reason-code sets enumerated). Relevance unchanged. Pass.

## 3. Budget VoIP-detection vendors evaluated together (Numverify, Veriphone) — **PASS**

The repositioning fixes the relevance problem from v1. v2 explicitly says these only address inbox-compromise B *if layered* with #1 or #2, and explicitly invites stage 4 to drop them if neither has closed the nonFixedVoip gap. That's the right way to keep budget-tier vendors on the list without overclaiming. Concreteness was always fine. Pass.

## 4. NeutrinoAPI HLR Lookup — **PASS**

Unchanged from v1 #5; verdict unchanged. HLR is a meaningfully distinct mechanism from a static line-type DB.

## 5. Prove (Payfone) Phone Trust Score / Identity — **PASS**

Unchanged from v1 #6; verdict unchanged. The SIM-swap recency angle gives genuine leverage on account-hijack C and credential-compromise A.

## 6. FCC NANPA / iconectiv LNPA carrier-of-record — **PASS**

Unchanged from v1 #8; verdict unchanged. Vendor-independent fallback for US numbers.

## 7. SOP: extend VoIP check to supporting-document call-back numbers — **PASS**

Unchanged from v1 #9; verdict unchanged. Still the highest-relevance idea in the file — directly addresses the literal bypass excerpt from inbox-compromise B.

## 8. SOP: callback at institution-published number — **PASS**

Unchanged from v1 #10; verdict unchanged.

## 9. Disposable-number blocklist — **PASS**

v2 addresses the v1 concreteness concern by naming three concrete starting sources: (a) carrier-name strings as returned by Twilio Lookup (deterministic), (b) the open-source `disposable-phone-numbers` family of GitHub repos with an explicit `[best guess]` admission, (c) commercial feeds bundled into Telesign or Prove. The agent named the deterministic source (Twilio carrier strings) rather than only naming aspirational community lists, which is enough for stage 4 to begin work. Pass.

## 10. Re-verification timing SOP (re-run phone risk score per order) — **PASS**

New idea in v2. Concreteness: pairs a specific signal (line_type change between consecutive lookups, sim_swap_recent reason code, port_recent reason code) with a specific playbook (escalate diff to reviewer with old + new responses and time delta). Reuses already-named vendors so no new data-source naming required. Relevance: directly addresses the v1 feasibility gap on pre-empted-M13 branches (account-hijack C, credential-compromise A) by repurposing the existing data sources at order time rather than only signup. Pass.

---

## Dropped ideas (carried forward from v2's Dropped section)

The four drops in v2's Dropped section are all justified:
- v1 #3 standalone Numverify, v1 #4 standalone Veriphone — correctly merged into v2 #3 with the layered framing.
- v1 #7 TeleSign Score — correctly merged into v2 #2.
- v1 #11 phone-country vs institution-country — correctly dropped permanently. No attacker story in the mapping is forced into a country mismatch.

## Structural coverage gap acknowledged

v2 surfaces the shell-nonprofit Branch E gap (physical burner SIMs) explicitly as out-of-scope for M13. Agreed. This is the right place to mark it — it belongs to M14 (identity-evidence-match), not M13, and trying to "fix" it inside M13 would just generate ideas that don't work.

## Gaps (attacker classes no current idea addresses)

None remaining within M13's scope. The only gap is the structural one above, which is correctly out of scope.

---

**STOP: yes**

All 10 ideas PASS both gates. The four v1 REVISE verdicts were addressed cleanly. The one v1 gap (pre-empted-M13 branches) was filled by new idea #10. The remaining structural gap (physical burner SIMs) is correctly acknowledged as out-of-M13-scope. No further iteration needed.
