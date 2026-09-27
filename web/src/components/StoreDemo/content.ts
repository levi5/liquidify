export const HERO_TSX = `'use sections'

import { RenderSvg } from 'liquidex'
import classNames from 'classnames'
import styles from './styles.css'

export const Hero = () => {
  return (
    <>
      <section className={classNames(styles['fashion-hero'], 'container')}>
        <div className={classNames(styles['fashion-hero-copy'])}>
          <p className="eyebrow">
            <span className={classNames(styles['new-season-dot'])}></span> {"'hero.eyebrow' | t"}
          </p>
          <h1>
            {section.settings.heading ? 'section.settings.heading | escape' : "'hero.heading' | t"}
            <br />
            <span>{section.settings.highlight ? 'section.settings.highlight | escape' : "'hero.highlight' | t"}</span>
          </h1>
          <p className={classNames(styles['hero-description'])}>
            {section.settings.description ? 'section.settings.description | escape' : "'hero.description' | t"}
          </p>
          <a
            className="button button-dark"
            href="{{ section.settings.link | default: routes.all_products_collection_url }}"
          >
            {section.settings.button ? 'section.settings.button | escape' : "'hero.button' | t"}
            <span aria-hidden="true">↗</span>
          </a>
          <div className={classNames(styles['hero-bottom-note'])}>
            <span>{"'hero.drop_label' | t"}</span>
            <span>{"'hero.express' | t"}</span>
          </div>
        </div>
        <a
          className={classNames(styles['fashion-hero-photo'], styles['hero-women'])}
          href="{{ section.settings.women_link | default: '/collections/all/women' }}"
        >
          {section.settings.image ? (
            <img
              src="{{ section.settings.image | image_url: width: 1200 }}"
              alt={section.settings.image.alt ? 'section.settings.image.alt | escape' : "'hero.women_alt' | t"}
              width="900"
              height="1200"
              fetchPriority="high"
            />
          ) : (
            <img
              src="{{ 'liquidify-women.jpg' | asset_url }}"
              alt={"'hero.women_alt' | t"}
              width="900"
              height="1200"
              fetchPriority="high"
            />
          )}
          <span className={classNames(styles['hero-photo-label'])}>
            <strong>{"'hero.women' | t"}</strong>
            <span aria-hidden="true">↗</span>
          </span>
          <span className={classNames(styles['hero-photo-tag'])}>{"'hero.new_edit' | t"}</span>
        </a>
        <a
          className={classNames(styles['fashion-hero-photo'], styles['hero-men'])}
          href="{{ section.settings.men_link | default: '/collections/all/men' }}"
        >
          {section.settings.men_image ? (
            <img
              src="{{ section.settings.men_image | image_url: width: 1000 }}"
              alt={section.settings.men_image.alt ? 'section.settings.men_image.alt | escape' : "'hero.men_alt' | t"}
              width="900"
              height="1200"
              fetchPriority="high"
            />
          ) : (
            <img
              src="{{ 'liquidify-men.jpg' | asset_url }}"
              alt={"'hero.men_alt' | t"}
              width="900"
              height="1200"
              fetchPriority="high"
            />
          )}
          <span className={classNames(styles['hero-photo-label'])}>
            <strong>{"'hero.men' | t"}</strong>
            <span aria-hidden="true">↗</span>
          </span>
        </a>
      </section>

      <div className='values-strip container'>
        <p className='visually-hidden'>{"'values.strip_label' | t"}</p>
        <div className='value-item'>
          <RenderSvg name='delivery.svg' />
          <div>
            <h3>{"'values.shipping_title' | t"}</h3>
            <p>{"'values.shipping_text' | t"}</p>
          </div>
        </div>
        <div className='value-item'>
          <RenderSvg name='shield-icon.svg' />
          <div>
            <h3>{"'values.secure_title' | t"}</h3>
            <p>{"'values.secure_text' | t"}</p>
          </div>
        </div>
        <div className='value-item'>
          <RenderSvg name='return-icon.svg' />
          <div>
            <h3>{"'values.support_title' | t"}</h3>
            <p>{"'values.support_text' | t"}</p>
          </div>
        </div>
      </div>
    </>
  )
}

export const schema = {
  name: 't:sections.hero.name',
  settings: [
    { type: 'text', id: 'heading', label: 't:sections.hero.settings.heading.label' },
    { type: 'text', id: 'highlight', label: 't:sections.hero.settings.highlight.label' },
    { type: 'textarea', id: 'description', label: 't:sections.hero.settings.description.label' },
    { type: 'text', id: 'button', label: 't:sections.hero.settings.button.label', default: 'Explorar' },
    { type: 'url', id: 'link', label: 't:sections.hero.settings.link.label' },
    { type: 'image_picker', id: 'image', label: 't:sections.hero.settings.image.label' },
    { type: 'image_picker', id: 'men_image', label: 't:sections.hero.settings.men_image.label' },
    { type: 'url', id: 'women_link', label: 't:sections.hero.settings.women_link.label' },
    { type: 'url', id: 'men_link', label: 't:sections.hero.settings.men_link.label' },
  ],
  presets: [{ name: 't:sections.hero.presets.default' }],
}`;

