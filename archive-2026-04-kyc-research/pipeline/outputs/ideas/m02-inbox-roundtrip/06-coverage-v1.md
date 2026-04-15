# Coverage research: Inbox round-trip verification

## Coverage gaps

### Gap 1: Attackers who control the claimed inbox (inbox compromise / credential theft / insider)
- **Category:** Attackers who have gained access to a legitimate researcher's institutional email — via credential phishing, password reuse, session hijacking, or insider access. These attackers authentically receive and click the verification email. The round-trip check passes perfectly because the attacker genuinely controls the inbox.
- **Estimated size:** The implementation doc explicitly acknowledges this: "this is necessary but insufficient per the inbox-compromise / dormant-account-takeover / credential-compromise attacker branches — all of which authentically pass round-trip verification." [best guess: business email compromise (BEC) is a multi-billion-dollar industry; the fraction targeting synthesis providers is presumably tiny, but the check is structurally blind to this entire attack class. Any attacker who invests in obtaining institutional credentials — which is a standard step in sophisticated social engineering — bypasses this check completely].
- **Behavior of the check on this category:** no-signal (check passes; attacker indistinguishable from legitimate user)
- **Reasoning:** Round-trip verification proves inbox control, not identity. It cannot distinguish the legitimate account holder from anyone else who has access to the inbox. This is a fundamental limitation, not a tuning issue.

### Gap 2: Attackers using inbox forwarding rules
- **Category:** Attackers who have set up a mail forwarding rule on a compromised or shared institutional mailbox, silently relaying incoming mail (including the verification email) to an external address. The verification link arrives at the attacker's external mailbox; the click metadata may show a different IP/location but the link still works.
- **Estimated size:** [best guess: mail forwarding rules are a standard persistence technique in email compromise — attackers establish forwarding via OAuth token abuse, inbox rules, or backup email modifications [source](https://www.obsidiansecurity.com/blog/how-do-attackers-bypass-email-security). The check's click-metadata heuristics (datacenter IP, non-residential location) provide a weak secondary signal, but a minimally careful attacker can click from a residential VPN or the same geographic region].
- **Behavior of the check on this category:** weak-signal (forwarding pattern detection may flag, but is easily evaded)
- **Reasoning:** The implementation includes a "multiple distinct click sources" heuristic for forwarding detection, but this only catches sloppy forwarding setups. A single-hop forward to a personal device in the same city would not trigger any heuristic.

### Gap 3: Users behind corporate URL scanners (Proofpoint, Mimecast, Microsoft Defender Safe Links)
- **Category:** Legitimate researchers at institutions that deploy email security gateways (Proofpoint URL Defense, Mimecast URL Protection, Microsoft Defender Safe Links) which automatically follow and "click" links in incoming emails to scan for malware. This automated click triggers the verification link before the human user reads the email, producing suspicious click metadata (datacenter IP, bot-like user agent, sub-second latency).
- **Estimated size:** Corporate email security gateways are deployed at a large majority of US and European research universities and pharmaceutical companies. Proofpoint and Mimecast together dominate the enterprise email security market. [best guess: 40-60% of institutional synthesis customers' email flows through at least one URL-scanning gateway [source](https://keepnetlabs.com/blog/how-to-manage-false-clicks-in-phishing-simulations-for-security-awareness-training). Each of these produces a false-positive "suspicious click" signal, potentially flooding the reviewer queue].
- **Behavior of the check on this category:** false-positive
- **Reasoning:** This is the dominant operational challenge for inbox round-trip verification at scale. The implementation acknowledges it and suggests detecting known scanner UAs and requiring a second human click, but this adds complexity and friction. The false-positive rate on the "suspicious click" heuristic will be high among exactly the population (institutional researchers) that the check should pass frictionlessly.

### Gap 4: Users whose mail providers delay or quarantine transactional email
- **Category:** Legitimate users at institutions with aggressive spam filtering, greylisting, or quarantine policies that delay or block transactional verification emails. The verification mail arrives late (past TTL) or lands in a junk folder the user never checks.
- **Estimated size:** [best guess: greylisting typically delays first-time sender emails by 5-30 minutes, which is well within a 24-72h TTL. The real problem is quarantine: some institutional spam filters block transactional email from unfamiliar senders. This is more common at government agencies and highly-secured corporate environments. Perhaps 5-10% of first-attempt verifications fail due to delivery issues, with most resolved on retry].
- **Behavior of the check on this category:** false-positive (verification fails, but user is legitimate)
- **Reasoning:** The implementation handles this with retries (max 2), which mitigates most cases. Persistent quarantine requires the user to contact IT or whitelist the sender domain — adding friction for legitimate customers.

### Gap 5: Users on slow, intermittent, or restricted internet connections
- **Category:** Researchers in field locations, low-bandwidth environments, or behind restrictive institutional firewalls who cannot reliably access a web link within the TTL. Also includes researchers using text-only email clients or environments where clicking a link is non-trivial.
- **Estimated size:** [unknown — searched for: "percentage researchers limited internet access field stations remote locations"]. [best guess: a small fraction of synthesis customers (<5%), but notable for researchers in biodiversity/ecology fields who may order synthesis from field stations].
- **Behavior of the check on this category:** false-positive (token expires; user is legitimate but cannot complete verification)
- **Reasoning:** The 24-72h TTL is generous for most users. This is a marginal gap affecting a small population but worth noting for completeness.

## Refined false-positive qualitative

1. **Corporate URL scanners** (Gap 3): The dominant false-positive source. Affects 40-60% of institutional customers. Automated link-scanning produces click metadata that looks bot-like, triggering the "suspicious click" heuristic. Mitigation (detecting known scanner UAs) is imperfect and requires ongoing maintenance as scanners evolve.
2. **Mail delivery failures** (Gap 4): Moderate volume. Greylisting and quarantine prevent or delay verification email delivery. Retries handle most cases.
3. **Slow/restricted connectivity** (Gap 5): Low volume but high friction for affected users.
4. **Click metadata from institutional VPNs/proxies**: Researchers clicking from university VPN exit nodes may have datacenter IPs that trigger the "non-residential IP" heuristic even though the click is legitimate and human.

The overall false-positive burden of round-trip verification is low (most users click successfully). The problem is concentrated in the click-metadata heuristics: any attempt to detect bot-like or forwarding-like clicks will produce false positives on the corporate-URL-scanner population, which overlaps heavily with the institutional-researcher population the check most wants to pass.

## Notes for stage 7 synthesis

- Inbox round-trip verification is a near-zero-cost, near-universal check that every synthesis provider should implement. It is necessary but not sufficient: it proves inbox control, not identity, not institutional affiliation, not research legitimacy.
- The check's security value is limited to blocking customers who cannot receive email at their claimed address. This is a low bar, but it is not zero — it blocks typosquatted domains, non-functional mailboxes, and casual fabrication.
- The most important coverage gap (Gap 1: inbox compromise) is structural and shared with all email-based verification. It cannot be fixed within this check; it must be addressed by layering other checks (m02-dangling-dns, m07 affiliation verification, etc.).
- The corporate URL scanner problem (Gap 3) is the main operational headache. Any provider deploying this check at scale should invest in scanner-UA detection and a "re-click" flow early, or accept a high false-positive rate on the suspicious-click heuristic.
- The marginal cost (<$0.001/check) makes this a clear "always deploy" check regardless of coverage limitations.
