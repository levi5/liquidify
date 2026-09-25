'use sections'

import { CartPage } from '../../islands/CartPage'

import styles from './styles.css'

export const MainCart = () => {
  return (
    <section className="cart-page container section-space">
      <div className="page-heading">
        <p className="eyebrow">{"'cart.eyebrow' | t"}</p>
        <h1>{"'cart.title' | t"}</h1>
      </div>
      <div className="island-bridge" data-liquid-store="{{ cart | json | escape }}">
        <CartPage eager>
          {cart.item_count > 0 ? (
            <form method="post" action={routes.cart_url} className="fallback-cart">
              {cart.items.map((item) => (
                <div className="cart-line">
                  <a href={item.url}>{'item.title | escape'}</a>
                  <label>
                    {"'cart.quantity' | t"}
                    <input type="number" name="updates[]" value={item.quantity} min="0" />
                  </label>
                  <span>{'item.final_line_price | money'}</span>
                </div>
              ))}
              <p className="detail-price">{"'cart.subtotal' | t"}: {money(cart.total_price)}</p>
              <button className="button button-outline" name="update" type="submit">
                {"'cart.update_bag' | t"}
              </button>
              <button className="button button-dark" type="submit" name="checkout">
                {"'cart.checkout' | t"}
              </button>
            </form>
          ) : (
            <div className="empty-state">
              <h2>{"'cart.empty_title' | t"}</h2>
              <a className="button button-dark" href={routes.all_products_collection_url}>
                {"'cart.explore_store' | t"}
              </a>
            </div>
          )}
        </CartPage>
      </div>
    </section>
  )
}
export const schema = {
  name: 't:sections.main_cart.name',
  settings: [],
}
