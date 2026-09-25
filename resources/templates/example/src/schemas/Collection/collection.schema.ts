export const COLLECTION_SCHEMA = {
	name: 'Coleção',
	settings: [],
	blocks: [
		{
			type: 'filter_item',
			name: 'Filtro',
			settings: [
				{
					type: 'text',
					id: 'title',
					label: 'Título',
					default: 'Filtro',
				},
			],
		},
	],
}
