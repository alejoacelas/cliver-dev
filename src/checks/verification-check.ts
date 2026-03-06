import type { CheckOutcome } from "@cliver/contracts";
import { BaseAiCheck } from "./base-ai-check.js";
import { VerificationResultSchema } from "./schemas.js";

export abstract class VerificationCheck extends BaseAiCheck {
  protected async runCheck(
    prompt: string,
    _fields: Record<string, unknown>,
  ): Promise<CheckOutcome> {
    const result = await this.provider.extractStructured(
      prompt,
      "Return your assessment as JSON matching the schema.",
      VerificationResultSchema,
      this.model,
    );

    return {
      checkId: this.checkId,
      status:
        result.status === "FLAG"
          ? "flag"
          : result.status === "NO_FLAG"
            ? "pass"
            : "undetermined",
      evidence: result.evidence,
      sources: result.sources,
    };
  }
}
