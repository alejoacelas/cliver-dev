# Coverage research: SpyCloud / Constella breach-credential check + HIBP Pwned Passwords

## Coverage gaps

### Gap 1: Credentials not yet in any breach corpus (zero-day / real-time phishing)
- **Category:** Customers whose credentials are stolen via real-time AitM phishing (Tycoon 2FA, EvilProxy) or targeted spearphishing and used immediately, before the credential appears in any breach dataset ingested by SpyCloud, Constella, or HIBP.
- **Estimated size:** [best guess: AitM phishing relay attacks are the fastest-growing credential-theft vector. SpyCloud's 2024 Annual Identity Exposure Report notes 61% of data breaches in 2023 were malware-related ([SpyCloud 2024 Report](https://spycloud.com/newsroom/annual-identity-exposure-report-2024/)), implying ~39% were non-malware (phishing, social engineering, etc.). Of those, real-time AitM relay attacks that never produce a stored credential are a subset — perhaps 5–15% of all credential-theft incidents against synthesis-customer-equivalent organizations. This is the category the implementation itself flags as NOT addressed.]
- **Behavior of the check on this category:** no-signal — the credential is not in any breach dataset at the time of use.
- **Reasoning:** The implementation explicitly cross-references m16-webauthn-yubikey for this gap. Breach datasets are inherently backward-looking; real-time attacks bypass them entirely.

### Gap 2: Credentials from breaches not ingested by the chosen vendor
- **Category:** Customers whose credentials were compromised in breaches that SpyCloud / Constella have not yet recaptured from darknet marketplaces, or that are circulating in private channels (Telegram groups, closed forums) not monitored by these vendors.
- **Estimated size:** HIBP contains records from ~900 breaches covering ~17 billion accounts ([HIBP FAQ](https://haveibeenpwned.com/FAQs)), but explicitly states it is "not exhaustive" and does not represent 100% of all leaked data. SpyCloud claims the "largest darknet repository" with 53+ billion recaptured identity assets ([SpyCloud Data page](https://spycloud.com/our-data/)), but the total volume of leaked credentials in circulation is unknown. [best guess: any single vendor covers 40–70% of circulating breach data; the complement is the gap. Combining SpyCloud + HIBP improves coverage but does not reach 100%.]
- **Behavior of the check on this category:** no-signal — the credential exists in a breach but is not in the vendor's dataset, so the check returns clean.
- **Reasoning:** Breach corpus completeness is a known limitation of all credential-screening services. The implementation mitigates by using multiple vendors (SpyCloud + Constella + HIBP), but structural gaps remain for private or very recent leaks.

### Gap 3: Customers with unique, high-entropy passwords that collide with no breach
- **Category:** Security-conscious customers using password managers with unique, high-entropy credentials per site. Their credentials have never appeared in any breach.
- **Estimated size:** [best guess: this is the *desirable* state — these customers are well-protected and the check correctly returns no hit. Not a coverage gap in the security sense, but relevant for understanding the check's population dynamics: the check provides signal only for the complement. Password manager adoption among IT professionals is ~60–70% ([Bitwarden 2024 survey](https://bitwarden.com/blog/world-password-day-2024-survey/)); among academic researchers it is likely lower, perhaps 30–50%.]
- **Behavior of the check on this category:** no-signal (correct behavior) — no hit because there is no breach. This is not a gap in the security sense; included for completeness.
- **Reasoning:** The check is asymmetric: it catches bad hygiene but provides no positive signal about good hygiene. A clean result means "not in our breach corpus" — not "credential is secure."

### Gap 4: Customers at institutions in non-Western / non-English-speaking regions with lower breach-corpus coverage
- **Category:** Customers at institutions in regions where breach data is less likely to be recaptured by Western-centric vendors (e.g., institutions in Sub-Saharan Africa, Central Asia, parts of Southeast Asia, Latin America). SpyCloud and Constella's data-collection infrastructure is concentrated in English-language and European darknet marketplaces.
- **Estimated size:** The international gene synthesis market outside North America is ~45% of global revenue ([GM Insights, 2025](https://www.gminsights.com/industry-analysis/gene-synthesis-market)). Infostealer infection concentrations are highest in India, Indonesia, US, Spain, France, UK, and Brazil ([KELA 2025 Infostealer Report](https://www.kelacyber.com/blog/understanding-the-infostealer-epidemic/); [Twilight Cyber 2024](https://twilightcyber.com/the-rise-of-infostealers-insights-from-2024/)), suggesting breach data from these regions is well-represented. But for countries outside these hotspots (much of Africa, Central Asia, Pacific Islands), breach corpus coverage is [unknown — searched for: "SpyCloud breach database coverage non-English countries Asia Africa percentage 2024"]. [best guess: 5–10% of synthesis customers are at institutions in regions with thin breach-corpus coverage.]
- **Behavior of the check on this category:** weak-signal — breaches may have occurred but are not in the corpus; the check returns clean, giving false assurance.
- **Reasoning:** Breach-credential vendors have acknowledged that their coverage is strongest for US, EU, and major Asian markets. The tail of smaller markets has lower ingestion rates.

### Gap 5: Customers who have already rotated their password after a breach
- **Category:** Customers whose email appeared in a breach with an old password, and who have since changed their password. The breach hit fires on the email, but the current password does not match.
- **Estimated size:** [best guess: this is common — the implementation's SOP differentiates "email-only hit" from "email+password hit." For email-only hits, the check produces a soft warning only. The frequency depends on the provider's customer base breach exposure; given that 86% of basic web application attacks in education use stolen credentials ([Verizon DBIR 2025 via Varonis](https://www.varonis.com/blog/education-cybersecurity-statistics)) and >65% of universities lack basic email security ([Sentinelone](https://www.sentinelone.com/cybersecurity-101/cybersecurity/cybersecurity-in-higher-education/)), email-only hits will be frequent for academic customers — potentially 30–50% of academic customer emails appear in at least one breach.]
- **Behavior of the check on this category:** false-positive (mild) — email-only hit triggers a soft warning for customers who have already remediated. The SOP handles this well (soft warning, recommend rotation), but at scale the warning fatigue may desensitize reviewers.
- **Reasoning:** The implementation correctly downgrades email-only hits, but the volume of email-only hits in an academic customer base will be high, creating noise.

### Gap 6: Institutional service accounts and shared credentials
- **Category:** Shared or service-account credentials used by lab groups, core facilities, or procurement offices. These often have a generic email (e.g., orders@labname.edu) and a shared password, and may not appear in individual-focused breach datasets.
- **Estimated size:** [unknown — searched for: "shared service account credentials breach detection", "institutional generic email breach coverage"]. [best guess: 5–10% of synthesis provider customer accounts are institutional/shared, based on the same core-facility estimate from m16-order-time-stepup Gap 3.]
- **Behavior of the check on this category:** weak-signal — generic institutional emails may not appear in breach datasets indexed by individual email; if the shared password is a common weak password it may hit HIBP but the attribution is unclear (who needs to reset?).
- **Reasoning:** Breach-credential services are designed around individual consumer identities. Institutional service accounts are an awkward fit.

## Refined false-positive qualitative

1. **Shared lab passwords breached on a different account** (stage 4) — remains. True positive against bad practice, but the forced-reset disrupts the lab's workflow.
2. **Password-manager collision** (stage 4) — remains. Vanishingly rare.
3. **Institution suffered an unrelated breach** (stage 4) — remains. Upgraded by Gap 5: email-only hits will be extremely common for academic customers, generating review noise.
4. **Email-only hit volume in academic customer base** (Gap 5) — new. The soft-warning path is correct, but the sheer volume (~30–50% of academic emails in at least one breach) risks reviewer fatigue.
5. **Shared / service-account credentials** (Gap 6) — new. Attribution problem: who gets the forced reset?

## Notes for stage 7 synthesis

- The check is fundamentally backward-looking: it catches credentials already in breach corpora but provides no protection against real-time attacks (Gap 1). This is well-understood and the implementation correctly cross-references m16-webauthn-yubikey.
- The most operationally significant gap is Gap 5 (email-only hit noise in academic populations). The SOP handles it at the individual level but the aggregate volume may overwhelm reviewers.
- Gap 2 (vendor corpus incompleteness) is structural and unmitigable within this idea; the multi-vendor approach (SpyCloud + Constella + HIBP) is the standard mitigation.
- Gap 4 (regional coverage) is worth flagging for providers with a significant non-Western customer base but probably affects <10% of the customer population.
