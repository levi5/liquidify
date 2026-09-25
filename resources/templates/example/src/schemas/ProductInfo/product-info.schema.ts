import { BOX_FRAGMENT_SCHEMA } from '../Box/box.schema'

export const PRODUCT_INFO_SCHEMA = {
	name: 't:sections.product_info.name',
	settings: [
		{
			type: 'checkbox',
			id: 'with_thumbnail',
			label: 't:sections.product_info.settings.with_thumbnail.label',
			default: true,
		},
	],
	blocks: [
		{
			type: 'variation',
			name: 't:sections.product_info.blocks.variation.name',
			settings: [
				{
					type: 'text',
					id: 'variation',
					label: 't:sections.product_info.blocks.variation.settings.variation.label',
					info: 't:sections.product_info.blocks.variation.settings.variation.info',
				},
				{
					type: 'select',
					id: 'mode',
					label: 't:sections.product_info.blocks.variation.settings.mode.label',
					default: 'slider',
					options: [
						{ value: 'grid', label: 't:sections.product_info.blocks.variation.settings.mode.options.grid.label' },
						{ value: 'slider', label: 't:sections.product_info.blocks.variation.settings.mode.options.slider.label' },
						{ value: 'select', label: 't:sections.product_info.blocks.variation.settings.mode.options.select.label' },
					],
				},
			],
		},
		{
			type: 'benefits',
			name: 't:sections.product_info.blocks.benefits.name',
			settings: BOX_FRAGMENT_SCHEMA,
		},
	],
	max_blocks: 5,
}
