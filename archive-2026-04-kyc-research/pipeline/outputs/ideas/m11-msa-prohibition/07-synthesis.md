# m11-msa-prohibition — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | MSA prohibition + order-text crypto-reference scan |
| **measure** | M11 (payment-no-crypto) |
| **attacker_stories_addressed** | crypto-funding. No in-corpus branch routes cryptocurrency to the synthesis provider; this is a defense-in-depth + audit-trail control. |
| **summary** | Two complementary controls. (1) The customer-facing Master Services Agreement / Terms of Service includes an explicit clause prohibiting cryptocurrency as a payment method, naming wallet-address transmission, on-ramp routing, and stablecoin transfers. (2) A nightly regex scan over free-text order metadata (PO numbers, order notes, billing-instruction fields, support-ticket bodies) for cryptocurrency wallet-address patterns (BTC P2PKH, Bech32, ETH/EVM 0x addresses) and coin tickers/keywords. Hits route to manual review. |
| **external_dependencies** | Legal review of MSA/ToS language (one-time, then periodic). Internal regex scanner over order-metadata database — no external API. Reviewer queue for textual hits. |
| **endpoint_details** | **MSA/ToS leg:** Standard contract clause approach in the synthesis provider's customer-facing terms and order-acceptance click-through. A prohibitive clause is structurally simple: "Customer agrees not to attempt to pay in cryptocurrency, stablecoins, or any other digital asset." Reference templates available from Contract Nerds and CoBrief. Not a technical block — provides customer notice, legal grounds for termination, and audit-trail evidence. **Regex scan leg:** Scheduled job (nightly batch + one-time historical sweep) over order metadata. Patterns: BTC P2PKH `[13][A-HJ-NP-Za-km-z1-9]{25,34}`, BTC Bech32 `bc1[ac-hj-np-z02-9]{11,71}`, ETH `0x[a-fA-F0-9]{40}`, plus case-insensitive keyword list (bitcoin, BTC, ethereum, ETH, USDC, USDT, stablecoin, wallet address, Coinbase, Binance, etc.). Regex catches references for human review, not address validation (no checksum). Database read credential; no rate limits. |
| **fields_returned** | **MSA:** timestamp + customer ID + ToS version accepted at click-through. **Regex hits:** field name, matched substring (redacted if wallet address), order ID, customer ID, pattern that matched (BTC P2PKH/Bech32/ETH/keyword), match context (+/-50 chars), scan timestamp, original record creation timestamp. |
| **marginal_cost_per_check** | ~$0 runtime (database regex scan runs thousands of records/second). Setup: legal review 1-3 hours outside counsel (~$300-$1,500 [best guess]); engineering ~4 hours for scanner + scheduling + review-queue hookup; historical sweep a few hours compute. Ongoing: reviewer time on hits, plausibly 10-60 min/week for moderate-volume provider. |
| **manual_review_handoff** | When `order_text_crypto_reference` fires, reviewer classifies into four categories: (1) Customer-attempting-payment — reply with MSA-clause notice, deny if not redirected to fiat. (2) Customer offering wallet for refund — decline, refund to original card. (3) Research mention (false positive) — pass. (4) Internal note — pass, tag for trend analysis. Wallet address in unexpected field escalates to compliance. SOP target: <=5 min/case; near-zero true positives expected. |
| **flags_thrown** | `order_text_crypto_reference` — regex hit on order metadata; reviewer triages. `msa_crypto_clause_violated` — set when a customer hit results in denial under the MSA crypto clause; the auditable enforcement event. |
| **failure_modes_requiring_review** | (1) FP: legitimate cryptography/distributed-systems research context. (2) FP: biotech-token startup names. (3) FN: obfuscated references ("B*tc*in", "b1tc01n", images, non-English terms). (4) FN: crypto mentions outside scanned fields (phone calls, unindexed emails, external chat). (5) GDPR/CCPA scoping — scanning free-text is generally permitted under fraud-prevention lawful basis but should be documented. |
| **false_positive_qualitative** | (1) Cryptography/blockchain researchers whose lab descriptions or PI names include coin keywords — recurring FP on keyword matches; low volume, manageable with SOP. (2) Hex-identifier false positives — 40-char hex strings prefixed with `0x` that are not ETH addresses (e.g., SHA-1 hashes); [best guess: 1-5 hits per 10,000 orders]. (3) Biotech-token startups with names referencing "Token" or "Bio Token" — extremely rare. |
| **coverage_gaps** | (1) Obfuscated or non-English crypto references — an attacker aware of the scan trivially evades it; near-zero adversarial resistance. (2) Crypto references outside scanned fields — [best guess: 20-40% of customer-provider communication surface is unscanned] (phone, unindexed email, external chat, attachments). (3) MSA clause provides zero technical prevention — 100% of customers interact with it, but it contributes deterrence and legal recourse only, not detection. Clickwrap agreements are generally enforceable in US courts. (4) Ethereum regex FP on hex identifiers — low-rate noise. (5) Keyword FP from crypto researchers — [best guess: <0.5% of customer base, but recurring]. |
| **record_left** | Current MSA version with crypto-prohibition clause, per-customer click-through acceptance log (timestamp + IP + version). Per regex hit: matched-record snapshot in immutable audit log (persists even if original order is deleted). Reviewer disposition (pass/deny/escalate + rationale). Aggregate dashboard: hit counts per pattern, monthly trend. |
| **bypass_methods_known** | None. No in-corpus attacker stories stress this check. |
| **bypass_methods_uncovered** | None. No in-corpus attacker stories stress this check. |

