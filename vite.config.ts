import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * For GitHub Pages:
 * - Workflow sets BASE_PATH="/<repo-name>/"
 * - Local dev defaults to "/"
 */
export default defineConfig(() => ({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  build: {
    sourcemap: true
  }
}));
