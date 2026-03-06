import type { ICompletionProvider } from "@cliver/contracts";
import { VerificationCheck } from "../verification-check.js";

export class InstitutionCheckExecutor extends VerificationCheck {
  readonly checkId = "institution_check";

  constructor(provider: ICompletionProvider, model: string) {
    super(provider, model);
  }
}
