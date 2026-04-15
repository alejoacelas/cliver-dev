# LLM + Exa Neural Search: KYC Tool Evaluation Results

**Test date:** 2026-04-14
**API calls used:** 48 / 100 budget
**Total API cost:** $0.336 ($0.007/call)
**Average latency:** 1.7s per call (search time ~1.0-2.0s + network)

## Executive Summary

Exa neural search is a **strong general-purpose web intelligence tool** for KYC verification, with clear strengths and well-defined failure boundaries. It excels at email domain verification and institutional address confirmation, but cannot reliably detect freight forwarders or CMRAs from address alone. Its biggest risk is **LLM hallucination on ambiguous results**, particularly when search results are tangentially related but don't actually answer the flag question.

### Verdict by KYC Step

| Step | Reliability | Notes |
|------|------------|-------|
| **(a) Address -> institution** | **Strong** (13/16 pass) | Excellent for known institutions. Fails on outdated addresses. Correctly identifies incubators. |
| **(b) Payment -> institution** | **Moderate** (2/3 pass) | Works for public companies with SEC filings. Name collisions are a risk. Limited test set. |
| **(c) Email -> affiliation** | **Strongest** (10/12 pass) | Correctly verifies institutional domains AND correctly rejects free email providers. One hallucination risk case. |
| **(d) Residential address** | **Moderate** (4/6 pass) | Good for commercial buildings (real estate listings). Weak for specific residential addresses. |
| **(e) PO box / freight forwarder** | **Weakest** (4/8 pass) | PO box detection trivial (no search needed). Freight forwarder and CMRA detection unreliable. |

---

## Detailed Findings

### Step (a): Address to Institution

**What works:**
- Well-known institutions (MIT, Oxford, Pfizer, BioNTech) are confirmed within seconds with high confidence from multiple sources.
- Non-OECD institutions (Chulalongkorn, University of Lagos, Universiti Malaya, IIT Bombay) have strong English-language web presence in Exa's index. The hypothesis that non-English institutions would be underrepresented was **not confirmed** for major universities.
- Exa correctly identifies shared spaces (LabCentral, BioLabs, WeWork, Galvanize, JLABS) as incubators/coworking when queried. This is a key strength over structured APIs.

**What fails:**
- **Outdated addresses.** Genspace (moved from 150 Broadway to 132 32nd St Brooklyn), Mammoth Biosciences (moved from Letterman Drive to Brisbane), and possibly AAS (moved from Mwalimu Mutual Towers to Miotoni Lane). Exa returns the most recent information, which may not match the customer's address if they haven't updated it. This is actually a *feature* for KYC - the mismatch is a valid signal.
- **Fictional entities at real addresses.** The "Helix Therapeutics at LabCentral" case correctly surfaced LabCentral as the actual occupant, but also found a real unrelated "Helix Therapeutics" company, creating confusion.

**Comparative advantage over structured APIs:** Exa can identify a building as a coworking space, incubator, or commercial building, which ROR, GLEIF, and address validation APIs cannot do. This is the primary value-add for step (a).

### Step (b): Payment to Institution

**Limited test set** (3 cases). Pfizer confirmed through SEC EDGAR filings. BioNTech confirmed through investor relations pages. The fictional "Helix Therapeutics Inc." created a name collision with a real company.

**Key insight:** Billing entity names rarely appear linked to addresses on public web pages. Exa's value here comes from corporate registries (SEC, Companies House) that happen to be in its index, not from neural search per se. This step might be better served by direct API calls to corporate registries.

### Step (c): Email Domain Affiliation

**Strongest step overall.** Two distinct capabilities:

1. **Institutional domain verification** (PASS in all cases): `.edu`, `.ac.uk`, `.ac.th`, `.de`, `.africa`, `.ac.ke` domains are reliably linked to their institutions through the institution's own web pages. Even the unusual `.africa` TLD worked.

2. **Free email provider rejection** (CORRECT_NEGATIVE in all cases): `163.com`, `qq.com`, `mail.ru`, `yandex.ru` are correctly identified as free email providers. The LLM should conclude "cannot verify affiliation."

**The critical hallucination risk:** When queried about `gmail.com` affiliation with Harvard, Exa returned Harvard's own "Gmail for Harvard" pages showing their Google Workspace integration. The search results are *factually correct* (Harvard does use Gmail infrastructure) but *misleading for the flag question* (a random @gmail.com address is not affiliated with Harvard). This is the single highest-risk failure mode - the LLM has evidence that superficially supports the wrong conclusion.

**Mitigation:** The prompt to the LLM must explicitly distinguish between "institution X uses Google Workspace internally" and "a @gmail.com address belongs to institution X." The institutional email is `@g.harvard.edu`, not `@gmail.com`.

### Step (d): Residential vs. Commercial Address

**Commercial detection works well** through real estate listing sites (LoopNet, CommercialCafe, CityFeet) and office space marketplaces. If an address appears on commercial real estate sites, it's clearly commercial.

