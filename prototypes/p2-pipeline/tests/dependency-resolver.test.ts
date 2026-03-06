import { describe, it, expect } from "vitest";
import { CheckDependencyResolver } from "../src/dependency-resolver.js";
import type { CheckDeclaration } from "@cliver/contracts";

const makeCheck = (
  id: string,
  requiredFields: string[],
  needsConsent: boolean,
): CheckDeclaration => ({
  id,
  name: `Check ${id}`,
  requiredFields,
  needsConsent,
});

describe("CheckDependencyResolver", () => {
  const resolver = new CheckDependencyResolver();

  it("returns a check when all required fields are completed and no consent needed", () => {
    const declarations = [makeCheck("domain", ["email"], false)];
    const result = resolver.resolveEligible(
      declarations,
      ["email"],
      new Set<string>(),
      new Set<string>(),
    );
    expect(result).toEqual(["domain"]);
  });

  it("does not return a check missing one required field", () => {
    const declarations = [makeCheck("sanctions", ["name", "institution"], false)];
    const result = resolver.resolveEligible(
      declarations,
      ["name"], // missing "institution"
      new Set<string>(),
      new Set<string>(),
    );
    expect(result).toEqual([]);
  });

  it("does not return a check requiring consent that has not been consented", () => {
    const declarations = [makeCheck("sanctions", ["name"], true)];
    const result = resolver.resolveEligible(
      declarations,
      ["name"],
      new Set<string>(), // no consent given
      new Set<string>(),
    );
    expect(result).toEqual([]);
  });

  it("returns a consent-requiring check when consent has been granted", () => {
    const declarations = [makeCheck("sanctions", ["name"], true)];
    const result = resolver.resolveEligible(
      declarations,
      ["name"],
      new Set(["sanctions"]), // consent granted
      new Set<string>(),
    );
    expect(result).toEqual(["sanctions"]);
  });

  it("does not return a check already running", () => {
    const declarations = [makeCheck("domain", ["email"], false)];
    const result = resolver.resolveEligible(
      declarations,
      ["email"],
      new Set<string>(),
      new Set(["domain"]), // already running
    );
    expect(result).toEqual([]);
  });

  it("does not return a check already completed", () => {
    const declarations = [makeCheck("domain", ["email"], false)];
    const result = resolver.resolveEligible(
      declarations,
      ["email"],
      new Set<string>(),
      new Set(["domain"]), // already completed (in runningOrCompleted set)
    );
    expect(result).toEqual([]);
  });

  it("returns multiple checks that become eligible simultaneously", () => {
    const declarations = [
      makeCheck("domain", ["email"], false),
      makeCheck("affiliation", ["email"], false),
    ];
    const result = resolver.resolveEligible(
      declarations,
      ["email"],
      new Set<string>(),
      new Set<string>(),
    );
    expect(result).toEqual(["domain", "affiliation"]);
  });

  it("returns a check with empty requiredFields immediately", () => {
    const declarations = [makeCheck("always-run", [], false)];
    const result = resolver.resolveEligible(
      declarations,
      [],
      new Set<string>(),
      new Set<string>(),
    );
    expect(result).toEqual(["always-run"]);
  });

  it("handles mixed eligibility correctly", () => {
    const declarations = [
      makeCheck("domain", ["email"], false),         // eligible
      makeCheck("sanctions", ["name", "org"], false), // not eligible (missing org)
      makeCheck("gated", ["email"], true),            // not eligible (needs consent)
    ];
    const result = resolver.resolveEligible(
      declarations,
      ["email", "name"],
      new Set<string>(),
      new Set<string>(),
    );
    expect(result).toEqual(["domain"]);
  });
});
