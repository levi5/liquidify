'use snippets'

import { escape } from 'liquidify'

export const FilterListLayout = ({ filter }: { filter: any }) => {
	return (
		<details className='sidebar-filter-group' open>
			<summary>
				{escape(filter.label)} <span aria-hidden='true'>+</span>
			</summary>

			<div className='sidebar-filter-values'>
				{filter.values.map((value: any) => (
					<label className='sidebar-option'>
						<input type='checkbox' name={value.param_name} value={value.value} checked={value.active === true} />
						<span>
							{escape(value.label)} <small>({value.count})</small>
						</span>
					</label>
				))}
			</div>
		</details>
	)
}
