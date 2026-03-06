import { describe, it, expect } from "vitest";
import { isValidEmail } from "./email-validation.js";

describe("isValidEmail", () => {
  it("accepts a standard email address", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("accepts an email with subdomains", () => {
    expect(isValidEmail("admin@mail.example.co.uk")).toBe(true);
  });

  it("accepts an email with plus addressing", () => {
    expect(isValidEmail("user+tag@example.com")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects a string without @", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  it("rejects a string without domain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });

  it("rejects a string without TLD", () => {
    expect(isValidEmail("user@example")).toBe(false);
  });

  it("rejects an email with spaces", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
  });

  it("rejects an email exceeding 254 characters", () => {
    const longLocal = "a".repeat(250);
    expect(isValidEmail(`${longLocal}@example.com`)).toBe(false);
  });
});
