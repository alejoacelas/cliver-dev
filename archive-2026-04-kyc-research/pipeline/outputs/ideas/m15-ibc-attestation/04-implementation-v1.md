# m15-ibc-attestation — Implementation v1

- **measure:** M15 — soc-self-declaration
- **name:** IBC / sponsor-PI attestation upload
- **modes:** D, A
- **summary:** For SOC orders, require the customer to upload either (a) the institution's IBC approval letter covering the proposed work, or (b) a signed sponsor-PI attestation that the work falls within an existing IBC-approved protocol. Cross-check the IBC chair / Biosafety Officer named on the document against the public NIH IBC-RMS roster (effective June 2025) to verify the institution actually has an active IBC and the named officer is real.

## external_dependencies

- Customer-facing document upload UI (PDF accepted).
- NIH IBC-RMS public roster ([ibc-rms.od.nih.gov](https://ibc-rms.od.nih.gov/)) — registered IBC list with chair, BSO, and contact ([NIH OSP transparency announcement](https://osp.od.nih.gov/nih-strengthens-transparency-measures-for-institutional-biosafety-committees/)).
- Document-hash store (for tamper detection across re-uploads / cross-customer reuse).
- Optional: OCR + regex extractor for IBC #, expiration date, BSL level, PI name.
- Reviewer queue + scientific reviewer (biosafety background).

## endpoint_details

- **Upload:** internal HTTPS file-upload endpoint, customer-authenticated.
- **NIH IBC-RMS:** https://ibc-rms.od.nih.gov/ — public web interface; **no documented public REST API** `[unknown — searched for: "IBC-RMS API", "NIH IBC registration management system API endpoint", "ibc-rms.od.nih.gov developer documentation"]`. Lookup is via the web UI, so first-pass automation requires scraping or manual lookup. NIH posted the rosters publicly as of June 1, 2025 ([NOT-OD-25-082](https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-082.html)).
- **Auth model:** customer side — existing portal session. NIH side — none (public).
- **Rate limits:** N/A on upload; NIH IBC-RMS scraping should be courteous (a few req/sec) `[best guess: standard scraping etiquette for a federal site with no published rate limit]`.
- **Pricing:** $0 — NIH roster is public; document review is internal labor.
- **ToS:** NIH OSP IBC-RMS is a public registry; no ToS bar against reading roster data `[best guess]`.

## fields_returned

From the uploaded document (extracted by OCR + reviewer):

- Institution name
- IBC registration number (NIH-issued, e.g. `IBC-XXXX`) — present on letters from registered institutions
- IBC chair name + signature
- Biosafety Officer name (often co-signs)
- Approval date and expiration date
- Protocol ID
- BSL containment level approved
- Approved scope (organisms, sequences, procedures)
- Named PI(s)

From IBC-RMS lookup against the institution name:

- IBC active status
- IBC chair name (compare to document)
- BSO name (compare to document)
- Roster contact

## marginal_cost_per_check

- **Software:** ~$0 marginal (file storage + OCR ~$0.001/page if using cloud OCR `[best guess]`).
- **Human review:** 5–15 minutes of biosafety reviewer time per SOC order = $5–25 at $50/hr loaded `[best guess]`.
- **setup_cost:** 2–4 engineer-weeks to build the upload UI, OCR pipeline, hash store, and reviewer queue; additional 1–2 weeks for the IBC-RMS scraper / cache.

## manual_review_handoff

1. Customer uploads PDF at order time. System runs OCR and attempts to extract the structured fields above.
2. System hashes the file. If hash matches a previously-seen document for a different customer → flag `ibc_doc_reused`.
3. System looks up the institution name in the cached IBC-RMS roster.
   - No active IBC → flag `institution_no_active_ibc`.
   - Active IBC but document chair/BSO names don't match roster → flag `ibc_doc_unverified`.
4. Reviewer (biosafety background) opens the document, checks signature plausibility, expiration, scope-matches-order.
5. If anything looks forged or scope is too vague → contact the IBC chair directly using the email on the IBC-RMS roster (not on the document — that may be spoofed).
6. Disposition: approve, request resubmission, or deny.

## flags_thrown

- `ibc_doc_missing` — no upload received → block the order.
- `ibc_doc_unverified` — chair/BSO names don't match IBC-RMS roster → reviewer queue.
- `ibc_doc_reused` — file hash matches another customer's prior upload → priority queue.
- `institution_no_active_ibc` — institution claimed has no NIH-registered IBC → priority queue.
- `ibc_doc_expired` — extracted expiration date is in the past → block.
- `ibc_scope_mismatch` — extracted approved scope doesn't include the order's organism/sequence class → reviewer queue.

## failure_modes_requiring_review

- Forged PDF that passes OCR and uses real chair/BSO names from the public IBC-RMS roster — only the contact-the-chair step catches this.
- Externally-administered IBCs ([NIH FAQ](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-externally-administered-ibcs/)) — small companies use third-party IBCs (e.g. WCG, Advarra), institution name on the document and IBC-RMS roster may not match the customer's institution.
- Foreign institutions: NIH IBC-RMS only covers US-registered IBCs operating under the NIH Guidelines. International customers have no equivalent registry.
- OCR failure on scanned/rotated documents — fall back to fully-manual review.
- IBC approval is real but covers a different protocol than the order — scope-match heuristic is fuzzy.

## false_positive_qualitative

- Customers at institutions that use externally-administered IBCs (e.g. small biotechs using WCG/Advarra) — chair/BSO names will not match the customer's institutional name in the roster.
- Foreign academic customers (no NIH IBC).
- Customers whose institution recently changed IBC chairs but the public IBC-RMS roster hasn't refreshed.
- Customers operating under exemption (some r/sNA work is exempt from IBC review under NIH Guidelines Section III-F) — they have no document to upload.

## record_left

- Stored PDF + extracted fields + hash.
- Snapshot of the IBC-RMS lookup at time of order.
- Reviewer disposition + scope-match notes.
- For deny / escalate paths: copy of the email sent to the IBC chair via the roster contact.

## Notes on attacker coverage

- Catches: `inbox-compromise` exemption-claim path (forces an upload, exemption now requires evidence). Catches naive forgery (file-hash check, IBC-RMS chair-name check).
- Does NOT catch: `it-persona-manufacturing` "lift-and-modify a real IBC letter from elsewhere in the institution" (the chair/BSO/institution all match — only scope-mismatch triage might catch it). Does NOT catch `insider-recruitment` (real IBC protocol, real attestation). Does NOT catch `cro-framing` (real CRO, real biosafety plan, no IBC needed for some private-sector work).
- Foreign customers: structural gap.
