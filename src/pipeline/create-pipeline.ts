import type { ICompletionProvider, ICheckExecutor, Decision, CheckOutcome } from "@cliver/contracts";
import { CheckScheduler } from "@cliver/p2-pipeline";
import { CHECK_DECLARATIONS, MODEL } from "../config/checks.js";
import { AffiliationCheckExecutor } from "../checks/affiliation-check/executor.js";
import { InstitutionCheckExecutor } from "../checks/institution-check/executor.js";
import { EmailDomainCheckExecutor } from "../checks/email-domain-check/executor.js";
import { SanctionsCheckExecutor } from "../checks/sanctions-check/executor.js";
import { PublicationSearchExecutor } from "../checks/publication-search/executor.js";
import { BackgroundWorkExecutor } from "../checks/background-work/executor.js";
import { SecureDnaMockExecutor } from "../checks/securedna-mock/executor.js";
import { CoauthorFinderExecutor } from "../checks/coauthor-finder/executor.js";
import { Summarizer } from "../summarizer/summarizer.js";

export interface CreatePipelineOptions {
  screeningId: string;
  provider: ICompletionProvider;
  model?: string;
}

export function createPipeline(options: CreatePipelineOptions): CheckScheduler {
  const { screeningId, provider, model = MODEL } = options;

  const executors: ICheckExecutor[] = [
    new AffiliationCheckExecutor(provider, model),
    new InstitutionCheckExecutor(provider, model),
    new EmailDomainCheckExecutor(provider, model),
    new SanctionsCheckExecutor(provider, model),
    new PublicationSearchExecutor(provider, model),
    new BackgroundWorkExecutor(provider, model),
    new SecureDnaMockExecutor(),
    new CoauthorFinderExecutor(provider, model),
  ];

  const summarizer = new Summarizer(provider, model);

  return new CheckScheduler({
    screeningId,
    declarations: CHECK_DECLARATIONS,
    executors,
    postDecision: async (
      decision: Decision,
      outcomes: CheckOutcome[],
      fields: Record<string, unknown>,
    ): Promise<Decision> => {
      const summary = await summarizer.summarize(outcomes, fields);
      return { ...decision, summary };
    },
  });
}
