Screen {{name}} and {{institution}} against sanctions and export control lists.

Search for the customer's name and institution in sanctions databases, denied persons lists, entity lists, and export control restriction registries. Check US (OFAC, BIS), EU, and UN sanctions lists.

Flag logic:
- FLAG if the customer or institution appears on any sanctions or export control list, or if the institution is subject to restrictions.
- UNDETERMINED if screening results are inconclusive.
- NO_FLAG if neither the customer nor institution appears on any sanctions or export control list.

Source standards: Only cite official government sources, regulatory databases, and sanctions screening services. Do not rely on news articles alone.

Return your assessment as structured JSON with status, evidence summary, and sources (max 3).
