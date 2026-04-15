# Stage 2 Feasibility — Measure 02 — v2

Reviewing `01-ideation-measure-02-v2.md`.

## Verdicts

### Carried-forward PASS ideas (1–9, 12–15, 17–24)
All retain PASS. Concreteness and relevance unchanged from v1 feasibility; no new information would alter those verdicts. Listed for the record:

- **1** PASS, **2** PASS, **3** PASS, **4** PASS, **5** PASS, **6** PASS, **7** PASS, **8** PASS, **9** PASS, **12** PASS, **13** PASS, **14** PASS, **15** PASS, **17** PASS, **18** PASS, **19** PASS, **20** PASS, **21** PASS, **22** PASS, **23** PASS, **24** PASS.

### Revised ideas

#### 10. Tranco / Majestic Million (composite-only) — PASS
The revision constrains the role to a multiplier on already-fired flags, removing the standalone-soft-signal failure mode. Concrete (named lists). Relevance is now indirect-but-defined: it sharpens the cro-* and shell-* composite flags rather than firing on its own. Acceptable.

#### 11. GLEIF (restricted to high-coverage jurisdictions) — PASS
The revision narrows the population to entities where LEI coverage is genuinely high (EU/EEA/UK/SG/CH commercial entities), addressing the v1 critique that US small-LLC coverage is the wrong target. Now hits foreign-institution and EU-jurisdiction variants of the cro-* / shell-company branches. Concrete (GLEIF API). PASS.

#### 16. Google Workspace MX + verification-TXT fingerprint — PASS
Replaces the v1 best-guess endpoint with concrete public artifacts (`google-site-verification` TXT, `google._domainkey` selector, `_spf.google.com` include, `aspmx.l.google.com` MX suffix). These are real, well-known DNS artifacts. The idea is now distinct from idea 6 in that 6 classifies the mail provider; 16 fingerprints Google Workspace tenancy specifically and uses the verification-TXT as a tenancy-age proxy. PASS.

### New idea

#### 25. Institutional-side DNS / DKIM / mail-flow change detection — PASS
Concrete (SecurityTrails DNS-history API, Farsight DNSDB, DomainTools Iris named). Targets a real attacker-story gap (dormant-account-takeover Bypasses A/B/C) that v1 feasibility surfaced and v1 ideation did not address. The bypass excerpts from `dormant-account-takeover` describe exactly the kind of mail-flow / mailbox-provisioning changes this idea would detect at the DNS layer. Operationally heavy (requires per-customer institution monitoring + an out-of-band IT contact channel) but that is a stage-4 cost question, not a stage-2 concreteness/relevance question. PASS.

## Gaps

No new attacker-class gaps surfaced relative to v1.

- **unrelated-dept-student**, **insider-recruitment**, **lab-manager-voucher**, **bulk-order-noise-cover** remain structurally out of M02's reach (the on-record customer is the real institutional mailbox holder); no M02 idea can address them and no v3 iteration should try.
- **dormant-account-takeover Bypass D** (institutional VPN egress) is partially covered by idea 19 (Sift/Sardine/Arkose, which the branch itself names as the tools the attacker is routing around) and by idea 24 (federated step-up at SOC order time, which a VPN-egress attacker still has to satisfy). Acceptable residual.
- **foreign-institution non-Anglophone coverage** is a stage-6 BOTEC concern, not a missing-idea concern. Ideas 8, 17, 20, 21, and now 11 cover the dimension; the remaining question is per-region completeness, which stage 6 will quantify.

## Stop signal

Zero ideas returned REVISE or DROP in v2. No new uncovered attacker classes. The four structurally out-of-scope branches are explicitly acknowledged and require no further M02 ideation.

STOP: yes