export const HERO_LIQUID = `<!-- sections/hero.liquid (gerado — completo, exceto {% stylesheet %} na aba CSS) -->
<section class="fashion-hero container">
  <div class="fashion-hero-copy">
    <p class="eyebrow">
      <span class="new-season-dot"></span>
      {{ 'hero.eyebrow' | t }}
    </p>
    <h1>
      {% if section.settings.heading %}
        {{ section.settings.heading | escape }}
      {% else %}
        {{ 'hero.heading' | t }}
      {% endif %}
      <br />
      <span>
        {% if section.settings.highlight %}
          {{ section.settings.highlight | escape }}
        {% else %}
          {{ 'hero.highlight' | t }}
        {% endif %}
      </span>
    </h1>
    <p class="hero-description">
      {% if section.settings.description %}
        {{ section.settings.description | escape }}
      {% else %}
        {{ 'hero.description' | t }}
      {% endif %}
    </p>
    <a class="button button-dark" href="{{ section.settings.link | default: routes.all_products_collection_url }}">
      {% if section.settings.button %}
        {{ section.settings.button | escape }}
      {% else %}
        {{ 'hero.button' | t }}
      {% endif %}
      <span aria-hidden="true">↗</span>
    </a>
  </div>
  <a class="fashion-hero-photo hero-women" href="{{ section.settings.women_link | default: '/collections/all/women' }}">
    {% if section.settings.image %}
      <img src="{{ section.settings.image | image_url: width: 1200 }}" width="900" height="1200" fetchpriority="high" />
    {% else %}
      <img src="{{ 'liquidify-women.jpg' | asset_url }}" width="900" height="1200" fetchpriority="high" />
    {% endif %}
    <span class="hero-photo-label">
      <strong>{{ 'hero.women' | t }}</strong>
      <span aria-hidden="true">↗</span>
    </span>
    <span class="hero-photo-tag">{{ 'hero.new_edit' | t }}</span>
  </a>
  <!-- … bloco hero-men segue o mesmo padrão … -->
</section>
<div class="values-strip container">
  <div class="value-item">
    {{ 'delivery.svg' | inline_asset_content }}
    <div>
      <h3>{{ 'values.shipping_title' | t }}</h3>
      <p>{{ 'values.shipping_text' | t }}</p>
    </div>
  </div>
  <!-- … shield + return seguem o padrão … -->
</div>

{% schema %}
{
  "name": "t:sections.hero.name",
  "settings": [
    { "type": "text", "id": "heading", "label": "t:sections.hero.settings.heading.label" },
    { "type": "text", "id": "highlight", "label": "t:sections.hero.settings.highlight.label" },
    { "type": "textarea", "id": "description", "label": "t:sections.hero.settings.description.label" },
    { "type": "text", "id": "button", "label": "t:sections.hero.settings.button.label", "default": "Explorar" },
    { "type": "url", "id": "link", "label": "t:sections.hero.settings.link.label" },
    { "type": "image_picker", "id": "image", "label": "t:sections.hero.settings.image.label" },
    { "type": "image_picker", "id": "men_image", "label": "t:sections.hero.settings.men_image.label" },
    { "type": "url", "id": "women_link", "label": "t:sections.hero.settings.women_link.label" },
    { "type": "url", "id": "men_link", "label": "t:sections.hero.settings.men_link.label" }
  ],
  "presets": [{ "name": "t:sections.hero.presets.default" }]
}
{% endschema %}`;

