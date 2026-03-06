import type { ICompletionProvider } from "@cliver/contracts";
import { VerificationCheck } from "../verification-check.js";

export class AffiliationCheckExecutor extends VerificationCheck {
  readonly checkId = "affiliation_check";

  constructor(provider: ICompletionProvider, model: string) {
    super(provider, model);
  }
}
