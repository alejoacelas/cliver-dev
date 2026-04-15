# Coverage research: DKIM-verified institutional email from voucher

## Coverage gaps

### Gap 1: Institutions with absent or misconfigured DKIM
- **Category:** Vouchers at institutions that have not published a DKIM key, have an expired key, or have misconfigured their DNS TXT records such that DKIM verification fails on legitimate mail.
- **Estimated size:** Global DKIM adoption reached ~84-90% of email-sending domains as of 2025-2026, driven by Google/Yahoo/Microsoft sender requirements. [source](https://dmarcchecker.app/articles/spf-dkim-dmarc-adoption-2024) However, this figure is for all domains; institutional email domains lag. In higher education specifically, only ~30.7% of .edu domains have DMARC at enforcement. [source](https://www.valimail.com/blog/dmarc-adoption-higher-education/) While DKIM adoption is broader than DMARC enforcement, the gap between "has a DKIM record" and "all outbound mail reliably signs with DKIM" is significant. [best guess: 5-15% of legitimate institutional vouchers worldwide will experience DKIM verification failures due to misconfiguration, with the rate higher for smaller and non-US institutions]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** A voucher at a legitimate institution whose DKIM is broken will fail the check and be routed to the manual fallback path (re-send directly, or have IT confirm). This adds friction and delay but does not permanently block the voucher.

### Gap 2: Non-OECD / non-English-language institutional email infrastructure
- **Category:** Vouchers at institutions in countries with lower email authentication adoption rates. For .fr domains, DKIM adoption was only 40.7% in 2025 [source](https://www.afnic.fr/en/observatory-and-resources/expert-papers/spf-dkim-dmarc-and-bimi-on-fr-still-on-the-rise-in-2025/); non-OECD countries likely have even lower rates. Academic institutions in Sub-Saharan Africa, parts of South/Southeast Asia, and Central America may lack DKIM entirely.
- **Estimated size:** [best guess: if .fr domains (a well-resourced OECD country) are at ~41% DKIM adoption, non-OECD institutional domains may be at 20-30%. Combined with the ~30-40% of synthesis customers who are non-US (see m19 Gap 2), this suggests ~10-15% of all potential vouchers could face DKIM failures due to their institution's infrastructure, not their own behavior.]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** The check penalizes vouchers at institutions with poor IT infrastructure. These vouchers are disproportionately from less-wealthy countries and smaller institutions — precisely the populations that should not be excluded from the synthesis ecosystem for infrastructure reasons.

### Gap 3: Email forwarding and mailing-list traversal breaking DKIM
- **Category:** Vouchers whose institutional email is forwarded through an intermediate server (e.g., alumni forwarding, department mailing list, institutional mail gateway that modifies headers/body) before reaching the provider's MX. Content modification breaks the DKIM body hash.
- **Estimated size:** Emails passing through two forwarding hops without ARC experience a 41% DMARC failure rate at major providers. [source](https://dmarcreport.com/blog/the-impact-of-email-forwarding-on-spf-dkim-and-dmarc/) ARC reduces this but is not universally adopted. [best guess: 5-10% of institutional voucher emails will arrive with broken DKIM due to forwarding, especially for vouchers using alumni addresses or institutional gateways that add disclaimers/footers]
- **Behavior of the check on this category:** false-positive (mitigated by ARC fallback)
- **Reasoning:** The stage-4 implementation includes ARC chain validation as a fallback. For institutions and intermediaries that support ARC, this mitigates the problem. For those that do not, the voucher must re-send directly — adding friction.

### Gap 4: Attackers with real institutional email access
- **Category:** Attackers who control a legitimate institutional email account — through insider access, credential compromise, IT persona manufacturing, or a dormant-domain revival with freshly configured DKIM. The DKIM check passes because the email is genuinely signed by the institution's mail server.
- **Estimated size:** [unknown — searched for: "rate of institutional email compromise university phishing credential theft", "dormant domain revival frequency"; no direct data on the fraction of synthesis-relevant attacks that would use compromised institutional email. [best guess: this is the dominant bypass for sophisticated attackers; the DKIM check provides zero resistance against them. The check's value is entirely against unsophisticated attacker patterns (free-mail, lookalike).]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** DKIM verifies that the email was signed by the institution's mail infrastructure. It does not verify that the person sending the email is who they claim to be, or that they have authorization to vouch. An attacker with a compromised `@university.edu` account produces a perfectly valid DKIM signature.

### Gap 5: Cloud-hosted institutional email with third-party DKIM signing
- **Category:** Institutions that outsource email to Google Workspace, Microsoft 365, or another cloud provider but have not configured customer-domain DKIM signing. The cloud provider signs with its own `d=` domain (e.g., `d=google.com` rather than `d=university.edu`).
- **Estimated size:** [best guess: most large US universities have configured custom-domain DKIM under Google Workspace or M365, but smaller institutions, community colleges, and international institutions may not have. Modern Google Workspace and M365 default to customer-domain signing when configured, but legacy or misconfigured setups persist. Perhaps 5-10% of institutional mail domains have this issue.]
- **Behavior of the check on this category:** false-positive (but adjudicable)
- **Reasoning:** The stage-4 implementation notes that the reviewer should treat this as legitimate "if the cloud vendor is the institution's published MX provider." This requires the reviewer to look up the institution's MX record, adding complexity to adjudication.

## Refined false-positive qualitative

Cross-referencing the gaps above with the stage-4 false-positive list:

1. **Institutions with broken/absent DKIM** (stage 4) — quantified as Gap 1; ~5-15% of institutional vouchers worldwide.
2. **Contracted MTA signing under contractor's domain** (stage 4) — quantified as Gap 5; ~5-10%.
3. **Alumni aliases** (stage 4) — subsumed under Gap 3 (forwarding).
4. **Mailing-list-traversed messages without ARC** (stage 4) — quantified as Gap 3; ~5-10% of voucher emails.
5. **Foreign institutions with idiosyncratic mail setups** (stage 4) — quantified as Gap 2; ~10-15% of non-US vouchers.
6. **Cumulative false-positive estimate:** [best guess: in the US R1 university population, the false-positive rate is low (<5%). Globally across all institutional types, the cumulative false-positive rate from Gaps 1-3 and 5 is likely 15-25%, heavily concentrated in non-OECD and small-institution populations.]

## Notes for stage 7 synthesis

- DKIM verification is a strong floor for blocking lazy attacker patterns (free-mail, lookalike domains, no-DKIM shells) but provides zero resistance against the dominant sophisticated attacker pattern (compromised institutional email).
- The check's false-positive rate is highly stratified: near-zero for US R1 universities, moderate for European institutions, and potentially high for non-OECD institutions.
- The ARC fallback is critical for reducing false positives from forwarding, but ARC is not yet universally adopted.
- This check is best understood as complementary to other M20 checks: it establishes that the voucher's email infrastructure is real, but says nothing about the voucher's identity or independence.
