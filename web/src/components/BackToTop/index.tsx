import { useEffect, useState } from "react";
import { _match } from "funcio";
import styles from "./style.module.css";

export default function BackToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      _match(frame !== 0)
        .with(true, () => undefined)
        .with(false, () => {
          frame = window.requestAnimationFrame(() => {
            frame = 0;
            setVisible(window.scrollY > 900);
          });
        })
        .exec();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      _match(frame !== 0)
        .with(true, () => window.cancelAnimationFrame(frame))
        .with(false, () => undefined)
        .exec();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function scrollTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return _match(visible)
    .with(true, () => (
      <button type="button" className={styles.backToTop} onClick={scrollTop} aria-label={label}>
        ↑
      </button>
    ))
    .with(false, () => null)
    .exec();
}
