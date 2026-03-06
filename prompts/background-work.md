Identify relevant laboratory work by {{name}} related to: {{order_description}}

Search for customer-authored work on the ordered organism first, then related organisms, then broader wet lab work. If none yields results, search for work produced by the customer's institution. Related organisms include those in the same genus, protein family, or viral family. Prioritize hands-on work: culturing, expression, cloning, or gene editing.

Link directly to individual work products—publications, patents, registered grants, or commercial products. Exclude profile pages, research interest descriptions, lab websites, and other secondary summaries.

Return structured JSON with an array of works, each containing:
- relevance_level: 5=customer/same organism, 4=customer/related organism, 3=customer/any wet lab, 2=institution/same organism, 1=institution/related organism
- organism: as named in the source
- sources: citation IDs
- work_summary: one sentence factual description

Include at most 5 works, prioritized by relevance. Always report at least one piece of work authored by the customer, or state explicitly if none was found.
