# Coverage research: Anti-rubber-stamp voucher SOP (rate-limit + diversity audit)

## Coverage gaps

### Gap 1: Single-shot and low-volume rubber-stamp vouchers
- **Category:** A PI or senior figure who rubber-stamps only 1-5 vouches per quarter without reading them. This is the modal failure mode described in attacker stories — a busy PI clicks "approve" on a single request without due diligence — but the volume is far below any reasonable rate-limit threshold.
- **Estimated size:** [best guess: a median life-sciences PI supervises 6-10 people. If even 30% of PIs rubber-stamp occasional vouches without careful review, and there are ~30,000-40,000 active NIH-funded PIs alone ([source](https://www.nature.com/articles/d41586-022-00875-0)), that represents 9,000-12,000 PIs whose occasional low-volume rubber-stamping is structurally invisible to volume thresholds. The fraction of these whose vouches are for non-legitimate customers is unknown but the vulnerability exists.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The anti-rubber-stamp SOP's load-bearing triggers are volume-based (>20/quarter) and diversity-based (Herfindahl). A PI who rubber-stamps 3 vouches in a quarter — including one for a malicious actor — generates no signal. The `voucher_turnaround_fast` flag might catch a single rapid click, but only if the provider's system timestamps the request-to-approval interval and the PI approves in <60 seconds.

### Gap 2: Cross-provider voucher rotation
- **Category:** An attacker who uses a different DNA synthesis provider for each order, or distributes orders across multiple providers. Each provider sees only one vouch from the voucher, so no provider triggers volume or diversity alerts.
- **Estimated size:** There are more than 65 DNA synthesis companies globally, with ~55% based in North America. [source](https://www.rootsanalysis.com/reports/dna-synthesis-market.html) [best guess: an attacker rotating across even 3-5 major providers (Twist, IDT, GenScript, Eurofins, Azenta) would stay well under any single provider's threshold. No cross-provider voucher-sharing mechanism exists. [unknown — searched for: "IGSC shared vouching database", "cross-provider customer denylist gene synthesis"]]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The SOP operates on a single provider's internal database. Without cross-provider visibility, the attacker's total vouching footprint is invisible. The IGSC does not currently operate a shared voucher database.

### Gap 3: Legitimate high-volume vouchers (BSOs, department chairs, core-facility directors)
- **Category:** Institutional biosafety officers (BSOs), department chairs, and core-facility directors whose institutional role requires them to vouch for many people. NIH-funded institutions are required to have an IBC; each IBC includes at least one biosafety officer. [source](https://www.niehs.nih.gov/about/boards/ibc)
- **Estimated size:** [best guess: ~500-1,000 BSOs at US research institutions (roughly one per institution with an active NIH-funded research program). Each BSO may legitimately vouch for 20-100+ people per quarter depending on institution size. These individuals will be flagged by the volume threshold every quarter.]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** The SOP is designed to catch rubber-stampers, but BSOs and department chairs have a legitimate institutional mandate to approve many requests. The stage-4 implementation notes that the audit playbook should clear them quickly, but the recurring flag-and-clear cycle wastes reviewer time and creates alert fatigue.

### Gap 4: Ring-vouching across institutions (graph cycles > 4)
- **Category:** Coordinated groups of 5+ individuals at different institutions who vouch for each other in a chain long enough to exceed the ring-detection cycle-length limit (the implementation specifies cycles <= 4).
- **Estimated size:** [unknown — searched for: "voucher fraud ring length distribution", "referral fraud ring size detection"; no direct data on the distribution of ring lengths in vouching fraud. By analogy with financial referral fraud, rings of 5-10 participants are documented but rare.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The implementation's ring-detection sub-check catches cycles of length <= 4. A ring of 5+ participants, where no two adjacent members are at the same institution, evades both the cycle check and the diversity check.

### Gap 5: Providers with very low order volume
- **Category:** Small or newly-established DNA synthesis providers who process few orders per quarter. At low volume, a rubber-stamp voucher's activity is statistically indistinguishable from normal because the baseline is too small.
- **Estimated size:** ~50% of the 65+ DNA synthesis companies are small and recently established. [source](https://www.rootsanalysis.com/reports/dna-synthesis-market.html) [best guess: small providers handling <100 orders/quarter would not accumulate enough voucher-activity data for meaningful statistical detection]
- **Behavior of the check on this category:** weak-signal
- **Reasoning:** The Herfindahl index and rate-limit thresholds are calibrated for providers with substantial order volume. At a small provider, a voucher who vouches for 5 people in a quarter might represent a large fraction of all vouches, making the baseline unstable. Thresholds set for large providers would under-trigger at small ones; thresholds set for small providers would over-trigger at large ones.

## Refined false-positive qualitative

Cross-referencing the gaps above with the stage-4 false-positive list:

1. **Large-lab PIs** (stage 4) — confirmed and quantified. A PI supervising 15-30 trainees will routinely exceed thresholds. The audit should clear them but creates recurring friction. Gap 3 subsumes this.
2. **BSOs and IRB-style approvers** (stage 4) — confirmed as Gap 3. Highest false-positive volume category.
3. **Department chairs** (stage 4) — confirmed as Gap 3 sub-category.
4. **Core-facility directors** (stage 4) — confirmed as Gap 3 sub-category.
5. **Long-term collaborators with mutual vouching** (stage 4) — confirmed. The cycle-detection check (Gap 4) would flag mutual vouching between two PIs as a cycle of length 2; the reviewer must adjudicate.
6. **New addition: BSOs at institutions with many labs** — not in stage-4 list. These individuals may vouch for 50-100+ people/quarter and will be flagged every audit cycle, creating a permanent false-positive stream.

## Notes for stage 7 synthesis

- The SOP's primary structural weakness is that it detects only high-volume rubber-stamping. The modal attacker scenario (one PI rubber-stamps one vouch) is invisible.
- Cross-provider rotation is a fundamental gap that cannot be fixed by any single provider's internal SOP; it requires industry-wide infrastructure (shared voucher database) that does not exist.
- The `voucher_turnaround_fast` flag is the most discriminating sub-check, but it requires the provider's system to instrument request-to-approval timestamps — an implementation detail that the SOP should mandate.
- The false-positive rate for high-volume vouchers is structurally high; the SOP's value comes from the audit process, not the threshold trigger itself.
