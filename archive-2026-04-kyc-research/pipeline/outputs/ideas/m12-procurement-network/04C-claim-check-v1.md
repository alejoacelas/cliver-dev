# 04C claim check — m12-procurement-network v1

Verifying citations from `04-implementation-v1.md`.

## Claim-by-claim

1. **SAM.gov Entity Management API at api.sam.gov, free API key, 10 req/day public tier.**
   - URL: https://open.gsa.gov/api/entity-api/
   - Snippet observed in stage 4 search: "you'll need an API key… free SAM.gov account, generate a key, and get up to 10 requests/day for the public tier."
   - Verdict: SUPPORTED. Note: published rate-limit values for SAM.gov tiers can change; should re-verify before production. Mark as STALE-RISK but not currently broken.

2. **JAGGAER advertises a global supplier network of 13M+ pre-validated suppliers.**
   - URL: https://www.jaggaer.com/solutions/supplier-network
   - Snippet observed: "access to a global community of over 13 million pre-validated suppliers."
   - Verdict: SUPPORTED.

3. **PaymentWorks: suppliers maintain one account across all PaymentWorks customer institutions.**
   - URL: https://www.paymentworks.com/ and https://procurement.fsu.edu/faqs/paymentworks-faqs
   - Snippet observed: "a supplier can manage their account information across all of their various customers."
   - Verdict: SUPPORTED.

4. **Jaggaer registration takes ~20 minutes per institution.**
   - URL: https://procurement.iu.edu/sdm/index.html (and similar university SDM pages)
   - Verdict: WEAKLY-SUPPORTED. The "20 minutes" figure is consistent with typical university Jaggaer SDM pages but the specific number is paraphrased. Recommend reframing as `[best guess: 15–30 min, based on typical university SDM onboarding pages]`.

5. **PaymentWorks used by ~150+ US universities.**
   - Verdict: WEAKLY-SUPPORTED. Stage 4 search returned named adopters (FSU, UVA, Arkansas, RIT, Drexel) but not a roll-count. The "150+" figure should be marked `[best guess: ≥150 based on adopter lists publicly visible from the named universities and PaymentWorks marketing copy]` or removed. Suggested fix: weaken to "many US R1 universities, named adopters include FSU, UVA, Arkansas, RIT, Drexel."

6. **JAGGAER widely deployed at US public universities and US-state procurement.**
   - URLs cited: https://procurement.iu.edu/sdm/index.html, https://www.eku.edu/in/guides/jaggaer/, https://doas.ga.gov/state-purchasing/team-georgia-marketplace/jaggaer-sourcing-director-for-colleges-and-universities
   - Verdict: SUPPORTED.

## Flags

- Two WEAKLY-SUPPORTED claims (the "20 minutes" and "~150+ universities" numbers) — should be weakened in v2 if revised, but neither is structurally wrong.
- No BROKEN-URL.
- No MIS-CITED.

## Verdict

PASS (two minor weakenings recommended; not blocking).
