import { randomInt, timingSafeEqual } from "node:crypto";
import type { Session } from "@cliver/contracts";
import type { ITokenStore } from "@cliver/contracts";
import type { PasswordService } from "./password-service.js";
import type { SessionService } from "./session-service.js";
import type { InMemoryUserStore } from "./in-memory-user-store.js";
import type { IEmailSender } from "./email-transport.js";

const CONFIRMATION_CODE_PREFIX = "email-confirm:";
const CONFIRMATION_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const MAX_FAILED_ATTEMPTS = 100; // SP 800-63B-4 Sec. 3.2.2

interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
  session?: Session;
}

/**
 * Customer authentication service (AAL1).
 *
 * Handles registration with email + password, email confirmation via
 * 6-digit code, and login. Enforces rate limiting per SP 800-63B-4.
 */
export class CustomerAuthService {
  constructor(
    private passwordService: PasswordService,
    private sessionService: SessionService,
    private userStore: InMemoryUserStore,
    private tokenStore: ITokenStore,
    private emailSender: IEmailSender,
  ) {}

  /**
   * Register a new customer account.
   *
   * 1. Validates password strength (min 15 chars for AAL1)
   * 2. Checks password against breached-password blocklist
   * 3. Creates user record with hashed password
   * 4. Sends 6-digit confirmation code to email
   */
  async register(email: string, password: string): Promise<AuthResult> {
    // Validate password strength for AAL1
    const strength = this.passwordService.validateStrength(password, "AAL1");
    if (!strength.valid) {
      return { success: false, error: strength.reason };
    }

    // Check breached-password blocklist
    const blocklist = await this.passwordService.checkBlocklist(password);
    if (blocklist.breached) {
      return {
        success: false,
        error: "This password has been compromised in a data breach. Please choose a different password.",
      };
    }

    // Check for duplicate email
    const existing = await this.userStore.getUserByEmail(email);
    if (existing) {
      return { success: false, error: "An account with this email already exists" };
    }

    // Hash password and create user
    const passwordHash = await this.passwordService.hash(password);
    const userId = await this.userStore.createUser({
      email,
      passwordHash,
      role: "customer",
    });

    // Generate and store confirmation code
    const code = this.generateConfirmationCode();
    await this.tokenStore.set(
      `${CONFIRMATION_CODE_PREFIX}${email}`,
      code,
      CONFIRMATION_TTL_SECONDS,
    );

    // Send confirmation email
    await this.emailSender.send({
      to: email,
      from: "noreply@cliver.bio",
      subject: "Confirm your email address",
      textBody: `Your confirmation code is: ${code}\n\nThis code expires in 24 hours.`,
    });

    return { success: true, userId };
  }

  /**
   * Confirm a customer's email address using the 6-digit code.
   */
  async confirmEmail(email: string, code: string): Promise<AuthResult> {
    const storedCode = await this.tokenStore.get(
      `${CONFIRMATION_CODE_PREFIX}${email}`,
    );

    if (storedCode === null) {
      return { success: false, error: "Confirmation code has expired or was not found" };
    }

    // Constant-time comparison to prevent timing attacks on the 6-digit code
    const codeBuf = Buffer.from(code);
    const storedBuf = Buffer.from(storedCode);
    if (codeBuf.length !== storedBuf.length || !timingSafeEqual(codeBuf, storedBuf)) {
      // Track failed attempts for rate limiting (finding #4)
      const attemptKey = `confirm-attempts:${email}`;
      const attemptsStr = await this.tokenStore.get(attemptKey);
      const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;

      if (attempts + 1 >= 5) {
        // Invalidate the code after 5 failed attempts
        await this.tokenStore.delete(`${CONFIRMATION_CODE_PREFIX}${email}`);
        await this.tokenStore.delete(attemptKey);
        return {
          success: false,
          error: "Too many failed attempts. Please request a new confirmation code.",
        };
      }

      await this.tokenStore.set(attemptKey, String(attempts + 1), CONFIRMATION_TTL_SECONDS);
      return { success: false, error: "Invalid confirmation code" };
    }

    // Mark email as confirmed
    const user = await this.userStore.getUserByEmail(email);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    await this.userStore.updateUser(user.id, { emailConfirmed: true });

    // Clean up the confirmation code and attempt counter
    await this.tokenStore.delete(`${CONFIRMATION_CODE_PREFIX}${email}`);
    await this.tokenStore.delete(`confirm-attempts:${email}`);

    return { success: true };
  }

  /**
   * Log in a customer with email + password (AAL1).
   *
   * Enforces rate limiting: max 100 consecutive failed attempts per account
   * (SP 800-63B-4 Sec. 3.2.2). Successful login resets the counter.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.userStore.getUserByEmail(email);
    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    // Check if account is locked
    if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return {
        success: false,
        error: "Account locked due to too many failed login attempts. Contact support.",
      };
    }

    // Check if email is confirmed
    if (!user.emailConfirmed) {
      return {
        success: false,
        error: "Email not yet confirmed. Please check your inbox for the confirmation code.",
      };
    }

    // Verify password
    const valid = await this.passwordService.verify(password, user.passwordHash);
    if (!valid) {
      // Increment failed attempts
      await this.userStore.updateUser(user.id, {
        failedAttempts: user.failedAttempts + 1,
      });
      return { success: false, error: "Invalid email or password" };
    }

    // Reset failed attempts on successful login
    await this.userStore.updateUser(user.id, { failedAttempts: 0 });

    // Create session
    const session = await this.sessionService.createSession(user.id, "AAL1");

    // Store role alongside session for middleware (with matching TTL)
    const sessionTtlSeconds = Math.floor(
      (new Date(session.expiresAt).getTime() - Date.now()) / 1000,
    );
    await this.tokenStore.set(
      `session-role:${session.id}`,
      "customer",
      sessionTtlSeconds,
    );

    return { success: true, session };
  }

  /**
   * Generate a cryptographically random 6-digit confirmation code.
   */
  private generateConfirmationCode(): string {
    return String(randomInt(100000, 999999 + 1));
  }
}
