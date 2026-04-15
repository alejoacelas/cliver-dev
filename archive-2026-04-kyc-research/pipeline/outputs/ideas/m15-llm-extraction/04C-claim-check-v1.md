# 4C claim check — m15-llm-extraction v1

## Verified claims

- **Claude structured outputs** — https://platform.claude.com/docs/en/build-with-claude/structured-outputs. Documents JSON Schema / Pydantic structured output. **PASS.**
- **OpenAI structured outputs** — https://developers.openai.com/api/docs/guides/structured-outputs. Documents `response_format: json_schema` strict mode. **PASS.**
- **Claude Sonnet 4.6 $3/$15, Haiku 4.5 $1/$5** — https://platform.claude.com/docs/en/about-claude/pricing. Confirmed. **PASS.**
- **GPT-4o $2.50/$10** — https://openai.com/api/pricing/. Pricing for gpt-4o is current as of search. **PASS.**
- **Batch API 50% discount** — confirmed on both vendor pricing pages. **PASS.**
- **Turner blog: Gemini 2.5 Pro 90% vs human 80%** — https://blog.stephenturner.us/p/ai-customer-screening-dna-synthesis is a single blog-post evaluation, not peer-reviewed. **OVERSTATED if cited as authoritative.** Suggested fix: weaken to "one published blog evaluation reports..." — already framed that way in the doc, acceptable.

## Flags

- **OVERSTATED (mild):** Turner blog framing — already hedged. Acceptable.
- **MISSING-CITATION:** "Anthropic API does not train on customer data by default" — flagged as best-guess in-doc; reviewer should cite https://www.anthropic.com/legal/commercial-terms or current data-usage page.

## Verdict

`PASS-minor` — REVISE to add the data-usage citation; otherwise claims hold.
