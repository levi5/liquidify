'use sections'

import { t, escape, imageUrl, assetUrl, defaultValue } from 'liquidify'

import classNames from 'classnames'

import { HOME_INFO_BANNER_SCHEMA } from '../../../../schemas/Home/info-banner.schema'

import styles from './styles.css'

export const InfoBanner = () => {
	return (
		<div className={classNames(styles['brand-campaign'], 'container')}>
			<div className={classNames(styles['campaign-copy'])}>
			<p className='eyebrow'>{section.settings.eyebrow ? escape(section.settings.eyebrow) : t('brand.eyebrow')}</p>

			<h2>{section.settings.heading ? escape(section.settings.heading) : t('brand.heading')}</h2>

			<p>{section.settings.description ? escape(section.settings.description) : t('brand.description')}</p>

			<a className='button button-dark' href={defaultValue(section.settings.link, routes.all_products_collection_url)}>
				{section.settings.button ? escape(section.settings.button) : t('brand.button')}
				<span aria-hidden='true'>↗</span>
			</a>

				<span className={classNames(styles['campaign-watermark'])} aria-hidden='true'>
					{section.settings.mark || 'LQ.'}
				</span>
			</div>

			<div className={classNames(styles['campaign-image'])}>
			{section.settings.image ? (
				<img
					src={imageUrl(section.settings.image, {width: 1600})}
					alt={section.settings.image.alt ? escape(section.settings.image.alt) : t('brand.editorial_alt')}
					width='925'
					height='617'
					loading='lazy'
				/>
			) : (
				<img
					src={assetUrl('liquidify-editorial.jpg')}
					alt={t('brand.editorial_alt')}
					width='925'
					height='617'
					loading='lazy'
				/>
			)}

				<span>{section.settings.caption || "'brand.watermark' | t"}</span>
			</div>
		</div>
	)
}

export default (InfoBanner.schema = HOME_INFO_BANNER_SCHEMA)
