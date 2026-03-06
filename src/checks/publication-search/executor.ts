import type { ICompletionProvider, CheckOutcome, ToolDefinition } from "@cliver/contracts";
import type { ZodType } from "zod";
import { ResearchCheck } from "../research-check.js";
import { PublicationResultSchema, type PublicationResult } from "../schemas.js";
import { RESEARCH_TOOLS } from "../tools.js";

export class PublicationSearchExecutor extends ResearchCheck<PublicationResult> {
  readonly checkId = "publication_search";
  protected readonly schema: ZodType<PublicationResult> = PublicationResultSchema;
  protected readonly schemaName = "publication_result";
  protected readonly tools: ToolDefinition[] = RESEARCH_TOOLS;

  constructor(provider: ICompletionProvider, model: string) {
    super(provider, model);
  }

  protected mapToOutcome(result: PublicationResult): CheckOutcome {
    const hasWorks = result.works.length > 0;
    const allSources = result.works.flatMap((w) => w.sources);
    return {
      checkId: this.checkId,
      status: hasWorks ? "pass" : "undetermined",
      evidence: hasWorks
        ? result.works
            .map((w) => `${w.title} (${w.year}) - ${w.relevance}`)
            .join("\n")
        : "No publications found for this customer.",
      sources: allSources,
    };
  }
}
