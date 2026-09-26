'use react'

const ROWS = [0, 1, 2]

export const ResultSkeleton = () => {
	return (
		<ul className={'items'} aria-hidden='true'>
			{ROWS.map((row) => (
				<li key={row} className={'item item-loading'}>
					<span className={'skeleton-block skeleton-thumb'} />
					<span className={'skeleton-block skeleton-row-text'} />
				</li>
			))}
		</ul>
	)
}
