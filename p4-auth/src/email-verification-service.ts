import { randomBytes } from "node:crypto";
import type { ITokenStore } from "@cliver/contracts";
import type { IEmailSender } from "./email-transport.js";

const VERIFICATION_PREFIX = "email-verification:";
const TOKEN_PREFIX = "verification-token:";

type VerificationStatus = "pending" | "confirmed" | "denied";

interface VerificationRecord {
  verificationId: string;
  token: string;
  contactEmail: string;
  customerName: string;
  institution: string;
  status: VerificationStatus;
  createdAt: string;
}

/**
 * Third-party email verification service.
 *
 * Used to verify a customer's institutional affiliation by sending
 * an email to a contact at the institution and letting them confirm
 * or deny the customer's identity.
 *
 * This is NOT authentication — it's identity verification. Email-based
 * verification is permitted by SP 800-63B-4 Sec. 3.1.3.1 for this purpose.
 */
export class EmailVerificationService {
  constructor(
    private tokenStore: ITokenStore,
    private emailSender: IEmailSender,
  ) {}

  /**
   * Send a verification request to an institutional contact.
   * Returns a verification ID for status tracking and a token
   * (also embedded in the email) for the contact to respond.
   */
  async requestVerification(
    contactEmail: string,
    customerName: string,
    institution: string,
  ): Promise<{ verificationId: string; token: string }> {
    const verificationId = randomBytes(16).toString("hex");
    const token = randomBytes(32).toString("hex");

    const record: VerificationRecord = {
      verificationId,
      token,
      contactEmail,
      customerName,
      institution,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Store the verification record (keyed by verificationId)
    await this.tokenStore.set(
      `${VERIFICATION_PREFIX}${verificationId}`,
      JSON.stringify(record),
    );

    // Store a reverse mapping from token -> verificationId
    await this.tokenStore.set(`${TOKEN_PREFIX}${token}`, verificationId);

    // Send the verification email
    await this.emailSender.send({
      to: contactEmail,
      from: "verification@cliver.dev",
      subject: `Email verification request for ${customerName}`,
      textBody: [
        `Hello,`,
        ``,
        `We are writing to verify the identity of ${customerName}, who claims an affiliation with ${institution}.`,
        ``,
        `Please respond to this verification request using the token below:`,
        ``,
        `Verification token: ${token}`,
        ``,
        `You can confirm or deny this person's identity by visiting:`,
        `https://cliver.dev/verify?token=${token}&decision=confirmed`,
        `https://cliver.dev/verify?token=${token}&decision=denied`,
        ``,
        `Thank you.`,
      ].join("\n"),
    });

    return { verificationId, token };
  }

  /**
   * Check the status of a verification request.
   */
  async checkStatus(
    verificationId: string,
  ): Promise<{ status: VerificationStatus }> {
    const data = await this.tokenStore.get(
      `${VERIFICATION_PREFIX}${verificationId}`,
    );
    if (!data) {
      throw new Error("Verification not found");
    }

    const record: VerificationRecord = JSON.parse(data);
    return { status: record.status };
  }

  /**
   * Handle a response from the institutional contact.
   * The token was sent in the verification email.
   *
   * Rejects invalid tokens and double responses.
   */
  async handleResponse(
    token: string,
    decision: "confirmed" | "denied",
  ): Promise<void> {
    // Look up the verification ID from the token
    const verificationId = await this.tokenStore.get(`${TOKEN_PREFIX}${token}`);
    if (!verificationId) {
      throw new Error("Invalid or not found verification token");
    }

    // Get the verification record
    const data = await this.tokenStore.get(
      `${VERIFICATION_PREFIX}${verificationId}`,
    );
    if (!data) {
      throw new Error("Verification record not found");
    }

    const record: VerificationRecord = JSON.parse(data);

    // Reject double responses
    if (record.status !== "pending") {
      throw new Error("This verification has already been responded to");
    }

    // Update the record
    record.status = decision;
    await this.tokenStore.set(
      `${VERIFICATION_PREFIX}${verificationId}`,
      JSON.stringify(record),
    );

    // Note: we keep the token mapping alive so that duplicate submissions
    // get "already responded" instead of "token not found". The status
    // check above prevents the decision from being changed.
  }
}
