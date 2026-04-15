> ⚠️ **REFERENCE ONLY — FROM A DIFFERENT PROJECT**
>
> This document is the design note for the sibling `wg/` project (KYC bypass matrix). It is NOT the spec for this pipeline. It is copied here because several of its design principles — adversarial collaboration, modular per-item loops, traceability conventions, the four attacker profiles, the bypass-method narrative format — are valuable references when designing or executing stages of THIS pipeline.
>
> The measures, matrices, and stage layout described below are specific to the wg project. The measures for this pipeline live in `measures.md`. The stage layout for this pipeline lives in `run.md`.
>
> Read this document for *principles*, not for *instructions*.

---

# KYC bypass research: attacker stories through mandatory measures

## Motivation

For a given set of KYC steps, we want to figure out how much Bayesian evidence each one gives us about whether a customer is a malicious actor. The problem is highly multi-dimensional: how much evidence each step provides depends on which other steps are in the chain, what kind of attackers we worry about, and what strategies those attackers are likely to try. Left unspecified, these free parameters make the analysis intractable — we'd have to check every combination of attacker story against every combination of KYC measures.

The final result should still be comprehensive: it should cover most of the ground of possible attacker stories and give information about all of the KYC measures that have been put on the table. To be comprehensive without being intractable, we need to reduce the exponential complexity. We also need to reduce it further to present results to our audience — informed policymakers drafting minimal standards for customer screening — in a legible framework. That's the central challenge: estimate the Bayesian signal each measure provides while tying down the complexity enough that we can work through the problem and present final results that are accessible to our audience.

The concrete way we instantiate "how much evidence does each measure give" is through a game-theoretic framework: what does it cost an attacker to produce the signal a given measure checks for? This document focuses on the attacker side. The full analysis would eventually also include what it costs a non-attacker — we have a proxy for that in the false-negative rate (what fraction of legitimate customers fail the measure), and separate analysis is underway on the cost to legitimate customers more broadly.

### Filtering principles

Tying things down takes filtering and structure. A few filtering principles have been helpful:

- **Operational reality.** When deciding what implementation paths are possible for a given measure, there's what a standard says (which presents lots of options) and there's what we can anticipate as more likely to actually happen in practice. For identity verification, the great majority of nucleic acid providers will delegate to a standard commercial IDV provider. So the question becomes: how do standard IDV providers implement identity verification? That reduces the space of implementation paths we need to consider. The same principle applies on the attacker side: we should focus on the attacks that are most likely to actually happen, not on the full range of what's theoretically possible. Most attacker-target combinations are irrelevant — a rational attacker won't target the highest-security institution unless they really need to for some reason. Furthermore, we can operationalize "most likely" through proxies that are straightforward to evaluate: how many people could attempt this attack, how large is the viable attack surface, and how many sequential steps need to go right, and get to interest conclusions without touching on areas where it's harder to specify what good reasoning looks like (e.g., understanding the most likely motivations of attackers).

- **Defender-side equivalence.** There are many possible attacker profiles with different skills and resources, but if they look similar from the defender's perspective — if they bypass or trigger the same set of defenses — we can group them together or pick one as representative. That's what I've tried to do in constructing the four attacker profiles: they are, after reflection, the ones that are significantly different in which KYC measures are binding for them. As with many design decisions here, I'm open to revisions when they seem like a promising path for improving the analysis.

- **Attacker optimization.** If an attacker has two ways to bypass a KYC measure, they'll choose whichever is cheapest. This lets us discard dominated options: if there's something strictly better, cheaper, and simpler, the dominated path can be dropped. Even options that are not strictly dominated can be given less priority in cases where we understand they're less likely or informative to examine. 

### Correctness

Getting to substantially correct conclusions matters greatly for this report. A few principles help:

1. **Traceability.** Every claim in the final output should be traceable back to its origin. Empirical claims should have sources. Claims that carry more weight in the analysis should get more attention, such as dedicated pipeline stages to generate and verify them.

2. **Modularity.** Doing the same structured task many times (one analysis per profile × measure) allows sub-agents to spend more time on a narrow slice of the problem. It also makes verification easier: if parallel sub-agents are doing the same task, I can sample some of their outputs, evaluate correctness, and use those learnings to improve the whole stage.

3. **Adversarial collaboration.** Two sub-agents with different contexts and starting points, where one critiques or reviews the output of the other, tends to produce better results than a single sub-agent producing and self-reviewing. This is the same principle as external peer review.

