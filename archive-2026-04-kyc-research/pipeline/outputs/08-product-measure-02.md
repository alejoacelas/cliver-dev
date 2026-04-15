# Measure 02 — Email-Affiliation-WHOIS: Product Prioritization

## Selected stack

### 1. Disposable / free-mail blocklist (`m02-disposable-blocklist`)

The cheapest and simplest gate in the stack. A static hashset lookup at signup hard-rejects disposable mailbox domains (Mailinator, 10minutemail, etc.) with near-zero false positives, and soft-flags free-mail domains (Gmail, Yahoo) when paired with an institutional affiliation claim. Although none of the 19 modeled wg attacker branches use disposable or free-mail addresses, this check addresses a lower-sophistication tier that the threat model does not cover but that real-world providers encounter regularly. It is fully automated on the disposable path, costs $0 marginal, takes one day to set up, and requires no external API key or vendor contract. It serves as the outermost filter, catching the laziest attempts before more expensive checks run.

### 2. ROR institutional domain match (`m02-ror-domain-match`)

The primary positive-signal generator for the academic segment. By querying the free, public ROR API for the customer's claimed institution and comparing the email apex domain against the record's listed domains and website, this check produces a high-confidence fast-pass (`ror_domain_match`) that lets ~30-40% of academic orders skip further manual affiliation review. It reliably catches typosquat and lookalike-domain attacks where the misspelled domain does not appear in the legitimate institution's ROR record. The check costs $0, requires no authentication, and runs in ~50ms. Its main limitation — that genuine-institutional-email attackers receive a clean pass — is structural and must be addressed by other measures (14, 16, 19), not by other M02 ideas. Within M02, ROR provides the institutional-verification backbone that no other selected idea offers.

### 3. RDAP/WHOIS domain age + registrant (`m02-rdap-age`)

The core domain-freshness signal. By querying the free, public RDAP protocol for registration date, transfer events, and registrant status, this check imposes a minimum 12-month lead-time cost on every purpose-built-organisation attacker and directly catches drop-catch domain reanimation via the `domain_recent_transfer` flag. It catches typosquats (fresh registration), shell-nonprofits in their pre-aging window, and the initial phase of at least five other attacker stories. The registrant-redaction dimension should be dropped (~89% of gTLDs are redacted, making it noise), but domain age plus transfer recency are strong, interpretable signals that compose cleanly with every other selected idea. $0 marginal cost, one engineer-day setup.

### 4. MX / M365 / Workspace tenant + SPF/DMARC (`m02-mx-tenant`)

The mail-infrastructure fingerprint check. By resolving MX, SPF, and DMARC records and probing Microsoft's GetUserRealm endpoint, this check classifies the email domain's hosting backend and flags inconsistencies with the claimed affiliation — a claimed university with no DMARC, a freshly minted M365 tenant with a brand mismatch, or self-hosted mail on a domain claiming institutional backing. It catches the self-hosted variant of dormant-domain attacks and typosquats. Critically, it covers the commercial segment that ROR cannot reach: for small biotechs and CROs, the presence or absence of professional mail infrastructure (Workspace/M365 with proper SPF/DMARC) is one of the few available signals. The `dmarc_p_none` flag should fire only in combination with another risk signal to avoid flooding the queue (~50% of .edu domains are at `p=none`). $0 marginal cost, 1-2 engineer-days setup.

## Dropped ideas

- **Inbox round-trip verification (`m02-inbox-roundtrip`)** — Every modeled attacker passes by construction (they control the inbox). Value is limited to a baseline gate and audit artifact. Most providers already have this or an equivalent. If not present, add it as table-stakes infrastructure rather than as part of the M02 screening stack; it does not compose with the other checks to produce incremental signal.

- **Wayback first-seen + content history (`m02-wayback`)** — Its unique signal (dormancy-gap + content-pivot detection) is largely redundant with RDAP transfer-date, which catches the same drop-catch pattern more reliably and without an LLM classifier dependency. The content-pivot classifier is unspecified in precision/recall, 20-30% of biotech sites are SPA-rendered (degrading the classifier), and 5-10% of institutional domains block Wayback via robots.txt. The marginal value over RDAP transfer-date does not justify the added complexity and calibration burden.

- **Dangling-DNS / drop-catch detector (`m02-dangling-dns`)** — Narrowly scoped to dormant-domain Bypasses A and B, which RDAP transfer-date already catches (Bypass A) and which affects a small fraction of orders. The high false-positive base rate against legitimate universities (empirically, major US universities routinely have exploitable dangling DNS), the 1-2 engineer-week setup cost, the need for reviewer training to distinguish sloppy DNS hygiene from active takeover, and the absence of signal for small institutions outside Tranco top-1M make this a poor cost-benefit tradeoff. Its unique contribution (subdomain takeover detection) is real but too narrow and noisy for a general screening pipeline.

## How the selected ideas compose

The four selected checks form a layered pipeline that covers distinct customer segments and attacker tiers:

1. **Disposable blocklist** runs first as a zero-cost, zero-latency gate that eliminates the lowest-effort signups before any downstream check executes.
2. **ROR domain match** runs next for any customer claiming institutional affiliation, producing either a fast-pass (domain match) or a soft flag (domain mismatch / no record) that routes to manual review. This is the primary signal for the academic segment (~54% of customers).
3. **RDAP domain age** runs on every order regardless of segment. It catches fresh and recently transferred domains across both academic and commercial customers. When `domain_recent_transfer` fires alongside `ror_domain_mismatch`, the combined signal is high-confidence evidence of dormant-domain reanimation. When `domain_age_lt_12mo` fires alongside an `ror_no_record`, it distinguishes genuinely new entities from established ones.
4. **MX-tenant check** runs on every order and provides the infrastructure-consistency layer. For commercial customers outside ROR's coverage, MX/SPF/DMARC/tenant signals are the primary affiliation-plausibility check. For academic customers, MX-tenant confirmation reinforces or contradicts the ROR result.

The four checks share no external dependencies (ROR API, RDAP, DNS, and static lists are all independent), cost $0 in aggregate marginal cost, and require approximately 4-6 engineer-days total to implement. Each check's flags are interpretable independently but gain strength in combination: a domain that is young (RDAP), has no ROR record, uses generic shared hosting (MX-tenant), and was submitted with a free-mail address (blocklist) is a far stronger signal than any single flag alone.
