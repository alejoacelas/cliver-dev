import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = resolve(__dirname, "../prompts");

export function loadPrompt(
  checkId: string,
  values: Record<string, string>,
): string {
  const filename = checkId.replace(/_/g, "-") + ".md";
  const filePath = resolve(PROMPTS_DIR, filename);
  let template = readFileSync(filePath, "utf-8");

  for (const [key, value] of Object.entries(values)) {
    template = template.replaceAll(`{{${key}}}`, value);
  }

  return template;
}
