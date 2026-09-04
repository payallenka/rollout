import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // relative paths, so the build works at a domain root and under a
  // /repo-name/ path on GitHub Pages without a rebuild
  base: "./",
  build: { outDir: "../docs", emptyOutDir: true },
});
