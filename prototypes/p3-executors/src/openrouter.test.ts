/**
 * Tests for OpenRouterProvider — hits real OpenRouter API when key is valid.
 *
 * Tests are structured in two tiers:
 * 1. Always-run tests: error handling, interface conformance, shape validation
 * 2. API-dependent tests: skipped when OPENROUTER_API_KEY is missing or invalid
 */

import { describe, it, expect, beforeAll } from "vitest";
import { config } from "dotenv";
import { z } from "zod";
import {
  OpenRouterProvider,
  completeWithTools,
  extractStructured,
  generateText,
  formatForModel,
} from "./openrouter.js";
import type { ToolDefinition, CompletionResult, ToolResult } from "@cliver/contracts";

beforeAll(() => {
  config({ path: new URL("../.env", import.meta.url).pathname });
});

const EXTRACTION_MODEL = "google/gemini-2.5-flash-preview";
const COMPLETION_MODEL = "anthropic/claude-sonnet-4";

/**
 * Probe whether the OpenRouter API key is valid.
 */
let openRouterKeyValid: boolean | null = null;
async function isOpenRouterKeyValid(): Promise<boolean> {
  if (openRouterKeyValid !== null) return openRouterKeyValid;
  if (!process.env.OPENROUTER_API_KEY) {
    openRouterKeyValid = false;
    return false;
  }
  try {
    await generateText("Say hi", EXTRACTION_MODEL);
    openRouterKeyValid = true;
  } catch {
    openRouterKeyValid = false;
  }
  return openRouterKeyValid;
}

// --- Always-run tests: error handling ---

describe("error handling", () => {
  it("generateText throws on missing API key", async () => {
    const original = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      await expect(generateText("test", EXTRACTION_MODEL)).rejects.toThrow("OPENROUTER_API_KEY");
    } finally {
      process.env.OPENROUTER_API_KEY = original;
    }
  });

  it("completeWithTools throws on missing API key", async () => {
    const original = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    try {
      await expect(completeWithTools("test", EXTRACTION_MODEL)).rejects.toThrow("OPENROUTER_API_KEY");
    } finally {
      process.env.OPENROUTER_API_KEY = original;
    }
  });

  it("extractStructured throws on missing API key", async () => {
    const original = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    const Schema = z.object({ v: z.string() });
    try {
      await expect(extractStructured("ctx", "prompt", Schema, EXTRACTION_MODEL)).rejects.toThrow("OPENROUTER_API_KEY");
    } finally {
      process.env.OPENROUTER_API_KEY = original;
    }
  });

  it("generateText throws a descriptive error on invalid API key", async () => {
    const original = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "invalid-key";
    try {
      await expect(generateText("test", EXTRACTION_MODEL)).rejects.toThrow(/OpenRouter.*error/i);
    } finally {
      process.env.OPENROUTER_API_KEY = original;
    }
  });

  it("completeWithTools throws a descriptive error on invalid API key", async () => {
    const original = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "invalid-key";
    try {
      await expect(completeWithTools("test", EXTRACTION_MODEL)).rejects.toThrow(/OpenRouter.*error/i);
    } finally {
      process.env.OPENROUTER_API_KEY = original;
    }
  });
});

// --- Citation ID annotation ---

describe("formatForModel", () => {
  it("annotates items with sequential citation IDs", () => {
    const output: ToolResult = {
      tool: "search_web",
      query: "test",
      items: [
        { title: "Result 1", url: "http://example.com/1" },
        { title: "Result 2", url: "http://example.com/2" },
      ],
      metadata: {},
    };
    const counters: Record<string, number> = {};
    const { formatted, citations } = formatForModel("search_web", output, counters);

    expect(citations.length).toBe(2);
    expect(citations[0].id).toBe("web1");
    expect(citations[1].id).toBe("web2");

    const parsed = JSON.parse(formatted);
    expect(parsed.results[0].id).toBe("web1");
    expect(parsed.results[1].id).toBe("web2");
    expect(parsed.instruction).toContain("Cite using [id] format");
  });

  it("handles empty items with metadata-only citation", () => {
    const output: ToolResult = {
      tool: "search_screening_list",
      query: "test",
      items: [],
      metadata: { status: "no_matches", message: "No matches found" },
    };
    const counters: Record<string, number> = {};
    const { formatted, citations } = formatForModel("search_screening_list", output, counters);

    expect(citations.length).toBe(1);
    expect(citations[0].id).toBe("screen1");

    const parsed = JSON.parse(formatted);
    expect(parsed.id).toBe("screen1");
  });

  it("maintains counters across multiple calls", () => {
    const counters: Record<string, number> = {};
    const output1: ToolResult = { tool: "search_web", query: "q1", items: [{ title: "A" }], metadata: {} };
    const output2: ToolResult = { tool: "search_web", query: "q2", items: [{ title: "B" }], metadata: {} };

    const { citations: c1 } = formatForModel("search_web", output1, counters);
    const { citations: c2 } = formatForModel("search_web", output2, counters);

    expect(c1[0].id).toBe("web1");
    expect(c2[0].id).toBe("web2");
  });
});

// --- Interface conformance ---

