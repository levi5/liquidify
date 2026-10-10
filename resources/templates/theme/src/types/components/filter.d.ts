export type CollectionFilterProps = {
	blocks: {
		settings: {
			label: string
			option_name: string
			layout: string
			source: string
			price_layout?: string
			collapsed: boolean
		}
	}[]
}
