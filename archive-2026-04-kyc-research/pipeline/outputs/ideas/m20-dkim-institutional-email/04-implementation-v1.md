# m20-dkim-institutional-email — Implementation v1

- **measure:** M20
- **name:** DKIM-verified institutional email from voucher
- **modes:** D, A
- **summary:** The provider requires the voucher to send their attestation from the voucher's institutional email. The provider then verifies (a) the message bears a valid DKIM signature, (b) the DKIM `d=` domain aligns with the From-header domain, and (c) that domain is the voucher's claimed institution's canonical email domain (per ROR / m02-ror-domain-match). This binds the attestation to the institution's mail infrastructure and shuts down the simple `free-mail-voucher` and `lookalike-voucher-domain` patterns.

## external_dependencies

- **DKIM verification library**: e.g. `dkimpy` (Python, active fork; the canonical Python DKIM implementation). [source](https://pypi.org/project/dkimpy/)
- **DNS resolver** for fetching the public-key TXT record at `<selector>._domainkey.<d-domain>` (any standard resolver).
- **Institution-domain canonicalization**: ROR API or the m02-ror-domain-match check, to map "Stanford University" → `stanford.edu` and validate that the DKIM `d=` matches.
- **Receiving mail server** under the provider's control (so the original DKIM headers reach the verifier intact, before any forwarding step strips or modifies them).

## endpoint_details

- **No external SaaS** is needed. DKIM verification is local computation against DNS.
- **Library:** `dkimpy` — `dkim.verify(message_bytes)` returns True/False; the DKIM-Signature header's `d=`, `s=`, `i=` fields are parsed by the library and exposed for alignment checking. [source](https://pypi.org/project/dkimpy/)
- **Auth model:** none (local).
- **Rate limits:** none beyond the local DNS resolver's caching.
- **Pricing:** free / open source (dkimpy is BSD-licensed).
- **ToS:** none (open source).
- **Critical infrastructure constraint:** the provider's MX must accept the voucher's email *directly*; the verification must run on the message as received, before any internal forwarding or content rewriting that would invalidate the DKIM body hash. [source](https://postmarkapp.com/blog/forwarding-emails-dmarc-failure)
- **ARC fallback:** when the voucher's email passes through an intermediate mail server (e.g., a mailing list, an `@alumni.x.edu` forwarder), the original DKIM may break. ARC (Authenticated Received Chain) headers preserve the original authentication results across hops; verifier should validate the ARC chain as fallback. [source](https://en.wikipedia.org/wiki/Authenticated_Received_Chain)

## fields_returned

The verifier produces, per voucher email:
- `dkim_verified: bool`
- `dkim_d_domain: str` (the `d=` value)
- `dkim_selector: str` (the `s=` value)
- `from_header_domain: str`
- `dkim_d_aligned_with_from: bool`
- `from_domain_matches_institution: bool` (against ROR canonical domain)
- `arc_chain_valid: bool` (when ARC is present)
- `arc_original_dkim_d: str | None`
- `verification_failures: list[str]` (reason codes)
- raw `DKIM-Signature` header text (preserved for audit)

## marginal_cost_per_check

- **Direct cost:** $0 (open-source library + DNS).
- **Compute:** ~10–50 ms per message; negligible.
- **Operational cost:** the provider must run a real receiving MX. [best guess: ~$50–$200/month for a small dedicated mail receiver in cloud, plus ~1 engineer-week to integrate dkimpy + the institution-domain canonicalization step.]
- **setup_cost:** [best guess: ~$5k–$10k engineering for the verification pipeline, the ROR-domain reconciliation, and the reviewer UI. Plus the m02 dependency.]

## manual_review_handoff

When DKIM verification fails or alignment fails, the reviewer packet contains:
1. The full inbound voucher email (with all headers).
2. The DKIM verification result (pass/fail) and any reason codes.
3. The ARC chain (if present) and its verification result.
4. The voucher's claimed institution and the canonical institution domain from ROR.
5. The DNS lookup of the public key TXT record (for audit).

**Reviewer playbook:**
1. **All checks pass** (DKIM valid, `d=` aligned with From, From-domain matches ROR institution domain): mark `voucher_email_dkim_verified`, accept.
2. **DKIM fails but ARC chain is intact and the original DKIM was from the institution domain**: accept with note, but flag the forwarding chain.
3. **DKIM fails and no ARC**: contact the voucher to re-send directly (without forwarding), or to have their IT confirm.
4. **DKIM passes but `d=` does not match institution domain** (e.g., institution outsources mail to `mail.x-cloud-vendor.com` and signs there): treat as legitimate if the cloud vendor is the institution's published MX provider; otherwise escalate.
5. **`d=` is a free-mail provider** (gmail.com, outlook.com, yahoo.com, protonmail.com): reject — voucher must be institutional.
6. **`d=` is a lookalike** (e.g., `stanforduniversity.edu`): reject. Lookalike detection per m18-lookalike-domain.

## flags_thrown

- `dkim_invalid` — signature does not verify.
- `dkim_d_misaligned` — `d=` differs from From-header domain (no DMARC alignment).
- `voucher_domain_not_institutional` — `d=` is on a free-mail provider list.
- `voucher_domain_lookalike` — `d=` matches a known-lookalike pattern of the claimed institution.
- `voucher_domain_unrelated` — `d=` is a real domain but does not match the institution's ROR-canonical domain or any known alias.
- `arc_chain_broken` — DKIM failed but ARC headers are present and inconsistent.

## failure_modes_requiring_review

- **Institution outsources mail** to a cloud provider that signs with its own `d=` (e.g., Google Workspace signing with `d=googlemail.com` rather than the institution's own domain). Modern Google Workspace sets up customer-domain DKIM by default but legacy or misconfigured setups exist.
- **Institution misconfigures DKIM** (no key published, expired key, wrong selector). [best guess: ~5–15% of legitimate institutional senders worldwide have at least intermittent DKIM problems]
- **Mailing-list / forwarder traversal** breaks DKIM body hash; ARC fallback required.
- **Subdomain alignment**: `d=cs.stanford.edu` vs From `@stanford.edu` — strict DMARC fails, relaxed DMARC passes. Use relaxed alignment by default.
- **International institution domains** with non-ASCII (IDN) handling.
- **Voucher uses personal email by habit** despite having an institutional address (legitimate but rejected; outreach).

## false_positive_qualitative

- **Institutions with broken / absent DKIM** — legitimate vouchers cannot pass.
- **Vouchers at institutions whose mail goes through a contracted MTA** that signs under the contractor's domain.
- **Vouchers using legitimate institution-issued aliases** (e.g., `voucher@alumni.princeton.edu` when their primary is `@princeton.edu`).
- **Mailing-list-traversed messages** without ARC.
- **Foreign institutions** with idiosyncratic mail setups, IDN domains, or limited DKIM adoption.

[best guess: in the US R1 university population, DKIM coverage is high (>90%) and false-positive rate is low (<5%); in international and small-institution populations, DKIM/DMARC adoption is materially lower and false-positive rates could reach 10–25%. unknown — searched for: "global institutional DKIM adoption rate university" — direct figures not found]

## record_left

- The full raw inbound voucher email (preserved as MIME/EML).
- The DKIM verification trace + DNS lookup.
- The ARC chain if present.
- The reviewer's adjudication (if any).
- The mapping voucher_email → claimed institution → ROR domain.

This is a strong audit artifact: the email itself, the DNS public key, and the verification result are independently re-verifiable by any third party (auditor, regulator, law enforcement).

## attacker_stories_addressed (refined)

- `fake-voucher` — partial: catches a fabricated voucher only when the attacker uses a free-mail or lookalike domain. An attacker who controls a real institutional inbox (insider, credential-compromised account, dormant-domain revival) passes.
- `free-mail-voucher` — directly targeted: the entire purpose of the check is to reject `voucher@gmail.com`.
- `lookalike-voucher-domain` — directly targeted: combined with m18 lookalike detection.
- `dormant-domain` — does NOT catch: a revived dormant institutional domain with newly-set-up DKIM passes the check trivially. The check binds to *current* DKIM, not to institutional historical legitimacy.
- `inbox-compromise`, `credential-compromise`, `it-persona-manufacturing` — does NOT catch: compromised or manufactured-but-real institutional accounts produce valid DKIM signatures.
- `lab-manager-voucher`, `insider-recruitment` — does NOT catch: the voucher's institutional email is real and legitimate.
- `shell-nonprofit` self-vouching — partial: catches the shell only if the shell does not bother to set up DKIM on its own newly-purchased domain. Setting up DKIM is trivial and well within the means of any professional shell.
- `foreign-institution` — partial: catches only if the foreign institution lacks DKIM; structurally weak in regions with low DMARC adoption.

[best guess: this check is best understood as a *floor* — it blocks the laziest attacker patterns (free-mail, lookalike, no-DKIM) but does nothing against attackers who control any real institutional mailbox. Combined with m02-ror-domain-match it forces the attacker to either compromise a real institution's mail or to register and DKIM-sign a domain that survives the lookalike + ROR check, both of which have non-trivial cost.]
