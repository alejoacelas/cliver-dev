import { describe, it, expect, vi } from "vitest";
import { EmailDomainCheckExecutor } from "./executor.js";
import { createMockProvider } from "../testing.js";

describe("EmailDomainCheckExecutor", () => {
  const MODEL = "test-model";
  const fields = { email: "jane@mit.edu", institution: "MIT" };

  it("has checkId 'email_domain_check'", () => {
    const provider = createMockProvider();
    const executor = new EmailDomainCheckExecutor(provider, MODEL);
    expect(executor.checkId).toBe("email_domain_check");
  });

  it("returns pass when email domain matches institution", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "NO_FLAG",
      evidence: "mit.edu is MIT's official domain",
      sources: ["web1"],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new EmailDomainCheckExecutor(provider, MODEL);

    const outcome = await executor.execute(fields);

    expect(outcome.status).toBe("pass");
  });

  it("returns flag when email domain does not match", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "FLAG",
      evidence: "gmail.com is not an MIT domain",
      sources: [],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new EmailDomainCheckExecutor(provider, MODEL);

    const outcome = await executor.execute({
      email: "jane@gmail.com",
      institution: "MIT",
    });

    expect(outcome.status).toBe("flag");
  });

  it("passes both email and institution to prompt", async () => {
    const extractStructured = vi.fn().mockResolvedValue({
      status: "NO_FLAG",
      evidence: "Match",
      sources: [],
    });
    const provider = createMockProvider({ extractStructured });
    const executor = new EmailDomainCheckExecutor(provider, MODEL);

    await executor.execute(fields);

    const context = extractStructured.mock.calls[0][0];
    expect(context).toContain("jane@mit.edu");
    expect(context).toContain("MIT");
  });
});
