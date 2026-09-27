import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base '/liquidify/' = URL do GitHub Pages (levi5.github.io/liquidify/).
// Para preview local ou outro domínio, sobrescreva: `vite build --base=/`
export default defineConfig({
  base: "/liquidify/",
  plugins: [react()],
});
