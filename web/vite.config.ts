import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { _match, _Maybe, _try } from "funcio";
import { docsFiles } from "./vite-docs-files.ts";

function appVersion(): string {
  return _try
    .sync(() => JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")) as { version?: unknown })
    .match({
      right: (pkg) =>
        _Maybe.of(
          _match(typeof pkg.version)
            .with("string", () => pkg.version as string)
            .exec(),
        ).getOrElse("0.0.0"),
      left: () => "0.0.0",
    });
}

function baseRedirect(): Plugin {
  return {
    name: "liquidify-base-redirect",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        _match(url.split("?")[0] === "/liquidify")
          .with(true, () => {
            res.statusCode = 301;
            res.setHeader("Location", `/liquidify/${url.slice("/liquidify".length)}`);
            res.end();
          })
          .with(false, () => next())
          .exec();
      });
    },
  };
}

export default defineConfig({
  base: "/liquidify/",
  plugins: [baseRedirect(), react(), docsFiles()],
  resolve: {
    alias: {
      funcio: fileURLToPath(new URL("./node_modules/funcio/lib/main.js", import.meta.url)),
    },
  },
  define: {
    "import.meta.env.APP_VERSION": JSON.stringify(appVersion()),
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  build: {
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          funcio: ["funcio"],
        },
      },
    },
  },
});
