import { TOTP, Secret } from "otpauth";
import * as QRCode from "qrcode";
import type { Session } from "@cliver/contracts";
import type { PasswordService } from "./password-service.js";
import type { SessionService } from "./session-service.js";
import type { InMemoryUserStore } from "./in-memory-user-store.js";
import type { ITokenStore } from "@cliver/contracts";

const MAX_FAILED_ATTEMPTS = 100;

interface AuthResult {
  success: boolean;
  error?: string;
  session?: Session;
}

interface TOTPEnrollment {
  secret: string;
  uri: string;
  qrCodeDataUrl: string;
}

/**
 * Provider authentication service (AAL2).
 *
 * Requires two distinct authentication factors: password + TOTP.
 * Per NIST SP 800-63B-4 Sec. 2.2, AAL2 requires multi-factor
 * authentication with replay-resistant mechanisms.
 */
export class ProviderAuthService {
  constructor(
    private passwordService: PasswordService,
    private sessionService: SessionService,
    private userStore: InMemoryUserStore,
    private tokenStore: ITokenStore,
  ) {}

  /**
   * Enroll a provider in TOTP-based second factor authentication.
   * Generates a random secret, stores it, and returns a QR code
   * for scanning with an authenticator app.
   */
  async enrollTOTP(userId: string): Promise<TOTPEnrollment> {
    const user = await this.userStore.getUserById(userId);
    if (!user) throw new Error("User not found");

    const secret = new Secret({ size: 20 }); // 160-bit secret per RFC 4226

    const totp = new TOTP({
      issuer: "Cliver",
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });

    const uri = totp.toString();
    const qrCodeDataUrl = await QRCode.toDataURL(uri);

    // Store the secret on the user record
    await this.userStore.updateUser(userId, {
      totpSecret: secret.base32,
    });

    return {
      secret: secret.base32,
      uri,
      qrCodeDataUrl,
    };
  }

  /**
   * Verify a TOTP code against the user's enrolled secret.
   * Allows a window of +/- 1 time step (30 seconds) to account
   * for clock drift.
   */
  async verifyTOTP(userId: string, code: string): Promise<boolean> {
    const user = await this.userStore.getUserById(userId);
    if (!user || !user.totpSecret) return false;

    const totp = new TOTP({
      issuer: "Cliver",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(user.totpSecret),
    });

    // validate returns the time step difference, or null if invalid
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) return false;

    // Replay protection: compute the accepted time step and check if already used
    const currentTimeStep = Math.floor(Date.now() / 1000 / 30);
    const acceptedTimeStep = currentTimeStep + delta;
    const replayKey = `totp-used:${userId}:${acceptedTimeStep}`;

    const alreadyUsed = await this.tokenStore.get(replayKey);
    if (alreadyUsed !== null) return false;

    // Mark this time step as used (90s TTL covers the full window)
    await this.tokenStore.set(replayKey, "1", 90);

    return true;
  }

  /**
   * Log in a provider with password + TOTP (AAL2).
   * Both factors are required. Rate limiting applies per SP 800-63B-4.
   */
  async login(
    email: string,
    password: string,
    totpCode: string,
  ): Promise<AuthResult> {
    // Require TOTP code
    if (!totpCode) {
      return {
        success: false,
        error: "TOTP second factor code is required for provider login",
      };
    }

    const user = await this.userStore.getUserByEmail(email);
    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }

    // Check if email is confirmed
    if (!user.emailConfirmed) {
      return {
        success: false,
        error: "Email not yet confirmed. Please check your inbox for the confirmation code.",
      };
    }

    // Check rate limiting
    if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return {
        success: false,
        error: "Account locked due to too many failed attempts",
      };
    }

    // Verify password (first factor)
    const passwordValid = await this.passwordService.verify(
      password,
      user.passwordHash,
    );
    if (!passwordValid) {
      await this.userStore.updateUser(user.id, {
        failedAttempts: user.failedAttempts + 1,
      });
      return { success: false, error: "Invalid credentials" };
    }

    // Verify TOTP (second factor)
    if (!user.totpSecret) {
      return {
        success: false,
        error: "TOTP not enrolled. Please enroll before logging in.",
      };
    }

    const totpValid = await this.verifyTOTP(user.id, totpCode);
    if (!totpValid) {
      await this.userStore.updateUser(user.id, {
        failedAttempts: user.failedAttempts + 1,
      });
      return { success: false, error: "Invalid TOTP code" };
    }

    // Reset failed attempts
    await this.userStore.updateUser(user.id, { failedAttempts: 0 });

    // Create AAL2 session
    const session = await this.sessionService.createSession(user.id, "AAL2");

    // Store role alongside session for middleware (with matching TTL)
    const sessionTtlSeconds = Math.floor(
      (new Date(session.expiresAt).getTime() - Date.now()) / 1000,
    );
    await this.tokenStore.set(
      `session-role:${session.id}`,
      "provider",
      sessionTtlSeconds,
    );

    return { success: true, session };
  }
}
