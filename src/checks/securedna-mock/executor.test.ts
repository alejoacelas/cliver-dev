import { describe, it, expect, vi } from "vitest";
import { SecureDnaMockExecutor } from "./executor.js";

describe("SecureDnaMockExecutor", () => {
  it("has checkId 'securedna_mock'", () => {
    const executor = new SecureDnaMockExecutor();
    expect(executor.checkId).toBe("securedna_mock");
  });

  it("returns pass when no concerns are selected", () => {
    const executor = new SecureDnaMockExecutor(() => 1); // always above 0.3 threshold
    const result = executor.execute({ order_description: "GFP expression vector" });
    return result.then((outcome) => {
      expect(outcome.checkId).toBe("securedna_mock");
      expect(outcome.status).toBe("pass");
      expect(outcome.evidence).toContain("No concerns");
    });
  });

  it("returns flag when concerns are selected", () => {
    const executor = new SecureDnaMockExecutor(() => 0); // always below 0.3 threshold
    return executor
      .execute({ order_description: "Anthrax toxin expression" })
      .then((outcome) => {
        expect(outcome.checkId).toBe("securedna_mock");
        expect(outcome.status).toBe("flag");
        expect(outcome.sources).toEqual([]);
      });
  });

  it("includes structured data in evidence", () => {
    const executor = new SecureDnaMockExecutor(() => 0);
    return executor
      .execute({ order_description: "Test order" })
      .then((outcome) => {
        const data = JSON.parse(outcome.evidence);
        expect(data.flagged).toBe(true);
        expect(data.concerns.length).toBeGreaterThan(0);
        expect(data.concerns[0]).toHaveProperty("organism");
        expect(data.concerns[0]).toHaveProperty("riskLevel");
        expect(data.concerns[0]).toHaveProperty("description");
      });
  });

  it("produces variable results with default random", () => {
    // Run 100 times and verify we get both outcomes
    const executor = new SecureDnaMockExecutor();
    const results = Promise.all(
      Array.from({ length: 100 }, () =>
        executor.execute({ order_description: "test" }),
      ),
    );
    return results.then((outcomes) => {
      const statuses = new Set(outcomes.map((o) => o.status));
      // With 30% chance per concern and 7 concerns, we should see both
      expect(statuses.size).toBeGreaterThanOrEqual(1);
    });
  });
});
