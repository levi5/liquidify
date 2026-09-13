'use react'

import { useLayoutEffect, useRef, useState } from 'preact/hooks'
import { Icon } from '../../ui/Icon'

export const FilterDrawer = ({ sectionId }: { sectionId: string; eager?: boolean }) => {
  const dialog = useRef<HTMLDialogElement>(null)
  const contents = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const close = () => dialog.current?.close()

  useLayoutEffect(() => {
    const form = document.getElementById(`CollectionFilters-${sectionId}`) as HTMLFormElement | null
    const sidebar = form?.closest<HTMLElement>('.catalog-sidebar')
    const source = sidebar?.querySelector<HTMLElement>('[data-filter-source]')
    const filters = source?.querySelector<HTMLDetailsElement>('.sidebar-sections')
    const modal = dialog.current
    const body = contents.current
    if (!form || !sidebar || !source || !filters || !modal || !body) return

    // Keep one native Shopify form as the viewport changes, including unsent selections.
    const mobile = window.matchMedia('(max-width: 680px)')
    const moveFilters = () => {
      if (mobile.matches) {
        filters.open = true
        body.appendChild(filters)
      } else {
        modal.close()
        source.appendChild(filters)
      }
    }
    const sort = form.elements.namedItem('sort_by') as HTMLSelectElement | null
    const applySort = () => form.requestSubmit()
    sort?.addEventListener('change', applySort)
    mobile.addEventListener('change', moveFilters)
    moveFilters()
    sidebar.setAttribute('data-drawer-ready', '')
    return () => {
      modal.close()
      source.appendChild(filters)
      sidebar.removeAttribute('data-drawer-ready')
      mobile.removeEventListener('change', moveFilters)
      sort?.removeEventListener('change', applySort)
    }
  }, [sectionId])

  useLayoutEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="button button-outline mobile-filter-trigger"
        aria-haspopup="dialog"
        aria-controls={`FilterDrawer-${sectionId}`}
        aria-expanded={open}
        onClick={() => {
          dialog.current?.showModal()
          setOpen(true)
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3 7h4m4 0h10M3 17h10m4 0h4M7 4v6m6 4v6" />
        </svg>
        Filtrar produtos
      </button>
      <dialog
        ref={dialog}
        id={`FilterDrawer-${sectionId}`}
        className="collection-filter-dialog"
        aria-labelledby={`FilterTitle-${sectionId}`}
        onClose={() => {
          setOpen(false)
          if (window.matchMedia('(max-width: 680px)').matches) trigger.current?.focus()
        }}
        onClick={(event) => {
          if (event.target !== dialog.current) return
          const rect = dialog.current.getBoundingClientRect()
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            close()
        }}
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">REFINE SUA SELEÇÃO</p>
            <h2 id={`FilterTitle-${sectionId}`}>Filtros</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Fechar filtros" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
        <div className="filter-drawer-body" ref={contents} />
      </dialog>
    </>
  )
}
