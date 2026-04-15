# 4C claim check — m20-voucher-idv v1

## Per-claim findings

- **Stripe Identity API guide / reference / object** — all resolve and document the create-session, retrieve-session, webhook flow, and the schema fields cited. **No flag.**
- **Stripe Identity billing FAQ** — resolves; supports the "first 50 verifications free" claim. The exact post-free per-call price is not on this URL (it lives on the live pricing page). The doc's vendor-gated marker is appropriate. **No flag.**
- **Jumio Privacy & Trust Center** — resolves; mentions IAL2 certification context. Slightly weaker primary source than ideal; the Onfido/Entrust blog explicitly states Jumio is IAL2-certified by Kantara. Acceptable. **No flag.**
- **Onfido/Entrust IAL2 blog** — resolves; supports the IAL2 certification claim for both Jumio (mentioned) and Entrust/Onfido. **No flag.**
- **Hyperverge / Finexer pricing pages** — resolve; both are third-party blogs not vendor sources but consistent with the $1.50–$5 band. The doc correctly marks the band as `[vendor-gated]`. **No flag.**
- **GSA Login.gov IAL2 announcement** — resolves; supports the October 2024 IAL2 certification by Kantara. **No flag.**
- **Login.gov our services** — resolves; supports federal-partner-only model. **No flag.**
- **ID.me on NIST IAL2** — resolves; supports IAL2/AAL2 Kantara certification. **No flag.**
- **NIST SP 800-63A IAL2 remote proofing** — resolves; canonical source for IAL2 requirements. **No flag.**

## Soft flags

- The "$1.50/check" Stripe Identity rate cited as "best public estimate" is rough; the doc could weaken to "post-free pricing per the Stripe pricing page" without losing information. → `OVERSTATED` (mild).
- Persona's IAL2 status is genuinely murky. The doc's [unknown] is appropriate; for tightening, Persona has historically published a "Persona Trust Center" page worth checking. `UPGRADE-SUGGESTED`.

**Verdict:** REVISE (cosmetic)
