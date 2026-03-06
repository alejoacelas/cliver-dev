import * as argon2 from "argon2";
import { createHash } from "node:crypto";
import type { AAL, PasswordRequirements } from "@cliver/contracts";

export interface StrengthResult {
  valid: boolean;
  reason?: string;
}

export interface BlocklistResult {
  breached: boolean;
  count?: number;
  error?: string;
}

// SP 800-63B-4 Sec. 3.1.1.2 password requirements
const REQUIREMENTS: Record<AAL, PasswordRequirements> = {
  AAL1: { minLength: 15, maxLength: 64, checkBlocklist: true },
  AAL2: { minLength: 8, maxLength: 64, checkBlocklist: true },
};

/**
 * Password hashing, verification, strength validation, and breached-password
 * blocklist checking per NIST SP 800-63B-4 Sec. 3.1.1.2.
 *
 * Uses argon2id for hashing and the Have I Been Pwned k-anonymity API
 * for blocklist checks.
 */
export class PasswordService {
  private fetchFn: typeof fetch;

  constructor(fetchFn?: typeof fetch) {
    this.fetchFn = fetchFn ?? globalThis.fetch;
  }

  /**
   * Validate password strength against SP 800-63B-4 requirements.
   * No composition rules. Only length is enforced.
   */
  validateStrength(password: string, aal: AAL): StrengthResult {
    const reqs = REQUIREMENTS[aal];

    // Use spread to count Unicode code points, not UTF-16 code units.
    // E.g., emoji like U+1F600 is 1 code point but .length === 2.
    if ([...password].length < reqs.minLength) {
      return {
        valid: false,
        reason: `Password must be at least ${reqs.minLength} characters`,
      };
    }

    // maxLength is a soft upper bound in the schema, but SP 800-63B-4
    // says verifiers SHALL accept at least 64 characters. We accept
    // any length (no truncation).
    return { valid: true };
  }

  /**
   * Hash a password using argon2id with a random salt.
   * The salt (at least 128 bits / 16 bytes) and cost factors
   * are encoded in the output string.
   */
  async hash(password: string): Promise<string> {
    // argon2 generates a random 16-byte (128-bit) salt by default,
    // well above SP 800-63B-4's 32-bit minimum. The salt and cost
    // factors are encoded in the output hash string.
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456, // ~19 MiB (OWASP recommendation)
      timeCost: 2,
      parallelism: 1,
    });
  }

  /**
   * Verify a password against an argon2id hash.
   * The entire password is verified (no truncation).
   */
  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Check if a password appears in the Have I Been Pwned breached-password
   * database using the k-anonymity API. Only the first 5 characters of the
   * SHA-1 hash are sent to the API — the full password never leaves the client.
   *
   * On API failure, fails open (allows the password) but returns an error field.
   */
  async checkBlocklist(password: string): Promise<BlocklistResult> {
    try {
      const sha1 = createHash("sha1")
        .update(password)
        .digest("hex")
        .toUpperCase();
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);

      const response = await this.fetchFn(
        `https://api.pwnedpasswords.com/range/${prefix}`,
        {
          headers: { "Add-Padding": "true" },
        },
      );

      if (!response.ok) {
        return { breached: false, error: `HIBP API returned ${response.status}` };
      }

      const body = await response.text();
      const lines = body.split("\n");

      for (const line of lines) {
        const [hashSuffix, countStr] = line.trim().split(":");
        if (hashSuffix === suffix) {
          const count = parseInt(countStr, 10);
          if (count > 0) {
            return { breached: true, count };
          }
        }
      }

      return { breached: false };
    } catch (err) {
      return {
        breached: false,
        error: `Blocklist check failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
