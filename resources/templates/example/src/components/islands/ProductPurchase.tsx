'use react'

import { useState } from 'preact/hooks'
import { addItem, moneyText, rootUrl, translate } from '../../lib/shopify'

interface Variant {
  id: number
  title: string
  available: boolean
  price: number
  compare_at_price: number | null
  options: string[]
  featured_image?: { src: string }
}
interface PurchaseProduct {
  variants: Variant[]
  options: string[]
  requires_selling_plan?: boolean
}

export const ProductPurchase = ({
  store,
  selected,
}: {
  store?: PurchaseProduct
  selected?: number
  eager?: boolean
  children?: unknown
}) => {
  const first =
    store.variants.find((v) => v.id === selected) ||
    store.variants.find((v) => v.available) ||
    store.variants[0]
  const [options, setOptions] = useState(first?.options || [])
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const variant = store.variants.find((v) => v.options.every((option, index) => option === options[index]))
  const selectOption = (index: number, value: string) => {
    const next = options.map((option, i) => (i === index ? value : option))
    setOptions(next)
    setMessage('')
    setError('')
    const match = store.variants.find((v) => v.options.every((option, i) => option === next[i]))
    const url = new URL(window.location.href)
    if (match) url.searchParams.set('variant', String(match.id))
    else url.searchParams.delete('variant')
    window.history.replaceState({}, '', url)
    if (match?.featured_image?.src)
      document.dispatchEvent(
        new CustomEvent('liquidify-theme:variant-image', { detail: match.featured_image.src }),
      )
  }
  const submit = async (event: Event) => {
    event.preventDefault()
    if (!variant?.available || busy || store.requires_selling_plan) return
    setBusy(true)
    setMessage('')
    setError('')
    try {
      await addItem(variant.id, quantity)
      setMessage(translate('products_added_to_bag', 'Added to your bag.'))
    } catch (error) {
      setError(
        error instanceof Error ? error.message : translate('products_add_error', 'Could not add the product.'),
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="purchase-form" method="post" action={`${rootUrl()}cart/add`} onSubmit={submit}>
      <div className="detail-price" aria-live="polite">
        {variant ? (
          <>
            <strong>{moneyText(variant.price)}</strong>
            {variant.compare_at_price && variant.compare_at_price > variant.price && (
              <s>{moneyText(variant.compare_at_price)}</s>
            )}
          </>
        ) : (
          <span>{translate('products_combination_unavailable', 'Combination unavailable')}</span>
        )}
      </div>
      {!(store.variants.length === 1 && first.title === 'Default Title') &&
        store.options.map((name, index) => (
          <fieldset className="variant-group" key={name} disabled={busy}>
            <legend>
              {name}: <strong>{options[index]}</strong>
            </legend>
            <div className="variant-options">
              {Array.from(new Set(store.variants.map((v) => v.options[index]))).map((value) => {
                const matching = store.variants.filter(
                  (candidate) =>
                    candidate.options[index] === value &&
                    candidate.options.every(
                      (option, optionIndex) => optionIndex === index || option === options[optionIndex],
                    ),
                )
                const unavailable =
                  matching.length === 0 || !matching.some((candidate) => candidate.available)
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={options[index] === value}
                    aria-label={`${value}${unavailable ? translate('products_unavailable_suffix', ' — unavailable in this combination') : ''}`}
                    style={
                      unavailable ? { color: 'var(--muted)', textDecoration: 'line-through' } : undefined
                    }
                    onClick={() => selectOption(index, value)}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}
      <input type="hidden" name="id" value={variant?.id || ''} />
      <label htmlFor="ProductQuantity">{translate('products_quantity', 'Quantity')}</label>
      <div className="purchase-actions">
        <div className="quantity-control">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={busy || quantity <= 1}
            aria-label={translate('products_decrease_quantity', 'Decrease quantity')}
          >
            −
          </button>
          <input
            id="ProductQuantity"
            type="number"
            name="quantity"
            min="1"
            step="1"
            value={quantity}
            onInput={(event) => setQuantity(Math.max(1, Math.floor(Number(event.currentTarget.value)) || 1))}
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            disabled={busy}
            aria-label={translate('products_increase_quantity', 'Increase quantity')}
          >
            +
          </button>
        </div>
        <button
          className="button button-dark product-add-button"
          style={{ width: '100%', maxWidth: '320px', flex: '0 1 320px' }}
          type="submit"
          disabled={!variant?.available || busy || store.requires_selling_plan}
        >
          {busy
            ? translate('products_adding', 'Adding…')
            : !variant
              ? translate('products_unavailable', 'Unavailable')
              : !variant.available
                ? translate('products_soldout', 'Sold out')
                : translate('products_add_to_bag', 'Add to bag')}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      {store.requires_selling_plan && (
        <p className="form-error">
          {translate('products_selling_plan', 'This product requires a subscription plan. Contact the store to choose your plan.')}
        </p>
      )}
      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
