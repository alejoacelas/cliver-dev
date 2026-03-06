import { describe, it, expect } from "vitest";
import {
  SalesforceCredentialsSchema,
  SalesforceRecordSchema,
  EmailMessageSchema,
  EmailTransportSchema,
} from "./integrations.js";

describe("SalesforceCredentials", () => {
  it("accepts valid credentials", () => {
    const creds = {
      instanceUrl: "https://myorg.salesforce.com",
      accessToken: "00D...",
      refreshToken: "5Aep...",
    };
    const parsed = SalesforceCredentialsSchema.parse(creds);
    expect(parsed.instanceUrl).toContain("salesforce");
  });

  it("rejects missing accessToken", () => {
    expect(() =>
      SalesforceCredentialsSchema.parse({
        instanceUrl: "https://x.salesforce.com",
        refreshToken: "abc",
      })
    ).toThrow();
  });
});

describe("SalesforceRecord", () => {
  it("accepts a valid screening record", () => {
    const record = {
      objectType: "Screening__c",
      externalId: "scr-123",
      fields: {
        Status__c: "PASS",
        FlagCount__c: 0,
        Summary__c: "All criteria passed",
        CustomerName__c: "Jane Doe",
        Institution__c: "MIT",
      },
    };
    const parsed = SalesforceRecordSchema.parse(record);
    expect(parsed.objectType).toBe("Screening__c");
    expect(parsed.fields.Status__c).toBe("PASS");
  });

  it("rejects missing objectType", () => {
    expect(() =>
      SalesforceRecordSchema.parse({ externalId: "x", fields: {} })
    ).toThrow();
  });
});

describe("EmailMessage", () => {
  it("accepts a valid email message", () => {
    const msg = {
      to: "customer@example.com",
      from: "verify@cliver.io",
      subject: "Verify your email",
      textBody: "Your code is 123456",
      htmlBody: "<p>Your code is <strong>123456</strong></p>",
    };
    const parsed = EmailMessageSchema.parse(msg);
    expect(parsed.to).toBe("customer@example.com");
  });

  it("accepts a message without htmlBody", () => {
    const msg = {
      to: "customer@example.com",
      from: "noreply@cliver.io",
      subject: "Test",
      textBody: "Hello",
    };
    expect(EmailMessageSchema.parse(msg).htmlBody).toBeUndefined();
  });

  it("rejects missing subject", () => {
    expect(() =>
      EmailMessageSchema.parse({
        to: "a@b.com",
        from: "c@d.com",
        textBody: "hello",
      })
    ).toThrow();
  });
});

describe("EmailTransport", () => {
  it("accepts sendgrid transport", () => {
    const transport = {
      provider: "sendgrid" as const,
      apiKey: "SG.xxx",
    };
    expect(EmailTransportSchema.parse(transport).provider).toBe("sendgrid");
  });

  it("accepts ses transport", () => {
    const transport = {
      provider: "ses" as const,
      region: "us-east-1",
      accessKeyId: "AKIA...",
      secretAccessKey: "wJal...",
    };
    const parsed = EmailTransportSchema.parse(transport);
    expect(parsed.provider).toBe("ses");
  });

  it("rejects unknown provider", () => {
    expect(() =>
      EmailTransportSchema.parse({ provider: "mailgun", apiKey: "xxx" })
    ).toThrow();
  });
});
