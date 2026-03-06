/**
 * OpenRouterProvider — implements ICompletionProvider.
 *
 * Wraps OpenRouter's Responses API (for tool calling) and
 * Chat Completions API (for structured extraction and text generation).
 */

import type { ZodType } from "zod";
import type {
  ICompletionProvider,
  ToolDefinition,
  ToolCallResult,
  CompletionResult,
  ToolResult,
} from "@cliver/contracts";
import { toOpenRouterSchema } from "@cliver/contracts";

const RESPONSES_URL = "https://openrouter.ai/api/v1/responses";
const CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

// --- Citation ID annotation ---

const TOOL_PREFIXES: Record<string, string> = {
  search_web: "web",
  search_screening_list: "screen",
  search_epmc: "epmc",
  get_orcid_profile: "orcid",
  search_orcid_works: "orcworks",
};

export interface CitationMapping {
  id: string;
  tool: string;
  item: Record<string, unknown>;
}

/**
 * Annotates tool results with sequential citation IDs (e.g., web1, screen1)
 * before feeding them back to the model. Returns the formatted string and
 * a mapping of citation IDs to source info.
 */
export function formatForModel(
  toolName: string,
  output: ToolResult,
  counters: Record<string, number>,
): { formatted: string; citations: CitationMapping[] } {
  const prefix = TOOL_PREFIXES[toolName] || toolName.slice(0, 4);
  const citations: CitationMapping[] = [];

  if (!output.items.length) {
    counters[prefix] = (counters[prefix] || 0) + 1;
    const id = `${prefix}${counters[prefix]}`;
    citations.push({ id, tool: toolName, item: output.metadata });
    return {
      formatted: JSON.stringify({
        instruction: "Cite using [id] format (e.g., [screen1]).",
        id,
        ...output.metadata,
      }, null, 2),
      citations,
    };
  }

  const annotated = output.items.map(item => {
    counters[prefix] = (counters[prefix] || 0) + 1;
    const id = `${prefix}${counters[prefix]}`;
    citations.push({ id, tool: toolName, item });
    return { id, ...item };
  });

  return {
    formatted: JSON.stringify({
      instruction: "Cite using [id] format (e.g., [web1], [epmc2]).",
      results: annotated,
      ...output.metadata,
    }, null, 2),
    citations,
  };
}

function getHeaders(): Record<string, string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is required");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://cliver.example.com",
    "X-Title": process.env.OPENROUTER_TITLE || "Cliver KYC",
  };
}

/**
 * Run a tool-calling completion loop using OpenRouter's Responses API.
 * The model may call tools repeatedly; we execute them and feed results back.
 */
