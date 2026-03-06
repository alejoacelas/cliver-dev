/**
 * Contract check: verifies that P7's exports satisfy the interfaces
 * defined in P0 contracts. This file must compile with:
 *
 *   npx tsc --noEmit --project tsconfig.json
 *
 * It is never executed — it only needs to type-check.
 */

import type {
  SalesforceCredentials,
  SalesforceRecord,
  EmailMessage,
  EmailTransport,
  Decision,
} from "@cliver/contracts";

import type { SalesforceAdapter } from "./src/salesforce-adapter.js";
import type { EmailService } from "./src/email-service.js";
import type { SendGridTransport } from "./src/sendgrid-transport.js";
import type { SESTransport } from "./src/ses-transport.js";
import type {
  IEmailTransport,
  SalesforceSession,
  ScreeningResultMeta,
} from "./src/types.js";
import { EmailSendError, SalesforceApiError } from "./src/types.js";

// --- SalesforceAdapter contract ---

type AssertSalesforceAdapter = {
  authenticate(credentials: SalesforceCredentials): Promise<SalesforceSession>;
  pushResult(
    session: SalesforceSession,
    decision: Decision,
    meta: ScreeningResultMeta,
  ): Promise<{ recordId: string }>;
  findContact(session: SalesforceSession, email: string): Promise<string | null>;
  refreshSession(session: SalesforceSession): Promise<SalesforceSession>;
};

const _sfCheck: AssertSalesforceAdapter = {} as SalesforceAdapter;

// --- EmailService contract ---

type AssertEmailService = {
  send(message: EmailMessage): Promise<{ messageId: string }>;
  sendConfirmationCode(to: string, code: string): Promise<{ messageId: string }>;
  sendVerificationRequest(
    to: string,
    customerName: string,
    institution: string,
    confirmUrl: string,
    denyUrl: string,
  ): Promise<{ messageId: string }>;
  sendNotification(
    to: string,
    subject: string,
    body: string,
  ): Promise<{ messageId: string }>;
};

const _emailSvcCheck: AssertEmailService = {} as EmailService;

// --- SendGridTransport implements IEmailTransport ---

const _sgCheck: IEmailTransport = {} as SendGridTransport;

// --- SESTransport implements IEmailTransport ---

const _sesCheck: IEmailTransport = {} as SESTransport;

// --- IEmailTransport.send accepts EmailMessage and returns messageId ---

type AssertTransportSend = {
  send(message: EmailMessage): Promise<{ messageId: string }>;
};

const _transportSendCheck: AssertTransportSend = {} as IEmailTransport;

// --- EmailTransport config is usable as constructor input ---
// (Verify the P0 config type is compatible with our constructors)

function _verifyConfigTypes(config: EmailTransport): IEmailTransport {
  if (config.provider === "sendgrid") {
    return {} as SendGridTransport;
  } else {
    return {} as SESTransport;
  }
}

// --- Error types are proper Error subclasses ---

const _emailErr: Error = new EmailSendError("RATE_LIMIT", "test");
const _sfErr: Error = new SalesforceApiError("SESSION_EXPIRED", "test", 401);

// Suppress unused variable warnings
void _sfCheck;
void _emailSvcCheck;
void _sgCheck;
void _sesCheck;
void _transportSendCheck;
void _verifyConfigTypes;
void _emailErr;
void _sfErr;
