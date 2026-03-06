/**
 * Contract check — verifies P3 exports satisfy P0 interfaces.
 * Must compile with: npx tsc --noEmit --project tsconfig.json
 */

import type {
  ICheckExecutor,
  ICompletionProvider,
  ToolDefinition,
  ToolCallResult,
  CompletionResult,
  CheckOutcome,
  ToolResult,
} from "@cliver/contracts";

import {
  WebSearchExecutor,
  ScreeningListExecutor,
  EpmcExecutor,
  OrcidExecutor,
  SecureDnaExecutor,
  OpenRouterProvider,
  completeWithTools,
  extractStructured,
  proposeActions,
} from "./src/index.js";

import type { ProposedAction, ProposerContext } from "./src/index.js";

// --- ICheckExecutor conformance ---

const executors: ICheckExecutor[] = [
  new WebSearchExecutor(),
  new ScreeningListExecutor(),
  new EpmcExecutor(),
  new OrcidExecutor(),
  new SecureDnaExecutor(),
];

for (const executor of executors) {
  // Each executor must have a checkId and execute method
  const _id: string = executor.checkId;
  const _exec: (fields: Record<string, unknown>) => Promise<CheckOutcome> = executor.execute.bind(executor);
}

// --- ICompletionProvider conformance ---

const provider: ICompletionProvider = new OpenRouterProvider();

// completeWithTools signature check
const _complete: (
  prompt: string,
  model: string,
  tools?: ToolDefinition[],
  callbacks?: {
    onToolCall?: (tool: string, args: Record<string, unknown>) => void;
    onToolResult?: (tool: string, id: string, count: number) => void;
  },
) => Promise<CompletionResult> = provider.completeWithTools.bind(provider);

// extractStructured signature check
import { z } from "zod";
const TestSchema = z.object({ value: z.string() });
const _extract: Promise<{ value: string }> = provider.extractStructured(
  "context",
  "prompt",
  TestSchema,
  "model",
);

// generateText signature check
const _gen: Promise<string> = provider.generateText("prompt", "model");

// --- Standalone function signature checks ---

// completeWithTools function
const _cwt: typeof completeWithTools extends (
  prompt: string,
  model: string,
  tools?: ToolDefinition[],
  callbacks?: {
    onToolCall?: (tool: string, args: Record<string, unknown>) => void;
    onToolResult?: (tool: string, id: string, count: number) => void;
  },
  toolExecutor?: (name: string, args: Record<string, unknown>) => Promise<unknown>,
) => Promise<CompletionResult>
  ? true
  : never = true;

// extractStructured function
const _es: typeof extractStructured extends <T>(
  context: string,
  extractionPrompt: string,
  schema: z.ZodType<T>,
  model: string,
) => Promise<T>
  ? true
  : never = true;

// proposeActions function
const _pa: typeof proposeActions extends (
  context: ProposerContext,
  provider: ICompletionProvider,
) => Promise<ProposedAction[]>
  ? true
  : never = true;

console.log("Contract check passed: all P3 exports satisfy P0 interfaces.");
