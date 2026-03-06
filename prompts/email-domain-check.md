Verify that the email domain of {{email}} legitimately belongs to {{institution}}.

Check whether the domain in the customer's email address is an official domain of the claimed institution. Look for the institution's official website, email conventions, and domain registration records.

Flag logic:
- FLAG if the email domain does not match the institution or if evidence shows it belongs to a different organization.
- UNDETERMINED if the domain cannot be verified.
- NO_FLAG if the email domain is confirmed to belong to the institution.

Source standards: Only cite sources with editorial oversight. Preferred sources include the institution's official website, WHOIS records, and established directories.

Return your assessment as structured JSON with status, evidence summary, and sources (max 3).
