import React from 'preact/compat'
import { useState } from 'preact/hooks'
import { announceCart, cartRequest, moneyText, rootUrl, type StoreCart } from '../lib/shopify'

export const CartContents = ({
  cart,
  onUpdate,
  onClose,
}: {
  cart: StoreCart
  onUpdate: (cart: StoreCart) => void
  onClose?: () => void
}) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const change = async (key: string, quantity: number) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const next = await cartRequest('cart/change.js', { id: key, quantity })
      onUpdate(next)
      announceCart(next)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="cart-contents" aria-busy={busy}>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {cart.item_count === 0 ? (
        <div className="empty-state">
          <span className="empty-spark" aria-hidden="true">
            ✳
          </span>
          <h3>Your next look starts here.</h3>
          <p>Your bag is empty. Explore the collection and add your favorites.</p>
          <a className="button button-dark" href={`${rootUrl()}collections/all`} onClick={onClose}>
            Explore the store <span>↗</span>
          </a>
        </div>
      ) : (
        <>
          <div className="cart-lines">
            {cart.items.map((item) => (
              <article className="cart-line" key={item.key}>
                <a href={item.url}>
                  {item.image && <img src={item.image} alt={item.product_title} width="110" height="132" />}
                </a>
                <div className="cart-line-info">
                  <a href={item.url}>
                    <h3>{item.product_title}</h3>
                  </a>
                  {item.variant_title && item.variant_title !== 'Default Title' && (
                    <p>{item.variant_title}</p>
                  )}
                  {item.selling_plan_allocation && <p>{item.selling_plan_allocation.selling_plan.name}</p>}
                  {Object.entries(item.properties || {})
                    .filter(([key, value]) => !key.startsWith('_') && value)
                    .map(([key, value]) => (
                      <p key={key}>
                        {key}: {value}
                      </p>
                    ))}
                  <strong>{moneyText(item.final_line_price, cart.currency)}</strong>
                  <div className="cart-line-actions">
                    <div className="quantity-control">
                      <button
                        disabled={busy || item.quantity <= 1}
                        onClick={() => change(item.key, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.product_title}`}
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        disabled={busy}
                        onClick={() => change(item.key, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.product_title}`}
                      >
                        +
                      </button>
                    </div>
                    <button className="remove-button" disabled={busy} onClick={() => change(item.key, 0)}>
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="cart-summary">
            {cart.cart_level_discount_applications?.map((discount) => (
              <p className="summary-row" key={discount.title}>
                <span>{discount.title}</span>
                <span>−{moneyText(discount.total_allocated_amount, cart.currency)}</span>
              </p>
            ))}
            <p className="summary-row">
              <strong>Subtotal</strong>
              <strong>{moneyText(cart.total_price, cart.currency)}</strong>
            </p>
            <p className="muted">Shipping and taxes calculated at checkout.</p>
            <form method="post" action={`${rootUrl()}cart`}>
              <button className="button button-dark full-width" type="submit" name="checkout" disabled={busy}>
                Checkout <span>↗</span>
              </button>
            </form>
            {onClose && (
              <a className="cart-page-link" href={`${rootUrl()}cart`}>
                View my bag
              </a>
            )}
            <p className="secure-note">Secure payment with Shopify</p>
          </div>
        </>
      )}
    </div>
  )
}
