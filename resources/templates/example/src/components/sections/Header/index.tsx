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
          aria-label={"'header.prev_announcement' | t"}
        >
          ‹
        </button>
        <div className={classNames(styles['announcement-messages'])} aria-live="off">
          <p data-announcement-message>
            {section.settings.announcement ? 'section.settings.announcement | escape' : "'header.announcement_1' | t"}
          </p>
          <p data-announcement-message hidden>
            {section.settings.announcement_2 ? 'section.settings.announcement_2 | escape' : "'header.announcement_2' | t"}
          </p>
          <p data-announcement-message hidden>
            {section.settings.announcement_3 ? 'section.settings.announcement_3 | escape' : "'header.announcement_3' | t"}
          </p>
        </div>
        <button
          className={classNames(styles['announcement-arrow'])}
          type="button"
          data-announcement-next
          aria-label={"'header.next_announcement' | t"}
        >
          ›
        </button>
        <button
          className={classNames(styles['announcement-pause'])}
          type="button"
          data-announcement-pause
          aria-label={"'header.pause_announcements' | t"}
          aria-pressed="false"
        >
          Ⅱ
        </button>
      </div>
      <header className={classNames(styles['site-header'], 'container')}>
        <a className="wordmark" href={routes.root_url} aria-label={"'header.home_page' | t"}>
          {'settings.brand_name | default: shop.name | escape'}
        </a>
        <nav className={classNames(styles['desktop-nav'])} aria-label={"'header.main_menu' | t"}>
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
                      {"'header.view_all_in' | t: title: link.title"}
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
                {"'header.new' | t"}
              </a>
              <details className="nav-dropdown" data-menu-item>
                <summary>
                  {"'header.women' | t"}<span className="nav-chevron" aria-hidden="true"></span>
                </summary>
                <div className="nav-submenu">
                  <a
                    className="nav-overview"
                    data-menu-overview
                    href="{{ section.settings.women_link | default: '/collections/all/feminino' }}"
                  >
                    {"'header.view_women' | t"}
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/feminino+blusas"
                  >
                    {"'header.women_tops' | t"}
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/feminino+jaquetas"
                  >
                    {"'header.women_jackets' | t"}
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/feminino+saias"
                  >
                    {"'header.women_skirts' | t"}
                  </a>
                </div>
              </details>
              <details className="nav-dropdown" data-menu-item>
                <summary>
                  {"'header.men' | t"}<span className="nav-chevron" aria-hidden="true"></span>
                </summary>
                <div className="nav-submenu">
                  <a
                    className="nav-overview"
                    data-menu-overview
                    href="{{ section.settings.men_link | default: '/collections/all/masculino' }}"
                  >
                    {"'header.view_men' | t"}
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/masculino+camisas"
                  >
                    {"'header.men_shirts' | t"}
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/masculino+jaquetas"
                  >
                    {"'header.men_jackets' | t"}
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/masculino+alfaiataria"
                  >
                    {"'header.men_tailoring' | t"}
                  </a>
                </div>
              </details>
              <details className="nav-dropdown" data-menu-item>
                <summary>
                  {"'header.accessories' | t"}<span className="nav-chevron" aria-hidden="true"></span>
                </summary>
                <div className="nav-submenu">
                  <a
                    className="nav-overview"
                    data-menu-overview
                    href="{{ section.settings.accessories_link | default: '/collections/all/acessorios' }}"
                  >
                    {"'header.view_accessories' | t"}
                  </a>
                  <a data-menu-child href="{{ routes.root_url }}collections/all/bolsas">
                    {"'header.bags' | t"}
                  </a>
                  <a
                    data-menu-child
                    href="{{ routes.root_url }}collections/all/calcados"
                  >
                    {"'header.shoes' | t"}
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
            aria-label={"'header.search_products' | t"}
          >
            <RenderSnippet slot={ThemeIcon} name="search" />
          </a>
          <a
            href={routes.account_url}
            className="icon-button account-link"
            aria-label={"'header.account_login' | t"}
          >
            <RenderSnippet slot={ThemeIcon} name="user" />
          </a>
          <a
            href={routes.cart_url}
            className="icon-button bag-button"
            data-open-panel="cart"
            aria-label={"'header.open_bag' | t"}
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
            aria-label={"'header.open_menu' | t"}
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
  name: 't:sections.header.name',
  settings: [
    {
      type: 'text',
      id: 'announcement',
      label: 't:sections.header.settings.announcement.label',
      default: '',
    },
    {
      type: 'text',
      id: 'announcement_2',
      label: 't:sections.header.settings.announcement_2.label',
      default: '',
    },
    {
      type: 'text',
      id: 'announcement_3',
      label: 't:sections.header.settings.announcement_3.label',
      default: '',
    },
    { type: 'link_list', id: 'menu', label: 't:sections.header.settings.menu.label' },
    { type: 'url', id: 'women_link', label: 't:sections.header.settings.women_link.label' },
    { type: 'url', id: 'men_link', label: 't:sections.header.settings.men_link.label' },
    { type: 'url', id: 'accessories_link', label: 't:sections.header.settings.accessories_link.label' },
  ],
}
