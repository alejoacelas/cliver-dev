# Measure 20 — Voucher-legitimacy (SOC)

Attacker stories that engage source-file Measure 8 (vouching by registered contact). Ordered most-directly-engaging first.

---

## lab-manager-voucher
- **Profile:** exploit-affiliation
- **Target:** Insider exploits PI/BSO rubber-stamping by a long-trusted real voucher; in some sub-variants the attacker is themselves the registered voucher.
- **Bypass excerpts (verbatim):**
  - "(b) PI rubber-stamps (modal path): The PI receives a vouching-approval request from their own trusted lab manager for a routine-looking oligo order. The PI clicks approve without reading the sequence context because hundreds of prior approvals were legitimate." Expertise: "Novice." Cost: "$0." Lead-up: "zero for long-tenured staff; weeks to months for new hires."
  - "(a) Attacker is the registered voucher: Under implementations that allow the same person to hold both ordering and vouching roles ... the attacker approves their own orders." Expertise: "Aspirant." Cost: "$0."
  - "(b') BSO-as-voucher architecture: ... the attacker exploits BSO volume-driven rubber-stamping." Cost: "$0."
  - "(c) Clinical / affiliate delegated batch vouching: ... vouching is delegated to a lab director who approves batch-level procurement requests." Cost: "$0."
  - "(d) Recruit PI/BSO as co-conspirator: ... $0 (ideological) to $100,000s (financial)."
  - "Partial — the only meaningfully binding measure in the entire matrix for this branch."
- **Why relevant:** Voucher-legitimacy is the single binding measure for this branch and the source enumerates seven sub-variants.
- **Persistent supply chain:** Y

## visiting-researcher
- **Profile:** fake-affiliation
- **Target:** Faculty sponsor (or lab admin / second lab member / second sponsor) acts as registered voucher. Vouching is structurally required; bypass is sponsor click-approve.
- **Bypass excerpts (verbatim):**
  - "Yes — structurally required, low friction, high attribution. This is the only measure that forces another human into the loop."
  - "Option 1 — Faculty sponsor as registered voucher: The sponsor who granted the visiting appointment registers as the second contact and approves SOC orders." Expertise: "Novice." Cost: "$0 marginal." Lead-up: "Minutes per order."
  - "Option 2 — Lab manager / departmental administrator as voucher." Cost: "$0."
  - "Option 3 — Second lab member." Cost: "$0."
  - "Option 4 — Second faculty sponsor." Expertise: "Practitioner." Lead-up: "Months."
- **Why relevant:** Source explicitly identifies M8 as the most structurally significant control for this branch.
- **Persistent supply chain:** Y

## unrelated-dept-student
- **Profile:** exploit-affiliation
- **Target:** Three path families (inherited voucher via host lab, straw purchaser, credential compromise). Each engages M8 differently.
- **Bypass excerpts (verbatim):**
  - "Yes. The single KYC-stack measure that can bind against this branch under the primary path."
  - "Bypass A — Pre-delegated ordering authority: Inherits pre-delegation from the host lab's PI." Cost: "$0."
  - "Bypass B — Per-order rubber-stamping by inattentive voucher." Cost: "$0 marginal."
  - "Bypass G — Straw purchaser via authorized lab member: ... Cost: $0 (favor) to an unanchored upper bound — roughly $5,000 per order as a ceiling." "Attacker entirely absent from provider records."
  - "Bypass F — Credential compromise of registered contact." Cost: "$0–$500."
  - "Bypass E — Recruit PI as knowing co-conspirator." Cost: "$0 (ideological alignment) to tens of thousands."
- **Why relevant:** Voucher engagement is the explicit binding step under all three Matrix B path families.
- **Persistent supply chain:** Y

## shell-nonprofit
- **Profile:** purpose-built-organization
- **Target:** Self-vouching from accomplice within the shell; if providers require cross-org independence, escalate to AitM phishing, credential compromise of a colliding institution's staff, gig-platform recruitment, or external recruited voucher.
- **Bypass excerpts (verbatim):**
  - "Self-vouching from accomplice within the shell: The accomplice, already registered as a second contact at M3 and biometrically committed at M6, approves each SOC order through the provider's vouching workflow." Cost: "No marginal cost beyond the accomplice figure ($5,000–$15,000 for Matrix B)."
  - "AitM phishing of an existing institutional voucher's session: ... Tycoon 2FA or EvilProxy phishing campaign." Expertise: "Practitioner to Expert." Cost: "$200–$600 for phishing kit + $50–$200 for lure infrastructure + 20–60 hours of operator time."
  - "Credential compromise of colliding institution's staff member." Cost: "$100–$500."
  - "Anonymous gig-platform voucher recruitment." Cost: "$500–$3,000 per vouch event."
  - "Recruit external voucher with independent institutional affiliation." Cost: "$1,000–$10,000+ per vouch event."
