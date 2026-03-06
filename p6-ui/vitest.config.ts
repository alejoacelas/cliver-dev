import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@cliver/contracts": path.resolve(__dirname, "../p0-contracts/src/index.ts"),
      "@cliver/form-engine": path.resolve(__dirname, "../p1-form-engine/src/index.ts"),
      "@cliver/p5-events": path.resolve(__dirname, "../p5-events/src/index.ts"),
      // Deduplicate React — P1 has its own copy; force everything to use P6's.
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    css: false,
  },
});
