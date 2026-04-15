# Coverage research: Incubator / coworking tenant directory

## Coverage gaps

### Gap 1: Customers NOT at incubator addresses (the check doesn't fire)
- **Category:** Any customer whose shipping address does not match the curated denylist of known biotech incubator buildings. This includes: all academic institution addresses, all commercial biotech company headquarters, all home addresses, all non-incubator coworking spaces (WeWork, Regus), and all addresses in non-US countries.
- **Estimated size:** The implementation estimates ~30–50 known biotech-incubator buildings in the US [best guess from 04-implementation]. The total number of unique synthesis-customer shipping addresses is likely in the tens of thousands. [best guess: this check fires on <1% of all orders — only those shipping to the ~30–50 known incubator addresses. The remaining >99% of orders are invisible to this check.]
- **Behavior of the check on this category:** no-signal (by design)
- **Reasoning:** This is not a bug — the check is narrowly scoped to incubator addresses. But the narrow scope means it covers only a tiny slice of the customer base. Its value is entirely in catching the specific `biotech-incubator-tenant` attacker model.

### Gap 2: Incubators with poor or no public tenant directory (JLABS, invitation-only programs)
- **Category:** Customers at incubator addresses where the incubator does not publish a comprehensive public tenant directory. JLABS (13 locations globally) is the most prominent example — it is invitation-only with ~40 residents per location, and individual residents appear only selectively in press releases.
- **Estimated size:** JLABS has 13 locations [source](https://jnjinnovation.com/jlabs), with ~40 residents each = ~520 resident companies globally. Other invitation-only programs exist but are smaller. [best guess: of the ~30–50 tracked incubator addresses, perhaps 5–10 have no usable public directory, covering ~200–500 resident companies. For these addresses, the check defaults to `incubator_address_known_low_directory_quality` and requires manual contact.]
- **Behavior of the check on this category:** weak-signal (triggers manual contact with incubator manager, which may or may not succeed)
- **Reasoning:** The absence of a public directory means the automated scrape returns nothing, and the check falls back to email/phone contact with the incubator manager. This takes 5+ business days and may not yield a response. During that time, the order is held.

### Gap 3: Brand-new tenants not yet in public directories
- **Category:** Legitimate companies that have recently moved into an incubator (within the last 4–12 weeks) and have not yet appeared on the incubator's public-facing website.
- **Estimated size:** [unknown — searched for: "biotech incubator tenant listing delay weeks", "LabCentral resident directory update frequency"]. [best guess: at a typical incubator with 40–80 residents and an annual turnover of 20–30%, there are perhaps 8–24 new residents per year. At any given time, perhaps 2–6 residents are in the "recently moved in but not yet listed" window. Across ~30–50 tracked incubators, this is ~60–300 companies nationally at any time.]
- **Behavior of the check on this category:** false-positive (triggers `incubator_address_no_tenant_listing`)
- **Reasoning:** The company is legitimately at the incubator but the scraper hasn't seen them yet. Manual review (contacting the incubator) resolves this, but it takes days and blocks the order.

### Gap 4: Stealth-mode startups that never appear in public directories
- **Category:** Companies at incubators that intentionally do not list publicly — they are in stealth mode until a funding round or product launch.
- **Estimated size:** [unknown — searched for: "stealth mode biotech startup percentage incubator", "stealth startup fraction LabCentral BioLabs"]. [best guess: perhaps 5–15% of incubator residents at any given time are in stealth mode and do not appear on the public directory. Across tracked incubators, this might be 50–200 companies nationally.]
- **Behavior of the check on this category:** false-positive (triggers `incubator_address_no_tenant_listing`)
- **Reasoning:** Same as Gap 3 — the company is real but invisible to the scraper. Manual contact with the incubator may confirm tenancy, but the incubator itself may be contractually bound not to disclose stealth tenants.

### Gap 5: Non-biotech incubators and coworking spaces not on the denylist
- **Category:** Customers at coworking spaces, general-purpose incubators, university entrepreneurship centers, or newly opened biotech incubators not yet added to the denylist. Also includes international biotech incubators.
- **Estimated size:** The US has hundreds of general-purpose incubators and coworking spaces. One list identifies 16 notable US biotech incubators [source](https://www.excedr.com/resources/biotech-incubators), but the total including smaller and regional programs is likely 50–100+. The denylist covers ~30–50 buildings [best guess from 04-implementation], meaning 20–50+ biotech-relevant incubators are not tracked, plus all international ones. [best guess: the check misses perhaps 30–50% of all biotech incubator addresses and 100% of non-biotech coworking labs.]
- **Behavior of the check on this category:** no-signal (address not on denylist, check doesn't fire)
- **Reasoning:** The denylist is manually curated and inherently incomplete. New incubators open, existing ones rebrand or relocate, and the denylist must be maintained. The maintenance burden grows linearly.

## Refined false-positive qualitative

Updated from stage 4:

1. **Brand-new tenants** (Gap 3): ~60–300 companies nationally at any time [best guess]. Resolved by manual contact in 5+ days.
2. **Stealth-mode startups** (Gap 4): ~50–200 companies [best guess]. May not be resolvable even with manual contact if the incubator won't disclose.
3. **JLABS residents** (Gap 2): ~520 companies globally. Structurally weak signal — the entire population at JLABS addresses gets the low-directory-quality flag.
4. **Sub-tenants and fellows** (from stage 4): visiting academics using incubator space through partnership programs. Not in the tenant directory by design.

The combined false-positive population is small in absolute terms (maybe 200–800 companies nationally) but represents a high fraction of the orders this check actually fires on — since the check only fires on ~30–50 addresses, the false-positive rate among triggered cases may be 10–30%.

## Notes for stage 7 synthesis

- This check is **extremely narrow by design**: it fires on <1% of orders. Its value is entirely concentrated on the specific `biotech-incubator-tenant` attacker story.
- Even within its narrow scope, the false-positive rate is significant (Gaps 2–4) because incubator tenant directories are incomplete by nature.
- The check has a **structural limitation**: an attacker who actually leases bench space at an incubator (which the attacker model explicitly does for $1,500–5,000/mo) passes this check positively. The check catches only the subset of attackers who claim an incubator address without being a tenant.
- Maintenance cost is non-trivial: the denylist and scraper infrastructure must be maintained as incubators open, close, rebrand, and change their web layouts. This is a long-tail operational burden.
- Complementary with m05-google-places-campus: an incubator building inside a campus polygon passes the campus check, so the incubator-tenant check adds value specifically for incubator buildings that are NOT on a university campus (standalone commercial incubators in Kendall, SoMa, etc.).
