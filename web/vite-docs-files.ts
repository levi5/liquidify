import { copyFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { _try } from "funcio";
import { CHAPTERS } from "./src/docs/manifest.ts";

const ORIGIN = (process.env.SITE_ORIGIN ?? "https://levi5.github.io").replace(/\/+$/, "");
const BASE = "/liquidify";
const abs = (href: string) => {
  const path = href.replace(/^#\//, "").replace(/^\/+/, "");
  return path ? `${ORIGIN}${BASE}/${path}` : `${ORIGIN}${BASE}/`;
};

function llmsTxt(): string {
  const lines: string[] = [
    "# Liquidify",
    "",
    "> Build a complete Shopify store in TSX and compile it to Liquid. Reference for the",
    "> directives, filters, runtime exports, builder API, and CLI.",
    ">",
    "> EN + PT-BR: the docs site is bilingual (EN default, pt-BR via language switch).",
    "",
    "Every page is a history-routed app route: the path is the page and the fragment",
    "is the section anchor.",
    "",
    "- [Home](https://levi5.github.io/liquidify/): Write TSX. Ship Liquid.",
    "- [Example store](https://levi5.github.io/liquidify/example): fashion store piece by piece.",
    "",
  ];

  for (const area of ["docs", "api"] as const) {
    const label = area === "docs" ? "Guides" : "API reference";
    lines.push(`## ${label}`, "");
    for (const chapter of CHAPTERS.filter((c) => c.area === area)) {
      lines.push(`- [${chapter.title.en}](${abs(chapter.href)}): ${chapter.summary.en}`);
      lines.push(`  - PT-BR: [${chapter.title["pt-BR"]}](${abs(chapter.href)}): ${chapter.summary["pt-BR"]}`);
      for (const section of chapter.sections) {
        lines.push(`  - [${section.title.en}](${abs(`${chapter.href}#${section.id}`)})`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

const BUILD_DATE = process.env.BUILD_DATE ?? "2026-01-01";

function sitemapXml(): string {
  const priorityFor = (href: string): string => {
    if (href === "" || href === "#/docs/hello" || href === "#/docs/start" || href === "#/api/cli") return "1.0";
    if (href === "#/example") return "0.9";
    return "0.7";
  };
  const entries = [
    `<url><loc>${abs("")}</loc><lastmod>${BUILD_DATE}</lastmod><changefreq>weekly</changefreq><priority>${priorityFor("")}</priority></url>`,
    `<url><loc>${abs("#/example")}</loc><lastmod>${BUILD_DATE}</lastmod><changefreq>weekly</changefreq><priority>${priorityFor("#/example")}</priority></url>`,
    ...CHAPTERS.map(
      (c) => `<url><loc>${abs(c.href)}</loc><lastmod>${BUILD_DATE}</lastmod><changefreq>weekly</changefreq><priority>${priorityFor(c.href)}</priority></url>`,
    ),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}

function robotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /liquidify/",
    "",
    `Sitemap: ${ORIGIN}${BASE}/sitemap.xml`,
    "",
  ].join("\n");
}

export function docsFiles(): Plugin {
  return {
    name: "liquidify-docs-files",
    apply: "build",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "llms.txt", source: llmsTxt() });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml() });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robotsTxt() });
    },
    closeBundle() {
      _try.sync(() => {
        const outDir = join(process.cwd(), "dist");
        copyFileSync(join(outDir, "index.html"), join(outDir, "404.html"));
      });
    },
  };
}
