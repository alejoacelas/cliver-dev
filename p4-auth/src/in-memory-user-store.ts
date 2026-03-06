import type { UserRole } from "@cliver/contracts";
import { randomUUID } from "node:crypto";

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  totpSecret?: string;
  emailConfirmed?: boolean;
  failedAttempts: number;
  lockedUntil?: string;
}

/**
 * In-memory user store for prototyping. Mirrors the user-related
 * methods from IStorageLayer but kept simple for P4's scope.
 */
export class InMemoryUserStore {
  private users = new Map<string, StoredUser>();
  private emailIndex = new Map<string, string>(); // email -> userId

  async createUser(data: {
    email: string;
    passwordHash: string;
    role: UserRole;
    emailConfirmed?: boolean;
  }): Promise<string> {
    if (this.emailIndex.has(data.email)) {
      throw new Error(`User with email ${data.email} already exists`);
    }

    const id = randomUUID();
    const user: StoredUser = {
      id,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
      emailConfirmed: data.emailConfirmed ?? false,
      failedAttempts: 0,
    };

    this.users.set(id, user);
    this.emailIndex.set(data.email, id);
    return id;
  }

  async getUserByEmail(email: string): Promise<StoredUser | null> {
    const id = this.emailIndex.get(email);
    if (!id) return null;
    return this.users.get(id) ?? null;
  }

  async getUserById(id: string): Promise<StoredUser | null> {
    return this.users.get(id) ?? null;
  }

  async updateUser(id: string, data: Partial<StoredUser>): Promise<void> {
    const user = this.users.get(id);
    if (!user) throw new Error(`User ${id} not found`);
    Object.assign(user, data);
  }
}
