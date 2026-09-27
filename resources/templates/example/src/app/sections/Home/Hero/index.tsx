'use sections'

import { t, escape, imageUrl, assetUrl, defaultValue } from 'liquidify'
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
          {section.settings.heading ? escape(section.settings.heading) : t('hero.heading')}
          <br />
          <span>{section.settings.highlight ? escape(section.settings.highlight) : t('hero.highlight')}</span>
        </h1>
        <p className={classNames(styles['hero-description'])}>
          {section.settings.description ? escape(section.settings.description) : t('hero.description')}
        </p>
        <a
          className="button button-dark"
          href={defaultValue(section.settings.link, routes.all_products_collection_url)}
        >
          {section.settings.button ? escape(section.settings.button) : t('hero.button')}
          <span aria-hidden="true">↗</span>
        </a>
        <div className={classNames(styles['hero-bottom-note'])}>
          <span>{"'hero.drop_label' | t"}</span>
          <span>{t('hero.express')}</span>
        </div>
      </div>
      <a
        className={classNames(styles['fashion-hero-photo'], styles['hero-women'])}
        href={defaultValue(section.settings.women_link, '/collections/all/women')}
      >
        {section.settings.image ? (
          <img
            src={imageUrl(section.settings.image, {width: 1200})}
            alt={section.settings.image.alt ? escape(section.settings.image.alt) : t('hero.women_alt')}
            width="900"
            height="1200"
            fetchPriority="high"
          />
        ) : (
          <img
            src={assetUrl('liquidify-women.jpg')}
            alt={t('hero.women_alt')}
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
        href={defaultValue(section.settings.men_link, '/collections/all/men')}
      >
        {section.settings.men_image ? (
          <img
            src={imageUrl(section.settings.men_image, {width: 1000})}
            alt={section.settings.men_image.alt ? escape(section.settings.men_image.alt) : t('hero.men_alt')}
            width="900"
            height="1200"
            fetchPriority="high"
          />
        ) : (
          <img
            src={assetUrl('liquidify-men.jpg')}
            alt={t('hero.men_alt')}
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
				<p className='visually-hidden'>{t('values.strip_label')}</p>

				<div className='value-item'>
					<RenderSvg name='delivery.svg' />
					<div>
						<h3>{t('values.shipping_title')}</h3>
						<p>{t('values.shipping_text')}</p>
					</div>
				</div>

				<div className='value-item'>
					<RenderSvg name='shield-icon.svg' />
					<div>
						<h3>{t('values.secure_title')}</h3>
						<p>{t('values.secure_text')}</p>
					</div>
				</div>

				<div className='value-item'>
					<RenderSvg name='return-icon.svg' />
					<div>
						<h3>{t('values.support_title')}</h3>
						<p>{t('values.support_text')}</p>
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
    {
      type: 'textarea',
      id: 'description',
      label: 't:sections.hero.settings.description.label',
    },
    { type: 'text', id: 'button', label: 't:sections.hero.settings.button.label', default: 'Explorar' },
    { type: 'url', id: 'link', label: 't:sections.hero.settings.link.label' },
    { type: 'image_picker', id: 'image', label: 't:sections.hero.settings.image.label' },
    { type: 'image_picker', id: 'men_image', label: 't:sections.hero.settings.men_image.label' },
    { type: 'url', id: 'women_link', label: 't:sections.hero.settings.women_link.label' },
    { type: 'url', id: 'men_link', label: 't:sections.hero.settings.men_link.label' },
  ],
  presets: [{ name: 't:sections.hero.presets.default' }],
}
