import { describe, it, expect } from "vitest";
import { loadPrompt } from "./prompts.js";

describe("loadPrompt", () => {
  it("loads and interpolates affiliation-check prompt", () => {
    const result = loadPrompt("affiliation_check", {
      name: "Jane Smith",
      institution: "MIT",
    });
    expect(result).toContain("Jane Smith");
    expect(result).toContain("MIT");
    expect(result).not.toContain("{{name}}");
    expect(result).not.toContain("{{institution}}");
  });

  it("loads and interpolates institution-check prompt", () => {
    const result = loadPrompt("institution_check", {
      institution: "Stanford University",
    });
    expect(result).toContain("Stanford University");
    expect(result).not.toContain("{{institution}}");
  });

  it("loads and interpolates email-domain-check prompt", () => {
    const result = loadPrompt("email_domain_check", {
      email: "jane@mit.edu",
      institution: "MIT",
    });
    expect(result).toContain("jane@mit.edu");
    expect(result).toContain("MIT");
  });

  it("loads and interpolates sanctions-check prompt", () => {
    const result = loadPrompt("sanctions_check", {
      name: "Jane Smith",
      institution: "MIT",
    });
    expect(result).toContain("Jane Smith");
    expect(result).toContain("MIT");
  });

  it("loads and interpolates publication-search prompt", () => {
    const result = loadPrompt("publication_search", {
      name: "Jane Smith",
    });
    expect(result).toContain("Jane Smith");
  });

  it("loads and interpolates background-work prompt", () => {
    const result = loadPrompt("background_work", {
      name: "Jane Smith",
      order_description: "SARS-CoV-2 spike protein expression vector",
    });
    expect(result).toContain("Jane Smith");
    expect(result).toContain("SARS-CoV-2 spike protein expression vector");
  });

  it("loads and interpolates coauthor-finder prompt", () => {
    const result = loadPrompt("coauthor_finder", {
      name: "Jane Smith",
    });
    expect(result).toContain("Jane Smith");
  });

  it("loads and interpolates summarizer prompt", () => {
    const result = loadPrompt("summarizer", {
      name: "Jane Smith",
      institution: "MIT",
      email: "jane@mit.edu",
      order_description: "Expression vector",
      check_results: "All checks passed",
    });
    expect(result).toContain("Jane Smith");
    expect(result).toContain("MIT");
    expect(result).toContain("All checks passed");
  });

  it("throws for non-existent prompt", () => {
    expect(() => loadPrompt("nonexistent", {})).toThrow();
  });
});
