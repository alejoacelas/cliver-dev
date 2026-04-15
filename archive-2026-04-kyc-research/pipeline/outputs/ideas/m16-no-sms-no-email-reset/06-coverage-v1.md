# Coverage research: No-SMS, no-email-reset SOP

## Coverage gaps

### Gap 1: Customers who lose their authenticator device
- **Category:** Customers who lose, break, or upgrade their phone/hardware key without first transferring their authenticator. Under this SOP, recovery requires a video call + IDV re-verification, which is significantly more friction than the email-based reset it replaces.
- **Estimated size:** Up to 50% of helpdesk tickets are for user lockouts ([Gartner via Nametag](https://getnametag.com/newsroom/the-recovery-gap-addressing-the-security-risks-in-mfa-password-resets)). Not all lockouts are lost-device events, but lost/replaced devices are a major driver. [best guess: 5-10% of the customer base per year will need an authenticator recovery event, based on phone upgrade cycles (~2-3 years) and occasional loss. For a provider with 10,000 active customers, that's 500-1,000 recovery tickets per year, each requiring $5-15 in human time.]
- **Behavior of the check on this category:** false-positive (the customer is legitimate but cannot log in; the recovery flow takes 15-30 minutes on a video call instead of 2 minutes with an email link).
- **Reasoning:** This is the central operational cost of the SOP. The implementation acknowledges it and specifies the video-call + IDV recovery path. The friction is intentional (email-based recovery is exactly the attack vector being closed), but the volume of affected customers is non-trivial.

### Gap 2: Customers at institutions without a reachable security contact
- **Category:** Customers at small institutions, startups, or independent labs where the "institutional security contact" notification step fails -- the contact has lapsed, the distribution list is dead, or no such role exists.
- **Estimated size:** [best guess: 10-20% of customer institutions lack a reliable security contact email. Small biotechs (which are ~42% of the synthesis market by revenue ([Fortune Business Insights](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799))) often lack a formal IT security function. Of those, a meaningful fraction won't have a valid contact for the notification step.]
- **Behavior of the check on this category:** weak-signal (the `recovery_notification_bounced` flag fires, but the SOP degrades to "customer must wait 48 hours" -- which is a friction-only mitigation, not a security signal).
- **Reasoning:** The institutional-notification step is a key anti-takeover control (the legitimate user gets an out-of-band heads-up). When the notification fails, the SOP loses this control and relies solely on the IDV step.

### Gap 3: Customers in regions where video calls are unreliable
- **Category:** Customers in locations with poor internet connectivity -- remote fieldwork sites, some developing-country institutions, satellite-only connections -- where the video-call recovery step fails or degrades.
- **Estimated size:** [best guess: 2-5% of a global provider's customer base. Gene synthesis orders from regions with unreliable connectivity are a small fraction (Asia-Pacific is 17% of the market, but most of that is in well-connected urban centers in China, Japan, Korea, and India). Searched for: "internet connectivity reliability researchers developing countries percentage" -- no synthesis-specific data.]
- **Behavior of the check on this category:** false-positive (the customer cannot complete the video-call recovery; they must use the async alternative of pre-recorded selfie + ID, which is slower and weaker).
- **Reasoning:** The implementation acknowledges this and offers an async fallback. The async fallback is less secure (pre-recorded selfie can be spoofed more easily than a live video call), so the SOP degrades for this population.

### Gap 4: Social engineering of help-desk agents
- **Category:** Attackers who social-engineer a help-desk agent into bypassing the SOP (e.g., by impersonating a panicked customer who "needs access urgently for a regulatory deadline"). This is the 0ktapus-style attack adapted to the recovery flow.
- **Estimated size:** The implementation flags this as a failure mode caught by audit-log review. [best guess: social-engineering success rates against trained help-desk staff are 2-5% per attempt in red-team exercises, per industry benchmarks. The SOP relies on the weekly audit catching violations after the fact. Searched for: "help desk social engineering success rate percentage" -- general industry figures suggest 10-20% success in untrained environments, dropping to 2-5% with specific training and documented SOPs.]
- **Behavior of the check on this category:** no-signal at the time of the attack (the bypass happens inside the recovery flow; the `recovery_completed_with_idv` event is absent but is only caught in the weekly audit, not in real time).
- **Reasoning:** This is the residual risk after the SOP is implemented. The implementation notes: "Help-desk agent is socially engineered into bypassing the SOP -- caught by audit-log review." The gap is that the audit is retrospective, not preventive.

### Gap 5: Customers with disability accommodations
- **Category:** Customers for whom video calls or hardware token manipulation is difficult due to physical or cognitive disabilities. The SOP requires a "reviewer-approved alternative path," but this path is unspecified and potentially weaker.
- **Estimated size:** [best guess: 1-2% of customers may require accessibility accommodations. Per CDC, ~26% of US adults have some disability, but the fraction that specifically affects video-call or hardware-token use in a synthesis-ordering context is much smaller. Searched for: "disability accommodation rate MFA enrollment enterprise" -- no data found.]
- **Behavior of the check on this category:** weak-signal (the alternative path is unspecified; it may be more vulnerable to social engineering or spoofing).
- **Reasoning:** The implementation acknowledges this as a false-positive source but does not define the alternative path. This is a policy gap, not a technical one.

## Refined false-positive qualitative

1. **Lost-device recovery** (Gap 1): highest-volume operational cost. 5-10% of customers per year. Each event costs $5-15 in human time plus customer friction.
2. **Unreachable institutional security contacts** (Gap 2): notification step fails for 10-20% of institutions. Degrades the anti-takeover control.
3. **Poor-connectivity regions** (Gap 3): video-call recovery fails; async fallback is weaker. 2-5% of global customers.
4. **Disability accommodations** (Gap 5): alternative path undefined. Small volume.

## Notes for stage 7 synthesis

- This is a policy + SOP idea, not an API integration. Its coverage gaps are operational (help-desk training, recovery flow friction) rather than technical (data source limitations).
- The central trade-off is security vs. friction: closing the email-based recovery channel eliminates the most common MFA-bypass vector but increases the cost of every legitimate recovery event by 5-10x in time and by $5-15 in human labor.
- The help-desk social engineering gap (Gap 4) is the residual risk. Mitigations: mandatory video-call recording, dual-agent sign-off for recovery events, real-time alerts (not just weekly audit) when a recovery completes without an IDV inquiry ID.
- This SOP pairs tightly with m16-dormancy-reidv (which triggers re-IDV on dormant accounts) and m16-auth0-okta (which provides the IdP configuration for disabling SMS and email-only reset). Together, these three ideas close the email-channel MFA recovery bypass from multiple angles.
- The volume of lost-device recovery events (Gap 1) is the make-or-break operational question. If the provider's customer base experiences 500-1,000 recovery events per year, the help-desk cost is $2,500-$15,000/year -- manageable. But the customer experience impact (15-30 minute recovery vs. 2-minute email reset) may drive churn in price-sensitive segments.
