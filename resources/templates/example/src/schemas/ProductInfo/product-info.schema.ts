import { BOX_FRAGMENT_SCHEMA } from '../Box/box.schema'

export const PRODUCT_INFO_SCHEMA = {
	name: 'Product Info',
	settings: [
		{
			type: 'checkbox',
			id: 'with_thumbnail',
			label: 'Mostrar thumbnail',
			default: true,
		},
	],
	blocks: [
		{
			type: 'variation',
			name: 'Variação',
			settings: [
				{
					type: 'text',
					id: 'variation',
					label: 'Nome da variação',
					info: 'Ex: Cor, Tamanho, Material',
				},
				{
					type: 'select',
					id: 'mode',
					label: 'Modo do seletor',
					default: 'slider',
				options: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'slider', label: 'Slider' },
					{ value: 'select', label: 'Dropdown' },
				],
				},
			],
		},
		{
			type: 'benefits',
			name: 'Benefício',
			settings: BOX_FRAGMENT_SCHEMA,
		},
	],
	max_blocks: 5,
}