export const HERO_CSS = `/* Home/Hero/styles.css → {% stylesheet %} de sections/hero.liquid (trechos principais) */
.fashion-hero {
  display: grid;
  grid-template-columns: 1.05fr 1fr 0.85fr;
  gap: 10px;
  margin-top: 24px;
  min-height: 560px;
}

.fashion-hero-copy {
  background: #eeeeeb;
  border-radius: 10px 0 0 10px;
  padding: 54px 36px 28px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
}

.fashion-hero h1 {
  font-size: clamp(48px, 5vw, 75px);
  font-weight: 650;
  letter-spacing: -4.2px;
  line-height: 1.04;
  margin: 55px 0 25px;
}

.fashion-hero h1 > span {
  color: #787878;
}

.fashion-hero-photo {
  position: relative;
  min-width: 0;
  overflow: hidden;
  background: #eee;
}

.fashion-hero-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
  transition: transform 0.8s;
}

.fashion-hero-photo:hover img {
  transform: scale(1.035);
}

.hero-photo-label {
  position: absolute;
  bottom: 27px;
  left: 25px;
  right: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1;
  color: white;
}

.values-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding-block: 2.8rem;
  border-bottom: 0.1rem solid var(--line);
  margin-bottom: 4.5rem;
}

/* … + media queries 1200px / 990px / 680px no arquivo original (280 linhas) … */`;

export const CARD_TSX = `'use snippets'

import { RenderSnippet } from 'liquidex'
import classNames from 'classnames'

import { ThemeIcon } from '../Icon'
import { Badges } from '../Badges'

import styles from './styles.css'

// Tipos explicitados para o exemplo (no template, tipos
// compartilhados vivem em src/app/types, ex. TBadgesMetaField).
type Badge = {
  text: string
  color: string
  background: string
}

type CardItem = {
  url: string
  title: string
  price: number
  price_min: number
  price_max: number
  compare_at_price?: number | null
  available: boolean
  requires_selling_plan?: boolean
  featured_image?: { alt?: string | null } | null
  images?: { size: number } | null
  variants: { size: number; first: { id: number } }
  metafields: { custom: { product_badges: { value?: Badge[] } } }
}

export const Card = ({ item }: { item: CardItem }) => {
  const variantCount = item.variants ? item.variants.size : 0

  return (
    <article className={classNames(styles['product-card'])}>
      <a className={classNames(styles['product-image-link'])} href={item.url}>
        {item.featured_image ? (
          <img
            className={classNames(styles['product-primary-image'])}
            src='{{ item.featured_image | image_url: width: 700 }}'
            srcSet='{{ item.featured_image | image_url: width: 350 }} 350w, {{ item.featured_image | image_url: width: 550 }} 550w, {{ item.featured_image | image_url: width: 700 }} 700w'
            sizes='(max-width: 740px) 50vw, 25vw'
            alt='{{ item.featured_image.alt | default: item.title | escape }}'
            loading='lazy'
            decoding='async'
            width='700'
            height='880'
          />
        ) : (
          <div className='product-placeholder' aria-hidden='true'>
            LQ.
          </div>
        )}

        {item.images && item.images.size > 1 && (
          <img
            className={classNames(styles['product-secondary-image'])}
            src='{{ item.images[1] | image_url: width: 700 }}'
            alt=''
            aria-hidden='true'
            loading='lazy'
            decoding='async'
          />
        )}

        <RenderSnippet slot={Badges} badges={item.metafields.custom.product_badges.value} />

        {item.available ? (
          item.compare_at_price > item.price && <span className={classNames(styles['product-tag'])}>{"'products.product.sale' | t"}</span>
        ) : (
          <span className={classNames(styles['product-tag'], styles['sold-out'])}>{"'products.product.sold_out' | t"}</span>
        )}

        <span className={classNames(styles['product-image-arrow'])} aria-hidden='true'>↗</span>
      </a>

      <div className={classNames(styles['product-info'])}>
        <h3>
          <a href={item.url}>{'item.title | escape'}</a>
        </h3>

        <div className={classNames(styles['product-prices'])}>
          <strong>
            {item.price_min !== item.price_max && <small>{"'products.product.from_price' | t"}</small>}
            {'item.price | money'}
          </strong>
          {item.compare_at_price > item.price && <s>{'item.compare_at_price | money'}</s>}
        </div>

        {item.available ? (
          item.variants.size === 1 && item.requires_selling_plan !== true ? (
            <form action={routes.cart_add_url} method='post' data-quick-add>
              <input type='hidden' name='id' value='{{ item.variants.first.id }}' />
              <input type='hidden' name='quantity' value='1' />
              <button className={classNames(styles['card-buy-button'])} type='submit'>
                <RenderSnippet slot={ThemeIcon} name='bag' />
                <span>{"'products.product.add_to_bag' | t"}</span>
                <span aria-hidden='true'>+</span>
              </button>
              <p className='quick-add-message' role='status'></p>
            </form>
          ) : (
            <a className={classNames(styles['card-buy-button'])} href={item.url}>
              <RenderSnippet slot={ThemeIcon} name='bag' />
              <span>{"'products.product.choose_options' | t"}</span>
              <span aria-hidden='true'>+</span>
            </a>
          )
        ) : (
          <span className={classNames(styles['card-buy-button'], styles.unavailable)}>{"'products.product.unavailable' | t"}</span>
        )}
      </div>
    </article>
  )
}`;

