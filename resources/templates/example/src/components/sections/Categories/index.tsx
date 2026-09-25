'use sections'

import classNames from 'classnames'
import styles from './styles.css'

export const Categories = () => {
  return (
    <section className={classNames(styles.categories, 'container', 'section-space')} id="categorias">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{"'categories.eyebrow' | t"}</p>
          <h2>{section.settings.heading ? 'section.settings.heading | escape' : "'categories.heading' | t"}</h2>
        </div>
        <span className={classNames('muted', styles['category-intro'])}>
          {"'categories.intro_1' | t"}
          <br />
          {"'categories.intro_2' | t"}
        </span>
      </div>
      <div className={classNames(styles['category-grid'])}>
        {section.blocks.map((block) => (
          <a
            className={classNames(styles['category-card'])}
            href="{{ block.settings.link | default: routes.all_products_collection_url }}"
            data-block-id={block.id}
          >
            {block.settings.image ? (
              <img
                src="{{ block.settings.image | image_url: width: 900 }}"
                alt="{{ block.settings.title | escape }}"
                width="900"
                height="1000"
                loading="lazy"
              />
            ) : (
              <img
                src="{{ block.settings.fallback | asset_url }}"
                alt="{{ block.settings.title | escape }}"
                width="900"
                height="1000"
                loading="lazy"
              />
            )}
            <span className={classNames(styles['category-label'])}>
              <span>
                <small>{'block.settings.subtitle | escape'}</small>
                <strong>{'block.settings.title | escape'}</strong>
              </span>
              <span className={classNames(styles['circle-arrow'])} aria-hidden="true">
                ↗
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
export const schema = {
  name: 't:sections.categories.name',
  settings: [
    {
      type: 'text',
      id: 'heading',
      label: 't:sections.categories.settings.heading.label',
      default: '',
    },
  ],
  max_blocks: 4,
  blocks: [
    {
      type: 'category',
      name: 't:sections.categories.blocks.category.name',
      settings: [
        {
          type: 'text',
          id: 'title',
          label: 't:sections.categories.blocks.category.settings.title.label',
          default: 'Women',
        },
        {
          type: 'text',
          id: 'subtitle',
          label: 't:sections.categories.blocks.category.settings.subtitle.label',
          default: 'NEW WAYS TO BE YOU',
        },
        {
          type: 'image_picker',
          id: 'image',
          label: 't:sections.categories.blocks.category.settings.image.label',
        },
        {
          type: 'url',
          id: 'link',
          label: 't:sections.categories.blocks.category.settings.link.label',
        },
        {
          type: 'select',
          id: 'fallback',
          label: 't:sections.categories.blocks.category.settings.fallback.label',
          default: 'liquidify-women.jpg',
          options: [
            {
              value: 'liquidify-women.jpg',
              label: 't:sections.categories.blocks.category.settings.fallback.options.women',
            },
            {
              value: 'liquidify-men.jpg',
              label: 't:sections.categories.blocks.category.settings.fallback.options.men',
            },
            {
              value: 'liquidify-accessories.jpg',
              label: 't:sections.categories.blocks.category.settings.fallback.options.accessories',
            },
          ],
        },
      ],
    },
  ],
  presets: [
    {
      name: 't:sections.categories.presets.default',
      blocks: [
        {
          type: 'category',
          settings: {
            title: 'Women',
            subtitle: 'NEW WAYS TO BE YOU',
            fallback: 'liquidify-women.jpg',
          },
        },
        {
          type: 'category',
          settings: {
            title: 'Men',
            subtitle: 'ESSENTIALS WITH PERSONALITY',
            fallback: 'liquidify-men.jpg',
          },
        },
        {
          type: 'category',
          settings: {
            title: 'Accessories',
            subtitle: 'DETAILS MAKE THE LOOK',
            fallback: 'liquidify-accessories.jpg',
          },
        },
      ],
    },
  ],
}
