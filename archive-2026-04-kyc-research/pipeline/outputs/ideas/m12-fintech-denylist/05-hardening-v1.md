# m12-fintech-denylist — bypass-aware hardening v1

- **measure:** M12 (billing-institution-association)
- **implementation reviewed:** `04-implementation-v1.md`

## Attacker-story walkthrough

### 1. dormant-account-takeover

**Summary:** Successor or unauthorized user takes over an inherited institutional account.

**Bypass methods relevant to this measure:**

- **Bypass A — Inherited institutional PO / P-card.**
  - **Classification: MISSED.** The inherited P-card is issued by the institution's bank (not a fintech/neobank). The BIN is from a traditional issuer. The fintech denylist does not fire.

- **Bypass B — Inherited invoice / net-terms billing.**
  - **Classification: MISSED.** Invoice billing has no card BIN to check. The fintech denylist is inapplicable.

- **Bypass C — Modified PO budget code.**
  - **Classification: MISSED.** Same as Bypass B — institutional billing, no fintech BIN.

- **Bypass D — Substituted personal card.**
  - **Classification: MISSED.** The attacker's personal card is from a traditional bank (the attacker is using their own regular credit/debit card). Unless the attacker happens to use a neobank personal card, the fintech denylist does not fire. Even if they do, the flag is `fintech_neobank_billing` which triggers only when the customer claims institutional affiliation — and the dormant-account-takeover branch does claim institutional affiliation, so this would fire. But the primary Bypass D detection is from the sibling m12-billing-shipping-consistency check (address mismatch), not this idea.

**Net assessment:** This check provides no meaningful signal against the dormant-account-takeover branch. The inherited billing paths are institutional (non-fintech), and the personal-card path is primarily caught by address-consistency checks.

---

### 2. dormant-domain

**Summary:** Lone operator reanimates a defunct entity's domain.

**Bypass methods relevant to this measure:**

- **Bypass A — Personal card (permissive providers).**
  - **Classification: MISSED.** Personal card from a traditional bank. Fintech denylist does not fire.

- **Bypass B — LLC + EIN + fintech business account (e.g., Mercury).**
  - **Classification: CAUGHT.** The source file explicitly names Mercury as the likely fintech business bank account path. Mercury's BIN sponsor (Choice Financial Group / Evolve Bank & Trust) would be on the fintech denylist. The `fintech_neobank_billing` flag fires. Reviewer asks the customer to confirm their procurement channel. The check creates friction: the customer must explain why a claimed research institution (the reanimated defunct entity) pays through Mercury rather than an institutional procurement system.

**Net assessment:** The check catches Bypass B (the stricter-provider path) effectively. It creates meaningful friction by forcing the attacker to explain fintech banking for a claimed institutional entity. However, the attacker can pass the manual review if they provide a plausible explanation ("we're a small startup using Mercury for business banking"), since many legitimate small biotechs do the same.

---

### 3. account-hijack

**Summary:** Attacker compromises a PI's email and takes over their account.

**Bypass methods relevant to this measure:**

- **Inherited payment methods.**
  - **Classification: MISSED.** Institutional billing. No fintech BIN.

- **Method 2 — Social-engineered address change.**
  - **Classification: MISSED.** The address change does not affect the payment method. The PI's institutional billing remains on file. This bypass engages m12-billing-shipping-consistency (address divergence), not this idea.

**Net assessment:** No signal. This branch uses inherited institutional billing throughout.

---

### 4. inbox-compromise

**Summary:** Attacker compromises inbox, pays with own personal card.

**Bypass methods relevant to this measure:**

- **Method 1 — Own real card (driving distance).**
  - **Classification: MISSED.** A personal card from a traditional bank. Fintech denylist does not fire.

- **Method 2 — Prepaid virtual card.**
  - **Classification: MISSED.** Prepaid virtual cards (Privacy.com, etc.) are an m10 concern. This denylist targets fintech *business banking* BINs, not prepaid card BINs.

- **Method 3 — Small-LLC business card.**
  - **Classification: CAUGHT.** If the small LLC uses a fintech business bank (Mercury, Relay, etc.), the BIN would be on the denylist. The `fintech_neobank_billing` flag fires if the customer claims institutional affiliation. However, the inbox-compromise branch's claimed affiliation is the compromised institution, and the LLC is the attacker's own entity — the name mismatch between the LLC bank and the claimed institution may trigger `fintech_billing_name_mismatch` as well.

**Net assessment:** The check catches Method 3 (small-LLC business card) but not Methods 1 or 2, which are the primary and secondary paths. Method 3 is a tertiary option. Marginal value.

---

### 5. credential-compromise

**Summary:** Attacker operates under a real institution's identity via compromised credentials.