**Residential detection is weaker.** Zillow/Redfin results are strong residential signals when present, but coverage is incomplete. For a specific residential address like "4512 Oak Lane, Bethesda," Exa found nearby listings but not the exact address. The LLM must infer from context (street name patterns, neighborhood character) rather than finding definitive proof.

**Key insight:** The commercial/residential distinction is better answered by address classification APIs (Smarty, USPS) than by web search. Exa adds value only for ambiguous cases where the address is in a known commercial building.

### Step (e): PO Box / Freight Forwarder Detection

**Three tiers of reliability:**

1. **Explicit PO box** (trivial): "PO Box 330267" is detectable from the address string alone. No API call needed. Regex is sufficient.

2. **Named coworking/forwarding services** (reliable when name is known): WeWork, Regus, Shipito, MyUS are all easily found when the service name is included in the query. But this requires *already knowing* it's a forwarding service.

3. **Unlabeled freight forwarder/CMRA addresses** (unreliable): When given just a street address that happens to be a UPS Store or freight forwarder warehouse, Exa cannot identify it. The Fresno Shipito address (1396 W Herndon Ave) was not identified without including "Shipito" in the query. The Sacramento UPS Store was not found at all.

**This is the critical gap.** Freight forwarders and CMRAs that don't have "PO Box" in the address string look like normal commercial addresses to Exa. This step requires a dedicated CMRA database or Smarty's CMRA flag, not web search.

---

## Where Exa Succeeds When Structured APIs Fail

1. **Coworking/incubator identification.** No structured API can tell you that 700 Main St Cambridge is LabCentral or that 115 Broadway is WeWork. Exa excels here.

2. **Community bio lab verification.** Genspace, BioCurious are not in ROR or any institutional registry. Exa finds their websites, confirms they're real organizations.

3. **Corporate address verification for non-US companies.** BioNTech's German Impressum page is a definitive legal source. Exa surfaces this when structured address APIs may not cover German addresses well.

4. **Free email provider identification.** While a static list could handle common providers, Exa can identify obscure or region-specific free email services by finding their signup/about pages.

5. **Cross-referencing.** Exa can find that an address belongs to a different entity than claimed, which is a uniquely valuable KYC signal.

## Where Structured APIs Beat Exa

1. **Address classification (residential/commercial).** Smarty and USPS provide definitive binary classification. Exa provides probabilistic inference from real estate listings.

2. **CMRA detection.** Smarty has a CMRA flag. Exa cannot detect UPS Stores or CMRAs without the service name.

3. **PO box detection.** Regex is faster, cheaper, and more reliable than a $0.007 API call.

4. **Freight forwarder detection from address alone.** Requires a dedicated denylist or database, not web search.

5. **Corporate registry lookups.** Direct API calls to SEC EDGAR, Companies House, etc. are more reliable than hoping Exa's index includes the relevant filing.

---

## Cost Analysis

| Metric | Value |
|--------|-------|
| Cost per search | $0.007 (with 500-char text contents) |
| Cost per search (basic, no contents) | $0.005 |
| Typical latency | 1.3-2.6s |
| Calls per KYC verification (all 5 steps) | 5-10 |
| Cost per full verification | $0.035-0.070 |
| At 1000 orders/month | $35-70/month |
| At 10,000 orders/month | $350-700/month |

This is cheap enough to use as a supplementary tool alongside structured APIs. The question is whether the LLM inference cost (to interpret results) dominates the Exa search cost.

## Recommendations

1. **Use Exa for steps (a) and (c).** These are the highest-value use cases with the best reliability. Step (a) for address-institution linking and coworking/incubator detection. Step (c) for institutional domain verification and free email rejection.

2. **Do NOT use Exa for step (e) freight forwarder/CMRA detection.** Use Smarty CMRA flag + a freight forwarder denylist instead.

3. **Use regex for PO box detection.** Exa adds no value over string matching for explicit PO box addresses.

4. **Use Smarty/USPS for step (d) residential classification.** Exa is a fallback for addresses not covered by Smarty.

5. **For step (b), prefer direct corporate registry APIs** (SEC EDGAR, Companies House) over web search. Use Exa as fallback for jurisdictions without API access.

6. **Critical: design the LLM prompt to resist hallucination on step (c) with free email domains.** The Harvard/Gmail case shows that naive LLM reasoning on Exa results can produce false confirmations. The prompt must explicitly instruct: "If the email domain is a known free email provider (gmail.com, outlook.com, 163.com, qq.com, mail.ru, yandex.ru, etc.), the answer is CANNOT VERIFY regardless of what the search results show about the institution."

7. **The mismatch signal is as valuable as the match signal.** When Exa shows that an address belongs to LabCentral (not the claimed company) or that an institution has moved, this is actionable KYC intelligence that no structured API provides.
