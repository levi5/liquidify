'use sections'

import classNames from 'classnames'
import styles from './styles.css'

export const Hero = () => {
  return (
    <section className={classNames(styles['fashion-hero'], 'container')}>
      <div className={classNames(styles['fashion-hero-copy'])}>
        <p className="eyebrow">
          <span className={classNames(styles['new-season-dot'])}></span> NEW SEASON / ESSENTIALS
        </p>
        <h1>
          {'section.settings.heading | default: "Your style." | escape'}
          <br />
          <span>{'section.settings.highlight | default: "No limits." | escape'}</span>
        </h1>
        <p className={classNames(styles['hero-description'])}>{'section.settings.description | default: "New pieces. New possibilities. Find the essentials that match your pace." | escape'}</p>
        <a
          className="button button-dark"
          href="{{ section.settings.link | default: routes.all_products_collection_url }}"
        >
          {'section.settings.button | default: "Explore new arrivals" | escape'}
          <span aria-hidden="true">↗</span>
        </a>
        <div className={classNames(styles['hero-bottom-note'])}>
          <span>DROP 01</span>
          <span>EXPRESS WHO YOU ARE.</span>
        </div>
      </div>
      <a
        className={classNames(styles['fashion-hero-photo'], styles['hero-women'])}
        href="{{ section.settings.women_link | default: '/collections/all/women' }}"
      >
        {section.settings.image ? (
          <img
            src="{{ section.settings.image | image_url: width: 1200 }}"
            alt="{{ section.settings.image.alt | default: 'Liquidify women collection' | escape }}"
            width="900"
            height="1200"
            fetchPriority="high"
          />
        ) : (
          <img
            src="{{ 'liquidify-women.jpg' | asset_url }}"
            alt="Liquidify women's fashion — urban style and denim"
            width="900"
            height="1200"
            fetchPriority="high"
          />
        )}
        <span className={classNames(styles['hero-photo-label'])}>
          <strong>Women</strong>
          <span aria-hidden="true">↗</span>
        </span>
        <span className={classNames(styles['hero-photo-tag'])}>THE NEW EDIT</span>
      </a>
      <a
        className={classNames(styles['fashion-hero-photo'], styles['hero-men'])}
        href="{{ section.settings.men_link | default: '/collections/all/men' }}"
      >
        {section.settings.men_image ? (
          <img
            src="{{ section.settings.men_image | image_url: width: 1000 }}"
            alt="{{ section.settings.men_image.alt | default: 'Liquidify men collection' | escape }}"
            width="900"
            height="1200"
            fetchPriority="high"
          />
        ) : (
          <img
            src="{{ 'liquidify-men.jpg' | asset_url }}"
            alt="Liquidify men's fashion — jackets and essentials"
            width="900"
            height="1200"
            fetchPriority="high"
          />
        )}
        <span className={classNames(styles['hero-photo-label'])}>
          <strong>Men</strong>
          <span aria-hidden="true">↗</span>
        </span>
      </a>
    </section>
  )
}
export const schema = {
  name: 'Fashion Hero',
  settings: [
    { type: 'text', id: 'heading', label: 'Heading', default: 'Your style.' },
    { type: 'text', id: 'highlight', label: 'Highlight', default: 'No limits.' },
    {
      type: 'textarea',
      id: 'description',
      label: 'Description',
      default: 'New pieces. New possibilities. Find the essentials that match your pace.',
    },
    { type: 'text', id: 'button', label: 'Button', default: 'Explore new arrivals' },
    { type: 'url', id: 'link', label: 'Main Link' },
    { type: 'image_picker', id: 'image', label: "Women's Photo" },
    { type: 'image_picker', id: 'men_image', label: "Men's Photo" },
    { type: 'url', id: 'women_link', label: "Women's Link" },
    { type: 'url', id: 'men_link', label: "Men's Link" },
  ],
  presets: [{ name: 'Fashion Hero' }],
}
