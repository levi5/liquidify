import { useLocale } from "../../i18n.tsx";
import { chapterNeighbours, t as tr, type Chapter } from "../../docs/manifest.ts";
import "./style.css";

export default function PageNav({ chapter }: { chapter: Chapter }) {
  const { locale } = useLocale();
  const { previous, next } = chapterNeighbours(chapter);
  if (!previous && !next) return null;

  return (
    <nav className="page-nav" aria-label={locale === "pt-BR" ? "Navegação entre capítulos" : "Chapter navigation"}>
      {previous ? (
        <a className="page-nav-link page-nav-prev" href={previous.href}>
          <span className="page-nav-dir">{locale === "pt-BR" ? "Anterior" : "Previous"}</span>
          <span className="page-nav-title">{tr(previous.title, locale)}</span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a className="page-nav-link page-nav-next" href={next.href}>
          <span className="page-nav-dir">{locale === "pt-BR" ? "Próximo" : "Next"}</span>
          <span className="page-nav-title">{tr(next.title, locale)}</span>
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}