export async function completeWithTools(
  prompt: string,
  model: string,
  tools?: ToolDefinition[],
  callbacks?: {
    onToolCall?: (tool: string, args: Record<string, unknown>) => void;
    onToolResult?: (tool: string, id: string, count: number) => void;
  },
  toolExecutor?: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<CompletionResult> {
  const inputItems: unknown[] = [{ role: "user", content: prompt }];
  const toolCalls: ToolCallResult[] = [];
  const citationCounters: Record<string, number> = {};

  const maxIterations = 20;
  let outputItems: Record<string, unknown>[] = [];
  let data: Record<string, unknown> = {};

  for (let i = 0; i < maxIterations; i++) {
    const payload: Record<string, unknown> = { model, input: inputItems };
    if (tools && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = "auto";
    }

    const res = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${text}`);
    }

    data = await res.json() as Record<string, unknown>;
    outputItems = (data.output || []) as Record<string, unknown>[];

    const functionCalls = outputItems.filter(
      (item) => item.type === "function_call",
    );
    if (!functionCalls.length) break;

    for (const fc of functionCalls) {
      const funcName = (fc.name || "") as string;
      const callId = (fc.call_id || "") as string;
      let args: Record<string, unknown>;
      try {
        args = JSON.parse((fc.arguments || "{}") as string);
      } catch {
        args = {};
      }

      callbacks?.onToolCall?.(funcName, args);

      let output: unknown;
      if (toolExecutor) {
        output = await toolExecutor(funcName, args);
      } else {
        output = { error: `No executor registered for tool: ${funcName}` };
      }

      // Format tool output with citation IDs if it's a ToolResult
      let outputStr: string;
      if (isToolResult(output)) {
        const { formatted } = formatForModel(funcName, output as ToolResult, citationCounters);
        outputStr = formatted;
      } else {
        outputStr = typeof output === "string" ? output : JSON.stringify(output);
      }

      const prefix = TOOL_PREFIXES[funcName] || funcName.slice(0, 4);
      const latestId = `${prefix}${citationCounters[prefix] || 1}`;
      const itemCount = isToolResult(output) ? (output as ToolResult).items.length : 1;
      callbacks?.onToolResult?.(funcName, latestId, itemCount);

      toolCalls.push({ toolName: funcName, arguments: args, output });

      inputItems.push({
        type: "function_call",
        id: fc.id || callId,
        call_id: callId,
        name: funcName,
        arguments: (fc.arguments || "{}") as string,
        status: "completed",
      });
      inputItems.push({
        type: "function_call_output",
        call_id: callId,
        output: outputStr,
      });
    }
  }

  // Extract text from response
  let finalText = "";
  for (const item of outputItems) {
    if (item.type === "message") {
      const contentItems = (item.content || []) as Record<string, unknown>[];
      finalText = contentItems
        .filter((c) => c.type === "output_text")
        .map((c) => (c.text || "") as string)
        .join("");
      break;
    }
  }
  if (!finalText) finalText = ((data.output_text || "") as string);

  return { text: finalText, toolCalls };
}

/**
 * Extract structured data from text using OpenRouter's Chat Completions API
 * with JSON Schema response_format.
 */
export async function extractStructured<T>(
  context: string,
  extractionPrompt: string,
  schema: ZodType<T>,
  model: string,
): Promise<T> {
  const responseFormat = toOpenRouterSchema("extraction", schema);

  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: `${extractionPrompt}\n\n${context}` }],
      response_format: responseFormat,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter extraction error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices[0].message.content;
  const raw = JSON.parse(content);

  // Validate with Zod — throws ZodError on schema mismatch
  return schema.parse(raw);
}

/**
 * Generate plain text with OpenRouter's Chat Completions API.
 */
export async function generateText(
  prompt: string,
  model: string,
): Promise<string> {
  const res = await fetch(CHAT_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter text error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
}

/** Check if an unknown value looks like a ToolResult. */
function isToolResult(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.tool === "string" && Array.isArray(v.items) && typeof v.metadata === "object";
}

/**
 * Full ICompletionProvider implementation backed by OpenRouter.
 */
export class OpenRouterProvider implements ICompletionProvider {
  private toolExecutor?: (name: string, args: Record<string, unknown>) => Promise<unknown>;

  constructor(
    toolExecutor?: (name: string, args: Record<string, unknown>) => Promise<unknown>,
  ) {
    this.toolExecutor = toolExecutor;
  }

  async completeWithTools(
    prompt: string,
    model: string,
    tools?: ToolDefinition[],
    callbacks?: {
      onToolCall?: (tool: string, args: Record<string, unknown>) => void;
      onToolResult?: (tool: string, id: string, count: number) => void;
    },
  ): Promise<CompletionResult> {
    return completeWithTools(prompt, model, tools, callbacks, this.toolExecutor);
  }

  async extractStructured<T>(
    context: string,
    extractionPrompt: string,
    schema: ZodType<T>,
    model: string,
  ): Promise<T> {
    return extractStructured(context, extractionPrompt, schema, model);
  }

  async generateText(prompt: string, model: string): Promise<string> {
    return generateText(prompt, model);
  }
}
