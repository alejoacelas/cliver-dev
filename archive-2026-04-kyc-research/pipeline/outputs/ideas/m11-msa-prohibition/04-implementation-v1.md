# m11-msa-prohibition — implementation v1

- **measure:** M11 (payment-no-crypto)
- **name:** MSA prohibition + order-text crypto-reference scan
- **modes:** A (administrative)
- **summary:** Two complementary controls. (1) The customer-facing Master Services Agreement / Terms of Service includes an explicit clause prohibiting cryptocurrency as a payment method, naming wallet-address transmission, on-ramp routing, and stablecoin transfers. (2) A periodic regex scan over free-text order metadata (PO numbers, order notes, internal messages, billing-instruction fields) for cryptocurrency wallet-address patterns (BTC, ETH) and coin tickers/keywords. Hits route to manual review.
- **attacker_stories_addressed:** crypto-funding. Per the measure-11 attacker mapping, no in-corpus branch routes crypto to the synthesis provider, so this is a defense-in-depth + audit-trail control rather than a primary block.

## external_dependencies

- **Legal review** of the MSA / ToS language (one-time, then periodic). Counsel costs.
- **Internal regex scanner** over the order-metadata database. No external API.
- **Reviewer queue** for textual hits.

## endpoint_details

**MSA / ToS leg:**