## The idea

We trace **end-to-end attacker stories** through the full set of KYC steps, estimating the cost of bypassing each measure for each attacker profile given that all other measures are simultaneously in place. The sections below show some of the design choices made in the analysis, though they may be revised as we work through them.

### Four attacker profiles

I chose each profile after listing several candidates and grouping together those that had a similar pattern of which KYC tripwires they activated in practice. 

1. **Impersonate employee** — The attacker assumes the identity of a real person at a legitimate institution (university, biotech company, etc.) that would plausibly order SOC. They must defeat identity verification, affiliation checks, and potentially MFA, since they're pretending to be someone they're not.

2. **Fake affiliation** — The attacker uses their own identity (or an easily-obtained one) but fabricates the external evidence of being connected to a legitimate institution. The identity itself may be real; what's faked is the institutional tie that grants legitimacy to order SOC.

3. **Exploit affiliation** — The attacker is already affiliated with a legitimate institution but isn't in a role that should involve ordering dangerous sequences. Think: IT staff, administrative personnel, a researcher in an unrelated department. They leverage their existing legitimate access to get through most screening without needing sophisticated bypass techniques.

4. **Purpose-built organization** — The attacker creates an organization that exists solely to place SOC orders. They control the org's infrastructure (domain, email, registered contacts, shipping address) but must build the appearance of legitimacy from scratch. Unlike fake-affiliation attackers — who piggyback on a real institution's reputation while trying to forge the link to it — this attacker controls everything but starts with nothing. This profile is a stress test of the legitimacy verification controls: which checks can distinguish a purpose-built front from a real organization?

### Target selection

To make attacks and their interactions with defenses more specific, it seemed helpful to understand which targets are attackers most likely to choose. My current guess is that there's wide differences between the ease at which different targets may be identified and penetrated, so we can narrow down our analysis to those targets that seemed most likely to be chosen (because they're cheaper to act on, require less expertise, or have weaker institutional defenses). Some possibly interesting questions to look at here are:

- How much target-selection freedom does this profile have? Ranges from "none — attacker is already situated" (exploit-affiliation) to "full — attacker can choose any provider/org" (fake-affiliation, purpose-built org).
- How can the attacker identify possible targets (along with their susceptibility)?
- What does the likely selected target look like? This becomes the assumption the rest of the analysis is grounded in.

This is also helpful to understand non-KYC barriers to atttackers, such as the target organization's own defenses (IT security, accounting controls, HR processes, physical mail handling). These aren't KYC measures and they're outside the provider's control, but they're real barriers that an operationally grounded analysis needs to account for.

### Proxies for identifying likely attacks

Another way to reduce the scope of the analysis is to find ways to proxy for how likely different attacks might be. Three proxies that seemed reasonably straightforward to evaluate and verify were:

1. **Broad availability** — How large is the potential attacker pool? Anyone in a high-income country with some money? Only people with specific institutional placement? Only people with specialized technical skills?

2. **Attack surface size** — How many viable targets or paths exist? For  profiles that target institutions: what are the most common org types, and what's the typical security posture there? For profiles that target providers: which provider verification processes are weakest?

3. **Operational chain length** — How many sequential steps must all succeed for the attack to go through? A 5-step chain where each step can fail independently is practically less likely to succeed than a 2-step chain, even at the same per-step cost. This captures the gap between "theoretically cheap" and "practically likely to succeed."

### Persistent supply chain variant

From an utilitarian perspective, we care not only about likelihood of an event but also its magnitude. The most devastating attacks often share that they require a persistent reliable supply of nucleic acids (e.g, to experiment for higher transmission or lethality), rather than a one-time order, so we can include in our analysis that scenario even in cases when it doesn't seem as likely to go through (because it still weighs heavily on the utilitarian calculus)

I haven't explored yet whether for this cases alternative supply routes (e.g., benchtop synthesis) dominate, but we can use a working assumption that they don't and revisit later if needed.

### The mandatory measures (baseline)

Our starting point for measures is the [CSSWG meeting notes](context/csswg-doc/), as information about their effectiveness is most likely to inform eventual regulations. Within those, the ones I think give most signal are:

- **FAIR and STRONG evidence of identity** (per [NIST 800-63A](context/nist-800-63a-reference.md))
- **Institutional affiliation check**
- **Multi-factor authentication**

