# Companies House API for Institution Screening

Investigation date: 2026-04-14

The [UK Companies House](https://find-and-update.company-information.service.gov.uk/) maintains the public register of UK companies, including registered office addresses, SIC codes (industry classification), officers, and filing history. Unlike ROR (city-level) or GLEIF (financial entities only), Companies House provides **street-level verified addresses for every UK-registered entity** -- making it a strong KYC signal for orders shipping to or claiming affiliation with UK organizations.

API base: `https://api.company-information.service.gov.uk/`
Auth: HTTP Basic Auth (API key as username, empty password).
Cost: Free. Rate limit: 600 requests per 5 minutes.

**Status:** API key not yet obtained. All response examples below are marked as expected responses based on public Companies House records and API documentation. See [00-api-key-setup.md](./00-api-key-setup.md) for setup instructions.

---

## 1. API Overview

Companies House exposes the following data for every UK-registered entity:

| Data | Endpoint | KYC value |
|---|---|---|
| **Registered office address** | `GET /company/{number}` or `GET /company/{number}/registered-office-address` | Street-level verified address -- the legally required contact address for the entity |
| **Company name & number** | `GET /company/{number}` | Canonical identity; the company number is a permanent unique identifier |
| **Company status** | `GET /company/{number}` | Active, dissolved, liquidation, etc. -- dissolved companies are a red flag |
| **SIC codes** | `GET /company/{number}` | Standard Industrial Classification -- verify that a claimed life-sciences company actually has life-sciences SIC codes |
| **Company type** | `GET /company/{number}` | Ltd, PLC, LLP, charity, etc. -- useful context |
| **Officers** | `GET /company/{number}/officers` | Directors and secretaries with appointment dates |
| **Filing history** | `GET /company/{number}/filing-history` | Annual returns, accounts filings -- activity indicator |
| **Persons with significant control** | `GET /company/{number}/persons-with-significant-control` | Beneficial ownership data |

**Why this matters for KYC:** UK entities are legally required to maintain a registered office address with Companies House. This address is verified through annual confirmation statements. If a customer claims affiliation with a UK entity, we can look up the registered address and compare it to the shipping address. A match at the street level is a much stronger signal than the city-level match ROR provides.

---

## 2. API Key Setup

See [00-api-key-setup.md](./00-api-key-setup.md) section 1 for full setup instructions. Summary:

1. Register at https://developer.company-information.service.gov.uk/
2. Go to "Manage Applications" > "Add new application"
3. Create a REST API key (not streaming)
4. Copy the key; store as `COMPANIES_HOUSE_API_KEY` in `~/.config/credentials/.env`

Auth method: HTTP Basic Auth with the API key as the username and an empty password. In curl, this is `-u "{API_KEY}:"` (note the trailing colon).

---

## 3. Example API Calls

All curl commands below require a valid API key. Replace `{API_KEY}` with the value of `COMPANIES_HOUSE_API_KEY`.

### 3a. Search for a company by name

**Search for "Wellcome Sanger Institute":**

```bash
curl -s -u "{API_KEY}:" \
  "https://api.company-information.service.gov.uk/search/companies?q=Wellcome%20Sanger%20Institute"
```

Note: The Wellcome Sanger Institute operates as **Genome Research Limited** (company 02742969) -- a private company limited by guarantee. Searching for "Wellcome Sanger Institute" may not return a direct hit because the registered company name is different. The name "Wellcome Sanger Institute" is a trading name, not the Companies House registered name. This is a real-world pitfall: institutional brand names often differ from legal entity names.

A better search:

```bash
curl -s -u "{API_KEY}:" \
  "https://api.company-information.service.gov.uk/search/companies?q=Genome%20Research%20Limited"
```

**Search for "Oxford Nanopore Technologies":**

```bash
curl -s -u "{API_KEY}:" \
  "https://api.company-information.service.gov.uk/search/companies?q=Oxford%20Nanopore%20Technologies"
```

### 3b. Get a company profile by number

Once you have a company number from the search results, get the full profile:

```bash
# Oxford Nanopore Technologies PLC
curl -s -u "{API_KEY}:" \
  "https://api.company-information.service.gov.uk/company/05386273"

# Genome Research Limited (Wellcome Sanger Institute)
curl -s -u "{API_KEY}:" \
  "https://api.company-information.service.gov.uk/company/02742969"
```

### 3c. Get registered office address only

```bash
curl -s -u "{API_KEY}:" \
  "https://api.company-information.service.gov.uk/company/05386273/registered-office-address"
```

---

## 4. Expected Response Formats

### 4a. Company Search Response

**Expected response (not live -- requires API key)**

`GET /search/companies?q=Oxford%20Nanopore%20Technologies`

```json
{
  "kind": "search#companies",
  "total_results": 10,
  "items_per_page": 20,
  "start_index": 0,
  "items": [
    {
      "kind": "searchresults#company",
      "title": "OXFORD NANOPORE TECHNOLOGIES PLC",
      "company_number": "05386273",
      "company_type": "plc",
      "company_status": "active",
      "date_of_creation": "2005-03-09",
      "address": {
        "address_line_1": "Gosling Building Edmund Halley Road",
        "address_line_2": "Oxford Science Park",
        "locality": "Oxford",
        "region": "Oxfordshire",
        "postal_code": "OX4 4DQ",
        "country": "United Kingdom"
      },
      "address_snippet": "Gosling Building Edmund Halley Road, Oxford Science Park, Oxford, Oxfordshire, OX4 4DQ, United Kingdom",
      "description": "05386273 - Incorporated on  9 March 2005",
      "links": {
        "self": "/company/05386273"
      },
      "matches": {
        "title": [1, 37]
      }
    }
  ]
}
```

**Key fields in search results:**

| Field | Type | Description |
|---|---|---|
| `title` | string | Company name (matches `company_name` in profile) |
| `company_number` | string | Permanent unique identifier -- use this to fetch the full profile |
| `company_type` | string | `ltd`, `plc`, `llp`, `private-unlimited`, etc. |
| `company_status` | string | `active`, `dissolved`, `liquidation`, `receivership`, `administration` |
| `address` | object | Registered office address (same fields as profile) |
| `address_snippet` | string | Single-line version of the address |
| `date_of_creation` | date | Incorporation date |
| `date_of_cessation` | date | Present only for dissolved/closed companies |

### 4b. Company Profile Response

**Expected response (not live -- requires API key)**

`GET /company/05386273`

```json
{
  "company_name": "OXFORD NANOPORE TECHNOLOGIES PLC",
  "company_number": "05386273",
  "company_status": "active",
  "type": "plc",
  "date_of_creation": "2005-03-09",
  "jurisdiction": "england-wales",
  "sic_codes": [
    "72190"
  ],
  "registered_office_address": {
    "premises": "Gosling Building",
    "address_line_1": "Edmund Halley Road",
    "address_line_2": "Oxford Science Park",
    "locality": "Oxford",
    "region": "Oxfordshire",
    "postal_code": "OX4 4DQ",
    "country": "United Kingdom"
  },
  "registered_office_is_in_dispute": false,
  "undeliverable_registered_office_address": false,
  "accounts": {
    "last_accounts": {
      "made_up_to": "2024-12-31",
      "type": "full"
    },
    "next_accounts": {
      "due_on": "2026-06-30"
    }
  },
  "confirmation_statement": {
    "last_made_up_to": "2026-03-08",
    "next_due": "2027-03-22"
  },
  "has_charges": true,
  "has_insolvency_history": false,
  "can_file": true,
  "previous_company_names": [
    {
      "name": "OXFORD NANOPORE TECHNOLOGIES LIMITED",
      "effective_from": "2008-05-19",
      "ceased_on": "2021-09-24"
    },
    {
      "name": "OXFORD NANOLABS LIMITED",
      "effective_from": "2005-03-09",
      "ceased_on": "2008-05-19"
    }
  ],
  "links": {
    "self": "/company/05386273",
    "filing_history": "/company/05386273/filing-history",
    "officers": "/company/05386273/officers",
    "charges": "/company/05386273/charges",
    "persons_with_significant_control": "/company/05386273/persons-with-significant-control"
  }
}
```

**Key profile fields for KYC:**

| Field | KYC use |
|---|---|
| `registered_office_address` | Street-level address to compare against shipping address |
| `registered_office_is_in_dispute` | Red flag if true |
| `undeliverable_registered_office_address` | Red flag if true |
| `company_status` | Must be `active` -- dissolved/liquidation is a flag |
| `sic_codes` | Verify life-sciences claim (see section 7) |
| `type` | Context on entity structure |
| `date_of_creation` | Very recently incorporated companies warrant extra scrutiny |
| `previous_company_names` | Detect name changes that might indicate evasion |
| `confirmation_statement.last_made_up_to` | Stale confirmation = company may be dormant |

### 4c. Registered Office Address Response

**Expected response (not live -- requires API key)**

`GET /company/05386273/registered-office-address`

```json
{
  "kind": "registered-office-address",
  "premises": "Gosling Building",
  "address_line_1": "Edmund Halley Road",
  "address_line_2": "Oxford Science Park",
  "locality": "Oxford",
  "region": "Oxfordshire",
  "postal_code": "OX4 4DQ",
  "country": "United Kingdom",
  "etag": "...",
  "links": {
    "self": "/company/05386273/registered-office-address"
  }
}
```

**Address fields:**

| Field | Description | Example |
|---|---|---|
| `premises` | Building name or number | `"Gosling Building"` |
| `address_line_1` | Street name | `"Edmund Halley Road"` |
| `address_line_2` | Additional line (optional) | `"Oxford Science Park"` |
| `locality` | City/town | `"Oxford"` |
| `region` | County/region (optional) | `"Oxfordshire"` |
| `postal_code` | UK postal code | `"OX4 4DQ"` |
| `country` | Country | `"United Kingdom"`, `"England"`, `"Wales"`, `"Scotland"` |
| `care_of` | C/O name (optional) | Present when registered at an agent's address |
| `po_box` | PO box (optional) | Uncommon; presence may indicate non-operational address |

---

## 5. Worked Examples

### Example A -- Auto-pass: Oxford Nanopore ships to registered office

**Scenario:** A customer places an order claiming affiliation with Oxford Nanopore Technologies. Shipping address:

> Gosling Building, Edmund Halley Road, Oxford Science Park, Oxford OX4 4DQ, UK

**Step 1: Search Companies House**

```
GET /search/companies?q=Oxford%20Nanopore%20Technologies
-> company_number: 05386273
-> company_status: active
```

**Step 2: Get company profile**

```
GET /company/05386273
-> registered_office_address:
     premises: "Gosling Building"
     address_line_1: "Edmund Halley Road"
     address_line_2: "Oxford Science Park"
     locality: "Oxford"
     postal_code: "OX4 4DQ"
     country: "United Kingdom"
-> sic_codes: ["72190"] (Other research and experimental development on natural sciences)
-> company_status: "active"
-> undeliverable_registered_office_address: false
```

**Step 3: Compare**

| Check | Companies House | Shipping address | Match? |
|---|---|---|---|
| Company active? | active | -- | Yes |
| SIC code is life sciences? | 72190 | -- | Yes |
| Postal code | OX4 4DQ | OX4 4DQ | Yes |
| Street | Edmund Halley Road | Edmund Halley Road | Yes |
| Building | Gosling Building | Gosling Building | Yes |

**Decision: AUTO-PASS.** Street-level match to the registered office of an active company with a life-sciences SIC code. This is the strongest possible signal from Companies House.

**What this gives us beyond ROR:** ROR would only confirm "Oxford, GB" (city-level). Companies House confirms the exact building and postcode.

---

### Example B -- Flag: claimed affiliation but address mismatch

**Scenario:** A customer claims to work at a UK biotech company registered in Cambridge. Shipping address:

> 45 Riverside Drive, Manchester M3 5FT, UK

**Step 1: Search Companies House**

```
GET /company/{company_number}
-> registered_office_address:
     address_line_1: "Science Park"
     locality: "Cambridge"
     postal_code: "CB4 0WA"
     country: "England"
-> company_status: "active"
-> sic_codes: ["72110"] (Research and experimental development on biotechnology)
```

**Step 2: Compare**

| Check | Companies House | Shipping address | Match? |
|---|---|---|---|
| Company active? | active | -- | Yes |
| SIC code is life sciences? | 72110 | -- | Yes |
| Postal code | CB4 0WA | **M3 5FT** | **NO** |
| City | Cambridge | **Manchester** | **NO** |

**Decision: FLAG FOR REVIEW.** The customer claims affiliation with a Cambridge-based biotech but ships to Manchester -- a different city entirely. The postcode mismatch confirms it. This could be legitimate (satellite office, home address of a remote employee) but requires manual verification.

**Possible follow-up checks:**
- Ask the customer for a company email address and verify the domain
- Check if the company has additional trading addresses (not available via Companies House -- would need to ask the company directly or check their website)
- Cross-reference with ROR if the entity is also a research organization

---

## 6. Limitations

### UK only
Companies House covers entities registered in England, Wales, Scotland, and Northern Ireland. No coverage of entities registered elsewhere -- not even Crown Dependencies (Isle of Man, Jersey, Guernsey have their own registries).

### Registered office != operational address
The registered office is the legal correspondence address. Many companies register at their accountant's or company formation agent's address. A matching registered address is a strong positive signal, but a *non-matching* registered address doesn't necessarily mean the order is suspicious -- the company may legitimately operate elsewhere. Check for `care_of` in the address, which often indicates an agent's address.

### Charities not covered
The Wellcome Sanger Institute (operating as Genome Research Limited, company 02742969) *is* on Companies House because it's structured as a private company limited by guarantee. But many UK charities and research organizations exist only on the Charity Commission register and won't appear in Companies House at all. A separate Charity Commission API lookup would be needed for those entities.

### Trading names vs. registered names
The Wellcome Sanger Institute is a trading name; the Companies House registered name is "Genome Research Limited." Searching for the trading name may not return results. This means the KYC pipeline needs a fallback: if a Companies House search by institution name fails, try ROR or GLEIF to find the legal entity name, then search again.

### Rate limit
600 requests per 5 minutes (120/minute). Generous for KYC screening (individual order checks), but would be a constraint for bulk screening or data enrichment runs. No API key tier upgrades available -- the rate limit is the same for all users.

### Data currency
Company data is updated as filings are processed. Most data is current within days of a filing. However, a company that has stopped filing may still show as "active" until Companies House takes enforcement action, which can take months.

---

## 7. SIC Code Filtering for Life Sciences

UK SIC codes (2007 revision) use a 5-digit classification. The following codes are relevant for verifying that a company claiming to be in life sciences actually has a matching industry classification:

### Primary life sciences SIC codes

| SIC Code | Description | Relevance |
|---|---|---|
| **72110** | Research and experimental development on biotechnology | Core -- biotech R&D |
| **72190** | Other research and experimental development on natural sciences and engineering | Core -- general scientific R&D |
| **21100** | Manufacture of basic pharmaceutical products | Core -- pharma manufacturing |
| **21200** | Manufacture of pharmaceutical preparations | Core -- drug formulation |

### Secondary life sciences SIC codes

| SIC Code | Description | Relevance |
|---|---|---|
| **32500** | Manufacture of medical and dental instruments and supplies | Medical devices, lab equipment |
| **20200** | Manufacture of pesticides and other agrochemical products | Agri-biotech |
| **20590** | Manufacture of other chemical products n.e.c. | Chemical suppliers, reagent manufacturers |
| **20140** | Manufacture of other organic basic chemicals | Biochemical precursors |
| **71200** | Technical testing and analysis | Contract research, testing labs |
| **74909** | Other professional, scientific and technical activities n.e.c. | Catch-all for scientific consultancies |
| **86900** | Other human health activities | Healthcare services |

### How to use in the pipeline

1. **Hard requirement:** If a customer claims to be a life-sciences company, their Companies House SIC code should be in the primary or secondary list above. A mismatch (e.g., SIC 47710 "Retail sale of clothing") is a flag.

2. **Soft signal:** Some legitimate biotech companies may have generic SIC codes like 72190 (general R&D) or 74909 (other professional/scientific activities) rather than the more specific 72110 (biotech). Don't reject on SIC code alone -- use it as one signal among many.

3. **Multiple SIC codes:** Companies can have multiple SIC codes. Check all of them. A company with both 72110 and 70100 (holding company) is likely a biotech holding company, which is fine.

4. **SIC code absence:** The `sic_codes` field is optional in the API response. Some companies, especially recently incorporated ones, may not yet have SIC codes filed. Treat absence as "unknown" rather than "mismatch."

### Real examples

- **Oxford Nanopore Technologies PLC** (05386273): SIC `72190` -- "Other research and experimental development on natural sciences and engineering." This is in the primary list. Pass.
- **Genome Research Limited** / Wellcome Sanger Institute (02742969): SIC `72110` -- "Research and experimental development on biotechnology." Primary list. Pass.

---

## 8. Integration Notes

### Comparison with other data sources

| Property | ROR | GLEIF | Companies House |
|---|---|---|---|
| Coverage | Global, ~110K research orgs | Global, financial entities | UK only, all registered entities |
| Address precision | City-level | Street-level | Street-level |
| Auth required | No | No | Yes (free API key) |
| Industry classification | Org types (education, company, etc.) | None | SIC codes (detailed) |
| Entity status | Active/inactive/withdrawn | Active/inactive | Active/dissolved/liquidation/etc. |
| Cost | Free | Free | Free |
| Rate limit | Undocumented | Undocumented | 600 req/5 min |

### Recommended lookup order for UK entities

1. **Companies House** (primary) -- search by company name, get registered address and SIC codes
2. **ROR** (supplementary) -- if the entity is a research organization, ROR gives additional context (org type, domain, parent relationships)
3. **GLEIF** (supplementary) -- if the entity has an LEI, GLEIF gives headquarters address (which may differ from registered office)

For non-UK entities, skip Companies House and use ROR + GLEIF + country-specific registries.
