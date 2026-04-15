# Coverage research: Federated IAL2 via Login.gov / ID.me

## Coverage gaps

### Gap 1: International researchers (non-US/UK) — zero coverage
- **Category:** Any legitimate DNA synthesis customer who is not a US person (for Login.gov / ID.me) or UK person (for GOV.UK One Login). This includes academic researchers at non-US institutions, commercial biotech companies headquartered outside the US, and CROs operating internationally.
- **Estimated size:** The DNA synthesis market is global. While the US is the largest single-country market, non-US customers represent a substantial share. The Nature Index shows that of the top 25 institutions in biological sciences, roughly half are outside the US [source](https://www.nature.com/nature-index/research-leaders/2025/institution/all/biological-sciences/global). Gene synthesis market reports indicate academic/research institutions hold ~54% of the market [source](https://www.imarcgroup.com/gene-synthesis-market), and US institutions are a subset of that. [best guess: 40–60% of DNA synthesis customers globally are non-US. Reasoning: US dominates but China, EU, Japan, South Korea, India, and others are significant synthesis consumers; the exact split depends on which provider — a US-based provider like Twist or IDT may have 50–70% US customers, while a global provider may have fewer.]
- **Behavior of the check on this category:** no-signal — neither Login.gov nor ID.me will verify non-US identities. Complete structural exclusion.
- **Reasoning:** This is the dominant coverage gap. A check that excludes 40–60% of the customer base cannot serve as the sole M14 implementation. It can only function as one path in a multi-path verification strategy (federated for US customers, vendor IDV for international).

### Gap 2: US researchers who lack a Login.gov or ID.me account
- **Category:** US-based legitimate synthesis customers who have never created a Login.gov or ID.me account and must do so from scratch to complete the M14 check. This includes researchers who have not previously interacted with federal services that gate on Login.gov (IRS, SSA, VA, SBA, USAJOBS) and who have not used ID.me for state unemployment, VA benefits, or commercial discounts.
- **Estimated size:** Login.gov has ~100–180 million user accounts [source](https://www.login.gov/). ID.me reports 70+ million verified users and 152 million total users (~60% of US adults) [source](https://network.id.me/press-releases/over-70-million-americans-keep-themselves-safe-by-verifying-their-identity-through-id-me-as-ai-fraud-accelerates/). US adult population is ~260 million. Many researchers may have one or both accounts, but not all. [best guess: 20–40% of US synthesis customers would need to create a new federated account. Reasoning: academic researchers skew toward the demographic that uses federal services (grants, taxes) and may already have Login.gov; but many younger researchers, postdocs, and industry scientists may not.]
- **Behavior of the check on this category:** friction (not no-signal — they can create an account, but the IAL2 enrollment process at the IDP takes 10–30 minutes and may itself fail)
- **Reasoning:** Not a hard exclusion but a significant friction barrier that will suppress completion rates, especially for time-pressed researchers placing routine orders.

### Gap 3: Login.gov structural unavailability to private-sector synthesis providers
- **Category:** Login.gov is operated by GSA and scoped to federal/state/local government use cases. A private-sector DNA synthesis company (Twist Bioscience, IDT, GenScript, etc.) is almost certainly ineligible to integrate as a Login.gov relying party without a federal partner agency or GSA policy exception.
- **Estimated size:** This is a binary structural gap — it affects all customers if Login.gov cannot be integrated. [best guess: Login.gov is structurally unavailable to private-sector DNA synthesis providers. Reasoning: the 04-implementation-v1.md itself flags this: "Login.gov is currently scoped to federal/state/local government use cases. A private-sector DNA synthesis company would not normally be eligible."]
- **Behavior of the check on this category:** no-signal for the Login.gov path; reduces the federated option to ID.me only
- **Reasoning:** This collapses the "federated" option to a single vendor (ID.me), removing the redundancy benefit. GOV.UK One Login is similarly out of scope for a US private-sector provider.

### Gap 4: Privacy-conscious researchers who refuse ID.me enrollment
- **Category:** US-based researchers who are unwilling to create an ID.me account due to privacy concerns, particularly in light of the FTC consent action against ID.me (2024) over deceptive claims about facial recognition being optional. Some researchers — especially in privacy-sensitive fields or those with political objections to commercial biometric databases — will refuse.
- **Estimated size:** [best guess: 5–15% of US synthesis customers who would otherwise be eligible for ID.me. Reasoning: the FTC action generated significant press coverage; academic researchers tend to be more privacy-aware than the general population; refusal rates for biometric enrollment in non-mandatory contexts are typically 5–20% per industry surveys.] [unknown — searched for: "ID.me refusal rate users decline enrollment percentage", "biometric enrollment refusal rate voluntary", "ID.me FTC consent action user trust impact"]
- **Behavior of the check on this category:** no-signal (customer refuses to initiate the flow)
- **Reasoning:** This is a soft exclusion — the customer could complete it but won't. The synthesis provider must offer a vendor-IDV fallback (Jumio/Onfido/Persona) for these customers.

### Gap 5: Black-box verification — synthesis provider cannot adjudicate edge cases
- **Category:** All customers who go through the federated flow. The synthesis provider sees only the boolean outcome (verified/not verified) and verified claims — not the underlying document images, selfie, or rejection reason. When the IDP rejects a legitimate customer, the synthesis provider cannot investigate or override.
- **Estimated size:** Affects 100% of federated-flow customers when edge cases arise. The practical impact depends on the IDP's false-rejection rate. [best guess: ID.me's IAL2 pass rate for first-attempt verifications is ~85–90% per industry norms; the remaining 10–15% require retry, trusted-referee video chat, or manual intervention at the IDP, not the synthesis provider.] [unknown — searched for: "ID.me first attempt pass rate IAL2", "identity verification first attempt success rate"]
- **Behavior of the check on this category:** structural limitation — false positives cannot be diagnosed or overridden by the synthesis provider
- **Reasoning:** This is qualitatively different from vendor IDV (Jumio/Onfido/Persona) where the synthesis provider has a dashboard to review captured documents. Federated IDV trades control for simplicity.

## Refined false-positive qualitative

Updated from 04-implementation-v1:

1. **International researchers** (Gap 1) — 40–60% of global customers have zero coverage. Not a false positive — a hard exclusion. This is the critical gap.
2. **Login.gov unavailability** (Gap 3) — structural; collapses to ID.me only.
3. **Friction for new US accounts** (Gap 2) — 20–40% of US customers face enrollment friction.
4. **Privacy refusals** (Gap 4) — 5–15% of eligible US customers may refuse.
5. **Black-box adjudication** (Gap 5) — 10–15% of IDP-rejected customers cannot be investigated by the synthesis provider.
6. **Expired ID / name change** (from 04-implementation) — IDP-side issue; synthesis provider cannot intervene.

## Notes for stage 7 synthesis

- This idea has the worst coverage profile of the M14 options. The ~40–60% international exclusion is disqualifying as a standalone check. It can only function as one path in a multi-path strategy.
- Login.gov is almost certainly structurally unavailable to private-sector synthesis providers, reducing this to "ID.me only."
- ID.me's 70M+ verified users provide decent US coverage, but the FTC consent action creates reputational and legal review overhead.
- The black-box nature means the synthesis provider cannot build institutional expertise in document fraud detection — they are entirely dependent on the IDP's accuracy.
- Recommend pairing with a vendor IDV (Jumio/Onfido/Persona) as the primary path, with federated (ID.me) as an optional convenience path for US customers who already have an account.
