import { describe, it, expect, beforeEach, vi } from "vitest";
import { CustomerAuthService } from "../customer-auth-service.js";
import { PasswordService } from "../password-service.js";
import { SessionService } from "../session-service.js";
import { InMemoryTokenStore } from "../in-memory-token-store.js";
import { InMemoryUserStore } from "../in-memory-user-store.js";
import { ConsoleEmailTransport } from "../email-transport.js";

describe("CustomerAuthService", () => {
  let authService: CustomerAuthService;
  let userStore: InMemoryUserStore;
  let tokenStore: InMemoryTokenStore;
  let emailTransport: ConsoleEmailTransport;

  beforeEach(() => {
    // Always mock fetch for password service to avoid real HIBP calls
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1:0",
    });

    const passwordService = new PasswordService(mockFetch);
    tokenStore = new InMemoryTokenStore();
    const sessionService = new SessionService(tokenStore);
    userStore = new InMemoryUserStore();
    emailTransport = new ConsoleEmailTransport();

    authService = new CustomerAuthService(
      passwordService,
      sessionService,
      userStore,
      tokenStore,
      emailTransport,
    );
  });

  // --- Registration ---

  describe("register", () => {
    it("registers a new customer and sends confirmation code", async () => {
      const result = await authService.register("alice@example.com", "a-secure-password!");

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();

      // Email should have been "sent" (logged)
      expect(emailTransport.sentEmails.length).toBe(1);
      expect(emailTransport.sentEmails[0].to).toBe("alice@example.com");
      expect(emailTransport.sentEmails[0].subject).toMatch(/confirm/i);
    });

    it("rejects registration with a too-short password", async () => {
      const result = await authService.register("bob@example.com", "short");

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/15/);
    });

    it("rejects registration with duplicate email", async () => {
      await authService.register("alice@example.com", "a-secure-password!");
      const result = await authService.register("alice@example.com", "another-password!!");

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/already/i);
    });

    it("rejects breached passwords", async () => {
      const breachedFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => {
          // Return a result that will match the SHA-1 suffix
          // We need to compute the actual SHA-1 for the test password
          // For simplicity, mock the service to always return breached
          return "0000000000000000000000000000000000000:0";
        },
      });

      // Create a service with a password service that reports breached
      const breachedPasswordService = new PasswordService(breachedFetch);
      // Override checkBlocklist to always report breached
      vi.spyOn(breachedPasswordService, "checkBlocklist").mockResolvedValue({
        breached: true,
        count: 1000,
      });

      const svc = new CustomerAuthService(
        breachedPasswordService,
        new SessionService(tokenStore),
        new InMemoryUserStore(),
        tokenStore,
        emailTransport,
      );

      const result = await svc.register("user@example.com", "a-breached-password");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/breached|blocklist|compromised/i);
    });
  });

  // --- Email confirmation ---

  describe("confirmEmail", () => {
    it("confirms email with correct code", async () => {
      const reg = await authService.register("alice@example.com", "a-secure-password!");
      expect(reg.success).toBe(true);

      // Extract the code from the "sent" email
      const emailBody = emailTransport.sentEmails[0].textBody;
      const codeMatch = emailBody.match(/\b(\d{6})\b/);
      expect(codeMatch).not.toBeNull();
      const code = codeMatch![1];

      const result = await authService.confirmEmail("alice@example.com", code);
      expect(result.success).toBe(true);
    });

    it("rejects incorrect confirmation code", async () => {
      await authService.register("alice@example.com", "a-secure-password!");
      const result = await authService.confirmEmail("alice@example.com", "000000");
      expect(result.success).toBe(false);
    });

    it("invalidates code after 5 failed confirmation attempts (#4)", async () => {
      await authService.register("alice@example.com", "a-secure-password!");

      // Try 5 wrong codes
      for (let i = 0; i < 5; i++) {
        await authService.confirmEmail("alice@example.com", "000000");
      }

      // Now even the correct code should fail because it was invalidated
      const emailBody = emailTransport.sentEmails[0].textBody;
      const code = emailBody.match(/\b(\d{6})\b/)![1];
      const result = await authService.confirmEmail("alice@example.com", code);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/expired|not found/i);
    });

    it("rejects expired confirmation code (after 24 hours)", async () => {
      vi.useFakeTimers();
      await authService.register("alice@example.com", "a-secure-password!");

      const emailBody = emailTransport.sentEmails[0].textBody;
      const code = emailBody.match(/\b(\d{6})\b/)![1];

      // Advance past 24 hours
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      const result = await authService.confirmEmail("alice@example.com", code);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/expired/i);
      vi.useRealTimers();
    });
  });

  // --- Login ---

  describe("login", () => {
    it("logs in with correct credentials after email confirmation", async () => {
      // Register and confirm
      await authService.register("alice@example.com", "a-secure-password!");
      const code = emailTransport.sentEmails[0].textBody.match(/\b(\d{6})\b/)![1];
      await authService.confirmEmail("alice@example.com", code);

      const result = await authService.login("alice@example.com", "a-secure-password!");
      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session!.aal).toBe("AAL1");
    });

    it("rejects login before email confirmation", async () => {
      await authService.register("alice@example.com", "a-secure-password!");

      const result = await authService.login("alice@example.com", "a-secure-password!");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/confirm|verified/i);
    });

    it("rejects login with wrong password", async () => {
      await authService.register("alice@example.com", "a-secure-password!");
      const code = emailTransport.sentEmails[0].textBody.match(/\b(\d{6})\b/)![1];
      await authService.confirmEmail("alice@example.com", code);

      const result = await authService.login("alice@example.com", "wrong-password-here!");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid/i);
    });

    it("rejects login for unknown email", async () => {
      const result = await authService.login("nobody@example.com", "any-password-value");
      expect(result.success).toBe(false);
    });
  });

  // --- Rate limiting (SP 800-63B-4 Sec. 3.2.2) ---

  describe("rate limiting", () => {
    it("locks account after 100 consecutive failed login attempts", async () => {
      await authService.register("alice@example.com", "a-secure-password!");
      const code = emailTransport.sentEmails[0].textBody.match(/\b(\d{6})\b/)![1];
      await authService.confirmEmail("alice@example.com", code);

      // 100 failed attempts
      for (let i = 0; i < 100; i++) {
        await authService.login("alice@example.com", "wrong-password!!!");
      }

      // 101st attempt even with correct password should fail
      const result = await authService.login("alice@example.com", "a-secure-password!");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/locked|limit|too many/i);
    });

    it("resets counter after successful login", async () => {
      await authService.register("alice@example.com", "a-secure-password!");
      const code = emailTransport.sentEmails[0].textBody.match(/\b(\d{6})\b/)![1];
      await authService.confirmEmail("alice@example.com", code);

      // 50 failed attempts
      for (let i = 0; i < 50; i++) {
        await authService.login("alice@example.com", "wrong-password!!!");
      }

      // Successful login
      const success = await authService.login("alice@example.com", "a-secure-password!");
      expect(success.success).toBe(true);

      // 50 more failed attempts (counter should have reset)
      for (let i = 0; i < 50; i++) {
        await authService.login("alice@example.com", "wrong-password!!!");
      }

      // Should still work because counter was reset
      const result = await authService.login("alice@example.com", "a-secure-password!");
      expect(result.success).toBe(true);
    });
  });
});
