import { createHmac } from "node:crypto";
import type { EmailMessage } from "@cliver/contracts";
import type { IEmailTransport } from "./types.js";
import { EmailSendError } from "./types.js";
import { isValidEmail } from "./email-validation.js";

/**
 * Sends email via the AWS SES SendEmail API (Query/HTTPS interface).
 *
 * Endpoint: POST https://email.<region>.amazonaws.com/
 * Auth: AWS Signature Version 4
 *
 * For this prototype we use a simplified signing approach
 * that's correct in structure but not production-hardened.
 */
export class SESTransport implements IEmailTransport {
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly baseUrl: string;

  constructor(config: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    baseUrl?: string;
  }) {
    this.region = config.region;
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    // Allow overriding for test stub server.
    this.baseUrl = config.baseUrl ?? `https://email.${config.region}.amazonaws.com`;
  }

  async send(message: EmailMessage): Promise<{ messageId: string }> {
    if (!isValidEmail(message.to)) {
      throw new EmailSendError("INVALID_EMAIL", `Invalid recipient email: ${message.to}`);
    }
    if (!isValidEmail(message.from)) {
      throw new EmailSendError("INVALID_EMAIL", `Invalid sender email: ${message.from}`);
    }

    // Build the SES SendEmail request as form-encoded parameters.
    const params = new URLSearchParams();
    params.set("Action", "SendEmail");
    params.set("Source", message.from);
    params.set("Destination.ToAddresses.member.1", message.to);
    params.set("Message.Subject.Data", message.subject);
    params.set("Message.Body.Text.Data", message.textBody);
    if (message.htmlBody) {
      params.set("Message.Body.Html.Data", message.htmlBody);
    }

    const requestBody = params.toString();

    // Simplified SigV4-style signing. Production should use @aws-sdk/client-ses
    // for full AWS Signature Version 4. We never send the raw secret key in any
    // header—instead we derive a signature from it.
    const date = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const dateStamp = date.slice(0, 8);
    const credential = `${this.accessKeyId}/${dateStamp}/${this.region}/ses/aws4_request`;
    const signature = createHmac("sha256", this.secretAccessKey)
      .update(requestBody)
      .digest("hex");
    const authHeader = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=content-type;host, Signature=${signature}`;

    let response: Response;
    try {
      response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: authHeader,
          "X-Amz-Date": date,
        },
        body: requestBody,
      });
    } catch (err) {
      throw new EmailSendError(
        "NETWORK_ERROR",
        `Network error sending via SES: ${(err as Error).message}`,
      );
    }

    if (response.status === 429) {
      throw new EmailSendError("RATE_LIMIT", "SES rate limit exceeded (throttling)", 429);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new EmailSendError(
        "PROVIDER_ERROR",
        `SES API error ${response.status}: ${text}`,
        response.status,
      );
    }

    // SES returns XML with a MessageId element.
    const text = await response.text();
    const match = text.match(/<MessageId>([^<]+)<\/MessageId>/);
    const messageId = match?.[1] ?? crypto.randomUUID();
    return { messageId };
  }
}
