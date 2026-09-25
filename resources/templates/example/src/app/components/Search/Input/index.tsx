'use snippets'

import { SearchResult } from '../Result'

import styles from './styles.css'

export const SearchInput = ({ id = 'default' }: { id?: string }) => {
	const inputId = `search-input-${id}`
	const resultId = `search-result-${id}`
	const listId = `predictive-search-results-${id}`

	return (
		<div className={styles.searchInput}>
			<form action='{{ routes.search_url }}' method='get' role='search' className='predictive-search-form'>
				<input
					id={inputId}
					type='search'
					name='q'
					role='combobox'
					aria-expanded='false'
					aria-controls={listId}
					aria-haspopup='listbox'
					aria-autocomplete='list'
					autocomplete='off'
					placeholder='Procurar'
				/>
			</form>

			<SearchResult id={inputId} elementId={resultId} listId={listId} />
		</div>
	)
}
