import { _match, _Maybe } from "funcio";

export type Area = "home" | "docs" | "api" | "example" | "not-found";
export type Route = { area: Area; chapter: string; anchor: string };

const DOCS = new Set(["hello", "concepts", "faq", "start", "theme-model", "authoring", "shopify", "runtime", "islands", "schema", "types"]);
const API = new Set(["cli", "config", "runtime", "filters", "tsx", "builder", "build", "errors", "plugins"]);

function base(): string {
  const b = import.meta.env.BASE_URL || "/";
  return b.endsWith("/") ? b : `${b}/`;
}

export function basePath(): string {
  return base();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function baseSegment(): string {
  return base().replace(/^\/+|\/+$/g, "");
}

function stripRepeatedBase(rest: string): string {
  const seg = escapeRegExp(baseSegment());
  return rest
    .replace(/^\/+/, "")
    .replace(new RegExp(`^(?:${seg}(?:\\/|$))+`), "");
}

function stripHashPrefix(href: string): string {
  return _match(href.startsWith("#/"))
    .with(true, () => href.slice(2))
    .with(false, () => href.replace(/^\//, ""))
    .exec();
}

function splitPathAnchor(rest: string): { path: string; anchor: string } {
  const hashIndex = rest.indexOf("#");
  return _match(hashIndex === -1)
    .with(true, () => ({ path: rest, anchor: "" }))
    .with(false, () => ({ path: rest.slice(0, hashIndex), anchor: rest.slice(hashIndex + 1) }))
    .exec();
}

export function toHref(href: string): string {
  return _match(href.startsWith("#") && !href.startsWith("#/"))
    .with(true, () => href)
    .with(false, () => {
      const { path, anchor } = splitPathAnchor(stripHashPrefix(href));
      const b = base();
      const cleanPath = stripRepeatedBase(path).replace(/\/+$/, "");
      const url = cleanPath ? `${b}${cleanPath}` : b;
      return anchor ? `${url}#${anchor}` : url;
    })
    .exec();
}

export function canonicalPath(href: string): string {
  return _match(href.startsWith("#/"))
    .with(true, () => {
      const { path, anchor } = splitPathAnchor(href.slice(2));
      return path ? `/${path}${anchor ? `#${anchor}` : ""}` : `/#${anchor}`;
    })
    .with(false, () => (href.startsWith("/") ? href : `/${href}`))
    .exec();
}

function knownChapter(chapters: Set<string>, chapter: string, fallback: string): string {
  return _match(chapters.has(chapter))
    .with(true, () => chapter)
    .with(false, () => fallback)
    .exec();
}

function routeFromParts(area: string, chapter: string, anchor: string): Route {
  return _Maybe.of(
    _match(area)
      .with("docs", (): Route => ({ area: "docs", chapter: knownChapter(DOCS, chapter, "start"), anchor }))
      .with("api", (): Route => ({ area: "api", chapter: knownChapter(API, chapter, "cli"), anchor }))
      .with("example", (): Route => ({ area: "example", chapter: "", anchor }))
      .with("", (): Route => ({ area: "home", chapter: "", anchor }))
      .exec(),
  ).getOrElse({ area: "not-found", chapter: area, anchor } as Route);
}

export function stripBase(pathname: string): string {
  const baseNoSlash = base().replace(/\/+$/, "");
  const stripped = pathname.replace(new RegExp(`^(?:${escapeRegExp(baseNoSlash)}(?=\\/|$))+`), "");
  return _match(stripped === "")
    .with(true, () => "/")
    .with(false, () => stripped)
    .exec();
}

function routeFromLegacyHash(hash: string): Route {
  const { path, anchor } = splitPathAnchor(hash.replace(/^#\/?/, ""));
  const [area, chapter] = path.split("/");
  window.history.replaceState(null, "", toHref(`#/${path}${anchor ? `#${anchor}` : ""}`));
  return routeFromParts(area ?? "", chapter ?? "", anchor);
}

function routeFromPathname(): Route {
  const pathname = stripBase(window.location.pathname);
  const hash = window.location.hash;
  const anchor = _match(hash.startsWith("#") && !hash.startsWith("#/"))
    .with(true, () => hash.slice(1))
    .with(false, () => "")
    .exec();
  const parts = pathname
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean);
  return routeFromParts(parts[0] ?? "", parts[1] ?? "", anchor);
}

export function getRoute(): Route {
  return _match(window.location.hash.startsWith("#/"))
    .with(true, () => routeFromLegacyHash(window.location.hash))
    .with(false, () => routeFromPathname())
    .exec();
}

function navigateAnchor(url: string): void {
  const el = document.querySelector(url);
  _match(el === null)
    .with(true, () => undefined)
    .with(false, () => (el as Element).scrollIntoView())
    .exec();
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function navigate(href: string): void {
  const url = _match(href.startsWith("#") && !href.startsWith("#/"))
    .with(true, () => href)
    .with(false, () => toHref(href))
    .exec();
  _match(url.startsWith("#"))
    .with(true, () => navigateAnchor(url))
    .with(false, () => {
      window.history.pushState(null, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    })
    .exec();
}

export function routeToHref(route: Route): string {
  return _Maybe.of(
    _match(route.area)
      .with("home", () => basePath())
      .with("example", () => toHref("#/example"))
      .with("docs", () => toHref(`#/${route.area}/${route.chapter}${route.anchor ? `#${route.anchor}` : ""}`))
      .with("api", () => toHref(`#/${route.area}/${route.chapter}${route.anchor ? `#${route.anchor}` : ""}`))
      .exec(),
  ).getOrElse(toHref(`#/${route.chapter}`));
}
