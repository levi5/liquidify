'use sections'

import { FormBlock } from 'liquidify'
import classNames from 'classnames'

import styles from './styles.css'

export const Footer = () => {
  return (
    <footer className={classNames(styles['site-footer'])}>
      <div className={classNames(styles.newsletter, 'container')}>
        <div>
          <p className="eyebrow">{"'footer.eyebrow' | t"}</p>
          <h2>
            {"'footer.newsletter_title_1' | t"}
            <br />
            {"'footer.newsletter_title_2' | t"}
          </h2>
        </div>
        <div className={classNames(styles['newsletter-form'])}>
          <FormBlock name="customer" id="FooterNewsletter">
            <input type="hidden" name="contact[tags]" value="newsletter" />
            <label htmlFor="NewsletterEmail">{"'footer.email_label' | t"}</label>
            <div className={classNames(styles['email-field'])}>
              <input
                id="NewsletterEmail"
                type="email"
                name="contact[email]"
                placeholder="email@example.com"
                autoComplete="email"
                required
              />
              <button type="submit" aria-label={"'footer.subscribe' | t"}>
                ↗
              </button>
            </div>
            {form['posted_successfully?'] && <p role="status">{"'footer.subscribed' | t"}</p>}
            {form.errors && <div role="alert">{'form.errors | default_errors'}</div>}
            <p className={classNames(styles['newsletter-note'])}>{"'footer.newsletter_note' | t"}</p>
          </FormBlock>
        </div>
      </div>
      <div className={classNames(styles['footer-main'], 'container')}>
        <div className={classNames(styles['footer-brand'])}>
          <a className="wordmark" href={routes.root_url}>
            {'settings.brand_name | default: shop.name | escape'}
          </a>
          <p>
            {"'footer.tagline_1' | t"}
            <br />
            {"'footer.tagline_2' | t"}
          </p>
        </div>
        <div>
          <h3>{"'footer.explore' | t"}</h3>
          <a href={routes.all_products_collection_url}>{"'footer.all_products' | t"}</a>
          <a href={routes.collections_url}>{"'footer.our_collections' | t"}</a>
          <a href="{{ routes.root_url }}#essencia">{"'footer.our_essence' | t"}</a>
        </div>
        <div>
          <h3>{"'footer.help_title' | t"}</h3>
          <a href={routes.account_url}>{"'footer.my_account' | t"}</a>
          <a href={routes.cart_url}>{"'footer.my_bag' | t"}</a>
          <a href="mailto:{{ shop.email | escape }}">{"'footer.contact_us' | t"}</a>
        </div>
        <div>
          <h3>{"'footer.info_title' | t"}</h3>
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
          ©&nbsp;{'"now" | date: "%Y"'}&nbsp;{'settings.brand_name | default: shop.name | escape'}.{"'footer.copyright' | t"}
        </span>
        <span>
          {"'brand.eyebrow' | t"} <span aria-hidden="true">↗</span>
        </span>
        <span>{"'footer.secure_payment' | t"}</span>
      </div>
    </footer>
  )
}
export const schema = {
  name: 't:sections.footer.name',
  settings: [
    {
      type: 'link_list',
      id: 'menu',
      label: 't:sections.footer.settings.menu.label',
      default: 'footer',
    },
  ],
}
