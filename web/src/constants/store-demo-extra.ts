
export const CATALOG_TSX = `'use snippets'

import { PaginateByLiquid, RenderSnippet } from 'liquidex'
import { escape } from 'liquidex/helpers'
import classNames from 'classnames'

import { Card } from '../Card'
import { BaseEmptyState } from '../Base/EmptyState'

import styles from './styles.css'

type CatalogItem = {
  id: number
}

type PaginatePart = {
  title: string
  url: string
  is_link: boolean
}

export const Catalog = ({ by = 12 }: { by?: number }) => {
  return (
    <PaginateByLiquid by={by} collection={collection.products}>
      {collection.products.length > 0 ? (
        <div className={classNames(styles['product-grid'])}>
          {collection.products.map((item: CatalogItem) => (
            <RenderSnippet key={item.id} slot={Card} item={item} />
          ))}
        </div>
      ) : (
        <BaseEmptyState
          heading={"'collection.empty_heading' | t"}
          text={"'collection.empty_text' | t"}
          actionLabel={"'collection.view_all' | t"}
        />
      )}

      {paginate.pages > 1 && (
        <div className={classNames(styles['pagination-footer'])}>
          <p className={classNames(styles['pagination-caption'])}>
            {"'pagination.page_of' | t: current_page: paginate.current_page, pages: paginate.pages"}
          </p>
          <nav className={classNames(styles.pagination)} aria-label={"'pagination.label' | t"}>
            {paginate.previous && (
              <a className={classNames(styles['pagination-direction'])} href={paginate.previous.url} aria-label={"'pagination.prev' | t"} rel='prev'>
                ← <span>{"'pagination.previous' | t"}</span>
              </a>
            )}
            {paginate.parts.map((part: PaginatePart) => {
              const page_number = Number(part.title)
              return part.is_link ? (
                <a href={part.url} aria-label={"'pagination.go_to' | t: page: part.title"}>
                  {escape(part.title)}
                </a>
              ) : page_number == paginate.current_page ? (
                <span aria-current='page' aria-label={"'pagination.current' | t: page: part.title"}>
                  {escape(part.title)}
                </span>
              ) : (
                <span className={classNames(styles['pagination-ellipsis'])} aria-hidden='true'>
                  {escape(part.title)}
                </span>
              )
            })}
            {paginate.next && (
              <a className={classNames(styles['pagination-direction'])} href={paginate.next.url} aria-label={"'pagination.next' | t"} rel='next'>
                <span>{"'pagination.next_short' | t"}</span> →
              </a>
            )}
          </nav>
        </div>
      )}
    </PaginateByLiquid>
  )
}`;

export const CATALOG_LIQUID = `<!-- snippets/catalog.liquid (gerado — markup completo; {% stylesheet %} na aba CSS) -->
{% if by == nil %}
  {% assign by = 12 %}
{% endif %}

{% paginate collection.products by by %}
  {% if collection.products.size > 0 %}
    <div class="product-grid">
      {% for item in collection.products %}
        {% render 'card', key: item.id, item: item %}
      {% endfor %}
    </div>
  {% else %}
    <react-island style="display: flex;" component="BaseEmptyState">
      <script type="application/json" data-react-props>
        {"heading": "'collection.empty_heading' | t", "text": "'collection.empty_text' | t", "actionLabel": "'collection.view_all' | t"}
      </script>
    </react-island>
  {% endif %}
  {% if paginate.pages > 1 %}
    <div class="pagination-footer">
      <p class="pagination-caption">
        {{ 'pagination.page_of' | t: current_page: paginate.current_page, pages: paginate.pages }}
      </p>
      <nav class="pagination" aria-label="{{ 'pagination.label' | t }}">
        {% if paginate.previous %}
          <a class="pagination-direction" href="{{ paginate.previous.url }}" aria-label="{{ 'pagination.prev' | t }}" rel="prev">
            ← <span>{{ 'pagination.previous' | t }}</span>
          </a>
        {% endif %}
        {% for part in paginate.parts %}
          {% assign page_number = part.title | plus: 0 %}
          {% if part.is_link %}
            <a href="{{ part.url }}" aria-label="{{ 'pagination.go_to' | t: page: part.title }}">
              {{ part.title | escape }}
            </a>
          {% else %}
            {% if page_number == paginate.current_page %}
              <span aria-current="page">{{ part.title | escape }}</span>
            {% else %}
              <span class="pagination-ellipsis" aria-hidden="true">{{ part.title | escape }}</span>
            {% endif %}
          {% endif %}
        {% endfor %}
        {% if paginate.next %}
          <a class="pagination-direction" href="{{ paginate.next.url }}" rel="next">
            <span>{{ 'pagination.next_short' | t }}</span> →
          </a>
        {% endif %}
      </nav>
    </div>
  {% endif %}
{% endpaginate %}`;

