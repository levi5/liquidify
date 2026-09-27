import "./style.css";

type Link = { href: string; label: string };

export default function GuideNav({ title, links, active }: { title: string; links: Link[]; active: string }) {
  return <aside className="guide-nav"><strong>{title}</strong><nav>{links.map((link) => <a className={link.href === active ? "active" : ""} href={link.href} key={link.href}>{link.label}</a>)}</nav></aside>;
}
