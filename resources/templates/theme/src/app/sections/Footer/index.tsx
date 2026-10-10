'use sections'

import { t, escape, defaultValue } from 'liquidify'

import { FOOTER_LAYOUT_SCHEMA } from '../../../schemas/Footer/footer.schema'
import classNames from 'classnames'

import styles from './styles.css'

export const Footer = () => {
	return (
		<footer className={classNames(styles['site-footer'])}>
			<div className={classNames(styles['footer-main'], 'container')}>
				<div className={classNames(styles['footer-brand'])}>
				<a className='wordmark' href={routes.root_url}>
					{escape(defaultValue(settings.brand_name, shop.name))}
				</a>
				<p>
					{t('footer.tagline_1')}
					<br />
					{t('footer.tagline_2')}
				</p>
				</div>

			<div>
				<h3>{t('footer.explore')}</h3>
				<a href={routes.all_products_collection_url}>{t('footer.all_products')}</a>
				<a href={routes.collections_url}>{t('footer.our_collections')}</a>
				<a href={`${routes.root_url}#essencia`}>{t('footer.our_essence')}</a>
			</div>

			<div>
				<h3>{t('footer.help_title')}</h3>
				<a href={routes.account_url}>{t('footer.my_account')}</a>
				<a href={routes.cart_url}>{t('footer.my_bag')}</a>
				<a href={`mailto:${escape(shop.email)}`}>{t('footer.contact_us')}</a>
			</div>

			<div>
				<h3>{t('footer.info_title')}</h3>
					{linklists['footer'].links.map((link) => (
						<a href={link.url}>{link.title}</a>
					))}
					{shop.policies?.map((policy) => (
						<a key={policy.url} href={policy.url}>
							{policy.title}
						</a>
					))}
				</div>
			</div>

			<div className={classNames(styles['footer-bottom'], 'container')}>
			<span>
				©&nbsp;{'"now" | date: "%Y"'}&nbsp;{escape(defaultValue(settings.brand_name, shop.name))}.{t('footer.copyright')}
			</span>
			<span>
				{t('brand.eyebrow')} <span aria-hidden='true'>↗</span>
			</span>
			<span>{t('footer.secure_payment')}</span>
			</div>
		</footer>
	)
}

export default (Footer.schema = FOOTER_LAYOUT_SCHEMA)
