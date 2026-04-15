# Coverage research: MX / M365 / Workspace tenant + SPF/DMARC

## Coverage gaps

### Gap 1: Self-hosted academic institutions (non-Anglophone, especially EU and JP)
- **Category:** Universities and research institutes that run their own mail servers (Postfix, Zimbra, etc.) rather than using Google Workspace or M365 — predominantly in continental Europe (Germany, France, Nordics) and Japan, where institutional IT culture favours in-house infrastructure.
- **Estimated size:** [best guess: ~15-25% of non-US R1-equivalent universities self-host email. ~80% of .edu domains have DMARC records but only ~50% enforce quarantine/reject policy ([Valimail: DMARC in higher education](https://www.valimail.com/blog/dmarc-adoption-higher-education/); [DMARC Report: US education sector](https://dmarcreport.com/blog/dmarc-adoption-amongst-us-education-sector/)). European universities have even lower enforcement: 54% of UK HE domains lack enforcement-level DMARC ([dmarcian: EU higher education](https://dmarcian.com/dmarc-adoption-european-higher-education/)). Self-hosted institutions with weak DMARC will trip `dmarc_p_none` or `dmarc_missing` flags despite being entirely legitimate.]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** These institutions produce `mx_provider = self_hosted` and often `dmarc_p_none`. The check flags them identically to a malicious actor who set up a self-hosted mail server. Reviewers can usually resolve this manually (institution website cross-check), but at scale this creates queue volume.

### Gap 2: Small commercial biotech / CROs with generic cloud email
- **Category:** Legitimate early-stage biotech companies (seed through Series A) and small CROs that use Google Workspace or M365 under a `.com` domain — indistinguishable from a shell company or CRO-framing attacker also using Workspace/M365.
- **Estimated size:** DNA synthesis customers are roughly 46% commercial (biopharmaceutical + CRO) and 54% academic/government ([Fortune Business Insights: DNA Synthesis Market](https://www.fortunebusinessinsights.com/dna-synthesis-market-109799)). Of the commercial segment, [best guess: 30-50% are small companies (<50 employees) that would look identical to a shell company on MX/DMARC signals alone]. Google Workspace holds ~44% of the cloud productivity market, M365 ~30% ([DataStudios: Microsoft 365 adoption 2025](https://www.datastudios.org/post/microsoft-365-adoption-in-2025-businesses-how-deep-is-its-global-reach)).
- **Behavior of the check on this category:** no-signal (pass-through)
- **Reasoning:** The check is structurally unable to distinguish a legitimate small biotech from a malicious shell company when both have the same M365-managed tenant + `dmarc_p=reject` configuration. The 04-implementation already acknowledges this as a structural weakness. These customers pass the check cleanly, which is correct behaviour for them but means the check provides zero signal for the attacker stories it most needs to catch (`shell-company`, `cro-framing`).

### Gap 3: Customers using free-mail or ISP email (Gmail, Yahoo, etc.)
- **Category:** Legitimate independent researchers, consultants, or small firms who use a `@gmail.com` or `@yahoo.com` address — their domain's MX/DMARC is Google's or Yahoo's infrastructure, which is clearly legitimate but reveals nothing about the customer's identity.
- **Estimated size:** [best guess: 5-15% of synthesis orders come from free-mail addresses, based on general B2B e-commerce patterns where ~10% of business-context orders use personal email]. No synthesis-industry-specific data found. [unknown -- searched for: "percentage of gene synthesis orders from gmail addresses", "DNA synthesis customer email domain distribution"]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** MX/DMARC for `gmail.com` returns Google's infrastructure with `dmarc_p=reject` — a clean pass. The check provides zero discriminating signal. These customers must be screened by other M02 ideas (e.g., m02-ror-domain-match, which would flag free-mail).

### Gap 4: Institutions behind email security gateways (Proofpoint, Mimecast, Barracuda)
- **Category:** Large universities and companies whose public MX records point to a security gateway (Proofpoint, Mimecast) rather than directly to M365 or Google Workspace.
- **Estimated size:** [best guess: 20-40% of R1 universities use Proofpoint or Mimecast as their inbound mail gateway. Proofpoint claims >50% of Fortune 100 companies use its email protection ([Proofpoint corporate site](https://www.proofpoint.com/us/company)). Among universities, penetration is lower but significant.]
- **Behavior of the check on this category:** weak-signal
- **Reasoning:** The `mx_provider` classifier will report `proofpoint` or `mimecast` rather than the underlying `microsoft_365` or `google_workspace`. The M365 GetUserRealm probe still works (it is independent of MX), so `m365_tenant_present` remains informative. But the MX-based half of the check loses its classificatory power. This is a partial degradation, not a total gap.

## Refined false-positive qualitative

1. **Self-hosted academic mail (Gap 1):** Triggers `mx_self_hosted_unverified` + potentially `dmarc_p_none` or `dmarc_missing`. Estimated to affect ~15-25% of non-US academic institutions. Reviewers can resolve but it generates queue volume.
2. **Legitimate rebrands / domain migrations:** An institution mid-migration (e.g., moving from self-hosted to M365) may have inconsistent records for weeks — `m365_no_tenant` could fire during the gap. Rare but high-stakes if the institution is a major customer.
3. **Brand-new institutional domains:** A newly established department or centre may not yet have DMARC deployed, triggering `dmarc_missing`. This overlaps with the attacker pattern (new shell domain also lacks DMARC), creating an irreducible FP/TP overlap.
4. **Small biotech with bare-domain M365 tenant brand (Gap 2 edge):** `FederationBrandName` being just the domain string (no human-readable name) is flagged as a "shell-tenant pattern" in the SOP, but many legitimate small companies never customise this field. [best guess: majority of M365 tenants for companies <20 employees have the default brand name].

## Notes for stage 7 synthesis

- The check's main value is as a **negative signal detector** (catching missing DMARC, MX inconsistencies, and tenant mismatches) rather than a positive signal. It passes both legitimate small biotechs and shell companies identically — it cannot be a sole gate for the commercial segment.
- Pair with m02-ror-domain-match (for academic) and m02-rdap-age (for domain freshness) to cover the free-mail and small-commercial gaps.
- The ~50% of .edu domains at `dmarc_p=none` means the `dmarc_p_none` flag will fire on a substantial fraction of legitimate US academic customers — consider tuning the flag to only fire when combined with another risk signal.
