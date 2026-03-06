import type { EmailMessage } from "@cliver/contracts";

// ============================================================
// P7-local interfaces and types.
//
// IEmailTransport is the behavioral interface for email sending.
// P0's EmailTransport is the *config* shape; this is the
// *capability* shape that SendGrid and SES transports implement.
// ============================================================

/**
 * Behavioral interface for sending email. Each transport
 * (SendGrid, SES) implements this with provider-specific HTTP calls.
 */
export interface IEmailTransport {
  send(message: EmailMessage): Promise<{ messageId: string }>;
}

/**
 * Metadata about a screening result, passed alongside a Decision
 * when pushing results to Salesforce.
 */
export interface ScreeningResultMeta {
  screeningId: string;
  customerEmail: string;
  evidenceCount: number;
  checkCount: number;
  timestamp: string;
}

/**
 * An active Salesforce session returned by authenticate().
 * Contains everything needed to make API calls and refresh
 * when the access token expires.
 */
export interface SalesforceSession {
  instanceUrl: string;
  accessToken: string;
  refreshToken: string;
  /** ISO 8601 timestamp when this session was created/last refreshed. */
  issuedAt: string;
}

// --- Typed errors ---

export type EmailErrorCode =
  | "RATE_LIMIT"
  | "INVALID_EMAIL"
  | "NETWORK_ERROR"
  | "PROVIDER_ERROR";

export class EmailSendError extends Error {
  constructor(
    public readonly code: EmailErrorCode,
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "EmailSendError";
  }
}

export type SalesforceErrorCode =
  | "INVALID_CREDENTIALS"
  | "SESSION_EXPIRED"
  | "RATE_LIMIT"
  | "FIELD_VALIDATION"
  | "NOT_FOUND"
  | "API_ERROR";

export class SalesforceApiError extends Error {
  constructor(
    public readonly code: SalesforceErrorCode,
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "SalesforceApiError";
  }
}
