import { describe, it, expect } from "vitest";
import type {
  ICheckExecutor,
  ICompletionProvider,
  IConsentManager,
  IAuditLogger,
  ITokenStore,
  IEventEmitter,
  IStorageLayer,
} from "./interfaces.js";
import type { CheckOutcome } from "./pipeline.js";
import type { PipelineEvent } from "./pipeline.js";

// These tests verify the interfaces compile correctly by creating
// conforming objects. The real test is that this file compiles at all.

describe("ICheckExecutor", () => {
  it("can be implemented as a conforming object", () => {
    const executor: ICheckExecutor = {
      checkId: "sanctions-screening",
      execute: async (_fields: Record<string, unknown>) => ({
        checkId: "sanctions-screening",
        status: "pass" as const,
        evidence: "No matches",
        sources: [],
      }),
    };
    expect(executor.checkId).toBe("sanctions-screening");
  });
});

describe("ICompletionProvider", () => {
  it("can be implemented as a conforming object", () => {
    const provider: ICompletionProvider = {
      completeWithTools: async (_prompt, _model, _tools?, _callbacks?) => ({
        text: "result",
        toolCalls: [],
      }),
      extractStructured: async <T>(_ctx: string, _prompt: string, _schema: unknown, _model: string) =>
        ({ rows: [] }) as T,
      generateText: async () => "text",
    };
    expect(provider).toBeDefined();
  });
});

describe("IConsentManager", () => {
  it("can be implemented as a conforming object", () => {
    const pending = new Map<string, string>();
    const manager: IConsentManager = {
      propose: async (screeningId, checkId, description) => {
        pending.set(checkId, description);
      },
      consent: async (_screeningId, checkId) => {
        pending.delete(checkId);
      },
      deny: async (_screeningId, checkId) => {
        pending.delete(checkId);
      },
      isAuthorized: async (_screeningId, _checkId) => false,
      getPending: async (_screeningId) => [],
    };
    expect(manager).toBeDefined();
  });
});

describe("IAuditLogger", () => {
  it("can be implemented as a conforming object", () => {
    const logs: unknown[] = [];
    const logger: IAuditLogger = {
      log: async (event) => { logs.push(event); },
      query: async (_filter) => [],
    };
    expect(logger).toBeDefined();
  });
});

describe("ITokenStore", () => {
  it("can be implemented as a conforming object", () => {
    const store = new Map<string, string>();
    const tokenStore: ITokenStore = {
      set: async (key, value, _ttl?) => { store.set(key, value); },
      get: async (key) => store.get(key) ?? null,
      delete: async (key) => { store.delete(key); },
    };
    expect(tokenStore).toBeDefined();
  });
});

describe("IEventEmitter", () => {
  it("can be implemented as a conforming object", () => {
    const listeners: Array<(event: PipelineEvent) => void> = [];
    const emitter: IEventEmitter = {
      emit: async (_event) => {},
      subscribe: (_filter, listener) => {
        listeners.push(listener);
        return () => {
          const idx = listeners.indexOf(listener);
          if (idx >= 0) listeners.splice(idx, 1);
        };
      },
    };
    expect(emitter).toBeDefined();
  });
});

describe("IStorageLayer", () => {
  it("can be implemented as a conforming object", () => {
    const storage: IStorageLayer = {
      createScreening: async (_data) => "scr-new",
      getScreening: async (_id) => null,
      updateScreening: async (_id, _data) => {},
      listScreenings: async (_filter?) => [],
      storeOutcome: async (_screeningId, _outcome) => {},
      getOutcomes: async (_screeningId) => [],
      storeFieldValue: async (_screeningId, _fieldId, _value) => {},
      getFieldValues: async (_screeningId) => ({}),
      storeConsentRecord: async (_screeningId, _checkId, _status) => {},
      getConsentRecords: async (_screeningId) => [],
      storeAuditEvent: async (_event) => {},
      queryAuditEvents: async (_filter) => [],
      createUser: async (_data) => "usr-new",
      getUserByEmail: async (_email) => null,
      updateUser: async (_id, _data) => {},
      storeFormSchema: async (_schema) => {},
      getFormSchema: async (_id, _version?) => null,
    };
    expect(storage).toBeDefined();
  });
});
