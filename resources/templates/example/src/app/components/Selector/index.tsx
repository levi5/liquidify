'use snippets'

import { SelectorGrid } from './Grid'

import styles from './styles.css'

type SelectorOption = {
	name: string
	values: string[]
}

export const Selector = ({ variation, options, mode }: { mode: 'grid' | 'slider' | 'select'; variation: string; options: SelectorOption[] }) => {
	const matches = variation.toUpperCase()

	// `.map` compiles to a `{% for %}`; `.find` would emit `where_exp`, which
	// Shopify rejects outside of a loop. Only the matching option renders.
	return (
		<>
			{options.map((option) => {
				// Two compiler constraints shape this:
				//  - `.find` emits `where_exp`, which Shopify rejects outside `{% for %}`;
				//  - `{% assign x = a == b %}` (assigning a comparison) is also rejected,
				//    so the comparison stays inline in the `if`.
				// The upcase is split out because a filter followed by `==` is invalid precedence.
				const optionName = option.name.toUpperCase()

				// Shopify's Liquid linter rejects regex literals in filter
				// arguments, so the id is built from the lowercased name only.
				const elementId = `selector-${option.name.toLowerCase()}`

				return (
					<>
						{optionName === matches && (
							<div className={styles.selector}>
								{mode === 'select' && (
									<label className={styles.selectorSelect}>
										<span>{option.name}</span>
										<select name={elementId} data-selected>
											{option.values.map((value) => (
												<option key={value} value={value}>
													{value}
												</option>
											))}
										</select>
									</label>
								)}

								{mode !== 'select' && (
									<SelectorGrid elementId={elementId} name={option.name} options={option.values}>
										<div className={styles.selectorSkeleton} aria-hidden='true'>
											<span className={styles.selectorSkeletonTitle}></span>
											<div className={styles.selectorSkeletonOptions}>
												{option.values.map((value) => (
													<span key={value}></span>
												))}
											</div>
										</div>
									</SelectorGrid>
								)}
							</div>
						)}
					</>
				)
			})}
		</>
	)
}
