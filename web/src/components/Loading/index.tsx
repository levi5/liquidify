import { useLocale } from "../../i18n.tsx";
import styles from "./style.module.css";
import { cx } from "../../constants/cx.ts";

export default function Loading() {
  const { locale } = useLocale();
  const label = locale === "pt-BR" ? "Carregando…" : "Loading…";
  return (
    <div className={cx("wrap", "section", styles.loading)} role="status" aria-live="polite" aria-label={label}>
      <span className={styles.ring} aria-hidden="true">
        <img
          src={`${import.meta.env.BASE_URL}assets/logo-mark.png`}
          alt=""
          width="40"
          height="40"
          decoding="async"
        />
      </span>
      <span className={styles.bars} aria-hidden="true">
        <i className={styles.bar} />
        <i className={styles.bar} />
        <i className={styles.bar} />
      </span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
