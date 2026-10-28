'use sections'

import { t } from 'liquidify'
import { RenderSnippet, RenderSvg } from 'liquidex'

import { Carousel } from '../../../../components/Carousel'

import { BANNER_HERO_SCHEMA } from '../../../../../schemas/Banner/hero.schema'

import styles from '../../styles.css'

export const BannerHero = () => {
	const uid = section.id

	return (
		<div className={styles.homeBannerHero}>
			<RenderSnippet slot={Carousel} blocks={section.blocks} elementId={`banner-hero-${uid}`} />

			<div className={styles.benefitsWrapper} data-benefits-carousel>
				<button type='button' className={`${styles.nav} ${styles.prev}`} data-benefits-prev>
					<RenderSvg name='left-arrow.svg' />
				</button>

				<div className={styles.benefits} data-benefits-track>
					<div className={styles.benefit}>
						<RenderSvg name='premium.svg' />
						<p>
							<span>{t('values.warranty_title')}</span> {t('values.warranty_text')}
						</p>
					</div>
					<div className={styles.benefit}>
						<RenderSvg name='credit-card.svg' />
						<p>
							<span>{t('values.installments_title')}</span> {t('values.installments_text')}
						</p>
					</div>
					<div className={styles.benefit}>
						<RenderSvg name='delivery.svg' />
						<p>
							<span>{t('values.delivery_title')}</span> {t('values.delivery_text')}
						</p>
					</div>
				</div>

				<button type='button' className={`${styles.nav} ${styles.next}`} data-benefits-next>
					<RenderSvg name='right-arrow.svg' />
				</button>
			</div>
		</div>
	)
}

export default (BannerHero.schema = BANNER_HERO_SCHEMA)
