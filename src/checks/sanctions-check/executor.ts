import type { ICompletionProvider } from "@cliver/contracts";
import { VerificationCheck } from "../verification-check.js";

export class SanctionsCheckExecutor extends VerificationCheck {
  readonly checkId = "sanctions_check";

  constructor(provider: ICompletionProvider, model: string) {
    super(provider, model);
  }
}
