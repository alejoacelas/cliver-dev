import { describe, it, expect } from "vitest";
import {
  TokenPayloadSchema,
  SessionSchema,
  ProviderCredentialsSchema,
  PasswordRequirementsSchema,
  AALSchema,
  UserRoleSchema,
} from "./auth.js";

describe("AAL", () => {
  it("accepts AAL1 and AAL2", () => {
    expect(AALSchema.parse("AAL1")).toBe("AAL1");
    expect(AALSchema.parse("AAL2")).toBe("AAL2");
  });

  it("rejects AAL3", () => {
    expect(() => AALSchema.parse("AAL3")).toThrow();
  });
});

describe("UserRole", () => {
  it("accepts customer and provider", () => {
    expect(UserRoleSchema.parse("customer")).toBe("customer");
    expect(UserRoleSchema.parse("provider")).toBe("provider");
  });

  it("rejects admin", () => {
    expect(() => UserRoleSchema.parse("admin")).toThrow();
  });
});

describe("TokenPayload", () => {
  it("accepts a valid customer token", () => {
    const token = {
      userId: "usr-123",
      email: "user@example.com",
      role: "customer" as const,
      aal: "AAL1" as const,
      iat: 1709600000,
      exp: 1709603600,
    };
    const parsed = TokenPayloadSchema.parse(token);
    expect(parsed.userId).toBe("usr-123");
    expect(parsed.role).toBe("customer");
    expect(parsed.aal).toBe("AAL1");
  });

  it("accepts a provider token at AAL2", () => {
    const token = {
      userId: "usr-456",
      email: "provider@company.com",
      role: "provider" as const,
      aal: "AAL2" as const,
      iat: 1709600000,
      exp: 1709603600,
    };
    expect(TokenPayloadSchema.parse(token).aal).toBe("AAL2");
  });

  it("rejects missing email", () => {
    expect(() =>
      TokenPayloadSchema.parse({
        userId: "x",
        role: "customer",
        aal: "AAL1",
        iat: 0,
        exp: 0,
      })
    ).toThrow();
  });
});

describe("Session", () => {
  it("accepts a valid session", () => {
    const session = {
      id: "sess-abc",
      userId: "usr-123",
      aal: "AAL1" as const,
      createdAt: "2026-03-05T00:00:00Z",
      expiresAt: "2026-03-05T01:00:00Z",
      lastActivity: "2026-03-05T00:30:00Z",
    };
    const parsed = SessionSchema.parse(session);
    expect(parsed.id).toBe("sess-abc");
  });

  it("rejects missing userId", () => {
    expect(() =>
      SessionSchema.parse({
        id: "sess",
        aal: "AAL1",
        createdAt: "2026-03-05T00:00:00Z",
        expiresAt: "2026-03-05T01:00:00Z",
        lastActivity: "2026-03-05T00:00:00Z",
      })
    ).toThrow();
  });
});

describe("ProviderCredentials", () => {
  it("accepts valid provider credentials", () => {
    const creds = {
      email: "provider@company.com",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$...",
      totpSecret: "JBSWY3DPEHPK3PXP",
    };
    const parsed = ProviderCredentialsSchema.parse(creds);
    expect(parsed.totpSecret).toBe("JBSWY3DPEHPK3PXP");
  });

  it("rejects missing passwordHash", () => {
    expect(() =>
      ProviderCredentialsSchema.parse({
        email: "test@test.com",
        totpSecret: "abc",
      })
    ).toThrow();
  });
});

describe("PasswordRequirements", () => {
  it("accepts valid password requirements", () => {
    const reqs = {
      minLength: 15,
      maxLength: 128,
      checkBlocklist: true,
    };
    const parsed = PasswordRequirementsSchema.parse(reqs);
    expect(parsed.minLength).toBe(15);
    expect(parsed.checkBlocklist).toBe(true);
  });

  it("rejects minLength below 1", () => {
    expect(() =>
      PasswordRequirementsSchema.parse({ minLength: 0, maxLength: 128, checkBlocklist: false })
    ).toThrow();
  });
});
