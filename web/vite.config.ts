import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { docsFiles } from "./vite-docs-files.ts";

export default defineConfig({
  base: "/liquidify/",
  plugins: [react(), docsFiles()],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
