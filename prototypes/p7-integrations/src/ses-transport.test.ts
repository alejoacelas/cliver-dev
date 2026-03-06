import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { SESTransport } from "./ses-transport.js";
import { EmailSendError } from "./types.js";
import { createStubServer, type StubServer } from "./test-helpers.js";

describe("SESTransport", () => {
  let stub: StubServer;

  beforeAll(async () => {
    stub = await createStubServer();
  });

  afterAll(async () => {
    await stub.close();
  });

  beforeEach(() => {
    stub.requests.length = 0;
    stub.clearRoutes();
  });

  function makeTransport(): SESTransport {
    return new SESTransport({
      region: "us-east-1",
      accessKeyId: "AKIATEST123",
      secretAccessKey: "secret-test-key",
      baseUrl: stub.url,
    });
  }

  const validMessage = {
    to: "recipient@example.com",
    from: "sender@example.com",
    subject: "Test",
    textBody: "Hello from SES",
  };

  it("sends email and extracts message ID from XML response", async () => {
    stub.addRoute("POST", "/", (_req, _body) => ({
      status: 200,
      headers: { "Content-Type": "text/xml" },
      body: `<SendEmailResponse>
        <SendEmailResult>
          <MessageId>ses-msg-abc123</MessageId>
        </SendEmailResult>
      </SendEmailResponse>`,
    }));

    const transport = makeTransport();
    const result = await transport.send(validMessage);
    expect(result.messageId).toBe("ses-msg-abc123");
  });

  it("sends correct SES request format", async () => {
    stub.addRoute("POST", "/", () => ({
      status: 200,
      headers: { "Content-Type": "text/xml" },
      body: `<SendEmailResponse><SendEmailResult><MessageId>ses-fmt</MessageId></SendEmailResult></SendEmailResponse>`,
    }));

    const transport = makeTransport();
    await transport.send({
      ...validMessage,
      htmlBody: "<p>Hello</p>",
    });

    expect(stub.requests.length).toBe(1);
    const req = stub.requests[0];
    expect(req.method).toBe("POST");
    expect(req.headers["content-type"]).toBe("application/x-www-form-urlencoded");
    // Secret key must NOT appear in any header (Finding #5)
    const allHeaders = JSON.stringify(req.headers);
    expect(allHeaders).not.toContain("secret-test-key");
    // Should use AWS4-HMAC-SHA256 Authorization header
    const authHeader = req.headers["authorization"] as string;
    expect(authHeader).toMatch(/^AWS4-HMAC-SHA256 Credential=AKIATEST123\//);
    expect(authHeader).toContain("us-east-1/ses/aws4_request");
    expect(authHeader).toContain("Signature=");
    expect(req.headers["x-amz-date"]).toBeTruthy();

    const params = new URLSearchParams(req.body);
    expect(params.get("Action")).toBe("SendEmail");
    expect(params.get("Source")).toBe("sender@example.com");
    expect(params.get("Destination.ToAddresses.member.1")).toBe("recipient@example.com");
    expect(params.get("Message.Subject.Data")).toBe("Test");
    expect(params.get("Message.Body.Text.Data")).toBe("Hello from SES");
    expect(params.get("Message.Body.Html.Data")).toBe("<p>Hello</p>");
  });

  it("throws INVALID_EMAIL for malformed recipient", async () => {
    const transport = makeTransport();
    try {
      await transport.send({ ...validMessage, to: "bad" });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EmailSendError);
      expect((err as EmailSendError).code).toBe("INVALID_EMAIL");
    }
  });

  it("throws RATE_LIMIT on 429", async () => {
    stub.addRoute("POST", "/", () => ({
      status: 429,
      body: "Throttling",
    }));

    const transport = makeTransport();
    try {
      await transport.send(validMessage);
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EmailSendError);
      expect((err as EmailSendError).code).toBe("RATE_LIMIT");
    }
  });

  it("throws PROVIDER_ERROR on 500", async () => {
    stub.addRoute("POST", "/", () => ({
      status: 500,
      body: "Internal Service Error",
    }));

    const transport = makeTransport();
    try {
      await transport.send(validMessage);
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EmailSendError);
      expect((err as EmailSendError).code).toBe("PROVIDER_ERROR");
      expect((err as EmailSendError).statusCode).toBe(500);
    }
  });

  it("throws NETWORK_ERROR when server is unreachable", async () => {
    const transport = new SESTransport({
      region: "us-east-1",
      accessKeyId: "AK",
      secretAccessKey: "SK",
      baseUrl: "http://127.0.0.1:1",
    });
    try {
      await transport.send(validMessage);
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EmailSendError);
      expect((err as EmailSendError).code).toBe("NETWORK_ERROR");
    }
  });
});
