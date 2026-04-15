# Measure 11 — payment-no-crypto

## No relevant stories found

**What this measure does.** Do not accept cryptocurrency for payment. Applies to all orders. Flag triggers when the customer attempts to pay with crypto; follow-up is deny.

**What I searched for.** I read the Matrix A "Measure 5 — Payment integrity" sections of all 19 attacker source files in `attackers/source/`, plus a full-tree case-insensitive grep for `crypto`, `bitcoin`, `monero`, `gift card`, and `prepaid`.

**What I found.** Crypto appears in the corpus exclusively as an *attacker-internal* payment instrument used to buy upstream tooling — never as a method of paying the synthesis provider. The four mentions are:

- **credential-compromise** (M1 method 1.2): the attacker pays with cryptocurrency to buy infostealer logs on a dark-web marketplace ("Same PII in IDV records as the SIM-swap method, plus a marketplace transaction in cryptocurrency. No SIM-swap carrier record.").
- **dormant-domain** (M2 Bypass B2 — Stolen cloud credentials): "B2: crypto payment trail to stealer-log marketplace; cloud provider's KYC record is a mismatched victim identity. Neither sub-variant leaves a registrar trace at the parent university."
- **inbox-compromise** (M2 method 1): "deploys a Tycoon 2FA or similar adversary-in-the-middle phishing kit against MFA-protected institutional webmail, using lookalike domains via crypto-accepting registrars."
- **gradual-legitimacy-accumulation** (M5): explicit negation — "Payments are by ACH or business credit card; the billing address matches the registered address; no crypto or gift cards."

In every other branch the synthesis provider is paid with one of: real personal credit card in the attacker's name, real LLC business bank account / card, inherited institutional PO / P-card, or international wire. No branch's bypass method would have to defeat or evade a "no crypto accepted" rule at the synthesis provider, because no branch routes crypto to the synthesis provider in the first place.

**Why none of the four mentions are relevant.** Measure 11 governs the synthesis-provider-side payment instrument. Crypto purchases of upstream tooling (infostealer logs, stolen cloud creds, lookalike domain registrations, AitM phishing kits) happen on third-party criminal marketplaces and are completely outside the synthesis provider's payment surface. A "deny crypto" rule at the synthesis provider does no work against any of these paths because none of them ever submit crypto to the synthesis provider.

The structural reason this measure is unstressed is that every branch in the corpus uses real legal identity at the synthesis provider, and the financial-side trace cost the attacker accepts everywhere is "real card / bank under real name" — substantially heavier than crypto and with no operational reason to switch. If a future branch wanted to *prefer* crypto (e.g., to avoid the bank-KYC commitment), measure 11 would deny it; in the current corpus, no branch wants to.
