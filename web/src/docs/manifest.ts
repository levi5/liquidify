import type { Locale } from "../i18n.tsx";
import { DOCS_CHAPTERS } from "../cms/docs.ts";
import { API_CHAPTERS } from "../cms/api.ts";

export type T = { en: string; "pt-BR": string };

export function t(value: T, locale: Locale): string {
  return value[locale];
}

export type Chapter = {
  id: string;
  area: "docs" | "api";
  href: string;
  title: T;
  summary: T;
  sections: Section[];
  standalone?: boolean;
};

export type Section = {
  id: string;
  title: T;
  match?: string[];
  terms?: string[];
};

export { DOCS_CHAPTERS, API_CHAPTERS };

export const CHAPTERS: Chapter[] = [...DOCS_CHAPTERS, ...API_CHAPTERS];

export const ALL_ROUTES = [
  { href: "#/", title: { en: "Home", "pt-BR": "Home" } },
  ...CHAPTERS.map((c) => ({ href: c.href, title: c.title })),
  { href: "#/example", title: { en: "Example store", "pt-BR": "Loja de exemplo" } },
];

export function findChapter(href: string): Chapter | undefined {
  return CHAPTERS.find((chapter) => chapter.href === href);
}

export function findSection(permalink: string): { chapter: Chapter; section: Section } | undefined {
  const [route, anchor] = permalink.split("#").filter(Boolean);
  const chapter = CHAPTERS.find((c) => c.href.split("#")[1] === route);
  if (!chapter || !anchor) return undefined;
  const section = chapter.sections.find((s) => s.id === anchor);
  return section ? { chapter, section } : undefined;
}

export function chapterNeighbours(chapter: Chapter): { previous?: Chapter; next?: Chapter } {
  const list = chapter.area === "docs" ? DOCS_CHAPTERS : API_CHAPTERS;
  const index = list.findIndex((c) => c.id === chapter.id);
  return { previous: list[index - 1], next: list[index + 1] };
}
