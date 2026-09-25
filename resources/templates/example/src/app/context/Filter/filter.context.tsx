'use react'
import { _try } from 'funcio/lib/Monads/Either'
import { createContext } from 'preact'
import type { ReactNode } from 'preact/compat'
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks'

import { FilterService } from './filter.service'

interface FilterContextType {
	activeFilters: URLSearchParams
	isLoading: boolean
	toggleFilter: (filterName: string, filterValue: string) => Promise<void>
	clearAll: () => Promise<void>
}

const FilterContext = createContext<FilterContextType | null>(null)

export const FilterProvider = ({ children, sectionId: propSectionId }: { children: ReactNode; elementId: string; sectionId?: string }) => {
	const [activeFilters, setActiveFilters] = useState(new URLSearchParams(window.location.search))
	const [isLoading, setIsLoading] = useState(false)

	const sectionId = useMemo(() => propSectionId || 'collection-result', [propSectionId])

	const applyFilters = useCallback(
		async (newFilters: URLSearchParams) => {
			setIsLoading(true)

			FilterService.updateBrowserHistory(newFilters)
			setActiveFilters(new URLSearchParams(newFilters.toString()))

			const fetchResult = await _try.async(async () => {
				const fetchUrl = FilterService.buildSectionFetchUrl(newFilters, sectionId)
				const response = await fetch(fetchUrl)

				if (!response.ok) throw new Error('Failed to fetch updated products')

				return response.text()
			})

			fetchResult.match({
				right: (htmlResponse) =>
					_try.sync(() => {
						const extractedHtml = FilterService.extractHtmlFromResponse(htmlResponse, sectionId)
						FilterService.injectHtmlContent(extractedHtml)
					}),
				left: (error) => console.error('[FilterProvider] Request failed:', error),
			})

			setIsLoading(false)
		},
		[sectionId],
	)

	const toggleFilter = useCallback(
		async (filterName: string, filterValue: string) => {
			const updatedFilters = new URLSearchParams(activeFilters.toString())
			const currentValuesForFilter = updatedFilters.getAll(filterName)

			if (currentValuesForFilter.includes(filterValue)) {
				const remainingValues = currentValuesForFilter.filter((value) => value !== filterValue)
				updatedFilters.delete(filterName)
				remainingValues.forEach((value) => {
					updatedFilters.append(filterName, value)
					void null
				})
			} else {
				updatedFilters.append(filterName, filterValue)
			}

			await applyFilters(updatedFilters)
		},
		[activeFilters, applyFilters],
	)

	const replaceFilters = useCallback(
		async (updates: Record<string, string | null | undefined>) => {
			const updatedFilters = new URLSearchParams(activeFilters.toString())

			Object.entries(updates || {}).forEach(([name, value]) => {
				updatedFilters.delete(name)
				if (value !== null && value !== undefined && String(value).trim() !== '') {
					updatedFilters.set(name, String(value))
				}
			})

			await applyFilters(updatedFilters)
		},
		[activeFilters, applyFilters],
	)

	const clearAllFilters = useCallback(async () => {
		await applyFilters(new URLSearchParams())
	}, [applyFilters])

	useEffect(() => {
		const handleToggleEvent = (event: any) => toggleFilter(event.detail.name, event.detail.value)
		const handleReplaceEvent = (event: any) => replaceFilters(event.detail)
		const handleClearEvent = () => clearAllFilters()

		window.addEventListener('filter:toggle', handleToggleEvent)
		window.addEventListener('filter:replace', handleReplaceEvent)
		window.addEventListener('filter:clear-all', handleClearEvent)

		return () => {
			window.removeEventListener('filter:toggle', handleToggleEvent)
			window.removeEventListener('filter:replace', handleReplaceEvent)
			window.removeEventListener('filter:clear-all', handleClearEvent)
		}
	}, [toggleFilter, replaceFilters, clearAllFilters])

	useEffect(() => {
		FilterService.syncCheckboxStates(activeFilters)
	}, [activeFilters])

	const contextValue = useMemo(
		() => ({
			activeFilters,
			isLoading,
			toggleFilter,
			clearAll: clearAllFilters,
		}),
		[activeFilters, isLoading, toggleFilter, clearAllFilters],
	)

	return (
		<FilterContext.Provider value={contextValue}>
			<div className={isLoading ? 'filter-loading' : ''} style={{ width: "100%", opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
				{children}
			</div>
		</FilterContext.Provider>
	)
}

export const useFilter = () => {
	const context = useContext(FilterContext)
	if (!context) throw new Error('useFilter must be used within a FilterProvider')
	return context
}
