/**
 * Contract check: verifies that P4's exports satisfy the interfaces
 * defined in P0 contracts. This file must compile with:
 *
 *   npx tsc --noEmit --project tsconfig.json
 *
 * It is never executed — it only needs to type-check.
 */

import type {
  AAL,
  UserRole,
  TokenPayload,
  Session,
  ProviderCredentials,
  PasswordRequirements,
  ITokenStore,
  EmailMessage,
  EmailTransport,
} from "@cliver/contracts";

import type { PasswordService } from "./src/password-service.js";
import type { SessionService } from "./src/session-service.js";
import type { CustomerAuthService } from "./src/customer-auth-service.js";
import type { ProviderAuthService } from "./src/provider-auth-service.js";
import type { EmailVerificationService } from "./src/email-verification-service.js";
import type { IEmailSender } from "./src/email-transport.js";
import type { InMemoryTokenStore } from "./src/in-memory-token-store.js";

// --- PasswordService contract ---

type AssertPasswordService = {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
  checkBlocklist(password: string): Promise<{ breached: boolean; count?: number; error?: string }>;
  validateStrength(password: string, aal: AAL): { valid: boolean; reason?: string };
};

const _passwordCheck: AssertPasswordService = {} as PasswordService;

// --- SessionService contract ---

type AssertSessionService = {
  createSession(userId: string, aal: AAL): Promise<Session>;
  validateSession(sessionId: string): Promise<Session | null>;
  destroySession(sessionId: string): Promise<void>;
  enforceTimeouts(session: Session): Promise<Session | null>;
};

const _sessionCheck: AssertSessionService = {} as SessionService;

// --- CustomerAuthService contract ---

type AssertCustomerAuthService = {
  register(email: string, password: string): Promise<{ success: boolean; error?: string; userId?: string }>;
  login(email: string, password: string): Promise<{ success: boolean; error?: string; session?: Session }>;
  confirmEmail(email: string, code: string): Promise<{ success: boolean; error?: string }>;
};

const _customerAuthCheck: AssertCustomerAuthService = {} as CustomerAuthService;

// --- ProviderAuthService contract ---

type AssertProviderAuthService = {
  login(email: string, password: string, secondFactor: string): Promise<{ success: boolean; error?: string; session?: Session }>;
  enrollTOTP(userId: string): Promise<{ secret: string; uri: string; qrCodeDataUrl: string }>;
  verifyTOTP(userId: string, code: string): Promise<boolean>;
};

const _providerAuthCheck: AssertProviderAuthService = {} as ProviderAuthService;

// --- EmailVerificationService contract ---

type AssertEmailVerificationService = {
  requestVerification(contactEmail: string, customerName: string, institution: string): Promise<{ verificationId: string; token: string }>;
  checkStatus(verificationId: string): Promise<{ status: string }>;
  handleResponse(token: string, decision: "confirmed" | "denied"): Promise<void>;
};

const _emailVerificationCheck: AssertEmailVerificationService = {} as EmailVerificationService;

// --- InMemoryTokenStore implements ITokenStore ---

const _tokenStoreCheck: ITokenStore = {} as InMemoryTokenStore;

// --- IEmailSender can send EmailMessage ---

type AssertEmailSender = {
  send(message: EmailMessage): Promise<void>;
};

const _emailSenderCheck: AssertEmailSender = {} as IEmailSender;

// --- Auth middleware signatures ---

import type { requireAuth, requireProvider } from "./src/auth-middleware.js";

type AssertRequireAuth = (sessionService: SessionService) => (
  req: any,
  res: any,
  next: () => void,
) => Promise<void>;

type AssertRequireProvider = (sessionService: SessionService, store: ITokenStore) => (
  req: any,
  res: any,
  next: () => void,
) => Promise<void>;

const _requireAuthCheck: AssertRequireAuth = {} as typeof requireAuth;
const _requireProviderCheck: AssertRequireProvider = {} as typeof requireProvider;

// Suppress unused variable warnings
void _passwordCheck;
void _sessionCheck;
void _customerAuthCheck;
void _providerAuthCheck;
void _emailVerificationCheck;
void _tokenStoreCheck;
void _emailSenderCheck;
void _requireAuthCheck;
void _requireProviderCheck;
