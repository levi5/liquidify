import { addItem } from '../lib/shopify'

const announcementCleanup = new WeakMap<HTMLElement, () => void>()

function prepareAnnouncements(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-announcement]').forEach((bar) => {
    if (announcementCleanup.has(bar)) return
    const messages = Array.from(bar.querySelectorAll<HTMLElement>('[data-announcement-message]')).filter(
      (item) => item.textContent?.trim(),
    )
    if (messages.length < 2) return
    let index = 0
    let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let hovered = false
    const pause = bar.querySelector<HTMLButtonElement>('[data-announcement-pause]')!
    const show = (step: number) => {
      index = (index + step + messages.length) % messages.length
      messages.forEach((message, position) => {
        message.hidden = position !== index
      })
    }
    const updatePause = () => {
      pause.textContent = paused ? '▶' : 'Ⅱ'
      pause.setAttribute('aria-pressed', String(paused))
      pause.setAttribute('aria-label', paused ? 'Reproduzir avisos' : 'Pausar avisos')
    }
    const next = () => show(1)
    const previous = () => show(-1)
    const toggle = () => {
      paused = !paused
      updatePause()
    }
    const enter = () => {
      hovered = true
    }
    const leave = () => {
      hovered = false
    }
    bar.querySelector('[data-announcement-next]')?.addEventListener('click', next)
    bar.querySelector('[data-announcement-prev]')?.addEventListener('click', previous)
    pause.addEventListener('click', toggle)
    bar.addEventListener('pointerenter', enter)
    bar.addEventListener('pointerleave', leave)
    updatePause()
    const timer = window.setInterval(() => {
      if (!paused && !hovered && !document.hidden && !bar.matches(':focus-within')) show(1)
    }, 4500)
    announcementCleanup.set(bar, () => {
      clearInterval(timer)
      bar.querySelector('[data-announcement-next]')?.removeEventListener('click', next)
      bar.querySelector('[data-announcement-prev]')?.removeEventListener('click', previous)
      pause.removeEventListener('click', toggle)
      bar.removeEventListener('pointerenter', enter)
      bar.removeEventListener('pointerleave', leave)
      announcementCleanup.delete(bar)
    })
  })
}

function prepare(root: ParentNode = document) {
  root.querySelectorAll<HTMLSelectElement>('select[data-selected]').forEach((select) => {
    select.value = select.dataset.selected || select.options[0]?.value || ''
  })
  prepareAnnouncements(root)
}

prepare()
document.addEventListener('shopify:section:load', () => prepare())
document.addEventListener('shopify:section:unload', (event) => {
  ;(event.target as HTMLElement)
    .querySelectorAll<HTMLElement>('[data-announcement]')
    .forEach((bar) => announcementCleanup.get(bar)?.())
})
document.addEventListener('submit', async (event) => {
  const form = event.target as HTMLFormElement
  if (!form.matches('[data-quick-add]')) return
  event.preventDefault()
  if (form.dataset.pending) return
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!
  const message = form.querySelector<HTMLElement>('.quick-add-message')!
  const id = Number(new FormData(form).get('id'))
  if (!id) return
  form.dataset.pending = 'true'
  button.disabled = true
  message.textContent = 'Adicionando…'
  try {
    await addItem(id, 1)
    message.textContent = 'Adicionado à sua sacola.'
  } catch (error) {
    message.textContent =
      error instanceof Error ? error.message : 'Não foi possível adicionar. Tente novamente.'
  } finally {
    delete form.dataset.pending
    button.disabled = false
  }
})
document.addEventListener('click', (event) => {
  const thumbnail = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-product-thumbnail]')
  if (!thumbnail) return
  const image = document.getElementById('ProductMainImage') as HTMLImageElement | null
  if (!image) return
  event.preventDefault()
  image.src = thumbnail.dataset.productThumbnail!
  image.alt = thumbnail.querySelector('img')?.alt || image.alt
  ;(image.parentElement as HTMLAnchorElement).href = thumbnail.href
})
document.addEventListener('liquidify-theme:variant-image', (event) => {
  const image = document.getElementById('ProductMainImage') as HTMLImageElement | null
  if (image) {
    image.src = (event as CustomEvent<string>).detail
    ;(image.parentElement as HTMLAnchorElement).href = image.src
  }
})
