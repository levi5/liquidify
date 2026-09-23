'use sections'

import { FormBlock } from 'liquidify'
import classNames from 'classnames'

import styles from './styles.css'

export const Footer = () => {
  return (
    <footer className={classNames(styles['site-footer'])}>
      <div className={classNames(styles.newsletter, 'container')}>
        <div>
          <p className="eyebrow">VAMOS FICAR MAIS PERTO?</p>
          <h2>
            Entre para a nossa lista.
            <br />
            Fique por dentro do próximo drop.
          </h2>
        </div>
        <div className={classNames(styles['newsletter-form'])}>
          <FormBlock name="customer" id="FooterNewsletter">
            <input type="hidden" name="contact[tags]" value="newsletter" />
            <label htmlFor="NewsletterEmail">Seu melhor e-mail</label>
            <div className={classNames(styles['email-field'])}>
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
            <p className={classNames(styles['newsletter-note'])}>Novidades, lançamentos e inspiração. Cancele quando quiser.</p>
          </FormBlock>
        </div>
      </div>
      <div className={classNames(styles['footer-main'], 'container')}>
        <div className={classNames(styles['footer-brand'])}>
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
            <a href={link.url}>{link.title}</a>
          ))}
          {shop.policies?.map((policy) => (
            <a key={policy.url} href={policy.url}>
              {policy.title}
            </a>
          ))}
        </div>
      </div>
      <div className={classNames(styles['footer-bottom'], 'container')}>
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
