// ============================================================
// @cliver/p7-integrations — Salesforce + Email delivery
//
// Exports:
// - SalesforceAdapter: OAuth + record push + contact lookup
// - EmailService: high-level email composition + sending
// - SendGridTransport: IEmailTransport via SendGrid v3 API
// - SESTransport: IEmailTransport via AWS SES
// - Types: IEmailTransport, typed errors, session/meta types
// ============================================================

export { SalesforceAdapter, type OAuthClientCredentials } from "./salesforce-adapter.js";
export { EmailService } from "./email-service.js";
export { SendGridTransport } from "./sendgrid-transport.js";
export { SESTransport } from "./ses-transport.js";
export { isValidEmail } from "./email-validation.js";

export type {
  IEmailTransport,
  SalesforceSession,
  ScreeningResultMeta,
  EmailErrorCode,
  SalesforceErrorCode,
} from "./types.js";

export { EmailSendError, SalesforceApiError } from "./types.js";
