export const COLLECTION_SHELF_SCHEMA = {
	name: 'Prateleira',
	settings: [
		{
			type: 'text',
			id: 'eyebrow',
			label: 'Subtítulo (Eyebrow)',
		},
		{
			type: 'text',
			id: 'title',
			label: 'Título da prateleira',
			default: 'Produtos em destaque',
		},
		{
			type: 'text',
			id: 'subtitle',
			label: 'Subtítulo',
		},
		{
			type: 'text',
			id: 'view_all_label',
			label: 'Texto do link',
		},
		{
			type: 'url',
			id: 'view_all_link',
			label: 'Link do botão',
		},
		{
			type: 'collection',
			id: 'collection',
			label: 'Escolher coleção',
		},
		{
			type: 'range',
			id: 'limite',
			label: 'Quantidade de produtos',
			min: 2,
			max: 12,
			step: 1,
			default: 4,
		},
	],
	presets: [
		{
			name: 'Prateleira',
		},
	],
}
