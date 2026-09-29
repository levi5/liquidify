import { useEffect } from "react";
import { _match, _Maybe } from "funcio";
import type { Chapter } from "./manifest.ts";

function key(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .replace(/^\d+\s+/, "")
  );
}

function chapterBaseHref(chapter: Chapter): string {
  const raw = _match(chapter.href.startsWith("#/"))
    .with(true, () => chapter.href.slice(2))
    .with(false, () => chapter.href.replace(/^\//, ""))
    .exec();
  const hashIndex = raw.indexOf("#");
  const path = _match(hashIndex === -1)
    .with(true, () => raw)
    .with(false, () => raw.slice(0, hashIndex))
    .exec();
  const base = import.meta.env.BASE_URL || "/";
  const b = base.endsWith("/") ? base : `${base}/`;
  return `${b}${path.replace(/^\/+/, "")}`;
}

function anchorSection(
  section: Chapter["sections"][number],
  headings: HTMLElement[],
  taken: Set<string>,
): void {
  _match(taken.has(section.id))
    .with(true, () => undefined)
    .with(false, () => {
      const wanted = new Set(
        [section.title.en, section.title["pt-BR"], ...(section.match ?? [])].map(key),
      );
      _Maybe.of(
        headings.find((heading) =>
          _match(Boolean(heading.dataset.liquidifyAnchor))
            .with(true, () => false)
            .with(false, () => wanted.has(key(heading.textContent ?? "")))
            .exec(),
        ),
      ).map((match) => {
        const target = match as HTMLElement;
        target.id = section.id;
        target.dataset.liquidifyAnchor = section.id;
        target.classList.add("anchor-target");
        taken.add(section.id);
      });
    })
    .exec();
}

function injectCopyLink(heading: HTMLElement, baseHref: string): void {
  const pt = document.documentElement.lang === "pt-BR";
  _match(Boolean(heading.id) && !heading.querySelector("[data-anchor-link]"))
    .with(true, () => {
      const link = document.createElement("a");
      link.href = `${baseHref}#${heading.id}`;
      link.setAttribute("data-anchor-link", "true");
      link.className = "anchor-link";
      const label = heading.textContent?.trim() ?? heading.id;
      link.setAttribute("aria-label", pt ? `Copiar link para ${label}` : `Copy link to ${label}`);
      link.title = pt ? "Copiar link" : "Copy link";
      link.textContent = "#";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const url = `${window.location.origin}${baseHref}#${heading.id}`;
        _Maybe.of(navigator.clipboard).map((clipboard) => clipboard.writeText(url).catch(() => {}));
        window.history.replaceState(null, "", `${baseHref}#${heading.id}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
        link.dataset.copied = "true";
        window.setTimeout(() => delete link.dataset.copied, 1200);
      });
      heading.appendChild(link);
    })
    .with(false, () => undefined)
    .exec();
}

export default function SectionAnchors({ chapter }: { chapter: Chapter | undefined }) {
  useEffect(() => {
    _Maybe.of(chapter).map((ch) => {
      const current = ch as Chapter;
      _Maybe.of(document.querySelector(".guide-main")).map((root) => {
        const container = root as Element;
        const headings = Array.from(container.querySelectorAll<HTMLElement>("h2, h3"));
        const taken = new Set<string>();
        for (const heading of headings) {
          _match(heading.id !== "")
            .with(true, () => taken.add(heading.id))
            .with(false, () => undefined)
            .exec();
        }
        for (const section of current.sections) {
          anchorSection(section, headings, taken);
        }
        const baseHref = chapterBaseHref(current);
        for (const heading of headings) {
          injectCopyLink(heading, baseHref);
        }
      });
    });
  }, [chapter?.area, chapter?.id, chapter?.sections.length]);
  return null;
}
