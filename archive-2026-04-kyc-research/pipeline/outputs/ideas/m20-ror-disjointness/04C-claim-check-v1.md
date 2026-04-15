# 4C claim check — m20-ror-disjointness v1

## Per-claim findings

- **ROR FAQs URL** — resolves; supports the "120k organizations, free, CC0" claim. **No flag.**
- **About the ROR REST API** — resolves; directly supports the rate-limit claims (2000/5min current; Q3 2026 client_id requirement; 50/5min unidentified throttling). The doc transcribes these accurately. **No flag.**
- **ROR API affiliation parameter** — resolves; supports the affiliation matcher behavior including `chosen:true`. **No flag.**
- **ROR matching docs** — resolves; supports the disambiguation strategy claim. **No flag.**
- **ROR relationships and hierarchies** — resolves; the relationship enum the doc cites (Parent / Child / Related / Successor / Predecessor) matches verbatim. **No flag.**
- **ROR v2 announcement** — resolves; supports v2 schema currency. **No flag.**
- **STI 2022 arXiv paper** — resolves to a paper on indicators using ROR; the "top 20 countries hold 80.9% of ROR IDs" and "US 30%" stats appear in this corpus of work. The cite is reasonable, though the doc could pin a more recent ROR-published distribution stat if desired. **No flag.**

## Other observations

- Bulk-dump claim ("50–200 MB") is a `[best guess: ...]` without a citation; that's appropriate per pipeline conventions.
- "Q3 2026" is a near-future date — consider verifying that ROR has not already rolled this out, since the current date is 2026-04-06 and the change was scheduled for Q3 2026 (still ~3 months out from this writing). The doc's framing is correct as of this date.

**Verdict:** PASS
