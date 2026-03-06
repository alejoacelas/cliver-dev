import { z } from "zod";

// --- Salesforce ---

/**
 * OAuth credentials for the Salesforce REST API.
 * Obtained through the OAuth 2.0 authorization code flow.
 */
export const SalesforceCredentialsSchema = z.object({
  /** The Salesforce instance URL (e.g., "https://myorg.salesforce.com"). */
  instanceUrl: z.string(),
  /** OAuth access token for API requests. */
  accessToken: z.string(),
  /** OAuth refresh token for obtaining new access tokens. */
  refreshToken: z.string(),
});

export type SalesforceCredentials = z.infer<typeof SalesforceCredentialsSchema>;

/**
 * A record to create or update in Salesforce.
 * The fields map contains Salesforce field API names to values.
 */
export const SalesforceRecordSchema = z.object({
  /** The Salesforce object API name (e.g., "Screening__c"). */
  objectType: z.string(),
  /** An external ID for upsert operations (e.g., the screening ID). */
  externalId: z.string().optional(),
  /** Field name to value mapping. Keys are Salesforce field API names. */
  fields: z.record(z.string(), z.unknown()),
});

export type SalesforceRecord = z.infer<typeof SalesforceRecordSchema>;

// --- Email ---

/**
 * A transactional email message. Used for confirmation codes,
 * verification requests, and screening notifications.
 */
export const EmailMessageSchema = z.object({
  /** Recipient email address. */
  to: z.string(),
  /** Sender email address. */
  from: z.string(),
  /** Email subject line. */
  subject: z.string(),
  /** Plain text body (required for accessibility and spam compliance). */
  textBody: z.string(),
  /** HTML body (optional). */
  htmlBody: z.string().optional(),
});

export type EmailMessage = z.infer<typeof EmailMessageSchema>;

/**
 * Configuration for the email transport layer.
 * Supports SendGrid and AWS SES.
 */
export const EmailTransportSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("sendgrid"),
    apiKey: z.string(),
  }),
  z.object({
    provider: z.literal("ses"),
    region: z.string(),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
  }),
]);

export type EmailTransport = z.infer<typeof EmailTransportSchema>;
