'use sections'

import classNames from 'classnames'
import styles from './styles.css'

export const BrandStory = () => {
  return (
    <section className={classNames(styles['brand-campaign'], 'container')} id="essencia">
      <div className={classNames(styles['campaign-copy'])}>
        <p className="eyebrow">{"'brand.eyebrow' | t"}</p>
        <h2>{section.settings.heading ? 'section.settings.heading | escape' : "'brand.heading' | t"}</h2>
        <p>
          {section.settings.description ? 'section.settings.description | escape' : "'brand.description' | t"}
        </p>
        <a
          className="button button-dark"
          href="{{ section.settings.link | default: routes.all_products_collection_url }}"
        >
          {"'brand.button' | t"} <span>↗</span>
        </a>
        <span className={classNames(styles['campaign-watermark'])} aria-hidden="true">
          LQ.
        </span>
      </div>
      <div className={classNames(styles['campaign-image'])}>
        {section.settings.image ? (
          <img
            src="{{ section.settings.image | image_url: width: 1400 }}"
            alt={section.settings.image.alt ? 'section.settings.image.alt | escape' : "'brand.editorial_alt' | t"}
            width="1100"
            height="950"
            loading="lazy"
          />
        ) : (
          <img
            src="{{ 'liquidify-editorial.jpg' | asset_url }}"
            alt={"'brand.card_alt' | t"}
            width="1100"
            height="950"
            loading="lazy"
          />
        )}
        <span>{"'brand.watermark' | t"}</span>
      </div>
    </section>
  )
}
export const schema = {
  name: 't:sections.brand_story.name',
  settings: [
    { type: 'text', id: 'heading', label: 't:sections.brand_story.settings.heading.label', default: '' },
    {
      type: 'textarea',
      id: 'description',
      label: 't:sections.brand_story.settings.description.label',
      default: '',
    },
    { type: 'image_picker', id: 'image', label: 't:sections.brand_story.settings.image.label' },
    { type: 'url', id: 'link', label: 't:sections.brand_story.settings.link.label' },
  ],
  presets: [{ name: 't:sections.brand_story.presets.default' }],
}