export const CATALOG_CSS = `/* Catalog/styles.css → {% stylesheet %} de snippets/catalog.liquid (completo) */
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 36px 22px;
}

@media (max-width: 900px) {
  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 12px;
  }
}

.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 36px;
  padding-top: 26px;
  border-top: 1px solid var(--line);
}

.pagination-caption {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.pagination-footer .pagination > a,
.pagination-footer .pagination > span {
  min-width: 40px;
  height: 40px;
  border-radius: 4px;
  font-size: 12px;
}

.pagination-footer .pagination > a:hover {
  background: var(--ink);
  color: var(--paper);
}

.pagination-footer .pagination > .pagination-ellipsis {
  border: 0;
  min-width: 20px;
}

@media (max-width: 680px) {
  .pagination-footer {
    flex-direction: column;
    gap: 15px;
    margin-top: 28px;
  }
  .pagination-direction > span {
    display: none;
  }
}`;

export const NEWS_TSX = `'use sections'

import { FormBlock } from 'liquidex'
import { escape } from 'liquidex/helpers'
import classNames from 'classnames'

import { NEWSLETTER_SCHEMA } from '../../../schemas/Newsletter/newsletter.schema'

import styles from './styles.css'

export const Newsletter = () => {
  return (
    <div className={classNames(styles.newsletter)} style={{ background: section.settings.background }}>
      <div className={classNames(styles['newsletter-inner'], 'container')}>
        <div>
          <p className='eyebrow'>{section.settings.eyebrow}</p>
          <h2>
            {section.settings.title_1}
            <br />
            {section.settings.title_2}
          </h2>
        </div>

        <div className={classNames(styles['newsletter-form'])}>
          <FormBlock name='customer' id='FooterNewsletter'>
            <input type='hidden' name='contact[tags]' value='newsletter' />

            <label htmlFor='NewsletterEmail'>{section.settings.label}</label>

            <div className={classNames(styles['email-field'])}>
              <input id='NewsletterEmail' type='email' name='contact[email]' placeholder={"'footer.email_label' | t"} autoComplete='email' required />
              <button type='submit' aria-label={"'footer.subscribe' | t"}>
                ↗
              </button>
            </div>

            {form['posted_successfully?'] && <p role='status'>{"'footer.subscribed' | t"}</p>}
            {form.errors && <div role='alert'>{"'footer.email_error' | t"}</div>}

            <p className={classNames(styles['newsletter-note'])}>{section.settings.note}</p>
          </FormBlock>
        </div>
      </div>
    </div>
  )
}

export default (Newsletter.schema = NEWSLETTER_SCHEMA)`;

export const NEWS_LIQUID = `<!-- sections/newsletter.liquid (gerado — markup + schema; {% stylesheet %} na aba CSS) -->
<div class="newsletter" style="background: {{ section.settings.background }};">
  <div class="newsletter-inner container">
    <div>
      <p class="eyebrow">{{ section.settings.eyebrow | escape }}</p>
      <h2>
        {{ section.settings.title_1 | escape }}
        <br />
        {{ section.settings.title_2 | escape }}
      </h2>
    </div>
    <div class="newsletter-form">
      {% form 'customer', id: 'FooterNewsletter' %}
        <input type="hidden" name="contact[tags]" value="newsletter" />
        <label for="NewsletterEmail">{{ section.settings.label | escape }}</label>
        <div class="email-field">
          <input id="NewsletterEmail" type="email" name="contact[email]"
            placeholder="{{ 'footer.email_label' | t }}" autocomplete="email" required />
          <button type="submit" aria-label="{{ 'footer.subscribe' | t }}">↗</button>
        </div>
        {% if form["posted_successfully?"] %}
          <p role="status">{{ 'footer.subscribed' | t }}</p>
        {% endif %}
        {% if form.errors %}
          <div role="alert">{{ form.errors | default_errors }}</div>
        {% endif %}
        <p class="newsletter-note">{{ section.settings.note | escape }}</p>
      {% endform %}
    </div>
  </div>
</div>

{% schema %}
{
  "name": "t:sections.newsletter.name",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "t:sections.newsletter.settings.eyebrow.label", "default": "VAMOS FICAR MAIS PERTO?" },
    { "type": "text", "id": "title_1", "label": "t:sections.newsletter.settings.title_1.label", "default": "Entre para a nossa lista." },
    { "type": "text", "id": "title_2", "label": "t:sections.newsletter.settings.title_2.label", "default": "Fique por dentro do próximo drop." },
    { "type": "text", "id": "label", "label": "t:sections.newsletter.settings.label.label", "default": "Seu melhor e-mail" },
    { "type": "text", "id": "note", "label": "t:sections.newsletter.settings.note.label", "default": "Novidades, lançamentos e inspiração." },
    { "type": "color", "id": "background", "label": "t:sections.newsletter.settings.background.label", "default": "#f4f4f4" }
  ],
  "presets": [{ "name": "t:sections.newsletter.presets.default" }]
}
{% endschema %}`;

