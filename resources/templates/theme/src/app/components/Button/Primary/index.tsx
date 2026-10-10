'use snippets'

import styles from '../styles.css'

export const PrimaryButton = ({
	className = '',
	text,
	as = 'button',
	link,
	addToCart = false,
	disabled = false,
}: {
	link?: string
	as: 'button' | 'a'
	text: string
	className?: string
	addToCart?: boolean
	disabled?: boolean
}) => {
	const classes = `${styles.primaryButton} ${className}`

	if (as === 'a') {
		return (
			<a href={link} className={classes}>
				{text}
			</a>
		)
	}

	if (disabled) {
		return (
			<button type='button' disabled className={classes}>
				{text}
			</button>
		)
	}

	if (addToCart) {
		return (
			<button type='button' data-product-add-to-cart='true' className={classes}>
				{text}
			</button>
		)
	}

	return (
		<button type='button' className={classes}>
			{text}
		</button>
	)
}
