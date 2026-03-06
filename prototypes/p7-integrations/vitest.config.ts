import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv(): Record<string, string> {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
    const env: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
    }
    return env;
  } catch {
    return {};
  }
}

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    env: loadDotEnv(),
  },
});
