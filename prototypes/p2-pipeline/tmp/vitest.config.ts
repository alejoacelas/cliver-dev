import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@cliver/contracts": path.resolve(__dirname, "../../p0-contracts/src/index.ts"),
      "@cliver/form-engine": path.resolve(__dirname, "../../p1-form-engine/src/index.ts"),
      "@cliver/p2-pipeline": path.resolve(__dirname, "../../p2-pipeline/src/index.ts"),
      "@cliver/executors": path.resolve(__dirname, "../../p3-executors/src/index.ts"),
      "@cliver/p5-events": path.resolve(__dirname, "../../p5-events/src/index.ts"),
    },
  },
});
