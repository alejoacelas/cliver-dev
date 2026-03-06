import type { EmailMessage } from "@cliver/contracts";
import type { IEmailTransport } from "./types.js";
import { EmailSendError } from "./types.js";
import { isValidEmail } from "./email-validation.js";

/**
 * Escape HTML special characters to prevent injection.
 * Applied to all user-supplied values interpolated into htmlBody strings.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * High-level email service that composes specific email types
 * (confirmation codes, verification requests, notifications)
 * and delegates delivery to an IEmailTransport.
 */
export class EmailService {
  constructor(
    private readonly transport: IEmailTransport,
    private readonly defaultFrom: string,
  ) {}

  /**
   * Send a raw email message through the configured transport.
   * Pre-validates the email format before delegating.
   */
  async send(message: EmailMessage): Promise<{ messageId: string }> {
    if (!isValidEmail(message.to)) {
      throw new EmailSendError("INVALID_EMAIL", `Invalid recipient email: ${message.to}`);
    }
    if (!isValidEmail(message.from)) {
      throw new EmailSendError("INVALID_EMAIL", `Invalid sender email: ${message.from}`);
    }
    return this.transport.send(message);
  }

  /**
   * Compose and send a confirmation code email.
   * Used during customer authentication to verify email ownership.
   */
  async sendConfirmationCode(
    to: string,
    code: string,
  ): Promise<{ messageId: string }> {
    const message: EmailMessage = {
      to,
      from: this.defaultFrom,
      subject: "Your Cliver confirmation code",
      textBody: `Your confirmation code is: ${code}\n\nThis code expires in 10 minutes. If you did not request this code, please ignore this email.`,
      htmlBody: `<p>Your confirmation code is: <strong>${escapeHtml(code)}</strong></p><p>This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>`,
    };
    return this.send(message);
  }

  /**
   * Compose and send a verification request email.
   * Sent to a third party (e.g., an employer or institution)
   * asking them to confirm or deny a claim about the customer.
   */
  async sendVerificationRequest(
    to: string,
    customerName: string,
    institution: string,
    confirmUrl: string,
    denyUrl: string,
  ): Promise<{ messageId: string }> {
    // Validate that URLs use https:// to prevent javascript: or data: injection in href attributes.
    if (!confirmUrl.startsWith("https://")) {
      throw new EmailSendError("INVALID_EMAIL", `Invalid confirm URL: must start with https://`);
    }
    if (!denyUrl.startsWith("https://")) {
      throw new EmailSendError("INVALID_EMAIL", `Invalid deny URL: must start with https://`);
    }

    const safeCustomerName = escapeHtml(customerName);
    const safeInstitution = escapeHtml(institution);
    const safeConfirmUrl = escapeHtml(confirmUrl);
    const safeDenyUrl = escapeHtml(denyUrl);

    const message: EmailMessage = {
      to,
      from: this.defaultFrom,
      subject: `Verification request for ${customerName}`,
      textBody: [
        `We are conducting a background screening for ${customerName}, who has claimed an affiliation with ${institution}.`,
        "",
        `Please confirm or deny this claim:`,
        `Confirm: ${confirmUrl}`,
        `Deny: ${denyUrl}`,
        "",
        "If you did not expect this email, please ignore it.",
      ].join("\n"),
      htmlBody: [
        `<p>We are conducting a background screening for <strong>${safeCustomerName}</strong>, who has claimed an affiliation with <strong>${safeInstitution}</strong>.</p>`,
        `<p>Please confirm or deny this claim:</p>`,
        `<p><a href="${safeConfirmUrl}">Confirm</a> | <a href="${safeDenyUrl}">Deny</a></p>`,
        `<p>If you did not expect this email, please ignore it.</p>`,
      ].join("\n"),
    };
    return this.send(message);
  }

  /**
   * Compose and send a screening notification email.
   * Informs the customer that their screening is complete.
   */
  async sendNotification(
    to: string,
    subject: string,
    body: string,
  ): Promise<{ messageId: string }> {
    const message: EmailMessage = {
      to,
      from: this.defaultFrom,
      subject,
      textBody: body,
    };
    return this.send(message);
  }
}
