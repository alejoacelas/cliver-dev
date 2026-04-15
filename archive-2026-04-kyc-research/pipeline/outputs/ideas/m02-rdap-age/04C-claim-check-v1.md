# m02-rdap-age — 04C claim check v1

- **RDAP.org bootstrap exists.** [RDAP.org](https://about.rdap.org/) confirms it is a public bootstrap that redirects queries to the authoritative registry RDAP. `PASS`.
- **ICANN required RDAP for gTLDs since 2019; WHOIS obligation sunsetted 28 Jan 2025.** Wikipedia citation. `PASS` — ICANN's own communication on the WHOIS retirement is at `icann.org/en/announcements/details` and corroborates the date. `UPGRADE-SUGGESTED` for the primary cite.
- **RDAP JSON fields (`events`, `entities`, `status`).** Defined in RFC 9083; the document's enumeration is correct. `PASS`.
- **Registrant redaction default since 2018 (Temp Spec / GDPR).** Widely documented; ICANN GNSO Phase 1 EPDP. `PASS`.
- **Verisign RDAP endpoint shape (`https://rdap.verisign.com/com/v1/domain/...`).** Verisign operates RDAP for `.com`/`.net`; the URL pattern is the documented one. `PASS`.

No broken or mis-cited URLs.

**Verdict: PASS**
