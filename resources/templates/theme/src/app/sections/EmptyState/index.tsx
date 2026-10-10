'use sections'

import { RenderSnippet } from 'liquidex'
import classNames from 'classnames'

import { BaseSection } from '../../components/Base/Section'
import { BaseEmptyState } from '../../components/Base/EmptyState'

import { EMPTY_STATE_SCHEMA } from '../../../schemas/EmptyState/empty-state.schema'

export const EmptyState = () => {
	return (
		<RenderSnippet slot={BaseSection} className={classNames('container', 'section-space')}>
			<RenderSnippet
				slot={BaseEmptyState}
				heading={section.settings.heading}
				text={section.settings.text}
				actionLabel={section.settings.action_label}
				actionLink={section.settings.action_link}
			/>
		</RenderSnippet>
	)
}

export default (EmptyState.schema = EMPTY_STATE_SCHEMA)