export const CARD_LIQUID = `<!-- snippets/card.liquid (gerado — markup completo; {% stylesheet %} na aba CSS) -->
{% if item.variants %}
  {% assign variantCount = item.variants.size %}
{% else %}
  {% assign variantCount = 0 %}
{% endif %}
<article class="product-card">
  <a class="product-image-link" href="{{ item.url }}">
    {% if item.featured_image %}
      <img class="product-primary-image"
        src="{{ item.featured_image | image_url: width: 700 }}"
        srcset="{{ item.featured_image | image_url: width: 350 }} 350w, {{ item.featured_image | image_url: width: 700 }} 700w"
        sizes="(max-width: 740px) 50vw, 25vw"
        alt="{{ item.featured_image.alt | default: item.title | escape }}"
        loading="lazy" decoding="async" width="700" height="880" />
    {% else %}
      <div class="product-placeholder" aria-hidden="true">LQ.</div>
    {% endif %}
    {% if item.images and item.images.size > 1 %}
      <img class="product-secondary-image"
        src="{{ item.images[1] | image_url: width: 700 }}" alt="" aria-hidden="true" loading="lazy" />
    {% endif %}
    {% render 'badges', badges: item.metafields.custom.product_badges.value %}
    {% if item.available %}
      {% if item.compare_at_price > item.price %}
        <span class="product-tag">{{ 'products.product.sale' | t }}</span>
      {% endif %}
    {% else %}
      <span class="product-tag sold-out">{{ 'products.product.sold_out' | t }}</span>
    {% endif %}
    <span class="product-image-arrow" aria-hidden="true">↗</span>
  </a>
  <div class="product-info">
    <h3><a href="{{ item.url }}">{{ item.title | escape }}</a></h3>
    <div class="product-prices">
      <strong>
        {% if item.price_min != item.price_max %}
          <small>{{ 'products.product.from_price' | t }}</small>
        {% endif %}{{ item.price | money }}
      </strong>
      {% if item.compare_at_price > item.price %}
        <s>{{ item.compare_at_price | money }}</s>
      {% endif %}
    </div>
    {% if item.available %}
      {% if item.variants.size == 1 and item.requires_selling_plan != true %}
        <form action="{{ routes.cart_add_url }}" method="post" data-quick-add>
          <input type="hidden" name="id" value="{{ item.variants.first.id }}" />
          <input type="hidden" name="quantity" value="1" />
          <button class="card-buy-button" type="submit">
            {% render 'theme-icon', name: 'bag' %}
            <span>{{ 'products.product.add_to_bag' | t }}</span>
            <span aria-hidden="true">+</span>
          </button>
        </form>
      {% else %}
        <a class="card-buy-button" href="{{ item.url }}">
          {% render 'theme-icon', name: 'bag' %}
          <span>{{ 'products.product.choose_options' | t }}</span>
          <span aria-hidden="true">+</span>
        </a>
      {% endif %}
    {% else %}
      <span class="card-buy-button unavailable">{{ 'products.product.unavailable' | t }}</span>
    {% endif %}
  </div>
</article>`;

