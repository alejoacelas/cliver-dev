# Coverage research: Billing-shipping-institution consistency

## Coverage gaps

### Gap 1: Multi-campus universities and national labs
- **Category:** Researchers at multi-campus university systems (UC system with 10 campuses, SUNY with 64, Texas A&M system, etc.) or national laboratories with geographically distributed user facilities (LBNL, ORNL, Sandia, PNNL), where the billing address (home campus or HQ), shipping address (satellite campus or user facility), and institution canonical address (main campus) legitimately diverge by hundreds of kilometers.
- **Estimated size:** Many of the largest US public universities are multi-campus systems [source](https://en.wikipedia.org/wiki/University_system). The UC system alone has 10 campuses spanning ~600 km; SUNY has 64. [best guess: multi-campus systems educate roughly 40–50% of US public-university students, based on the dominance of state university systems. Among DNA synthesis customers specifically, academic researchers at these institutions represent a large share — if academic customers are ~54% of the synthesis market [source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799) and ~40% of those are at multi-campus systems, then ~20% of all synthesis orders could be from multi-campus-system researchers. Not all of these will have address divergence — only those ordering from a secondary campus — but the population at risk is substantial.]
- **Behavior of the check on this category:** false-positive (soft or hard flag depending on distance; reviewer must adjudicate)
- **Reasoning:** This is the dominant false-positive class. The implementation doc explicitly identifies it. The mitigation (distributed-institution exception list) requires ongoing curation and reviewer training. The 50-km metro threshold will pass most same-city satellite campuses but will flag cross-city campuses (e.g., UC Berkeley billing, UC Davis shipping = ~110 km).

### Gap 2: Visiting researchers and sabbatical scholars
- **Category:** Researchers temporarily at a host institution (on sabbatical, visiting appointment, or conference residency) who pay with a card from their home institution and ship to the host institution. Billing and institutional addresses are at the home institution; shipping is at the host.
- **Estimated size:** Approximately 300,000 international visiting scholars come to the US per year [source](https://blog.sabbaticalhomes.com/visiting-scholar/). A subset of these order DNA synthesis supplies while abroad. [best guess: visiting scholars represent 2–5% of the academic DNA synthesis customer base at any given time, based on the ratio of ~300,000 visiting scholars to ~1.5 million US faculty/postdocs. Most will have address divergence if paying with their home-institution card.]
- **Behavior of the check on this category:** false-positive (hard flag on country mismatch if home institution is non-US; soft flag on metro mismatch if both are US-based)
- **Reasoning:** The billing-institution match is correct (both are the home institution), but shipping diverges. The reviewer must verify the visiting appointment, which requires checking the host institution's records or asking the customer. This is higher-friction than Gap 1.

### Gap 3: Distributed pharma/biotech companies
- **Category:** Commercial customers at pharma or biotech companies with R&D and HQ in different cities or countries. Over 5,500 pharmaceutical companies had active R&D pipelines in 2023 [source](https://pmc.ncbi.nlm.nih.gov/articles/PMC4847363). Many large pharma companies (Pfizer, Roche, Novartis, J&J) operate R&D sites across multiple continents.
- **Estimated size:** [best guess: the majority of large pharma companies have geographically distributed operations. If commercial customers are ~46% of the synthesis market and ~30% of those are at multi-site companies, ~14% of synthesis orders could come from distributed-commercial customers. But not all will show address divergence — only those where the billing entity (finance/HQ) is geographically separate from the shipping site (lab).]
- **Behavior of the check on this category:** false-positive (soft or hard flag; reviewer must verify the multi-site relationship)
- **Reasoning:** Similar to Gap 1 but in the commercial context. The mitigation is the same: exception lists keyed on (customer, address triple). Large pharma accounts are high-value and likely to get fast exception-list coverage; small distributed biotechs may face more friction.

### Gap 4: Driving-distance attacker (structural bypass)
- **Category:** An attacker who selects target institutions within driving distance of their actual residence (the inbox-compromise branch's Method 1). The billing address is the attacker's real card (near their home), the shipping address is the attacker's real area, and the institutional address is a nearby institution they have compromised. The address triple is geographically consistent.
- **Estimated size:** The implementation doc explicitly identifies this as a structural limitation. [best guess: the effectiveness depends on the density of research institutions near the attacker. In the US Northeast corridor, SF Bay Area, or Research Triangle, an attacker can find target institutions within 50 km of their home. In less dense areas, the attacker would need to accept a longer driving distance, which widens the metro-mismatch gap.] [unknown — searched for: no specific search — this is an adversarial analysis rather than a demographic gap].
- **Behavior of the check on this category:** no-signal (the check passes; the triple is consistent)
- **Reasoning:** This is not a customer-category gap but an adversarial-design gap. The check catches geographic divergence, not "wrong person at the right place." The implementation doc correctly notes this for the synthesis stage. The mitigation is orthogonal controls (identity verification, voucher checks) rather than address consistency.

### Gap 5: Missing billing address from tokenized/alternative payment methods
- **Category:** Customers paying via Apple Pay, Google Pay, or ACH where the PSP returns only a partial billing address (e.g., ZIP code and country only, no street) or no billing address. The rules engine cannot compute street-level or metro-level consistency.
- **Estimated size:** [unknown — searched for: "Apple Pay ACH billing address partial missing card payment percentage"]. Apple Pay transactions do pass the underlying card's billing address to the merchant in most configurations, but some integrations strip street-level detail. ACH (bank transfer) payments typically have no card billing address at all. [best guess: 5–15% of orders at a US synthesis provider may use a payment method that returns partial or no billing address, based on the growing share of digital wallets and ACH in B2B payments.]
- **Behavior of the check on this category:** weak-signal (the check can only compare at the country/ZIP level, missing the street/metro precision that catches mismatch)
- **Reasoning:** The rules engine must degrade gracefully when billing-address fields are missing. The implementation doc notes this as a failure mode. Mitigation: require full billing address on all payment methods, or fall through to other M12 checks when billing address is incomplete.

### Gap 6: International address normalization quality
- **Category:** Non-US customers whose addresses are normalized with lower accuracy by the chosen address-normalization service. Smarty's US product is high-quality, but international normalization is less reliable. libpostal has broad but variable coverage. Geocoding quality for addresses in Africa, parts of Asia, and some Latin American countries is poor.
- **Estimated size:** ~45% of the synthesis market is non-US [source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799). The fraction with poor normalization depends on the country. [best guess: addresses in OECD countries (EU, Japan, Korea, Australia) normalize well; addresses in non-OECD countries (where ~10–15% of international synthesis customers may be) normalize poorly. So perhaps 5–7% of all synthesis orders have addresses that the normalizer handles unreliably.]
- **Behavior of the check on this category:** weak-signal (the normalizer produces a result, but it may be wrong — leading to either false matches or false mismatches)
- **Reasoning:** Normalization errors can go in either direction: a correct address parsed incorrectly triggers a false mismatch (false positive), or a different address parsed identically causes a false match (missed detection). The implementation doc recommends pinning to one normalizer to avoid cross-normalizer disagreement, but the underlying data quality issue remains.

## Refined false-positive qualitative

1. **Multi-campus universities / national labs** (Gap 1) — the dominant false-positive class by volume. Plausibly several percent of legitimate orders.
2. **Visiting researchers** (Gap 2) — moderate volume; higher reviewer friction than Gap 1.
3. **Distributed pharma/biotech** (Gap 3) — moderate volume among commercial customers; mitigable with exception lists for large accounts.
4. **International researchers using a US card from grad-school years** — mentioned in the implementation doc; a variant of Gap 2 where the billing address is a legacy US address.
5. **Field-station orders** — shipping to remote research stations far from the canonical campus. A subset of Gap 1.

## Notes for stage 7 synthesis

- The false-positive surface is wide and structurally unavoidable: legitimate address divergence is common in research. The check's value comes from catching the *uncommon* case (stranger-billing on a hijacked account) while accepting review load on the *common* cases (distributed institutions).
- Gap 4 (driving-distance attacker) is a hard structural limitation. This check does not catch a geographically local attacker with a compromised institutional account. The synthesis should note that identity-verification controls (M14, M20) are the complement for this bypass class.
- Gap 5 (missing billing address) is increasingly relevant as digital wallet and ACH adoption grows. The rules engine's graceful degradation is load-bearing.
- Reviewer cost is the primary ongoing expense of this idea. The implementation doc's SOP target of 15 minutes per case, applied to the false-positive population (Gaps 1–3), could be a substantial labor cost if thresholds are not well-tuned.