- Implementation venue: the synthesis provider's customer-facing terms-of-service page and order-acceptance click-through. Standard contract clause approach.
- A reference example of how cryptocurrency payment terms are written contractually [source](https://contractnerds.com/simplifying-cryptocurrency-payment-clauses/), [source](https://www.cobrief.app/resources/contract-clause-library/cryptocurrency-clause-copy-customize-and-use-instantly). Most published clauses are *permissive* (defining what is allowed); a *prohibitive* clause is structurally simpler — a one-sentence "Customer agrees not to attempt to pay for any Order in cryptocurrency, stablecoins, or any other digital asset, and Provider will not accept such payment."
- Auth model: N/A (legal text). Rate limits: N/A. ToS constraints: this *is* the ToS.
- **Enforcement value:** the clause itself does not stop a customer attempting to pay in crypto; it provides (a) clear customer notice, (b) legal grounds to terminate the customer relationship and refuse refund if a crypto payment is somehow received, and (c) audit-trail evidence that the provider's stated policy is anti-crypto. The technical block is provided by sibling ideas (m11-psp-config-audit, m11-crypto-onramp-denylist).

**Regex scan leg:**

- Scope: free-text fields in the order/customer database — PO numbers, order notes, billing-instruction memo, internal CRM notes, customer support email subject/body where indexed.
- Cadence: nightly batch over the previous day's records, plus a one-time historical sweep on first deployment.
- Patterns:
  - **Bitcoin (legacy P2PKH/P2SH):** `\b[13][A-HJ-NP-Za-km-z1-9]{25,34}\b` [source](https://ihateregex.io/expr/bitcoin-address/)
  - **Bitcoin (Bech32 SegWit):** `\bbc1[ac-hj-np-z02-9]{11,71}\b`
  - **Ethereum (and EVM-compatible chains, including USDC/USDT on ETH):** `\b0x[a-fA-F0-9]{40}\b` [source](https://gist.github.com/MBrassey/623f7b8d02766fa2d826bf9eca3fe005)
  - **Coin keywords:** case-insensitive word match for `bitcoin`, `BTC`, `ethereum`, `ETH`, `USDC`, `USDT`, `Tether`, `stablecoin`, `wallet address`, `seed phrase`, `Coinbase`, `Binance`, `Kraken`, `MoonPay`, `Ramp Network` (note: `Coinbase` may collide with `Coinbase Card` in the m11-crypto-onramp idea — distinguish in reviewer SOP).
- Regex caveat: the canonical references warn against using regex alone to *validate* a wallet address (no checksum check) [source](https://mokagio.github.io/tech-journal/2014/11/21/regex-bitcoin.html). For *detection* of references in free-text, regex is sufficient because the goal is to surface for human review, not to validate.
- Implementation venue: a scheduled job in whatever data warehouse / OLTP store holds the order metadata. Trivial in SQL with regex extensions or in Python with `re`.
- Auth: database read credential. Rate limits: none. ToS constraints: none beyond the provider's own data-handling policies (and any GDPR/CCPA constraints on scanning customer free-text fields).

## fields_returned

- For each MSA event: timestamp + customer ID + ToS version accepted (logged at click-through).
- For each regex hit:
  - field name where the match occurred
  - matched substring (redacted in the SOP if it's a wallet address — store the hit, but don't propagate it widely)
  - order ID and customer ID
  - which pattern matched (BTC P2PKH / Bech32 / ETH / keyword)
  - match context (±50 characters)
  - timestamp of scan and timestamp of original record creation

## marginal_cost_per_check

- **Per-check runtime cost:** ~$0. Database scan with regex extensions runs over thousands of records per second.
- **Setup cost:**
  - Legal review of the MSA clause: 1–3 hours of outside counsel, ~$300–$1,500 [best guess: outside counsel rates of $300–$500/hr × 1–3 hours; small US firms].
  - Engineering: ~4 hours to write the scanner, schedule the job, hook into the review queue.
  - Historical sweep: a few hours of compute on first run.
- **Ongoing cost:**
  - Reviewer time on hits: dominated by false-positive review (see below). Plausibly 10–60 minutes/week for a moderate-volume synthesis provider.

## manual_review_handoff

When `order_text_crypto_reference` fires:

1. Reviewer pulls the matched record, the field, the surrounding context.
2. Reviewer classifies:
   - **Customer-attempting-payment** (e.g., note from customer "Can I pay in BTC?"): Reply with the templated MSA-clause notice; deny the order if not redirected to fiat.
   - **Customer offering wallet to receive refund:** Decline; refund must go to the original card.
   - **Research mention** (e.g., a sequence whose context document references "blockchain" or "cryptocurrency" — false positive class): Pass.
   - **Internal note** (an employee referenced a coin in customer support correspondence): Pass; tag for trend analysis.
3. If the hit was a wallet address in an unexpected field, escalate to compliance — receiving a wallet-address transmission, even unsolicited, is itself a notable event.
4. Log the disposition.

SOP target: ≤5 minutes per case; near-zero true positives expected.

## flags_thrown

- `order_text_crypto_reference` — regex hit on order metadata. Reviewer triages.
- `msa_crypto_clause_violated` — set when a customer hit goes through to denial under the MSA crypto clause; this is the auditable event that demonstrates the clause's enforcement value.

## failure_modes_requiring_review

- **False positive: legitimate research context.** A customer ordering sequences for blockchain-cryptography research (not biological — but academic projects on cryptographic primitives sometimes include the words "Bitcoin" or "Ethereum" in lab descriptions). Reviewer classifies as research.
- **False positive: biotech-token startup.** A real biotech company whose name or product references "Bio Token" or similar. Plausible but rare.
- **False negative: obfuscated reference.** "B*tc*in", `b1tc01n`, image attachments, foreign-language coin names. Regex over text won't catch these.
- **False negative: reference outside the scanned fields.** Customer mentions crypto in a phone call or in an email field that's not indexed. Mitigation: extend scan to support-ticket bodies.
- **GDPR/CCPA scoping.** Scanning free-text customer notes is generally permitted under "fraud prevention" lawful basis, but providers in EU/UK should document the scan purpose.

## false_positive_qualitative

- Researchers in cryptography, distributed systems, computer security whose lab descriptions or PI names include coin keywords.
- Customers whose institutional name happens to include matching tokens (e.g., the word "Coinbase" in a non-crypto context — rare).
- Random hex strings of length 40 prefixed with `0x` that are not Ethereum addresses (e.g., a hash, a hex-encoded identifier in a PO number). The Ethereum regex has a structural false-positive rate against any 40-char hex token preceded by `0x`.
- Bech32 false positives are essentially zero (the `bc1` prefix plus 11+ chars from the restricted alphabet rarely occurs in unrelated text).

## record_left

- The current MSA version with the crypto-prohibition clause, plus the customer's per-order acceptance log (timestamp + IP + clickwrap version).
- For each regex hit: the matched-record snapshot stored in an immutable audit log (so that even if the original order is deleted/archived, the hit and disposition remain).
- Reviewer disposition: pass / deny / escalate, plus rationale.
- Aggregate dashboard: count of hits per pattern, monthly trend.

## Sources

- [Contract Nerds — simplifying cryptocurrency payment clauses](https://contractnerds.com/simplifying-cryptocurrency-payment-clauses/)
- [CoBrief — cryptocurrency clause template library](https://www.cobrief.app/resources/contract-clause-library/cryptocurrency-clause-copy-customize-and-use-instantly)
- [iHateRegex — Bitcoin address regex](https://ihateregex.io/expr/bitcoin-address/)
- [GitHub gist — match crypto wallet addresses (BTC, ETH, others)](https://gist.github.com/MBrassey/623f7b8d02766fa2d826bf9eca3fe005)
- [mokag.io — regex Bitcoin caveats (no checksum check)](https://mokagio.github.io/tech-journal/2014/11/21/regex-bitcoin.html)
