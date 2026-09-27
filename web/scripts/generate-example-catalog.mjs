import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";

const webRoot = resolve(import.meta.dirname, "..");
const templateRoot = resolve(webRoot, "..", "resources", "templates", "example");
const outputRoot = resolve(webRoot, "public", "example-source");
const manifestPath = resolve(templateRoot, ".liquidify-manifest.json");
const excludedDirectories = new Set(["node_modules", ".shopify", ".git"]);
const excludedFiles = new Set([".liquidify-manifest.json"]);
const textExtensions = new Set([".css", ".d.ts", ".js", ".json", ".liquid", ".md", ".mjs", ".ts", ".tsx", ".yml", ".yaml", ""]);

function toPosix(path) {
  return path.split(sep).join("/");
}

async function collectFiles(directory, files = []) {
  const entries = await (await import("node:fs/promises")).readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) await collectFiles(resolve(directory, entry.name), files);
      continue;
    }
    if (!entry.isFile() || excludedFiles.has(entry.name)) continue;
    const absolutePath = resolve(directory, entry.name);
    const path = toPosix(relative(templateRoot, absolutePath));
    files.push({ path, text: textExtensions.has(extname(entry.name)) || !extname(entry.name) });
  }
  return files;
}

function outputMap(manifest) {
  return Object.fromEntries(
    Object.entries(manifest.entries ?? {}).map(([source, entry]) => {
      const sourcePath = toPosix(relative(templateRoot, source));
      const files = Object.keys(entry.files ?? {});
      const scripts = Array.isArray(entry.scripts) ? entry.scripts : [];
      return [sourcePath, [...files, ...scripts].sort()];
    }),
  );
}

async function main() {
  const [manifestContent, packageContent] = await Promise.all([readFile(manifestPath, "utf8"), readFile(resolve(templateRoot, "package.json"), "utf8")]);
  const manifest = JSON.parse(manifestContent);
  const templatePackage = JSON.parse(packageContent);
  const files = (await collectFiles(templateRoot)).sort((a, b) => a.path.localeCompare(b.path));

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  await Promise.all(files.map(async ({ path }) => {
    const target = resolve(outputRoot, path);
    await mkdir(dirname(target), { recursive: true });
    await cp(resolve(templateRoot, path), target);
  }));

  const catalog = {
    template: "example",
    version: templatePackage.version ?? "unknown",
    files,
    generatedBySource: outputMap(manifest),
  };
  await writeFile(resolve(outputRoot, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Generated example source catalog (${files.length} files)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
