# 4C claim check — m20-live-video-attestation v1

Spot-checked the cited URLs and the four 4F-flagged claims.

## Per-claim findings

- **Sumsub Video Identification page** — URL resolves; it is the product page for Sumsub's agent-assisted video KYC. Does NOT publish per-call pricing or rate limits, consistent with the doc's `[vendor-gated]` marker. **No flag.**
- **Ondato Video Identity Verification** — Resolves to Ondato product page describing live-agent video calls with biometrics and ID checks; supports the doc's external_dependencies claim. **No flag.**
- **Identomat Video KYC** — Resolves; supports the API/audit-log claim. **No flag.**
- **Shufti Pro 2025 Video KYC blog** — Resolves. The "5–10 years audit log retention" claim is plausibly drawn from this article, though Shufti's actual retention may depend on contract; recommend the doc weaken to "audit log XML, retention configurable per contract; Shufti's marketing references multi-year retention." → `OVERSTATED` (mild).
- **KYCAID Live Video Verification** — Resolves; supports product existence. **No flag.**
- **Facia.ai** — Resolves. The ">90% accuracy on live video" claim is paraphrased from vendor marketing; vendor-self-reported, not independent. Recommend doc add `[vendor self-reported, no independent benchmark]`. → `OVERSTATED` (mild).
- **Sensity AI KYC use case** — Resolves; supports the existence claim only. **No flag.**
- **Jumio pricing overview (Hyperverge blog)** — Resolves. Third-party blog is not the strongest source for "Jumio uses custom pricing", but the underlying claim is widely corroborated and Jumio has no public price page. **No flag.**
- **Au10tix Onfido competitors page** — Competitor blog. Same caveat; underlying claim (Onfido custom pricing) is correct. **No flag.**

## Summary of recommended fixes (low-priority)

1. Soften Shufti retention claim to "vendor marketing references multi-year retention; exact term contract-dependent."
2. Annotate Facia >90% as vendor self-reported.

Neither of these is structural; document is fundamentally accurate.

**Verdict:** REVISE (cosmetic only — both fixes are one-liners; not worth a v2 unless other issues stack up)
