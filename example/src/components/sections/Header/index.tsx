'use sections'

import { RenderSnippet } from 'liquidify'
import classNames from 'classnames'
import { Storefront } from '../../islands/Storefront'
import { ThemeIcon } from '../../snippets/ThemeIcon'

import styles from './styles.css'

export const Header = () => {
  return (
    <div className={classNames(styles['header-shell'])}>
      <div className={classNames(styles.announcement)} data-announcement>
        <button
          className={classNames(styles['announcement-arrow'])}
          type="button"
          data-announcement-prev
          aria-label="Aviso anterior"
        >
          ‹
        </button>
        <div className={classNames(styles['announcement-messages'])} aria-live="off">
          <p data-announcement-message>{'section.settings.announcement | escape'}</p>
          <p data-announcement-message hidden>
            {'section.settings.announcement_2 | escape'}
          </p>
          <p data-announcement-message hidden>
            {'section.settings.announcement_3 | escape'}
          </p>
        </div>
        <button
          className={classNames(styles['announcement-arrow'])}
          type="button"
          data-announcement-next
          aria-label="Próximo aviso"
        >
          ›
        </button>
        <button
          className={classNames(styles['announcement-pause'])}
          type="button"
          data-announcement-pause
          aria-label="Pausar avisos"
          aria-pressed="false"
        >
          Ⅱ
        </button>
      </div>
      <header className={classNames(styles['site-header'], 'container')}>
        <a className="wordmark" href={routes.root_url} aria-label="Liquidify — página inicial">
          {'settings.brand_name | default: shop.name | escape'}
        </a>
        <nav className={classNames(styles['desktop-nav'])} aria-label="Menu principal">
          {section.settings.menu.links.length > 0 ? (
            section.settings.menu.links.map((link) =>
              link.links.length > 0 ? (
                <details className="nav-dropdown" data-menu-item>
                  <summary>
                    {'link.title | escape'}
                    <span className="nav-chevron" aria-hidden="true"></span>
                  </summary>
                  <div className="nav-submenu">
                    <a className="nav-overview" data-menu-overview href={link.url}>
                      Ver tudo em {'link.title | escape'} ↗
                    </a>
                    {link.links.map((child) => (
                      <div>
                        <a data-menu-child href={child.url}>
                          {'child.title | escape'}
                        </a>
                        {child.links.map((grandchild) => (
                          <a className="nav-grandchild" href={grandchild.url}>
                            {'grandchild.title | escape'}
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <a data-menu-item href={link.url}>
                  {'link.title | escape'}
                </a>
              ),
            )
          ) : (
            <>
              <a data-menu-item href="{{ routes.root_url }}collections/all?sort_by=created-descending">
                Novidades
              </a>
              <details className="nav-dropdown" data-menu-item>
                <summary>
                  Feminino<span className="nav-chevron" aria-hidden="true"></span>
                </summary>
                <div className="nav-submenu">
                  <a
                    className="nav-overview"
                    data-menu-overview
                    href="{{ section.settings.women_link | default: '/collections/all/feminino' }}"
                  >
                    Ver coleção feminina ↗
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/feminino+blusas"
                  >
                    Blusas e camisetas
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/feminino+jaquetas"
                  >
                    Jaquetas
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/feminino+saias"
                  >
                    Saias e conjuntos
                  </a>
                </div>
              </details>
              <details className="nav-dropdown" data-menu-item>
                <summary>
                  Masculino<span className="nav-chevron" aria-hidden="true"></span>
                </summary>
                <div className="nav-submenu">
                  <a
                    className="nav-overview"
                    data-menu-overview
                    href="{{ section.settings.men_link | default: '/collections/all/masculino' }}"
                  >
                    Ver coleção masculina ↗
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/masculino+camisas"
                  >
                    Camisas
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/masculino+jaquetas"
                  >
                    Jaquetas
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/masculino+alfaiataria"
                  >
                    Alfaiataria
                  </a>
                </div>
              </details>
              <details className="nav-dropdown" data-menu-item>
                <summary>
                  Acessórios<span className="nav-chevron" aria-hidden="true"></span>
                </summary>
                <div className="nav-submenu">
                  <a
                    className="nav-overview"
                    data-menu-overview
                    href="{{ section.settings.accessories_link | default: '/collections/all/acessorios' }}"
                  >
                    Ver todos os acessórios ↗
                  </a>
                  <a data-menu-child href="{{ routes.root_url }}collections/all/bolsas">
                    Bolsas
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/calcados"
                  >
                    Calçados
                  </a>
                </div>
              </details>
            </>
          )}
        </nav>
        <div className={classNames(styles['header-actions'])}>
          <a
            href={routes.search_url}
            className="icon-button"
            data-open-panel="search"
            aria-label="Buscar produtos"
          >
            <RenderSnippet slot={ThemeIcon} name="search" />
          </a>
          <a
            href={routes.account_url}
            className="icon-button account-link"
            aria-label="Entrar na minha conta"
          >
            <RenderSnippet slot={ThemeIcon} name="user" />
          </a>
          <a
            href={routes.cart_url}
            className="icon-button bag-button"
            data-open-panel="cart"
            aria-label="Abrir sacola"
          >
            <span
              className="bag-icon"
              style={{ position: 'relative', display: 'inline-flex', flexShrink: '0' }}
            >
              <RenderSnippet slot={ThemeIcon} name="bag" />
              <span
                className="cart-count"
                data-cart-count
                aria-live="polite"
                aria-atomic="true"
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-9px',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  border: '2px solid var(--paper)',
                  fontSize: '9px',
                  fontWeight: '600',
                  pointerEvents: 'none',
                }}
              >
                {cart.item_count}
              </span>
            </span>
          </a>
          <a
            href={routes.all_products_collection_url}
            className="icon-button mobile-menu-trigger"
            data-open-panel="menu"
            aria-label="Abrir menu"
          >
            <RenderSnippet slot={ThemeIcon} name="menu" />
          </a>
        </div>
        <div
          className="island-bridge"
          data-liquid-store="{{ cart | json | escape }}"
          data-liquidify-menu="{{ section.settings.menu.links | json | escape }}"
        >
          <Storefront eager />
        </div>
      </header>
    </div>
  )
}

export const schema = {
  name: 'Cabeçalho e avisos',
  settings: [
    {
      type: 'text',
      id: 'announcement',
      label: 'Aviso 1',
      default: 'SEU ESTILO, SUAS REGRAS. CONHEÇA A NOVA COLEÇÃO.',
    },
    {
      type: 'text',
      id: 'announcement_2',
      label: 'Aviso 2',
      default: 'FEMININO, MASCULINO E ACESSÓRIOS EM UM SÓ LUGAR.',
    },
    {
      type: 'text',
      id: 'announcement_3',
      label: 'Aviso 3',
      default: 'ESCOLHA SEUS FAVORITOS. COMPRE COM SEGURANÇA.',
    },
    { type: 'link_list', id: 'menu', label: 'Menu personalizado (opcional)' },
    { type: 'url', id: 'women_link', label: 'Link Feminino' },
    { type: 'url', id: 'men_link', label: 'Link Masculino' },
    { type: 'url', id: 'accessories_link', label: 'Link Acessórios' },
  ],
}
