import type { ICompletionProvider, CheckOutcome } from "@cliver/contracts";
import { loadPrompt } from "../prompts.js";

export class Summarizer {
  constructor(
    private readonly provider: ICompletionProvider,
    private readonly model: string,
  ) {}

  async summarize(
    outcomes: CheckOutcome[],
    fields: Record<string, unknown>,
  ): Promise<string> {
    const checkResults = outcomes
      .map((o) => `[${o.checkId}] status=${o.status}: ${o.evidence}`)
      .join("\n\n");

    const prompt = loadPrompt("summarizer", {
      name: String(fields.name ?? "Unknown"),
      institution: String(fields.institution ?? "Unknown"),
      email: String(fields.email ?? "Unknown"),
      order_description: String(fields.order_description ?? "Unknown"),
      check_results: checkResults,
    });

    return this.provider.generateText(prompt, this.model);
  }
}
