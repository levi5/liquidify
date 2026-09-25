export const COLLECTION_SCHEMA = {
	name: 't:sections.collection.name',
	settings: [],
	blocks: [
		{
			type: 'filter_item',
			name: 't:sections.collection.blocks.filter_item.name',
			settings: [
				{
					type: 'text',
					id: 'title',
					label: 't:sections.collection.blocks.filter_item.settings.title.label',
					default: 'Filtro',
				},
			],
		},
	],
}
