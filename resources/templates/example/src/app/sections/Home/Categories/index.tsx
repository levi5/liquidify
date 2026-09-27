'use sections'

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
						{section.settings.eyebrow ? 'section.settings.eyebrow | escape' : "'categories.eyebrow' | t"}
					</p>
					<h2>{section.settings.heading ? 'section.settings.heading | escape' : "'categories.heading' | t"}</h2>
				</div>

				<p className={classNames(styles['category-intro'])}>
					{section.settings.intro_1 ? 'section.settings.intro_1 | escape' : "'categories.intro_1' | t"}
					<br />
					{section.settings.intro_2 ? 'section.settings.intro_2 | escape' : "'categories.intro_2' | t"}
				</p>
			</div>

			<div className={classNames(styles['category-grid'])}>
				{cards?.map((block) => (
					<a className={classNames(styles['category-card'])} href='{{ block.settings.url | default: routes.all_products_collection_url }}' key={block.id}>
						{block.settings.image ? (
							<img
								src={'{{ block.settings.image | image_url: width: 1200 }}'}
								alt={block.settings.image.alt ? 'block.settings.image.alt | escape' : 'block.settings.title | escape'}
								loading='lazy'
							/>
						) : block.settings.image_asset ? (
							<img
								src={'{{ block.settings.image_asset | asset_url }}'}
								alt={block.settings.title ? 'block.settings.title | escape' : "'categories.heading' | t"}
								loading='lazy'
							/>
						) : (
							<img src={"{{ 'liquidify-women.jpg' | asset_url }}"} alt={"'categories.heading' | t"} loading='lazy' />
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
