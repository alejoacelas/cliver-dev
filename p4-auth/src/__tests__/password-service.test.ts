import { describe, it, expect, vi, beforeEach } from "vitest";
import { PasswordService } from "../password-service.js";

describe("PasswordService", () => {
  let service: PasswordService;

  beforeEach(() => {
    // Use a mock fetch for HIBP API calls in tests
    service = new PasswordService();
  });

  // --- SP 800-63B-4 Sec. 3.1.1.2: Password validation ---

  describe("validateStrength", () => {
    it("rejects passwords shorter than 15 characters for single-factor (AAL1)", () => {
      const result = service.validateStrength("short1234567", "AAL1");
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/15/);
    });

    it("accepts passwords of exactly 15 characters for AAL1", () => {
      const result = service.validateStrength("abcdefghijklmno", "AAL1");
      expect(result.valid).toBe(true);
    });

    it("rejects passwords shorter than 8 characters for MFA (AAL2)", () => {
      const result = service.validateStrength("short12", "AAL2");
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/8/);
    });

    it("accepts passwords of exactly 8 characters for AAL2", () => {
      const result = service.validateStrength("abcd1234", "AAL2");
      expect(result.valid).toBe(true);
    });

    it("accepts passwords of 64+ characters", () => {
      const longPassword = "a".repeat(128);
      const result = service.validateStrength(longPassword, "AAL1");
      expect(result.valid).toBe(true);
    });

    it("does not enforce composition rules (no mandatory uppercase/symbols)", () => {
      // All lowercase, no digits, no symbols — should be accepted if long enough
      const result = service.validateStrength("alllowercaseletters", "AAL1");
      expect(result.valid).toBe(true);
    });

    it("accepts Unicode characters", () => {
      const result = service.validateStrength("contraseña segura más larga", "AAL1");
      expect(result.valid).toBe(true);
    });

    it("counts Unicode code points, not UTF-16 code units (#12)", () => {
      // 8 emoji characters — each is 1 code point but 2 UTF-16 code units
      const emojiPassword = "😀😁😂🤣😃😄😅😆";
      expect([...emojiPassword].length).toBe(8);
      expect(emojiPassword.length).toBe(16); // UTF-16 would over-count

      // Should be rejected for AAL1 (needs 15 code points, only has 8)
      const aal1Result = service.validateStrength(emojiPassword, "AAL1");
      expect(aal1Result.valid).toBe(false);

      // Should be accepted for AAL2 (needs 8 code points, has exactly 8)
      const aal2Result = service.validateStrength(emojiPassword, "AAL2");
      expect(aal2Result.valid).toBe(true);
    });
  });

  // --- Hashing ---

  describe("hash and verify", () => {
    it("hashes a password and verifies it correctly", async () => {
      const password = "a-secure-password-here";
      const hash = await service.hash(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$argon2/); // argon2id hash format

      const valid = await service.verify(password, hash);
      expect(valid).toBe(true);
    });

    it("rejects wrong password against a hash", async () => {
      const hash = await service.hash("correct-password-value");
      const valid = await service.verify("wrong-password-value!", hash);
      expect(valid).toBe(false);
    });

    it("verifies the entire password (no truncation)", async () => {
      const base = "a".repeat(72);
      const password1 = base + "x";
      const password2 = base + "y";
      const hash = await service.hash(password1);

      // If truncation occurred, both would verify. They should not.
      const valid = await service.verify(password2, hash);
      expect(valid).toBe(false);
    });

    it("hash includes salt and cost factor", async () => {
      const hash = await service.hash("test-password-value");
      // Argon2id hashes encode params: $argon2id$v=19$m=...,t=...,p=...$salt$hash
      expect(hash).toMatch(/\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$/);
    });
  });

  // --- Blocklist (HIBP k-anonymity API) ---

  describe("checkBlocklist", () => {
    it("flags a known-breached password", async () => {
      // Mock fetch to simulate HIBP API returning matches
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => {
          // We'll compute the suffix for "password" to make this realistic
          // SHA-1 of "password" = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
          // Prefix: 5BAA6, Suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8
          return "1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493\nABCDEF1234567890ABCDEF1234567890ABC:5";
        },
      });
      const svc = new PasswordService(mockFetch);

      const result = await svc.checkBlocklist("password");
      expect(result.breached).toBe(true);
      expect(result.count).toBeGreaterThan(0);
    });

    it("clears a non-breached password", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1:2\nBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB2:1",
      });
      const svc = new PasswordService(mockFetch);

      const result = await svc.checkBlocklist("some-unique-unbreached-password-xyz");
      expect(result.breached).toBe(false);
    });

    it("gracefully handles HIBP API failure", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
      const svc = new PasswordService(mockFetch);

      // Should not throw — fail open or closed depending on design
      const result = await svc.checkBlocklist("any-password-here");
      // On API failure, we fail open (allow) but log a warning
      expect(result.breached).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
