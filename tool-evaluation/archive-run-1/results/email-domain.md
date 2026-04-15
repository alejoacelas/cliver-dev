# Email-Domain Endpoint Group: Adversarial Testing Results

**Group:** email-domain
**KYC step:** (c) Email -> affiliation flag
**Date:** 2026-04-15
**Endpoints tested:** RDAP, disposable/free-mail blocklist, MX/SPF/DMARC, lookalike/homoglyph detector, InCommon/eduGAIN
**Total API/DNS calls:** 128 (24 RDAP, 12 WHOIS, 78 DNS dig, 13 InCommon MDQ, 1 eduGAIN)

---

## Executive Summary

The email-domain endpoint group has **three critical blind spots** and **one critical attack vector** that together undermine the "email -> affiliation" verification step for the hardest cases.

1. **Disposable email services have better email auth than most universities.** Guerrillamail and Mailinator both have DMARC p=reject and SPF -all. DNS-based checks (MX/SPF/DMARC) would *pass* these domains. The blocklist is the only defense.

2. **.com impersonation of .edu institutions is live and active.** `mit-edu.com` (registered July 2025), `stanford-edu.com` (August 2025, active Zoho mail), and `harvard-edu.com` (2019, active PrivateEmail) all exist with functioning email infrastructure. The homoglyph detector must check .com variants, not just .edu typosquats.

3. **RDAP/WHOIS coverage has major gaps for exactly the countries that matter most.** No RDAP for .edu, .cn, .ir, .ru, .ac (Korea). Iran and Russia have no accessible domain-age signal at all.

4. **Sanctioned institutions have zero email infrastructure**, forcing researchers to use free email, which breaks the email-to-institution link that step (c) depends on.

---

## Critical Findings

### Finding 1: Disposable email passes DNS checks

| Domain | DMARC | SPF | MX | Domain Age |
|--------|-------|-----|----|------------|
| guerrillamail.com | **p=reject** | -all | Yes | 20 years |
| mailinator.com | **p=reject** | -all | Yes | 23 years |
| 10minutemail.com | (missing) | (missing) | No | 20 years |

Guerrillamail and Mailinator have *stronger* email authentication than IIT Kanpur (no DMARC), Seoul National University (DMARC p=none), China Agricultural University (DMARC p=none), and Signablok Inc (DMARC p=none).

**Implication:** A system relying on MX/SPF/DMARC as a trust signal would rank disposable email services *above* legitimate institutions. The disposable-email blocklist is not a nice-to-have -- it is the primary and often *only* detection layer for disposable email.

### Finding 2: .com university impersonation is live

| Domain | Registered | MX Active | Email Provider |
|--------|-----------|-----------|---------------|
| mit-edu.com | 2025-07-02 | Yes (self-hosted) | Self-hosted on 158.220.107.73 |
| stanford-edu.com | 2025-08-04 | Yes (Zoho) | Zoho business mail |
| harvard-edu.com | 2019-08-28 | Yes (PrivateEmail) | Namecheap PrivateEmail |
| berkeley-edu.com | 2025-08-29 | No | Parked |
| mitresearch.com | 2024-04-09 | No | Parked |

An attacker could email as `professor.smith@stanford-edu.com` with fully functional mail delivery (Zoho MX, SPF configured). The recipient -- or an automated system checking MX records -- would see a working email domain.

Meanwhile, **.edu typosquats are all unregistered** (rnit.edu, miit.edu, scrlpps.edu, mit-research.edu). Educause restricts .edu registration to accredited US institutions, making .edu typosquatting nearly impossible. **The real typosquat threat is .com impersonation of .edu institutions, not .edu typosquats.**

**Implication:** The homoglyph/lookalike detector must compare incoming email domains against .edu institutions using fuzzy matching that covers .com variants (e.g., `{institution}-edu.com`, `{institution}research.com`). Checking only within the same TLD misses the primary attack vector.

### Finding 3: RDAP coverage map