export const NEWS_CSS = `/* Newsletter/styles.css → {% stylesheet %} de sections/newsletter.liquid (completo) */
.newsletter {
  background: #f4f4f4;
  border-bottom: 1px solid #ddd;
  padding-block: 50px;
}

.newsletter-inner {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 80px;
  align-items: center;
}

.newsletter h2 {
  font-size: 29px;
  letter-spacing: -0.8px;
  line-height: 1.25;
  margin-top: 13px;
}

.email-field {
  display: flex;
  background: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
}

.email-field input {
  flex: 1;
  border: 0;
  min-width: 0;
  font-size: 12px;
  padding: 15px;
}

.email-field button {
  background: #171717;
  color: white;
  font-size: 23px;
  width: 52px;
}

.newsletter-note {
  font-size: 9px;
  color: #777;
  margin-top: 10px;
}

@media (max-width: 900px) {
  .newsletter-inner {
    grid-template-columns: minmax(0, 1fr);
    gap: 26px;
  }
  .newsletter h2 {
    font-size: 24px;
  }
}`;

export const PROD_TSX = `// ProductInfo/index.tsx — completo ('use sections', 127 linhas)
'use sections'

import { RenderSnippet, Raw } from 'liquidex'
import { escape, money } from 'liquidex/helpers'
import classNames from 'classnames'

import { ProductPreview } from '../../components/Product/Preview'
import { BaseBox } from '../../components/Base/Box'
import { QuantitySelector } from '../../components/Quantity/Selector'
import { Selector } from '../../components/Selector'
import { Breadcrumb } from '../../components/Breadcrumb'

import { PRODUCT_INFO_SCHEMA } from '../../../schemas/ProductInfo/product-info.schema'

import { ProductProvider } from '../../context/Product'
import { ToastHost } from '../../components/Toast'

import styles from './styles.css'

export const ProductInfo = () => {
  const blocks = section.blocks

  return (
    <section className={classNames(styles['product-detail'], 'container', 'section-space')}>
      <ToastHost position='bottom-left' />
      <RenderSnippet slot={Breadcrumb} className='' />

      <div className={classNames(styles['product-detail-grid'])}>
        <div className={classNames(styles['product-gallery-wrapper'])}>
          <RenderSnippet slot={ProductPreview} id={product.id} title={product.title} images={product.images} />
        </div>

        <div className={classNames(styles['product-detail-copy'])}>
          <p className='eyebrow'>{escape(product.vendor)}</p>
          <h1>{escape(product.title)}</h1>
          <p className={classNames(styles['product-intro'])}>{"'products.product.intro' | t"}</p>

          {/* Ponte Liquid → React: o produto inteiro vai serializado para as ilhas */}
          <liquid-data data-liquid-store='{{ product | json }}'>
            <ProductProvider elementId='product-provider' selectFirstVariant={false} store={product}>
              <p className={classNames(styles['detail-price'])} data-product-price>
                {money(product.selected_or_first_available_variant.price)}
              </p>

              {blocks?.map((block) => {
                const { variation, mode } = block.settings
                return (
                  block.type === 'variation' && (
                    <RenderSnippet slot={Selector} mode={mode} variation={variation} options={product.options_with_values} />
                  )
                )
              })}

              <div className={classNames(styles['purchase-actions'])}>
                <div className={classNames(styles['quantity-field'])}>
                  <label htmlFor='Quantity'>{"'products.product.quantity' | t"}</label>
                  <QuantitySelector id='Quantity' name='quantity' />
                </div>
                <button type='button' className={classNames('button', 'button-dark', styles['product-add-button'])} data-product-add-to-cart='true'>
                  {"'products.product.add_to_bag' | t"}
                  <span aria-hidden='true'>↗</span>
                </button>
              </div>
            </ProductProvider>
          </liquid-data>

          {/* Blocos do Theme Editor: o lojista adiciona faixas de benefícios */}
          {blocks?.map((block) => {
            return (
              block.type === 'benefits' && (
                <RenderSnippet
                  slot={BaseBox}
                  text={block.settings.text}
                  background_color={block.settings.background_color}
                  className={styles.benefit}
                />
              )
            )
          })}

          <details className={classNames(styles['product-accordion'])} open>
            <summary>{"'products.product.about' | t"} <span>+</span></summary>
            <div className='rich-text'>
              <Raw html={product.description} />
            </div>
          </details>

          <details className={classNames(styles['product-accordion'])}>
            <summary>{"'products.product.shipping_returns' | t"} <span>+</span></summary>
            <div className='rich-text'>
              <p>{"'products.product.shipping_text' | t"}</p>
              {shop.shipping_policy && <a href={shop.shipping_policy.url}>{"'products.product.shipping_policy' | t"}</a>}
              {shop.refund_policy && <a href={shop.refund_policy.url}>{"'products.product.refund_policy' | t"}</a>}
            </div>
          </details>
        </div>
      </div>

      <script type='application/ld+json'>{'product | structured_data'}</script>
    </section>
  )
}

export default (ProductInfo.schema = PRODUCT_INFO_SCHEMA)`;

