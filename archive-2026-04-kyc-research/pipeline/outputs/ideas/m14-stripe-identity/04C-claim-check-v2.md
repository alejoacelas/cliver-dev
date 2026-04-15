# 04C Claim check — m14-stripe-identity v2

Claims carried forward from v1 (previously verified or accepted): Stripe Identity pricing $1.50, Stripe API auth model, VerificationSession API structure, NIST 800-63A IAL2 reference. All PASS.

New claims in v2:

- **"Stripe Identity exposes an Insights system with Level and Label insights"** — confirmed by [Stripe Identity Insights docs](https://docs.stripe.com/identity/insights): "Level insights provide a computed level, which is a score that translates to low, elevated, or high" and "Label insights provide a binary value of being either present or absent." PASS.

- **"Stripe Insights can be used to assist with manual reviews"** — confirmed by same source: "These insights are more nuanced than the top-level verification decisions, and can be used to assist with manual reviews or customer support processes." PASS.

- **"Stripe selfie checks look for distinguishing biological traits such as face geometry"** — confirmed by [Stripe verification checks — selfie](https://docs.stripe.com/identity/verification-checks?type=selfie): "Selfie checks look for distinguishing biological traits, such as face geometry." PASS.

- **"Jumio achieved ISO/IEC 30107-3 Level 2 compliance"** — confirmed by [Jumio press release](https://www.jumio.com/about/press-releases/iso-iec-level-2-compliance/): "Jumio Achieves ISO/IEC 30107-3 Level 2 Compliance." Also confirmed via [iBeta confirmation letters page](https://www.ibeta.com/iso-30107-3-presentation-attack-detection-confirmation-letters/). PASS.

- **"Jumio Premium Liveness uses active illumination for deepfake detection"** — confirmed by [Jumio Liveness Detection](https://www.jumio.com/products/liveness-detection/): "patented active illumination to deliver stronger protection against sophisticated deepfakes and injection attacks." PASS.

- **"Onfido tested by iBeta to L1 and L2 (Motion)"** — confirmed by [Onfido API v2 reference](https://documentation.onfido.com/v2): "Motion liveness check... tested by iBeta to L1 and L2 (Motion)." PASS.

- **"Onfido returns score 0-1 for face similarity and source_integrity breakdown"** — confirmed by same source: "score property is a number between 0 and 1" and source_integrity breakdown properties with reasons for digital tampering and emulator usage. PASS.

- **"Persona ISO/IEC 30107-3 PAD certified by iBeta"** — confirmed by [Persona selfie verification page](https://withpersona.com/product/verifications/selfie) and [iBeta confirmation letters](https://www.ibeta.com/iso-30107-3-presentation-attack-detection-confirmation-letters/). PASS.

- **"Stripe does not publish ISO 30107-3 conformance level"** — correctly marked `[unknown]` with search list. Not contradicted by any search result. PASS.

- **"Specific Stripe Identity insight names not publicly enumerated"** — correctly marked `[vendor-gated]`. Public docs describe the framework but do not list all insight names. Consistent with search results. PASS.

**Verdict:** PASS (all new empirical claims well-sourced; vendor-gated and unknown markers are appropriate)
