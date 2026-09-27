import type { ReactNode } from "react";
import styles from "./style.module.css";

export default function Callout({ children }: { children: ReactNode }) {
  return (
    <aside className={styles.callout}>
      <span className={styles.mark} aria-hidden="true">★</span>
      <div>{children}</div>
    </aside>
  );
}
