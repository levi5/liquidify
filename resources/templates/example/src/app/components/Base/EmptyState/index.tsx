'use snippets'

import { RenderSnippet } from 'liquidex'

import { PrimaryButton } from '../../Button/Primary'

export const BaseEmptyState = ({ heading, text = '', actionLabel = '', actionLink = '' }: { heading: string; text?: string; actionLabel?: string; actionLink?: string }) => {
	return (
		<div className='empty-state'>
			<span className='empty-spark' aria-hidden='true'>
				✳
			</span>
			<h2>{heading}</h2>
			{text && text !== 'blank' && <p>{text}</p>}
			{actionLabel && actionLabel !== 'blank' && <RenderSnippet slot={PrimaryButton} text={actionLabel} as='a' link={actionLink || routes.all_products_collection_url} />}
		</div>
	)
}
