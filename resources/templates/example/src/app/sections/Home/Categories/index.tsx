'use sections'

import { t, escape, imageUrl, assetUrl, defaultValue } from 'liquidify'

import classNames from 'classnames'

import { HOME_CATEGORIES_SCHEMA } from '../../../../schemas/Home/categories.schema'

import styles from './styles.css'

export const HomeCategories = () => {
	const cards = section.blocks

	return (
		<div className={classNames(styles.categories, 'container')}>
			<div className={classNames(styles['section-heading'])}>
				<div>
				<p className='eyebrow'>
					{section.settings.eyebrow ? escape(section.settings.eyebrow) : t('categories.eyebrow')}
				</p>
				<h2>{section.settings.heading ? escape(section.settings.heading) : t('categories.heading')}</h2>
			</div>

			<p className={classNames(styles['category-intro'])}>
				{section.settings.intro_1 ? escape(section.settings.intro_1) : t('categories.intro_1')}
				<br />
				{section.settings.intro_2 ? escape(section.settings.intro_2) : t('categories.intro_2')}
			</p>
			</div>

			<div className={classNames(styles['category-grid'])}>
				{cards?.map((block) => (
					<a className={classNames(styles['category-card'])} href={defaultValue(block.settings.url, routes.all_products_collection_url)} key={block.id}>
						{block.settings.image ? (
							<img
								src={imageUrl(block.settings.image, {width: 1200})}
								alt={block.settings.image.alt ? escape(block.settings.image.alt) : escape(block.settings.title)}
								loading='lazy'
							/>
						) : block.settings.image_asset ? (
							<img
								src={assetUrl(block.settings.image_asset)}
								alt={block.settings.title ? escape(block.settings.title) : t('categories.heading')}
								loading='lazy'
							/>
						) : (
							<img src={assetUrl('liquidify-women.jpg')} alt={t('categories.heading')} loading='lazy' />
						)}

						<span className={classNames(styles['category-label'])}>
							<span>
								{block.settings.label && <small>{block.settings.label}</small>}
								<strong>{block.settings.title || "'categories.heading' | t"}</strong>
							</span>

							<span className={classNames(styles['circle-arrow'])} aria-hidden='true'>
								↗
							</span>
						</span>
					</a>
				))}
			</div>
		</div>
	)
}

export default (HomeCategories.schema = HOME_CATEGORIES_SCHEMA)
