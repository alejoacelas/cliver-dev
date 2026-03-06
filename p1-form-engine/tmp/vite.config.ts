import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@cliver/contracts": path.resolve(__dirname, "../../p0-contracts/src/index.ts"),
      "@cliver/form-engine": path.resolve(__dirname, "../src/index.ts"),
    },
  },
});