export const CARD_CSS = `/* Card/styles.css → {% stylesheet %} de snippets/card.liquid (completo) */
.product-card {
  min-width: 0;
}

.product-image-link {
  display: block;
  position: relative;
  aspect-ratio: 4/5;
  background: #f1f1f1;
  border-radius: 9px;
  overflow: hidden;
}

.product-image-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.35s, transform 0.5s;
}

.product-secondary-image {
  position: absolute;
  inset: 0;
  opacity: 0;
}

.product-image-link:hover .product-secondary-image {
  opacity: 1;
}

.product-image-link:hover .product-primary-image {
  transform: scale(1.025);
}

.product-image-arrow {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  font-size: 15px;
  transition: transform 0.25s ease;
}

.product-tag {
  position: absolute;
  left: 13px;
  top: 13px;
  z-index: 1;
  background: #171717;
  color: white;
  font-size: 8px;
  letter-spacing: 1px;
  padding: 5px 9px;
  border-radius: 3px;
}

.product-tag.sold-out {
  background: #f4f4f4;
  color: #555;
}

.product-info {
  padding: 15px 2px 0;
}

.product-info h3 {
  font-size: 14px;
  font-weight: 400;
  margin: 9px 0 7px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-prices {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 15px;
  flex-wrap: wrap;
}

.card-buy-button {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 46px;
  background: transparent;
  border: 1px solid #dcdcdc;
  border-radius: 5px;
  font-size: 11px;
  gap: 9px;
  margin-top: 15px;
  padding: 8px 14px;
}

.card-buy-button:hover {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}

.card-buy-button.unavailable {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 680px) {
  .product-image-link {
    aspect-ratio: 1/1.15;
  }
  .card-buy-button {
    font-size: 9px;
    padding: 6px 8px;
  }
}`;

