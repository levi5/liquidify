'use snippets'

import { SelectorGrid } from './Grid'

import styles from './styles.css'

type SelectorOption = {
	name: string
	values: string[]
}

export const Selector = ({ variation, options, mode }: { mode: 'grid' | 'slider' | 'select'; variation: string; options: SelectorOption[] }) => {
	const matches = variation.toUpperCase()

	return (
		<>
			{options.map((option) => {
				const optionName = option.name.toUpperCase()
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
