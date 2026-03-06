/**
 * Custom Node.js module resolution hook.
 *
 * Maps @cliver/* package names to their src/index.ts entry points,
 * working around the fact that these packages don't have "exports"
 * fields in their package.json.
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve as pathResolve } from "node:path";

const ROOT = pathResolve(import.meta.dirname, "../..");

const ALIASES = {
  "@cliver/contracts": `${ROOT}/p0-contracts/src/index.ts`,
  "@cliver/form-engine": `${ROOT}/p1-form-engine/src/index.ts`,
  "@cliver/p2-pipeline": `${ROOT}/p2-pipeline/src/index.ts`,
  "@cliver/executors": `${ROOT}/p3-executors/src/index.ts`,
  "@cliver/p5-events": `${ROOT}/p5-events/src/index.ts`,
};

register("data:text/javascript," + encodeURIComponent(`
  const ALIASES = ${JSON.stringify(ALIASES)};

  export function resolve(specifier, context, nextResolve) {
    // Check exact match first
    if (ALIASES[specifier]) {
      return nextResolve(ALIASES[specifier], context);
    }
    // Check if it starts with one of our aliases (subpath imports)
    for (const [prefix, target] of Object.entries(ALIASES)) {
      if (specifier.startsWith(prefix + "/")) {
        const subpath = specifier.slice(prefix.length);
        const dir = target.replace(/\\/src\\/index\\.ts$/, "");
        return nextResolve(dir + subpath, context);
      }
    }
    return nextResolve(specifier, context);
  }
`), import.meta.url);
