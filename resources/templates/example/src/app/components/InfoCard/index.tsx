'use sections'

import { INFO_CARD_SCHEMA } from '../../../schemas/InfoCard/info-card.schema'

import styles from './styles.css'

export const InfoCard = () => {
	const blocks = section.blocks

	return (
		<section className={styles.infoCard}>
			{!blocks || blocks.length === 0 ? (
				<p className={styles.infoCardEmpty}>{"'featured.empty_title' | t"}</p>
			) : (
				blocks.map((block) => {
					const orientation = block.settings.layout === 'right' ? styles.infoCardWRight : styles.infoCardWLeft
					const hasImage = block.settings.image
					const variant = hasImage ? '' : styles.infoCardNoImage

					return (
						<div style={{ backgroundColor: block.settings.background_color }} className={`${styles.infoCardWrapper} ${orientation} ${variant}`}>
							{block.settings.image ? (
								<div className={styles.infoCardImage}>
									<img
										width='768'
										height='768'
										src={'{{ block.settings.image | image_url: width: 768 }}'}
										srcSet="{{ block.settings.image | image_url: width: 375 }} 375w, {{ block.settings.image | image_url: width: 768 }} 768w"
										sizes='(max-width: 740px) 100vw, 50vw'
										alt={'{{ block.settings.title | escape }}'}
										loading='lazy'
										decoding='async'
									/>
								</div>
							) : (
								<div className={styles.infoCardImage}>
									<img
										width='768'
										height='768'
										src={"{{ 'liquidify-women.jpg' | asset_url }}"}
										alt={'{{ block.settings.title | escape }}'}
										loading='lazy'
										decoding='async'
									/>
								</div>
							)}

							<aside className={styles.infoCardText}>
								<h2 className={styles.infoCardTitle}>{block.settings.title}</h2>
								{block.settings.description && <p className={styles.infoCardDescription}>{block.settings.description}</p>}

								{block.settings.button_label && (
									<a href={'{{ block.settings.button_link }}'} className={styles.infoCardButton}>
										{block.settings.button_label}
									</a>
								)}
							</aside>
						</div>
					)
				})
			)}
		</section>
	)
}

export default (InfoCard.schema = INFO_CARD_SCHEMA)
