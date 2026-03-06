import { describe, it, expect, beforeEach } from "vitest";
import { ConsentManager } from "../src/consent-manager.js";

describe("ConsentManager", () => {
  let cm: ConsentManager;
  const screeningId = "scr-1";

  beforeEach(() => {
    cm = new ConsentManager();
  });

  it("propose() records a pending consent request", async () => {
    await cm.propose(screeningId, "sanctions", "Run sanctions screening");
    const pending = await cm.getPending(screeningId);
    expect(pending).toEqual([
      { checkId: "sanctions", description: "Run sanctions screening" },
    ]);
  });

  it("isAuthorized() returns false before consent is granted", async () => {
    await cm.propose(screeningId, "sanctions", "Run sanctions screening");
    expect(await cm.isAuthorized(screeningId, "sanctions")).toBe(false);
  });

  it("consent() authorizes the check", async () => {
    await cm.propose(screeningId, "sanctions", "Run sanctions screening");
    await cm.consent(screeningId, "sanctions");
    expect(await cm.isAuthorized(screeningId, "sanctions")).toBe(true);
  });

  it("consent() removes the check from pending", async () => {
    await cm.propose(screeningId, "sanctions", "Run sanctions screening");
    await cm.consent(screeningId, "sanctions");
    const pending = await cm.getPending(screeningId);
    expect(pending).toEqual([]);
  });

  it("deny() marks the check as denied", async () => {
    await cm.propose(screeningId, "sanctions", "Run sanctions screening");
    await cm.deny(screeningId, "sanctions");
    expect(await cm.isAuthorized(screeningId, "sanctions")).toBe(false);
  });

  it("deny() removes the check from pending", async () => {
    await cm.propose(screeningId, "sanctions", "Run sanctions screening");
    await cm.deny(screeningId, "sanctions");
    const pending = await cm.getPending(screeningId);
    expect(pending).toEqual([]);
  });

  it("getStatus() returns the consent status", async () => {
    await cm.propose(screeningId, "sanctions", "Run sanctions screening");
    expect(cm.getStatus(screeningId, "sanctions")).toBe("pending");
    await cm.consent(screeningId, "sanctions");
    expect(cm.getStatus(screeningId, "sanctions")).toBe("granted");
  });

  it("getStatus() returns denied after deny()", async () => {
    await cm.propose(screeningId, "sanctions", "Run sanctions screening");
    await cm.deny(screeningId, "sanctions");
    expect(cm.getStatus(screeningId, "sanctions")).toBe("denied");
  });

  it("handles multiple screenings independently", async () => {
    await cm.propose("scr-1", "sanctions", "Desc 1");
    await cm.propose("scr-2", "sanctions", "Desc 2");
    await cm.consent("scr-1", "sanctions");
    expect(await cm.isAuthorized("scr-1", "sanctions")).toBe(true);
    expect(await cm.isAuthorized("scr-2", "sanctions")).toBe(false);
  });

  it("handles multiple checks within a screening", async () => {
    await cm.propose(screeningId, "sanctions", "Sanctions check");
    await cm.propose(screeningId, "export", "Export control check");
    await cm.consent(screeningId, "sanctions");
    expect(await cm.isAuthorized(screeningId, "sanctions")).toBe(true);
    expect(await cm.isAuthorized(screeningId, "export")).toBe(false);
    const pending = await cm.getPending(screeningId);
    expect(pending).toEqual([
      { checkId: "export", description: "Export control check" },
    ]);
  });

  it("isExpired() returns true after consent timeout", () => {
    // Logical timestamp check: propose time + timeout < current time
    const now = Date.now();
    cm.proposeAt(screeningId, "sanctions", "Desc", now - 60_000);
    expect(cm.isExpired(screeningId, "sanctions", 30_000, now)).toBe(true);
  });

  it("isExpired() returns false within timeout window", () => {
    const now = Date.now();
    cm.proposeAt(screeningId, "sanctions", "Desc", now - 10_000);
    expect(cm.isExpired(screeningId, "sanctions", 30_000, now)).toBe(false);
  });

  it("isExpired() returns false for granted consent", async () => {
    const now = Date.now();
    cm.proposeAt(screeningId, "sanctions", "Desc", now - 60_000);
    await cm.consent(screeningId, "sanctions");
    expect(cm.isExpired(screeningId, "sanctions", 30_000, now)).toBe(false);
  });
});
