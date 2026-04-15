# 04C claim check — m11-msa-prohibition v1

## Verified

- **Bitcoin P2PKH regex `[13][A-HJ-NP-Za-km-z1-9]{25,34}`** — matches the canonical pattern from iHateRegex and the GitHub gist. Base58 alphabet excludes `0`, `O`, `I`, `l`. PASS.
- **Bitcoin Bech32 prefix `bc1`** — correct for SegWit v0 and Taproot addresses. PASS.
- **Ethereum address `0x[a-fA-F0-9]{40}`** — correct, this is the canonical address form. PASS.
- **Regex-without-checksum caveat** — mokag.io and the GitHub gist both note that regex alone does not validate the Base58Check checksum. The document correctly notes this matters for *validation* but not for *detection*. PASS.
- **Contract Nerds and CoBrief clause references exist** — both URLs point to general-purpose crypto-clause references and the document does not overstate them; it explicitly notes most published clauses are permissive. PASS.

## Flags

- **MISSING-CITATION (minor) — outside counsel hourly rate band ($300–$500/hr)** — explicitly marked as `[best guess]`, so this is technically compliant with sourcing conventions. No flag needed.
- **OVERSTATED (very mild) — "stablecoins on ETH" coverage by the Ethereum regex** — true that USDC/USDT contract addresses are EVM addresses, but a customer attempting to pay in USDC would more likely transmit a *recipient wallet* address than the contract address. The regex catches both either way. Not a real overstatement.

No BROKEN-URL, MIS-CITED, or load-bearing flags.

## Verdict

PASS