**Bypass methods relevant to this measure:**

- **Invoiced order (dominant).**
  - **Classification: MISSED.** Invoice billing. No card BIN to check.

- **Credit card in the target's name (cloned/fraudulent).**
  - **Classification: MISSED.** A cloned card in the target's name would be from the target's traditional bank. Fintech denylist does not fire.

**Net assessment:** No signal. Both paths use traditional-bank instruments.

---

### 6. shell-company

**Summary:** Newly incorporated Delaware LLC with real business address and bank account.

**Bypass methods relevant to this measure:**

- **Satisfied by construction — LLC business bank account at Mercury/Brex/fintech.**
  - **Classification: CAUGHT.** The source file explicitly names Mercury, Relay, Bluevine as the likely banking paths. The implementation directly targets this: "neobanks are the standard LLC-bank-account rail for shell-company and CRO-framing branches." The `fintech_neobank_billing` flag fires. The check adds friction: reviewer asks why a claimed research entity uses fintech banking.

  However, the implementation's own `false_positive_qualitative` section notes the key limitation: "The attacker stories (shell-company, cro-framing, cro-identity-rotation) use the exact same banks that legitimate startups use. The check cannot distinguish a real 5-person biotech from a shell; it can only add friction."

**Net assessment:** The check fires and creates real friction. The attacker must pass manual review by providing a plausible explanation for fintech banking. Given that many legitimate small biotechs bank at Mercury/Brex, the reviewer faces a difficult signal-to-noise problem. The check adds cost and delay to the attacker but does not reliably block them.

---

### 7. shell-nonprofit

**Summary:** Shell research nonprofit with name-collision trick.

**Bypass methods relevant to this measure:**

- **Business bank account at a fintech.**
  - **Classification: CAUGHT.** Source file explicitly names "fintechs (Mercury, Relay, Brex)" as the likely path and notes "1–3 denials are expected before a successful opening." The fintech denylist fires. The reviewer asks why a research nonprofit uses Mercury rather than a traditional bank. A nonprofit with a name that collides with a legitimate institution has a built-in cover story, but the fintech-banking question adds a separate axis of scrutiny.

**Net assessment:** Same as shell-company. Friction, not reliable blocking.

---

### 8. cro-framing / cro-identity-rotation / biotech-incubator-tenant / community-bio-lab-network / gradual-legitimacy-accumulation

**Summary:** Five LLC-based branches, all using real fintech business bank accounts.

**Bypass methods relevant to this measure:**

- **All: LLC business bank account at Mercury/Brex/Relay/Bluevine.**
  - **Classification: CAUGHT (all five).** All five branches use the standard fintech-banking path that this denylist targets. The implementation's `attacker_stories_addressed (refined)` section explicitly lists all five as "directly targeted." The `fintech_neobank_billing` flag fires for each.

  The friction is real but surmountable: the attacker explains "we're a small CRO / biotech startup using Mercury for business banking" — an explanation that is indistinguishable from a legitimate small biotech's.

  The cro-identity-rotation branch is particularly interesting: if the same individual opens 4 LLC bank accounts at Mercury in succession, the fintech denylist fires 4 times. If the synthesis provider correlates across orders, the pattern of repeated fintech-flagged institutional orders from entities sharing a beneficial owner could be a stronger signal — but the implementation does not describe cross-order correlation.

**Net assessment:** Friction across all five branches. None are reliably blocked.

---

## bypass_methods_known

| Story | Bypass | Classification |
|---|---|---|
| dormant-account-takeover | A — inherited PO/P-card | MISSED |
| dormant-account-takeover | B — inherited invoice | MISSED |
| dormant-account-takeover | C — modified budget code | MISSED |
| dormant-account-takeover | D — substituted personal card | MISSED |
| dormant-domain | A — personal card | MISSED |
| dormant-domain | B — LLC + fintech bank | CAUGHT |
| account-hijack | inherited payment | MISSED |
| account-hijack | Method 2 — address change | MISSED |
| inbox-compromise | Method 1 — own card, driving distance | MISSED |
| inbox-compromise | Method 2 — prepaid virtual card | MISSED |
| inbox-compromise | Method 3 — small-LLC card | CAUGHT |
| credential-compromise | invoiced order | MISSED |
| credential-compromise | cloned card | MISSED |
| shell-company | LLC fintech bank account | CAUGHT |
| shell-nonprofit | fintech bank account | CAUGHT |
| cro-framing | LLC fintech bank account | CAUGHT |
| cro-identity-rotation | LLC fintech bank account | CAUGHT |
| biotech-incubator-tenant | LLC fintech bank account | CAUGHT |
| community-bio-lab-network | LLC fintech bank account | CAUGHT |
| gradual-legitimacy-accumulation | LLC fintech bank account | CAUGHT |

