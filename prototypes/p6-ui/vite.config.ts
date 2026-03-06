import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@cliver/contracts": path.resolve(__dirname, "../p0-contracts/src/index.ts"),
      "@cliver/form-engine": path.resolve(__dirname, "../p1-form-engine/src/index.ts"),
      "@cliver/p5-events": path.resolve(__dirname, "../p5-events/src/index.ts"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  server: {
    port: 3060,
  },
});
