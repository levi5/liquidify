'use react'

import classNames from 'classnames'
import type { ReactNode } from 'preact/compat'
import { useEffect, useRef } from 'preact/hooks'

import { useProduct } from '../../../context/Product'
import styles from '../styles.css'

export const SelectorGrid = ({ name, options }: { name: string; elementId: string; options: string[]; children?: ReactNode }) => {
	const rootRef = useRef<HTMLDivElement>(null)
	const { getOptionState, selectOption, selectedOptions } = useProduct()

	useEffect(() => {
		rootRef.current?.dispatchEvent(new CustomEvent('product:option-register', { bubbles: true, detail: { name } }))
	}, [name])

	return (
		<div ref={rootRef} className={'selectorGrid'}>
			<span className={'selectorTitle'}>
				{name}: <strong>{selectedOptions[name]}</strong>
			</span>
			<ul className={'options'}>
				{options.map((option) => {
					const state = getOptionState(name, option)

					return (
						<li
							key={option}
							className={classNames({
								['selected']: state.selected,
								['disabled']: !state.available,
							})}
						>
							<button type='button' disabled={!state.available} onClick={() => selectOption(name, option)}>
								{option}
							</button>
						</li>
					)
				})}
			</ul>
		</div>
	)
}