export const PROD_LIQUID = `<!-- sections/product-info.liquid (trechos principais — 422 linhas no template) -->
{% assign blocks = section.blocks %}
<section class="product-detail container section-space">
  <react-island component="ToastHost">
    <script type="application/json" data-react-props>{"position": "bottom-left"}</script>
  </react-island>
  {% render 'breadcrumb', className: '' %}
  <div class="product-detail-grid">
    <div class="product-gallery-wrapper">
      {% render 'product-preview', id: product.id, title: product.title, images: product.images %}
    </div>
    <div class="product-detail-copy">
      <p class="eyebrow">{{ product.vendor | escape }}</p>
      <h1>{{ product.title | escape }}</h1>

      <liquid-data>
        <script type="application/json" data-liquid-store>
          {{ product | json }}
        </script>
        <react-island id="product-provider" component="ProductProvider">
          <script type="application/json" data-react-props>
            {"elementId": "product-provider", "selectFirstVariant": false}
          </script>
          <p class="detail-price" data-product-price>
            {{ product.selected_or_first_available_variant.price | money }}
          </p>
          {% for block in blocks %}
            {% assign variation = block.settings.variation %}
            {% if block.type == "variation" %}
              {% render 'selector', mode: mode, variation: variation, options: product.options_with_values %}
            {% endif %}
          {% endfor %}
          <div class="purchase-actions">
            <react-island component="QuantitySelector">
              <script type="application/json" data-react-props>{"id": "Quantity", "name": "quantity"}</script>
            </react-island>
            <button type="button" class="button button-dark product-add-button" data-product-add-to-cart="true">
              {{ 'products.product.add_to_bag' | t }} <span aria-hidden="true">↗</span>
            </button>
          </div>
        </react-island>
      </liquid-data>

      {% for block in blocks %}
        {% if block.type == "benefits" %}
          {% render 'base-box', text: block.settings.text, className: "benefit" %}
        {% endif %}
      {% endfor %}

      <details class="product-accordion" open>
        <summary>{{ 'products.product.about' | t }} <span>+</span></summary>
        <div class="rich-text">{{ product.description }}</div>
      </details>
      <!-- … accordion de shipping/returns + policies … -->
    </div>
  </div>
  <script type="application/ld+json">{{ product | structured_data }}</script>
</section>

{%- unless script_product_provider_loaded -%}
  <script src="{{ 'product-provider.js' | asset_url }}" defer></script>
  {%- assign script_product_provider_loaded = true -%}
{%- endunless -%}
<!-- … + {% schema %} e {% stylesheet %} no arquivo original … -->`;

export const PROD_CSS = `/* ProductInfo/styles.css → {% stylesheet %} (trechos principais, 168 linhas) */
.product-detail {
  padding-top: 35px;
}

.product-detail-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 85px;
}

.product-gallery-wrapper {
  width: 100%;
  min-width: 0;
}

.product-detail-copy {
  padding-top: 20px;
}

.product-detail-copy h1 {
  font-size: 43px;
  letter-spacing: -1.7px;
  margin: 17px 0;
}

.detail-price {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 25px;
  margin-bottom: 26px;
}

.variant-group {
  margin-bottom: 23px;
}

.variant-options {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.variant-options button {
  padding: 10px 15px;
  font-size: 11px;
  border: 1px solid var(--line);
  background: transparent;
  border-radius: 4px;
}

/* … + accordions, purchase-actions, benefit e responsivo no original … */`;
