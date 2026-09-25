'use sections'

import classNames from 'classnames'
import styles from './styles.css'

export const Hero = () => {
  return (
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
  )
}
export const schema = {
  name: 't:sections.hero.name',
  settings: [
    { type: 'text', id: 'heading', label: 't:sections.hero.settings.heading.label', default: '' },
    { type: 'text', id: 'highlight', label: 't:sections.hero.settings.highlight.label', default: '' },
    {
      type: 'textarea',
      id: 'description',
      label: 't:sections.hero.settings.description.label',
      default: '',
    },
    { type: 'text', id: 'button', label: 't:sections.hero.settings.button.label', default: '' },
    { type: 'url', id: 'link', label: 't:sections.hero.settings.link.label' },
    { type: 'image_picker', id: 'image', label: 't:sections.hero.settings.image.label' },
    { type: 'image_picker', id: 'men_image', label: 't:sections.hero.settings.men_image.label' },
    { type: 'url', id: 'women_link', label: 't:sections.hero.settings.women_link.label' },
    { type: 'url', id: 'men_link', label: 't:sections.hero.settings.men_link.label' },
  ],
  presets: [{ name: 't:sections.hero.presets.default' }],
}
