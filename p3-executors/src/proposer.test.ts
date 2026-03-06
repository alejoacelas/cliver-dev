/**
 * Tests for proposeActions.
 *
 * The logic tests (consent classification, empty results) run without
 * an API key. API-dependent tests are skipped when the key is invalid.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { config } from "dotenv";
import { proposeActions } from "./proposer.js";
import type { ProposerContext } from "./proposer.js";
import { OpenRouterProvider, generateText } from "./openrouter.js";
import type { CheckOutcome, ICompletionProvider, CompletionResult } from "@cliver/contracts";
import type { ZodType } from "zod";

beforeAll(() => {
  config({ path: new URL("../.env", import.meta.url).pathname });
});

let openRouterKeyValid: boolean | null = null;
async function isOpenRouterKeyValid(): Promise<boolean> {
  if (openRouterKeyValid !== null) return openRouterKeyValid;
  if (!process.env.OPENROUTER_API_KEY) {
    openRouterKeyValid = false;
    return false;
  }
  try {
    await generateText("Say hi", "google/gemini-2.5-flash-preview");
    openRouterKeyValid = true;
  } catch {
    openRouterKeyValid = false;
  }
  return openRouterKeyValid;
}

describe("proposeActions (logic tests — no API needed)", () => {
  it("returns empty array when no flags or undetermined outcomes", async () => {
    const outcomes: CheckOutcome[] = [
      {
        checkId: "web_search",
        status: "pass",
        evidence: "All good",
        sources: ["web1"],
      },
    ];

    // Use a mock provider since this code path returns early without calling AI
    const mockProvider: ICompletionProvider = {
      async completeWithTools() {
        throw new Error("should not be called");
      },
      async extractStructured() {
        throw new Error("should not be called");
      },
      async generateText() {
        throw new Error("should not be called");
      },
    };

    const actions = await proposeActions(
      { outcomes, customerInfo: { name: "Clean User" } },
      mockProvider,
    );

    expect(actions).toEqual([]);
  });

  it("classifies pre-approved vs consent-required actions correctly", async () => {
    // Use a mock provider that returns structured data
    const mockActions = {
      actions: [
        {
          actionId: "follow_up_1",
          description: "Search web for more info",
          relatedCheckId: "screening_list",
          suggestedCheckId: "web_search",
          suggestedFields: { query: "test" },
        },
        {
          actionId: "follow_up_2",
          description: "Screen the sequence",
          relatedCheckId: "orcid_lookup",
          suggestedCheckId: "secure_dna",
          suggestedFields: { sequence: "ATCG..." },
        },
      ],
    };
    const mockProvider: ICompletionProvider = {
      async completeWithTools(): Promise<CompletionResult> {
        throw new Error("not needed");
      },
      async extractStructured<T>(): Promise<T> {
        return mockActions as T;
      },
      async generateText(): Promise<string> {
        return JSON.stringify(mockActions.actions);
      },
    };

    const outcomes: CheckOutcome[] = [
      {
        checkId: "screening_list",
        status: "flag",
        evidence: "Match found",
        sources: ["screen1"],
      },
    ];

    const actions = await proposeActions(
      { outcomes, customerInfo: { name: "Test" } },
      mockProvider,
    );

    expect(actions.length).toBe(2);

    const webAction = actions.find((a) => a.suggestedCheckId === "web_search");
    expect(webAction).toBeDefined();
    expect(webAction!.requiresConsent).toBe(false);

    const dnaAction = actions.find((a) => a.suggestedCheckId === "secure_dna");
    expect(dnaAction).toBeDefined();
    expect(dnaAction!.requiresConsent).toBe(true);
  });

  it("handles malformed AI response gracefully", async () => {
    const mockProvider: ICompletionProvider = {
      async completeWithTools(): Promise<CompletionResult> {
        throw new Error("not needed");
      },
      async extractStructured<T>(): Promise<T> {
        throw new Error("Failed to parse structured output");
      },
      async generateText(): Promise<string> {
        return "This is not valid JSON at all!";
      },
    };

    const outcomes: CheckOutcome[] = [
      {
        checkId: "screening_list",
        status: "flag",
        evidence: "Match found",
        sources: ["screen1"],
      },
    ];

    const actions = await proposeActions(
      { outcomes, customerInfo: { name: "Test" } },
      mockProvider,
    );

    // Should return empty array, not throw
    expect(actions).toEqual([]);
  });

  it("all proposed actions have required fields", async () => {
    const mockActions = {
      actions: [
        {
          actionId: "follow_up_1",
          description: "Do something",
          relatedCheckId: "web_search",
          suggestedCheckId: "epmc_search",
          suggestedFields: { author: "Smith" },
        },
      ],
    };
    const mockProvider: ICompletionProvider = {
      async completeWithTools(): Promise<CompletionResult> {
        throw new Error("not needed");
      },
      async extractStructured<T>(): Promise<T> {
        return mockActions as T;
      },
      async generateText(): Promise<string> {
        return JSON.stringify(mockActions.actions);
      },
    };

    const outcomes: CheckOutcome[] = [
      {
        checkId: "web_search",
        status: "undetermined",
        evidence: "Unclear",
        sources: [],
      },
    ];

    const actions = await proposeActions(
      { outcomes, customerInfo: { name: "Test" } },
      mockProvider,
    );

    for (const action of actions) {
      expect(action).toHaveProperty("actionId");
      expect(action).toHaveProperty("description");
      expect(action).toHaveProperty("relatedCheckId");
      expect(action).toHaveProperty("requiresConsent");
      expect(action).toHaveProperty("suggestedCheckId");
      expect(action).toHaveProperty("suggestedFields");
      expect(typeof action.requiresConsent).toBe("boolean");
    }
  });
});

describe("proposeActions (real API)", () => {
  it("proposes follow-up actions for flagged results", async () => {
    if (!(await isOpenRouterKeyValid())) return;

    const provider = new OpenRouterProvider();
    const outcomes: CheckOutcome[] = [
      {
        checkId: "screening_list",
        status: "flag",
        evidence: "Found match: Huawei Technologies (Entity List)",
        sources: ["screen1"],
      },
      {
        checkId: "orcid_lookup",
        status: "undetermined",
        evidence: "ORCID profile not found",
        sources: [],
      },
    ];

    const actions = await proposeActions(
      {
        outcomes,
        customerInfo: {
          name: "John Smith",
          institution: "MIT",
          email: "john@mit.edu",
        },
      },
      provider,
    );

    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBeGreaterThan(0);

    for (const action of actions) {
      expect(action).toHaveProperty("actionId");
      expect(action).toHaveProperty("description");
      expect(typeof action.requiresConsent).toBe("boolean");
    }
  });
});
