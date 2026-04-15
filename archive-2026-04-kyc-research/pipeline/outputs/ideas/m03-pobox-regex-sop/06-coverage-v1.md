# Coverage research: PO Box / APO regex + reviewer SOP

## Coverage gaps

### Gap 1: Non-covered language variants and regional postal-box formats
- **Category:** Customers submitting addresses in languages or formats not covered by the regex set — including but not limited to: Chinese (信箱 / xìnxiāng), Japanese (私書箱 / shishobako), Korean (사서함 / saseoham), Arabic (ص.ب / صندوق بريد), Russian (а/я / абонентский ящик), Turkish (Posta Kutusu / P.K.), Polish (skrytka pocztowa), and many others.
- **Estimated size:** The 04-implementation covers English, German, Spanish/Portuguese, French, and Dutch. [unknown — searched for: "DNA synthesis gene synthesis international orders percentage non-US customers"]. The DNA synthesis market is global — major providers (GenScript, Eurofins, GENEWIZ/Azenta) operate worldwide. [best guess: 20-40% of synthesis customers are outside countries whose primary language is covered by the regex (US, UK, DE, FR, NL, ES, PT, BR). CJK-language addresses are likely 10-20% of international orders given the concentration of biotech activity in China, Japan, and South Korea.] None of these would be caught by the current regex.
- **Behavior of the check on this category:** no-signal
- **Reasoning:** A PO box address submitted in Japanese katakana or Chinese characters will pass the regex undetected. The check is defense-in-depth behind Smarty/Melissa/USPS, which may catch some of these via their own address-type detection, but the regex alone is blind outside its 7 language patterns.

### Gap 2: Deliberate obfuscation of PO Box keywords
- **Category:** Any customer (legitimate or not) who intentionally or accidentally misspells PO Box in ways that defeat regex — e.g., "P 0 Box" (zero for O), "P.O.Bx", Unicode lookalikes (Cyrillic Р for Latin P, fullwidth Ｂ for B), or creative formatting ("Post Office Lock Box", "Private Mail Box").
- **Estimated size:** [best guess: <1% of legitimate customers would accidentally trigger this. The relevant population is attackers who read the SOP. The 04-implementation notes "zero-vs-O substitution" and "Unicode lookalikes" as known evasion vectors.] This is more of a bypass risk than a coverage gap for legitimate customers.
- **Behavior of the check on this category:** no-signal (evasion succeeds)
- **Reasoning:** The regex is deterministic and cannot handle fuzzy matching. The 04-implementation suggests a Levenshtein-based enhancement but does not implement it. This gap is small for legitimate customers but relevant for the attacker model.

### Gap 3: Legitimate researchers at institutions using PO Box as official mailing address
- **Category:** Researchers at institutions whose official mailing address includes a PO Box — common for field stations, remote research facilities, and some small institutions in rural areas. Also: military-affiliated researchers using APO/FPO/DPO addresses.
- **Estimated size:** USPS has ~21 million PO boxes, ~14.4 million occupied ([USPS Postal Facts](https://facts.usps.com/size-and-scope/); [Save the Post Office: PO box usage](https://www.savethepostoffice.com/how-many-people-use-post-office-does-postal-service-even-know/)). Out of ~168.6 million USPS delivery points, occupied PO boxes are ~8.5%. [best guess: <2% of legitimate synthesis customers have a PO Box as their only viable receiving address — primarily small field research stations, small rural institutions, and some international researchers using forwarding services.]
- **Behavior of the check on this category:** false-positive
- **Reasoning:** The regex correctly fires, and the SOP asks the customer to provide a street address. If the customer has no street address available, the SOP escalates to a reviewer who can accept institutional context. The FP is handled by process, but it creates friction for a legitimate (if small) population.

## Refined false-positive qualitative

1. **PO Box as institutional mailing address (Gap 3):** The regex fires correctly. The SOP handles it, but creates friction. Estimated <2% of customers affected.
2. **Dutch `Postbus` on legitimate institutional mail (from 04-implementation):** Some Dutch institutions use `Postbus` as their official business mailing address alongside a visiting address. The regex flags the Postbus; the SOP must accept the visiting address as operative. This is a known, small population (Netherlands-based institutions = ~1-2% of synthesis customers).
3. **"Box" in legitimate street names (from 04-implementation):** The regex requires `PO` prefix, so "Box Hill Road" does not match. False positives from this vector are negligible.

## Notes for stage 7 synthesis

- This check is a **pure defense-in-depth backstop** — it catches only the addresses that the primary checks (USPS RDI/CMRA, Smarty/Melissa) miss due to misformatting or locale gaps.
- The main coverage gap is non-covered languages (Gap 1). Extending the regex to CJK and Arabic variants would require substantial effort and careful testing, but would close the most significant hole.
- The FP rate is low and well-handled by the SOP. The check's cost is effectively zero ($0, microseconds). Risk/reward strongly favours deployment even with the language gaps.
