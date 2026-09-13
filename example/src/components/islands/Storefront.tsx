'use react'

import { useEffect, useRef, useState } from 'preact/hooks'
import { Icon } from '../../ui/Icon'
import { CartContents } from '../../ui/CartContents'
import { cartRequest, rootUrl, type StoreCart } from '../../lib/shopify'

type MenuLink = { title: string; url: string; links?: MenuLink[] }
export const Storefront = ({
  store,
  menu = [],
}: {
  store?: StoreCart
  menu?: MenuLink[]
  eager?: boolean
}) => {
  const [cart, setCart] = useState<StoreCart>(
    store || { items: [], item_count: 0, total_price: 0, total_discount: 0, currency: 'BRL' },
  )
  const [panel, setPanel] = useState<'cart' | 'search' | 'menu' | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const refresh = async () => {
    setError('')
    setLoading(true)
    try {
      setCart(await cartRequest())
    } catch {
      setError('Não foi possível carregar sua sacola. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }
  const open = (next: typeof panel) => {
    trigger.current = document.activeElement as HTMLElement
    setPanel(next)
    if (next === 'cart') void refresh()
  }
  const close = () => setPanel(null)
  useEffect(() => {
    const updated = (event: Event) => {
      const { cart, open: shouldOpen } = (event as CustomEvent).detail
      setCart(cart)
      setError('')
      if (shouldOpen) {
        trigger.current = document.activeElement as HTMLElement
        setPanel('cart')
      }
    }
    const reload = () => {
      trigger.current = document.activeElement as HTMLElement
      setPanel('cart')
      void refresh()
    }
    document.addEventListener('liquidify-theme:cart', updated)
    document.addEventListener('liquidify-theme:cart-refresh', reload)
    return () => {
      document.removeEventListener('liquidify-theme:cart', updated)
      document.removeEventListener('liquidify-theme:cart-refresh', reload)
    }
  }, [])
  useEffect(() => {
    if (!panel) {
      dialog.current?.close()
      trigger.current?.focus()
      return
    }
    dialog.current?.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [panel])
  useEffect(() => {
    const handleTrigger = (event: MouseEvent) => {
      const target = (event.target as Element).closest<HTMLAnchorElement>('[data-open-panel]')
      if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const next = target.dataset.openPanel
      if (next !== 'search' && next !== 'cart' && next !== 'menu') return
      event.preventDefault()
      open(next)
    }
    document.addEventListener('click', handleTrigger)
    return () => document.removeEventListener('click', handleTrigger)
  }, [])
  useEffect(() => {
    document.querySelectorAll('[data-cart-count]').forEach((element) => {
      element.textContent = String(cart.item_count)
    })
  }, [cart.item_count])
  useEffect(() => {
    const dropdowns = Array.from(document.querySelectorAll<HTMLDetailsElement>('.nav-dropdown'))
    const closeOthers = (event: Event) => {
      const current = event.target as HTMLDetailsElement
      if (current.open)
        dropdowns.forEach((item) => {
          if (item !== current) item.open = false
        })
    }
    const outside = (event: MouseEvent) => {
      dropdowns.forEach((item) => {
        if (!item.contains(event.target as Node)) item.open = false
      })
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      dropdowns.forEach((item) => {
        if (!item.open) return
        const hadFocus = item.contains(document.activeElement)
        item.open = false
        if (hadFocus) item.querySelector('summary')?.focus()
      })
    }
    dropdowns.forEach((item) => item.addEventListener('toggle', closeOthers))
    document.addEventListener('click', outside)
    document.addEventListener('keydown', escape)
    return () => {
      dropdowns.forEach((item) => item.removeEventListener('toggle', closeOthers))
      document.removeEventListener('click', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [])
  const [configuredMenu] = useState<MenuLink[]>(() => {
    try {
      return (
        JSON.parse(
          document.querySelector('[data-liquidify-menu]')?.getAttribute('data-liquidify-menu') || '[]',
        ) || []
      )
    } catch {
      return []
    }
  })
  const links: MenuLink[] = configuredMenu.length
    ? configuredMenu
    : menu?.length
      ? menu
      : [
          ...Array.from(document.querySelectorAll<HTMLElement>('.desktop-nav [data-menu-item]')).map(
            (item) => {
              const overview = item.querySelector<HTMLAnchorElement>('[data-menu-overview]')
              return {
                title: (item.querySelector('summary') || item).textContent?.trim() || '',
                url: overview?.href || (item as HTMLAnchorElement).href,
                links: Array.from(item.querySelectorAll<HTMLAnchorElement>('[data-menu-child]')).map(
                  (child) => ({
                    title: child.textContent?.trim() || '',
                    url: child.href,
                  }),
                ),
              }
            },
          ),
        ]
  return (
    <>
      <dialog
        ref={dialog}
        className={`store-dialog ${panel === 'search' ? 'search-dialog' : ''}`}
        aria-labelledby="PanelTitle"
        onCancel={close}
        onClose={close}
        onClick={(event) => {
          if (event.target === dialog.current) {
            const rect = dialog.current!.getBoundingClientRect()
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              close()
          }
        }}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">LIQUIDIFY / SUA SELEÇÃO</p>
            <h2 id="PanelTitle">
              {panel === 'cart'
                ? `Sua sacola (${cart.item_count})`
                : panel === 'search'
                  ? 'Encontre seu próximo look.'
                  : 'Explore a Liquidify.'}
            </h2>
          </div>
          <button className="icon-button" aria-label="Fechar" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
        {panel === 'cart' && (
          <>
            {loading && (
              <p className="dialog-status" role="status">
                Atualizando sua sacola…
              </p>
            )}
            {error ? (
              <div className="dialog-status">
                <p role="alert">{error}</p>
                <button className="button button-dark" onClick={refresh}>
                  Tentar novamente
                </button>
                <a className="text-link" href={`${rootUrl()}cart`}>
                  Abrir página da sacola
                </a>
              </div>
            ) : (
              <CartContents cart={cart} onUpdate={setCart} onClose={close} />
            )}
          </>
        )}
        {panel === 'search' && (
          <div className="search-panel">
            <form action={`${rootUrl()}search`} method="get" role="search">
              <input type="hidden" name="type" value="product" />
              <label htmlFor="SearchQuery">Busque por um produto, categoria ou estilo</label>
              <div className="search-field">
                <input
                  id="SearchQuery"
                  name="q"
                  type="search"
                  value={query}
                  onInput={(event) => setQuery(event.currentTarget.value)}
                  placeholder="O seu próximo favorito…"
                  required
                  autoFocus
                />
                <button className="icon-button" type="submit" aria-label="Buscar">
                  <Icon name="arrow" />
                </button>
              </div>
            </form>
            <p className="eyebrow">COMECE POR AQUI</p>
            <a className="button button-outline" href={`${rootUrl()}collections/all`}>
              Explore todos os produtos ↗
            </a>
          </div>
        )}
        {panel === 'menu' && (
          <nav className="mobile-nav" aria-label="Menu principal">
            {links.map((link) =>
              link.links?.length ? (
                <details className="mobile-menu-group" key={link.url}>
                  <summary>
                    {link.title}
                    <span className="nav-chevron" aria-hidden="true" />
                  </summary>
                  <div className="mobile-submenu">
                    <a className="mobile-sub-link" href={link.url} onClick={close}>
                      Ver tudo em {link.title} ↗
                    </a>
                    {link.links.map((child) => (
                      <div key={child.url}>
                        <a className="mobile-sub-link" href={child.url} onClick={close}>
                          {child.title}
                        </a>
                        {child.links?.map((grandchild) => (
                          <a
                            className="mobile-sub-link mobile-grandchild"
                            href={grandchild.url}
                            onClick={close}
                            key={grandchild.url}
                          >
                            {grandchild.title}
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <a href={link.url} onClick={close} key={link.url}>
                  {link.title}
                  <span>↗</span>
                </a>
              ),
            )}
            <a href={window.LiquidifyTheme?.account || `${rootUrl()}account`}>
              Minha conta <Icon name="user" />
            </a>
          </nav>
        )}
      </dialog>
    </>
  )
}
