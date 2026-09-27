'use snippets'

import { escape } from 'liquidify'

export const FilterRangeLayout = ({ filter }: { filter: any }) => {
	return (
		<details className='sidebar-filter-group' open>
			<summary>
				{escape(filter.label)} <span aria-hidden='true'>+</span>
			</summary>

			<div className='sidebar-price-fields'>
				<label>
					{"'filters.from' | t"}
					<input
						type='number'
						name={filter.min_value.param_name}
						min='0'
						step='0.01'
						value='{% if filter.min_value.value %}{{ filter.min_value.value | divided_by: 100.0 }}{% endif %}'
						placeholder='0'
					/>
				</label>
				<label>
					{"'filters.to' | t"}
					<input
						type='number'
						name={filter.max_value.param_name}
						min='0'
						step='0.01'
						value='{% if filter.max_value.value %}{{ filter.max_value.value | divided_by: 100.0 }}{% endif %}'
						placeholder='{{ filter.range_max | divided_by: 100.0 }}'
					/>
				</label>
			</div>
		</details>
	)
}
