/**
 * Pre-validates email format before sending. Rejects obviously
 * malformed addresses before hitting the provider API.
 *
 * This is intentionally strict but not RFC 5322 compliant — we
 * want to catch typos, not validate every edge case.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  if (email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}
