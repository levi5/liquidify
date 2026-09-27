import "./style.css";

type Link = { href: string; label: string };

export default function GuideNav({
  title,
  links,
  active,
  ariaLabel,
}: {
  title: string;
  links: Link[];
  active: string;
  ariaLabel?: string;
}) {
  return (
    <aside className="guide-nav">
      <strong>{title}</strong>
      <nav aria-label={ariaLabel ?? title}>
        {links.map((link) => (
          <a
            className={link.href === active ? "active" : ""}
            href={link.href}
            key={link.href}
            aria-current={link.href === active ? "page" : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
