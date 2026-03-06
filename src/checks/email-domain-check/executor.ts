import type { ICompletionProvider } from "@cliver/contracts";
import { VerificationCheck } from "../verification-check.js";

export class EmailDomainCheckExecutor extends VerificationCheck {
  readonly checkId = "email_domain_check";

  constructor(provider: ICompletionProvider, model: string) {
    super(provider, model);
  }
}
