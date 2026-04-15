# Coverage research: Lookalike / homoglyph institutional-domain detector

## Coverage gaps

### Gap 1: ROR records without populated domain fields
- **Category:** Research institutions in ROR whose records do not include a `domains` field, making them invisible to domain-based matching. The check can only detect lookalikes of institutions whose canonical domain is in the ROR corpus.
- **Estimated size:** The implementation estimates ~30% of ROR records lack the `domains` field ([best guess from the implementation's own failure_modes section]). ROR has 120,000+ records across 220 countries ([source](https://ror.org/)). [best guess: ~36,000 institutions in ROR have no domain listed. These institutions cannot be protected by the lookalike detector — an attacker mimicking one of them with a homoglyph domain would not trigger any flag.]
- **Behavior of the check on this category:** no-signal (the target institution is not in the comparison corpus)
- **Reasoning:** The check works by comparing the customer's domain against the ROR domain corpus. If the real institution has no domain in ROR, there is nothing to match against.

### Gap 2: Institutions not in ROR at all
- **Category:** Legitimate institutions that are not in the Research Organization Registry — private companies, CROs, small biotechs, government agencies, and non-research entities that order DNA synthesis.
- **Estimated size:** ROR covers 120,000+ organizations, but the total number of entities that buy gene synthesis is far broader. The gene synthesis market is ~46% commercial/industry ([source](https://www.novaoneadvisor.com/report/us-gene-synthesis-market) — inverse of 54% academic+government). Most commercial entities (biotechs, CROs, pharma companies) are not in ROR. [best guess: 40–60% of synthesis customers are at institutions not represented in ROR.]
- **Behavior of the check on this category:** no-signal (attacker spoofing a commercial entity's domain is not detected because the commercial entity has no ROR record)
- **Reasoning:** ROR is a research-organization registry. It does not cover the commercial sector. A homoglyph of "twistbioscience.com" or "genscript.com" would not be caught unless those companies happen to be in ROR.

### Gap 3: Internationalized domain names (IDN) and punycode edge cases
- **Category:** Institutions whose official domains use non-ASCII characters (IDN domains), or attackers using IDN/punycode variations that confuse the skeleton and Levenshtein comparisons.
- **Estimated size:** [best guess: a small fraction (<5%) of institutional domains use non-ASCII characters, concentrated in CJK and Cyrillic-script countries. However, the attack surface is asymmetric — an attacker can register an IDN domain that looks like an ASCII domain in certain rendering contexts.]
- **Behavior of the check on this category:** weak-signal (the implementation notes "needs both forms checked" for IDN/punycode but the failure mode is subtle — a punycode domain like `xn--exmple-cua.edu` might not trigger the Levenshtein or skeleton match against `example.edu` if the conversion is not handled correctly)
- **Reasoning:** The implementation identifies this as a failure mode but does not detail the IDN handling pipeline.

### Gap 4: Legitimate new domains that resemble established institutions
- **Category:** Newly registered domains for legitimate new organizations whose names happen to be within Levenshtein ≤2 of an established institution's domain, or whose confusable skeleton matches.
- **Estimated size:** [best guess: this is a low-frequency but high-impact false positive. A new biotech named "ExampleBio" registering "examplebio.com" near "example.edu" would trigger `domain_levenshtein_le_2`. The frequency depends on how many new biotech startups choose names close to established institutions — perhaps 1–3% of new registrations.]
- **Behavior of the check on this category:** false-positive (`domain_levenshtein_le_2` or `domain_dnstwist_match` fires for a legitimate entity)
- **Reasoning:** The check correctly fires and routes to manual review (callback verification). The false-positive cost is the human review time and potential order delay for the legitimate customer.

### Gap 5: crt.sh reliability and CT log coverage limitations
- **Category:** Domains whose certificate transparency history is incomplete or where crt.sh queries time out, making the "first cert <90 days ago" signal unavailable.
- **Estimated size:** [best guess: crt.sh covers the major public CT logs. However, some CAs (particularly in China and Russia) have historically had incomplete CT logging. The implementation notes query timeouts on common SAN strings. Perhaps 5–10% of lookups produce incomplete or timed-out CT data.]
- **Behavior of the check on this category:** weak-signal (the `domain_recently_issued_cert` flag cannot fire, so the check relies only on the string-matching flags without the age-corroborating signal)
- **Reasoning:** The "recently issued cert" signal is the key distinguisher between a long-standing legitimate similar domain and a freshly set-up homoglyph. Without it, all string-matching flags are softer.

### Gap 6: Subdomain and path-based impersonation
- **Category:** Attackers who do not register a lookalike TLD but instead use a subdomain of a domain they control (e.g., `harvard.attacker.com`) or a path-based impersonation (`attacker.com/harvard`). The check operates on the customer's email domain, not on arbitrary URLs.
- **Estimated size:** [best guess: this is a different attack vector that the check does not address by design. The check targets domain-level impersonation only. Subdomain impersonation via email would require the attacker to control the parent domain's MX records, which limits it to phishing rather than institutional impersonation in a KYC context.]
- **Behavior of the check on this category:** no-signal (not in scope)
- **Reasoning:** The check matches the customer's email domain against ROR domains. A customer claiming to be from Harvard but using `harvard@attacker.com` is not detected by domain-level matching. However, a well-designed screening workflow would flag non-institutional email domains separately (e.g., under m02 measures).

## Refined false-positive qualitative

1. **Legitimate spinouts/joint institutes** (original list) — Broad Institute vs Harvard/MIT. `domain_levenshtein_le_2` or `domain_dnstwist_match` may fire. Mitigated by callback verification.
2. **Translated/transliterated foreign institutional domains** (original, Gap 3) — romanization of a Japanese university domain close to a US institution by accident.
3. **Newly created domains for legitimate young biotechs** (original, Gap 4) — `domain_recently_issued_cert` + string match = hard hold for a legitimate new entity.
4. **Universities with regional campus domain variants** (original) — `med.example.edu` vs `example.edu`. May or may not trigger depending on how domain parsing handles subdomains.
5. **Hyphenation variants chosen by real institutions** (original) — `example-research.org` vs `exampleresearch.org`. Likely triggers `domain_dnstwist_match` (hyphenation is a dnstwist fuzzer).

## Notes for stage 7 synthesis

- The check is structurally limited to protecting institutions *in ROR with populated domain fields*. This is roughly 70% of 120,000 organizations = ~84,000 institutions. Institutions not in ROR (most commercial entities) and ROR records without domains (~36,000) are outside coverage.
- The check is defense-shaped: it protects real institutions from impersonation, not screens arbitrary customers. An attacker who uses a domain that does not resemble any known institution (e.g., a plausible-sounding but novel name like "novagen-research.com") is not detected.
- The strongest signal is the combination of string match + recently-issued cert. Without the cert-age signal, the check produces many soft flags that require human review.
- This idea pairs naturally with m02 measures (domain age, RDAP) and m18-companies-house-charity (legal existence of the entity behind the domain).
