# Coverage research: Internal institution denylist

## Coverage gaps

### Gap 1: Cold-start problem — new providers or providers with thin denial history
- **Category:** DNA synthesis providers who are new to the market or have historically processed few denial-for-cause events, resulting in an internal denylist with few or zero entries.
- **Estimated size:** The market has 65+ DNA synthesis companies, of which ~50% are small and recently established ([source](https://www.rootsanalysis.com/reports/dna-synthesis-market.html)). [best guess: perhaps 30-40 of the 65+ providers have <5 denial-for-cause events in their history, meaning their internal denylists are effectively empty. Only the top 10-15 providers by volume would have encountered enough malicious or problematic customers to build a meaningful denylist.]
- **Behavior of the check on this category:** no-signal (empty or near-empty denylist catches nothing)
- **Reasoning:** An internal denylist is only as useful as the historical events that populate it. A new provider or one that has never denied a customer has no denylist to check against.

### Gap 2: First-time bad actors not previously encountered by any provider
- **Category:** Adversaries who are ordering from the provider for the first time and have never been denied by that specific provider before. This includes novel shell companies, newly created entities, and state-sponsored programs using fresh front organizations.
- **Estimated size:** [best guess: for any individual provider, the vast majority of malicious attempts are likely from entities not previously encountered — the denylist catches only repeat offenders. Without cross-provider sharing (see Gap 3), each provider's denylist is an island.]
- **Behavior of the check on this category:** no-signal (entity not in the denylist)
- **Reasoning:** The internal denylist is purely retrospective; it catches only entities that have previously been identified and listed. It has zero predictive power for new threats.

### Gap 3: Cross-provider sharing blocked by antitrust uncertainty
- **Category:** Entities denied by Provider A but unknown to Provider B. Without a shared denylist across providers, each provider's coverage is limited to its own historical encounters.
- **Estimated size:** With 65+ providers in the market, an entity denied by one provider can simply order from another. The top 3 providers hold ~53% market share ([source](https://www.gminsights.com/industry-analysis/gene-synthesis-market)); the remaining ~47% is distributed across dozens of providers. [best guess: an attacker denied by one large provider has 60+ alternative providers to try, and the probability of the next provider's denylist containing the same entity (absent sharing) is very low.]
- **Behavior of the check on this category:** no-signal at the second provider
- **Reasoning:** The DOJ withdrew the historical antitrust safe harbor for competitor information sharing in February 2023 ([source](https://www.afslaw.com/perspectives/alerts/doj-antitrust-division-announces-withdrawal-information-sharing-safety-zone)). Without the safe harbor, cross-provider sharing of customer denylists requires careful legal structuring (independent third-party administrator, narrow scope, procompetitive justification). The IGSC Harmonized Screening Protocol does not publicly document a shared customer denylist ([source](https://genesynthesisconsortium.org/)). [unknown — searched for: "IGSC shared customer denylist", "gene synthesis consortium shared blacklist" — no public documentation of such a mechanism exists.]

### Gap 4: Identifier drift and entity reconstitution
- **Category:** Previously denylisted entities that reappear under a new name, new address, new domain, new payment instrument, or new beneficial-owner structure — defeating the denylist's identifier-matching logic.
- **Estimated size:** [best guess: among entities that are deliberately trying to evade screening (as opposed to legitimately restructured organizations), identifier rotation is the expected behavior. The denylist's effectiveness against intentional evasion depends entirely on the breadth of identifiers stored and the quality of fuzzy matching. An entity that changes its name + address + domain + payment instrument would evade all but beneficial-owner matching, which requires BO data collection — a separate check.]
- **Behavior of the check on this category:** no-signal (reconstituted entity matches no stored identifiers)
- **Reasoning:** This is the fundamental adversarial limitation of any denylist: it assumes stable identifiers, but sophisticated adversaries change them.

### Gap 5: Legitimate successor organizations incorrectly denied
- **Category:** Institutions that share a name, address, or registry ID with a denylisted entity because they are a successor organization (post-merger, post-divestiture, post-reorganization) where the underlying problem has been remedied.
- **Estimated size:** [best guess: a small number of cases per year for a typical provider, but the stakes are high — incorrectly denying a legitimate successor can create legal liability and customer-relationship damage. The appeals process described in the implementation mitigates this but at a cost of analyst time.]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** Denylists are sticky — once an identifier is listed, the burden shifts to the customer to prove they are not the listed entity. Successor organizations bear this burden unfairly.

### Gap 6: GDPR right-to-erasure conflicts
- **Category:** EU-based institutions or individuals on the denylist who invoke GDPR Article 17 (right to erasure). If the provider is required to delete the denylist record, the entity can re-engage as a customer.
- **Estimated size:** [best guess: a small but legally significant edge case. GDPR's Article 17(3)(e) exempts data processing necessary for the establishment, exercise, or defense of legal claims — a denylist maintained for compliance/safety purposes may qualify for this exemption, but the legal position is untested in the biosecurity context. Legal review required.]
- **Behavior of the check on this category:** potential loss of previously accumulated signal
- **Reasoning:** GDPR creates a tension between data retention for safety screening and individual privacy rights. Until tested in court or addressed by regulatory guidance, this remains an unresolved risk.

## Refined false-positive qualitative

**True false positives (legitimate customers incorrectly blocked):**
1. Successor organizations to denylisted entities (Gap 5)
2. Name collisions with denylisted entities (especially for common institutional names)
3. Payment-instrument-hash collisions (BIN matching can be over-broad)

**False negatives (bad actors that pass):**
1. First-time offenders not in any provider's denylist (Gap 2 — the dominant gap)
2. Entities denied by other providers but not shared (Gap 3)
3. Reconstituted entities with rotated identifiers (Gap 4)
4. GDPR-erased entities (Gap 6)

## Notes for stage 7 synthesis

- The internal denylist is a **necessary but low-coverage** check: it catches only known repeat offenders at the same provider. Its primary value is **deterrence** (customers know they will be permanently banned if caught) and **audit compliance** (demonstrating a documented denied-parties process).
- The **cross-provider sharing question** (Gap 3) is the single most impactful coverage improvement, but it is blocked by legal uncertainty. The DOJ's 2023 safe-harbor withdrawal makes this harder, not easier. Any cross-provider sharing mechanism would need to be structured through an independent third party (IGSC or IBBIS) with antitrust counsel review.
- The check is **complementary to CSL screening** (m08-bis-entity-csl): CSL catches government-designated entities; the internal denylist catches entities that triggered provider-specific compliance events (false affiliation, payment fraud, sequence-screening flags).
- The cold-start problem (Gap 1) means this check is more valuable for established providers with long operating histories.
