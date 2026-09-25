'use sections'

import { FormBlock } from 'liquidex'
import classNames from 'classnames'

import { NEWSLETTER_SCHEMA } from '../../../schemas/Newsletter/newsletter.schema'

import styles from './styles.css'

export const Newsletter = () => {
	return (
		<div className={classNames(styles.newsletter)} style={{ background: section.settings.background }}>
			<div className={classNames(styles['newsletter-inner'], 'container')}>
				<div>
					<p className='eyebrow'>{section.settings.eyebrow}</p>
					<h2>
						{section.settings.title_1}
						<br />
						{section.settings.title_2}
					</h2>
				</div>

				<div className={classNames(styles['newsletter-form'])}>
					<FormBlock name='customer' id='FooterNewsletter'>
						<input type='hidden' name='contact[tags]' value='newsletter' />

						<label htmlFor='NewsletterEmail'>{section.settings.label}</label>

						<div className={classNames(styles['email-field'])}>
							<input id='NewsletterEmail' type='email' name='contact[email]' placeholder='email@example.com' autoComplete='email' required />
							<button type='submit' aria-label={"'footer.subscribe' | t"}>
								↗
							</button>
						</div>

						{form['posted_successfully?'] && <p role='status'>{"'footer.subscribed' | t"}</p>}
						{form.errors && <div role='alert'>{'form.errors | default_errors'}</div>}

						<p className={classNames(styles['newsletter-note'])}>{section.settings.note}</p>
					</FormBlock>
				</div>
			</div>
		</div>
	)
}

export default (Newsletter.schema = NEWSLETTER_SCHEMA)
