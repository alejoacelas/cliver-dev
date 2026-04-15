# m20-dkim-institutional-email — Form check v1

**Document under review:** `04-implementation-v1.md`

## Field verdicts

### name
**PASS.** "DKIM-verified institutional email from voucher" — specific.

### measure
**PASS.** M20 (voucher-legitimacy-soc).

### attacker_stories_addressed
**PASS.** Twelve attacker branches analyzed with directly-targeted / partial / does-NOT-catch distinctions. Correctly identifies the floor nature of the check: blocks lazy patterns, not institutional-insider attacks.

### summary
**PASS.** Clear three-step verification process (DKIM signature, d= alignment, domain-institution match via ROR).

### external_dependencies
**PASS.** Four dependencies: dkimpy library (with PyPI link), DNS resolver, institution-domain canonicalization (ROR), receiving MX server. ARC fallback mentioned.

### endpoint_details
**PASS.** Correctly identifies that no external SaaS is needed — local computation + DNS. dkimpy library documented with PyPI source. Auth: none. Rate limits: none. Pricing: free/open-source (BSD). Critical infrastructure constraint (provider's MX must receive directly) documented with source (Postmark blog). ARC fallback documented with Wikipedia source.

### fields_returned
**PASS.** Ten fields listed with types (bool, str, list). Includes both primary DKIM fields and ARC fallback fields plus verification_failures list and raw DKIM-Signature header.

### marginal_cost_per_check
**PASS.** $0 direct cost. Compute: ~10–50ms. Operational cost `[best guess: $50–$200/month for MX + ~1 engineer-week to integrate]`. Setup cost `[best guess: $5K–$10K]`.

### manual_review_handoff
**PASS.** Detailed 6-case playbook covering all-pass, ARC fallback, no-ARC failure, cloud-vendor d= mismatch, free-mail d=, and lookalike d=. Concrete and implementable.

### flags_thrown
**PASS.** Six distinct flags covering the full decision space: dkim_invalid, dkim_d_misaligned, voucher_domain_not_institutional, voucher_domain_lookalike, voucher_domain_unrelated, arc_chain_broken.

### failure_modes_requiring_review
**PASS.** Six modes: cloud-provider DKIM misconfiguration, institution DKIM misconfiguration (with `[best guess: ~5–15%]`), mailing-list traversal, subdomain alignment, IDN handling, voucher habit (personal email). Relaxed DMARC alignment recommendation noted.

### false_positive_qualitative
**PASS.** Five categories with a quantitative estimate for US R1 vs. international populations: `[best guess: US R1 false-positive rate <5%; international could reach 10–25%]`. The international DKIM adoption search is documented with `[unknown — searched for: "global institutional DKIM adoption rate university"]`.

### record_left
**PASS.** Full raw email (MIME/EML), DKIM verification trace, DNS lookup, ARC chain, reviewer adjudication, voucher-institution-ROR mapping. Correctly notes this is independently re-verifiable by third parties.

## Borderline observations

1. The `[best guess: ~5–15%]` for institutional DKIM misconfiguration rates is uncited and fairly wide. The 4C check should look for empirical DKIM/DMARC adoption data for educational institutions.

2. The document mentions that "setting up DKIM is trivial and well within the means of any professional shell" (under shell-nonprofit analysis). This is correct and important — it means the check provides essentially zero protection against a purpose-built shell with its own domain. The document acknowledges this but could be more explicit about the overall limited value against purpose-built organizations.

3. The ARC fallback is described but the document does not specify which ARC validation library to use or whether dkimpy supports ARC natively. [searched for in document: no library specified for ARC validation.]

## For 4C to verify

- dkimpy PyPI page and BSD license claim.
- Postmark blog article about DKIM failure on forwarding.
- Wikipedia ARC article.
- The claim that "modern Google Workspace sets up customer-domain DKIM by default."
- The `[best guess: ~5–15%]` DKIM misconfiguration rate — any empirical source?
- The `[best guess: US R1 >90% DKIM coverage]` — any empirical source?

## Verdict

**PASS.** All required fields are populated with substantive content and appropriate sourcing markers. The ARC library gap is minor. The document is well-structured and honest about limitations.