| TLD | RDAP? | Returns Dates? | Fallback |
|-----|-------|---------------|----------|
| .com | Yes (Verisign) | Yes | -- |
| .net | Yes (Verisign) | Yes | -- |
| .org | Yes (PIR) | Assumed yes | -- |
| .in (.ac.in) | Yes (NIXI) | Yes | -- |
| .au (.edu.au) | Yes (AU ccTLD) | **No** (status only) | -- |
| .uk (.ac.uk) | Yes (Nominet) | **No** (empty response) | -- |
| .kr (.ac.kr) | No | -- | Korean WHOIS (returns dates) |
| .edu | **No** | -- | Educause WHOIS (registrant only, **no dates**) |
| .cn (.edu.cn) | **No** | -- | CNNIC WHOIS (referral only, no data) |
| .ir (.ac.ir) | **No** | -- | **None accessible** |
| .ru | **No** | -- | **None accessible** |
| .ac | **No** | -- | Ascension Island WHOIS (TLD-level only) |

**Domain age signal availability by customer geography:**

| Country | Academic TLD | Age Signal? |
|---------|-------------|-------------|
| US | .edu | No (Educause WHOIS has no dates) |
| China | .edu.cn | No |
| India | .ac.in | **Yes** (NIXI RDAP returns dates) |
| Iran | .ac.ir | No |
| South Korea | .ac.kr | Yes (Korean WHOIS) |
| UK | .ac.uk | No (RDAP exists but returns nothing useful) |
| Australia | .edu.au | No (RDAP exists, no dates) |
| Russia | .ru | No |

India is the only non-.com TLD where RDAP reliably returns domain registration dates. For the majority of academic TLDs, the domain-age signal is unavailable.

### Finding 4: Sanctioned institutions and free email

Baqiyatallah University of Medical Sciences (bmsu.ac.ir) -- IRGC-affiliated, on screening lists:
- MX records: **none**
- SPF: **none**
- DMARC: **none**
- RDAP: **unavailable** (.ir)
- eduGAIN: IRFED has **2 IdPs** (near-zero)

This institution has *zero* email infrastructure in public DNS. Researchers must use free email (yahoo.com, gmail.com). Because the email reveals nothing about the institution, **step (c) is completely blind** to Baqiyatallah affiliations. Only entity-level screening (step b) can catch this.

Malek Ashtar University of Technology (mut.ac.ir) -- also IRGC-affiliated:
- MX: exists (1 record)
- SPF: **none**
- DMARC: **none**

Slightly better than Baqiyatallah but still minimal. An email from mut.ac.ir would at least surface the domain for entity screening, but the lack of SPF/DMARC means the domain can be trivially spoofed.

### Finding 5: eduGAIN federation coverage gaps

| Country | Federation | IdPs | Adequate for KYC? |
|---------|-----------|------|-------------------|
| US | InCommon | 587 | Yes |
| China | CARSI | 573 | Likely yes (but untested at entity level) |
| India | INFED | 317 | Moderate -- IIT Kanpur not found via InCommon MDQ substring search |
| Japan | GakuNin | 157 | Moderate |
| Australia | AAF | 40 | Moderate |
| South Korea | KAFE | 29 | Weak |
| Iran | IRFED | 2 | **No** |
| Russia | (none) | 0 | **No** |

Sharif University of Technology (Iran) has a .edu domain (`sharif.edu`) registered through Educause, yet it is **not** in InCommon. This means `.edu` TLD does not guarantee InCommon membership. The heuristic "if .edu then check InCommon" has false negatives.

### Finding 6: DMARC as a trust signal is unreliable

DMARC policies across tested domains:

- **p=reject** (strongest): berkeley.edu, griffith.edu.au, yahoo.com, **guerrillamail.com**, **mailinator.com**, mail.ru, cam.ac.uk
- **p=quarantine**: scripps.edu, ox.ac.uk, pku.edu.cn, tsinghua.edu.cn, protonmail.com, qq.com, sharif.edu, ut.ac.ir
- **p=none** (monitoring only): signablok.com, 163.com, gmail.com, outlook.com, naver.com, snu.ac.kr, **mit-edu.com**, cau.edu.cn
- **Missing entirely**: iitk.ac.in, bmsu.ac.ir, mut.ac.ir, stanford-edu.com, harvard-edu.com

