import type { ITokenStore } from "@cliver/contracts";

interface StoredEntry {
  value: string;
  expiresAt: number | null; // Unix timestamp ms, null = no expiry
}

/**
 * In-memory implementation of ITokenStore.
 * Suitable for prototyping and testing. In production,
 * this would be backed by Redis or a database.
 */
export class InMemoryTokenStore implements ITokenStore {
  private store = new Map<string, StoredEntry>();

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt =
      ttlSeconds != null ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
