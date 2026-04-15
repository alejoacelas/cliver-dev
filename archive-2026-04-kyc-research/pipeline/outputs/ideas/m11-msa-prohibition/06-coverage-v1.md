# Coverage research: MSA prohibition + order-text crypto-reference scan

## Coverage gaps

### Gap 1: Obfuscated or non-English crypto references
- **Category:** Any customer (legitimate or attacker) who references cryptocurrency in order metadata using obfuscated text ("B*tc*in", "b1tc01n"), non-English terms (e.g., Chinese/Korean coin names), image attachments containing wallet addresses, or encoded references that regex over plaintext cannot match.
- **Estimated size:** [unknown — searched for: "cryptocurrency mentions in biology research papers percentage false positive text scanning"]. No quantitative data exists on obfuscation rates in commercial order metadata. [best guess: in an adversarial context, an attacker aware of the scan would trivially avoid triggering it — the obfuscation barrier is near-zero. For inadvertent/naive mentions, the regex catches most plain-English references. The gap is primarily adversarial: any attacker who knows the scan exists can evade it with minimal effort.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** Regex scanning is a low-adversarial-resistance control. It catches naive/accidental mentions but provides no coverage against a deliberate attempt to reference crypto without triggering keywords. The implementation doc acknowledges this.

### Gap 2: Crypto references outside scanned fields
- **Category:** Customers who mention cryptocurrency in channels not indexed by the regex scanner — phone calls, in-person conversations, unindexed email threads, chat messages on external platforms, or fields not included in the scan scope (e.g., attachments, images, PDFs).
- **Estimated size:** [best guess: a meaningful fraction of customer communication occurs outside the scanned text fields. If the scan covers order notes, PO numbers, billing memos, and support-ticket subject/body, it still misses phone calls (which many B2B synthesis providers use heavily) and any communication through external channels. Perhaps 20–40% of customer-provider communication surface area is unscanned.] [unknown — searched for: "B2B customer communication channel breakdown text vs phone vs email"].
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The scan only operates on indexed text. Any crypto mention in a non-text or non-indexed channel is invisible to the check.

### Gap 3: MSA clause provides no technical prevention
- **Category:** All customers. The MSA clause is a legal/administrative control, not a technical one. A customer who agrees to the ToS and then attempts to pay with crypto is not technically prevented by the clause itself — only by sibling ideas (m11-psp-config-audit, m11-crypto-onramp-denylist).
- **Estimated size:** 100% of customers interact with the MSA; the clause provides deterrence and legal recourse but zero technical blocking. Clickwrap agreements are generally enforceable in US courts [source](https://ironcladapp.com/journal/contract-management/6-components-of-clickwrap-enforceability), [source](https://www.bairdholm.com/blog/cryptocurrency-and-click-wrap-agreements/), so the legal value is real — but it is not a detection or prevention control.
- **Behavior of the check on this category:** no-signal (for detection purposes; the MSA provides legal/audit value, not signal)
- **Reasoning:** This is by design — the implementation doc explicitly states the clause provides "clear customer notice, legal grounds to terminate, and audit-trail evidence." But in a coverage analysis, it contributes zero detection coverage. Document for the synthesis stage.

### Gap 4: Ethereum-address regex false positives on hex identifiers
- **Category:** Legitimate customers whose order metadata contains 40-character hexadecimal strings prefixed with `0x` that are not Ethereum addresses — e.g., software hashes, internal hex-encoded identifiers in PO numbers, sequence identifiers in bioinformatics pipelines.
- **Estimated size:** The Ethereum regex pattern `\b0x[a-fA-F0-9]{40}\b` matches any 42-character hex token starting with `0x`. [unknown — searched for: "Ethereum address regex false positive rate hexadecimal strings in databases"]. In DNA synthesis order metadata specifically, hex-encoded identifiers are uncommon but not impossible (e.g., SHA-1 hashes are 40 hex chars). [best guess: low false-positive rate — perhaps 1–5 hits per 10,000 orders at a typical provider — because most order metadata fields contain natural-language text, not raw hex.]
- **Behavior of the check on this category:** false-positive (routes to manual review, which correctly classifies as pass)
- **Reasoning:** The implementation doc acknowledges this. The reviewer SOP handles it, but it generates noise.

### Gap 5: Keyword false positives from cryptography/distributed-systems researchers
- **Category:** Researchers in cryptography, blockchain technology, distributed systems, or computer security whose lab descriptions, order notes, or PI names include terms like "Bitcoin," "Ethereum," "blockchain," or exchange names (Coinbase, Binance) in a non-payment context.
- **Estimated size:** [best guess: a very small fraction of DNA synthesis customers are in computer-science fields that reference crypto terminology — likely <0.5% of the customer base. But each such customer's orders may repeatedly trigger the keyword scan.] [unknown — searched for: "cryptocurrency mentions in biology research papers percentage false positive text scanning"]. Cross-disciplinary orders (e.g., a CS/bio dual lab working on both cryptographic protocols and gene synthesis) are rare but not zero.
- **Behavior of the check on this category:** false-positive (routes to manual review; reviewer classifies as research mention)
- **Reasoning:** The implementation doc lists this as the primary false-positive class. Manageable with reviewer training but generates recurring noise for affected customers.

## Refined false-positive qualitative

1. **Cryptography/blockchain researchers** (Gap 5) — recurring false positives on keyword matches. Low volume, manageable with SOP.
2. **Hex-identifier false positives** (Gap 4) — occasional hits on `0x`-prefixed hex strings. Low volume.
3. **Biotech-token startups** — mentioned in the implementation doc; companies whose name references "Token" or "Bio Token." Extremely rare.

## Notes for stage 7 synthesis

- This idea is primarily an administrative/legal control, not a detection control. Its value is (a) deterrence, (b) legal recourse, and (c) a thin detection layer via regex scanning. The regex layer has low adversarial resistance (Gap 1) and limited scope (Gap 2).
- The MSA clause's value (Gap 3) is real but non-technical; it should be presented in the synthesis as complementary to the technical controls in m11-psp-config-audit and m11-crypto-onramp-denylist, not as an independent detection mechanism.
- False-positive load is low (Gaps 4, 5) and manageable with reviewer SOPs.
