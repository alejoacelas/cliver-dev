// P4: Auth + Sessions
// NIST SP 800-63B-4 compliant authentication for the Cliver screening platform.

export { PasswordService } from "./password-service.js";
export type { StrengthResult, BlocklistResult } from "./password-service.js";

export { SessionService } from "./session-service.js";

export { CustomerAuthService } from "./customer-auth-service.js";

export { ProviderAuthService } from "./provider-auth-service.js";

export { EmailVerificationService } from "./email-verification-service.js";

export { requireAuth, requireProvider } from "./auth-middleware.js";

export { ConsoleEmailTransport, SendGridEmailTransport } from "./email-transport.js";
export type { IEmailSender } from "./email-transport.js";

export { InMemoryTokenStore } from "./in-memory-token-store.js";
export { InMemoryUserStore } from "./in-memory-user-store.js";
