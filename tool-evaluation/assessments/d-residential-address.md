# Step (d): Residential Address — Field Assessment

**Measure:** M04 — Residential address
**Endpoint groups assessed:** address-classification, llm-exa

---

## The core finding: RDI is bidirectionally unreliable

Smarty's Residential Delivery Indicator (RDI) is the only automated residential/commercial classification available. Our testing revealed it fails in both directions:

- **False positive:** Harvard's science building at 52 Oxford St, Cambridge returns `RDI=Residential`. A KYC pipeline relying on RDI would incorrectly flag legitimate university shipments to this address.
- **False negative:** A NYC residential high-rise at 200 E 89th St returns `RDI=Commercial`. A customer ordering to their apartment would NOT trigger the residential flag.

RDI reflects **USPS mail delivery infrastructure**, not building occupancy or zoning. Large apartment buildings with managed mailrooms get Commercial classification. Mixed-use buildings near university campuses may get either classification. The relationship between RDI and actual building use is noisy.

---

## Why "residential detection" should be reframed as "institutional verification"

Rather than trying to prove an address IS residential (negative detection), the pipeline should confirm the address IS institutional (positive confirmation). If step (a) -- address-to-institution -- finds a known institution at the shipping address, the residential flag is moot. If step (a) fails to find any institution at the address, that failure IS the residential signal.

This reframing means step (d) is largely subsumed by step (a):
- Step (a) passes -> address is institutional -> residential flag irrelevant
- Step (a) fails -> no institution found at address -> flag for review (which may or may not be residential)

The Smarty RDI check adds value only as a directional initial filter, never as a definitive classification.

---

## Google Places: strong for institutions, blind for residences

Google Places correctly classifies well-known institutions when the name is included:
- MIT -> university
- Pfizer -> manufacturer
- MGH -> general_hospital
- WeWork -> coworking_space
- IIT Bombay -> university (good international coverage)
- CSIR-CCMB India -> research_institute

But **address-only search returns "premise" for everything** -- MIT, Pfizer, residential homes, freight forwarders. Google Places cannot distinguish residential from commercial from institutional by address alone.

---

## Exa web search: commercial detection > residential detection

Exa reliably detects commercial buildings through real estate listing sites (LoopNet, CommercialCafe, CityFeet, office space marketplaces). If an address appears on commercial real estate sites, it is clearly not residential.

Residential detection is weaker. Zillow and Redfin results are strong residential signals when present, but coverage is incomplete for specific addresses. For a random residential address like "4512 Oak Lane, Bethesda," Exa found nearby listings but not the exact address. The LLM must infer from neighborhood context rather than finding definitive proof.

---

## Profile groups and resolution time

| Group | Time tier | Est. time | Fraction | Resolution path |
|---|---|---|---|---|
| US address at known institution | Auto | 0 min | ~40% | RDI=Commercial + Google Places returns institutional type. Residential flag not needed. |
| International address at known institution | Quick review | 2-5 min | ~25% | No Smarty. Google Places name+address returns institutional type. |
| US address, Smarty=Residential | Quick review | 2-3 min | ~10% | Flag fires. Reviewer checks Google Places + web search. May be false positive (Harvard). |
| US residential high-rise, Smarty=Commercial | Quick review | 1-2 min | ~5% | RDI misses it. Step (a) failure is the real signal. |
| Coworking/virtual office | Quick review | 2-3 min | ~5% | Google Places may show coworking_space. Not residential but shared. |
| No data (international, no Google Places result) | Investigation | 5-10 min | ~15% | No Smarty, Google Places returns premise. Exa search for building type. |

---

## Recommended approach

1. **Run step (a) first.** If an institution is confirmed at the address, the residential question is answered. Step (d) becomes a secondary check only when step (a) is inconclusive.
2. **Smarty RDI as directional filter** (US only). Flag `RDI=Residential` for review but do NOT treat `RDI=Commercial` as proof of non-residential use.
3. **Google Places name+address** for institutional verification.
4. **Exa web search** for ambiguous cases -- look for real estate listings (commercial or residential).
5. **Treat step (d) as a soft flag.** Residential addresses are suspicious but not dispositive. A researcher shipping to their home lab (community bio lab, home office) may be legitimate.

---

## Unresolved issues

1. **Smarty RDI** is bidirectionally unreliable. No fix available without a different data source.
2. **No automated residential classification for international addresses.** Google Places address-only returns "premise" everywhere.
3. **The residential flag's interaction with step (a)** should be formalized: step (d) fires only when step (a) finds no institution at the address.
4. **Community bio labs at residential addresses** (e.g., Genspace formerly at a residential address) are legitimate customers who will always trigger both the step (a) failure and the step (d) flag. These require the customer follow-up path.
