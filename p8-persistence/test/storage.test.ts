import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import type { IStorageLayer, CheckOutcome } from "@cliver/contracts";
import { createStorageLayer } from "../src/storage.js";
import {
  getTestDb,
  createTables,
  truncateAll,
  closeTestDb,
} from "./setup.js";

let storage: IStorageLayer;

beforeAll(async () => {
  const db = getTestDb();
  await createTables();
  storage = createStorageLayer(db);
});

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await closeTestDb();
});

describe("Storage layer — screenings", () => {
  it("creates a screening and retrieves it with all fields populated", async () => {
    const id = await storage.createScreening({
      screeningId: "",
      status: "pending",
      completedFields: [],
      pendingChecks: [],
      runningChecks: [],
      completedChecks: [],
      outcomes: [],
      consentState: {},
      decision: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(id).toBeDefined();
    expect(typeof id).toBe("string");

    const state = await storage.getScreening(id);
    expect(state).not.toBeNull();
    expect(state!.screeningId).toBe(id);
    expect(state!.status).toBe("pending");
    expect(state!.completedFields).toEqual([]);
    expect(state!.pendingChecks).toEqual([]);
    expect(state!.runningChecks).toEqual([]);
    expect(state!.completedChecks).toEqual([]);
    expect(state!.outcomes).toEqual([]);
    expect(state!.consentState).toEqual({});
    expect(state!.decision).toBeNull();
    expect(state!.createdAt).toBeDefined();
    expect(state!.updatedAt).toBeDefined();
  });

  it("returns null for a non-existent screening", async () => {
    const state = await storage.getScreening(
      "00000000-0000-0000-0000-000000000000",
    );
    expect(state).toBeNull();
  });

  it("updates screening status", async () => {
    const id = await storage.createScreening({ status: "pending" });
    await storage.updateScreening(id, { status: "running" });

    const state = await storage.getScreening(id);
    expect(state!.status).toBe("running");
  });

  it("lists screenings with optional filter", async () => {
    await storage.createScreening({ status: "pending" });
    await storage.createScreening({ status: "completed" });
    await storage.createScreening({ status: "pending" });

    const all = await storage.listScreenings();
    expect(all.length).toBe(3);

    const pending = await storage.listScreenings({ status: "pending" });
    expect(pending.length).toBe(2);
    for (const s of pending) {
      expect(s.status).toBe("pending");
    }
  });
});

describe("Storage layer — field values", () => {
  it("stores and retrieves field values by session", async () => {
    const id = await storage.createScreening({ status: "pending" });

    await storage.storeFieldValue(id, "name", "John Doe");
    await storage.storeFieldValue(id, "email", "john@example.com");

    const values = await storage.getFieldValues(id);
    expect(values).toEqual({
      name: "John Doe",
      email: "john@example.com",
    });
  });

  it("overwrites existing field value on duplicate fieldId", async () => {
    const id = await storage.createScreening({ status: "pending" });

    await storage.storeFieldValue(id, "name", "John");
    await storage.storeFieldValue(id, "name", "Jane");

    const values = await storage.getFieldValues(id);
    expect(values.name).toBe("Jane");
  });

  it("field values appear in screening's completedFields", async () => {
    const id = await storage.createScreening({ status: "pending" });
    await storage.storeFieldValue(id, "name", "Test");
    await storage.storeFieldValue(id, "institution", "MIT");

    const state = await storage.getScreening(id);
    expect(state!.completedFields).toContain("name");
    expect(state!.completedFields).toContain("institution");
  });

  it("same-field concurrent writes produce exactly one row", async () => {
    const id = await storage.createScreening({ status: "pending" });

    // Submit the same (sessionId, fieldId) concurrently from 10 promises
    const promises = Array.from({ length: 10 }, (_, i) =>
      storage.storeFieldValue(id, "name", `value_${i}`),
    );
    await Promise.all(promises);

    const values = await storage.getFieldValues(id);
    // Exactly one key "name" should exist
    expect(Object.keys(values)).toEqual(["name"]);
    // The value should be one of the submitted values
    expect((values.name as string).startsWith("value_")).toBe(true);
  });

  it("handles concurrent field submissions without corruption", async () => {
    const id = await storage.createScreening({ status: "pending" });

    // Submit 10 fields concurrently
    const promises = Array.from({ length: 10 }, (_, i) =>
      storage.storeFieldValue(id, `field_${i}`, `value_${i}`),
    );
    await Promise.all(promises);

    const values = await storage.getFieldValues(id);
    expect(Object.keys(values).length).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(values[`field_${i}`]).toBe(`value_${i}`);
    }
  });
});

describe("Storage layer — check outcomes", () => {
  const makeOutcome = (
    checkId: string,
    status: CheckOutcome["status"] = "pass",
  ): CheckOutcome => ({
    checkId,
    status,
    evidence: `Evidence for ${checkId}`,
    sources: ["web1"],
    ...(status === "error" ? { errorDetail: "Something went wrong" } : {}),
  });

  it("stores and retrieves outcomes", async () => {
    const id = await storage.createScreening({ status: "running" });

    await storage.storeOutcome(id, makeOutcome("sanctions_check"));
    await storage.storeOutcome(id, makeOutcome("web_search", "flag"));

    const outcomes = await storage.getOutcomes(id);
    expect(outcomes.length).toBe(2);

    const sanctions = outcomes.find((o) => o.checkId === "sanctions_check");
    expect(sanctions).toBeDefined();
    expect(sanctions!.status).toBe("pass");

    const webSearch = outcomes.find((o) => o.checkId === "web_search");
    expect(webSearch).toBeDefined();
    expect(webSearch!.status).toBe("flag");
  });

  it("updates check status when outcome is stored", async () => {
    const id = await storage.createScreening({ status: "running" });
    await storage.storeOutcome(id, makeOutcome("sanctions_check"));

    const state = await storage.getScreening(id);
    expect(state!.completedChecks).toContain("sanctions_check");
  });

  it("handles error status outcomes", async () => {
    const id = await storage.createScreening({ status: "running" });
    await storage.storeOutcome(id, makeOutcome("broken_check", "error"));

    const outcomes = await storage.getOutcomes(id);
    const broken = outcomes.find((o) => o.checkId === "broken_check");
    expect(broken).toBeDefined();
    expect(broken!.status).toBe("error");
    expect(broken!.errorDetail).toBe("Something went wrong");
  });
});

describe("Storage layer — consent records", () => {
  it("stores and retrieves consent records", async () => {
    const id = await storage.createScreening({ status: "pending" });

    await storage.storeConsentRecord(id, "sanctions_check", "pending");
    await storage.storeConsentRecord(id, "web_search", "granted");

    const records = await storage.getConsentRecords(id);
    expect(records.length).toBe(2);

    const sanctions = records.find((r) => r.checkId === "sanctions_check");
    expect(sanctions!.status).toBe("pending");

    const webSearch = records.find((r) => r.checkId === "web_search");
    expect(webSearch!.status).toBe("granted");
  });

  it("updates existing consent record status", async () => {
    const id = await storage.createScreening({ status: "pending" });
    await storage.storeConsentRecord(id, "sanctions_check", "pending");
    await storage.storeConsentRecord(id, "sanctions_check", "granted");

    const records = await storage.getConsentRecords(id);
    expect(records.length).toBe(1);
    expect(records[0].status).toBe("granted");
  });

  it("consent records appear in screening's consentState", async () => {
    const id = await storage.createScreening({ status: "pending" });
    await storage.storeConsentRecord(id, "sanctions_check", "granted");
    await storage.storeConsentRecord(id, "web_search", "denied");

    const state = await storage.getScreening(id);
    expect(state!.consentState).toEqual({
      sanctions_check: "granted",
      web_search: "denied",
    });
  });
});

describe("Storage layer — audit events", () => {
  it("stores and queries audit events", async () => {
    const id = await storage.createScreening({ status: "running" });

    await storage.storeAuditEvent({
      type: "field_completed",
      screeningId: id,
      timestamp: "2026-01-01T00:00:00Z",
      fieldId: "name",
      fieldValue: "John",
    });

    await storage.storeAuditEvent({
      type: "check_started",
      screeningId: id,
      timestamp: "2026-01-01T00:01:00Z",
      checkId: "sanctions_check",
    });

    const events = await storage.queryAuditEvents({ screeningId: id });
    expect(events.length).toBe(2);
    expect(events[0].type).toBe("field_completed");
    expect(events[1].type).toBe("check_started");
  });

  it("returns events in chronological order", async () => {
    const id = await storage.createScreening({ status: "running" });

    // Insert out of order
    await storage.storeAuditEvent({
      type: "check_started",
      screeningId: id,
      timestamp: "2026-01-01T00:05:00Z",
      checkId: "check2",
    });

    await storage.storeAuditEvent({
      type: "field_completed",
      screeningId: id,
      timestamp: "2026-01-01T00:01:00Z",
      fieldId: "name",
      fieldValue: "Test",
    });

    await storage.storeAuditEvent({
      type: "check_started",
      screeningId: id,
      timestamp: "2026-01-01T00:03:00Z",
      checkId: "check1",
    });

    const events = await storage.queryAuditEvents({ screeningId: id });
    expect(events.length).toBe(3);

    // Should be chronological
    const timestamps = events.map((e) => e.timestamp);
    expect(timestamps[0] < timestamps[1]).toBe(true);
    expect(timestamps[1] < timestamps[2]).toBe(true);
  });

  it("filters by event type", async () => {
    const id = await storage.createScreening({ status: "running" });

    await storage.storeAuditEvent({
      type: "field_completed",
      screeningId: id,
      timestamp: "2026-01-01T00:00:00Z",
      fieldId: "name",
      fieldValue: "Test",
    });

    await storage.storeAuditEvent({
      type: "check_started",
      screeningId: id,
      timestamp: "2026-01-01T00:01:00Z",
      checkId: "check1",
    });

    const fieldEvents = await storage.queryAuditEvents({
      screeningId: id,
      type: "field_completed",
    });
    expect(fieldEvents.length).toBe(1);
    expect(fieldEvents[0].type).toBe("field_completed");
  });

  it("filters by since timestamp", async () => {
    const id = await storage.createScreening({ status: "running" });

    await storage.storeAuditEvent({
      type: "field_completed",
      screeningId: id,
      timestamp: "2026-01-01T00:00:00Z",
      fieldId: "old",
      fieldValue: "old",
    });

    await storage.storeAuditEvent({
      type: "check_started",
      screeningId: id,
      timestamp: "2026-01-02T00:00:00Z",
      checkId: "new",
    });

    const recent = await storage.queryAuditEvents({
      screeningId: id,
      since: "2026-01-01T12:00:00Z",
    });
    expect(recent.length).toBe(1);
    expect(recent[0].type).toBe("check_started");
  });
});

describe("Storage layer — decisions", () => {
  it("stores a decision linked to a session (via screening + getScreening)", async () => {
    const db = getTestDb();
    const id = await storage.createScreening({ status: "completed" });

    // Insert decision directly into the database
    // (The IStorageLayer doesn't have a createDecision method;
    //  the decision is typically written by the aggregator and
    //  read back via getScreening.)
    const { decisions } = await import("../src/schema.js");
    await db.insert(decisions).values({
      sessionId: id,
      status: "FLAG",
      flagCount: 2,
      summary: "Sanctions match found",
      reasons: [
        {
          checkId: "sanctions",
          criterion: "Sanctions and Export Control Screening",
          detail: "Name matches OFAC list",
        },
      ],
    });

    const state = await storage.getScreening(id);
    expect(state!.decision).not.toBeNull();
    expect(state!.decision!.status).toBe("FLAG");
    expect(state!.decision!.flagCount).toBe(2);
    expect(state!.decision!.summary).toBe("Sanctions match found");
    expect(state!.decision!.reasons.length).toBe(1);
  });
});

describe("Storage layer — users", () => {
  it("creates and retrieves a customer user", async () => {
    const id = await storage.createUser({
      email: "customer@test.com",
      passwordHash: "hash123",
      role: "customer",
    });

    expect(id).toBeDefined();

    const user = await storage.getUserByEmail("customer@test.com");
    expect(user).not.toBeNull();
    expect(user!.id).toBe(id);
    expect(user!.email).toBe("customer@test.com");
    expect(user!.role).toBe("customer");
    expect(user!.emailConfirmed).toBe(false);
  });

  it("creates and retrieves a provider user", async () => {
    const id = await storage.createUser({
      email: "provider@test.com",
      passwordHash: "hash456",
      role: "provider",
    });

    const user = await storage.getUserByEmail("provider@test.com");
    expect(user).not.toBeNull();
    expect(user!.id).toBe(id);
    expect(user!.role).toBe("provider");
    expect(user!.totpSecret).toBeUndefined();
  });

  it("returns null for non-existent email", async () => {
    const user = await storage.getUserByEmail("nobody@test.com");
    expect(user).toBeNull();
  });

  it("updates user fields", async () => {
    const id = await storage.createUser({
      email: "update@test.com",
      passwordHash: "oldhash",
      role: "customer",
    });

    await storage.updateUser(id, {
      emailConfirmed: true,
      passwordHash: "newhash",
    });

    const user = await storage.getUserByEmail("update@test.com");
    expect(user!.emailConfirmed).toBe(true);
    expect(user!.passwordHash).toBe("newhash");
  });
});

describe("Storage layer — form schemas", () => {
  it("stores and retrieves a form schema", async () => {
    const formSchema = {
      id: "intake-form",
      version: "1.0",
      title: "Customer Intake",
      fields: [{ id: "name", label: "Name", type: "text" as const }],
    };

    await storage.storeFormSchema(formSchema);

    const result = await storage.getFormSchema("intake-form");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("intake-form");
    expect(result!.version).toBe("1.0");
    expect(result!.fields.length).toBe(1);
  });

  it("retrieves a specific version", async () => {
    await storage.storeFormSchema({
      id: "form",
      version: "1.0",
      title: "V1",
      fields: [{ id: "f1", label: "F1", type: "text" }],
    });

    await storage.storeFormSchema({
      id: "form",
      version: "2.0",
      title: "V2",
      fields: [
        { id: "f1", label: "F1", type: "text" },
        { id: "f2", label: "F2", type: "email" },
      ],
    });

    const v1 = await storage.getFormSchema("form", "1.0");
    expect(v1!.title).toBe("V1");
    expect(v1!.fields.length).toBe(1);

    const v2 = await storage.getFormSchema("form", "2.0");
    expect(v2!.title).toBe("V2");
    expect(v2!.fields.length).toBe(2);
  });

  it("returns null for non-existent schema", async () => {
    const result = await storage.getFormSchema("nonexistent");
    expect(result).toBeNull();
  });
});