- **Why relevant:** Source flags M8 as "the load-bearing failure mode for Matrix B" and enumerates five distinct bypasses.
- **Persistent supply chain:** Y

## shell-company
- **Profile:** purpose-built-organization
- **Target:** Establish a second shell entity solely to act as cross-org voucher; or recruit external voucher; or social-engineer provider compliance staff.
- **Bypass excerpts (verbatim):**
  - "Bypass method 1: Establish a second shell entity ... Cost: ~$5-15K initial + $500-1,500/month ongoing." Lead-up: "Zero if started in parallel with the first entity."
  - "Bypass method 2: Recruit an external voucher ... Cost: $1,000-5,000 per vouching event, or a retainer."
  - "Bypass method 3: Social engineering of provider staff ... Cost: Negligible if the shell already has a scientifically credentialed front person. Otherwise ~$500-2,000."
- **Why relevant:** M8 is binding under cross-org requirement; source enumerates three engineered bypasses.
- **Persistent supply chain:** Y

## insider-recruitment
- **Profile:** impersonate-employee
- **Target:** Recruited insider serves as a real registered voucher, knowingly approving orders.
- **Why relevant:** Voucher is a real, recruited human — collapses M8 entirely.
- **Persistent supply chain:** Y

## account-hijack
- **Profile:** impersonate-employee
- **Target:** Hijack the registered voucher's account/session and self-approve.
- **Why relevant:** Direct attack on voucher authentication.
- **Persistent supply chain:** N

## credential-compromise
- **Profile:** impersonate-employee
- **Target:** Compromise PI/voucher credentials to approve own orders.
- **Why relevant:** Voucher identity is captured via credential theft.
- **Persistent supply chain:** N

## inbox-compromise
- **Profile:** fake-affiliation
- **Target:** Inbox compromise enables interception/forgery of voucher correspondence and approval flows.
- **Why relevant:** Vouching workflows that route via email are subverted by inbox control.
- **Persistent supply chain:** N

## dormant-account-takeover
- **Profile:** exploit-affiliation
- **Target:** Dormant accounts often have stale registered vouchers; takeover inherits the voucher relationship or exploits its inactivity.
- **Why relevant:** Stale voucher records are the M8 weakness exploited.
- **Persistent supply chain:** N

## biotech-incubator-tenant
- **Profile:** purpose-built-organization
- **Target:** Recruit a co-tenant or incubator staff member as cross-org voucher; the incubator's social density makes recruitment plausible.
- **Why relevant:** Voucher recruitment is a structural step in the branch.
- **Persistent supply chain:** Y

## community-bio-lab-network
- **Profile:** purpose-built-organization
- **Target:** Use community-lab peers as registered vouchers; the network's mutual-vouching norms make M8 cheap.
- **Why relevant:** Community norms enable peer-vouching at low cost.
- **Persistent supply chain:** Y

## cro-framing
- **Profile:** purpose-built-organization
- **Target:** Use a fake "client institution" as voucher, or self-vouch within the CRO entity.
- **Why relevant:** Voucher relationship is fabricated as part of CRO/client construction.
- **Persistent supply chain:** Y

## cro-identity-rotation
- **Profile:** purpose-built-organization
- **Target:** Each rotated CRO identity must reconstruct a voucher relationship.
- **Why relevant:** M8 is engaged on every rotation.
- **Persistent supply chain:** Y

## gradual-legitimacy-accumulation
- **Profile:** purpose-built-organization
- **Target:** Cultivate a long-term voucher relationship as part of accumulated legitimacy; voucher knows the entity casually and rubber-stamps.
- **Why relevant:** Voucher legitimacy is built up over time alongside other signals.
- **Persistent supply chain:** Y

## dormant-domain
- **Profile:** fake-affiliation
- **Target:** Pair the revived domain with a fabricated voucher persona on the same domain.
- **Why relevant:** Voucher and ordering personas share the inherited institutional shell.
- **Persistent supply chain:** Y

## foreign-institution
- **Profile:** fake-affiliation
- **Target:** Foreign-institution colleague as voucher, with verification asymmetry preventing real validation.
- **Why relevant:** Cross-border voucher verification is structurally weak.
- **Persistent supply chain:** Y

## it-persona-manufacturing
- **Profile:** exploit-affiliation
- **Target:** Manufacture a second persona to act as in-institution voucher, both with real IT-issued credentials.
- **Why relevant:** Voucher is a manufactured but credentialed "real" employee.
- **Persistent supply chain:** Y

## bulk-order-noise-cover
- **Profile:** exploit-affiliation
- **Target:** Voucher rubber-stamps within high-volume legitimate flow; SOC orders ride along.
- **Why relevant:** Voucher inattention under volume is the engaged failure mode.
- **Persistent supply chain:** Y