## Section 2: Narrative

### What this check is and how it works

This idea combines a legal/administrative control with a thin technical detection layer. The first component is an explicit clause in the synthesis provider's Master Services Agreement or Terms of Service prohibiting customers from paying in cryptocurrency, stablecoins, or digital assets. The clause is presented at order-acceptance click-through and provides three forms of value: clear customer notice, legal grounds to terminate the relationship and refuse refund if a crypto payment is somehow received, and audit-trail evidence that the provider's stated policy prohibits crypto funding. The second component is a nightly regex scan over free-text order metadata — PO numbers, order notes, billing-instruction fields, and support-ticket bodies — searching for Bitcoin wallet addresses (P2PKH and Bech32 formats), Ethereum/EVM addresses, and coin-related keywords. Hits are routed to a four-category manual review triage.

### What it catches

No in-corpus attacker branch routes cryptocurrency to the synthesis provider, so this is a forward-looking defense-in-depth control rather than a primary block against known attack paths. The regex scan catches naive or accidental mentions of cryptocurrency in order metadata — a customer asking "Can I pay in BTC?" in an order note, or a wallet address pasted into a billing-instruction field. The MSA clause, while not technically blocking anything, provides the legal foundation that enables the sibling technical controls (m11-psp-config-audit, m11-crypto-onramp-denylist) to deny service with contractual backing. Together, the three M11 ideas form a layered defense: the MSA provides the policy statement, the PSP config audit prevents crypto payment methods from being enabled, and the BIN denylist catches crypto-debit cards.

### What it misses

The regex scan has near-zero adversarial resistance. An attacker aware of the scan can trivially evade it through obfuscation ("B*tc*in"), non-English terms, image-embedded wallet addresses, or encoded references. The scan only covers indexed text fields; an estimated 20-40% of customer-provider communication surface area (phone calls, unindexed emails, external-platform messages) is invisible to it. The MSA clause itself provides no technical prevention — it is a legal instrument, not a detection control. These limitations are by design: the idea is framed as defense-in-depth and audit-trail infrastructure, not as a standalone detection mechanism.

### What it costs

Runtime cost is effectively zero — a database regex scan processes thousands of records per second. Setup costs include legal review of the MSA clause (1-3 hours of outside counsel at $300-$500/hour, approximately $300-$1,500), roughly 4 hours of engineering time to build the scanner and hook it into the review queue, and a one-time historical sweep. Ongoing costs are dominated by reviewer time on false-positive hits, estimated at 10-60 minutes per week for a moderate-volume synthesis provider. The false-positive load is low and manageable: the primary sources are cryptography researchers whose lab descriptions trigger keyword matches (less than 0.5% of the customer base) and occasional hex-identifier false positives on the Ethereum address pattern.

### Operational realism

When a regex hit fires, the reviewer pulls the matched record and its surrounding context, then classifies it into one of four categories: a customer attempting to pay in crypto (deny with templated MSA-clause notice), a customer requesting a crypto refund (decline, refund to original card), a research mention (pass), or an internal note (pass, tag for trend analysis). A wallet address appearing in an unexpected field triggers an escalation to compliance. Near-zero true positives are expected under normal conditions. The audit trail includes the MSA version and click-through acceptance log, matched-record snapshots in an immutable log, reviewer dispositions, and an aggregate dashboard tracking hit counts per pattern and monthly trends.

### Open questions

The coverage research flagged that Gap 2's estimate of unscanned communication surface (20-40%) is a broad best guess with thin supporting evidence. Gap 3 (MSA provides no technical prevention) is arguably an architectural observation rather than a coverage gap in the traditional sense, but it is included for completeness so that policymakers understand the MSA clause's value is legal, not technical. The claim check found no broken URLs, mis-citations, or load-bearing overstatements. The GDPR/CCPA implications of scanning customer free-text fields under a "fraud prevention" lawful basis should be confirmed with counsel for providers operating in the EU/UK.

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 found no findings of any severity — no in-corpus attacker stories stress this check.
- **[unknown -- searched for] fields affecting policy implications:**
  - Obfuscation rate of crypto references in commercial order metadata (no data exists; searched without result)
  - B2B customer communication channel breakdown by medium (searched for text vs phone vs email breakdown without result; drives Gap 2 estimate)
  - Ethereum address regex false-positive rate against hex strings in databases (searched without result; drives Gap 4 estimate)
  - Cryptocurrency-related keyword prevalence among DNA synthesis customers (searched without result; drives Gap 5 estimate)
- **No [vendor-gated] fields.**
- **GDPR/CCPA scoping:** Scanning free-text customer notes is generally permitted under "fraud prevention" lawful basis, but EU/UK providers should document the scan purpose. This is a legal question requiring counsel confirmation.
- **06F minor flags:**
  - Gap 2 estimate (20-40% unscanned surface) has thin reasoning behind the [best guess] range
  - Gap 3 (MSA provides no technical prevention) is included as a coverage gap but is more accurately an architectural observation