## bypass_methods_uncovered

- **Inherited institutional billing** (dormant-account-takeover A/B/C, account-hijack, credential-compromise invoiced): institutional payment methods do not trigger the fintech denylist.
- **Personal cards from traditional banks** (dormant-domain A, inbox-compromise Method 1, dormant-account-takeover D): non-fintech cards are invisible to this check.
- **Cloned/fraudulent cards in the target's name** (credential-compromise): these replicate the target's traditional-bank card.
- **Attacker passes manual review with a plausible explanation** (shell-company, shell-nonprofit, all LLC-cluster branches): the check fires, but the reviewer cannot distinguish a real small biotech from a shell. This is a signal-to-noise problem, not a detection gap — but it means the CAUGHT classification above comes with the caveat that "caught" means "flagged for review," not "reliably blocked."

## Findings

### Finding 1 — Moderate

**Source:** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, community-bio-lab-network, gradual-legitimacy-accumulation (7 branches).

**What the implementation catches but cannot resolve:** The fintech denylist fires on all 7 purpose-built-organization branches. But the manual-review playbook cannot distinguish these from legitimate small biotechs using the same banks. The implementation's own false-positive section acknowledges this: "The check cannot distinguish a real 5-person biotech from a shell; it can only add friction."

**Why this is Moderate, not Critical:** The check does create real friction (manual review, explanation required, delay). It does not promise to block — it promises to flag. The implementation is honest about the limitation. The signal becomes more useful when combined with other measures (m09 institution-legitimacy, m18 accreditation) that assess whether the institution is a real research entity. As a standalone signal, it is weak; as part of a composite scoring system, it contributes.

**Suggestion:** The stage 7 synthesis should explicitly frame this as a "friction + composite signal" control, not a standalone block. The manual-review playbook could be strengthened by requiring the reviewer to check m09/m18 institution-legitimacy outputs before clearing a fintech-billing flag — the implementation mentions this in passing ("checks whether the company name on the fintech account matches the customer's claimed institution name") but does not mandate consulting other measure outputs.

### Finding 2 — Moderate

**Source:** cro-identity-rotation (cross-order correlation gap).

**What the implementation misses:** When the same individual opens multiple LLC bank accounts at Mercury and places orders from each, the fintech denylist fires on each order independently. But the implementation does not describe cross-order or cross-entity correlation — i.e., detecting that the same beneficial owner appears behind multiple fintech-flagged entities. The cro-identity-rotation source file flags "a single individual opening 4 LLC bank accounts in short succession" as an AML pattern, but the synthesis provider's fintech denylist as implemented processes each order in isolation.

**Why:** The implementation is scoped to per-order BIN matching. Cross-entity linkage is a different control (closer to m08 internal-denylist or a graph-analysis idea).

**Suggestion:** Note in stage 7 that cross-entity correlation on the fintech-flag signal is a complementary control not covered by this idea. If the beneficial-owner name (from the BIN lookup's issuer metadata) or the institution-contact identity is repeated across multiple fintech-flagged orders, that is a stronger signal than any single flag.

### Finding 3 — Minor

**Source:** dormant-account-takeover, account-hijack, credential-compromise, inbox-compromise (Methods 1–2).

**What the implementation misses:** These branches use traditional-bank instruments (inherited institutional billing, personal credit cards from traditional banks, cloned cards). The fintech denylist is structurally irrelevant to them. This is not a gap in the implementation — it is a scope boundary. These branches are addressed by sibling m12-billing-shipping-consistency (address consistency) and m10 ideas (prepaid/funding-type checks).

**Severity rationale:** Minor. Not a flaw; the idea is correctly scoped to fintech-banking patterns. Documenting this ensures stage 7/8 synthesis does not over-claim coverage.

### Finding 4 — Minor

**Source:** dormant-domain Bypass B (LLC + Mercury bank account).

**What the implementation catches:** The fintech denylist fires on the Mercury BIN. The reviewer asks why a claimed research institution uses Mercury. The attacker must provide a plausible explanation for a reanimated defunct entity banking at Mercury — this is arguably harder to explain than for a fresh startup, since the institution should have pre-existing banking relationships. The check may be slightly more effective here than against fresh LLC branches.

**Severity rationale:** Minor (positive note). The implementation's effectiveness varies by attacker profile; the dormant-domain case is one where the friction may be disproportionately useful.

## Verdict

**PASS** — no Critical findings. Two Moderate findings identify signal-to-noise limitations and a cross-entity correlation gap, both of which the implementation is already partially aware of. Two Minor findings document scope boundaries. Pipeline continues to stage 6.
