Find coauthors of {{name}} and suggest verification contacts.

Search scientific databases (PubMed/EPMC, ORCID) and the web to find people who have coauthored publications with the customer. For each coauthor, identify their current institution, email (if publicly available), and relationship to the customer (e.g., "co-PI", "collaborator", "lab member").

From the coauthors found, suggest up to 3 people who could serve as independent verification contacts for the customer's identity and research activities. Prefer coauthors at the same institution or in the same research area, with publicly available email addresses.

Return structured JSON with:
- coauthors: array of { name, institution, email (if available), relationship }
- suggestedVerificationEmails: array of { recipientName, recipientEmail, reason }

Note: This does not send any emails. It only surfaces suggestions for human review.
