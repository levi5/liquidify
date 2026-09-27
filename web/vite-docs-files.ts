import type { Plugin } from "vite";
import { CHAPTERS } from "./src/docs/manifest.ts";

const ORIGIN = (process.env.SITE_ORIGIN ?? "https://levi5.github.io").replace(/\/+$/, "");
const BASE = "/liquidify";
const abs = (href: string) => `${ORIGIN}${BASE}/${href.replace(/^#\//, "")}`;

function llmsTxt(): string {
  const lines: string[] = [
    "# Liquidify",
    "",
    "> Build a complete Shopify store in TSX and compile it to Liquid. Reference for the",
    "> directives, filters, runtime exports, builder API, and CLI.",
    "",
    "Every page is a single-document app route: the link is the page and the fragment",
    "is the section anchor.",
    "",
  ];

  for (const area of ["docs", "api"] as const) {
    const label = area === "docs" ? "Guides" : "API reference";
    lines.push(`## ${label}`, "");
    for (const chapter of CHAPTERS.filter((c) => c.area === area)) {
      lines.push(`- [${chapter.title.en}](${abs(chapter.href)}): ${chapter.summary.en}`);
      for (const section of chapter.sections) {
        lines.push(`  - [${section.title.en}](${abs(`${chapter.href}#${section.id}`)})`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

function sitemapXml(): string {
  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    `<url><loc>${abs("")}</loc><lastmod>${today}</lastmod></url>`,
    ...CHAPTERS.map(
      (c) => `<url><loc>${abs(c.href)}</loc><lastmod>${today}</lastmod></url>`,
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

export function docsFiles(): Plugin {
  return {
    name: "liquidify-docs-files",
    apply: "build",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "llms.txt", source: llmsTxt() });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml() });
    },
  };
}
