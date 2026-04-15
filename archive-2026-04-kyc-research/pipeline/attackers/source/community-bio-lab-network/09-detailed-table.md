# Detailed analysis: Community bio lab network

**Branch scenario.** A single individual or small group registers two or three "community biology labs" in underserved metros — Denver, Tucson, Kansas City — as real LLCs or nonprofits with real domains, real maker space addresses, real bank accounts, and real public listings on community-bio directories. They use their own real names and government IDs throughout. The defining feature of this branch is that *the customer class itself* legitimately lacks the signals KYC measures usually look for: community bio labs as a group genuinely have no publications, no NIH grants, no university biosafety oversight, and no commercial revenue. The attacker is not hiding the fact that they have a thin profile; they are operating in a customer class whose expected profile is exactly this thin.

---

## Matrix A measures (apply to all orders)

### Measure 1 — Identity verification (IAL1)

**Binding?** No. The attacker uses their own real identity. A commercial IDV vendor check (database query plus an SMS confirmation code, or a document-and-selfie flow) returns clean results because the documents are genuine and the face matches the document.

**False-negative rate.** Industry-typical document-and-selfie flows pass roughly 80–95% of legitimate customers on the first attempt in well-covered countries, with much lower coverage in some Global South markets ([best guess based on IDV market reports](https://www.switchlabs.dev/post/fraud-prevention-identity-verification-software-complete-market-guide-2025)).

**Bypass methods.** None needed. The attacker simply submits real ID. Cost is whatever the provider passes through (~$0.50–$1.50 per check at the database tier). Lead-up time is minutes. The trace is the attacker's real name, date of birth, address, phone, and (in document flows) ID image and selfie, retained by the IDV vendor for 30 days to 7 years depending on configuration.

---

### Measure 2 — Institutional affiliation check

**Binding?** No. The "institution" is the attacker's own community bio lab, with a real domain and Google Workspace email. Domain recognition and work-email verification both pass.

**False-negative rate.** No published rate; structurally low for any customer who controls a custom-domain work email. Plausibly above 20% for legitimate small-org users who only have personal Gmail/Outlook addresses.

**Bypass method — Self-owned community lab domain.** Register a `.org` domain (~$15/year) and provision Google Workspace ([$7/user/month with one-year commitment](https://workspace.google.com/pricing)). Use `firstname@labdomain.org` as the work email at provider signup. **Expertise: Aspirant** (commodity small-business workflow, no security expertise required). **Cost: ~$100/year** for a single user. **Lead-up time:** hours to a day. **Trace:** WHOIS records the registrant (privacy proxy hides the public record but the registrar still holds it for legal request); Google Workspace billing records the attacker's payment instrument and admin contact. **Cross-measure dependency:** the same person identified at measures 1, 6 owns the domain and Workspace.

---

### Measure 3 — Organization registry + verified shipping address

**Binding? Yes.** This is the most binding measure in the branch. The attacker must construct a real registered organization with an approved shipping address, plus a second registered contact under the proposed two-contact baseline.

**False-negative rate.** Address-classification tools (USPS CMRA list, SmartyStreets, Loqate) flag commercial mail receiving agencies and P.O. boxes accurately in the US but coverage is uneven internationally. Plausibly 20–40% of new community bio entities have an "atypical" address (residential, maker space, or coworking) that may be flagged.

**Bypass method — Real LLC + maker space address.** File an LLC in [New Mexico ($50, no annual report)](https://www.llcuniversity.com/llc-filing-fees-by-state/) or Wyoming ($100 + $60/year). Obtain an EIN from the IRS. Rent a maker space membership in a biotech-adjacent metro — for example, [Clear Creek Makerspace in the Denver area at $60/month](https://clearcreekmakerspace.com/memberships/). The address resolves as commercial under USPS CMRA classification.
- **Expertise: Aspirant.** LLC formation and maker space membership are commodity workflows.
- **Cost: ~$50–$100 setup + $720–$1,800/year** for the maker space, depending on city.
- **Lead-up time: 1–4 weeks** (LLC processing is the longest pole; everything else parallelizes).
- **Trace:** State business registry record naming the principal — publicly searchable and indexed by Open Corporates and Google. EIN application records the responsible party at the IRS. Maker space holds membership records.
- **Caveat:** Maker spaces often have informal vetting (a visit, brief conversation) — adds friction but not a real gate.

**Bypass method — Real LLC + coworking space at biotech cluster.** Same LLC mechanics, but a biotech-cluster coworking space ($150–$500/month) gives a stronger commercial address with no CMRA flag and visual legitimacy if anyone checks. **Cost: ~$1,800–$6,000/year.** Otherwise identical.

**Bypass method — Real LLC + virtual office.** Virtual office services ($50–$200/month) provide a mail-handling address. Some are flagged as CMRAs by classification tools — selection matters. **Cross-measure trace cost:** Virtual offices require [USPS Form 1583](https://www.anytimemailbox.com/usps-form-1583), which means the virtual office holds a notarized copy of the attacker's government ID image — a strong identity commitment beyond what the synthesis provider sees.

**Bypass method — Real LLC + residential garage as stated lab address.** List the attacker's own residence as the lab address, framed as a "garage lab" — legitimate for community bio. **Cost: ~$50–$100 setup, no monthly address cost.** **Trace:** strongest of any variant — attacker's home address on file with the synthesis provider and named in state filings. **Key uncertainty:** depends on the provider having a customer-class-aware policy that tolerates residential addresses for community bio. Without that, address classification fails and this variant is unavailable.

---

### Measure 4 — Research and entity signals

**Binding? Yes**, but the bar is structurally low for this customer class. A measure-4 review configured around publication history, NIH grants, and university IBC oversight would have a near-100% false-negative rate against community bio labs if applied as a hard gate. The provider cannot reject "no publications, no grants, no IBC" without rejecting the entire legitimate customer class.

**False-negative rate.** Effectively 100% for community bio labs against academic-style signal checks. Community bio labs are typically run by volunteers and members from non-academic backgrounds ([2022 ACM study of community biolab members](https://arxiv.org/abs/2205.00079)), and the class operates with self-developed biosafety frameworks rather than institutional ones ([Genspace Community Biology Biosafety Handbook](https://www.genspace.org/community-biology-biosafety-handbook)).

**Bypass method — Minimal community-bio web presence + DIYbio.org listing.** A one-page website (template, $0–$240/year) describing educational programming, open-equipment policy, and community research interests. Request a listing on the [DIYbio.org local directory](https://diybio.org/local/), which adds groups within ~24 hours of being notified with no formal scientific vetting. Join one or two community bio Slack groups. Allow the domain at least 30 days to age before the provider account is created (or buy an aged domain for ~$50–$300). **Expertise: Aspirant.** **Cost: ~$0–$240/year.** **Lead-up time:** days to a few weeks. **Trace:** public DIYbio.org directory listing; Slack workspace membership tied to the lab work email.

**Bypass method — Self-listing under community bio umbrella organizations (DIYbiosphere).** The [DIYbiosphere](https://sphere.diybio.org/browse/) is a community-maintained directory accepting self-submitted entries. Free, no vetting beyond self-description. **Cost: $0.** **Lead-up time:** days. **Trace:** public listing tying lab name to contact. **Cross-measure dependency: this method couples tightly with measure 9** — claiming affiliation with a community bio umbrella simultaneously strengthens both measures at zero marginal cost (the same umbrella reference does double duty for legitimacy and biosafety framework).

**Bypass method — Lightweight third-party trace via citizen-science platforms.** Register on Protocols.io, iNaturalist, or similar (free). Self-publish 1–2 protocols. Creates Google-searchable artifacts that look like research outputs without going through any peer review. **Cost: $0.** **Lead-up time:** hours to set up; weeks to seed the account.

**Bypass method — Light AI-generated team profiles (LinkedIn).** One or two LinkedIn profiles for "founders/members." LinkedIn now requires phone verification and may require ID for new accounts, so attacker's real-name profile is the lower-friction choice. **Expertise: Novice.** **Cost: $0–$30** (if a second phone number is needed). **Lead-up time:** 1–3 days plus weeks of low-activity warm-up.

**Bypass method — Pay-to-publish methods note (escalation, optional).** Co-authorship on a low-barrier or [pay-to-publish journal article](https://beallslist.net/), $50–$2,500. **Lead-up time:** 1–6 months. **Trace:** permanent public record tying author name to entity name via affiliation field. Generally unnecessary for this branch because the customer class doesn't require publications.

**Population angle.** International community bio labs (Mexico City, Bangalore, São Paulo) have even thinner public footprints AND uneven IDV coverage in those countries — the framing is even more permissive there, but adds cross-border banking friction at measure 5.

---

### Measure 5 — Payment integrity

**Binding?** No. The attacker pays from a real business bank account in the LLC's name. Payer details match registered org details. No identity-obfuscating payment.

**False-negative rate.** Plausibly under 5% for B2B customers with their own business bank account; the rate is dominated by edge cases (relatives' cards, group payments).

**Bypass method — LLC business bank account.** Open an account at a [fee-free business bank such as Mercury](https://mercury.com/pricing) (no monthly fees, no minimum balance). **Expertise: Aspirant.** **Cost: $0/month.** **Lead-up time:** 1–10 business days after LLC formation. **Trace:** the bank holds full KYC: SSN, government ID image, address, signature, and beneficial-ownership disclosure. Records retained per FFIEC guidance (5 years minimum after closure). This is a fourth institutional KYC layer (after IDV vendor, state registry, IRS-EIN).

---

## Matrix B measures (added for SOC orders)

### Measure 6 — Identity verification (IAL2)

**Binding?** No. Same logic as measure 1: real ID, real face, real liveness all pass cleanly. Document scan + selfie + passive liveness flows are the standard ([roughly $2–$6/check](https://hyperverge.co/blog/jumio-pricing/) at scale).

**False-negative rate.** End-to-end IAL2 onboarding pass rates are typically 80–95% on first attempt in well-covered countries, with country-by-country attribute-validation coverage ranging from 0% (Iran) to 99% (India, Thailand).

**Bypass methods.** None needed.

**Lower-trace variant.** If the attacker prefers, the *accomplice* rather than the attacker can be the named principal of the entity. All measure-6 trace then shifts from attacker to accomplice; the attacker's name appears nowhere in provider records. Requires an accomplice willing to be the public face.

**Trace.** IDV vendor stores government ID image, selfie, liveness video, and biometric template. Retention: 30 days to 7 years for raw images, often longer for biometric templates.

---

### Measure 7 — MFA + re-authentication

**Binding?** No. The attacker controls the email and phone used to register the account. TOTP enrollment is trivial; step-up at SOC submission is just another challenge against the same attacker-controlled factor.

**False-negative rate.** Roughly 5–15% of legitimate users abandon TOTP enrollment due to QR-code errors or device problems (best guess from typical auth-system support experience).

**Bypass methods.** None needed. Cost: $0. Lead-up time: minutes. Trace: device fingerprint, IP, timestamps for each MFA event.

---

### Measure 8 — Vouching by registered contact

**Binding? Yes if voucher independence is enforced** (the voucher must belong to a separate verified institution); **partially binding** if the workflow only requires "a second contact on the entity"; **non-binding** if the process rubber-stamps without scrutiny. **This is the load-bearing Matrix B measure for this branch** — almost everything depends on whether independence is enforced.

**False-negative rate.** No published data; the measure is a proposed baseline rather than an observed practice. Best guess: 30–60% of legitimate small-org and community-lab customers would lack a clean independent voucher under a strict rule, since the entire community bio class operates without separate institutional sponsors by design.

**Bypass method — Self-vouching from within the same lab (intra-org accomplice).** The second registered contact is the attacker's accomplice — close family, romantic partner, long-term friend, or paid associate willing to accept legal exposure — listed as a co-founder. They approve orders through the provider portal under their own MFA.
- **Expertise: Aspirant.** The hard part is social, not technical.
- **Cost: $0 in money.** The dominant cost is **trust and recruitment**: the accomplice must submit their real biometric and ID to the synthesis provider, accept legal exposure, and sustain the role of approving SOC orders periodically over the ordering window. The realistic accomplice pool is narrow.
- **Lead-up time:** days to weeks if a willing person is already in the attacker's life; weeks to months if recruitment is required.
- **Trace:** accomplice's full identity at IAL2 (biometric, government ID, selfie); accomplice knows the attacker personally — closest possible link.
- **Key uncertainty: trivial defender check.** A provider could trivially flag voucher–orderer pairs that share an email domain and are listed at the same physical address — a join on data the provider already holds. Whether providers run this check is the open question.
- **Failure mode:** if voucher independence is enforced, this method fails by construction.

**Bypass method — Cross-lab vouching using a second purpose-built community lab.** Operate a second community lab in a different metro and use a contact registered there to vouch for orders at the first.
- **Cost: ~$750–$5,000 first-year added** (doubles all measure-3 setup).
- **Lead-up time:** add 2–6 weeks for the second entity.
- **Trace:** same attacker (or accomplice) committed across both entities — cross-provider correlation could surface this trivially if anyone aggregated.

**Bypass method — Use a board member of an adjacent nonprofit.** Educational nonprofits, science outreach orgs, or makerspace parent orgs have board members who are real and might be willing to vouch for a "community bio educational initiative." Attacker can join the board (low bar at small nonprofits) or recruit an existing member. **Expertise: Novice.** **Cost: $0–$500.** **Lead-up time: 4–12 weeks.** **Trace:** voucher's identity at the provider; voucher has independent institutional standing on the adjacent nonprofit.

**Bypass method — Pre-existing relationship leverage.** If the attacker has a pre-existing personal connection to a real scientist (former classmate, family member, etc.), that person can vouch under their independent institutional affiliation. **Cost: $0** if the relationship exists; **method is unavailable** if it does not. **Lead-up time:** days to weeks.

**Bypass method — Recruit a real community bio member to vouch (high friction, off cheapest path).** Engage with a real community bio Slack/listserv, build rapport over weeks, ask a real established-lab member to vouch. Real community bio communities are small and tight-knit; an unknown founder asking for a vouch on a sequence order is likely to trigger questions, not silent compliance. **Expertise: Practitioner.** **Lead-up time: 2–6 months.** **Failure rate: high** — most asks will be refused or escalated.

---

### Measure 9 — Biosafety documentation

**Binding? Yes**, but the bar is structurally low for this customer class. The expected documentation level is a community-developed biosafety plan or self-declaration, not a university IBC letter. There is no central registry of community bio biosafety plans against which the provider can verify a submitted plan.

**False-negative rate.** Effectively 100% if "verifiable IBC documentation" is applied as a hard gate to community bio labs and small private entities. [NIH Institutional Biosafety Committee registration applies only to NIH-funded institutions](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/institutional-biosafety-committees/), and no centralized public registry of private-entity IBCs exists.

**Bypass method — Adopt an established community lab's published biosafety framework.** The [Genspace Community Biology Biosafety Handbook](https://www.genspace.org/community-biology-biosafety-handbook) is a publicly available beta-draft open manual covering biosafety protocols and recommendations for the community biology movement, [launched in October 2020](https://openbioeconomy.org/blogpost/community-biology-biosafety-handbook/). The attacker adopts it by reference and adds a one-page lab-specific addendum. The underlying framework is real and externally verifiable; only the lab's adoption is declarative. **Expertise: Aspirant.** **Cost: $0.** **Lead-up time: 1 day.** **Trace:** document on file with provider, attributable to the lab and principal. **Cross-measure dependency:** this method couples tightly with measure 4's umbrella self-listing — the same affiliation claim does double duty.

**Bypass method — Self-authored community-developed biosafety plan.** Write a 5–15 page plausible plan citing BSL-1 procedures, the DIYbio code of ethics, and the lab's stated scope. **Expertise: Novice.** **Cost: $0.** **Lead-up time: 1–3 days.** **Trace:** document on file. Lazy plagiarism would be detectable to a competent reviewer but baseline review is unlikely to be expert.

**Bypass method — "Mentorship by established lab" claim.** Claim a mentorship relationship with an established community lab (verifiable or not). **Expertise: Novice.** **Cost: $0.** **Trace:** named third party on file. **Risk:** claim collapses if the named mentor is contacted by the provider.

**Bypass method — Hire a biosafety consultant for a real review.** Pay a biosafety consultant ($500–$3,000 best guess) to review the lab's plan and provide a sign-off letter. Real consultant doing real work for the stated activities; the deception is in the lab's actual intent. A competent consultant may ask probing questions, so this works only if the cover survives scrutiny. **Expertise: Practitioner.** **Lead-up time: 2–6 weeks.** **Trace:** consultant correspondence and contract; consultant letterhead on file with provider — the consultant becomes a witness if retroactively investigated.

---

## Strategy summary and persistent supply chain assessment

**Strategy summary.** This branch hides in a customer class whose legitimate baseline is structurally thin — community bio labs genuinely lack publications, grants, university IBC oversight, and commercial revenue, so the attacker doesn't have to fake any of those. They build a real LLC, a real domain, a real maker space address, a real bank account, real public listings on community-bio directories, and a real biosafety document adapted from the Genspace handbook. They use their own real identity throughout. Six of the nine KYC measures (1, 2, 5, 6, 7, plus largely 4 and 9 for this customer class) are non-binding by construction or class-neutralization; the entire defensive burden of the matrix collapses onto **measure 3 (registry + address)** and **measure 8 (vouching with independence enforcement)**. Total Matrix B cost is dominated by routine business expenses — LLC fees, maker space rent, bank account — rather than by any defeated security control, totaling roughly $890 for the first year on the soft baseline path. The joint constraint across measures is identity coherence: the same person carries through measures 1, 2, 3, 5, 6, 7 and is committed at four institutional KYC layers (IDV vendor, state business registry, IRS, bank), so the cheapest path is also the highest-trace path.

**Persistent supply chain assessment.** This branch is well-suited to repeated orders. Community bio labs are expected to order varied sequences over time; mixed ordering across DNA categories looks normal. A single lab can sustain orders for months until something triggers deliberate scrutiny. Multiple labs across metros add resilience — flagging one does not propagate to the others without cross-provider data sharing that does not exist at scale today. What accumulates is the **trace**: every order deepens the paper trail tying the attacker's real name to the entity, and that trail lives forever in IDV vendor records, state registries, IRS files, and bank ledgers. The attacker is not buying anonymity; they are betting that no order in the ordering window will trigger retrospective investigation of the full trail. This is a sustainable operation if the bet holds and a fully-attributable disaster if it doesn't.