Two disposable email services have p=reject while Gmail, Outlook, and several major universities have p=none or missing DMARC. DMARC policy is not a useful discriminator between legitimate and illegitimate domains.

---

## Free Email Policy Recommendation

| Provider | Country/Region | DMARC | Recommendation |
|----------|---------------|-------|---------------|
| gmail.com | Global | p=none | Soft flag |
| outlook.com | Global | p=none | Soft flag |
| yahoo.com | Global/Middle East | p=reject | Soft flag |
| 163.com | China | p=none | Soft flag |
| 126.com | China | p=none | Soft flag |
| qq.com | China | p=quarantine | Soft flag |
| mail.ru | Russia | p=reject | Soft flag |
| yandex.ru | Russia | p=none | Soft flag |
| naver.com | South Korea | p=none | Soft flag |
| hanmail.net | South Korea | p=none | Soft flag |
| protonmail.com | Privacy | p=quarantine | Soft flag |
| tutanota.com | Privacy | p=quarantine | Soft flag |
| guerrillamail.com | Disposable | p=reject | **Hard block** |
| mailinator.com | Disposable | p=reject | **Hard block** |
| 10minutemail.com | Disposable | (missing) | **Hard block** |

Hard-blocking free email would reject a large fraction of legitimate Chinese, Iranian, Korean, and Russian researchers. The correct policy is:
1. **Hard block** disposable email (use canonical blocklist)
2. **Soft flag** free email -- require additional affiliation evidence (institutional website listing, publications, ORCID, etc.)
3. **No flag** for institutional email that matches claimed institution

---

## Endpoint Reliability Grades

| Endpoint | Grade | Reasoning |
|----------|-------|-----------|
| Disposable-email blocklist | **A** | Only reliable defense against disposable email. Must be maintained. |
| MX/SPF/DMARC (DNS) | **C+** | Universally available (works for all TLDs). But DMARC policy is not a trust discriminator. MX presence is useful as a basic "does this domain receive mail?" check. Absence of MX is a strong negative signal. |
| RDAP | **C** | Works well for .com/.net/.org. Returns dates for .in. Useless for .edu, .cn, .ir, .ru, .ac, and returns no dates for .au/.uk. Coverage gap aligns exactly with the hardest KYC cases. |
| InCommon/eduGAIN (MDQ) | **B-** | Good US coverage (587 IdPs). Reasonable China coverage via CARSI. Near-zero Iran/Russia coverage. Key limitation: InCommon MDQ returns all entities (14K+) for any search, requiring client-side filtering. Substring matching produces false positives (iiitkottayam matched when searching for iitk). |
| Lookalike/homoglyph detector | **B** (theoretical) | Not tested as a running system. The .edu typosquat threat is low (registration restricted). The .com impersonation threat is high and active. Detector must cover cross-TLD comparisons. |

---

## Key Gaps Requiring Mitigation

1. **Cross-TLD homoglyph detection.** The homoglyph detector must compare `{any-domain}.com` against `{institution}.edu` patterns. Current .edu-only typosquat testing misses the primary attack vector.

2. **RDAP fallback chain.** For TLDs without RDAP, implement a tiered fallback: RDAP -> country-specific WHOIS -> DNS creation heuristics (SOA serial, zone age). Accept that .ir and .ru will remain blind spots.

3. **Free-email-to-institution bridge.** When a customer uses free email + claims an institutional affiliation, the system needs a separate verification path (e.g., check if the person appears on the institution's website, ORCID lookup, publication search). Email-domain screening alone is insufficient.

4. **Sanctioned-institution email gap.** Institutions like Baqiyatallah with zero email infrastructure are invisible to step (c). Flag: if claimed institution is in a sanctioned country AND email is free-mail, escalate to entity screening regardless of email-domain results.

5. **InCommon MDQ search quality.** The MDQ endpoint returns the full 14K+ entity metadata for any search query. Implement exact-domain matching rather than substring search to avoid false positives.
