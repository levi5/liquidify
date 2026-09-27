import { useEffect } from "react";
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

export default function SectionAnchors({ chapter }: { chapter: Chapter | undefined }) {
  useEffect(() => {
    if (!chapter) return;
    const root = document.querySelector(".guide-main");
    if (!root) return;

    const headings = Array.from(root.querySelectorAll<HTMLElement>("h2, h3"));
    const taken = new Set<string>();
    for (const heading of headings) {
      if (heading.id) taken.add(heading.id);
    }

    for (const section of chapter.sections) {
      if (taken.has(section.id)) continue;
      const wanted = new Set(
        [section.title.en, section.title["pt-BR"], ...(section.match ?? [])].map(key),
      );

      const match = headings.find((heading) => {
        if (heading.dataset.liquidifyAnchor) return false;
        return wanted.has(key(heading.textContent ?? ""));
      });
      if (!match) continue;

      match.id = section.id;
      match.dataset.liquidifyAnchor = section.id;
      match.classList.add("anchor-target");
      taken.add(section.id);
    }
  });
  return null;
}
