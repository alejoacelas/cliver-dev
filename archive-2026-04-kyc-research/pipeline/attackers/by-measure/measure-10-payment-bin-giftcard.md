# Measure 10 — payment-bin-giftcard

## No relevant stories found

**What this measure does.** SOC-only BIN check on the purchasing card to identify gift cards (and other obscured-identity payment instruments). Flag triggers when the payment method can be used to obscure identity.

**What I searched for.** I read the Matrix A "Measure 5 — Payment integrity" and Matrix B payment-related sections of all 19 attacker source files in `attackers/source/`, plus a full-tree grep for `crypto`, `gift card`, `gift-card`, `prepaid`, `bitcoin`, `monero`, and for `name-match` / `cardholder name` / `billing address`.

**What I found.** No branch routes the synthesis-provider payment through a gift card. The closest payment instruments anywhere in the corpus are:
- Real personal credit cards in the attacker's own name (visiting-researcher, inbox-compromise, unrelated-dept-student, foreign-institution).
- Real LLC business bank/card accounts opened under real KYC (shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network, dormant-domain).
- Inherited institutional POs / P-cards (account-hijack, credential-compromise, dormant-account-takeover, unrelated-dept-student, lab-manager-voucher, insider-recruitment, visiting-researcher).
- One mention of a "Prepaid virtual card" (inbox-compromise Method 5.2: "Cost: $5–$50 setup + 3–5% top-up fee. Attacker trace: Lighter KYC on prepaid products per FinCEN prepaid access rule, but still subject to subpoena.") — this is a prepaid debit card, not a gift card, and the BIN check described in measure 10 would flag it as a separate (non-gift-card) prepaid product. The branch's primary payment method is the attacker's own real credit card; the prepaid variant is listed as a third sub-option and is not the load-bearing path.
- Foreign-institution Method 3 lists a "Prepaid debit card in real name" with the same framing — non-gift-card and not load-bearing.

Crypto appears only as an *attacker-internal* payment instrument (buying infostealer logs, dark-web tooling, expired-domain stealer-credential markets in dormant-domain Bypass B2 and credential-compromise) — never as a method of paying the synthesis provider. Crypto-as-synthesis-payment is the subject of measure 11, not measure 10.

**Why none of these are relevant.** A story is relevant only if its bypass methods would have to defeat, evade, or pre-empt this specific measure. Measure 10 fires only on a BIN belonging to a gift card. None of the corpus's 19 branches has a bypass method whose plan involves placing a gift-card BIN in front of the synthesis provider, so no story stresses the measure. The prepaid-virtual-card sub-option in inbox-compromise sits adjacent to the measure (prepaid BINs are in the same general "obscured identity" family that the measure's flag-trigger language gestures at), but the measure as written checks specifically for gift cards via BIN, not for all prepaid BINs, so even that sub-option is not on-target.

If a future ideation pass widens measure 10 from "gift card BIN" to "any prepaid / obscured-identity BIN," the inbox-compromise prepaid-virtual-card option and the foreign-institution prepaid-debit-card option would become marginally relevant.
