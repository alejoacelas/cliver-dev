# m02-mx-tenant — implementation v1

- **measure:** M02
- **name:** MX / M365 / Workspace tenant + SPF/DMARC
- **modes:** D, A
- **summary:** For the customer's email domain, resolve MX, SPF (TXT `v=spf1`), and DMARC (`_dmarc.<domain>` TXT) via DNS, then probe Microsoft's GetUserRealm endpoint to detect an Entra/M365 tenant. Classify the mail-hosting backend (Google Workspace, M365, self-hosted, generic). Combine with M02 idea checks: a "professional institutional domain" should normally have DMARC and either a Workspace/M365 tenant or self-hosted infra consistent with the institution.

## external_dependencies

- **DNS resolver** — system resolver or `dnspython` ([dnspython project](https://www.dnspython.org/)). No vendor.
- **Microsoft GetUserRealm endpoint** — `https://login.microsoftonline.com/getuserrealm.srf?login=user@<domain>&xml=1` and `https://login.microsoftonline.com/<domain>/.well-known/openid-configuration` ([Medium: Azure tenant discovery](https://medium.com/@tareshsharma17/azure-tenant-discovery-reconnaissance-a-practical-guide-for-external-testers-b67c3c69f15f)).
- **Google Workspace MX fingerprint** — `ASPMX.L.GOOGLE.COM` (and historic `ALT[1-4].ASPMX.L.GOOGLE.COM`) is the unambiguous indicator a domain delivers mail via Google Workspace ([Truly Inbox: Google Workspace MX values](https://support.trulyinbox.com/en/articles/9310570-google-workspace-mx-record-values)).
- **Optional Python libs** — `checkdmarc` parses SPF + DMARC + MX in one call ([checkdmarc on PyPI](https://pypi.org/project/checkdmarc/)).

## endpoint_details

- **DNS:** UDP/TCP 53. No auth, no rate limit beyond resolver capacity. ToS: none. `[best guess: a busy provider should run a local recursive resolver (Unbound) to avoid hammering 8.8.8.8.]`
- **GetUserRealm:** `GET https://login.microsoftonline.com/getuserrealm.srf?login=anything@<domain>&xml=1`. No auth required. Returns XML with `NameSpaceType` (`Managed` = Entra-managed cloud tenant, `Federated` = ADFS/3rd-party SSO, `Unknown` = no tenant), `DomainName`, `FederationBrandName` ([Microsoft Learn: Partner Center identity discovery](https://learn.microsoft.com/en-us/partner-center/account-settings/find-ids-and-domain-names); [Medium: Azure Tenant Discovery](https://medium.com/@tareshsharma17/azure-tenant-discovery-reconnaissance-a-practical-guide-for-external-testers-b67c3c69f15f)).
- **OpenID config:** `GET https://login.microsoftonline.com/<domain>/.well-known/openid-configuration` returns the tenant GUID in the `issuer` URL if a tenant exists; 400 otherwise.
- **Rate limits:** [unknown — searched for: "GetUserRealm rate limit", "login.microsoftonline.com getuserrealm throttle"] — Microsoft does not document a rate limit; in practice these endpoints are extremely tolerant for low-volume use.
- **ToS:** [unknown — searched for: "GetUserRealm terms of service", "login.microsoftonline.com terms reconnaissance allowed"] — these endpoints are unauthenticated and widely scraped by IR/AAD reconnaissance tools (AADInternals etc.); no public ToS prohibits a KYC use.
- **Pricing:** $0.

## fields_returned

From DNS:
- `mx_records[]` — host + preference
- `spf_record` — raw TXT, with parsed mechanisms (via `checkdmarc`)
- `dmarc_record` — raw TXT, with parsed `p=` (none/quarantine/reject), `rua=`, `ruf=`
- `dnssec_status` — bool

Derived classifier (own code):
- `mx_provider` — one of `google_workspace`, `microsoft_365`, `proofpoint`, `mimecast`, `barracuda`, `self_hosted`, `generic_shared_hosting`, `unknown` — derived from MX hostname patterns ([Truly Inbox MX values](https://support.trulyinbox.com/en/articles/9310570-google-workspace-mx-record-values)).
- `m365_tenant_present` — bool
- `m365_tenant_type` — `Managed` | `Federated` | `Unknown` (from GetUserRealm `NameSpaceType`)
- `m365_federation_brand` — string (from `FederationBrandName`)
- `m365_tenant_guid` — from openid-configuration `issuer`

## marginal_cost_per_check

- **Per check:** ~$0 (DNS + free Microsoft endpoint). `[best guess: <$0.0001 amortized for compute/bandwidth]`.
- **Setup cost:** Engineer time to write and maintain the MX-fingerprint regex table. `[best guess: 1–2 engineer-days initially, ongoing maintenance as new hosted-mail providers appear.]`

## manual_review_handoff

When a flag fires, the reviewer is presented with: the customer's claimed institution, the email domain, and a card with `mx_provider`, `m365_tenant_type`, `dmarc_p`, and the raw records. SOP:

1. If claimed institution is a recognizable university or large company, cross-check `m365_federation_brand` against the institution name; mismatch = elevate.
2. If `mx_provider == self_hosted` or `generic_shared_hosting` and the institution is a small org, look for the institution's website and confirm the same MX/A records appear there. Many small labs legitimately self-host or use cPanel.
3. If `dmarc_p == none` or DMARC missing on a domain claiming to be a large institution, elevate. Most R1 universities deploy DMARC at `quarantine` or `reject` `[best guess based on common practice; coverage stage will quantify]`.
4. If `m365_tenant_type == Managed` and `FederationBrandName` is just the bare domain (no human-readable institution name), this is a freshly-provisioned shell-tenant pattern — elevate.

## flags_thrown

| Flag | Trigger | Standard human action |
|---|---|---|
| `mx_generic_provider` | MX points at shared/cPanel/Namecheap/IONOS-style hosting on a domain that *claims* to be a university | Manually verify the institution's real MX |
| `mx_self_hosted_unverified` | MX is a host on the same domain (e.g., `mail.<domain>`) and not the institution's published mail infra | Cross-check with institution's public records |
| `spf_missing` | No `v=spf1` TXT | Elevate |
| `dmarc_missing` | No `_dmarc.<domain>` TXT | Elevate |
| `dmarc_p_none` | DMARC present but `p=none` on a domain claiming to be a large institution | Elevate |
| `m365_no_tenant` | GetUserRealm returns `Unknown` and MX is M365-shaped | Mismatch — elevate |
| `m365_tenant_brand_mismatch` | `FederationBrandName` does not match claimed institution | Elevate |

## failure_modes_requiring_review

- DNS timeouts / SERVFAIL → retry once, then queue for human.
- Domain has wildcard MX or SPF redirect chains too deep for `checkdmarc` to resolve → reviewer gets the raw records.
- Customer's institution legitimately self-hosts (some life-sciences institutes do) → false positive on `mx_self_hosted_unverified`.
- Brand-new institutional domain has not yet propagated DMARC `[best guess]`.

## false_positive_qualitative

- Small labs and biotech startups that use Google Workspace or M365 under their own commercial-looking `.com` (the `cro-framing` and `shell-company` attacker stories live here): the check passes them as "M365-managed" alongside legitimate small biotechs. **The check cannot distinguish a clean shell from a clean small biotech on MX/DMARC alone** — this is a structural weakness inherited by every M02 idea below the institutional-domain-allowlist tier.
- Self-hosted academic institutions in non-Anglophone regions (some EU and JP universities still run their own mail).
- Domains that use Proofpoint/Mimecast as the public MX while M365 is the back-end → tenant detection still works via GetUserRealm but the MX-hosting classifier reports a security gateway, not the underlying tenant.

## record_left

- Raw MX, SPF, DMARC TXT records with timestamps.
- GetUserRealm XML response (or "no tenant" outcome).
- Computed `mx_provider`, `m365_tenant_type`, `m365_federation_brand`, `m365_tenant_guid`.
- All flags fired and the version of the MX-fingerprint table used (for replay).

## attacker_stories_addressed

`lookalike-domain` (caught: M365 tenant freshly minted with brand mismatch); `inbox-compromise` (NOT caught: real institution, real MX, real tenant); `shell-company` (NOT caught: clean Workspace/M365 setup is the construction).
