import type {
  ICheckExecutor,
  ICompletionProvider,
  CheckOutcome,
} from "@cliver/contracts";
import { loadPrompt } from "../prompts.js";

export abstract class BaseAiCheck implements ICheckExecutor {
  abstract readonly checkId: string;

  constructor(
    protected readonly provider: ICompletionProvider,
    protected readonly model: string,
  ) {}

  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    try {
      const promptValues: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v != null) promptValues[k] = String(v);
      }
      const prompt = loadPrompt(this.checkId, promptValues);
      return await this.runCheck(prompt, fields);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        checkId: this.checkId,
        status: "error",
        evidence: `Check execution failed: ${message}`,
        sources: [],
        errorDetail: message,
      };
    }
  }

  protected abstract runCheck(
    prompt: string,
    fields: Record<string, unknown>,
  ): Promise<CheckOutcome>;
}
