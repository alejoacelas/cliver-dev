# 04C claim check — m20-coauthor-graph v1

- **NIH RePORTER v2 API** at `api.reporter.nih.gov` with POST /v2/projects/search and pi_names criterion: PASS — confirmed by canonical NIH RePORTER documentation and the V2 data-elements PDF.
- **NSF Awards API** at `api.nsf.gov/services/v1/awards.json` with `pdPIName`/`coPDPI`: PASS — matches NSF resources.research.gov documentation.
- **OpenAlex `authorships.author.id` filter** allowing multiple comma-separated IDs to find shared works: PASS — documented at filter-works page.
- **Both NIH RePORTER and NSF APIs free, no auth**: PASS — neither requires API keys for read access.

**Verdict:** PASS
