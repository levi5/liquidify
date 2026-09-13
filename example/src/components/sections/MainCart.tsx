'use sections'

import { CartPage } from '../islands/CartPage'
export const MainCart = () => {
  return (
    <section className="cart-page container section-space">
      <div className="page-heading">
        <p className="eyebrow">SUAS PRÓXIMAS BOAS ESCOLHAS</p>
        <h1>Minha sacola.</h1>
      </div>
      <div className="island-bridge" data-liquid-store="{{ cart | json | escape }}">
        <CartPage eager>
          {cart.item_count > 0 ? (
            <form method="post" action={routes.cart_url} className="fallback-cart">
              {cart.items.map((item) => (
                <div className="cart-line">
                  <a href={item.url}>{'item.title | escape'}</a>
                  <label>
                    Quantidade
                    <input type="number" name="updates[]" value={item.quantity} min="0" />
                  </label>
                  <span>{'item.final_line_price | money'}</span>
                </div>
              ))}
              <p className="detail-price">Subtotal: {money(cart.total_price)}</p>
              <button className="button button-outline" name="update" type="submit">
                Atualizar sacola
              </button>
              <button className="button button-dark" type="submit" name="checkout">
                Finalizar compra ↗
              </button>
            </form>
          ) : (
            <div className="empty-state">
              <h2>Sua sacola ainda está vazia.</h2>
              <a className="button button-dark" href={routes.all_products_collection_url}>
                Explorar a loja ↗
              </a>
            </div>
          )}
        </CartPage>
      </div>
    </section>
  )
}
export const schema = {
  name: 'Sacola',
  settings: [],
}
