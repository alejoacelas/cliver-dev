import type { ICompletionProvider, CheckOutcome, ToolDefinition } from "@cliver/contracts";
import type { ZodType } from "zod";
import { ResearchCheck } from "../research-check.js";
import { CoauthorResultSchema, type CoauthorResult } from "../schemas.js";
import { RESEARCH_TOOLS } from "../tools.js";

export class CoauthorFinderExecutor extends ResearchCheck<CoauthorResult> {
  readonly checkId = "coauthor_finder";
  protected readonly schema: ZodType<CoauthorResult> = CoauthorResultSchema;
  protected readonly schemaName = "coauthor_result";
  protected readonly tools: ToolDefinition[] = RESEARCH_TOOLS;

  constructor(provider: ICompletionProvider, model: string) {
    super(provider, model);
  }

  protected mapToOutcome(result: CoauthorResult): CheckOutcome {
    const hasCoauthors = result.coauthors.length > 0;
    const data = JSON.stringify(result);
    return {
      checkId: this.checkId,
      status: hasCoauthors ? "pass" : "undetermined",
      evidence: data,
      sources: [],
    };
  }
}
