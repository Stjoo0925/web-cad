import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@web-cad/sdk-react": path.resolve(__dirname, "../../packages/sdk-react/src")
    }
  },
  server: {
    port: 5173,
    cors: true
  }
});