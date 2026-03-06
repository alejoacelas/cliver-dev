import { describe, it, expect, beforeEach, vi } from "vitest";
import { EmailVerificationService } from "../email-verification-service.js";
import { InMemoryTokenStore } from "../in-memory-token-store.js";
import { ConsoleEmailTransport } from "../email-transport.js";

describe("EmailVerificationService", () => {
  let service: EmailVerificationService;
  let tokenStore: InMemoryTokenStore;
  let emailTransport: ConsoleEmailTransport;

  beforeEach(() => {
    tokenStore = new InMemoryTokenStore();
    emailTransport = new ConsoleEmailTransport();
    service = new EmailVerificationService(tokenStore, emailTransport);
  });

  describe("requestVerification", () => {
    it("sends a verification email to the contact", async () => {
      const result = await service.requestVerification(
        "contact@institution.edu",
        "Alice Smith",
        "MIT",
      );

      expect(result.verificationId).toBeDefined();
      expect(emailTransport.sentEmails.length).toBe(1);
      expect(emailTransport.sentEmails[0].to).toBe("contact@institution.edu");
      expect(emailTransport.sentEmails[0].textBody).toMatch(/Alice Smith/);
      expect(emailTransport.sentEmails[0].textBody).toMatch(/MIT/);
    });

    it("includes a verification token/link in the email", async () => {
      await service.requestVerification("contact@institution.edu", "Alice", "MIT");

      const emailBody = emailTransport.sentEmails[0].textBody;
      // Should contain a token or URL for response
      expect(emailBody).toMatch(/token|verify|respond/i);
    });
  });

  describe("checkStatus", () => {
    it("returns pending for a new verification", async () => {
      const { verificationId } = await service.requestVerification(
        "contact@institution.edu",
        "Alice",
        "MIT",
      );

      const status = await service.checkStatus(verificationId);
      expect(status.status).toBe("pending");
    });

    it("returns confirmed after positive response", async () => {
      const { verificationId, token } = await service.requestVerification(
        "contact@institution.edu",
        "Alice",
        "MIT",
      );

      await service.handleResponse(token, "confirmed");

      const status = await service.checkStatus(verificationId);
      expect(status.status).toBe("confirmed");
    });

    it("returns denied after negative response", async () => {
      const { verificationId, token } = await service.requestVerification(
        "contact@institution.edu",
        "Alice",
        "MIT",
      );

      await service.handleResponse(token, "denied");

      const status = await service.checkStatus(verificationId);
      expect(status.status).toBe("denied");
    });
  });

  describe("handleResponse", () => {
    it("rejects invalid token", async () => {
      await expect(
        service.handleResponse("invalid-token", "confirmed"),
      ).rejects.toThrow(/invalid|not found/i);
    });

    it("rejects double response", async () => {
      const { token } = await service.requestVerification(
        "contact@institution.edu",
        "Alice",
        "MIT",
      );

      await service.handleResponse(token, "confirmed");

      await expect(
        service.handleResponse(token, "denied"),
      ).rejects.toThrow(/already|responded/i);
    });
  });
});
