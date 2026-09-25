'use sections'

import classNames from 'classnames'

import { HOME_INFO_BANNER_SCHEMA } from '../../../../schemas/Home/info-banner.schema'

import styles from './styles.css'

export const InfoBanner = () => {
	return (
		<div className={classNames(styles['brand-campaign'], 'container')}>
			<div className={classNames(styles['campaign-copy'])}>
				<p className='eyebrow'>{section.settings.eyebrow ? 'section.settings.eyebrow | escape' : "'brand.eyebrow' | t"}</p>

				<h2>{section.settings.heading ? 'section.settings.heading | escape' : "'brand.heading' | t"}</h2>

				<p>{section.settings.description ? 'section.settings.description | escape' : "'brand.description' | t"}</p>

				<a className='button button-dark' href={"{{ section.settings.link | default: routes.all_products_collection_url }}"}>
					{section.settings.button ? 'section.settings.button | escape' : "'brand.button' | t"}
					<span aria-hidden='true'>↗</span>
				</a>

				<span className={classNames(styles['campaign-watermark'])} aria-hidden='true'>
					{section.settings.mark || 'LQ.'}
				</span>
			</div>

			<div className={classNames(styles['campaign-image'])}>
				{section.settings.image ? (
					<img
						src={'{{ section.settings.image | image_url: width: 1600 }}'}
						alt={section.settings.image.alt ? 'section.settings.image.alt | escape' : "'brand.editorial_alt' | t"}
						loading='lazy'
					/>
				) : (
					<img src={"{{ 'liquidify-editorial.jpg' | asset_url }}"} alt={"'brand.editorial_alt' | t"} loading='lazy' />
				)}

				<span>{section.settings.caption || "'brand.watermark' | t"}</span>
			</div>
		</div>
	)
}

export default (InfoBanner.schema = HOME_INFO_BANNER_SCHEMA)
