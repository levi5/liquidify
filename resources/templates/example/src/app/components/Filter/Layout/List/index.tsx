'use snippets'

export const FilterListLayout = ({ filter }: { filter: any }) => {
	return (
		<details className='sidebar-filter-group' open>
			<summary>
				{'filter.label | escape'} <span aria-hidden='true'>+</span>
			</summary>

			<div className='sidebar-filter-values'>
				{filter.values.map((value: any) => (
					<label className='sidebar-option'>
						<input type='checkbox' name={value.param_name} value={value.value} checked={value.active === true} />
						<span>
							{'value.label | escape'} <small>({value.count})</small>
						</span>
					</label>
				))}
			</div>
		</details>
	)
}
