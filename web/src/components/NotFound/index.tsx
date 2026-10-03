import { useLocale } from "../../i18n.tsx";
import { toHref } from "../../lib/routes.ts";
import { cx } from "../../constants/cx.ts";
import styles from "./style.module.css";

export default function NotFound({ path }: { path: string }) {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  return (
    <section className="wrap section">
      <p className="kicker">{pt ? "Erro 404" : "404 error"}</p>
      <h1 className={styles.title}>{pt ? "Página não encontrada" : "Page not found"}</h1>
      <p className="section-sub">
        {pt
          ? `Não existe nada em “/${path}”. Volte para a home ou use a busca (Ctrl/Cmd K).`
          : `There is nothing at “/${path}”. Go back home or use search (Ctrl/Cmd K).`}
      </p>
      <div className="row">
        <a className={cx("btn", "btn-primary")} href={toHref("#/")}>
          {pt ? "Voltar para a home →" : "Back to home →"}
        </a>
        <a className="btn" href={toHref("#/docs/start")}>
          Docs →
        </a>
        <a className="btn" href={toHref("#/api/cli")}>
          API →
        </a>
      </div>
    </section>
  );
}
