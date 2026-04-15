# Coverage research: Disposable / free-mail blocklist

## Coverage gaps

### Gap 1: Newly created disposable domains not yet on any blocklist
- **Category:** Attackers using freshly registered disposable email domains that have not yet been added to community-maintained blocklists. New disposable email providers appear at a rate of roughly 5-50 new domains per day [source](https://www.block-disposable-email.com/cms/), [source](https://www.istempmail.com/articles/temporary-email-block-list-top-7/). The disposable email ecosystem operates 160,000+ active domains [source](https://www.ipqualityscore.com/features/block-disposable-emails), while the largest open-source list contains ~110k entries and the standard community list has ~4,000 [source](https://github.com/disposable-email-domains/disposable-email-domains). A fresh single-use domain can go from registration to active abuse in under an hour, well before any blocklist catches it.
- **Estimated size:** [best guess: the lag between a new disposable domain appearing and its addition to community lists is typically 1-14 days (per implementation doc). At 5-50 new domains/day, this means 5-700 active disposable domains may be unlisted at any given time. For a sophisticated attacker specifically targeting DNA synthesis screening, using a custom disposable domain not on public lists is trivial].
- **Behavior of the check on this category:** no-signal (domain passes the check because it is not on any list)
- **Reasoning:** Blocklists are inherently reactive. They catalog known disposable providers after they are discovered. A targeted attacker can trivially create a new domain that is not on any list. This is the fundamental limitation of negative-list approaches.

### Gap 2: Legitimate independent researchers using free email (Gmail, Outlook, Proton)
- **Category:** Researchers who are legitimately independent — community biologists, freelance consultants, retired academics, researchers between institutional appointments — who use `@gmail.com`, `@outlook.com`, or `@protonmail.com` as their primary professional email. The free-mail flag fires correctly (the domain is on the free-mail list) but the correct disposition is not "block."
- **Estimated size:** A 2015 study found that a significant fraction of corresponding authors on scientific papers used non-institutional email (the exact percentage varied by field and region) [source](https://asistdl.onlinelibrary.wiley.com/doi/abs/10.1002/asi.23401). [best guess: in the gene synthesis customer base, perhaps 10-20% of legitimate customers use free email — this includes independent researchers, small biotech founders pre-custom-domain, and researchers in countries where Gmail Workspace is the de facto institutional platform. The check correctly flags these for additional scrutiny but cannot distinguish them from attackers].
- **Behavior of the check on this category:** false-positive (flag fires, but the customer is legitimate)
- **Reasoning:** The free-mail flag is a soft signal, not a block. But it routes to a reviewer queue, adding cost and latency. For independent researchers without institutional affiliation evidence, the flag may be difficult to resolve — they lack the faculty page, ROR entry, or ORCID that the downstream m07 check would look for.

### Gap 3: Researchers in countries where institutional email infrastructure is weak
- **Category:** Legitimate academic researchers at institutions in low- and middle-income countries where institutional email is unreliable or non-existent, forcing researchers to use Gmail or Yahoo as their professional email. This is common in parts of sub-Saharan Africa, South/Southeast Asia, and Latin America.
- **Estimated size:** [unknown — searched for: "percentage researchers developing countries using gmail instead of institutional email", "institutional email availability low-income countries"]. Anecdotal evidence from ResearchGate discussions suggests this is common but no survey quantifies it. [best guess: in countries with underfunded university IT infrastructure, 30-50% of researchers may use free email professionally. These countries represent a growing share of global biology research output].
- **Behavior of the check on this category:** false-positive (same as Gap 2, but with a stronger equity dimension)
- **Reasoning:** The free-mail flag systematically disadvantages researchers from lower-income countries who lack institutional email infrastructure. The downstream affiliation check (m07) may partially resolve this, but researchers at institutions without ROR entries, ORCID profiles, or English-language faculty pages face compounding barriers.

### Gap 4: Privacy-focused email providers miscategorized as disposable
- **Category:** Customers using legitimate privacy-focused email providers (Proton Mail, Tutanota/Tuta, StartMail) that some disposable-email blocklists incorrectly include. These are real, persistent email providers used by privacy-conscious individuals — not disposable mailboxes.
- **Estimated size:** Proton Mail alone has 100M+ accounts [source](https://www.aboutchromebooks.com/gmail-statistics/). [best guess: a small fraction of synthesis customers use privacy-focused email, but the false-positive impact is severe — a hard reject on a Proton Mail user is wrong and alienating. Most well-maintained lists (disposable-email-domains/disposable-email-domains) explicitly exclude major privacy providers, but smaller or less-curated lists may include them].
- **Behavior of the check on this category:** false-positive (hard reject if on disposable list, which is a severe error)
- **Reasoning:** This is a list-quality issue. The implementation mitigates it by using well-maintained lists, but any automated blocklist approach risks miscategorization. The severity is high because the disposition for "disposable" is hard reject, not soft flag.

### Gap 5: Attackers using custom domains that are neither disposable nor free
- **Category:** A sophisticated attacker who registers a plausible-looking domain (e.g., "greenfield-biotech.com") with real MX records, uses it for one or a few synthesis orders, then abandons it. This domain would not appear on any disposable-email blocklist because it was never a public disposable email service.
- **Estimated size:** This is a structural bypass applicable to any targeted attacker. The check is designed to catch lazy/bulk use of known disposable services, not targeted domain creation.
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The disposable blocklist catches bottom-of-the-funnel throwaway behavior. It does not detect purpose-built operational domains. This is why the check must be paired with m02-dangling-dns, m02-inbox-roundtrip, and other domain-reputation signals.

## Refined false-positive qualitative

1. **Independent researchers on free email** (Gap 2): The largest-volume false-positive source. These customers are flagged correctly by the check's logic but are legitimate. The soft-flag → reviewer workflow adds friction without adding much safety signal for this population.
2. **Developing-country researchers on free email** (Gap 3): Same mechanism as Gap 2 but with equity implications. Systematic disadvantage for researchers in low-resource environments.
3. **Privacy-email miscategorization** (Gap 4): Low volume but high severity — a hard reject on a Proton Mail user is a significant error.
4. **Newly listed disposable domains catching pre-existing customers** (from implementation doc): A customer who signed up with a domain that later gets added to the disposable list may be retroactively flagged.

The false-positive profile is concentrated on the free-mail soft flag, not the disposable hard reject. The disposable hard-reject path has a low false-positive rate (well-maintained lists are accurate for known disposable providers) but the free-mail soft-flag path has a structurally high false-positive rate among independent and developing-country researchers.

## Notes for stage 7 synthesis

- This check is a cheap, high-specificity gate against the laziest form of identity concealment (using Mailinator, 10minutemail, etc.). Its value is proportional to the fraction of malicious actors who would use obviously disposable email rather than registering a custom domain.
- The free-mail soft-flag component is more controversial: it catches a real signal (no institutional email) but generates a high volume of flags on legitimate independent researchers. The cost-benefit depends on whether the downstream m07 affiliation check can efficiently resolve these flags.
- The check has zero value against sophisticated attackers who can trivially register custom domains. It should be framed as a low-cost filter for bottom-of-funnel abuse, not as a security measure.
- List freshness matters: the eramitgupta auto-updated list (110k+ domains, daily updates) is substantially more current than the 4k-domain community list. Using multiple lists in parallel is a best practice.
- The equity concern (Gap 3) is real and should be acknowledged in policy design: free-email-using researchers from developing countries should have a clear, low-friction path to verification that does not depend on having institutional infrastructure.