In addition, there are two measures that are not currently widespread (and so were not included in the starting discussion), but that may be promising for providing decorrelated signal with the others:

- **Organization registry with verified shipping addresses**
- **Vouching by a registered contact**

The document [`measures-in-practice.md`](measures-in-practice.md) is where we'll give detail for how we suspect each measure would be implemented in practice for nucleic acid customers across the world.

### Mandatory vs. additional measures

The measures are split into "mandatory" and "additional" not because of their likely role in a standard, but because it's my current best guess that the mandatory measures often provide more signal, mostly through having a lower false negative rate than the 'optional' measures (though this assumption can be overturned by the results of the analysis). Mandatory measures are ones we expect providers to require for every order (or every SOC order) — failing them blocks the order. Additional measures provide signal but may not be strictly enforced, often because the false-negative rate among legitimate customers is too high.

Whether a measure *can* be mandatory depends on its false-negative rate: if many legitimate customers fail it, strict enforcement creates too much friction. The false-negative rate is estimated in each cell, so the matrix itself provides evidence for whether the mandatory/additional categorization is right — a "mandatory" measure with a surprisingly high false-negative rate is a finding worth surfacing.

## Bypass matrix design

### Overview

We produce **two matrices** because we don't know how good sequence screening will be, and we don't want to take a position on it. The comparison is informative regardless of where screening quality ends up:

- **Matrix A: All orders.** Only the measures that apply to every order (IAL1 identity verification, institutional affiliation check, org registry + verified shipping address). This represents what an attacker faces if sequence screening fails or the sequences they want aren't flagged — the baseline defense when screening provides no protection.

- **Matrix B: SOC orders.** The full set of mandatory measures (everything in Matrix A plus IAL2 identity verification, MFA, step-up re-authentication, and vouching by registered contact). This represents the full gauntlet for orders that trigger SOC screening.

The two matrices use identical columns, rows, and cell structure. The difference is which mandatory measures are in play. Comparing them answers: **how exposed are we if screening fails?**

### Columns: attacker profiles and branches

The four base profiles are impersonate employee, fake affiliation, exploit affiliation, and purpose-built organization. Each profile may have multiple branches — distinct attack paths that trigger different sets of binding measures (see "Handling multiple attack paths" below). Each branch is a column in the matrix, with a defined attacker description, target description, and whether the scenario is one-off or persistent supply chain.

### Rows: measures

All rows use the same cell structure.

**Mandatory measures** (in canonical verification order):

| # | Measure | Applies to |
|---|---|---|
| 1 | Identity verification — IAL1 | All orders |
| 2 | Identity verification — IAL2 | SOC orders |
| 3 | Institutional affiliation check | All orders |
| 4 | MFA | SOC orders |
| 5 | Organization registry + verified shipping address | All orders |
| 6 | Step-up re-authentication | SOC orders |
| 7 | Vouching by registered contact | SOC orders |

Matrix A includes rows 1, 3, 5. Matrix B includes all seven rows.

**Additional measures:**

| # | Measure |
|---|---|
| 8 | Session management controls |
| 9 | Payment method consistency |
| 10 | No identity-obfuscating payment |
| 11 | Denied parties screening |
| 12 | IP/VPN/Tor detection |
| 13 | Research background / publication history |
| 14 | Domain and corporate registry checks |
| 15 | Biosafety documentation |
| 16 | Grant/funding record checks |
| 17 | Anomaly detection on order patterns |
| 18 | SOC self-declaration |
| 19 | Legitimacy verification |

Additional measures appear in both matrices. Their assessments may differ between Matrix A and B because the attacker's commitments from mandatory measures differ.

For implementation details, baseline assumptions, and uncertainty branches for every measure, see [`measures-in-practice.md`](measures-in-practice.md).

### Handling multiple attack paths per profile

