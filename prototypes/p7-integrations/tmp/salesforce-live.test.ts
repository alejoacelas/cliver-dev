import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";

/**
 * Live Salesforce API tests — exercises real CRUD operations against
 * standard objects (Contact, Lead) using a session from the SF CLI.
 *
 * Run: npx vitest run tmp/salesforce-live.test.ts
 */

interface SfSession {
  accessToken: string;
  instanceUrl: string;
}

function getSession(): SfSession | null {
  try {
    const raw = execSync("sf org display --target-org cliver-dev --json", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const data = JSON.parse(raw);
    if (data.status !== 0) return null;
    return {
      accessToken: data.result.accessToken,
      instanceUrl: data.result.instanceUrl,
    };
  } catch {
    return null;
  }
}

const BASE_API = "/services/data/v59.0";
const session = getSession();

async function sfFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${session!.instanceUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session!.accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}

async function sfCreate(
  objectType: string,
  fields: Record<string, unknown>,
): Promise<string> {
  const res = await sfFetch(`${BASE_API}/sobjects/${objectType}`, {
    method: "POST",
    body: JSON.stringify(fields),
  });
  const data = (await res.json()) as { id: string; success: boolean; errors: unknown[] };
  if (!data.success) throw new Error(`Create failed: ${JSON.stringify(data.errors)}`);
  return data.id;
}

async function sfDelete(objectType: string, id: string): Promise<void> {
  await sfFetch(`${BASE_API}/sobjects/${objectType}/${id}`, { method: "DELETE" });
}

async function sfQuery<T = Record<string, unknown>>(
  soql: string,
): Promise<{ totalSize: number; records: T[] }> {
  const res = await sfFetch(`${BASE_API}/query?q=${encodeURIComponent(soql)}`);
  return (await res.json()) as { totalSize: number; records: T[] };
}

describe.skipIf(!session)("Salesforce live API", () => {
  // Track records created during tests so we can clean up.
  const createdRecords: Array<{ objectType: string; id: string }> = [];

  afterAll(async () => {
    // Clean up all records created during tests.
    for (const { objectType, id } of createdRecords) {
      try {
        await sfDelete(objectType, id);
      } catch {
        // best-effort cleanup
      }
    }
  });

  // --- Authentication & connectivity ---

  it("session token is valid", async () => {
    const res = await sfFetch(`${BASE_API}/sobjects/`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as { sobjects: unknown[] };
    expect(data.sobjects.length).toBeGreaterThan(0);
  });

  // --- Contact CRUD ---

  it("creates a Contact, reads it back, and deletes it", async () => {
    // CREATE
    const id = await sfCreate("Contact", {
      FirstName: "Integration",
      LastName: "TestContact",
      Email: "integration-test@cliver-dev.test",
    });
    createdRecords.push({ objectType: "Contact", id });
    expect(id).toBeTruthy();
    expect(id).toMatch(/^003/); // Contact IDs start with 003

    // READ
    const res = await sfFetch(`${BASE_API}/sobjects/Contact/${id}`);
    expect(res.ok).toBe(true);
    const contact = (await res.json()) as {
      Id: string;
      FirstName: string;
      LastName: string;
      Email: string;
    };
    expect(contact.Id).toBe(id);
    expect(contact.FirstName).toBe("Integration");
    expect(contact.LastName).toBe("TestContact");
    expect(contact.Email).toBe("integration-test@cliver-dev.test");

    // DELETE
    const delRes = await sfFetch(`${BASE_API}/sobjects/Contact/${id}`, {
      method: "DELETE",
    });
    expect(delRes.status).toBe(204);
    // Remove from cleanup list since we deleted manually.
    createdRecords.pop();
  });

  // --- Contact lookup via SOQL ---

  it("finds a Contact by email using SOQL", async () => {
    const email = "soql-lookup-test@cliver-dev.test";
    const id = await sfCreate("Contact", {
      FirstName: "SOQL",
      LastName: "LookupTest",
      Email: email,
    });
    createdRecords.push({ objectType: "Contact", id });

    const result = await sfQuery<{ Id: string; Email: string }>(
      `SELECT Id, Email FROM Contact WHERE Email = '${email}'`,
    );
    expect(result.totalSize).toBe(1);
    expect(result.records[0].Id).toBe(id);
    expect(result.records[0].Email).toBe(email);
  });

  // --- Lead CRUD ---

  it("creates a Lead and queries it back", async () => {
    const uniqueCompany = `CliverTest-${Date.now()}`;
    const id = await sfCreate("Lead", {
      FirstName: "Lead",
      LastName: "IntegrationTest",
      Company: uniqueCompany,
      Email: "lead-test@cliver-dev.test",
    });
    createdRecords.push({ objectType: "Lead", id });
    expect(id).toMatch(/^00Q/); // Lead IDs start with 00Q

    const result = await sfQuery<{ Id: string; Company: string }>(
      `SELECT Id, Company FROM Lead WHERE Company = '${uniqueCompany}'`,
    );
    expect(result.totalSize).toBe(1);
    expect(result.records[0].Id).toBe(id);
  });

  // --- Record update ---

  it("updates a Contact field", async () => {
    const id = await sfCreate("Contact", {
      FirstName: "Before",
      LastName: "UpdateTest",
    });
    createdRecords.push({ objectType: "Contact", id });

    // PATCH to update
    const patchRes = await sfFetch(`${BASE_API}/sobjects/Contact/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ FirstName: "After" }),
    });
    expect(patchRes.status).toBe(204);

    // Verify
    const getRes = await sfFetch(`${BASE_API}/sobjects/Contact/${id}`);
    const updated = (await getRes.json()) as { FirstName: string };
    expect(updated.FirstName).toBe("After");
  });

  // --- Error cases ---

  it("returns 404 for a non-existent record", async () => {
    const res = await sfFetch(`${BASE_API}/sobjects/Contact/003000000000000AAA`);
    expect(res.status).toBe(404);
  });

  it("returns 400 for missing required fields on Contact", async () => {
    // Contact requires LastName at minimum.
    const res = await sfFetch(`${BASE_API}/sobjects/Contact`, {
      method: "POST",
      body: JSON.stringify({ FirstName: "NoLastName" }),
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as Array<{ errorCode: string }>;
    expect(data[0].errorCode).toBe("REQUIRED_FIELD_MISSING");
  });

  it("returns error for invalid SOQL", async () => {
    const res = await sfFetch(
      `${BASE_API}/query?q=${encodeURIComponent("SELECTT Id FROM Contact")}`,
    );
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
  });

  // --- Bulk describe ---

  it("describes Lead object and has expected fields", async () => {
    const res = await sfFetch(`${BASE_API}/sobjects/Lead/describe`);
    expect(res.ok).toBe(true);
    const data = (await res.json()) as {
      name: string;
      fields: Array<{ name: string }>;
    };
    expect(data.name).toBe("Lead");
    const fieldNames = data.fields.map((f) => f.name);
    expect(fieldNames).toContain("FirstName");
    expect(fieldNames).toContain("LastName");
    expect(fieldNames).toContain("Company");
    expect(fieldNames).toContain("Email");
  });
});
