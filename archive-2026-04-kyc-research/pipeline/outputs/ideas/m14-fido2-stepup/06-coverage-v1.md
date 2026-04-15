# Coverage research: FIDO2 / WebAuthn order-time step-up + device binding

## Coverage gaps

### Gap 1: Customers without any FIDO2-capable authenticator at onboarding time
- **Category:** Customers who do not own a hardware security key and whose device lacks a platform authenticator (older desktops without TPM/biometric, shared lab desktops, thin clients, legacy institutional machines).
- **Estimated size:** Platform authenticator support covers iOS 13+ (2019), Android 7+ (2016), Windows Hello (Win 10+), macOS Touch ID (2016+). The FIDO Alliance reports 69% of users now have at least one passkey [source](https://fidoalliance.org/fido-alliance-champions-widespread-passkey-adoption-and-a-passwordless-future-on-world-passkey-day-2025/). This means ~31% of the general population does not yet have a passkey. Among DNA synthesis customers — who skew toward institutional researchers using shared lab desktops — the figure is likely higher. [best guess: 20–40% of synthesis customers would need to be issued a hardware key or guided through platform authenticator enrollment before the check produces any signal. Reasoning: synthesis ordering often happens from shared institutional workstations that lack biometrics; academic IT environments lag consumer adoption; the 69% passkey figure is general-population and skews toward mobile-first consumers.]
- **Behavior of the check on this category:** no-signal (the customer simply cannot complete the ceremony until they enroll a credential)
- **Reasoning:** The check is gated on enrollment. Any customer who has not enrolled a FIDO2 credential produces `webauthn_no_credentials` and is blocked. This is by design (fail-closed), but if the enrollment friction is too high, it becomes a coverage gap rather than a security feature.

### Gap 2: Shared-lab and core-facility accounts
- **Category:** DNA synthesis orders placed through institutional core facility accounts or shared-lab procurement accounts where the "orderer" is not a single human — the account represents a facility, and multiple lab members place orders through it.
- **Estimated size:** Research cores are common in academic institutions — Ithaka S+R documents that most research universities operate shared-equipment cores [source](https://sr.ithaka.org/publications/what-is-a-research-core/). Among synthesis customers, academic institutions make up roughly 54% of the gene synthesis market [source](https://www.imarcgroup.com/gene-synthesis-market). A non-trivial fraction of academic orders flow through centralized procurement or core-facility accounts. [best guess: 10–25% of academic synthesis orders are placed through shared/core-facility accounts rather than individual PI accounts. Reasoning: core facilities handle bulk ordering for cost efficiency; precise figures not publicly reported for synthesis specifically.]
- **Behavior of the check on this category:** structural mismatch — FIDO2 binds a credential to a single human, but the account represents a facility. Either (a) one person's credential is bound and only they can order, defeating the purpose of a shared account, or (b) multiple credentials are enrolled, weakening the "same human" guarantee.
- **Reasoning:** WebAuthn's strength (human-binding) is a weakness for multi-user institutional accounts. The SOP would need to either mandate per-user accounts (adding friction and changing the provider's account model) or accept that shared accounts degrade to "one of N authorized humans."

### Gap 3: Customers in countries where hardware key shipping is restricted or infeasible
- **Category:** Researchers in sanctioned jurisdictions (OFAC-listed), conflict zones, or countries with unreliable postal systems where physical YubiKey delivery is impractical — AND whose personal devices lack platform authenticators.
- **Estimated size:** OFAC comprehensively sanctions ~6 countries (Cuba, Iran, North Korea, Syria, Russia partial, Venezuela partial). Additional countries with unreliable mail: parts of Sub-Saharan Africa, Central Asia. DNA synthesis customers in these regions: [best guess: <3% of the global synthesis customer base. Reasoning: the synthesis market is concentrated in OECD countries (~80%+ per market reports [source](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799)); sanctioned-country customers are a small tail, and most would be excluded by other measures (M06 country-group checks) before reaching M14.]
- **Behavior of the check on this category:** no-signal if hardware key required; weak-signal if platform authenticator accepted (device may be old/shared).
- **Reasoning:** This gap is small in absolute terms but creates a hard exclusion for the affected researchers, with no workaround if platform authenticator is also unavailable.

### Gap 4: Accessibility — customers unable to perform biometric or PIN-based user verification
- **Category:** Researchers with certain physical disabilities that prevent fingerprint scanning, facial recognition, or PIN entry on an authenticator (severe motor impairments, certain visual impairments with assistive setups that conflict with the WebAuthn ceremony UX).
- **Estimated size:** [best guess: <1% of synthesis customers. Reasoning: the WebAuthn spec supports PIN as an alternative to biometric UV, which covers most accessibility cases; the residual population that cannot perform either biometric or PIN verification is very small. The W3C WCAG working group has flagged WebAuthn accessibility concerns but no quantified population estimate exists.] [unknown — searched for: "WebAuthn accessibility disability percentage users unable", "FIDO2 accessibility barriers statistics", "biometric authentication disability exclusion rate"]
- **Behavior of the check on this category:** no-signal (cannot complete the ceremony)
- **Reasoning:** Important for equity/compliance but numerically small. The SOP should document an alternative path (e.g., in-person verification) for ADA/disability accommodation.

### Gap 5: Commercial / CRO customers with high staff turnover on a single account
- **Category:** Contract research organizations (CROs) and commercial biotech companies where the person who completed onboarding IDV and enrolled a FIDO2 credential has left the organization, and the new orderer must re-enroll — triggering the full IAL2 re-proof + FIDO2 enrollment ceremony every time staff turns over.
- **Estimated size:** CROs represent a meaningful fraction of commercial synthesis customers. Biopharmaceutical and diagnostics companies hold ~42% of the DNA synthesis market [source](https://www.prophecymarketinsights.com/market_insight/dna-synthesis-market-5727). CRO staff turnover in research roles is notably high (industry reports cite 20–30% annual turnover in CRO clinical roles). [best guess: 5–15% of commercial-account orders per year would be affected by staff turnover requiring re-enrollment. Reasoning: not every commercial customer is a CRO, and not every turnover event affects the synthesis-ordering role specifically.]
- **Behavior of the check on this category:** false-positive (the new legitimate orderer cannot authenticate until re-enrolled, which delays orders) + operational friction
- **Reasoning:** This is not a coverage gap in the sense of "the check gives no signal" — it's a friction gap. The check works correctly (blocks the new person because they're not the enrolled person), but the remediation path (fresh IAL2 + FIDO2 enrollment) is heavyweight for organizations with frequent staff changes.

### Gap 6: Cross-device passkey sync and cloud-account compromise
- **Category:** Customers who use synced passkeys (Apple iCloud Keychain, Google Password Manager, 1Password) rather than device-bound credentials. If the customer's cloud account is compromised, the attacker can sync the passkey to their own device.
- **Estimated size:** The FIDO Alliance reports 69% of users have a passkey, and the vast majority of these are synced passkeys via Apple/Google/1Password rather than hardware-bound [source](https://fidoalliance.org/fido-alliance-champions-widespread-passkey-adoption-and-a-passwordless-future-on-world-passkey-day-2025/). [best guess: 80–95% of passkeys in the wild are synced/backed-up. Reasoning: Apple and Google auto-create synced passkeys; hardware security keys are a niche population.]
- **Behavior of the check on this category:** weak-signal — the WebAuthn assertion still requires user verification (biometric/PIN) on the syncing device, but the "device-bound" guarantee is lost. The `credentialBackedUp` flag reveals this, but if the provider accepts synced passkeys, the security model degrades from "same physical device" to "same cloud account."
- **Reasoning:** If the SOP mandates `credentialBackedUp = false` (device-bound only), coverage collapses to the ~5–20% of users with hardware security keys. If it accepts synced passkeys, it's more inclusive but weaker. This is a fundamental trade-off the integrator must decide.

## Refined false-positive qualitative

Updated from 04-implementation-v1:

1. **New researchers without enrolled authenticator** (Gap 1) — false-positive at first order; resolved by enrollment. Scale: potentially 20–40% of customers at rollout.
2. **Shared-lab / core-facility accounts** (Gap 2) — structural mismatch, not a transient FP. Scale: ~10–25% of academic orders.
3. **Staff turnover on CRO/commercial accounts** (Gap 5) — recurring FP. Scale: 5–15% of commercial orders/year.
4. **Accessibility-excluded users** (Gap 4) — permanent FP without alternative path. Scale: <1%.
5. **Privacy-conscious researchers** who refuse biometric UV — overlaps with Gap 1; scale unknown but small.
6. **Cross-device passkey users flagged by `credentialBackedUp` policy** (Gap 6) — if policy rejects synced passkeys, ~80–95% of passkey holders are excluded.

## Notes for stage 7 synthesis

- The dominant coverage question for FIDO2 step-up is not "does the check work on the covered population" (it works very well) but "how many customers can actually enroll and use a credential without prohibitive friction." The answer depends heavily on whether the provider accepts synced passkeys (high coverage, lower security) or demands device-bound credentials (low coverage, higher security).
- Pair with a vendor IDV (Jumio/Onfido/Persona) for the IAL2 re-proof at credential enrollment/re-enrollment — FIDO2 alone proves continuity of person, not identity.
- The shared-account problem (Gap 2) is structural and cannot be solved within WebAuthn; it requires an account-model change at the synthesis provider.
- Cold-start at rollout will generate a wave of `webauthn_no_credentials` blocks; the provider needs a migration/enrollment campaign.
