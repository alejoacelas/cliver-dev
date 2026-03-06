import type { EmailMessage } from "@cliver/contracts";
import type { IEmailTransport } from "./types.js";
import { EmailSendError } from "./types.js";
import { isValidEmail } from "./email-validation.js";

/**
 * Sends email via the SendGrid v3 API.
 *
 * Endpoint: POST https://api.sendgrid.com/v3/mail/send
 * Auth: Bearer token (API key)
 */
export class SendGridTransport implements IEmailTransport {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    // Allow overriding baseUrl for testing against a stub server.
    this.baseUrl = baseUrl ?? "https://api.sendgrid.com";
  }

  async send(message: EmailMessage): Promise<{ messageId: string }> {
    if (!isValidEmail(message.to)) {
      throw new EmailSendError("INVALID_EMAIL", `Invalid recipient email: ${message.to}`);
    }
    if (!isValidEmail(message.from)) {
      throw new EmailSendError("INVALID_EMAIL", `Invalid sender email: ${message.from}`);
    }

    const content: Array<{ type: string; value: string }> = [
      { type: "text/plain", value: message.textBody },
    ];
    if (message.htmlBody) {
      content.push({ type: "text/html", value: message.htmlBody });
    }

    const body = {
      personalizations: [{ to: [{ email: message.to }] }],
      from: { email: message.from },
      subject: message.subject,
      content,
    };

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/v3/mail/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new EmailSendError(
        "NETWORK_ERROR",
        `Network error sending via SendGrid: ${(err as Error).message}`,
      );
    }

    if (response.status === 429) {
      throw new EmailSendError("RATE_LIMIT", "SendGrid rate limit exceeded", 429);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new EmailSendError(
        "PROVIDER_ERROR",
        `SendGrid API error ${response.status}: ${text}`,
        response.status,
      );
    }

    // SendGrid returns the message ID in the X-Message-Id header.
    const messageId = response.headers.get("X-Message-Id") ?? crypto.randomUUID();
    return { messageId };
  }
}
