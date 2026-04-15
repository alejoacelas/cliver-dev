# Coverage research: Phone re-verification cadence + SIM-swap monitoring

## Coverage gaps

### Gap 1: Customers on MVNOs and prepaid carriers without SIM-swap data
- **Category:** Customers whose phone numbers are on mobile virtual network operators (MVNOs) or prepaid carriers for which Telesign (or CAMARA/Open Gateway) cannot obtain SIM-swap data from the underlying MNO.
- **Estimated size:** Telesign's SIM-swap coverage extends to "over 16 countries" and "more than 40 MNOs." [source](https://www.telesign.com/blog/sim-swap-detection-a-key-factor-in-fraud-prevention) In the US, Telesign covers T-Mobile, AT&T, and Verizon directly, but coverage for MVNOs (Mint Mobile, Cricket, Boost, Google Fi, etc.) depends on whether the MVNO's host MNO exposes SIM-swap data to Telesign. [best guess: 10–20% of US wireless subscribers are on MVNOs or prepaid-only plans where SIM-swap data may be unavailable. Prepaid customer churn is up to 70% annually in some markets, [source](https://tridenstechnology.com/telecom-churn/) meaning the prepaid segment skews toward numbers that are frequently recycled — precisely the population where SIM-swap monitoring matters most but is least available.]
- **Behavior of the check on this category:** no-signal (Telesign returns "out of coverage" error; the `risk_indicator` is unavailable)
- **Reasoning:** The implementation notes: "Telesign coverage gaps for some MVNOs and prepaid lines: risk_indicator may be unavailable." The mitigation is fallback to the callback SOP.

### Gap 2: International customers on carriers outside Telesign's 40-MNO network
- **Category:** Customers in countries or on carriers not covered by Telesign's SIM-swap partnerships. Telesign covers 16 countries with SIM-swap; the rest of the world (~180+ countries) has no coverage.
- **Estimated size:** Gene synthesis customers outside the 16 Telesign-covered countries represent a substantial share. [best guess: 20–35% of international synthesis customers may be on carriers without SIM-swap coverage, based on the fact that Telesign's 16-country coverage likely includes the US, UK, Canada, and major EU markets but excludes much of Asia (except possibly India), Latin America, and Africa. Asia-Pacific is ~24% of the gene synthesis market. [source](https://www.gminsights.com/industry-analysis/gene-synthesis-market)]
- **Behavior of the check on this category:** no-signal for SIM-swap; SMS verification may still work but the swap-detection layer is absent.
- **Reasoning:** The implementation notes: "CAMARA / Open Gateway not yet covering all US tier-1 carriers reliably as of 2026; coverage in EU is stronger." International coverage is even patchier.

### Gap 3: Customers who legitimately changed their SIM (device upgrade, carrier switch, lost phone)
- **Category:** Legitimate customers who performed a real SIM swap or carrier port for non-fraudulent reasons — upgraded their phone, switched carriers for a better plan, replaced a lost/broken device.
- **Estimated size:** US telecom churn is 15–25% annually. [source](https://customergauge.com/blog/average-churn-rate-by-industry) Each carrier switch involves a port or SIM change that will trigger `risk_indicator ≥ 3`. Additionally, major phone launches (iPhone, Pixel) cause spikes in SIM provisioning. [best guess: at any 6-month cadence check, 10–15% of customers may have undergone a legitimate SIM change since last verification, producing a false `sim_swap_recent` flag]
- **Behavior of the check on this category:** false-positive (`sim_swap_recent` flag fires; account frozen pending reviewer contact)
- **Reasoning:** The implementation acknowledges this: "Customer legitimately changed SIM (lost phone, upgraded device) — produces risk_indicator ≥ 3 for the legitimate user."

### Gap 4: eSIM users triggering false swap signals
- **Category:** Customers using eSIM who provision or transfer their number to a new device. eSIM provisioning may look like a SIM swap to carrier-side detection systems.
- **Estimated size:** eSIM adoption is growing rapidly — [best guess: 15–25% of new smartphone activations in the US use eSIM as of 2025–2026, based on Apple's eSIM-only iPhone 14+ US models and growing Android eSIM support. The fraction of the installed base with eSIM is lower, perhaps 10–15%.]
- **Behavior of the check on this category:** false-positive (same as Gap 3 — `sim_swap_recent`)
- **Reasoning:** The implementation notes: "Customers using eSIM — eSIM provisioning can look like a swap to some carrier signals." eSIM provisioning involves carrier-side activation that is technically similar to a SIM swap from the network's perspective.

### Gap 5: Customers who have abandoned their phone number between cadence checks
- **Category:** Customers who changed their phone number entirely (not ported — disconnected the old number and got a new one) without updating their account with the synthesis provider. The old number may have been recycled to another subscriber.
- **Estimated size:** [best guess: 2–5% of customers per year may change their phone number without notifying the provider, based on general US phone number churn rates and the fact that many customers do not proactively update vendor accounts]
- **Behavior of the check on this category:** weak-signal (SMS verification goes to the wrong person, or fails silently; the cadence loop catches this eventually but the gap between number change and next cadence check is unmonitored)
- **Reasoning:** The implementation notes: "Customer has dropped the number entirely — SMS will silently fail. The cadence loop catches this." But until the next cadence check, the phone binding is stale.

### Gap 6: Customers roaming internationally
- **Category:** Researchers traveling internationally who may trigger SIM-swap-like signals due to temporary roaming arrangements, local SIM purchases, or dual-SIM configurations.
- **Estimated size:** [best guess: at any given time, 3–8% of active academic researchers may be traveling internationally, based on conference travel frequency and sabbatical/visiting patterns in academia]
- **Behavior of the check on this category:** false-positive (`sim_swap_recent` or porting signal fires due to roaming-related carrier events)
- **Reasoning:** The implementation notes: "Customer roaming internationally — short-term porting may show as a swap."

## Refined false-positive qualitative

The primary false-positive-generating categories are:
1. **Gap 3 (legitimate SIM changes):** The largest volume source. At a 6-month cadence, perhaps 10–15% of customers will have undergone a legitimate SIM/carrier change. All of these fire `sim_swap_recent` and freeze the account pending reviewer contact. This creates a substantial operational burden.
2. **Gap 4 (eSIM provisioning):** Growing as eSIM adoption increases. Overlaps with Gap 3 in mechanism but is distinct because the customer did not "swap" anything — they merely transferred their existing number to a new device.
3. **Gap 6 (international roaming):** Lower volume but high annoyance factor — the customer is traveling and gets their account frozen.

The no-signal categories (Gaps 1, 2) degrade to SMS-only verification without the swap-detection overlay. This is still useful but misses the specific SIM-swap attack vector.

## Notes for stage 7 synthesis

- The rebind cadence is a process wrapper around the SIM-swap detection signal. Its coverage gaps are inherited from the underlying SIM-swap data providers (Telesign, CAMARA).
- The false-positive rate is structurally high: legitimate SIM changes happen frequently (15–25% telecom churn annually), and every one triggers a flag. The reviewer-mediated path absorbs this but at significant cost.
- The check is most valuable for the account-takeover via SIM-swap scenario, which is a targeted attack. The attacker has to SIM-swap the specific victim's number. If the swap check fires before the attacker uses the account, the attack is blocked. This is a narrow but high-value use case.
- International coverage is patchy. Telesign covers 16 countries for SIM-swap; CAMARA/Open Gateway is expanding but unevenly. For a global synthesis provider, many customers will fall into the no-signal category for the swap-detection layer.
