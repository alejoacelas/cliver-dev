# Measure 01 — sanctions-name-screen

**No relevant stories found.**

Searched all 19 wg attacker branches under `attackers/source/` for any bypass method, identity choice, or scenario element that would have to defeat, evade, or pre-empt a name-against-sanctions-list screen. None match. Across the branch set:

- Every branch has the attacker (or the recruited insider, accomplice, or compromised account holder) using their own real legal name and government-issued ID. No branch presents a name that is on a UN or national designated-persons list.
- The `foreign-institution` branch explicitly excludes sanctioned-jurisdiction operators: "The attacker holds a real passport from a strong-coverage country" and (from `visiting-researcher` covering the same identity model) "Export-control screening via Visual Compliance […] is a hard stop only for sanctioned-jurisdiction attackers, for whom Branch D does not apply."
- Branches that build new entities (`shell-company`, `shell-nonprofit`, `cro-framing`, `cro-identity-rotation`, `biotech-incubator-tenant`, `gradual-legitimacy-accumulation`, `community-bio-lab-network`, `dormant-domain`) use entity names of the attacker's choosing — none collide with names on national sanctions lists. Where the wg branches discuss list-screening at all (e.g., dormant-domain, cro-framing) the focus is denied-parties / restricted-parties screening of the *institution* address rather than the customer's personal name; even there no branch requires defeating a sanctions-name match because the chosen real names and entities are by construction not on lists.
- The `inbox-compromise`, `credential-compromise`, `account-hijack`, and `dormant-account-takeover` branches inherit a victim PI's already-cleared identity; the original holder is a real US/EU researcher and was not sanctions-listed at onboarding.

A measure-01 bypass would require the attacker (or impersonated identity) to actually be on a designated-persons list and engineer their way past the screen. None of the wg branches model that adversary; they all model attackers whose names trivially clear sanctions screening by construction. If a future attacker profile is added to the wg project for sanctions-listed individuals, this file should be revisited.
