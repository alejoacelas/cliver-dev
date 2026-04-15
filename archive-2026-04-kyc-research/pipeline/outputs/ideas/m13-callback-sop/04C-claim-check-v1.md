# 04C claim check — m13-callback-sop v1

## Claim-by-claim

1. **JPM "When Callbacks Go Wrong" recommends outbound-only callback verification.**
   - URL: https://www.jpmorgan.com/insights/cybersecurity/business-email-compromise/when-callbacks-go-wrong
   - Verdict: SUPPORTED (this is a published JPM cybersecurity insights piece on the topic).

2. **FBI BEC guidance recommends out-of-band verification.**
   - URL: https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-frauds-and-scams/business-email-compromise
   - Verdict: SUPPORTED (canonical FBI BEC page).

3. **Nacha BEC guidance.**
   - URL: https://www.nacha.org/content/business-email-compromise
   - Verdict: SUPPORTED.

4. **University of Arizona main switchboard 520-621-2211; directory at directory.arizona.edu.**
   - URLs: https://www.arizona.edu/contact-us, https://directory.arizona.edu/
   - Verdict: SUPPORTED.

5. **University of Iowa Directory Search at iam.uiowa.edu/whitepages/search.**
   - URL: https://iam.uiowa.edu/whitepages/search
   - Verdict: SUPPORTED.

6. **Twilio Programmable Voice US PSTN cost ~$0.013–$0.015/min.**
   - Verdict: WEAKLY-SUPPORTED. Marked as `[best guess]` in the document. Citation to twilio.com/voice/pricing/us would strengthen but not blocking.

## Flags

- One WEAKLY-SUPPORTED price reference (already best-guessed in source doc).
- No BROKEN-URL.
- No MIS-CITED.

## Verdict

PASS
