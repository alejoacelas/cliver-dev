# Stage 2 Feasibility Check — Measure 13 (phone-voip-check) — v1

Reviewing `01-ideation-measure-13-v1.md` against concreteness + relevance gates.

**Context note on relevance bar.** The mapping file is unusually narrow: only inbox-compromise (Branch B) contains a documented VoIP bypass and even there it concerns supporting-document call-back numbers, not the customer profile phone field. Branches 2–4 (account-hijack, credential-compromise, shell-nonprofit) explicitly *pre-empt* M13 by using real mobile / physical burner SIMs. Therefore relevance must be judged charitably for ideas that catch B, and skeptically for ideas that only address pre-empted patterns.

---

## 1. Twilio Lookup — Line Type Intelligence — **PASS**

Concreteness: names a specific vendor product, the exact field (`Fields=line_type_intelligence`), and the exact enum values (`nonFixedVoip` etc.). Researcher in stage 4 knows exactly what to look up. Relevance: directly catches the VoIP-on-the-profile-field case and, paired with idea #9's SOP, addresses inbox-compromise B's letter-callback bypass. Pass.

## 2. Telesign PhoneID — **PASS**

Concreteness: named vendor + named product family + named fields (phone_type, port history, score). Pass concreteness. Relevance: catches B; the SIM-swap recency signal also gives nonzero leverage on credential-compromise A and account-hijack C, even though the mapping notes those bypass methods *pre-empt* M13 — Telesign's port/swap signals are exactly the kind of thing that detects the "later switch to burner" version that the mapping notes M13 might still catch. Pass.

## 3. Numverify (apilayer) — **REVISE**

Concreteness: passes — named vendor, named product. Relevance: the ideation itself admits Numverify under-detects nonFixedVoip (Google Voice / TextNow). Since the *only* documented VoIP bypass uses exactly that class of number, an under-detecting tool addresses ~zero real attacker stories. Either (a) revise to position it explicitly as a cheap pre-screen layered with #1 or #5 (and justify why a provider would deploy it standalone), or (b) drop in v2.

## 4. Veriphone — **REVISE**

Same as Numverify: concreteness OK, relevance hinges on whether it actually detects nonFixedVoip. The ideation marks this `[best guess]`. v2 should either commit to the claim or merge this into idea #1 as "alternative budget vendors evaluated together."

## 5. NeutrinoAPI HLR Lookup — **PASS**

Concreteness: named vendor, named endpoint (HLR Lookup), and a specific physical mechanism (querying GSM HLR). Relevance: HLR lookup is meaningfully distinct from a static line-type DB — a VoIP number has no HLR record, so this is a direct catch for inbox-compromise B's VoIP letter callback. Pass.

## 6. Prove (Payfone) Phone Trust Score — **PASS**

Concreteness: named vendor (with prior name in parentheses), named products, named reason codes. Relevance: catches B; SIM-swap and port-recent reason codes give actual leverage on account-hijack C and credential-compromise A, which the mapping flags as borderline. Pass.

## 7. TeleSign Score (PhoneID Score / Intelligence) — **REVISE**

Concreteness: passes. Relevance: this is a thin wrapper / repackaging of idea #2 (Telesign PhoneID). The same vendor + adjacent product. By the rubric's "duplicate idea (same data source as another idea, no meaningful difference) → DROP one," this should either be merged into #2 as "Telesign PhoneID Score variant" or dropped. Revise: merge into #2 in v2.

## 8. FCC NANPA / iconectiv LNPA carrier-of-record — **PASS**

Concreteness: names the specific public dataset (NANPA NPA-NXX block assignments) and the specific gated registry (iconectiv LNPA). The `[best guess]` markers are well-scoped (the agent flags the parts it isn't sure about). Researcher in stage 4 can immediately go look up NANPA file availability and iconectiv access terms. Relevance: catches B for US numbers; provides a vendor-independent fallback. Pass.

## 9. SOP: extend VoIP check to supporting-document call-back numbers — **PASS**

Concreteness: SOP is paired with a specific signal (Twilio Lookup line_type on extracted numbers) and a specific playbook (deny if any verification-contact number on a sponsor/IBC/PI letter is nonFixedVoip). Meets the "manual review of the order" rubric exception. Relevance: this is the *only* idea in the set that directly addresses the literal bypass excerpt from inbox-compromise B ("Place an attacker-controlled VoIP number as the contact on a fabricated letter"). Highest-relevance idea in the file. Pass.

## 10. SOP: callback at institution-published number — **PASS**

Concreteness: specific signal (any M13 flag) + specific playbook (use ROR-linked institution directory, document URL/number/answerer/decision). Meets the SOP rubric exception. Relevance: backstop for B and gives genuine new leverage on account-hijack C (callback may reach the real PI before the attacker harvests the order — a meaningful detection vector the mapping does not note). Pass.

## 11. Phone country code vs claimed institution country — **REVISE**

Concreteness: passes — names libphonenumber and ROR explicitly. Relevance: the ideation itself flags this as a *composite* signal that does nothing on its own. Composite signals can be valuable, but the only attacker story this engages (inbox-compromise B) doesn't require a country mismatch — the attacker can pick a US VoIP for a US institution trivially. v2 should either (a) name a specific attacker pattern in the mapping where geo mismatch is forced (none currently — the mapping notes branches commit *real* mobiles, which would naturally match geography), or (b) drop. This currently looks like pattern-matching the measure name with a plausible-but-unmotivated check.

## 12. Disposable / temporary number blocklist — **REVISE**

Concreteness: borderline. The idea admits "no single public blocklist exists" and gestures at "open-source projects maintain partial lists" without naming one. To pass concreteness, v2 must name a specific list (e.g., a specific GitHub repo, a specific commercial feed like the disposable-numbers feed offered by certain fraud vendors) or this fails gate 1. Relevance is fine (catches B). Revise: name a specific blocklist source.

---

## Gaps (attacker classes no current idea addresses)

- **Physical burner SIMs (shell-nonprofit Branch E):** the mapping explicitly notes these are real mobile SIMs and "would not be flagged" by VoIP detection. None of the 12 ideas address this — and arguably none *can* within the scope of M13. Worth noting in v2 as a structural coverage gap rather than a fixable ideation miss.
- **Pre-empted-M13 branches (account-hijack C, credential-compromise A):** ideas #2 and #6 give partial coverage via SIM-swap recency signals if the SOP applies them at re-verification time. v2 could surface this as an explicit SOP idea ("re-run phone risk score on every order, not just signup") to make the leverage concrete.

---

**STOP: no**

Iterate to v2: address the 4 REVISE verdicts (#3 merge or justify, #4 merge into #1, #7 merge into #2, #11 drop or motivate, #12 name a real blocklist), and consider one new SOP idea for re-verification timing to harden against the pre-empted-M13 branches.
