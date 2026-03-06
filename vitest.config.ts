import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    root: ".",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@cliver/contracts": resolve(__dirname, "prototypes/p0-contracts/src/index.ts"),
      "@cliver/p2-pipeline": resolve(__dirname, "prototypes/p2-pipeline/src/index.ts"),
      "@cliver/executors": resolve(__dirname, "prototypes/p3-executors/src/index.ts"),
    },
  },
});
