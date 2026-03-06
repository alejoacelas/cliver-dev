import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProviderAuthService } from "../provider-auth-service.js";
import { PasswordService } from "../password-service.js";
import { SessionService } from "../session-service.js";
import { InMemoryTokenStore } from "../in-memory-token-store.js";
import { InMemoryUserStore } from "../in-memory-user-store.js";

describe("ProviderAuthService", () => {
  let authService: ProviderAuthService;
  let userStore: InMemoryUserStore;
  let tokenStore: InMemoryTokenStore;
  let passwordService: PasswordService;

  beforeEach(() => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1:0",
    });

    passwordService = new PasswordService(mockFetch);
    tokenStore = new InMemoryTokenStore();
    const sessionService = new SessionService(tokenStore);
    userStore = new InMemoryUserStore();

    authService = new ProviderAuthService(
      passwordService,
      sessionService,
      userStore,
      tokenStore,
    );
  });

  // --- TOTP enrollment ---

  describe("enrollTOTP", () => {
    it("generates a secret and provisioning URI", async () => {
      // Create a provider user first
      const userId = await userStore.createUser({
        email: "provider@example.com",
        passwordHash: await passwordService.hash("provider-password!"),
        role: "provider",
      });

      const enrollment = await authService.enrollTOTP(userId);

      expect(enrollment.secret).toBeDefined();
      expect(enrollment.secret.length).toBeGreaterThan(0);
      expect(enrollment.uri).toMatch(/^otpauth:\/\/totp\//);
      expect(enrollment.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });

  // --- TOTP verification ---

  describe("verifyTOTP", () => {
    it("verifies a valid TOTP code", async () => {
      const userId = await userStore.createUser({
        email: "provider@example.com",
        passwordHash: await passwordService.hash("provider-password!"),
        role: "provider",
      });

      const enrollment = await authService.enrollTOTP(userId);

      // Generate a valid TOTP code using the secret
      const { TOTP } = await import("otpauth");
      const totp = new TOTP({ secret: enrollment.secret });
      const code = totp.generate();

      const result = await authService.verifyTOTP(userId, code);
      expect(result).toBe(true);
    });

    it("rejects an invalid TOTP code", async () => {
      const userId = await userStore.createUser({
        email: "provider@example.com",
        passwordHash: await passwordService.hash("provider-password!"),
        role: "provider",
      });

      await authService.enrollTOTP(userId);

      const result = await authService.verifyTOTP(userId, "000000");
      expect(result).toBe(false);
    });
  });

  // --- Provider login (AAL2: password + TOTP) ---

  describe("login", () => {
    it("succeeds with correct password and TOTP code", async () => {
      const password = "provider-secure-pwd";
      const userId = await userStore.createUser({
        email: "provider@example.com",
        passwordHash: await passwordService.hash(password),
        role: "provider",
        emailConfirmed: true,
      });

      const enrollment = await authService.enrollTOTP(userId);

      const { TOTP } = await import("otpauth");
      const totp = new TOTP({ secret: enrollment.secret });
      const code = totp.generate();

      const result = await authService.login("provider@example.com", password, code);
      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session!.aal).toBe("AAL2");
    });

    it("rejects login without TOTP code (both factors required)", async () => {
      const password = "provider-secure-pwd";
      await userStore.createUser({
        email: "provider@example.com",
        passwordHash: await passwordService.hash(password),
        role: "provider",
        emailConfirmed: true,
      });

      const result = await authService.login("provider@example.com", password, undefined as unknown as string);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/TOTP|second factor|required/i);
    });

    it("rejects login with correct password but wrong TOTP", async () => {
      const password = "provider-secure-pwd";
      const userId = await userStore.createUser({
        email: "provider@example.com",
        passwordHash: await passwordService.hash(password),
        role: "provider",
        emailConfirmed: true,
      });

      await authService.enrollTOTP(userId);

      const result = await authService.login("provider@example.com", password, "000000");
      expect(result.success).toBe(false);
    });

    it("rejects login with wrong password but correct TOTP", async () => {
      const password = "provider-secure-pwd";
      const userId = await userStore.createUser({
        email: "provider@example.com",
        passwordHash: await passwordService.hash(password),
        role: "provider",
        emailConfirmed: true,
      });

      const enrollment = await authService.enrollTOTP(userId);

      const { TOTP } = await import("otpauth");
      const totp = new TOTP({ secret: enrollment.secret });
      const code = totp.generate();

      const result = await authService.login("provider@example.com", "wrong-password!!", code);
      expect(result.success).toBe(false);
    });

    it("stores session role as 'provider' after successful login (#8)", async () => {
      const password = "provider-secure-pwd";
      const userId = await userStore.createUser({
        email: "provider@example.com",
        passwordHash: await passwordService.hash(password),
        role: "provider",
        emailConfirmed: true,
      });

      const enrollment = await authService.enrollTOTP(userId);

      const { TOTP } = await import("otpauth");
      const totp = new TOTP({ secret: enrollment.secret });
      const code = totp.generate();

      const result = await authService.login("provider@example.com", password, code);
      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();

      const role = await tokenStore.get(`session-role:${result.session!.id}`);
      expect(role).toBe("provider");
    });

    it("rejects login when email is not confirmed (#7)", async () => {
      const password = "provider-secure-pwd";
      const userId = await userStore.createUser({
        email: "provider@example.com",
        passwordHash: await passwordService.hash(password),
        role: "provider",
        emailConfirmed: false,
      });

      const enrollment = await authService.enrollTOTP(userId);

      const { TOTP } = await import("otpauth");
      const totp = new TOTP({ secret: enrollment.secret });
      const code = totp.generate();

      const result = await authService.login("provider@example.com", password, code);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/confirm/i);
    });
  });

  // --- TOTP replay protection (#1) ---

  describe("TOTP replay protection", () => {
    it("rejects a TOTP code that has already been used", async () => {
      const userId = await userStore.createUser({
        email: "provider@example.com",
        passwordHash: await passwordService.hash("provider-secure-pwd"),
        role: "provider",
      });

      const enrollment = await authService.enrollTOTP(userId);

      const { TOTP } = await import("otpauth");
      const totp = new TOTP({ secret: enrollment.secret });
      const code = totp.generate();

      // First use should succeed
      const first = await authService.verifyTOTP(userId, code);
      expect(first).toBe(true);

      // Same code again should be rejected (replay)
      const second = await authService.verifyTOTP(userId, code);
      expect(second).toBe(false);
    });
  });
});
