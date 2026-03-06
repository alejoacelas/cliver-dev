import { register } from "node:module";
import { resolve as pathResolve } from "node:path";

const ROOT = pathResolve(import.meta.dirname, "../..");

const ALIASES = {
  "@cliver/contracts": `${ROOT}/p0-contracts/src/index.ts`,
  "@cliver/auth": `${ROOT}/p4-auth/src/index.ts`,
};

register("data:text/javascript," + encodeURIComponent(`
  const ALIASES = ${JSON.stringify(ALIASES)};

  export function resolve(specifier, context, nextResolve) {
    if (ALIASES[specifier]) {
      return nextResolve(ALIASES[specifier], context);
    }
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
