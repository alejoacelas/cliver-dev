import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { SalesforceAdapter } from "./salesforce-adapter.js";
import { SalesforceApiError } from "./types.js";
import type { SalesforceSession } from "./types.js";

/**
 * Integration tests against a live Salesforce Developer Edition org.
 *
 * Obtains a session via one of two methods (tried in order):
 *   1. `sf org display --target-org cliver-dev` (Salesforce CLI)
 *   2. OAuth password flow using SF_* env vars from .env
 *
 * Run with: npx vitest run src/salesforce-adapter.integration.test.ts
 */

function getSessionFromCli(): SalesforceSession | null {
  try {
    const raw = execSync("sf org display --target-org cliver-dev --json", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const data = JSON.parse(raw) as {
      status: number;
      result: { accessToken: string; instanceUrl: string };
    };
    if (data.status !== 0) return null;
    return {
      accessToken: data.result.accessToken,
      instanceUrl: data.result.instanceUrl,
      refreshToken: "",
      issuedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

const SF_CONSUMER_KEY = process.env.SF_CONSUMER_KEY;
const SF_CONSUMER_SECRET = process.env.SF_CONSUMER_SECRET;
const SF_USERNAME = process.env.SF_USERNAME;
const SF_PASSWORD = process.env.SF_PASSWORD;
const SF_SECURITY_TOKEN = process.env.SF_SECURITY_TOKEN;

const hasEnvCredentials =
  SF_CONSUMER_KEY && SF_CONSUMER_SECRET && SF_USERNAME && SF_PASSWORD && SF_SECURITY_TOKEN;

const cliSession = getSessionFromCli();
const canRun = cliSession || hasEnvCredentials;

describe.skipIf(!canRun)("SalesforceAdapter integration", () => {
  let adapter: SalesforceAdapter;
  let session: SalesforceSession;

  beforeAll(async () => {
    if (cliSession) {
      // Use the CLI-provided session directly.
      session = cliSession;
      adapter = new SalesforceAdapter({
        clientId: SF_CONSUMER_KEY ?? "PlatformCLI",
        clientSecret: SF_CONSUMER_SECRET ?? "",
      });
    } else {
      // Fall back to password flow.
      adapter = new SalesforceAdapter({
        clientId: SF_CONSUMER_KEY!,
        clientSecret: SF_CONSUMER_SECRET!,
      });
      session = await adapter.authenticateWithPassword(
        SF_USERNAME!,
        SF_PASSWORD! + SF_SECURITY_TOKEN!,
      );
    }
  });

  // --- Authentication ---

  it("has a valid session with access token and instance URL", () => {
    expect(session.accessToken).toBeTruthy();
    expect(session.instanceUrl).toMatch(/^https:\/\/.+\.salesforce\.com/);
  });

  // --- API version discovery ---

  it("can query available API versions", async () => {
    const response = await fetch(`${session.instanceUrl}/services/data/`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    expect(response.ok).toBe(true);
    const versions = (await response.json()) as Array<{ version: string }>;
    expect(versions.length).toBeGreaterThan(0);
    const v59 = versions.find((v) => v.version === "59.0");
    expect(v59).toBeDefined();
  });

  // --- Contact lookup ---

  it("findContact returns null for a non-existent email", async () => {
    const result = await adapter.findContact(
      session,
      "definitely-not-a-real-contact@nonexistent-domain-xyz.com",
    );
    expect(result).toBeNull();
  });

  // --- SOQL query execution ---

  it("can execute a SOQL query against the Lead object", async () => {
    const query = "SELECT Id, Name FROM Lead LIMIT 1";
    const url = `${session.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    expect(response.ok).toBe(true);
    const data = (await response.json()) as { totalSize: number; done: boolean };
    expect(data).toHaveProperty("totalSize");
    expect(data).toHaveProperty("done", true);
  });

  // --- Object metadata ---

  it("can describe the Contact object", async () => {
    const url = `${session.instanceUrl}/services/data/v59.0/sobjects/Contact/describe`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    expect(response.ok).toBe(true);
    const data = (await response.json()) as { name: string; fields: unknown[] };
    expect(data.name).toBe("Contact");
    expect(data.fields.length).toBeGreaterThan(0);
  });

  // --- Error handling with real API ---

  it("rejects invalid credentials with INVALID_CREDENTIALS", async () => {
    const badAdapter = new SalesforceAdapter({
      clientId: "bad-client-id",
      clientSecret: "bad-secret",
    });

    await expect(
      badAdapter.authenticateWithPassword("bad@user.com", "wrongpass"),
    ).rejects.toThrow(SalesforceApiError);

    try {
      await badAdapter.authenticateWithPassword("bad@user.com", "wrongpass");
    } catch (err) {
      expect((err as SalesforceApiError).code).toBe("INVALID_CREDENTIALS");
    }
  });

  it("returns error for a bogus instance URL", async () => {
    const badSession: SalesforceSession = {
      ...session,
      instanceUrl: "https://not-a-real-instance.salesforce.com",
    };

    await expect(
      adapter.findContact(badSession, "test@example.com"),
    ).rejects.toThrow(SalesforceApiError);
  });
});
