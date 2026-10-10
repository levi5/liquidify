const COLLECTION_WRAPPER_ID = 'collection-result-wrapper'

export const FilterService = {
	buildSectionFetchUrl: (searchParams: URLSearchParams, sectionId: string): string => {
		const url = new URL(window.location.href)
		url.search = searchParams.toString()
		url.searchParams.set('section_id', sectionId)
		return url.toString()
	},

	extractHtmlFromResponse: (htmlResponse: string, sectionId: string): string => {
		const parsedDocument = new DOMParser().parseFromString(htmlResponse, 'text/html')
		const primaryWrapper = parsedDocument.querySelector(`#${COLLECTION_WRAPPER_ID}`)

		if (primaryWrapper) return primaryWrapper.innerHTML

		const sectionContainer = parsedDocument.querySelector(`#shopify-section-${sectionId}`) || parsedDocument.body
		const fallbackWrapper = sectionContainer.querySelector(`#${COLLECTION_WRAPPER_ID}`) || sectionContainer

		return fallbackWrapper.innerHTML
	},

	injectHtmlContent: (htmlContent: string): void => {
		const container = document.querySelector(`#${COLLECTION_WRAPPER_ID}`)
		if (!container) throw new Error('Target container not found in the DOM.')

		container.innerHTML = htmlContent
		window.dispatchEvent(new CustomEvent('liquidx:hydrate'))
	},

	updateBrowserHistory: (searchParams: URLSearchParams): void => {
		const queryString = searchParams.toString()
		const newPath = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`
		window.history.pushState({ path: newPath }, '', newPath)
	},

	syncCheckboxStates: (activeFilters: URLSearchParams): void => {
		const filterCheckboxes = document.querySelectorAll<HTMLInputElement>('input[data-filter-name]')

		filterCheckboxes.forEach((checkbox) => {
			const filterName = checkbox.getAttribute('data-filter-name')
			const filterValue = checkbox.getAttribute('data-filter-value')

			if (filterName && filterValue) {
				checkbox.checked = activeFilters.getAll(filterName).includes(filterValue)
			}
		})
	},
}
