# Step (c): Email to Affiliation — Field Assessment

**Measure:** M02 (+M07) — Does not match institution domain / non-institutional domain
**Endpoint groups assessed:** email-domain, individual-affiliation, llm-exa

---

## Three layers of defense, one critical blind spot

Email-to-affiliation verification works through three layers, each catching a different threat:

1. **Disposable email blocklist** -- the only defense against guerrillamail, mailinator, and similar services. These services have BETTER email authentication (DMARC p=reject) than most universities.
2. **Free email soft-flag** -- catches gmail.com, 163.com, qq.com, mail.ru, naver.com, etc. Must not hard-block because free email is the regional norm for Chinese, Korean, Iranian, and Russian researchers.
3. **Domain verification** -- confirms institutional domains match claimed institutions via ROR, Exa, and InCommon/eduGAIN federation checks.

The blind spot: **sanctioned institutions with zero email infrastructure.** Baqiyatallah (IRGC-affiliated) has no MX records, no SPF, no DMARC -- literally zero email infrastructure in public DNS. Researchers must use yahoo.com or gmail.com. Because the email reveals nothing about the institution, step (c) is completely blind to these affiliations. Detection must come from entity-level screening.

---

## The disposable email finding that changes everything

Guerrillamail.com has DMARC p=reject and SPF -all. Mailinator.com has DMARC p=reject and SPF -all. These disposable email services have *stronger* email authentication than IIT Kanpur (no DMARC), Seoul National University (DMARC p=none), and China Agricultural University (DMARC p=none).

A system that uses DMARC policy as a trust signal would rank guerrillamail ABOVE these legitimate universities.

**The disposable-email blocklist is not a nice-to-have. It is the primary and often the only detection layer for disposable email.** RDAP domain age would not catch these either -- guerrillamail is 20 years old, mailinator is 23 years old.

---

## .com impersonation of .edu institutions is live

This was the most alarming finding. We tested 5 .com variants of .edu institutions:

| Domain | Registered | Active mail? | Provider |
|---|---|---|---|
| mit-edu.com | July 2025 | Yes | Self-hosted (158.220.107.73) |
| stanford-edu.com | August 2025 | Yes | Zoho business email |
| harvard-edu.com | August 2019 | Yes | Namecheap PrivateEmail |
| berkeley-edu.com | August 2025 | No | Parked |
| mitresearch.com | April 2024 | No | Parked |

An attacker could email as `professor.smith@stanford-edu.com` with fully functional mail delivery. Meanwhile, all .edu typosquats we tested (rnit.edu, miit.edu, scrlpps.edu) are unregistered because Educause restricts .edu registration to accredited US institutions.

**The real typosquat threat is .com impersonation of .edu institutions, not .edu typosquats.** The homoglyph detector must cover cross-TLD patterns: `{institution}-edu.com`, `{institution}research.com`, etc.

RDAP creation date is the primary signal: mit-edu.com is less than 1 year old, stanford-edu.com less than 1 year. But harvard-edu.com is 7 years old with an established reputation -- age alone does not catch established impersonation.

---

## RDAP coverage aligns with the hardest KYC countries

Domain age (creation date) is available for:
- .com/.net/.org (Verisign RDAP) -- works well
- .in (NIXI RDAP) -- the only non-.com with reliable dates

Domain age is NOT available for:
- .edu (Educause WHOIS returns registrant only, no dates)
- .cn / .edu.cn (CNNIC referral only)
- .ir / .ac.ir (no RDAP, no accessible WHOIS)
- .ru (no RDAP server)
- .au / .edu.au (RDAP exists, no dates returned)
- .uk / .ac.uk (RDAP exists, returns nothing useful)

The gap aligns exactly with the hardest KYC countries: US academic (.edu), China (.edu.cn), Iran (.ac.ir), and Russia (.ru) all lack domain age signals.

---

## ORCID institution-verification is a myth

The pre-committed hypothesis was that ~2% of ORCID records have institution-verified affiliations. We found **0%.** Across 5 researchers (Andrabi, Faber, Dey, Zimmer, Saberfar), all 11 employment entries were self-asserted. An attacker could create an ORCID profile claiming any institution in approximately 5 minutes.

**ORCID self-asserted affiliation data has no more trust value than the customer's own claim on the order form.** Do not use ORCID self-asserted employment as a verification signal.

OpenAlex is more useful because publication metadata is harder to fake. But it has blind spots for common names (Wei Zhang: 9,085 results), small companies (Lay Sciences, Fusix Biotech, GREENVAX: 0 results), and institution changes (Andrabi at UPenn since 2023 but OpenAlex still shows Scripps in 2026).

---

## Profile groups and resolution time

| Group | Time tier | Est. time | Fraction | Resolution path |
|---|---|---|---|---|
| Institutional email matching claimed institution | Auto | 0 min | ~35% | Domain matches ROR or Exa-confirmed institutional website |
| Institutional email, domain-institution mismatch | Quick review | 2-3 min | ~5% | Dual affiliation check (e.g., pasteur.fr + TheraVectys) |
| Free email, OECD country | Quick review | 1-3 min | ~15% | Verify institution has email infra; why not using it? |
| Free email, non-OECD (163.com, qq.com, naver.com, etc.) | Quick review | 2-5 min | ~20% | Regional norm. Verify institution via ROR + PubMed. |
| Sanctioned-country institution, no email infra | Investigation | 10-15 min | ~3% | Free email + institution has zero DNS. Must check screening lists. |
| Common-name researcher with free email | Investigation | 5-15 min | ~10% | Can't disambiguate. Request ORCID ID or publication list. |
| Disposable email | Auto | 0 min | ~1% | Blocklist hard block. |
| Impersonation domain (.com of .edu) | Auto | 0 min | ~1% | Homoglyph detector + RDAP age check. |

---

## Recommended endpoint combination

1. **Disposable email blocklist** -- hard block (the only reliable defense)
2. **Free email blocklist** -- soft flag requiring additional affiliation evidence
3. **Lookalike/homoglyph detector** -- must cover cross-TLD patterns ({institution}-edu.com)
4. **RDAP creation_date** for .com domains -- flag domains <2 years old impersonating known institutions
5. **ROR domain match** -- when populated (~50% of institutions)
6. **InCommon/eduGAIN** federation check -- strong for US/China/UK academic
7. **LLM+Exa** -- verify obscure domains, confirm free email status, catch hallucination risk
8. **OpenAlex** -- publication-backed affiliation confirmation for unique-name researchers

**Drop:** DMARC as a trust signal (actively misleading). ORCID self-asserted employment (zero trust value).

---

## Unresolved issues

1. **Cross-TLD homoglyph detection** designed but not system-tested end-to-end.
2. **Identity binding** missing: ORCID/OpenAlex verify that a person-institution pair exists in the scholarly record, not that the requester IS that person. Requires ORCID OAuth or institutional SSO.
3. **LLM hallucination risk** on gmail.com + institution queries (Harvard/Gmail case). Prompt mitigation designed but not tested.
4. **InCommon MDQ** returns all 14K+ entities for any query. Needs exact-domain matching, not substring search.
5. **RDAP fallback chain** for blind-spot TLDs not validated.
