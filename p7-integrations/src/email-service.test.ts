import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { EmailService } from "./email-service.js";
import { SendGridTransport } from "./sendgrid-transport.js";
import { SESTransport } from "./ses-transport.js";
import { EmailSendError } from "./types.js";
import { createStubServer, type StubServer } from "./test-helpers.js";
import type { EmailMessage } from "@cliver/contracts";

describe("EmailService", () => {
  let stub: StubServer;
  let lastSentBody: string;

  beforeAll(async () => {
    stub = await createStubServer();
  });

  afterAll(async () => {
    await stub.close();
  });

  beforeEach(() => {
    stub.requests.length = 0;
    stub.clearRoutes();
    // Default success route for SendGrid
    stub.addRoute("POST", "/v3/mail/send", (_req, body) => {
      lastSentBody = body;
      return {
        status: 202,
        headers: { "X-Message-Id": "svc-msg-001" },
        body: "",
      };
    });
  });

  function makeService(): EmailService {
    const transport = new SendGridTransport("test-key", stub.url);
    return new EmailService(transport, "noreply@cliver.example");
  }

  describe("send", () => {
    it("delegates to transport and returns messageId", async () => {
      const svc = makeService();
      const result = await svc.send({
        to: "user@example.com",
        from: "noreply@cliver.example",
        subject: "Hi",
        textBody: "Hello",
      });
      expect(result.messageId).toBe("svc-msg-001");
    });

    it("pre-validates email before sending", async () => {
      const svc = makeService();
      try {
        await svc.send({
          to: "bad",
          from: "noreply@cliver.example",
          subject: "Hi",
          textBody: "Hello",
        });
        expect.fail("Should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(EmailSendError);
        expect((err as EmailSendError).code).toBe("INVALID_EMAIL");
      }
    });
  });

  describe("sendConfirmationCode", () => {
    it("composes email with correct recipient, subject, and code", async () => {
      const svc = makeService();
      const result = await svc.sendConfirmationCode("user@example.com", "847291");

      expect(result.messageId).toBe("svc-msg-001");

      const parsed = JSON.parse(lastSentBody);
      expect(parsed.personalizations[0].to[0].email).toBe("user@example.com");
      expect(parsed.from.email).toBe("noreply@cliver.example");
      expect(parsed.subject).toBe("Your Cliver confirmation code");

      const textContent = parsed.content.find(
        (c: { type: string }) => c.type === "text/plain",
      );
      expect(textContent.value).toContain("847291");

      const htmlContent = parsed.content.find(
        (c: { type: string }) => c.type === "text/html",
      );
      expect(htmlContent.value).toContain("847291");
    });
  });

  describe("sendVerificationRequest", () => {
    it("composes email with confirm/deny links", async () => {
      const svc = makeService();
      const result = await svc.sendVerificationRequest(
        "hr@acme.com",
        "Jane Doe",
        "ACME Corp",
        "https://app.cliver.example/verify/abc?action=confirm",
        "https://app.cliver.example/verify/abc?action=deny",
      );

      expect(result.messageId).toBe("svc-msg-001");

      const parsed = JSON.parse(lastSentBody);
      expect(parsed.personalizations[0].to[0].email).toBe("hr@acme.com");
      expect(parsed.subject).toBe("Verification request for Jane Doe");

      const textContent = parsed.content.find(
        (c: { type: string }) => c.type === "text/plain",
      );
      expect(textContent.value).toContain("Jane Doe");
      expect(textContent.value).toContain("ACME Corp");
      expect(textContent.value).toContain("https://app.cliver.example/verify/abc?action=confirm");
      expect(textContent.value).toContain("https://app.cliver.example/verify/abc?action=deny");

      const htmlContent = parsed.content.find(
        (c: { type: string }) => c.type === "text/html",
      );
      expect(htmlContent.value).toContain("Confirm");
      expect(htmlContent.value).toContain("Deny");
    });
  });

  describe("sendNotification", () => {
    it("sends a plain text notification", async () => {
      const svc = makeService();
      const result = await svc.sendNotification(
        "user@example.com",
        "Screening complete",
        "Your background screening has been completed.",
      );
      expect(result.messageId).toBe("svc-msg-001");

      const parsed = JSON.parse(lastSentBody);
      expect(parsed.subject).toBe("Screening complete");
      // Notification has text only, no HTML
      expect(parsed.content).toHaveLength(1);
      expect(parsed.content[0].type).toBe("text/plain");
    });
  });

  describe("send validates from", () => {
    it("throws INVALID_EMAIL for malformed sender", async () => {
      const svc = makeService();
      try {
        await svc.send({
          to: "user@example.com",
          from: "bad-from",
          subject: "Hi",
          textBody: "Hello",
        });
        expect.fail("Should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(EmailSendError);
        expect((err as EmailSendError).code).toBe("INVALID_EMAIL");
        expect((err as EmailSendError).message).toContain("sender");
      }
    });
  });

  describe("HTML injection prevention", () => {
    it("escapes HTML in confirmation code", async () => {
      const svc = makeService();
      await svc.sendConfirmationCode("user@example.com", '<script>alert("xss")</script>');

      const parsed = JSON.parse(lastSentBody);
      const htmlContent = parsed.content.find(
        (c: { type: string }) => c.type === "text/html",
      );
      expect(htmlContent.value).not.toContain("<script>");
      expect(htmlContent.value).toContain("&lt;script&gt;");
    });

    it("escapes HTML in verification request customer name", async () => {
      const svc = makeService();
      await svc.sendVerificationRequest(
        "hr@acme.com",
        '<img src=x onerror="alert(1)">',
        "ACME & Sons",
        "https://app.cliver.example/verify/abc?action=confirm",
        "https://app.cliver.example/verify/abc?action=deny",
      );

      const parsed = JSON.parse(lastSentBody);
      const htmlContent = parsed.content.find(
        (c: { type: string }) => c.type === "text/html",
      );
      expect(htmlContent.value).not.toContain("<img");
      expect(htmlContent.value).toContain("&lt;img");
      expect(htmlContent.value).toContain("ACME &amp; Sons");
    });

    it("rejects non-https confirm URL", async () => {
      const svc = makeService();
      await expect(
        svc.sendVerificationRequest(
          "hr@acme.com",
          "Jane",
          "ACME",
          "javascript:alert(1)",
          "https://app.cliver.example/deny",
        ),
      ).rejects.toThrow(EmailSendError);
    });

    it("rejects non-https deny URL", async () => {
      const svc = makeService();
      await expect(
        svc.sendVerificationRequest(
          "hr@acme.com",
          "Jane",
          "ACME",
          "https://app.cliver.example/confirm",
          "http://app.cliver.example/deny",
        ),
      ).rejects.toThrow(EmailSendError);
    });
  });

  describe("SendGrid and SES produce equivalent behavior", () => {
    it("both transports return a messageId on success", async () => {
      // SES stub
      const sesStub = await createStubServer();
      sesStub.addRoute("POST", "/", () => ({
        status: 200,
        headers: { "Content-Type": "text/xml" },
        body: `<SendEmailResponse><SendEmailResult><MessageId>ses-equiv-1</MessageId></SendEmailResult></SendEmailResponse>`,
      }));

      const sgTransport = new SendGridTransport("key", stub.url);
      const sesTransport = new SESTransport({
        region: "us-east-1",
        accessKeyId: "AK",
        secretAccessKey: "SK",
        baseUrl: sesStub.url,
      });

      const sgService = new EmailService(sgTransport, "from@example.com");
      const sesService = new EmailService(sesTransport, "from@example.com");

      const msg: EmailMessage = {
        to: "user@example.com",
        from: "from@example.com",
        subject: "Equiv test",
        textBody: "body",
      };

      const sgResult = await sgService.send(msg);
      const sesResult = await sesService.send(msg);

      expect(typeof sgResult.messageId).toBe("string");
      expect(typeof sesResult.messageId).toBe("string");
      expect(sgResult.messageId.length).toBeGreaterThan(0);
      expect(sesResult.messageId.length).toBeGreaterThan(0);

      await sesStub.close();
    });

    it("both transports throw EmailSendError on failure", async () => {
      const sesStub = await createStubServer();
      sesStub.addRoute("POST", "/", () => ({ status: 500, body: "fail" }));

      // Override sendgrid to also fail
      const sgStub = await createStubServer();
      sgStub.addRoute("POST", "/v3/mail/send", () => ({ status: 500, body: "fail" }));

      const sgTransport = new SendGridTransport("key", sgStub.url);
      const sesTransport = new SESTransport({
        region: "us-east-1",
        accessKeyId: "AK",
        secretAccessKey: "SK",
        baseUrl: sesStub.url,
      });

      const msg: EmailMessage = {
        to: "user@example.com",
        from: "from@example.com",
        subject: "Fail test",
        textBody: "body",
      };

      await expect(sgTransport.send(msg)).rejects.toThrow(EmailSendError);
      await expect(sesTransport.send(msg)).rejects.toThrow(EmailSendError);

      await sesStub.close();
      await sgStub.close();
    });
  });
});