export const MINICART_TSX = `// MiniCart/index.tsx — trechos principais ('use react', 259 linhas no template)
'use react'

import type { TargetedMouseEvent } from 'preact'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'

import { Drawer } from '../Drawer'
import { DrawerHeader } from '../Drawer/Header'
import { CartIcon } from '../Icon/Cart'
import { CartService } from '../../services/Cart/cart.service'
import { QuantitySelector } from '../Quantity/Selector'
import { ToastHost } from '../Toast'

import './styles.css'

type CartItem = {
  key: string
  url: string
  title: string
  price: number
  quantity: number
  variant_id?: number
  variant_title?: string | null
  options?: { name: string; value: string }[]
  featured_image?: { alt?: string; url?: string } | null
}

type Cart = {
  item_count: number
  total_price: number
  items: CartItem[]
}

// … helpers: formatMoney via window.LiquidifyTheme (locale/moeda), variantLabel …

export const MiniCart = (_props: { elementId: string }) => {
  const [state, setState] = useState<Cart | null>(null)

  const getCart = useCallback(async () => {
    const orderForm = (await CartService.getCart()) as Cart
    setState(orderForm)
    return orderForm
  }, [getCart])

  useEffect(() => {
    void getCart()
  }, [getCart])

  // Reage ao add-to-cart disparado de qualquer ilha da página
  useEffect(() => {
    const handleAddToCartSuccess = async () => {
      await getCart()
      window.dispatchEvent(new CustomEvent('message::mini-cart', { detail: true }))
    }
    window.addEventListener('product:add-to-cart:success', handleAddToCartSuccess)
    return () => window.removeEventListener('product:add-to-cart:success', handleAddToCartSuccess)
  }, [getCart])

  // … removeProduct / updateProductQuantity via CartService.changeItem …

  const items = useMemo(() => state?.items ?? [], [state])
  const count = state?.item_count ?? 0
  const hasItems = items.length > 0

  return (
    <div className={'miniCart'}>
      <ToastHost position='bottom-left' />
      <Drawer.Root name='mini-cart'>
        <Drawer.Trigger>
          <Drawer.Action action='open' className={'miniCartIcon'}>
            <CartIcon />
            {!!count && <span className={'miniCartCount'}>{count}</span>}
          </Drawer.Action>
        </Drawer.Trigger>
        <Drawer.Content eventName='mini-cart' orientation='right' overlay={true} width='min(560px, 100vw)'>
          <div className={'miniCartDrawer'}>
            <DrawerHeader title='Sua sacola' count={count} />
            {hasItems ? (
              <div className={'miniCartList'}>
                {items.map((item) => (
                  <div key={item.key} className={'miniCartProduct'}>
                    {/* … thumb, título, variante, preço, QuantitySelector, remover … */}
                  </div>
                ))}
              </div>
            ) : (
              <div className={'miniCartEmpty'}>
                <h3>Sua sacola ainda está vazia.</h3>
                <button type='button' onClick={() => window.location.assign('/collections/all')}>
                  Explorar a loja ↗
                </button>
              </div>
            )}
            {hasItems && (
              <div className={'miniCartFooter'}>
                <div className={'miniCartSubtotal'}>
                  <span>Subtotal</span>
                  {/* … formatMoney(state.total_price) … */}
                </div>
                <a className='button button-dark' href='/cart'>Finalizar compra ↗</a>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Root>
    </div>
  )
}
// build: assets/mini-cart.js (ilhas não geram .liquid próprio;
// o <react-island> é emitido onde a ilha é usada — ver aba Liquid)`;

export const MINICART_LIQUID = `<!-- snippets/header-user-options.liquid (gerado do Header que usa <MiniCart/>) -->
<div class="icon-button-group">
  <react-island id="mini-cart" style="display: flex;" component="MiniCart">
    <script type="application/json" data-react-props>
      {"elementId": "mini-cart"}
    </script>
  </react-island>
</div>

{%- unless script_mini_cart_loaded -%}
  <script src="{{ 'mini-cart.js' | asset_url }}" defer></script>
  {%- assign script_mini_cart_loaded = true -%}
{%- endunless -%}
<!-- 'use react' gera SÓ o bundle assets/mini-cart.js.
     O Liquid acima sai do snippet que consome a ilha. -->`;

export const MINICART_CSS = `/* MiniCart/styles.css → embutido em assets/mini-cart.js (trechos principais) */
.miniCart {
  color: var(--ink);
}

.miniCart .miniCartIcon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.miniCart .miniCartIcon svg {
  width: 22px;
  height: 22px;
}

.miniCart .miniCartIcon .miniCartCount {
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  right: 50%;
  transform: translate(19px, -17px);
  border-radius: 50%;
  background: var(--ink);
  color: var(--paper);
  font-size: 10px;
  font-weight: 600;
}

.miniCartDrawer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--paper);
}

.miniCartList {
  flex: 1;
  overflow-y: auto;
  padding: 0 32px;
}

.miniCartProduct {
  display: flex;
  gap: 20px;
  padding: 28px 0;
  border-bottom: 1px solid var(--line);
}

/* … + footer, subtotal, empty state e responsivo no arquivo original … */`;
