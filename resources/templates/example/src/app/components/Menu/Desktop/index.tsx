'use snippets'


import type { LinksType } from '../../../../types/components/menu'


export const MenuDesktop = ({ options }: { options: LinksType }) => {

"use dom"
  document.addEventListener('click', (event) => {
    const target = event.target as Element
    if (!target.closest('[data-menu-item]')) {
      document
        .querySelectorAll('details[name="nav-menu"][open]')
        .forEach((d) => d.removeAttribute('open'))
    }
  })

  return (
    <>
      {options.map((link) =>
        link.links.length > 0 ? (
            <details className='nav-dropdown' data-menu-item name='nav-menu'>
              <summary>
                {link.title}
                <span className='nav-chevron' aria-hidden='true'></span>
              </summary>
              <div className='nav-submenu'>
                <a className='nav-overview' data-menu-overview href={link.url}>
                  {link.title} ↗
                </a>
                {link.links.map((child) => (
                  <div className='nav-child-group'>
                    <a className='nav-child' data-menu-child href={child.url}>
                      {child.title}
                    </a>
                    {child.links.map((grandchild) => (
                      <a className='nav-grandchild' data-menu-grandchild href={grandchild.url}>
                        {grandchild.title}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          ) : (
            <a data-menu-item href={link.url}>
              {link.title}
            </a>
          ),
        )}
    </>
  )
}