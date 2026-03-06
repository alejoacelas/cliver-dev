import type { EmailMessage, EmailTransport } from "@cliver/contracts";

/**
 * Interface for sending emails. Matches the shape expected
 * by the auth services.
 */
export interface IEmailSender {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Console-based email transport for testing and development.
 * Logs email content to stdout and stores sent emails for test assertions.
 */
export class ConsoleEmailTransport implements IEmailSender {
  public sentEmails: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sentEmails.push(message);
    console.log(
      `[EMAIL] To: ${message.to} | Subject: ${message.subject} | Body: ${message.textBody.slice(0, 100)}...`,
    );
  }
}

/**
 * SendGrid email transport. Uses the SendGrid v3 API.
 * Requires a valid API key.
 */
export class SendGridEmailTransport implements IEmailSender {
  private apiKey: string;
  private fetchFn: typeof fetch;

  constructor(config: { apiKey: string }, fetchFn: typeof fetch = fetch) {
    this.apiKey = config.apiKey;
    this.fetchFn = fetchFn;
  }

  async send(message: EmailMessage): Promise<void> {
    const response = await this.fetchFn("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: message.to }] }],
        from: { email: message.from },
        subject: message.subject,
        content: [
          { type: "text/plain", value: message.textBody },
          ...(message.htmlBody
            ? [{ type: "text/html", value: message.htmlBody }]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SendGrid API error ${response.status}: ${body}`);
    }
  }
}
