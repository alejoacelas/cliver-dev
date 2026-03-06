/**
 * File-based cache for API responses.
 * Opt-in via CACHE_ENABLED=true environment variable.
 * Cache key = SHA-256 hash of (namespace + JSON-serialized params).
 * Stores responses as JSON files in .cache/ directory.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const CACHE_DIR = join(import.meta.dirname ?? ".", "..", ".cache");

function isEnabled(): boolean {
  return process.env.CACHE_ENABLED === "true";
}

function cacheKey(namespace: string, params: unknown): string {
  const raw = JSON.stringify({ namespace, params });
  return createHash("sha256").update(raw).digest("hex");
}

function cachePath(key: string): string {
  return join(CACHE_DIR, `${key}.json`);
}

export function getCached<T>(namespace: string, params: unknown): T | undefined {
  if (!isEnabled()) return undefined;
  const path = cachePath(cacheKey(namespace, params));
  if (!existsSync(path)) return undefined;
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function setCached<T>(namespace: string, params: unknown, value: T): void {
  if (!isEnabled()) return;
  mkdirSync(CACHE_DIR, { recursive: true });
  const path = cachePath(cacheKey(namespace, params));
  writeFileSync(path, JSON.stringify(value, null, 2), "utf-8");
}