The ideation process generates many candidate attack paths per profile. These are consolidated using attacker optimization (drop dominated paths) and defender-side equivalence (merge paths that look the same from the defender's perspective):

1. **Strict dominance → drop.** If path A needs fewer resources, less expertise, and triggers the same or fewer defenses as path B on every dimension, drop B.
2. **Same defense profile → merge.** If two paths trigger the same binding measures *and* have similar attacker exposure profiles, keep the most likely variant as the main scenario and list the others as a "similar scenarios" note.
3. **Different defense profile → branch.** If two paths trigger different binding measures, or trigger the same binding measures but differ substantially in attacker exposure (e.g., one commits the attacker's own biometrics while the other uses intermediaries throughout), they need separate analysis. The defender cares not just about what they can block but also about what they can trace.

All drop and merge decisions must be stated explicitly so adversarial review stages can challenge them.

### Cell content (uniform across all rows)

Each cell is grounded in the branch's specific attacker and target. The analysis assumes all other mandatory measures are in place simultaneously. The cell estimates the bypass *given that the attacker must also satisfy every other mandatory measure*. For example, the affiliation-check cell for an impersonate-employee branch assumes the attacker has already committed to a specific forged identity at the identity-verification step, and asks: given that commitment and this specific target type, what does it take to also pass the affiliation check?

Each cell contains:

**Binding?** — Does the attacker need to actively defeat this measure? Y/N with one-line reason. If N, note why the profile already satisfies it and move on.

**False-negative rate** — What fraction of legitimate customers fail this measure or naturally lack the signal it checks for? This determines how strictly the measure can be enforced in practice and how much weight a provider can place on its absence.

**Bypass options** — One or more methods for producing the signal this measure checks for. Each method should enumerate the concrete operational steps involved — not hide complexity behind a label. "Phish the target's credentials" is a label for a multi-step chain (identify target person, research their email patterns, craft pretext, bypass org's email security, get click, exfiltrate credential before session expires); the analysis should make the chain visible so operational difficulty and institutional defenses at each step can be assessed. Each method includes:

| Field | What it contains |
|---|---|
| **Method** | Concise description of the bypass, named to match entries in the companion bypass-methods document |
| **Expertise** | [STIX v1.2 sophistication level](context/stix-threat-actor-reference.md) (Aspirant / Novice / Practitioner / Expert / Innovator) |
| **Cost** | Concrete dollar estimate, specific to this branch's attack strategy *given all other mandatory measures*. Spell out which strategy the cost applies to. Flagged `[best guess]` or cited. |
| **Lead-up time** | Concrete duration, same sourcing standard as cost. |
| **Attacker exposure** | What identifying information does the attacker commit to the system by using this method? Whose identity ends up on file, and what's the link back to the attacker? This feeds the deterrence analysis. |

### Column synthesis (per branch)

After all rows for a branch, a short narrative identifying the cheapest end-to-end path through all measures, which measures are doing the most work vs. which are redundant given the others, and where constraints from different measures interact to make the path harder than any individual cell suggests. For persistent supply chain branches, this should also address which measures create accumulating friction or traceability over repeated orders.

### Companion document: bypass methods in practice

The ultimate audience includes policymakers who aren't cybersecurity experts — they need to picture what each attack concretely involves to engage their own judgment. A separate companion document provides narrative entries for each bypass method: what the attacker concretely does, what can go wrong. Organized by method (not by cell), since the same method may appear across multiple profiles.

### Expertise tiers

We use the [STIX v1.2 sophistication scale](context/stix-threat-actor-reference.md) (Aspirant / Novice / Practitioner / Expert / Innovator) as a quick-scan label for each bypass method. The label is a summary aid, not the primary analytical content.

### Deterrence analysis (per branch)

The bypass matrix captures direct cost, expertise, and lead-up time — but not the attacker's risk of detection, attribution, and consequences. Two bypass methods with identical direct costs can look very different once deterrence is factored in. The final analysis should include a per-branch assessment of which measures create the greatest deterrence — meaning paper trail (records usable against the attacker later), exposure to the institution (visibility to people who might notice something wrong), and attribution risk (identifying information committed to the system).

Deterrence also plays a role earlier in the pipeline: rough attacker exposure is noted during ideation (stage 0a) and used during consolidation (stage 0b) to determine whether two paths that trigger the same binding measures should still be kept as separate branches. Paths where the attacker commits their own identity create a fundamentally different deterrence picture from paths where they stay behind intermediaries — even if the same measures are binding. This is especially important for the persistent supply chain variant, where traceability accumulates over many orders.

### Operational difficulty review

An application of adversarial collaboration to a specific failure mode: the first version of the analysis, when reviewed by practitioners, was found to systematically understate operational difficulty by describing attacks at too high a level of abstraction. A dedicated adversarial review checks whether bypass methods enumerate concrete operational steps (not just labels), whether institutional defenses beyond KYC are accounted for, and whether difficulty calibration is plausible given the actual chain of actions.