describe("OpenRouterProvider (interface conformance)", () => {
  it("has all ICompletionProvider methods", () => {
    const provider = new OpenRouterProvider();
    expect(typeof provider.completeWithTools).toBe("function");
    expect(typeof provider.extractStructured).toBe("function");
    expect(typeof provider.generateText).toBe("function");
  });

  it("accepts a toolExecutor in constructor", () => {
    const executor = async (name: string, _args: Record<string, unknown>) => {
      return { result: `executed ${name}` };
    };
    const provider = new OpenRouterProvider(executor);
    expect(provider).toBeDefined();
  });
});

// --- API-dependent tests ---

describe("generateText (real API)", () => {
  it("returns a text response", async () => {
    if (!(await isOpenRouterKeyValid())) return;

    const result = await generateText("Say exactly 'hello world' and nothing else.", EXTRACTION_MODEL);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    expect(result.toLowerCase()).toContain("hello world");
  });
});

describe("extractStructured (real API)", () => {
  it("extracts well-formatted data validated by Zod schema", async () => {
    if (!(await isOpenRouterKeyValid())) return;

    const TestSchema = z.object({
      name: z.string(),
      age: z.number(),
      isStudent: z.boolean(),
    });

    const context = "John Smith is 25 years old. He is currently enrolled at MIT.";
    const prompt = "Extract the person's name, age, and whether they are a student.";

    const result = await extractStructured(context, prompt, TestSchema, EXTRACTION_MODEL);

    expect(result.name).toBe("John Smith");
    expect(result.age).toBe(25);
    expect(result.isStudent).toBe(true);
  });

  it("validates output against schema", async () => {
    if (!(await isOpenRouterKeyValid())) return;

    const GoodSchema = z.object({ color: z.string() });
    const result = await extractStructured(
      "The sky is blue.",
      "What color is the sky?",
      GoodSchema,
      EXTRACTION_MODEL,
    );
    expect(result.color.toLowerCase()).toContain("blue");
  });
});

describe("completeWithTools (real API)", () => {
  it("handles tool calling with mock executor", async () => {
    if (!(await isOpenRouterKeyValid())) return;

    const tools: ToolDefinition[] = [
      {
        type: "function",
        name: "get_weather",
        description: "Get the current weather for a location",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string", description: "City name" },
          },
          required: ["location"],
        },
      },
    ];

    const toolCallsRecorded: Array<{ tool: string; args: Record<string, unknown> }> = [];

    const result = await completeWithTools(
      "What's the weather in Paris? Use the get_weather tool.",
      COMPLETION_MODEL,
      tools,
      {
        onToolCall: (tool, args) => {
          toolCallsRecorded.push({ tool, args });
        },
      },
      async (name, args) => {
        if (name === "get_weather") {
          return { temperature: 22, condition: "sunny", location: args.location };
        }
        return { error: "unknown tool" };
      },
    );

    expect(toolCallsRecorded.length).toBeGreaterThan(0);
    expect(toolCallsRecorded[0].tool).toBe("get_weather");
    expect(result.toolCalls.length).toBeGreaterThan(0);
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
  });

  it("returns text without tool calls when no tools provided", async () => {
    if (!(await isOpenRouterKeyValid())) return;

    const result = await completeWithTools(
      "Say 'hello' and nothing else.",
      EXTRACTION_MODEL,
    );

    expect(typeof result.text).toBe("string");
    expect(result.toolCalls.length).toBe(0);
  });
});

describe("OpenRouterProvider methods (real API)", () => {
  const provider = new OpenRouterProvider();

  it("generateText returns text", async () => {
    if (!(await isOpenRouterKeyValid())) return;

    const result = await provider.generateText("Say 'test' and nothing else.", EXTRACTION_MODEL);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("extractStructured parses schema", async () => {
    if (!(await isOpenRouterKeyValid())) return;

    const Schema = z.object({ greeting: z.string() });
    const result = await provider.extractStructured(
      "Hello!",
      "Extract the greeting.",
      Schema,
      EXTRACTION_MODEL,
    );
    expect(typeof result.greeting).toBe("string");
  });

  it("completeWithTools returns result", async () => {
    if (!(await isOpenRouterKeyValid())) return;

    const result = await provider.completeWithTools("Say hi.", EXTRACTION_MODEL);
    expect(typeof result.text).toBe("string");
    expect(Array.isArray(result.toolCalls)).toBe(true);
  });

  it("completeWithTools uses toolExecutor from constructor", async () => {
    if (!(await isOpenRouterKeyValid())) return;

    const toolCallsRecorded: string[] = [];
    const providerWithExecutor = new OpenRouterProvider(
      async (name, args) => {
        toolCallsRecorded.push(name);
        if (name === "get_weather") {
          return { temperature: 20, condition: "cloudy", location: args.location };
        }
        return { error: "unknown tool" };
      },
    );

    const tools: ToolDefinition[] = [
      {
        type: "function",
        name: "get_weather",
        description: "Get the current weather for a location",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string", description: "City name" },
          },
          required: ["location"],
        },
      },
    ];

    const result = await providerWithExecutor.completeWithTools(
      "What's the weather in London? Use the get_weather tool.",
      COMPLETION_MODEL,
      tools,
    );

    expect(toolCallsRecorded.length).toBeGreaterThan(0);
    expect(toolCallsRecorded[0]).toBe("get_weather");
    expect(result.toolCalls.length).toBeGreaterThan(0);
    expect(typeof result.text).toBe("string");
  });
});
