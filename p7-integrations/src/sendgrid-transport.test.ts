import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { SendGridTransport } from "./sendgrid-transport.js";
import { EmailSendError } from "./types.js";
import { createStubServer, type StubServer } from "./test-helpers.js";

describe("SendGridTransport", () => {
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

  function makeTransport(): SendGridTransport {
    return new SendGridTransport("sg-test-api-key", stub.url);
  }

  const validMessage = {
    to: "recipient@example.com",
    from: "sender@example.com",
    subject: "Test",
    textBody: "Hello",
  };

  it("sends email and returns message ID from header", async () => {
    stub.addRoute("POST", "/v3/mail/send", (_req, _body) => ({
      status: 202,
      headers: { "X-Message-Id": "sg-msg-12345" },
      body: "",
    }));

    const transport = makeTransport();
    const result = await transport.send(validMessage);

    expect(result.messageId).toBe("sg-msg-12345");
  });

  it("sends correct request format to SendGrid API", async () => {
    stub.addRoute("POST", "/v3/mail/send", (_req, _body) => ({
      status: 202,
      headers: { "X-Message-Id": "sg-msg-format" },
      body: "",
    }));

    const transport = makeTransport();
    await transport.send({
      ...validMessage,
      htmlBody: "<p>Hello</p>",
    });

    expect(stub.requests.length).toBe(1);
    const req = stub.requests[0];
    expect(req.method).toBe("POST");
    expect(req.path).toBe("/v3/mail/send");
    expect(req.headers["authorization"]).toBe("Bearer sg-test-api-key");
    expect(req.headers["content-type"]).toBe("application/json");

    const parsed = JSON.parse(req.body);
    expect(parsed.personalizations[0].to[0].email).toBe("recipient@example.com");
    expect(parsed.from.email).toBe("sender@example.com");
    expect(parsed.subject).toBe("Test");
    expect(parsed.content).toHaveLength(2);
    expect(parsed.content[0]).toEqual({ type: "text/plain", value: "Hello" });
    expect(parsed.content[1]).toEqual({ type: "text/html", value: "<p>Hello</p>" });
  });

  it("throws INVALID_EMAIL for malformed recipient", async () => {
    const transport = makeTransport();
    await expect(
      transport.send({ ...validMessage, to: "not-an-email" }),
    ).rejects.toThrow(EmailSendError);

    try {
      await transport.send({ ...validMessage, to: "not-an-email" });
    } catch (err) {
      expect(err).toBeInstanceOf(EmailSendError);
      expect((err as EmailSendError).code).toBe("INVALID_EMAIL");
    }
  });

  it("throws INVALID_EMAIL for malformed sender", async () => {
    const transport = makeTransport();
    await expect(
      transport.send({ ...validMessage, from: "bad" }),
    ).rejects.toThrow(EmailSendError);
  });

  it("throws RATE_LIMIT on 429", async () => {
    stub.addRoute("POST", "/v3/mail/send", () => ({
      status: 429,
      body: "rate limited",
    }));

    const transport = makeTransport();
    try {
      await transport.send(validMessage);
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EmailSendError);
      expect((err as EmailSendError).code).toBe("RATE_LIMIT");
      expect((err as EmailSendError).statusCode).toBe(429);
    }
  });

  it("throws PROVIDER_ERROR on non-2xx non-429", async () => {
    stub.addRoute("POST", "/v3/mail/send", () => ({
      status: 500,
      body: "internal error",
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
    const transport = new SendGridTransport("key", "http://127.0.0.1:1");
    try {
      await transport.send(validMessage);
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EmailSendError);
      expect((err as EmailSendError).code).toBe("NETWORK_ERROR");
    }
  });
});
