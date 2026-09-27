'use snippets'

import classNames from 'classnames'

export const BaseSection = ({
	children,
	className = '',
	id,
	contained = true,
	spaced = true,
}: {
	children?: any
	className?: string
	id?: string
	contained?: boolean
	spaced?: boolean
}) => {

	const containerClass = contained ? 'container' : ''
	const spaceClass = spaced ? 'section-space' : ''

	return (
		<section id={id} data-section-id={id} className={classNames('base-section', containerClass, spaceClass, className)}>
			{children}
		</section>
	)
}
