'use sections'

import { FormBlock } from 'liquidify'
export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="newsletter container">
        <div>
          <p className="eyebrow">VAMOS FICAR MAIS PERTO?</p>
          <h2>
            Entre para a nossa lista.
            <br />
            Fique por dentro do próximo drop.
          </h2>
        </div>
        <div className="newsletter-form">
          <FormBlock name="customer" id="FooterNewsletter">
            <input type="hidden" name="contact[tags]" value="newsletter" />
            <label htmlFor="NewsletterEmail">Seu melhor e-mail</label>
            <div className="email-field">
              <input
                id="NewsletterEmail"
                type="email"
                name="contact[email]"
                placeholder="voce@email.com"
                autoComplete="email"
                required
              />
              <button type="submit" aria-label="Inscrever-se na newsletter">
                ↗
              </button>
            </div>
            {form['posted_successfully?'] && <p role="status">Você está na lista. Até o próximo encontro!</p>}
            {form.errors && <div role="alert">{'form.errors | default_errors'}</div>}
            <p className="newsletter-note">Novidades, lançamentos e inspiração. Cancele quando quiser.</p>
          </FormBlock>
        </div>
      </div>
      <div className="footer-main container">
        <div className="footer-brand">
          <a className="wordmark" href={routes.root_url}>
            {'settings.brand_name | default: shop.name | escape'}
          </a>
          <p>
            Seu estilo. Suas regras.
            <br />
            Isso é Liquidify.
          </p>
        </div>
        <div>
          <h3>Explore</h3>
          <a href={routes.all_products_collection_url}>Todos os produtos</a>
          <a href={routes.collections_url}>Nossas coleções</a>
          <a href="{{ routes.root_url }}#essencia">Nossa essência</a>
        </div>
        <div>
          <h3>Podemos ajudar?</h3>
          <a href={routes.account_url}>Minha conta</a>
          <a href={routes.cart_url}>Minha sacola</a>
          <a href="mailto:{{ shop.email | escape }}">Fale com a gente</a>
        </div>
        <div>
          <h3>Informações</h3>
          {section.settings.menu.links.map((link) => (
            <a href={link.url}>{'link.title | escape'}</a>
          ))}
          {'{% for policy in shop.policies %}'}
          <a href="{{ policy.url }}">{'policy.title | escape'}</a>
          {'{% endfor %}'}
        </div>
      </div>
      <div className="footer-bottom container">
        <span>
          ©&nbsp;{'"now" | date: "%Y"'}&nbsp;{'settings.brand_name | default: shop.name | escape'}. Todos os
          direitos reservados.
        </span>
        <span>
          LIQUIDIFY / EVERYDAY CULTURE <span aria-hidden="true">↗</span>
        </span>
        <span>Pagamento seguro · Shopify</span>
      </div>
    </footer>
  )
}
export const schema = {
  name: 'Rodapé e newsletter',
  settings: [
    {
      type: 'link_list',
      id: 'menu',
      label: 'Menu de informações',
      default: 'footer',
    },
  ],
}
