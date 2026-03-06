import type { ICompletionProvider, CompletionResult } from "@cliver/contracts";
import type { ZodType } from "zod";

export function createMockProvider(overrides?: {
  extractStructured?: <T>(
    context: string,
    extractionPrompt: string,
    schema: ZodType<T>,
    model: string,
  ) => Promise<T>;
  completeWithTools?: (
    prompt: string,
    model: string,
  ) => Promise<CompletionResult>;
  generateText?: (prompt: string, model: string) => Promise<string>;
}): ICompletionProvider {
  return {
    extractStructured:
      overrides?.extractStructured ??
      (async () => {
        throw new Error("extractStructured not mocked");
      }),
    completeWithTools:
      overrides?.completeWithTools ??
      (async () => {
        throw new Error("completeWithTools not mocked");
      }),
    generateText:
      overrides?.generateText ??
      (async () => {
        throw new Error("generateText not mocked");
      }),
  };
}
