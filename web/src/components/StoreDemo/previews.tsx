import { useState } from "react";
import { useLocale } from "../../i18n.tsx";
import { brl, isValidEmail, getCatalogItems, paginate, getTotalPages, getSubtotal } from "./helpers.ts";

export function CatalogPreview({ womenImg, menImg }: { womenImg: string; menImg: string }) {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const items = getCatalogItems(pt, womenImg, menImg);
  const PER_PAGE = 3;
  const total = getTotalPages(items.length, PER_PAGE);
  const [page, setPage] = useState(1);
  const visible = paginate(items, page, PER_PAGE);

  return (
    <div className="mock-catalog">
      <div className="mock-pages-top">
        <span>{items.length} {pt ? "produtos" : "products"} · {pt ? `pág. ${page} de ${total}` : `page ${page} of ${total}`}</span>
      </div>
      <div className="mock-mini-grid">
        {visible.map((item) => (
          <div className="mock-mini-card" key={item.name}>
            <div className="mock-img small">{item.img ? <img src={item.img} alt="" loading="lazy" /> : "LQ."}</div>
            <span>{item.name}</span>
            <strong>{brl(item.price)}</strong>
          </div>
        ))}
      </div>
      <div className="mock-pages" role="navigation" aria-label="Paginação">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label={pt ? "Anterior" : "Previous"}>←</button>
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" className={n === page ? "on" : ""} aria-current={n === page ? "page" : undefined} onClick={() => setPage(n)}>
            {n}
          </button>
        ))}
        <button type="button" onClick={() => setPage((p) => Math.min(total, p + 1))} disabled={page === total} aria-label={pt ? "Próxima" : "Next"}>→</button>
      </div>
    </div>
  );
}

export function ProductPreview({ img }: { img: string }) {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const variants = [
    { label: "P", price: 439 },
    { label: "M", price: 459 },
    { label: "G", price: 479 },
  ];
  const [size, setSize] = useState("M");
  const [added, setAdded] = useState(false);
  const price = variants.find((v) => v.label === size)?.price ?? 459;

  function buy() {
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="mock-product">
      <div className="mock-product-gallery">
        <img src={img} alt="" loading="lazy" />
      </div>
      <div className="mock-product-buy">
        <span className="mock-eyebrow">Essentials</span>
        <strong>{pt ? "Vestido Seda" : "Silk Dress"}</strong>
        <span className="mock-price">{brl(price)}</span>
        <div className="mock-variants" role="group" aria-label={pt ? "Tamanho" : "Size"}>
          {variants.map((v) => (
            <button key={v.label} type="button" className={v.label === size ? "on" : ""} aria-pressed={v.label === size} onClick={() => setSize(v.label)}>
              {v.label}
            </button>
          ))}
        </div>
        <button type="button" className={`mock-btn${added ? " done" : ""}`} onClick={buy}>
          {added ? (pt ? "Adicionado ✓" : "Added ✓") : (pt ? "Adicionar à sacola ↗" : "Add to bag ↗")}
        </button>
      </div>
    </div>
  );
}

export function NewsletterPreview() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");

  function submit() {
    if (isValidEmail(email)) setStatus("done");
    else setStatus("error");
  }

  return (
    <div className="mock-news">
      <span className="mock-eyebrow">{pt ? "Vamos ficar mais perto?" : "Let's stay closer?"}</span>
      <strong>{pt ? "Entre para a nossa lista." : "Join our list."}</strong>
      {status === "done" ? (
        <p className="mock-success" role="status">{pt ? "Inscrito! Confira seu e-mail. ✓" : "Subscribed! Check your inbox. ✓"}</p>
      ) : (
        <>
          <div className="mock-email">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
              placeholder={pt ? "Seu melhor e-mail" : "Your best email"}
              aria-label="Email"
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            />
            <button type="button" onClick={submit} aria-label={pt ? "Assinar" : "Subscribe"}>↗</button>
          </div>
          {status === "error" && <p className="mock-error" role="alert">{pt ? "Digite um e-mail válido." : "Enter a valid email."}</p>}
        </>
      )}
    </div>
  );
}

export function CartPreview() {
  const { locale } = useLocale();
  const pt = locale === "pt-BR";
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState([
    { id: 1, title: pt ? "Camisa Linho" : "Linen Shirt", variant: "P / Bege", price: 289 },
    { id: 2, title: pt ? "Vestido Seda" : "Silk Dress", variant: "M / Preto", price: 459 },
  ]);
  const subtotal = getSubtotal(items);

  return (
    <div className="mock-cart">
      <button type="button" className="mock-cart-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        🛍 <span>{items.length}</span>
      </button>
      {open && (
        <div className="mock-cart-drawer">
          <strong>{pt ? "Sua sacola" : "Your bag"} · {items.length}</strong>
          {items.length === 0 ? (
            <span>{pt ? "Sacola vazia." : "Empty bag."}</span>
          ) : (
            items.map((item) => (
              <div className="mock-cart-item" key={item.id}>
                <div>
                  <span>{item.title} — {item.variant}</span>
                  <strong>{brl(item.price)}</strong>
                </div>
                <button type="button" onClick={() => setItems((list) => list.filter((i) => i.id !== item.id))} aria-label={`${pt ? "Remover" : "Remove"} ${item.title}`}>
                  ×
                </button>
              </div>
            ))
          )}
          {items.length > 0 && <em>Subtotal {brl(subtotal)} · {pt ? "Finalizar compra ↗" : "Checkout ↗"}</em>}
        </div>
      )}
    </div>
  );
}
