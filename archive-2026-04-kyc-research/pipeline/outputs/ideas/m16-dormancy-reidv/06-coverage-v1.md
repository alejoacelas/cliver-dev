# Coverage research: Dormancy re-IDV trigger

## Coverage gaps

### Gap 1: Sabbatical / parental leave returnees (legitimate dormancy)
- **Category:** Faculty and senior researchers who take 6-12 month leaves (sabbatical, parental leave, medical leave) and return to active ordering. They are legitimate customers whose accounts cross the 180-day threshold.
- **Estimated size:** [best guess: 3-7% of academic customers per year. US faculty sabbatical rates are roughly 1-in-7 years for tenured faculty; parental leave varies. For a customer base that is ~25% academic (per Twist Bioscience's ~18-25% academic/government segment ([Twist JPM25 presentation](https://albertvilella.substack.com/p/jpm25-twist-bio-twst))), 3-7% of the total base might trigger dormancy re-IDV annually.]
- **Behavior of the check on this category:** false-positive (re-IDV required; friction is bounded at ~3 minutes for selfie + document capture, but the experience is jarring for a returning legitimate customer).
- **Reasoning:** The implementation explicitly identifies this: "Faculty taking 6-12 month leaves are exactly the population the threshold catches." The design decision is that the friction is acceptable because the dormant-account-takeover attack specifically targets this population.

### Gap 2: Seasonal / teaching-only labs
- **Category:** Teaching labs that only order synthesis during specific semesters (e.g., September and January for US academic calendars). An 8+ month gap between May and January orders crosses the 180-day threshold.
- **Estimated size:** [best guess: 2-5% of academic customer accounts. Teaching labs are a small fraction of synthesis customers (most volume is from research labs). Searched for: "teaching laboratory DNA synthesis orders volume percentage", "seasonal gene synthesis ordering pattern" -- no data found.]
- **Behavior of the check on this category:** false-positive (re-IDV fires every academic year for these accounts). Unlike Gap 1, this is recurring, not one-time.
- **Reasoning:** The recurring nature of this false positive is more burdensome than Gap 1. The mitigation would be to extend the threshold to 9-12 months, but that widens the window for the dormant-account-takeover attack.

### Gap 3: Users whose appearance has changed substantially
- **Category:** Returning customers whose physical appearance has changed significantly since onboarding (aging over several years, weight changes, gender transition, facial surgery, injury). The selfie-match score drops below the IDV vendor's threshold even though it's the same person.
- **Estimated size:** Research shows 99% of face images can be recognized up to 6 years later, but accuracy degrades with larger time gaps, especially for users under 30 or over 50 ([Michigan State University via ScienceDaily](https://www.sciencedaily.com/releases/2017/03/170302115818.htm)). NIST studies show accuracy drops for 5+ year gaps. [best guess: 1-3% of dormancy re-IDV events will fail selfie matching due to appearance change, assuming a median 1-3 year gap between original onboarding and re-IDV. For accounts dormant 5+ years, the failure rate could be 5-10%.]
- **Behavior of the check on this category:** false-positive (`dormancy_reidv_selfie_mismatch` fires; human reviewer compares selfies manually).
- **Reasoning:** The implementation acknowledges this and routes it to human review. The cost is reviewer time, not customer denial. But the reviewer comparison is subjective and error-prone for large appearance changes.

### Gap 4: Active accounts compromised by attackers (not dormant)
- **Category:** Customer accounts that are actively used but have been compromised (e.g., credential stuffing, session hijacking, phishing). The dormancy timer never fires because the attacker keeps the account "active" by logging in.
- **Estimated size:** This is a structural no-signal gap. The check is designed exclusively for dormant accounts. Active-account compromise is addressed by other M16 ideas (m16-auth0-okta step-up, m16-webauthn-yubikey, m16-order-time-stepup). [best guess: the fraction of synthesis-provider account compromises that occur on active (non-dormant) accounts is unknown, but credential-stuffing and phishing attacks typically target active accounts with valid credentials.]
- **Behavior of the check on this category:** no-signal (the dormancy timer never triggers; the re-IDV check is never invoked).
- **Reasoning:** The implementation explicitly scopes this: "not addressed for active accounts." This is a design boundary, not a bug.

### Gap 5: Legitimate account transfers within a lab
- **Category:** Accounts that are legitimately transferred from a departing researcher to a successor within the same lab (e.g., a postdoc leaves and the PI gives the account credentials to the new postdoc). This is exactly the behavior the check is designed to block, but some providers may view it as legitimate institutional practice.
- **Estimated size:** [best guess: 1-3% of academic accounts experience informal transfers. Searched for: "lab account transfer researcher departure frequency", "shared lab account practices" -- no data found. Academic labs commonly share institutional accounts for equipment and services.]
- **Behavior of the check on this category:** true-positive (the check correctly identifies a different human; the re-IDV selfie mismatch fires). But the provider may not want to block this if they consider it a legitimate institutional practice.
- **Reasoning:** The implementation notes this: "Account legitimately transferred between researchers in the same lab without re-onboarding -- this is exactly the case the check is designed to BLOCK." The coverage gap is that blocking this behavior creates institutional friction and may drive customers to avoid the formal re-onboarding process.

## Refined false-positive qualitative

1. **Sabbatical/leave returnees** (Gap 1): highest-volume legitimate dormancy trigger. Bounded friction (~3 minutes). 3-7% of academic customers annually.
2. **Seasonal teaching labs** (Gap 2): recurring annual friction. Smaller volume but more annoying per affected customer.
3. **Appearance-change selfie mismatches** (Gap 3): 1-3% of re-IDV events route to manual review. Reviewer comparison is subjective.
4. **Informal account transfers** (Gap 5): the check works as designed (blocks the different human), but the provider may receive pushback from labs that view account sharing as normal.

## Notes for stage 7 synthesis

- This check is narrowly targeted at the dormant-account-takeover branch. Its coverage gaps for active-account attacks (Gap 4) are by design and are covered by other M16 ideas.
- The false-positive rate is dominated by legitimate dormancy (Gaps 1-2). The friction is bounded and predictable. The 180-day threshold is a tuning parameter: shorter catches more takeovers but more false-positives; longer misses some takeovers but fewer false-positives.
- The selfie-aging problem (Gap 3) argues for periodic re-IDV even for active accounts (on a 2-3 year cycle) to keep the stored selfie fresh. This is separate from the dormancy trigger but would reduce the appearance-change failure rate.
- The check pairs well with m16-no-sms-no-email-reset (which closes the email-channel MFA recovery bypass that the dormant-account-takeover branch relies on) and m16-auth0-okta (which provides the step-up delivery mechanism).
