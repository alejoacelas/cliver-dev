import type { CheckOutcome, ToolDefinition } from "@cliver/contracts";
import type { ZodType } from "zod";
import { BaseAiCheck } from "./base-ai-check.js";

export abstract class ResearchCheck<T> extends BaseAiCheck {
  protected abstract readonly schema: ZodType<T>;
  protected abstract readonly schemaName: string;
  protected abstract readonly tools: ToolDefinition[];

  protected abstract mapToOutcome(result: T): CheckOutcome;

  protected async runCheck(
    prompt: string,
    _fields: Record<string, unknown>,
  ): Promise<CheckOutcome> {
    const completion = await this.provider.completeWithTools(
      prompt,
      this.model,
      this.tools,
    );

    const structured = await this.provider.extractStructured(
      completion.text,
      `Extract the structured data from the research results above.`,
      this.schema,
      this.model,
    );

    return this.mapToOutcome(structured);
  }
}
