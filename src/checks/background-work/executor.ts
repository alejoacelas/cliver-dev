import type { ICompletionProvider, CheckOutcome, ToolDefinition } from "@cliver/contracts";
import type { ZodType } from "zod";
import { ResearchCheck } from "../research-check.js";
import { BackgroundWorkResultSchema, type BackgroundWorkResult } from "../schemas.js";
import { RESEARCH_TOOLS } from "../tools.js";

export class BackgroundWorkExecutor extends ResearchCheck<BackgroundWorkResult> {
  readonly checkId = "background_work";
  protected readonly schema: ZodType<BackgroundWorkResult> = BackgroundWorkResultSchema;
  protected readonly schemaName = "background_work_result";
  protected readonly tools: ToolDefinition[] = RESEARCH_TOOLS;

  constructor(provider: ICompletionProvider, model: string) {
    super(provider, model);
  }

  protected mapToOutcome(result: BackgroundWorkResult): CheckOutcome {
    const hasWorks = result.works.length > 0;
    const allSources = result.works.flatMap((w) => w.sources);
    return {
      checkId: this.checkId,
      status: hasWorks ? "pass" : "undetermined",
      evidence: hasWorks
        ? result.works
            .map(
              (w) =>
                `[${w.relevance_level}] ${w.organism}: ${w.work_summary}`,
            )
            .join("\n")
        : "No relevant background work found.",
      sources: allSources,
    };
  }
}
